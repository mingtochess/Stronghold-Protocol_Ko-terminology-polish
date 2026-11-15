// 규정(规程) browser-local laboratory / practice (server/match-upstream/LaboratoryMatch.js, PracticeMatch.js) on 规程·序列Ⅰ.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getVersionData } from '../../server/data.js';
import { LaboratoryMatch, regulationMode } from '../../server/match-upstream/LaboratoryMatch.js';
import { PracticeMatch } from '../../server/match-upstream/PracticeMatch.js';
import { LAB_DUMMY_BOSS } from '../../shared/laboratoryDummy.js';

const data = getVersionData('act3autochess@V3_1');
const seats = [{ seat: 0, playerId: 'p', name: 'P', isBot: false, connected: true }];
const cb = { send() { return true; }, broadcast() {}, onEnd() {} };
const stageId = 'act3autochess_m01';
const bandId = Object.keys(data.bands).find((b) => b !== 'band_random');

test('regulationMode: the first level of that difficulty, else the fallbacks', () => {
  assert.equal(regulationMode(data.config, 'SINGLE', 'NORMAL'), 'mode_single_5');
  assert.equal(regulationMode(data.config, 'MULTI', 'HARD'), 'mode_multi_hard');
  assert.equal(regulationMode(data.config, 'SINGLE', 'NOPE'), 'mode_single_5');
});

test('regulation laboratory: the boss round, no core-group pick, a free operator from g.labGain', (t) => {
  const m = new LaboratoryMatch({ ...cb, seats, seed: 1, data, laboratory: { stageId, bossId: LAB_DUMMY_BOSS, bandId, kind: 'boss', players: 1 } });
  t.after(() => m.dispose?.());
  m.start();
  assert.equal(m.round, m.gd.bossRound);
  assert.equal(m.bondChoice, null);
  m.phase = 'PREP';
  const ps = m.players.get('p');
  const id = 'chess_char_1_02_a';
  assert.deepEqual(m.handle('p', { t: 'g.labGain', kind: 'chess', id }), { ok: true });
  assert.ok(ps.hand.some((x) => x?.id === id));
});

test('regulation practice: starts at the chosen round with exactly the chosen bans', (t) => {
  const ban = Object.keys(data.bonds).find((b) => data.bonds[b].weight > 0);
  const m = new PracticeMatch({ ...cb, seats, seed: 1, data, practice: { stageId, bandId, round: 3, factions: [], bannedBonds: [ban] } });
  t.after(() => m.dispose?.());
  m.start();
  assert.equal(m.round, 3);
  assert.deepEqual(m.disabledBonds, [ban]);
  assert.equal(m.bondChoice, null);
});
