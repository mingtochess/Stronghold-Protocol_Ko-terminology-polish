// 규정 (act3autochess@V3_1) fixes of 2026-11-15: 맹약 추가 has no effect on a 규정 table, a boss whose route only waits
// is a fixed boss (its HP bar), and 假想敌：茧's 【悲惨之雨】 names the field it covers for the client.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { getVersionData, getData } from '../server/data.js';
import { applyCustomExtensions, customExtensionCatalog } from '../shared/customExtensions.js';
import { DataSource } from '../server/sim-upstream/simdata.js';
import { setGameData } from '../server/sim/content/support/index.js';
import { unitInfo } from '../server/sim-upstream/snapshot.js';
import { makeBattle, chessRec } from './helpers/battleHarnessUpstream.js';

const raw = getVersionData('act3autochess@V3_1');
after(() => setGameData(null));

test('규정: 맹약 추가 neither lists nor drops the official ursusShip (乌萨斯) / docShip (聚合)', () => {
  assert.deepEqual(customExtensionCatalog(raw).bonds, []);
  const out = applyCustomExtensions(raw, { bonds: [], stages: [] });
  assert.equal(Object.keys(out.bonds).length, Object.keys(raw.bonds).length);
  assert.ok(out.bonds.ursusShip && out.bonds.docShip);
  assert.equal(out.bonds.docShip.members.length, raw.bonds.docShip.members.length);
  // the 맹약 season keeps its option
  assert.ok(customExtensionCatalog(getData()).bonds.some((b) => b.id === 'ursus'));
});

function battle(enemies, extra = {}) {
  setGameData(raw);
  const data = new DataSource({ ...raw, chess: { ...raw.chess, t0: chessRec({ id: 't0', skill: null, stats: { maxHp: 1e7, atk: 0, def: 0 } }) } }, null);
  return makeBattle({ data, content: 'full', autoFinish: false, timeLimit: 60, enemies, ...extra,
    players: [{ playerId: 'p1', seat: 0, side: 'L', units: [{ uid: 1, kind: 'chess', chessId: 't0', row: 10, col: 4 }], bonds: {} }] });
}

test('a boss whose route only waits where it starts is sent as fixed; a patrolling one is not', () => {
  const fixed = battle([], { kind: 'boss', stageId: 'act3autochess_m01', waveTemplate: 'act3autochess_h07_09' });
  fixed.run(3);
  const spider = fixed.b.enemies.find((e) => e.defId === 'enemy_9035_acspider');
  assert.equal(unitInfo(spider).fixed, true);
  const walking = battle([], { kind: 'boss', stageId: 'act3autochess_m01', waveTemplate: 'act3autochess_h07_10' });
  walking.run(3);
  assert.equal(unitInfo(walking.b.enemies.find((e) => e.defId === 'enemy_9037_aceel')).fixed, undefined);
});

test('【悲惨之雨】 sends the field it covers (every ground / deployable tile) and its duration', () => {
  const h = battle([{ key: 'enemy_9035_acspider_2', time: 0, pos: { row: 3, col: 10 },
    route: { motion: 'WALK', start: [3, 10], end: [3, 10], steps: [{ t: 'wait', s: 999 }] } }]);
  const rains = [];
  const fx = h.b.fx.bind(h.b);
  h.b.fx = (k, o) => { if (k === 'acidRain') rains.push(o); return fx(k, o); };
  h.run(26);
  assert.equal(rains.length, 1, 'cast once at its initial cooldown (25 s)');
  const { tiles, dur } = rains[0];
  assert.equal(dur, 25);
  assert.ok(tiles.length >= 2 && tiles.length % 2 === 0);
  for (let i = 0; i < tiles.length; i += 2) {
    const t = h.b.grid.tile(tiles[i], tiles[i + 1]);
    assert.ok(t.pass === 'ALL' || t.build !== 'NONE', 'no wall tile');
  }
  assert.ok(h.b.allies()[0].buffs.some((b) => b.key === 'reg:acid' && b.visible), 'the unit status the client draws');
});

// display-only signals of the other 규정 bosses (render/vfx/wiring.js REGULATION_HITS / REGULATION_POINT_FX / ECHO_SWITCH,
// REGULATION_STATUS 'reg:evade'): each fires where its official effect plays
function bossFight(key, extra = []) {
  setGameData(raw);
  const data = new DataSource({ ...raw, chess: { ...raw.chess, t0: chessRec({ id: 't0', skill: null, stats: { maxHp: 60000, atk: 300, def: 300 } }) } }, null);
  const wait = (r, c) => ({ motion: 'WALK', start: [r, c], end: [r, c], steps: [{ t: 'wait', s: 999 }] });
  const h = makeBattle({ data, content: 'full', autoFinish: false, timeLimit: 120, seed: 11,
    enemies: [[key, [10, 9]], ...extra].map(([k, at]) => ({ key: k, time: 0, pos: { row: at[0], col: at[1] }, route: wait(...at) })),
    players: [{ playerId: 'p1', seat: 0, side: 'L', units: [[1, 10, 3], [2, 10, 5], [3, 11, 4], [4, 9, 6], [5, 12, 7]].map(([uid, row, col]) => ({ uid, kind: 'chess', chessId: 't0', row, col })), bonds: {} }] });
  const fx = [];
  const of = h.b.fx.bind(h.b);
  h.b.fx = (k, o) => { fx.push([k, o]); return of(k, o); };
  h.step();
  return { h, fx, boss: h.b.enemies.find((e) => e.defId === key) };
}

test('假想敌：铳 / “碎铳之簧”: a regHit on every unit the charge or the chase tramples', () => {
  const { h, fx } = bossFight('enemy_9017_achunt_2', [['enemy_9018_actrpa', [9, 8]], ['enemy_9019_actrpb', [11, 8]], ['enemy_9020_actrpc', [12, 9]]]);
  h.run(90);
  const hits = fx.filter(([k]) => k === 'regHit').map(([, o]) => o);
  assert.ok(hits.some((o) => o.kind === 'finalPenance' && h.b.units.some((u) => u.id === o.target)));
  assert.ok(hits.some((o) => o.kind === 'springChase'));
});

test('阿利斯泰尔: an equipDie where each animated piece of equipment ends', () => {
  const { h, fx } = bossFight('enemy_9032_aclionk');
  h.run(90);
  const dies = fx.filter(([k]) => k === 'equipDie').map(([, o]) => o);
  assert.ok(dies.length > 0);
  for (const o of dies) assert.match(h.b.units.find((u) => u.id === o.id)?.defId || '', /^enemy_100(28_vtswd|29_vtshld|30_vtwand)$/);
});

test('矩兽: a regBurst at its death; 假想敌：茧: its 伪装 buff is visible; “余音”: a switch carries `from`', () => {
  const beast = bossFight('enemy_2124_dyjsfg');
  beast.h.run(1); beast.h.b.kill(beast.boss, null);
  assert.ok(beast.fx.some(([k, o]) => k === 'regBurst' && o.kind === 'beastOutOfControl'));
  const spider = bossFight('enemy_9035_acspider');
  spider.boss.hp = spider.boss.s.maxHp * 0.7;
  spider.h.run(1);
  assert.ok(spider.boss.buffs.some((b) => b.key === 'reg:evade' && b.visible));
  const pipe = bossFight('enemy_9021_acduml');
  pipe.h.run(90);
  const phases = pipe.fx.filter(([k, o]) => k === 'phase' && /^echo_/.test(o.kind)).map(([, o]) => o);
  assert.ok(phases.some((o) => o.from), 'a switch from the other form');
  assert.ok(phases.some((o) => !o.from), 'a summon (no switch)');
});

// 제보 2026-11-15: a co-op 假想敌：茧 walked to the 叙拉古 player's side (its 6 rolls 诱导 among its abnormal statuses) and
// the other player's operators could not reach it — the attract template ignored the data's otherImmunities 'attract'
test('诱导 (attract) respects otherImmunities: an immune fixed boss stays, a plain enemy is pulled; both engines', async () => {
  const { STATUS: up } = await import('../server/sim-upstream/buffs.js');
  const { STATUS: cov } = await import('../server/sim/buffs.js');
  assert.equal(up.attract.immune, 'attract');
  assert.equal(cov.attract.immune, 'attract');
  const { h, boss } = bossFight('enemy_9035_acspider');
  const u = h.b.allies()[0];
  assert.equal(h.b.applyStatus(boss, 'attract', { duration: 5, source: u }), false);
  const x0 = boss.x;
  h.run(5);
  assert.equal(boss.x, x0);
  const plain = bossFight('enemy_9040_accrit');
  assert.ok(!plain.boss.def.immune.has('attract'));
  assert.equal(plain.h.b.applyStatus(plain.boss, 'attract', { duration: 5, source: plain.h.b.allies()[0] }), true);
});

// 제보 2026-11-15: a 克莱门莎 S2 carriage carried 假想敌：茧 (安洁莉娜 S3 失重 brings it from weight 9 to the carriage's 8) —
// owner's rule: nothing an operator does moves a fixed boss (server/sim*/fixedPost.js)
test('a fixed boss (route only waits) refuses 诱导 / 恐惧 and every carry / teleport; a patrolling boss does not', async () => {
  const { isFixedPost } = await import('../server/sim-upstream/fixedPost.js');
  const { isFixedPost: covFixed } = await import('../server/sim/fixedPost.js');
  setGameData(raw);
  const data = new DataSource({ ...raw, chess: { ...raw.chess, t0: chessRec({ id: 't0', skill: null, stats: { maxHp: 1e6, atk: 0, def: 300, blockCnt: 0 } }) } }, null);
  const fight = (wave, key) => {
    const h = makeBattle({ data, content: 'full', autoFinish: false, kind: 'boss', timeLimit: 60, stageId: 'act3autochess_m01', waveTemplate: wave,
      players: [{ playerId: 'pL', seat: 0, side: 'L', units: [{ uid: 1, kind: 'chess', chessId: 't0', row: 10, col: 3 }], bonds: {} }] });
    h.runUntil(() => h.b.enemies.some((x) => x.defId === key && x.alive), 30);
    return { h, e: h.b.enemies.find((x) => x.defId === key), u: h.b.allies()[0] };
  };
  // 假想敌：管 has no data immunity to 诱导: only the fixed-boss rule holds it
  const pipe = fight('act3autochess_h07_03', 'enemy_9021_acduml');
  assert.equal(isFixedPost(pipe.e), true);
  assert.equal(pipe.h.b.applyStatus(pipe.e, 'attract', { duration: 3, source: pipe.u }), false);
  assert.equal(pipe.h.b.applyStatus(pipe.e, 'fear', { duration: 3, source: pipe.u }), false);
  const eel = fight('act3autochess_h07_10', 'enemy_9037_aceel');
  assert.equal(isFixedPost(eel.e), false);
  assert.equal(eel.h.b.applyStatus(eel.e, 'attract', { duration: 3, source: eel.u }), true);
  // the 맹약 engine reads the same rule (its fixed bosses: a waiting route or a data moveSpeed ≤ 0.1)
  assert.equal(covFixed({ side: 'enemy', isBoss: true, stationary: false, base: { moveSpeed: 0 } }), true);
  assert.equal(covFixed({ side: 'enemy', isBoss: true, stationary: false, base: { moveSpeed: 1 } }), false);
  assert.equal(covFixed({ side: 'enemy', isBoss: false, stationary: true, base: { moveSpeed: 0 } }), false);
});
