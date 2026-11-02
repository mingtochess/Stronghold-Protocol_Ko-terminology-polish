// test/ui/bond-board-solo.test.js — 独行 (downward: active with exactly 1) showed the lit board with 2+ members.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bondBoardProgress } from '../../public/js/ui/bondStrip.js';
import { sortBonds } from '../../public/js/ui/gameLogic.js';
test('独行 with 2 members: an unlit board; with 1: lit', () => {
  assert.deepEqual(bondBoardProgress([1], 2, false), { n: 1, t: 0 });
  assert.deepEqual(bondBoardProgress([1], 1, true), { n: 1, t: 1 });
  assert.deepEqual(bondBoardProgress([3, 5], 2, false), { n: 3, t: 2 }, 'an ordinary bond still counts toward its first threshold');
});
test('active bonds come before inactive ones whatever their stacks', () => {
  const s = sortBonds([{ bondId: 'a', active: false, layers: 9, count: 5 }, { bondId: 'b', active: true, layers: 0, count: 1 }]);
  assert.deepEqual(s.map((b) => b.bondId), ['b', 'a']);
});
