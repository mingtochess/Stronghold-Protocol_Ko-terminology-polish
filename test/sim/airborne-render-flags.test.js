import {test} from 'node:test';import assert from 'node:assert/strict';
import {makeBattle,chessRec,enemyRec} from '../helpers/battleHarness.js';
import {unitInfo,flagsOf} from '../../server/sim/snapshot.js';
import {UF} from '../../shared/constants.js';
import {unitDepthKey} from '../../public/js/render/units.js';
import {presetCamera} from '../../public/js/render/projection.js';
test('flight, levitation, hovering and allied liftoff render above every ground row and return on expiry',()=>{
 const h=makeBattle({content:'none',autoFinish:false,defs:{chess:{test_op:chessRec({id:'test_op',skill:null,stats:{blockCnt:0}})},enemies:{enemy_ground:enemyRec({key:'enemy_ground',speed:0}),enemy_fly:enemyRec({key:'enemy_fly',speed:0,motion:'FLY'})}},units:[{chessId:'test_op',row:10,col:3}],enemies:[{key:'enemy_ground',pos:[10,5]},{key:'enemy_fly',pos:[10,7]}]});h.step();
 const ground=h.enemy('enemy_ground'),fly=h.enemy('enemy_fly'),op=h.unit('test_op');
 assert.equal(flagsOf(ground)&UF.FLYING,0);assert.ok(flagsOf(fly)&UF.FLYING);
 for(const [u,flag] of [[ground,'levitate'],[ground,'float'],[op,'liftoff']]){
  const motion=u.motion;h.b.addBuff(u,{key:`test-air:${flag}`,duration:.2,flags:{[flag]:true}});
  assert.ok(flagsOf(u)&UF.FLYING,flag);assert.equal(unitInfo(u).flying,true);
  assert.equal(u.motion,motion,'rendering status must not replace movement routing');
  h.run(.3);assert.equal(flagsOf(u)&UF.FLYING,0,flag+' expiry');assert.equal(unitInfo(u).flying,undefined);
 }
 for(const kind of ['prep','normal','unite','boss','pen']){
  const cam=presetCamera(kind,{width:1600,height:1000});
  const air=[];const land=[];
  for(let y=0;y<19;y++)for(let x=0;x<21;x++){air.push(unitDepthKey(cam,x,y,0,true));land.push(unitDepthKey(cam,x,y,0,false));}
  assert.ok(Math.min(...air)>Math.max(...land),kind);
 }
});
