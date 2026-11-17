// 凛御银灰 (garrison_227 act3autochess_gar_effect_bondstackmax, filter_bond_ids kjeragShip,skillfulShip): "身前一格【谢拉格】
// 【灵巧】干员每场战斗的叠层上限+75%" reaches 佩佩 (萨尔贡 / 灵巧, no 谢拉格) — any listed bond, not all of them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadData } from '../../server/data.js';
import { DataSource } from '../../server/sim-upstream/simdata.js';
import { makeBattle } from '../helpers/battleHarnessUpstream.js';
import { setGameData } from '../../server/sim-upstream/content/support/index.js';

test('凛御银灰 raises the per-battle cap of 佩佩 standing in front of it', () => {
  const V3 = loadData(new URL('../../data/versions/act3autochess-v3_1', import.meta.url).pathname, { log: { warn() {}, error() {}, info() {} } });
  setGameData(V3);
  const caps = (withSilverAsh) => {
    const units = [{ uid: 1, kind: 'chess', chessId: 'chess_char_5_06_a', row: 10, col: 6, skillIndex: 0 }];
    if (withSilverAsh) units.push({ uid: 2, kind: 'chess', chessId: 'chess_char_5_08_a', row: 10, col: 5, skillIndex: 0 });
    const bonds = Object.fromEntries(['sargonShip', 'skillfulShip', 'kjeragShip'].map((b) => [b, { layers: 1, active: true }]));
    const h = makeBattle({ seed: 1, autoFinish: false, timeLimit: 60, data: new DataSource(V3), flags: { dpInit: 0, dpPerSec: 0 },
      players: [{ playerId: 'p1', seat: 0, side: 'L', colOffset: 0, units, bonds, bandId: null, playerEffects: [] }] });
    h.step();
    return h.battle._garInstances.filter((i) => i.unit.uid === 1 && Number.isFinite(i.cap)).map((i) => i.cap);
  };
  const base = caps(false), boosted = caps(true);
  assert.ok(base.length > 0, '佩佩 has capped traits');
  assert.deepEqual(boosted, base.map((c) => Math.floor(c * 1.75)), `${base} → ${boosted}`);
});
