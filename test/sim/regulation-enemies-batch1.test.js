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
