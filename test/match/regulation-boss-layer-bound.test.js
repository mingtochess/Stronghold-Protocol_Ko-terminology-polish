// 규정 boss fights keep their IN_BATTLE layer gains (bossRounds _finishFinal). The client-result check bounded them by a
// normal round's 60 + 4·round whatever the fight lasted: a long boss fight's result was rejected and ended as a synthetic
// one, so the layers it gained vanished after the fight (user report 2026-11-17). The bound now grows per started minute.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateClientResult } from '../../server/match-upstream/fields.js';
import { getVersionData } from '../../server/data.js';
import { makeMatch } from './harness.js';

test('a long 규정 boss fight may report more layers than a normal round', () => {
  const h = makeMatch({ data: getVersionData('act3autochess@V3_1'), version: 'act3autochess@V3_1', humans: 1, seed: 3 });
  const spec = (kind) => ({ kind, round: 14, timeLimit: kind === 'normal' ? 60 : null, spawns: [], flags: { layerGainsEnabled: true },
    boss: { poolHp: 1, poolMax: 1 }, players: [{ playerId: 'p_0', units: [], bonds: { kjeragShip: { count: 3, active: true, tier: 1, layers: 0 } } }] });
  const check = (kind, n, time) => validateClientResult(spec(kind), { reason: 'cleared', time, perPlayer: { p_0: { killed: 0, total: 0, leaked: [],
    perfect: true, layerGains: { kjeragShip: n }, coins: 0, bossDamage: 0, unitsEnd: [], unitStats: [] } } }, { gd: h.m.gd });
  assert.equal(check('boss', 130, 150).ok, true, '130 layers in a 150 s boss fight');
  assert.equal(check('hidden', 300, 150).ok, true);
  assert.equal(check('boss', 130, 60).reason, 'layer bound', 'still bounded per minute');
  assert.equal(check('normal', 130, 60).reason, 'layer bound', 'a normal round keeps 60 + 4·round');
  h.m.dispose?.();
});
