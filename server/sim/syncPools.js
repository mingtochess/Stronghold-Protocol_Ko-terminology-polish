// server/sim/syncPools.js — 동기화 시뮬레이션 (Match.sync): every scheduled enemy of a normal round has one HP pool that
// its copies on all the fields share (keyed by the spawn's syncKey, Battle.spawnEnemy). The same scheme as the boss
// fields' shared pool (spec.js LocalBossPool / match finalAssault.js SharedBossPool + CreditPool), one pool per key:
//   * SharedSyncPools — the match's authoritative pools. A pool is made by the first report of its key (its max HP: the
//     enemy's HP on that field, the multiplier already in the spawn's mods), damage is credited per field (`acked`).
//   * FieldSyncPools  — a server-run field's view: each key's damage goes straight into the shared pools.
//   * LocalSyncPools  — a browser field's view: local damage counts (`cum`) until the server's `b.sync` acknowledges it;
//     report() is the b.progress payload, sync() applies b.sync.
import { BOSS_POOL_MIN_HP } from './constants.js';

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : NaN);

/** One pool of the match. */
class Pool {
  constructor(maxHp) { this.maxHp = Math.max(1, num(maxHp) || 1); this.hp = this.maxHp; }
  damage(amount) {
    const a = num(amount);
    if (!(a > 0) || this.hp <= 0) return 0;
    const dealt = this.hp - a < BOSS_POOL_MIN_HP ? this.hp : a;
    this.hp -= dealt;
    return dealt;
  }
  heal(amount) {
    const a = num(amount);
    if (!(a > 0) || this.hp <= 0) return 0;
    const add = Math.min(a, this.maxHp - this.hp);
    this.hp += add;
    return add;
  }
}

export class SharedSyncPools {
  constructor({ onDepleted = null } = {}) {
    /** @type {Map<string, Pool>} */
    this.pools = new Map();
    /** fieldId → key → damage already credited from that field */
    this.acked = new Map();
    /** fieldId → key → healing already credited from that field */
    this.healAcked = new Map();
    this.onDepleted = onDepleted;
  }
  pool(key, maxHp) {
    let p = this.pools.get(key);
    if (!p && Number.isFinite(num(maxHp)) && num(maxHp) > 0) { p = new Pool(maxHp); this.pools.set(key, p); }
    return p || null;
  }
  /** A field's cumulative damage on `key` (a report): the part not credited yet goes into the pool. */
  credit(fieldId, key, cum, maxHp) {
    const p = this.pool(key, maxHp);
    if (!p) return 0;
    let f = this.acked.get(fieldId);
    if (!f) { f = new Map(); this.acked.set(fieldId, f); }
    const before = f.get(key) || 0, c = num(cum);
    if (!(c > before)) return 0;
    f.set(key, c);
    const wasAlive = p.hp > 0;
    const dealt = p.damage(c - before);
    if (wasAlive && p.hp <= 0 && this.onDepleted) { try { this.onDepleted(key); } catch { /* reported by the caller */ } }
    return dealt;
  }
  /** A field's cumulative healing on `key`: the part not credited yet goes back into the pool (never a dead one). */
  creditHeal(fieldId, key, cum) {
    const p = this.pools.get(key);
    if (!p) return 0;
    let f = this.healAcked.get(fieldId);
    if (!f) { f = new Map(); this.healAcked.set(fieldId, f); }
    const before = f.get(key) || 0, c = num(cum);
    if (!(c > before)) return 0;
    f.set(key, c);
    return p.heal(c - before);
  }
  hp(key) { const p = this.pools.get(key); return p ? p.hp : null; }
  alive(key) { const p = this.pools.get(key); return !p || p.hp > 0; }
  /** b.sync payload: every pool's HP and, per field, what of its damage is credited. */
  state() {
    const hp = {}, max = {};
    for (const [k, p] of this.pools) { hp[k] = Math.max(0, p.hp); max[k] = p.maxHp; }
    const acked = {};
    for (const [fid, m] of this.acked) acked[fid] = Object.fromEntries(m);
    const healAcked = {};
    for (const [fid, m] of this.healAcked) healAcked[fid] = Object.fromEntries(m);
    return { hp, max, acked, healAcked };
  }
}

/** A server-run field: its damage on a key is credited at once. */
export class FieldSyncPools {
  constructor(shared, fieldId) { this.shared = shared; this.fieldId = fieldId; this.views = new Map(); }
  get(key, maxHp) {
    let v = this.views.get(key);
    if (v) return v;
    const shared = this.shared, fieldId = this.fieldId;
    shared.pool(key, maxHp);
    let cum = 0, healCum = 0;
    v = {
      get hp() { return shared.hp(key) ?? 0; },
      set hp(x) { void x; },
      get maxHp() { return shared.pools.get(key)?.maxHp ?? maxHp; },
      get cum() { return cum; },
      damage(_pid, amount) { const a = num(amount); if (!(a > 0)) return 0; cum += a; return shared.credit(fieldId, key, cum, maxHp); },
      heal(amount) { const a = num(amount); if (!(a > 0)) return 0; const before = healCum; healCum += a; const add = shared.creditHeal(fieldId, key, healCum); if (!(add > 0)) healCum = before; return add; },
    };
    this.views.set(key, v);
    return v;
  }
}

/** A browser field: local damage on top of the server's last word. */
class LocalPool {
  constructor(maxHp, hp = maxHp) {
    this.maxHp = Math.max(1, num(maxHp) || 1);
    this.serverHp = Number.isFinite(num(hp)) ? Math.max(0, Math.min(this.maxHp, num(hp))) : this.maxHp;
    this.cum = 0;
    this.acked = 0;
    this.healCum = 0;
    this.healAcked = 0;
  }
  get hp() {
    const h = this.serverHp - Math.max(0, this.cum - this.acked) + Math.max(0, this.healCum - this.healAcked);
    return h < BOSS_POOL_MIN_HP ? 0 : Math.min(this.maxHp, h);
  }
  heal(amount) {
    const a = num(amount), left = this.hp;
    if (!(a > 0) || left <= 0) return 0;
    const add = Math.min(a, this.maxHp - left);
    this.healCum += add;
    return add;
  }
  set hp(v) { const n = num(v); if (Number.isFinite(n)) this.serverHp = Math.max(0, n) + Math.max(0, this.cum - this.acked); }
  damage(_pid, amount) {
    const a = num(amount), left = this.hp;
    if (!(a > 0) || left <= 0) return 0;
    const dealt = left - a < BOSS_POOL_MIN_HP ? left : a;
    this.cum += dealt;
    return dealt;
  }
}

export class LocalSyncPools {
  /** @param {{ hp?: Record<string, number>, max?: Record<string, number> }} [state] the server's pools when the field starts */
  constructor(state = {}) { this.pools = new Map(); this.state = { hp: { ...(state.hp || {}) }, max: { ...(state.max || {}) } }; }
  get(key, maxHp) {
    let p = this.pools.get(key);
    if (!p) { p = new LocalPool(this.state.max[key] ?? maxHp, this.state.hp[key] ?? this.state.max[key] ?? maxHp); this.pools.set(key, p); }
    return p;
  }
  /** b.progress: each key's cumulative damage here and its max HP (the server makes the pool from the first report). */
  report() {
    const dmg = {}, max = {}, heal = {};
    for (const [k, p] of this.pools) { if (p.cum > 0) dmg[k] = p.cum; if (p.healCum > 0) heal[k] = p.healCum; max[k] = p.maxHp; }
    return { dmg, max, heal };
  }
  /** b.sync: the server's HP of every pool and what of this field's damage it has credited. */
  sync(msg = {}, fieldId = null) {
    const acked = fieldId != null && msg.acked ? msg.acked[fieldId] || {} : {};
    const healAcked = fieldId != null && msg.healAcked ? msg.healAcked[fieldId] || {} : {};
    for (const [k, h] of Object.entries(msg.hp || {})) {
      if (!this.pools.has(k)) { this.state.hp[k] = h; if (msg.max?.[k]) this.state.max[k] = msg.max[k]; continue; }
      const p = this.pools.get(k), n = num(h), a = num(acked[k]);
      if (Number.isFinite(n)) p.serverHp = Math.max(0, Math.min(p.maxHp, n));
      // a display replica (no field of its own): the server's HP already holds whatever its authority dealt
      const ha = num(healAcked[k]);
      if (fieldId == null) { p.acked = p.cum; p.healAcked = p.healCum; } else {
        if (Number.isFinite(a) && a >= 0) p.acked = a;
        if (Number.isFinite(ha) && ha >= 0) p.healAcked = ha;
      }
    }
  }
}
