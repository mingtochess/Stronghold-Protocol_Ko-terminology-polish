// server/match/sync.js — 동기화 시뮬레이션 (Match.sync) normal rounds: every field fights the same list of enemies (the
// round's wave with every living player's bounties), and each scheduled enemy shares one HP pool across the fields
// (server/sim/syncPools.js, keyed by the spawn's syncKey: `s<entry>` here, `.<instance>` by Battle._queueSpawn,
// `:<n>` for a child by content spawnChildren).
//   * HP: every non-bounty enemy × the living players, a bounty enemy × (1 + 0.5 per extra living player).
//   * A leak costs the team LP once per field it got through on; if the enemy is killed (its shared HP runs out on any
//     field) one of those is taken back: 2 fields let A through, then A is killed ⇒ the team loses A's LP once.
//   * A bounty enemy whose shared HP runs out pays its coins once, to the player who picked that bounty (whoever's field
//     dealt the last hit).
import { withBounties } from './waves.js';
import { SharedSyncPools } from '../sim/syncPools.js';

const ROOT = /^(s\d+)\.\d+$/;

/** HP multiplier of a synced enemy for `alive` living players. */
export function syncHpFactor(alive, bounty) {
  const n = Math.max(1, Math.trunc(Number(alive) || 1));
  return bounty ? 1 + 0.5 * (n - 1) : n;
}

/** The round's shared state: built once per round, the first time a field asks for it. */
export function syncRound(m) {
  if (m._sync && m._sync.round === m.round) return m._sync;
  const alive = m.alivePlayers();
  const bounties = [], ownerOf = new Map();
  for (const ps of alive) for (const b of ps.bounties || []) { bounties.push(b); if (b && b.id != null) ownerOf.set(b.id, ps.playerId); }
  const coins = new Map();
  const spawns = withBounties(m.gd, m.round, m.wave, bounties, null).map((s, j) => {
    const out = { ...s, mods: s.mods ? { ...s.mods } : {} };
    if (s.tag === 'boss' || s.tag === 'part') return out;
    const bounty = s.tag === 'bounty';
    out.mods.hpMul = (Number.isFinite(out.mods.hpMul) ? out.mods.hpMul : 1) * syncHpFactor(alive.length, bounty);
    out.syncKey = `s${j}`;
    const c = s.bounty && typeof s.bounty === 'object' ? Math.trunc(Number(s.bounty.coins) || 0) : 0;
    const owner = ownerOf.get(s.mods && s.mods.bountyId);
    if (c > 0 && owner) coins.set(out.syncKey, { coins: c, owner });
    return out;
  });
  const st = {
    round: m.round, spawns, coins, paidBy: new Map(), leaks: new Map(), alive: alive.length,
    pools: new SharedSyncPools({
      // a pool runs out once (SharedSyncPools.credit: only on the alive → dead step), so each bounty unit pays once
      onDepleted: (key) => {
        const root = ROOT.exec(key);
        const c = root ? coins.get(root[1]) : null;
        if (c) st.paidBy.set(c.owner, (st.paidBy.get(c.owner) || 0) + c.coins);
      },
    }),
  };
  m._sync = st;
  return st;
}

/** The field's spawn list (a copy of the round's: the onBattleStart handlers may edit it). */
export function syncSpawns(m, playerId) {
  return syncRound(m).spawns.map((s) => ({ ...s, mods: { ...s.mods }, ownerPlayerId: playerId }));
}

/** A field's reported shared damage (b.progress syncDmg / syncMax) and leaks. */
export function syncCredit(m, fieldId, dmg, max, leaks, heal = null) {
  if (Array.isArray(leaks)) leaks = leaks.map((l) => (l && typeof l === 'object' ? { ...l, fieldId } : l));
  const st = m._sync;
  if (!st) return;
  if (dmg && typeof dmg === 'object') for (const [k, cum] of Object.entries(dmg)) {
    if (!/^s\d+\.\d+(?::\d+)*$/.test(k)) continue;
    const mx = max && Number.isFinite(max[k]) ? max[k] : null;
    if (mx == null && !st.pools.pools.has(k)) continue;
    st.pools.credit(fieldId, k, cum, mx);
  }
  // healing after the damage of the same report: a pool the damage emptied stays dead
  if (heal && typeof heal === 'object') for (const [k, cum] of Object.entries(heal)) if (/^s\d+\.\d+(?::\d+)*$/.test(k)) st.pools.creditHeal(fieldId, k, cum);
  syncNoteLeaks(m, leaks);
}

/** Leaks of shared enemies: per key, its LP and the fields it got through on (a field counts once per enemy). */
export function syncNoteLeaks(m, leaks, fieldId = null) {
  const st = m._sync;
  if (!st || !Array.isArray(leaks)) return;
  for (const l of leaks) {
    const key = l && (l.key ?? l.syncKey);
    const fid = (l && l.fieldId) ?? fieldId;
    if (typeof key !== 'string' || typeof fid !== 'string') continue;
    const lpr = Number.isFinite(l.lpr) && l.lpr >= 0 ? Math.min(1000, l.lpr) : 1;
    let e = st.leaks.get(key);
    if (!e) { e = { lpr, fields: new Set() }; st.leaks.set(key, e); }
    e.fields.add(fid);
  }
}

/** The team LP the round's shared leaks cost so far: per enemy, its LP × (the fields it got through on − 1 if killed). */
export function syncLeakLoss(m) {
  const st = m._sync;
  if (!st) return 0;
  let n = 0;
  for (const [key, e] of st.leaks) n += e.lpr * Math.max(0, e.fields.size - (st.pools.alive(key) ? 0 : 1));
  return n;
}

/** b.sync for one recipient (its own field's acknowledgements only). */
export function syncMessage(m, fieldId) {
  const st = m._sync;
  if (!st) return null;
  const s = st.pools.state();
  const own = (map) => (fieldId && map[fieldId] ? { [fieldId]: map[fieldId] } : {});
  return { t: 'b.sync', round: st.round, hp: s.hp, max: s.max, acked: own(s.acked), healAcked: own(s.healAcked) };
}
