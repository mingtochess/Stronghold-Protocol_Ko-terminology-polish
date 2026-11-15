// 규정(规程) 전투 포기: the upstream match accepts g.endBattle like the fork's (it answered BAD_MSG before).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getVersionData } from '../../server/data.js';
import { makeMatch } from './harness.js';

const data = getVersionData('act3autochess@V3_1');
function combat(clientCombat) {
  const h = makeMatch({ mode: 'solo', modeId: 'mode_single_5', data, humans: 1, seed: 71, clientCombat, clients: false, instant: false }).start();
  h.m.handle('p_0', { t: 'g.autoplay', on: true });
  let guard = 0;
  h.drive(() => (h.m.phase === 'COMBAT' && h.m.fields.some((f) => f.live && !f.done)) || ++guard > 200000);
  return h;
}
for (const cc of [true, false]) test(`regulation solo (${cc ? 'client' : 'server'} combat): 전투 포기 ends the own field`, (t) => {
  const h = combat(cc); t.after(() => h.m.dispose());
  const f = h.m.fields.find((x) => x.players.includes('p_0'));
  assert.deepEqual(h.m.handle('p_0', { t: 'g.endBattle', fieldId: f.fieldId, gt: 0.5 }), { ok: true });
  h.run(() => f.done || h.m.phase !== 'COMBAT', { maxSteps: 20000 });
  assert.ok(f.done || h.m.phase !== 'COMBAT');
  assert.equal(h.m.handle('p_0', { t: 'g.endBattle', fieldId: 'foreign' }).error, 'WRONG_PHASE');
});
