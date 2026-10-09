import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadData } from '../../server/data.js';
import { GameData } from '../../server/match/gamedata.js';
import { pieceBonds } from '../../server/match/bondsMeta.js';
import { morphPairings, grantedBonds } from '../../public/js/ui/gameLogic.js';
import { makeBattle, chessRec } from '../helpers/battleHarness.js';
import { unitBonds, setGameData } from '../../server/sim/content/support/index.js';
const data = loadData(new URL('../../content/production/data/', import.meta.url).pathname);
const iso = 'chess_item_6_09_e_a';
for (const [suffix, bonus] of [['a', .15], ['b', .25]]) {
  test(`production cutlass ${suffix}: talent pairing, prep membership, combat membership and stats`, () => {
    const cutlass = `chess_item_custom_ursus_${suffix}`;
    const carried = [iso, cutlass];
    const row = morphPairings(Object.values(data.items), Object.values(data.bonds), { carried }).find(r => r.bondId === 'ursusShip');
    assert.ok(row?.worn);
    assert.deepEqual(row.items, [{ id: 'chess_item_custom_ursus_a', name: '우르수스 곡도', worn: true }]);
    assert.deepEqual(grantedBonds(carried, id => data.items[id]), ['ursusShip']);
    const raw = { ...data, chess: { ...data.chess, guard: chessRec({ id: 'guard', bonds: [], skill: null, stats: { maxHp: 1000, atk: 100 } }) } };
    assert.ok(pieceBonds(new GameData(raw), { id: 'guard', items: carried.map(id => ({ id })) }).includes('ursusShip'));
    setGameData(raw);
    try {
    const h = makeBattle({ data: raw, units: [{ chessId: 'guard', row: 10, col: 3, items: carried }], autoFinish: false });
    h.run(1);
    assert.ok(unitBonds(h.unit('guard')).includes('ursusShip'));
    assert.equal(h.unit('guard').s.maxHp, 1000 * (1 + bonus));
    assert.equal(h.unit('guard').s.atk, 100 * (1 + bonus));
    assert.equal(h.b.errorCount, 0);
    assert.ok(!data.items[iso].desc.includes('우르수스 곡도'));
    } finally { setGameData(null); }
  });
}
