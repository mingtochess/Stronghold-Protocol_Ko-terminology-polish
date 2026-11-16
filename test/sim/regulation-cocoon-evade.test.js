// 규정 假想敌：茧 (normal + hidden): "每损失一定生命值时" — 伪装 starts once per HP step reached and runs out.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeBattle } from '../helpers/battleHarnessUpstream.js';
import * as enemiesMod from '../../server/sim-upstream/content/enemies.js';
import * as bossesMod from '../../server/sim-upstream/content/bosses.js';
import { getVersionData } from '../../server/data.js';

const V = getVersionData('act3autochess@V3_1');
const waitAt = (y, x) => ({ motion: 'WALK', start: [y, x], end: [y, x], steps: [{ t: 'wait', s: 99999 }] });
const fight = () => makeBattle({ content: 'generic', extraContent: [enemiesMod, bossesMod], seed: 1, autoFinish: false,
  timeLimit: 120, defs: { enemies: V.enemies }, units: [] });

for (const key of ['enemy_9035_acspider', 'enemy_9035_acspider_2']) test(`${key}: evade lapses after its duration, then re-arms at the next step`, () => {
  const h = fight();
  const s = h.spawn(key, { pos: [9, 8], route: waitAt(9, 8) });
  h.step(1);
  assert.equal(s.s.dodgePhys, 0, 'no evade at full HP');
  s.hp = s.s.maxHp * 0.74;
  h.step(1);
  const on = s.s.dodgePhys;
  assert.ok(on > 0, 'first step');
  h.run(16);
  assert.equal(s.s.dodgePhys, 0, 'gone after 15 s at the same HP');
  assert.equal(s.s.dodgeArts, 0);
  s.hp = s.s.maxHp * 0.49;
  h.step(1);
  assert.equal(s.s.dodgePhys, on, 'next step: the same value, not stacked');
});
