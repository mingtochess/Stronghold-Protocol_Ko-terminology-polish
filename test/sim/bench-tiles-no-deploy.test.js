// test/sim/bench-tiles-no-deploy.test.js — the boss field's rect (rows 0–5) holds its bench rows (tile_achand, the level
// says buildable ALL): 에벤홀츠 S2 placed its 旧日残影 on the temporary bench. No battle placement may take a bench tile.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Grid } from '../../server/sim/grid.js';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const stage = require('../../content/production/data/stages.json').act1autochess_m02;
test('the bench rows are no deployable tiles inside the boss rect', () => {
  const g = new Grid({ ...stage, legend: stage.tiles }, { r0: 0, r1: 5, c0: 0, c1: 20 });
  for (const [r, c] of [[0, 2], [1, 5], [1, 13]]) {
    assert.equal(g.inRect(r, c), true);
    assert.equal(g.canStand(r, c, { ranged: true }), false, `bench (${r},${c})`);
  }
  assert.equal(g.canStand(4, 3, { ranged: true }), true, 'a field road tile still is');
});
