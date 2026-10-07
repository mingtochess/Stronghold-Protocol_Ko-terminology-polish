import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeBattle,enemyRec} from '../helpers/battleHarness.js';

test('snapshot reports final enemy movement ratio for buffs and clears it after removal',()=>{
 const h=makeBattle({defs:{enemies:{walker:enemyRec({key:'walker',speed:2})}},autoFinish:false});
 const u=h.b.spawnEnemy('walker',{pos:[10,8]});assert.ok(u);
 assert.equal(h.b.snapshot().moveRates,undefined);
 h.b.addBuff(u,{key:'test:slow',mods:{moveMul:.2}});
 assert.deepEqual(h.b.snapshot().moveRates,[[u.id,.2]]);
 h.b.removeBuff(u,'test:slow');
 h.b.addBuff(u,{key:'test:fast',mods:{moveMul:1.5,moveFlat:1}});
 assert.deepEqual(h.b.snapshot().moveRates,[[u.id,2.25]]);
 h.b.removeBuff(u,'test:fast');assert.equal(h.b.snapshot().moveRates,undefined);
});
