import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeBattle } from '../helpers/battleHarness.js';

for (const key of ['enemy_9017_achunt', 'enemy_9017_achunt_2']) {
  test(`${key}: first successful attack gains a stack before computing the next interval`, () => {
    const h = makeBattle({units:[{chessId:'chess_char_1_10_a',row:10,col:5}],captureNoisy:true,autoFinish:false});
    h.run(.5);
    const ally = h.allies()[0];
    ally.base.maxHp = 1e8; ally.hp = 1e8; ally.profile.noAttack = true; ally.markDirty();
    const enemy = h.spawn(key, {pos:[10,6]});
    enemy.base.moveSpeed = 0; enemy.markDirty();
    const attacks = [];
    h.b.on('attack', c => { if (c.attacker === enemy) attacks.push({time:h.b.time,aspd:enemy.s.aspd}); });
    h.run(9);
    assert.deepEqual(attacks.slice(0,3).map(a=>a.aspd), [80,160,240]);
    assert.ok(Math.abs(attacks[1].time-attacks[0].time-4.5*100/80)<.04);
    assert.ok(Math.abs(attacks[2].time-attacks[1].time-4.5*100/160)<.04);
  });
}
