// 규정 8인 협동: the regulation season (upstream match) seats 8 in co-op; the shared boss pool counts up to 8 alive.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getVersionData } from '../../server/data.js';
import { makeMatch } from './harness.js';
import { generateDraft } from '../../server/match-upstream/choices.js';
import { GameData } from '../../server/match-upstream/gamedata.js';
import { createRng } from '../../server/sim-upstream/rng.js';
import { withCoopEight } from '../../shared/cooperativeEight.js';

test('regulation coop8: 8 seats play through the first rounds, boss share up to 8', (t) => {
  const data = getVersionData('act3autochess@V3_1');
  const h = makeMatch({ mode: 'coop8', data, version: 'act3autochess@V3_1', humans: 1, bots: 7, seed: 3 }).start();
  t.after(() => h.m.dispose());
  const m = h.m;
  m.handle('p_0', { t: 'g.autoplay', on: true });
  assert.equal(m.order.length, 8);
  assert.equal(m.gd.bossPoolShare(8), 8);
  assert.equal(m.gd.bossPoolShare(5), 5);
  assert.equal(m.publicView().mode, 'coop8');
  assert.deepEqual(m.disabledBonds, [], '8인: no random bans');
  const unite = [];
  const opts = m._uniteOpts.bind(m);
  m._uniteOpts = (plan, limit) => { const o = opts(plan, limit); unite.push({ o, limit, base: m.wave.timeLimit }); return o; };
  h.drive(() => m.round >= 3);
  assert.ok(m.round >= 3);
  assert.ok(unite.length > 0);
  for (const { o, limit, base } of unite) {
    assert.match(o.stageId, /^coop8_unite_/);
    assert.equal(o.rect.c1, 36);
    assert.ok(m.gd.stage(o.stageId), 'the joined stage is in the match data');
    assert.equal(limit, base * 4);
    assert.ok(o.players.length <= 4);
  }
  assert.ok(unite.some((u) => u.o.players.length > 2), 'more than two helpers');
});

test('regulation coop8: 9 reward cards, communication items 1 cheaper', () => {
  const data = getVersionData('act3autochess@V3_1');
  const gd4 = new GameData(data, 'mode_multi_normal'), gd8 = new GameData(withCoopEight(data), 'mode_multi_normal');
  const r = gd8.spRounds()[0];
  const d = generateDraft(gd8, createRng(1), r);
  assert.equal(d.cards.length, 9);
  for (const id of ['chess_item_2_06_e_a', 'chess_item_4_01_e_a', 'chess_item_5_04_e_a']) if (gd4.item(id)) assert.equal(gd8.itemPrice(id), Math.max(0, gd4.itemPrice(id) - 1));
});
