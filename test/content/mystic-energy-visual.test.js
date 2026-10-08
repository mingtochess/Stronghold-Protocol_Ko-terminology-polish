import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeBattle,chessRec} from '../helpers/battleHarness.js';
import {unitInfo} from '../../server/sim/snapshot.js';
test('mystic charging emits animation/count updates and snapshots retain counts for spectators',()=>{
 const h=makeBattle({defs:{chess:{m:chessRec({id:'m',profession:'CASTER',subProfessionId:'mystic',skill:null,stats:{bat:1},rangeGrid:[[0,0],[0,1]]})}},units:[{chessId:'m',row:10,col:4}],content:'none',autoFinish:false,timeLimit:30});
 const u=h.unit('m');h.run(3.2);
 assert.equal(u.trait.stored,3);
 assert.equal(h.snapshot().energy[u.id],3);
 assert.equal(unitInfo(u).energy,3);assert.equal(unitInfo(u).energyMax,3);
 const events=h.events.filter(e=>e[0]==='energy');assert.deepEqual(events.map(e=>e[2]),[1,2,3]);assert.ok(events.every(e=>e[3]>0));
 h.run(2);assert.equal(h.events.filter(e=>e[0]==='energy').length,3,'full storage must idle rather than restart its charge animation');
 u.deployed=false;assert.equal(h.snapshot().energy[u.id],undefined);
});
