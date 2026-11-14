// 규정 8인 협동: the regulation season (upstream match) seats 8 in co-op; the shared boss pool counts up to 8 alive.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getVersionData } from '../../server/data.js';
import { makeMatch } from './harness.js';

test('regulation coop8: 8 seats play through the first rounds, boss share up to 8', (t) => {
  const data = getVersionData('act3autochess@V3_1');
  const h = makeMatch({ mode: 'coop8', data, version: 'act3autochess@V3_1', humans: 1, bots: 7, seed: 3 }).start();
  t.after(() => h.m.dispose());
  const m = h.m;
  m.handle('p_0', { t: 'g.autoplay', on: true });
  assert.equal(m.order.length, 8);
  assert.equal(m.gd.bossPoolShare(8), 8);
  assert.equal(m.gd.bossPoolShare(5), 5);
  h.drive(() => m.round >= 3);
  assert.ok(m.round >= 3);
});
