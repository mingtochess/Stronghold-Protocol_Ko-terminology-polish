// 규정 enemies keep the 맹약 season's attack timing (server/sim-upstream/ai.js enemyAttack, as server/sim/ai.js): the swing
// starts once the cooldown is over, the strike lands at the clip's damage frame after it, and the interval counts from
// the swing start.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { getVersionData } from '../../server/data.js';
import { DataSource } from '../../server/sim-upstream/simdata.js';
import { setGameData } from '../../server/sim/content/support/index.js';
import { makeBattle, chessRec, enemyRec } from '../helpers/battleHarnessUpstream.js';

const raw = getVersionData('act3autochess@V3_1');
after(() => setGameData(null));

test('a 규정 enemy strikes its clip hit time after the swing starts (attackStart → atk), interval from the swing', () => {
  setGameData(raw);
  const enemy = { ...enemyRec({ key: 'test_enemy', hp: 100000, speed: 0, atk: 500, bat: 2, range: 5 }),
    attackTiming: { front: { attack: { dur: 1.2, hit: 0.6 } } } };
  const data = new DataSource({ ...raw, chess: { ...raw.chess, test_a: chessRec({ id: 'test_a', skill: null, hp: 1000000, def: 0, atk: 0 }) },
    enemies: { ...raw.enemies, test_enemy: enemy } }, null);
  const h = makeBattle({ data, content: 'full', autoFinish: false, timeLimit: 30, stageId: 'act3autochess_m10',
    enemies: [{ key: 'test_enemy', time: 0, pos: { row: 9, col: 8 } }],
    players: [{ playerId: 'p1', seat: 0, side: 'L', units: [{ uid: 1, kind: 'chess', chessId: 'test_a', row: 9, col: 6 }], bonds: {} }] });
  const starts = [], hits = [];
  for (let i = 0; i < 30 * 30 && hits.length < 3; i++) {
    const seen = h.events.length;
    h.step();
    for (const ev of h.events.slice(seen)) {
      if (ev[0] === 'atkStart' && h.b.enemies.some((e) => e.id === ev[1])) starts.push(h.b.time);
      if (ev[0] === 'atk' && h.b.enemies.some((e) => e.id === ev[1])) hits.push(h.b.time);
    }
  }
  assert.ok(starts.length >= 2 && hits.length >= 2, `starts ${starts.length} hits ${hits.length}`);
  for (let i = 0; i < 2; i++) assert.ok(Math.abs(hits[i] - starts[i] - 0.6) < 0.06, `hit ${i} lands 0.6 s after its swing (${hits[i] - starts[i]})`);
  assert.ok(Math.abs(starts[1] - starts[0] - 2) < 0.06, `swings 2 s apart (${starts[1] - starts[0]})`);
});
