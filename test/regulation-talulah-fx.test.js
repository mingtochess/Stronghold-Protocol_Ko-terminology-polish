// 규정 탈룰라(塔露拉, chess_char_6_16 → op-oxi kit) S3: every 簇火 announces its flight and its hit with the display fx the
// renderer's official trail reads (render/vfx/northernfx.js talulahWave / talulahWaveHit; the 맹약 kit's names).
import test from 'node:test';
import assert from 'node:assert/strict';
import { getVersionData, setData } from '../server/data.js';

setData(getVersionData('act3autochess@V3_1'));
const { makeBattle, enemyRec } = await import('./helpers/battleHarnessUpstream.js');

test('Talulah S3 fireballs emit talulahWave per shot and talulahWaveHit on impact', () => {
  const walk = enemyRec({ key: 'enemy_walk', hp: 40000, atk: 0, speed: 0.7, mass: 0 });
  const h = makeBattle({ defs: { enemies: { enemy_walk: walk } }, timeLimit: 600, autoFinish: false, seed: 7,
    units: [{ uid: 1, chessId: 'chess_char_6_16_b', row: 10, col: 5, dir: 'RIGHT' }],
    enemies: [{ key: 'enemy_walk', time: 0, route: 0, count: 6, interval: 1 }] });
  h.step();
  assert.equal(h.unit(1)?.def?.charId, 'char_4247_oxi');
  h.run(60);
  const fx = h.events.filter((e) => e[0] === 'fx');
  const waves = fx.filter((e) => e[1] === 'talulahWave').map((e) => e[4]);
  const hits = fx.filter((e) => e[1] === 'talulahWaveHit').map((e) => e[4]);
  assert.ok(waves.length > 0, 'shots fly');
  assert.ok(hits.length > 0, 'shots hit');
  for (const w of waves) assert.ok(Number.isInteger(w.wave) && Number.isFinite(w.lane) && w.speed > 0 && w.dur > 0 && w.src === w.id);
  for (const k of hits) assert.ok(waves.some((w) => w.wave === k.wave && w.lane === k.lane), 'a hit closes its own trail');
  assert.equal(h.b.errors.length, 0);
});
