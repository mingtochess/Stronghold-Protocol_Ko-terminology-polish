// 규정 m10's 盐坨子炮 (server/sim-upstream/content/devices.js): every 12 s (SP 12) a shell lands 4 tiles ahead of the cannon,
// 800 physical to allies within 1.5; a ground enemy of weight ≤ 3 next to the cannon rides it to the landing point.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { getVersionData } from '../../server/data.js';
import { DataSource } from '../../server/sim-upstream/simdata.js';
import { setGameData } from '../../server/sim/content/support/index.js';
import { makeBattle, chessRec, enemyRec } from '../helpers/battleHarnessUpstream.js';

const raw = getVersionData('act3autochess@V3_1');
after(() => setGameData(null));

function battle({ enemies = [], units = [] } = {}) {
  setGameData(raw);
  const data = new DataSource({ ...raw,
    chess: { ...raw.chess, test_a: chessRec({ id: 'test_a', skill: null, hp: 100000, def: 0 }) },
    enemies: { ...raw.enemies, test_enemy: enemyRec({ key: 'test_enemy', hp: 100000, speed: 0 }) } }, null);
  return makeBattle({ data, content: 'full', autoFinish: false, timeLimit: 40, stageId: 'act3autochess_m10', enemies,
    players: [{ playerId: 'p1', seat: 0, side: 'L', units, bonds: {} }] });
}

test('the cannon at (13,6) facing DOWN shells (9,6) every 12 s for 800 physical on allies within 1.5', () => {
  const h = battle({ units: [{ uid: 1, kind: 'chess', chessId: 'test_a', row: 9, col: 6 }, { uid: 2, kind: 'chess', chessId: 'test_a', row: 9, col: 10 }] });
  h.step();
  const near = h.unit(1), far = h.unit(2);
  const hp0 = near.hp;
  h.run(12.1);
  assert.equal(near.hp, hp0, 'nothing before the first shell lands (12 s charge + 0.29 s flight)');
  h.run(1);
  assert.ok(near.hp < hp0, 'shell landed on (9,6)');
  assert.equal(far.hp, far.s.maxHp, 'an ally 4 tiles away is outside the 1.5 splash');
  const hit = hp0 - near.hp;
  h.run(12);
  assert.ok(Math.abs((hp0 - near.hp) - 2 * hit) < 1e-6, 'one shell per 12 s');
});

test('a light ground enemy beside the cannon rides the shell to the landing point', () => {
  const h = battle({ enemies: [{ key: 'test_enemy', time: 0, pos: { row: 13, col: 7 } }] });
  h.run(1);
  const e = h.b.enemies.find((x) => String(x.defId).endsWith('test_enemy'));
  assert.ok(e, 'enemy spawned');
  e.x = 6.4; e.y = 13;   // next to the cannon (13,6): within 1.1
  h.run(12.5);
  assert.ok(Math.abs(e.x - 6) < 1e-6 && Math.abs(e.y - 9) < 1e-6, `moved to the landing point, at ${e.x},${e.y}`);
});

test('m09 隐匿模块 (w): an operator standing on it is hidden (隐匿)', () => {
  const st = Object.values(raw.stages).find((s) => s.id === 'act3autochess_m09');
  let cell = null;
  st.rows.forEach((row, r) => { const c = row.indexOf('w'); if (!cell && c >= 0 && r >= 9 && r <= 12) cell = [r, c]; });
  assert.ok(cell, 'a w tile on the normal field');
  setGameData(raw);
  const data = new DataSource({ ...raw, chess: { ...raw.chess, test_a: chessRec({ id: 'test_a', skill: null }) } }, null);
  const h = makeBattle({ data, content: 'full', autoFinish: false, timeLimit: 5, stageId: 'act3autochess_m09',
    players: [{ playerId: 'p1', seat: 0, side: 'L', units: [{ uid: 1, kind: 'chess', chessId: 'test_a', row: cell[0], col: cell[1] }], bonds: {} }] });
  h.step();
  assert.equal(h.unit(1).s.flags.stealth, true);
});

test('염괴포 is an enemy structure: HP 20000, DEF 200, taunt -1, attackable and destroyable; not a kill, not a leak', () => {
  const h = battle({});
  h.step();
  const cn = h.b.enemies.find((e) => e.defId === 'trap_196_cnnon');
  assert.ok(cn, 'the cannon is an enemy unit');
  assert.equal(cn.s.maxHp, 20000);
  assert.equal(cn.s.def, 200);
  assert.equal(cn.s.res, 0);
  assert.equal(cn.counted, false);
  assert.equal(cn.mem.noLeak, true);
  h.b.dealDamage({ source: null, target: cn, amount: 1e9, type: 'true' });
  assert.equal(cn.alive, false, 'destroyed');
});

test('a destroyed 염괴포 sends its rider to the blast centre at once and fires no more', () => {
  const h = battle({ enemies: [{ key: 'test_enemy', time: 0, pos: { row: 13, col: 7 } }],
    units: [{ uid: 1, kind: 'chess', chessId: 'test_a', row: 9, col: 6 }] });
  h.run(1);
  const e = h.b.enemies.find((x) => String(x.defId).endsWith('test_enemy'));
  const cn = h.b.enemies.find((x) => x.defId === 'trap_196_cnnon');
  e.x = 6.4; e.y = 13;
  h.b.dealDamage({ source: null, target: cn, amount: 1e9, type: 'true' });
  h.step();
  assert.ok(Math.abs(e.x - 6) < 1e-6 && Math.abs(e.y - 9) < 1e-6, `rider landed at ${e.x},${e.y}`);
  const hp = h.unit(1).hp;
  h.run(8);
  assert.equal(h.unit(1).hp, hp, 'no shell after its destruction');
});

test('a field where only the 염괴포 is left ends cleared (the structure does not hold it open)', () => {
  setGameData(raw);
  const data = new DataSource({ ...raw, chess: { ...raw.chess, test_a: chessRec({ id: 'test_a', skill: null, hp: 100000 }) } }, null);
  const h = makeBattle({ data, content: 'full', autoFinish: true, timeLimit: 30, stageId: 'act3autochess_m10',
    players: [{ playerId: 'p1', seat: 0, side: 'L', units: [], bonds: {} }] });
  h.run(3);
  assert.equal(h.b.finished, true);
  assert.equal(h.b.reason, 'cleared');
  assert.equal(h.b.leakedCount ?? 0, 0);
});
