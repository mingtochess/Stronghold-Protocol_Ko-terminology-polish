import {test} from 'node:test';
import assert from 'node:assert/strict';
import {unitTuple} from '../../server/sim/snapshot.js';
import {UF} from '../../shared/constants.js';
import {makeBattle,chessRec} from '../helpers/battleHarness.js';

function gauge(id,kind,left,total) {
 const u={id:1,x:4,y:10,hp:100,alive:true,deployed:true,side:'ally',blocking:[],buffs:[],mem:{},s:{maxHp:100,shield:0,flags:{}},lastAttackAt:-100,deployedAt:-100};
 u.skill={id,kind,active:true,isTimed:true,spCost:20,sp:0,duration:total,timeLeft:left,ammoLeft:left,ammoMax:total};
 return unitTuple(u,10);
}
test('overdrive duration gauge drains each half separately and becomes red at halfway',()=>{
 for(const id of ['skchr_horn_3','skchr_rockr_2']){
  assert.equal(gauge(id,'duration',24,24)[5],20);
  assert.equal(gauge(id,'duration',18,24)[5],10);
  const half=gauge(id,'duration',12,24);assert.equal(half[5],20);assert.ok(half[7]&UF.OVERHEATED);
  assert.equal(gauge(id,'duration',6,24)[5],10);
  assert.equal(gauge(id,'duration',0,24)[5],0);
 }
 assert.equal(gauge('ordinary','duration',12,24)[5],10);
 assert.ok(!(gauge('ordinary','duration',12,24)[7]&UF.OVERHEATED));
});
test('Horn ammunition overdrive switches at half the activation ammunition',()=>{
 assert.equal(gauge('skchr_horn_2','ammo',10,10)[5],20);
 assert.equal(gauge('skchr_horn_2','ammo',7,10)[5],8);
 const half=gauge('skchr_horn_2','ammo',5,10);assert.equal(half[5],20);assert.ok(half[7]&UF.OVERHEATED);
 assert.equal(gauge('skchr_horn_2','ammo',2,10)[5],8);
});
test('charged instant casting gauge drains while actual SP recovers independently, including after impact',()=>{
 const rec={...chessRec({id:'caster',skill:{skillId:'skchr_pinecn_1',index:0,spCost:10,initSp:20,maxCharges:2,duration:0,spType:'time',trigger:{rule:'NEVER'}}}),attackTiming:{front:{skills:{0:{hit:.2,dur:1}}}}};
 const h=makeBattle({defs:{chess:{caster:rec}},units:[{chessId:'caster',row:10,col:4}],kits:{caster:()=>({skill:{id:'skchr_pinecn_1',kind:'charges',charges:2,spCost:10,initSp:20,trigger:'NEVER',onStart(){}}})},autoFinish:false});
 h.b.start();h.run(2);const u=h.unit('caster'),sk=u.skill;

 assert.ok(sk.activate('test'));const start=h.b.time;
 const before=sk.spTotal;h.run(.1);assert.ok(sk.spTotal>before,'actual stored SP continues recovering');
 assert.ok(unitTuple(u,h.b.time)[7]&UF.SKILL);
 h.run(.3);assert.equal(sk.active,false,'instant effect ended at impact');
 const tuple=unitTuple(u,h.b.time);assert.ok(tuple[7]&UF.SKILL,'cast bar remains until animation ends');
 assert.ok(tuple[5]<tuple[6]);assert.ok(sk.spTotal>before);
 h.run(1);assert.ok(!(unitTuple(u,h.b.time)[7]&UF.SKILL));assert.ok(h.b.time>start+1);
});
