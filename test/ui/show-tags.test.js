// 규정 {showtag_value_N}: never shown raw — the server's live value, else the record's start value, else 0
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fillShowTags, garrisonShowStart } from '../../public/js/ui/showTags.js';
import { parseRichText } from '../../public/js/ui/richText.js';

const text = (segs) => segs.map((s) => s.text || '').join('');

test('fillShowTags: live value, start value, then 0', () => {
  assert.equal(fillShowTags('(已刷新{showtag_value_1}次)', [3]), '(已刷新3次)');
  assert.equal(fillShowTags('获得{showtag_value_1}次免费刷新', null, [1]), '获得1次免费刷新');
  assert.equal(fillShowTags('+{showtag_value_1}', null), '+0');
  assert.deepEqual(garrisonShowStart({ effectKey: 'SERVER_GAIN_FREE_REFRESH_UPGRADE_COUNT', bb: { count: 1 } }), [1]);
});

test('rich text fills the placeholder (no raw {showtag_value_N} on screen)', () => {
  const raw = '<获得时>获得<@ba.vup>{showtag_value_1}</>次免费刷新';
  assert.ok(!text(parseRichText(raw)).includes('showtag'));
  assert.ok(text(parseRichText(raw, { values: [2] })).includes('获得2次'));
});
