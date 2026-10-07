import {test} from 'node:test';import assert from 'node:assert/strict';
import {SnapshotBuffer} from '../../public/js/render/interp.js';
import {DamageEventGate} from '../../shared/damageDisplay.js';
import {makeBattle} from '../helpers/battleHarness.js';
test('three identical hits delivered three times produce three damage events, even after consumption',()=>{
 const b=new SnapshotBuffer(),events=[1,2,3].map(displayId=>['dmg',7,100,'phys',{displayId}]);
 assert.equal(b.pushEvents(events,0,1),3);assert.equal(b.pushEvents(structuredClone(events),0,1),0);
 assert.equal(b.takeEvents(1,[]).length,3);assert.equal(b.pushEvents(structuredClone(events),1,1),0);
 b.reset();assert.equal(b.pushEvents(events,2,1),3,'new field resets identity');
});
test('legacy events and genuine equal damage instances are never guessed to be duplicates',()=>{
 const gate=new DamageEventGate(2);assert.ok(gate.accept(['dmg',1,100,'phys']));assert.ok(gate.accept(['dmg',1,100,'phys']));
 for(const displayId of [1,2,3])assert.ok(gate.accept(['dmg',1,100,'phys',{displayId}]));assert.equal(gate.seen.size,2);
});
test('simulation assigns a distinct stable display ID to every damage instance',()=>{
 const h=makeBattle({content:'none',autoFinish:false});h.b.drainEvents();
 for(let i=0;i<3;i++)h.b._ev(['dmg',1,100,'phys',{critical:true}]);
 const events=h.b.drainEvents();assert.equal(new Set(events.map(e=>e[4].displayId)).size,3);assert.ok(events.every(e=>e[4].critical));
});
