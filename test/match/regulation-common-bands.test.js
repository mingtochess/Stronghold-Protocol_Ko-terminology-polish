// 규정 커스텀 공통 적용 전략(customRules.commonBands): a 规程 strategy's passive command row runs for every player,
// apart from the player's own command; ACTIVE command strategies are not offered as common strategies.
import test from 'node:test';
import assert from 'node:assert/strict';
import { getVersionData } from '../../server/data.js';
import { PracticeMatch } from '../../server/match-upstream/PracticeMatch.js';
import { seasonExtensionCatalog, seasonExtensionSelection, applySeasonExtensions } from '../../shared/seasonExtensions.js';

const raw = getVersionData('act3autochess@V3_1');

async function prep(commonBands, bandId = 'band_sarkazb') {
  const sel = seasonExtensionSelection({ commonBands }, raw);
  const data = applySeasonExtensions(raw, sel);
  const m = new PracticeMatch({ send() { return true; }, broadcast() {}, onEnd() {}, seed: 1, data, seasonExtensions: sel, gameplayMode: 'custom',
    seats: [{ seat: 0, playerId: 'p', name: 'P', isBot: false, connected: true }],
    practice: { stageId: 'act3autochess_m01', bandId, round: 3, factions: [], bannedBonds: [] } });
  m.start();
  for (let i = 0; i < 60 && m.phase !== 'PREP'; i++) await new Promise((r) => setTimeout(r, 200));
  const ps = m.players.get('p');
  const items = [...ps.hand, ...ps.board.values(), ...(ps.temp || [])].filter((p) => p?.kind === 'item').length;
  m.dispose?.();
  return { phase: m.phase, items };
}

test('common 奥达 (passive command row) grants its round-3 equipment, alone and next to the own copy', async () => {
  const none = await prep([]);
  const common = await prep(['band_smith']);
  const both = await prep(['band_smith'], 'band_smith');
  assert.equal(none.phase, 'PREP');
  assert.equal(common.items, none.items + 1);
  assert.equal(both.items, none.items + 2);
});

test('ACTIVE command strategies are not offered as 규정 common strategies', () => {
  const ids = seasonExtensionCatalog(raw).commonBands.map((e) => e.id);
  for (const id of ['band_smith', 'band_takecare', 'band_cannot', 'band_amiya']) assert.ok(ids.includes(id), id);
  for (const id of ['band_price', 'band_copy', 'band_jenga', 'band_random']) assert.ok(!ids.includes(id), id);
});

test('a 규정 custom room shows its selection in m.public (전략 중복 선택 on the strategy draft screen); classic does not', () => {
  const sel = seasonExtensionSelection({ rules: ['duplicateBands'] }, raw);
  const mk = (ext) => new PracticeMatch({ send() { return true; }, broadcast() {}, onEnd() {}, seed: 1, data: ext ? applySeasonExtensions(raw, sel) : raw,
    ...(ext ? { seasonExtensions: sel, gameplayMode: 'custom' } : {}),
    seats: [{ seat: 0, playerId: 'p', name: 'P', isBot: false, connected: true }],
    practice: { stageId: 'act3autochess_m01', bandId: 'band_sarkazb', round: 1, factions: [], bannedBonds: [] } });
  const custom = mk(true), classic = mk(false);
  assert.ok(custom.publicView().customExtensions.rules.includes('duplicateBands'));
  assert.equal(custom.publicView().gameplayMode, 'custom');
  assert.equal(classic.publicView().customExtensions, undefined);
  custom.dispose?.(); classic.dispose?.();
});
