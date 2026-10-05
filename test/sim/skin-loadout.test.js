import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeBattle,chessRec} from '../helpers/battleHarness.js';
import {unitInfo} from '../../server/sim/snapshot.js';
test('selected costume survives Battle construction and content installation',()=>{
 const rec={...chessRec({id:'costume_op'}),assets:{spine:'char_default',avatar:'char_default'},skins:[{id:'skin_test',assets:{spine:'skin_test',avatar:'skin_test',portrait:'skin_test'}}]};
 const h=makeBattle({autoFinish:false,defs:{chess:{costume_op:rec}},units:[{chessId:'costume_op',row:10,col:5,skinId:'skin_test'}]});
 h.step();const u=h.unit('costume_op');assert.ok(u);
 assert.equal(u.def.spine,'skin_test');assert.equal(unitInfo(u).spine,'skin_test');assert.equal(unitInfo(u).skinId,'skin_test');
});
