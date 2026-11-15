// 규정 莱塔尼亚 summons (enemy-record note / chorus) are neutral units that cannot be healed.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadData } from '../../server/data.js';
import { setGameData } from '../../server/sim-upstream/content/support/index.js';
import { makeBattle, chessRec, enemyRec } from '../helpers/battleHarnessUpstream.js';
import { bondBb } from '../../server/sim-upstream/content/bonds/addon/battle.js';
import { registerMeta as registerAddonMeta } from '../../server/sim-upstream/content/bonds/addon/meta.js';
import { registerSupportMeta } from '../../server/sim-upstream/content/support/meta.js';
import { hasBattleEffect, itemGrants } from '../../server/sim-upstream/content/items/battle.js';
import { createRegistry } from '../../server/match-upstream/effectsMeta.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const QUIET = Object.freeze({ warn() {}, error() {}, info() {}, log() {} });
const NOTE = 'enemy_9025_aclts';
const CHORUS = 'enemy_9026_acltm';
const GIANT = 'enemy_9024_acsgnt';
const YANYOU = 'enemy_9012_acloon';

let V3 = null;
function v3() {
  if (!V3) V3 = loadData(path.join(ROOT, 'data/versions/act3autochess-v3_1'), { log: QUIET });
  return V3;
}

function params(rec, key) {
  for (const b of rec?.buffs || []) {
    const k = b?.bbStr?.key || b?.key;
    if (k === key) return { ...(b.bb || {}), ...(b.bbStr || {}) };
  }
  return {};
}
function effectParams(effectId, key) {
  return params(v3().effects[effectId], key);
}

function close(a, b, msg, eps = 0.05) {
  assert.ok(Number.isFinite(a) && Math.abs(a - b) <= eps, `${msg}: expected ${b}, got ${a}`);
}
function gauges(u) {
  const e = u.elem || {};
  return (e.burn || 0) + (e.neural || 0) + (e.necrosis || 0) + (e.apoptosis || 0) + (e.erosion || 0);
}
function abnormal(u) {
  const f = u.s?.flags || {};
  if (f.stun || f.cold || f.fear || f.attract || f.groundbind) return true;
  return !!(u.buffs && u.buffs.some((b) => b.status === 'palsy' || b.palsy));
}
function bond(count, layers = 0, tier = null) {
  return { count, active: true, tier: tier ?? (count >= 6 ? 2 : 1), layers };
}
function piece(id, bonds, o = {}) {
  const rec = chessRec({
    id, bonds, golden: !!o.golden,
    position: o.position,
    profession: o.profession ?? 'WARRIOR',
    skill: o.skill === undefined ? { spCost: 100, duration: 10, skillType: 'MANUAL', initSp: 0 } : o.skill,
    rangeGrid: o.rangeGrid,
    stats: { atk: 500, def: o.def ?? 0, maxHp: o.hp ?? 2000, bat: o.bat ?? 100, res: 0, ...(o.stats || {}) },
  });
  return {
    rec, bench: !!o.bench,
    place: { chessId: id, row: o.row ?? 10, col: o.col ?? 4, items: o.items, uid: o.uid },
  };
}

function fight(t, spec) {
  const base = v3();
  const chess = { ...base.chess };
  const units = [];
  for (const p of spec.pieces || []) {
    chess[p.rec.chessId] = p.rec;
    if (!p.bench) units.push(p.place);
  }
  let bondsTable = base.bonds;
  if (spec.effectId) {
    const id = spec.bondId;
    bondsTable = { ...base.bonds, [id]: { ...base.bonds[id], effectId: spec.effectId } };
  }
  const data = {
    ...base, bonds: bondsTable, chess,
    enemies: {
      ...base.enemies,
      reg_tank: enemyRec({ key: 'reg_tank', hp: 1e7, def: 0, res: 0, atk: 0, speed: 0 }),
    },
  };
  setGameData(data);
  t.after(() => setGameData(null));
  return makeBattle({
    seed: spec.seed ?? 1,
    data,
    timeLimit: spec.timeLimit ?? 90,
    autoFinish: false,
    enemies: spec.spawns,
    players: [{
      playerId: 'p1', seat: 0, side: 'L', colOffset: 0,
      units: units.map((u, i) => ({ uid: u.uid ?? i + 1, kind: 'chess', ...u })),
      bonds: spec.bonds,
      contentInfo: spec.contentInfo,
    }],
  });
}


test('莱塔尼亚: the note summoned on an enemy death cannot be healed (禁疗)', (t) => {
  const h = fight(t, { bonds: { lethaniaShip: bond(1, 0, 1) }, pieces: [piece('reg_le', ['lethaniaShip'])] });
  h.step();
  const e = h.spawn('reg_tank', { pos: [9, 8] });
  h.run(0.5);
  h.b.kill(e, h.unit('reg_le'));
  h.run(0.2);
  const notes = h.b.allyUnits.filter((u) => u.defId === NOTE && u.alive);
  assert.equal(notes.length, 1, 'a note is summoned');
  const n = notes[0];
  n.hp = n.s.maxHp / 2;
  const before = n.hp;
  const healed = h.b.heal({ source: h.unit('reg_le'), target: n, amount: 500 });
  assert.equal(healed || 0, 0);
  assert.ok(n.hp <= before, 'no hp restored');
  assert.ok(n.s.flags.noHeal);
});
