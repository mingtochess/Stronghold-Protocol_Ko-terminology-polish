// 규정 자선 편성에 더한 콜라보 오퍼레이터(오블리비온스, 유키 마코토: tools/add-diy-picks.mjs, kits ops/op-oblvns.js ·
// ops/op-makoto.js — the 맹약 kits as they are) fight in the 규정 engine: every skill, tier 5 / 6, normal and elite, fielded
// the production way (a DIY slot + its pick), damage the enemies in range and break no invariant.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { getVersionData } from '../../server/data.js';
import { DataSource } from '../../server/sim-upstream/simdata.js';
import { setGameData } from '../../server/sim/content/support/index.js';
import { makeBattle, enemyRec } from '../helpers/battleHarnessUpstream.js';
import { KITTED_CHARS } from '../../server/sim-upstream/content/kits/index.js';
import { diyPool } from '../../shared/diy.js';

const raw = getVersionData('act3autochess@V3_1');
after(() => setGameData(null));
const PICKS = ['char_4182_oblvns', 'char_4217_makoto'];

test('both are owned 自选 picks of tiers 5 and 6 with a kit', async () => {
  const kitted = await (typeof KITTED_CHARS === 'function' ? KITTED_CHARS() : KITTED_CHARS);
  for (const id of PICKS) {
    assert.ok(new Set(kitted).has(id), `${id} kitted`);
    for (const tier of [5, 6]) assert.ok(diyPool(tier, { data: raw, kitted }).includes(id), `${id} in the tier ${tier} pool`);
  }
});

for (const charId of PICKS) for (const tier of [5, 6]) for (const elite of [false, true]) for (const skillIndex of [0, 1, 2]) {
  test(`${charId} tier ${tier} ${elite ? 'elite' : 'normal'} S${skillIndex + 1}: deals damage in a 40 s fight`, () => {
    setGameData(raw);
    const data = new DataSource({ ...raw, enemies: { ...raw.enemies, test_enemy: enemyRec({ key: 'test_enemy', hp: 1e7, speed: 0 }) } }, null);
    const h = makeBattle({ data, content: 'full', autoFinish: false, timeLimit: 45,
      units: [{ uid: 1, diy: { slot: tier, charId, skillIndex }, elite, row: 9, col: 9, dir: 'RIGHT' }],
      enemies: [0, 1, 2].map((i) => ({ key: 'test_enemy', time: 0, pos: { row: 10, col: 6 + i } })) });
    h.run(40);
    const lost = h.enemies().reduce((n, e) => n + (e.s.maxHp - e.hp), 0);
    assert.ok(lost > 0, `damage dealt ${lost}`);
    const inv = h.invariants?.(); assert.ok(inv === true || (Array.isArray(inv) && !inv.length), `invariants ${JSON.stringify(inv)}`);
  });
}
