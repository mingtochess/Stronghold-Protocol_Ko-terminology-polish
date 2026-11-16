// 규정 지령 교체 드래프트(追随者们 / 投机骰子): every offered command is its strategy's FIRST row, so a command with an unlock
// condition (引星棘刺 【出航时刻】: 4 伊比利亚 / 琳琅诗怀雅 【最佳品味】: 60 funds spent) arrives locked, never unlocked or upgraded.
import test from 'node:test';
import assert from 'node:assert/strict';
import { getVersionData } from '../../server/data.js';
import { PracticeMatch } from '../../server/match-upstream/PracticeMatch.js';
import { openSkillChangeDraft, commandView } from '../../server/match-upstream/bandCommands.js';

const raw = getVersionData('act3autochess@V3_1');

test('the command draft offers only first rows; a picked locked command stays locked', async () => {
  const m = new PracticeMatch({ send() { return true; }, broadcast() {}, onEnd() {}, seed: 3, data: raw,
    seats: [{ seat: 0, playerId: 'p', name: 'P', isBot: false, connected: true }],
    practice: { stageId: 'act3autochess_m01', bandId: 'band_price', round: 1, factions: [], bannedBonds: [] } });
  m.start();
  for (let i = 0; i < 60 && m.phase !== 'PREP'; i++) await new Promise((r) => setTimeout(r, 200));
  const ps = m.players.get('p');
  const firstRows = new Set(Object.values(raw.bands).map((b) => b.skills?.[0]?.effectId).filter(Boolean));
  const seen = new Set();
  for (let i = 0; i < 40; i++) {
    ps.commandDrafts = [];
    assert.ok(openSkillChangeDraft(ps, 'skill_change_1'));
    for (const id of ps.commandDrafts[0]?.cards || []) { assert.ok(firstRows.has(id), `${id} is a first row`); seen.add(id); }
  }
  for (const id of ['aceffect_band_85', 'aceffect_band_54', 'aceffect_band_55', 'aceffect_band_89']) assert.ok(!seen.has(id), id);
  // pick 引星棘刺's locked row directly
  ps.commandDrafts = [{ id: 'command.t', choiceId: 'skill_change_1', cards: ['aceffect_band_84'] }];
  const r = ps.pickCommand('command.t', 0); assert.equal(r.ok, true, JSON.stringify(r) + m.phase);
  const v = commandView(ps);
  assert.equal(v.effectId, 'aceffect_band_84');
  assert.equal(v.reason, 'locked');
  assert.equal(v.usable, false);
  m.dispose?.();
});
