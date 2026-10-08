import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeBattle, chessRec } from '../helpers/battleHarness.js';

for (const realSkadi of [false, true]) for (const status of ['stun', 'freeze', 'sleep']) {
  test(`${realSkadi ? 'Skadi the Corrupting Heart' : 'bard'} regenerates through ${status}, stops after withdrawal`, () => {
    const id = realSkadi ? 'chess_char_6_04_a' : 'test_bard';
    const h = makeBattle({
      defs: { chess: {
        test_bard: chessRec({ id: 'test_bard', profession: 'SUPPORT', subProfessionId: 'bard', attackKind: 'none', dmgType: 'heal', skill: null, rangeGrid: [[0,0],[-1,0]], stats: { atk: 1000 } }),
        test_ally: chessRec({ id: 'test_ally', profession: 'WARRIOR', skill: null, stats: { maxHp: 30000, atk: 0 } }),
      } },
      units: [{ chessId: id, row: 11, col: 4 }, { chessId: 'test_ally', row: 10, col: 4 }],
      ...(realSkadi ? {} : { content: 'none' }), autoFinish: false, timeLimit: 30,
    });
    h.step();
    const u = h.unit(id), a = h.unit('test_ally');
    a.hp = a.s.maxHp / 2;
    h.run(1);
    assert.equal(h.b.applyStatus(u, status, { duration: 10 }), true);
    assert.equal(u.canAct, false);
    h.run(2); // Let the aura applied before the status expire unless refreshed.
    const before = a.hp;
    h.run(2);
    assert.ok(a.hp > before, 'passive regeneration is still refreshed while disabled');
    assert.ok(a.findBuff(`trait:bard:${u.id}`)?.mods.hpRegen > 0);
    u.deployed = false;
    h.run(2);
    const after = a.hp;
    h.run(2);
    assert.equal(a.hp, after, 'no lingering regeneration after withdrawal and aura expiry');
    assert.equal(a.findBuff(`trait:bard:${u.id}`), null);
  });
}
