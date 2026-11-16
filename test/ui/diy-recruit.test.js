// 규정 선발 설정 in the 맹약 선발 layout (public/js/ui/diyRecruit.js): candidates per operator, picks into the 自选 slots.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { diyCandidates, diySelect, diyChoice, diycId } from '../../public/js/ui/diyRecruit.js';

const read = (n) => JSON.parse(readFileSync(new URL(`../../data/versions/act3autochess-v3_1/${n}.json`, import.meta.url), 'utf8'));
const data = { chess: read('chess'), backups: read('backups') };

test('every pickable operator is one candidate; picks become slots and selected entries', () => {
  const { bases } = diyCandidates(data, null, {});
  const ids = new Set(bases.map((b) => b.charId));
  for (const c of ['char_003_kalts', 'char_4182_oblvns', 'char_4217_makoto']) assert.ok(ids.has(c), c);
  let r = diySelect({}, data, 'char_003_kalts', 6);
  assert.ok(r.ok);
  r = diySelect(r.picks, data, 'char_4217_makoto', 5);
  const { entries } = diyCandidates(data, null, r.picks);
  assert.ok(entries[diycId('char_003_kalts', 6)]?.selected);
  assert.ok(entries[diycId('char_4217_makoto', 5)]?.selected);
  // moving an operator to the other tier frees its slot; 선발 안 함 removes it
  const moved = diySelect(r.picks, data, 'char_003_kalts', 5).picks;
  assert.deepEqual(Object.values(moved).map((p) => p.charId).sort(), ['char_003_kalts', 'char_4217_makoto']);
  assert.equal(Object.keys(diySelect(moved, data, 'char_003_kalts', 0).picks).length, 1);
  // the detail's skill choice writes the slot's skillIndex
  const chosen = diyChoice(moved, data, 'char_4217_makoto', 5, { skill: 0 });
  assert.equal(Object.values(chosen).find((p) => p.charId === 'char_4217_makoto').skillIndex, 0);
});

test('six candidates per tier at most', () => {
  let picks = {};
  const pool = diyCandidates(data, null, {}).bases.filter((b) => !b.recruitReserve).map((b) => b.charId);
  for (const id of pool.slice(0, 6)) picks = diySelect(picks, data, id, 6).picks;
  assert.equal(diySelect(picks, data, pool[6], 6).ok, false);
});

test('diyDrop: the 후보 X removes the operator from that tier only', async () => {
  const { diyDrop, slotOf } = await import('../../public/js/ui/diyRecruit.js');
  const r = diySelect({}, data, 'char_003_kalts', 5);
  assert.ok(r.ok && slotOf(r.picks, data, 'char_003_kalts', 5));
  assert.equal(slotOf(diyDrop(r.picks, data, 'char_003_kalts', 5), data, 'char_003_kalts', 5), null);
  assert.deepEqual(diyDrop(r.picks, data, 'char_003_kalts', 6), r.picks, 'another tier: unchanged');
});

test('no prototype is offered as a 선발 candidate', async () => {
  const { isPrototypePick } = await import('../../shared/diy.js');
  const { bases } = diyCandidates(data, null, {});
  assert.ok(bases.length > 0);
  for (const b of bases) assert.ok(!isPrototypePick(data, b.tier, b.charId), b.charId);
  assert.ok(!bases.some((b) => b.charId === 'char_617_sharp2' || b.charId === 'char_601_cguard'));
});

test('a skill / module chosen before picking is remembered, shown and used when the operator is picked', async () => {
  const { diyChoicePrefs, preferredPick, slotOf } = await import('../../public/js/ui/diyRecruit.js');
  const { pickChoices } = await import('../../public/js/ui/diyModel.js');
  const base = diyCandidates(data, null, {}).bases.find((r) => !r.recruitPrototype && r.diySlotTier === 5);
  assert.ok(base, 'an owned 5단계 candidate');
  const charId = base.charId;
  const slot = Object.keys(data.backups.diy.slots).find((id) => data.backups.diy.slots[id].tier === 5);
  const ch = pickChoices(charId, slot, data);
  const skill = ch.skills[0].index;
  const module = ch.modules.length ? ch.modules[0].uniEquipId : null;
  // not picked yet: diyChoice has no slot to change, the choice goes to the prefs
  assert.deepEqual(diyChoice({}, data, charId, 5, { skill }), {});
  const prefs = diyChoicePrefs({}, charId, { skill, module });
  const cands = diyCandidates(data, null, {}, prefs);
  assert.equal(cands.entries[diycId(charId, 5)]?.skill, skill, 'shown on the card');
  assert.equal(preferredPick(charId, slot, data, prefs).skillIndex, skill);
  const r = diySelect({}, data, charId, 5, prefs);
  assert.ok(r.ok);
  const held = slotOf(r.picks, data, charId, 5);
  assert.equal(r.picks[held].skillIndex, skill, 'the picked slot starts with the remembered skill');
  assert.equal(r.picks[held].uniEquipId ?? null, module);
  assert.deepEqual(diyChoicePrefs(prefs, charId, null), {}, 'reset forgets it');
});
