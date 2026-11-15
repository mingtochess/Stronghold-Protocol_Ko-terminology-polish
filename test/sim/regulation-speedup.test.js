// 규정 m12's 优化模块 (tile_speedup, server/sim-upstream/content/devices.js; PRTS 优化模块): an operator on it ASPD +25, an
// enemy move ×1.5, both kept after leaving the tile ("加成持续时间无限，离开地块后依旧可生效").
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { getVersionData } from '../../server/data.js';
import { DataSource } from '../../server/sim-upstream/simdata.js';
import { setGameData } from '../../server/sim/content/support/index.js';
import { makeBattle, chessRec, enemyRec } from '../helpers/battleHarnessUpstream.js';

const raw = getVersionData('act3autochess@V3_1');
after(() => setGameData(null));
const st = raw.stages.act3autochess_m12;
let z = null;
st.rows.forEach((row, r) => { const c = row.indexOf('z'); if (!z && c >= 0 && r >= 9 && r <= 12) z = [r, c]; });

function battle(units = []) {
  setGameData(raw);
  const data = new DataSource({ ...raw,
    chess: { ...raw.chess, test_a: chessRec({ id: 'test_a', skill: null, hp: 100000, def: 0 }) },
    enemies: { ...raw.enemies, test_enemy: enemyRec({ key: 'test_enemy', hp: 100000, speed: 0 }) } }, null);
  return makeBattle({ data, content: 'full', autoFinish: false, timeLimit: 40, stageId: 'act3autochess_m12',
    enemies: [{ key: 'test_enemy', time: 0, pos: { row: z[0], col: z[1] } }],
    players: [{ playerId: 'p1', seat: 0, side: 'L', units, bonds: {} }] });
}

test('优化模块: an operator on it gains ASPD only; an enemy gains move ×1.5 only, kept after leaving', () => {
  assert.ok(z, 'a z tile on the normal field');
  const h = battle([{ uid: 1, kind: 'chess', chessId: 'test_a', row: z[0], col: z[1] }]);
  h.run(0.5);
  const op = h.unit(1);
  const buffOp = op.findBuff('terrain:speedup');
  assert.ok(buffOp, 'the operator has it');
  assert.equal(buffOp.mods.moveMul, undefined);
  assert.ok(buffOp.mods.aspd > 0);
  const e = h.b.enemies.find((x) => String(x.defId).endsWith('test_enemy'));
  e.x = z[1]; e.y = z[0];   // onto the tile
  h.run(0.2);
  const be = e.findBuff('terrain:speedup');
  assert.ok(be && Math.abs(be.mods.moveMul - 1.5) < 1e-9 && !be.mods.aspd);
  e.x = 0; e.y = 9;   // off the tile
  h.run(2);
  assert.ok(e.findBuff('terrain:speedup'), 'kept after leaving');
});
