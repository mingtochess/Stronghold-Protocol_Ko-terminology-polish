import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadData } from '../../server/data.js';
import { DataSource } from '../../server/sim-upstream/simdata.js';
import { makeBattle } from '../helpers/battleHarnessUpstream.js';
import { setGameData } from '../../server/sim-upstream/content/support/index.js';

test('regulation Nymph trait: fear in range grants +4 swiftShip (check_ab_flag 33)', () => {
  const V3 = loadData(new URL('../../data/versions/act3autochess-v3_1', import.meta.url).pathname, { log: { warn() {}, error() {}, info() {} } });
  setGameData(V3);
  const id = 'chess_char_6_10_a';
  const bonds = Object.fromEntries((V3.chess[id].bonds || []).map((b) => [b, { layers: 1, active: true }]));
  const h = makeBattle({ seed: 1, autoFinish: false, timeLimit: 60, data: new DataSource(V3), flags: { dpInit: 0, dpPerSec: 0 },
    players: [{ playerId: 'p1', seat: 0, side: 'L', colOffset: 0, units: [{ uid: 1, kind: 'chess', chessId: id, row: 10, col: 5, skillIndex: 0 }], bonds, bandId: null, playerEffects: [] }] });
  h.step();
  const e = h.spawn('enemy_1007_slime', { pos: [10, 6], route: { motion: 'WALK', start: [10, 6], end: [10, 6], steps: [{ t: 'wait', s: 99999 }] } });
  h.step();
  h.battle.applyStatus(e, 'fear', { duration: 3, source: h.unit(1) });
  h.step(3);
  assert.equal(h.battle._perPlayer.p1.layerGains.swiftShip, 4);
});
