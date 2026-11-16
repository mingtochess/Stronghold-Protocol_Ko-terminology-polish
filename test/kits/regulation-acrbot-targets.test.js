// 규정 성난 깡통 (char_618_acrbot, 酋长之威): one attack hits as many enemies of its range as its block count.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadData } from '../../server/data.js';
import { DataSource } from '../../server/sim-upstream/simdata.js';
import { makeBattle } from '../helpers/battleHarnessUpstream.js';
import { COLS } from '../../server/sim-upstream/constants.js';
import { setGameData } from '../../server/sim-upstream/content/support/index.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const V3 = loadData(path.join(ROOT, 'data/versions/act3autochess-v3_1'), { log: { warn() {}, error() {}, info() {} } });
setGameData(V3);
const waitAt = (y, x) => ({ motion: 'WALK', start: [y, x], end: [y, x], steps: [{ t: 'wait', s: 99999 }] });

test('acrbot hits up to its block count of enemies in range, blocked or not', () => {
  const h = makeBattle({ seed: 1, autoFinish: false, timeLimit: 40, data: new DataSource(V3), flags: { dpInit: 0, dpPerSec: 0 },
    units: [{ uid: 1, chessId: 'chess_char_5_22_a', row: 9, col: 5, skillIndex: 0 }] });
  h.step();
  const u = h.unit(1);
  assert.ok(u.s.blockCnt >= 3, `block ${u.s.blockCnt}`);
  // the 3 tiles of its forward range, none on its own tile (none blocked)
  const keys = [...u.rangeKeys].filter((k) => k !== 9 * COLS + 5);
  const k = keys[0], pos = [Math.floor(k / COLS), k % COLS];
  const enemies = [0, 1, 2].map(() => h.spawn('enemy_1007_slime', { pos, route: waitAt(pos[0], pos[1]) }));
  h.run(4);
  const hit = enemies.filter((e) => !e.alive || e.hp < e.s.maxHp).length;
  assert.equal(hit, Math.min(enemies.length, u.s.blockCnt), `hit ${hit} of ${enemies.length}`);
});
