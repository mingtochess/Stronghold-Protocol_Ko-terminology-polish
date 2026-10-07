import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeBattle} from '../helpers/battleHarness.js';
test('Lancer charge animates against its running stride, not its very slow initial crawl',()=>{
 const h=makeBattle({enemies:[{key:'enemy_1072_dlancer',pos:[10,8]}],autoFinish:false});h.step();const e=h.enemies()[0];assert.ok(e);assert.equal(e.base.moveSpeed,.25);
 h.b.addBuff(e,{key:'test:charge',mods:{moveMul:13.5}});
 const s=h.b.snapshot();const rate=s.moveRates.find(([id])=>id===e.id)[1];assert.equal(rate,3.375);assert.equal(e.s.moveSpeed,3.375,'movement itself is unchanged');
 h.b.addBuff(e,{key:'test:slow',mods:{moveMul:.5}});assert.equal(h.b.snapshot().moveRates.find(([id])=>id===e.id)[1],rate*.5);
});
