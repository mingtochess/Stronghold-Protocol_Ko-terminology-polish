// 규정 커스텀 공통 적용 전략 鸭爵 「神秘顾客」: a common strategy swaps every player's enemies (the global handler read only
// the players' own strategies), and team strategy effects (matchBands) count the common strategies too.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getVersionData } from '../../server/data.js';
import { makeMatch } from './harness.js';
import { seasonExtensionCatalog, seasonExtensionSelection, applySeasonExtensions } from '../../shared/seasonExtensions.js';

const raw = getVersionData('act3autochess@V3_1');

test('common 鸭爵 swaps enemies in a 규정 match where nobody holds it', () => {
  assert.ok(seasonExtensionCatalog(raw).commonBands.some((e) => e.id === 'band_ducklord'), 'offered as a common strategy');
  const sel = seasonExtensionSelection({ commonBands: ['band_ducklord'] }, raw);
  const data = applySeasonExtensions(raw, sel);
  const h = makeMatch({ data, version: 'act3autochess@V3_1', humans: 2, bots: 0, seed: 5 }).start();
  h.autoHumans();
  const m = h.m;
  h.drive(() => m.phase === 'PREP' && m.round === 2);
  m.round = 6; // 「从第5回合起」: the draw reads the round only
  const ps = m.alivePlayers();
  assert.ok(ps.every((p) => p.bandId !== 'band_ducklord'));
  let swapped = 0, matchBands = null;
  const seed0 = m.seed;
  for (let k = 0; k < 20; k++) {
    m.seed = seed0 + k;
    const opts = m._normalOpts(ps[0]);
    swapped += opts.spawns.filter((s) => s.tag === 'duck').length;
    matchBands = opts.players[0].contentInfo?.matchBands;
  }
  m.seed = seed0;
  h.m.dispose?.();
  assert.ok(swapped > 0, 'some enemies became 鸭爵 enemies');
  assert.ok(matchBands.includes('band_ducklord'), 'matchBands carries the common strategy');
});
