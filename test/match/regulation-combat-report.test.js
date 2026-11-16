// 규정: finished fields feed the result screen's 전투 통계 (players[].combatRounds), as in 맹약.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getVersionData } from '../../server/data.js';
import { makeMatch } from './harness.js';
import { buildResult } from '../../server/match-upstream/results.js';

test('regulation matches record combat rounds with unit stats', (t) => {
  const data = getVersionData('act3autochess@V3_1');
  const h = makeMatch({ data, version: 'act3autochess@V3_1', humans: 1, bots: 3, seed: 5 }).start();
  t.after(() => h.m.dispose());
  const m = h.m;
  m.handle('p_0', { t: 'g.autoplay', on: true });
  h.drive(() => m.round >= 3);
  const rounds = [...m.players.values()].flatMap((ps) => ps.combatRounds || []);
  assert.ok(rounds.length >= 4, 'rounds recorded for every player');
  const r = rounds.find((x) => x.units.length);
  assert.ok(r, 'a round with unit stats');
  assert.equal(r.available, true);
  assert.ok(r.totals.dmg > 0, 'damage');
  const res = buildResult(m, { victory: false, reason: 'defeat' });
  assert.ok(res.players.some((p) => p.combatRounds?.length), 'the result screen gets them');
});
