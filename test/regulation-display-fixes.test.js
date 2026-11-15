// 규정 (act3autochess@V3_1) fixes of 2026-11-15: 맹약 추가 has no effect on a 규정 table, a boss whose route only waits
// is a fixed boss (its HP bar), and 假想敌：茧's 【悲惨之雨】 names the field it covers for the client.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { getVersionData, getData } from '../server/data.js';
import { applyCustomExtensions, customExtensionCatalog } from '../shared/customExtensions.js';
import { DataSource } from '../server/sim-upstream/simdata.js';
import { setGameData } from '../server/sim/content/support/index.js';
import { unitInfo } from '../server/sim-upstream/snapshot.js';
import { makeBattle, chessRec } from './helpers/battleHarnessUpstream.js';

const raw = getVersionData('act3autochess@V3_1');
after(() => setGameData(null));

test('규정: 맹약 추가 neither lists nor drops the official ursusShip (乌萨斯) / docShip (聚合)', () => {
  assert.deepEqual(customExtensionCatalog(raw).bonds, []);
  const out = applyCustomExtensions(raw, { bonds: [], stages: [] });
  assert.equal(Object.keys(out.bonds).length, Object.keys(raw.bonds).length);
  assert.ok(out.bonds.ursusShip && out.bonds.docShip);
  assert.equal(out.bonds.docShip.members.length, raw.bonds.docShip.members.length);
  // the 맹약 season keeps its option
  assert.ok(customExtensionCatalog(getData()).bonds.some((b) => b.id === 'ursus'));
});

function battle(enemies, extra = {}) {
  setGameData(raw);
  const data = new DataSource({ ...raw, chess: { ...raw.chess, t0: chessRec({ id: 't0', skill: null, stats: { maxHp: 1e7, atk: 0, def: 0 } }) } }, null);
  return makeBattle({ data, content: 'full', autoFinish: false, timeLimit: 60, enemies, ...extra,
    players: [{ playerId: 'p1', seat: 0, side: 'L', units: [{ uid: 1, kind: 'chess', chessId: 't0', row: 10, col: 4 }], bonds: {} }] });
}

test('a boss whose route only waits where it starts is sent as fixed; a patrolling one is not', () => {
  const fixed = battle([], { kind: 'boss', stageId: 'act3autochess_m01', waveTemplate: 'act3autochess_h07_09' });
  fixed.run(3);
  const spider = fixed.b.enemies.find((e) => e.defId === 'enemy_9035_acspider');
  assert.equal(unitInfo(spider).fixed, true);
  const walking = battle([], { kind: 'boss', stageId: 'act3autochess_m01', waveTemplate: 'act3autochess_h07_10' });
  walking.run(3);
  assert.equal(unitInfo(walking.b.enemies.find((e) => e.defId === 'enemy_9037_aceel')).fixed, undefined);
});

test('【悲惨之雨】 sends the field it covers (every ground / deployable tile) and its duration', () => {
  const h = battle([{ key: 'enemy_9035_acspider_2', time: 0, pos: { row: 3, col: 10 },
    route: { motion: 'WALK', start: [3, 10], end: [3, 10], steps: [{ t: 'wait', s: 999 }] } }]);
  const rains = [];
  const fx = h.b.fx.bind(h.b);
  h.b.fx = (k, o) => { if (k === 'acidRain') rains.push(o); return fx(k, o); };
  h.run(26);
  assert.equal(rains.length, 1, 'cast once at its initial cooldown (25 s)');
  const { tiles, dur } = rains[0];
  assert.equal(dur, 25);
  assert.ok(tiles.length >= 2 && tiles.length % 2 === 0);
  for (let i = 0; i < tiles.length; i += 2) {
    const t = h.b.grid.tile(tiles[i], tiles[i + 1]);
    assert.ok(t.pass === 'ALL' || t.build !== 'NONE', 'no wall tile');
  }
  assert.ok(h.b.allies()[0].buffs.some((b) => b.key === 'reg:acid' && b.visible), 'the unit status the client draws');
});
