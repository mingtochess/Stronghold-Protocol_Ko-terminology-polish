import { withLaboratoryDummy, LAB_DUMMY_ENEMY } from '../../shared/laboratoryDummy.js';
import { net, NetError } from './net.js';
import { store, emptyMatch } from './store.js';
import { data } from './data.js';
import { GAME_FILES } from './ui/gameComponents.js';
import { loadoutStore } from './ui/loadoutSync.js';
import { customExtensionCatalog, normalizeCustomExtensions, applyCustomExtensions } from '../../shared/customExtensions.js';
import { attachAttackTimings } from '../../shared/attackTiming.js';
import { validateC2S } from '../../shared/protocol.js';
import { versionById, versionSlug } from '../../shared/versions.js';
import { seasonExtensionSelection, applySeasonExtensions } from '../../shared/seasonExtensions.js';
import { lobbyVersion } from './versions.js';

/** 규정(规程): the lobby's season, when it is one — the laboratory then runs that season's data, match and engine. */
function regulationVersion() {
  const id = lobbyVersion(store.get());
  const entry = versionById(id);
  return entry?.family === 'regulation' ? entry : null;
}
/** A 규정 season's data files, straight from /data/versions/<slug>/ (the art manifest stays the page's own). */
async function regulationData(entry) {
  const base = `/data/versions/${versionSlug(entry)}/`;
  const names = ['config', 'chess', 'bonds', 'items', 'bands', 'enemies', 'bosses', 'stages', 'tokens', 'garrisons', 'effects', 'choices', 'factions', 'waves', 'backups', 'tuning'];
  const out = {};
  await Promise.all(names.map(async (n) => { const r = await fetch(base + n + '.json'); if (r.ok) out[n] = await r.json(); }));
  await data.load('assets');
  out.assets = data.get('assets');
  return out;
}

let active = null;
export function isLaboratory() { return !!active; }
export function stopLaboratory({reconnect=true}={}) {
  if (!active) return;
  const previous = active.previous;
  active.match.dispose();
  active = null;
  net.localSession = null;
  globalThis.__SP_LAB_CONTENT = null;
  store.set({ me: previous.me, room: null, match: emptyMatch(), chat: [], ticker: [], emotes: [], clock: previous.clock });
  if(reconnect)net.connect();
}

export async function startLaboratory(setup) {
  if (active || store.get().room?.inMatch) throw new Error('진행 중인 시뮬레이션을 먼저 종료해주세요.');
  // Only static files are fetched. No room, match, or combat requests are sent to a server.
  const reg = regulationVersion();
  let raw;
  if (reg) raw = await regulationData(reg);
  else {
    await Promise.all([...GAME_FILES, 'waves', 'backups'].map(k => data.load(k)));
    raw = Object.fromEntries([...GAME_FILES, 'waves', 'backups'].map(k => [k, data.get(k)]));
  }
  if (['config','chess','items','bands','stages','bosses','waves'].some(k => !raw[k])) throw new Error('실험실에 필요한 게임 데이터를 불러오지 못했습니다.');
  raw=withLaboratoryDummy(raw);
  // the season's match and engine (규정: upstream's, as its rooms play — server/match-upstream, server/sim-upstream)
  const MatchClass = reg
    ? (setup.practice ? (await import('/match-upstream/PracticeMatch.js')).PracticeMatch : (await import('/match-upstream/LaboratoryMatch.js')).LaboratoryMatch)
    : (setup.practice ? (await import('/match/PracticeMatch.js')).PracticeMatch : (await import('/match/LaboratoryMatch.js')).LaboratoryMatch);
  const simBase = reg ? '/sim-upstream/' : '/sim/';
  const { setSimData } = reg ? await import('/sim-upstream/simdata.js') : await import('/sim/simdata.js');
  for (const key of ['chess','enemies','tokens','backups']) if (raw[key]) raw[key]=structuredClone(raw[key]);
  attachAttackTimings(raw, raw.assets);
  if (raw.backups?.units) attachAttackTimings({chess:raw.backups.units},raw.assets);
  const support = reg ? await import('/sim-upstream/content/support/index.js') : await import('/sim/content/support/index.js');
  globalThis.__SP_SIM_BASE = simBase;   // the /data.js stand-in reads this engine's data (server/http/static.js)
  const previous = { me: store.get().me, clock: store.get().clock };
  const playerId = previous.me.playerId || `lab_${crypto.randomUUID()}`;
  const name = previous.me.name || '박사';
  const lo = loadoutStore.get();
  const catalog = customExtensionCatalog(raw);
  const customExtensions = normalizeCustomExtensions(setup.customExtensions===undefined?{bonds:catalog.bonds.map(x=>x.id),stages:catalog.stages.map(x=>x.id)}:{bonds:setup.customExtensions.bonds||[],stages:setup.customExtensions.stages||[],rules:setup.customExtensions.rules||[],commonBands:setup.customExtensions.commonBands||[],ruleValues:setup.customExtensions.ruleValues},raw);
  // 규정: its own custom settings (shared/seasonExtensions.js), applied to the season's tables as a 규정 room's match does
  // (server/match/Match.js) — 공통 적용 전략, 게임 규칙 (전략 중복 선택 …), 수치 — instead of the 맹약 season's switches
  const seasonSel = reg ? seasonExtensionSelection(setup.customExtensions || {}, raw) : null;
  let configured=reg?applySeasonExtensions(raw,seasonSel):applyCustomExtensions(raw,customExtensions);
  if(reg)configured={...configured,config:{...configured.config}};   // (the laboratory cap below never lands in the season's own table)
  if(!setup.practice)configured.config.customRules={...configured.config.customRules,deployCap:15};
  setSimData(configured);
  support.setGameData(configured);
  // a 규정 laboratory's battles run its own data on upstream's engine (battle/runner.js reads this for a battle with no cs)
  globalThis.__SP_LAB_CONTENT = reg ? { data: configured, version: reg.id } : null;
  const push = msg => { net._emit(msg.t, msg); net._emit('*', msg); };
  const match = new MatchClass({
    laboratory: setup, practice:setup, difficulty: setup.difficulty, roomCode: setup.practice?'PRACTICE':'LAB', seed: crypto.getRandomValues(new Uint32Array(1))[0], data: reg ? configured : raw,
    ...(reg ? { seasonExtensions: seasonSel, gameplayMode: 'custom' } : {}),
    customExtensions, seats: [{ seat: 0, playerId, name, isBot: false, connected: true, loadout: lo.entries, ops: lo.ops }],
    send: (_, msg) => { push(msg); return true; }, broadcast: push,
    onEnd: () => store.set({ room: { ...store.get().room, inMatch: false } }),
  });
  const request = async (t, fields = {}) => {
    if (t === 'room.leave') { stopLaboratory(); return { t: 'ok' }; }
    if (t === 'g.leave') { match.finish({ victory: false, reason: 'abandoned' }); return { t: 'ok' }; }
    if (t === 'room.loadout') {
      const res = match.setLoadout(playerId, fields.entries, fields.ops);
      if (res?.error) throw new NetError(res.error, res.detail, res.detail);
      return { t: 'ok' };
    }
    const msg = { ...fields, t };
    if (!t.startsWith('g.lab') && validateC2S(msg)) throw new NetError('BAD_MSG');
    const res = match.handle(playerId, msg);
    if (res?.error) throw new NetError(res.error, res.detail, res.detail);
    if(t==='g.labDummyStats')await syncLaboratoryDummy(match,fields.reset);
    return { t: 'ok' };
  };
  // a 규정 laboratory's screens read the season's files (stage, chess, bands …): the page shows them as that version's
  // set, as a 규정 room does (content.js showVersion); the lobby's own version set takes over again after it
  if (reg) data.setContent({ id: `lab:${reg.id}`, values: new Map(Object.entries(raw).filter(([k, v]) => k !== 'assets' && v)), overlay: null, langs: [] });
  net.close();
  active = { match, previous };
  net.localSession = { request };
  net.status = 'online';
  net._emit('status', net.snapshot());
  store.set({ me: { ...previous.me, playerId, name }, match: emptyMatch(),
    room: { code: setup.practice?'PRACTICE':'LAB', mode: setup.practice?'practice':'solo', laboratory: !setup.practice, practice:!!setup.practice, difficulty: setup.difficulty, hostId: playerId, inMatch: true, spectators: [],
      // the season: the page keeps (content.js) — or below, shows — that season's files, not the 맹약 ones
      ...(reg ? { version: reg.id } : {}),
      seats: [{ seat: 0, playerId, name, isBot: false, connected: true }], customExtensions },
    clock: { offset: 0, rtt: 0, synced: true }, chat: [], ticker: [], emotes: [] });
  store.patch('ui', { laboratorySetup: null });
  match.start();
}

export function captureLaboratorySetup() {
  if (!active) throw new Error('실험실에서만 저장할 수 있습니다.');
  const playerId = store.get().me.playerId, lo = loadoutStore.get();
  // The editor's debounced sync may still be pending when Save is clicked.
  const result = active.match.setLoadout(playerId, lo.entries, lo.ops);
  if (result.error) throw new Error('오퍼레이터 설정을 저장할 수 없습니다.');
  return active.match.saveSetup(playerId);
}
export function restoreLaboratorySetup(saved) {
  if (!active) throw new Error('실험실에서만 불러올 수 있습니다.');
  const playerId = store.get().me.playerId;
  const lo=loadoutStore.get(),synced=active.match.setLoadout(playerId,lo.entries,lo.ops);
  if(synced.error)throw new Error('현재 오퍼레이터 설정을 적용하지 못했습니다.');
  const result = active.match.loadSetup(playerId, saved);
  if (result.error) throw new Error(result.error === 'HAND_FULL'
    ? '대기석과 임시 대기석의 공간이 부족합니다.' : '현재 설정에서 이 프리셋을 불러올 수 없습니다.');

}

export async function restartLaboratory(){
 if(!active?.match.preparationSnapshot)throw new Error('전투 시작 전 배치가 없습니다.');
 const setup=structuredClone(active.match.laboratory),snapshot=structuredClone(active.match.preparationSnapshot),customExtensions=structuredClone(active.match.customExtensions);
 stopLaboratory({reconnect:false});
 await startLaboratory({...setup,customExtensions});
 const session=active,until=Date.now()+10000;
 while(active===session&&session.match.phase==='ROUND_START'&&Date.now()<until)await new Promise(resolve=>setTimeout(resolve,16));
 if(active!==session||session.match.phase!=='PREP')throw new Error('실험실 준비 단계로 돌아오지 못했습니다.');
 const pid=store.get().me.playerId,res=active.match.loadSetup(pid,snapshot.pieces);
 if(res.error)throw new Error('전투 시작 전 배치를 복원하지 못했습니다.');
 const ps=active.match.players.get(pid);ps.layers=structuredClone(snapshot.layers);ps.recompute();active.match.markPrivate(ps);active.match.markPublic();active.match.flush(true);
}

async function syncLaboratoryDummy(match,reset){
 const {battleRunner}=await import('./battle/runner.js'),stats=match.laboratory.dummyStats;
 if(!stats)return;
 const pool=match.bossPool;
 if(pool){const hp=reset?stats.maxHp:Math.min(pool.hp,stats.maxHp);pool.maxHp=stats.maxHp;pool.hp=hp;}
 for(const entry of battleRunner._entries.values()){
  const b=entry.battle;if(!b||b.finished)continue;
  if(b.sharedBoss){const hp=reset?stats.maxHp:Math.min(b.sharedBoss.hp,stats.maxHp);b.sharedBoss.maxHp=stats.maxHp;b.sharedBoss.hp=hp;}
  for(const e of b.enemies)if(e.defId===LAB_DUMMY_ENEMY){Object.assign(e.base,{maxHp:stats.maxHp,atk:stats.atk,def:stats.def,res:stats.res});e.def={...e.def,epResistance:stats.elementRes,epDamageResistance:stats.elementDmgRes};e.markDirty();b._syncBossHp(e);}
 }
 match.markPublic();match.flush(true);
}
