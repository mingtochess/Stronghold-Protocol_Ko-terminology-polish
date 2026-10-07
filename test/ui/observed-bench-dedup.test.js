import {test} from 'node:test';import assert from 'node:assert/strict';
import {observedBenchExtras} from '../../public/js/battle/observedBench.js';
const op={uid:1,kind:'chess'},item={uid:2,kind:'item'},temp={uid:3,kind:'token'};
const bench={playerId:'p2',pieces:[op,null,item],tempPieces:[temp]};
test('scouted hand operators, equipment and temporary units render once',()=>{
 const units=[op,item,temp].map(p=>({uid:p.uid,ownerId:'p2'}));
 const extras=observedBenchExtras(bench,units);
 assert.deepEqual(extras.pieces,[null,null,null]);assert.deepEqual(extras.tempPieces,[null]);
 assert.deepEqual(bench.pieces,[op,null,item],'packet remains unchanged');
});
test('shared-field prep keeps omitted bench pieces and their original slots',()=>{
 const extras=observedBenchExtras(bench,[{uid:1,ownerId:'p1'},{uid:99,ownerId:'p2'}]);
 assert.deepEqual(extras,bench,'different owners may reuse piece IDs');
});
test('stale bench packet cannot duplicate a piece already moved onto the field',()=>{
 const extras=observedBenchExtras(bench,[{uid:1,ownerId:'p2',x:3,y:10}]);
 assert.deepEqual(extras.pieces,[null,null,item]);assert.deepEqual(extras.tempPieces,[temp]);
});
test('repeated packets and duplicate entries do not accumulate extra copies',()=>{
 const duplicate={...bench,tempPieces:[op,temp,temp]};
 const first=observedBenchExtras(duplicate,[]);assert.deepEqual(first.tempPieces,[null,temp,null]);
 assert.deepEqual(observedBenchExtras(duplicate,[]),first);
 assert.equal(observedBenchExtras(null,[]),null);
});
