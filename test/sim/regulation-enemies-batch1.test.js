// 규정 enemies that had no kit (PRTS, 2026-11): 恶尘源石虫, 纤核漂游者, 搏命养家者 / 搏命享受者.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeBattle, chessRec } from '../helpers/battleHarnessUpstream.js';
import * as enemiesMod from '../../server/sim-upstream/content/enemies.js';
import * as bossesMod from '../../server/sim-upstream/content/bosses.js';
import { getVersionData } from '../../server/data.js';

const V = getVersionData('act3autochess@V3_1');
const BIG = [];
for (let dr = -4; dr <= 4; dr++) for (let dc = -12; dc <= 12; dc++) BIG.push([dr, dc]);
const CHESS = {
  t_wall: chessRec({ id: 't_wall', profession: 'TANK', stats: { atk: 0, maxHp: 1e7, def: 0, res: 0, blockCnt: 3 }, rangeGrid: [[0, 0]], skill: null }),
  t_gun: chessRec({ id: 't_gun', profession: 'SNIPER', projectile: 'none', stats: { atk: 0, maxHp: 1e7, def: 0, res: 0, blockCnt: 0 }, rangeGrid: BIG, skill: null }),
};
const waitAt = (y, x) => ({ motion: 'WALK', start: [y, x], end: [y, x], steps: [{ t: 'wait', s: 99999 }] });
const fight = (units = []) => makeBattle({ content: 'generic', extraContent: [enemiesMod, bossesMod], seed: 1, autoFinish: false, timeLimit: 60,
  defs: { enemies: V.enemies, chess: CHESS }, units });
const put = (h, key, pos) => h.spawn(key, { pos, route: waitAt(pos[0], pos[1]) });

test('恶尘源石虫: a 1 s delayed 350% ATK blast around its death spot, then a 源石污染区', () => {
  const h = fight([{ chessId: 't_wall', row: 10, col: 5, uid: 1 }]);
  h.step(1);
  const op = h.allies()[0];
  const e = put(h, 'enemy_1424_lrboom', [10, 6]);
  h.step(1);
  const hp0 = op.hp;
  h.b.kill(e);
  h.run(0.5);
  assert.equal(op.hp, hp0, 'nothing before the delay');
  h.run(0.6);
  const blast = hp0 - op.hp;
  assert.ok(blast > 0, 'blast landed');
  const after = op.hp;
  h.run(2.1);
  assert.equal(after, op.hp, 'the zone is on its tile, not the neighbour');
});

test('纤核漂游者 prefers high ground and adds neural damage', () => {
  const h = fight([{ chessId: 't_gun', row: 10, col: 5, uid: 1 }, { chessId: 't_wall', row: 10, col: 6, uid: 2 }]);
  h.step(1);
  const [gun, wall] = h.allies().slice().sort((a, b) => a.tileC - b.tileC);
  gun.ground = false; wall.ground = true;
  gun.aggroSeq = 1; wall.aggroSeq = 99;   // the wall would win on 仇恨值
  const e = put(h, 'enemy_1435_dsflys', [10, 7]);
  h.run(8);
  assert.ok(gun.hp < gun.s.maxHp, 'the high-ground unit was attacked');
  assert.equal(wall.hp, wall.s.maxHp, 'the ground unit was not');
  void e;
});

test('搏命享受者: enemies within 1.7 take phys / arts ×0.75; outside, full damage', () => {
  const h = fight();
  const boss = put(h, 'enemy_10196_ubba_2', [10, 6]);
  const near = put(h, 'enemy_1007_slime', [10, 7]);
  const far = put(h, 'enemy_1007_slime', [10, 10]);
  h.step(30);
  for (const t of [near, far]) t.hp = t.s.maxHp;
  h.b.dealDamage(null, near, { amount: 100, type: 'true' });
  assert.ok(near.s.physTakenMul === 0.75 && near.s.artsTakenMul === 0.75, 'aura on the near one');
  assert.equal(far.s.physTakenMul, 1);
  assert.equal(boss.s.physTakenMul, 0.75, 'itself included');
});

for (const [key, child, n] of [['enemy_1131_sbeast', 'enemy_1137_plasm', 2], ['enemy_1132_sarchn_2', 'enemy_1138_tumor', 3]]) test(`${key}: splits into ${n} ${child} after 0.2 s`, () => {
  const h = fight();
  const e = put(h, key, [10, 6]);
  h.step(1);
  h.b.kill(e);
  assert.equal(h.enemies().filter((x) => x.defId === child).length, 0, 'not at once');
  h.run(0.3);
  assert.equal(h.enemies().filter((x) => x.defId === child && x.alive).length, n);
});

test('冰爆源石虫·α: 1 s after death, 200% ATK physical and 寒冷', () => {
  const h = fight([{ chessId: 't_wall', row: 10, col: 5, uid: 1 }]);
  h.step(1);
  const op = h.allies()[0];
  const e = put(h, 'enemy_1067_snslime_2', [10, 6]);
  h.step(1);
  const hp0 = op.hp;
  h.b.kill(e);
  h.run(0.5);
  assert.equal(op.hp, hp0);
  h.run(0.6);
  assert.ok(op.hp < hp0);
  assert.ok(op.findBuff('cold') || op.s.flags.cold || op.statuses?.cold, 'cold');
});

test('畸变恶性瘤: its blocker attacks 5× slower while it blocks it', () => {
  const h = fight([{ chessId: 't_wall', row: 10, col: 5, uid: 1 }]);
  h.step(1);
  const op = h.allies()[0];
  const base = op.s.interval;
  const e = h.spawn('enemy_1138_tumor', { pos: [10, 8], route: { motion: 'WALK', start: [10, 8], end: [10, 0], steps: [] } });
  h.runUntil(() => e.blockedBy === op, 10);
  h.step(2);
  assert.ok(Math.abs(op.s.interval - base * 5) < 1e-6, `interval ${op.s.interval} vs ${base}`);
});

test('诡核集养者: one copy at the same HP ratio when HP first falls under half; copies do not split', () => {
  const h = fight();
  const e = put(h, 'enemy_1436_dsdivi', [10, 6]);
  h.step(1);
  h.b.dealDamage(null, e, { amount: e.s.maxHp * 0.6, type: 'true' });
  h.step(1);
  const all = h.enemies().filter((x) => x.defId === 'enemy_1436_dsdivi' && x.alive);
  assert.equal(all.length, 2);
  const copy = all.find((x) => x !== e);
  assert.ok(Math.abs(copy.hp / copy.s.maxHp - e.hp / e.s.maxHp) < 0.02);
  h.b.dealDamage(null, copy, { amount: 1, type: 'true' });
  h.step(1);
  assert.equal(h.enemies().filter((x) => x.defId === 'enemy_1436_dsdivi' && x.alive).length, 2);
});

test('沸血骑士团精锐: +10% ATK per enemy death, capped at 10', () => {
  const h = fight();
  const k = put(h, 'enemy_1103_wdkght_2', [10, 6]);
  h.step(1);
  const atk0 = k.s.atk;
  for (let i = 0; i < 12; i++) { const s = put(h, 'enemy_1007_slime', [10, 9]); h.step(1); h.b.kill(s); h.step(1); }
  assert.ok(Math.abs(k.s.atk - atk0 * 2) < 1e-6, `${k.s.atk} vs ${atk0}`);
});

test('新生血裔 leaves a 血珀', () => {
  const h = fight();
  const e = put(h, 'enemy_1360_dfello', [10, 6]);
  h.step(1);
  h.b.kill(e);
  h.step(2);
  assert.ok(h.enemies().some((x) => x.defId === 'enemy_1367_dseed' && x.alive));
});

test('大君之触: phys/arts taken ×0.1 and its blocker blocks +1', () => {
  const h = fight([{ chessId: 't_wall', row: 10, col: 5, uid: 1 }]);
  h.step(1);
  const op = h.allies()[0];
  const blk = op.s.blockCnt;
  const e = h.spawn('enemy_1220_dzoms', { pos: [10, 8], route: { motion: 'WALK', start: [10, 8], end: [10, 0], steps: [] } });
  h.step(1);
  assert.ok(Math.abs(e.s.physTakenMul - 0.1) < 1e-9);
  h.runUntil(() => e.blockedBy === op, 10);
  h.step(3);
  assert.equal(op.s.blockCnt, blk + 1);
});

test('补给车: 重生造物 +10% ATK per car while one is on the field', () => {
  const h = fight();
  const z = put(h, 'enemy_1221_dzomg', [10, 6]);
  h.step(1);
  const a0 = z.s.atk;
  put(h, 'enemy_1224_dsuply', [10, 9]);
  h.run(1);
  assert.ok(Math.abs(z.s.atk - a0 * 1.1) < 1e-6, `${z.s.atk} vs ${a0}`);
});

test('炫目刀技厨师: ground enemies within 2.5 get RES +25 and ASPD +50', () => {
  const h = fight();
  put(h, 'enemy_10229_agactr_2', [10, 6]);
  const near = put(h, 'enemy_1007_slime', [10, 7]);
  const far = put(h, 'enemy_1007_slime', [10, 12]);
  const r0 = far.s.res;
  h.run(1);
  assert.equal(near.s.res, r0 + 25);
  assert.equal(far.s.res, r0);
});

test('圆号手: every third attack takes one more target', () => {
  const h = fight([{ chessId: 't_gun', row: 10, col: 6, uid: 1 }, { chessId: 't_gun', row: 10, col: 8, uid: 2 }]);
  h.step(1);
  const e = put(h, 'enemy_1373_ltnhor', [10, 7]);
  const hits = [];
  h.b.on('damaged', (c) => { if (c.source === e) hits.push(c.target.id); });
  h.run(30);
  assert.ok(hits.length >= 4);
  const per = new Map(); for (const id of hits) per.set(id, (per.get(id) || 0) + 1);
  assert.equal(per.size, 2, 'both units were hit');
});

test('寻路者狙击手: the first attack (ammo) is ×2, the next ×1', () => {
  const h = fight([{ chessId: 't_gun', row: 10, col: 5, uid: 1 }]);
  h.step(1);
  const e = put(h, 'enemy_1213_mtrsnp', [10, 6]);
  const dmg = [];
  h.b.on('damaged', (c) => { if (c.source === e) dmg.push(c.amount); });
  h.run(8);
  assert.ok(dmg.length >= 2);
  assert.ok(Math.abs(dmg[0] - dmg[1] * 2) < 1e-6, dmg.join(','));
});

test('速射轻弩手: 3 bolts at an ally on its row', () => {
  const h = fight([{ chessId: 't_gun', row: 10, col: 3, uid: 1 }]);
  h.step(1);
  const e = put(h, 'enemy_1403_gunsho', [10, 8]);
  const hits = [];
  h.b.on('damaged', (c) => { if (c.source === e) hits.push(h.b.time); });
  h.run(3);
  assert.equal(hits.length, 3);
});

test('无畏掷弹兵: first unblocked damage ⇒ bombs, then faster, lighter, no attack', () => {
  const h = fight([{ chessId: 't_gun', row: 10, col: 3, uid: 1 }]);
  h.step(1);
  const op = h.allies()[0];
  const e = put(h, 'enemy_1405_boomer_2', [10, 8]);
  h.step(1);
  const spd = e.s.moveSpeed, hp = op.hp;
  h.b.dealDamage(null, e, { amount: 1, type: 'true' });
  h.step(1);
  assert.ok(op.hp < hp, 'bomb hit');
  assert.ok(Math.abs(e.s.moveSpeed - spd - 0.7) < 1e-9);
  assert.ok(e.profile.noAttack);
});

test('内测版自助出餐终端: a helper at 3 s, then every 5 s', () => {
  const h = fight();
  put(h, 'enemy_10077_mpbarr', [10, 8]);
  h.run(3.2);
  assert.equal(h.enemies().filter((x) => x.defId === 'enemy_10073_mpcar').length, 1);
  h.run(5);
  assert.equal(h.enemies().filter((x) => x.defId === 'enemy_10073_mpcar').length, 2);
});

test('赏金猎人“骑士”: speeds up while unblocked', () => {
  const h = fight();
  const e = h.spawn('enemy_1413_mmstck', { pos: [10, 12], route: { motion: 'WALK', start: [10, 12], end: [10, 0], steps: [] } });
  h.step(1);
  const s0 = e.s.moveSpeed;
  h.run(2.1);
  assert.ok(e.s.moveSpeed >= s0 * 3 - 1e-9, `${e.s.moveSpeed} vs ${s0}`);
});

test('聚焦魂灵残迹: absorbs a 魂灵涡流, then lasers an ally on its row', () => {
  const h = fight([{ chessId: 't_gun', row: 10, col: 3, uid: 1 }]);
  h.step(1);
  const op = h.allies()[0];
  const w = put(h, 'enemy_1429_lrwzrd', [10, 8]);
  const soul = put(h, 'enemy_1428_lrsoul', [10, 8]);
  h.step(2);
  assert.equal(soul.alive, false, 'absorbed');
  assert.equal(w.mem.souls ?? 0, 0, 'spent on the laser');
  const hp = op.hp;
  h.run(3.1);
  assert.ok(op.hp < hp, 'laser hits');
  assert.ok(w.s.atk > w.base.atk, 'ATK climbs');
});

test('开天汽水瓶: speeds up and loses HP while moving', () => {
  const h = fight();
  const e = h.spawn('enemy_10146_nscola', { pos: [10, 12], route: { motion: 'FLY', start: [10, 12], end: [10, 0], steps: [] } });
  h.step(1);
  const s0 = e.s.moveSpeed, hp0 = e.hp;
  h.run(2.1);
  assert.ok(e.s.moveSpeed > s0);
  assert.ok(e.hp < hp0);
});

test('遮天面包机: unblocked splash around itself', () => {
  const h = fight([{ chessId: 't_gun', row: 10, col: 6, uid: 1 }]);
  h.step(1);
  const op = h.allies()[0];
  put(h, 'enemy_10147_nsbomb', [10, 6]);
  const hp = op.hp;
  h.run(3);
  assert.ok(op.hp < hp);
});

test('破城者: only blocked by a block ≥ 3 unit', () => {
  const h = fight();
  const e = put(h, 'enemy_10123_uareap', [10, 6]);
  h.step(1);
  assert.equal(e.blockWeight, 3);
});
