// 규정: the Final Assault / Hidden Core run IN_BATTLE traits with their layer gains, as a normal round does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getVersionData } from '../../server/data.js';
import { makeMatch } from './harness.js';

test('regulation boss fields enable IN_BATTLE layer gains', (t) => {
  const data = getVersionData('act3autochess@V3_1');
  const h = makeMatch({ data, version: 'act3autochess@V3_1', humans: 1, bots: 3, seed: 5 }).start();
  t.after(() => h.m.dispose());
  const m = h.m, specs = [];
  const nb = m.newBattle.bind(m);
  m.newBattle = (o) => { specs.push(o); return nb(o); };
  m.handle('p_0', { t: 'g.autoplay', on: true });
  m.startRound(m.gd.bossRound);
  h.drive(() => specs.some((o) => o.kind === 'boss'));
  const boss = specs.filter((o) => o.kind === 'boss');
  assert.ok(boss.length > 0, 'a boss field was built');
  for (const o of boss) assert.equal(o.flags.layerGainsEnabled, true);
});

test('regulation: a fighting player can watch the other group\'s boss field', (t) => {
  const data = getVersionData('act3autochess@V3_1');
  const h = makeMatch({ data, version: 'act3autochess@V3_1', humans: 1, bots: 3, seed: 5 }).start();
  t.after(() => h.m.dispose());
  const m = h.m, ps = m.players.get('p_0');
  m.handle('p_0', { t: 'g.autoplay', on: true });
  m.startRound(m.gd.bossRound);
  h.drive(() => m.fields.some((f) => f.kind === 'boss'));
  const other = m.fields.find((f) => f.kind === 'boss' && !f.players.includes('p_0'));
  assert.ok(other, 'two boss groups');
  assert.equal(m.watch(ps, other.fieldId).ok ?? true, true);
  assert.equal(m.watchers.get('p_0'), other.fieldId);
});
