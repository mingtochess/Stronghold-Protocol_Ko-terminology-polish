// 규정(规程) 증강 모드: the match offers augments from round 4 and the picked effects reach the upstream battle.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getVersionData } from '../../server/data.js';
import { DataSource } from '../../server/sim-upstream/simdata.js';
import { setGameData } from '../../server/sim-upstream/content/support/index.js';
import { makeBattle } from '../helpers/battleHarnessUpstream.js';
import { makeMatch } from './harness.js';
import { gameplayExtensions } from '../../shared/gameplayModes.js';

const data = getVersionData('act3autochess@V3_1');

test('regulation co-op in augment mode: offers from round 4, the picks are held', (t) => {
  const ext = gameplayExtensions(null, data, 'coop', 'augment');
  const h = makeMatch({ mode: 'coop', data, humans: 1, bots: 1, seed: 5, gameplayMode: 'augment', customExtensions: ext }).start();
  t.after(() => h.m.dispose());
  const m = h.m;
  m.handle('p_0', { t: 'g.autoplay', on: true });
  assert.ok(m.augments, 'an AugmentMode');
  const offered = [];
  let guard = 0;
  h.drive(() => { if (m.augments.current && offered.at(-1) !== m.round) offered.push(m.round); return m.round >= 8 || ++guard > 200000; });
  assert.equal(offered[0], 4);
  assert.ok(m.augments.privateView(m.players.get('p_0')).selected.length >= 1);
});

test('a regulation stat augment changes the battle (DEF +45%)', () => {
  setGameData(data);
  const def = (augments) => {
    const h = makeBattle({ data: new DataSource(data), content: 'full', autoFinish: false, timeLimit: 10, stageId: 'act3autochess_m01',
      flags: augments ? { augments } : {}, players: [{ playerId: 'p1', seat: 0, side: 'L', units: [{ uid: 1, kind: 'chess', chessId: 'chess_char_1_02_a', row: 9, col: 3 }], bonds: {} }] });
    h.run(1);
    return h.unit(1).s.def;
  };
  const base = def(null);
  const up = def({ allies: { p1: [{ id: 'augment_ally_prism_37', effect: { kind: 'stats', mods: { defPct: 0.45 } } }] }, enemies: [], enemyHpMultiplier: 1, enemyAtkMultiplier: 1, enemyDefMultiplier: 1, enemyResBonus: 0 });
  assert.ok(Math.abs(up - base * 1.45) < 1e-6, `${base} → ${up}`);
  setGameData(null);
});
