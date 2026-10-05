import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSnapshot,SnapshotBuffer} from '../../public/js/render/interp.js';
test('ammo counts have no cap and coexist with elemental gauges and status snapshots',()=>{
 const input={t:1,units:[[1,0,0,10,10,70,100,0,0]],ammo:[[1,217,300]],elem:[[1,'burn',.4,0,0]],states:[[1,['ab:refraction','ab:rage']]]};
 const n=normalizeSnapshot(input);assert.equal(n.units.get(1)[9],'burn');assert.equal(n.units.get(1)[13],217);assert.equal(n.units.get(1)[14],300);
 const b=new SnapshotBuffer();b.push(input,0);const s=b.sample(1).get(1);assert.equal(s.ammoMax,300);assert.equal(s.ammoLeft,217);assert.deepEqual(s.states,['ab:refraction','ab:rage']);
});
