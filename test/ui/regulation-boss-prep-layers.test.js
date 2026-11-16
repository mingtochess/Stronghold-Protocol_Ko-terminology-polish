// 규정 보스전 준비 단계의 시점 전환: the 규정 (upstream) server publishes the boss pairs as pub.bossPairs (every round),
// the 맹약 server as pub.bossPairing (boss prep only) — the prep switch and the team panel read either.
import test from 'node:test';
import assert from 'node:assert/strict';
import { bossPairingOf, sameFieldmates } from '../../public/js/battle/observe.js';

const pairs = [['a', 'b'], ['c', 'd']];

test('a 규정 boss / hidden round prep uses pub.bossPairs', () => {
  for (const phase of ['ROUND_START', 'SP_DRAFT', 'PREP']) {
    assert.deepEqual(bossPairingOf({ phase, round: 7, bossRound: 7, hiddenRound: 8, bossPairs: pairs }), pairs);
    assert.deepEqual(bossPairingOf({ phase, round: 8, bossRound: 7, hiddenRound: 8, bossPairs: pairs }), pairs);
  }
  assert.deepEqual(sameFieldmates({ phase: 'PREP', round: 7, bossRound: 7, bossPairs: pairs }, 'c'), ['d']);
});

test('not outside a boss prep; the 맹약 field wins when present', () => {
  assert.deepEqual(bossPairingOf({ phase: 'PREP', round: 5, bossRound: 7, bossPairs: pairs }), []);
  assert.deepEqual(bossPairingOf({ phase: 'COMBAT', round: 7, bossRound: 7, bossPairs: pairs }), []);
  assert.deepEqual(bossPairingOf({ phase: 'PREP', round: 7, bossRound: 7, bossPairing: [['x', 'y']], bossPairs: pairs }), [['x', 'y']]);
});
