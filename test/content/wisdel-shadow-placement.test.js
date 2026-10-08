import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadData} from '../../server/data.js';
import {makeBattle,chessRec} from '../helpers/battleHarness.js';
const data=loadData(new URL('../../.cache/ursus-data/',import.meta.url).pathname);
test('Wisdel creates exactly one initial shadow and avoids pending operator homes',()=>{
 const id='chess_custom_recruit_wisdel_5_a';
 const h=makeBattle({data:{...data,chess:{...data.chess,guard:chessRec({id:'guard',skill:null})}},units:[{chessId:id,row:10,col:3},{chessId:'guard',row:10,col:4}],flags:{deploymentInterval:.2},autoFinish:false});
 h.b.start();
 const shadows=h.b.allyUnits.filter(u=>u.defId==='token_10035_wisdel_wward'&&u.alive);
 assert.equal(shadows.length,1);
 assert.ok(shadows.every(u=>u.homeR!==10||u.homeC!==4));
 h.run(1);
 assert.ok(h.unit('guard').deployed);
 assert.equal(new Set(h.b.allyUnits.filter(u=>u.alive&&u.deployed).map(u=>`${u.tileR},${u.tileC}`)).size,h.b.allyUnits.filter(u=>u.alive&&u.deployed).length);
});
