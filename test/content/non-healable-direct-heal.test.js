import {test} from 'node:test';import assert from 'node:assert/strict';
import {makeBattle,chessRec} from '../helpers/battleHarness.js';
import {heal} from '../../server/sim/damage.js';import {bardRegen} from '../../server/sim/professions.js';
for(const sub of ['musha','reaper','unyield'])test(`${sub}: direct and incorrectly self-labelled allied heals are refused; regeneration works`,()=>{
 const h=makeBattle({content:'none',autoFinish:false,defs:{chess:{
  healer:chessRec({id:'healer',profession:'MEDIC',dmgType:'heal',skill:null,stats:{atk:100}}),
  target:chessRec({id:'target',profession:'WARRIOR',subProfessionId:sub,skill:null,stats:{maxHp:20000,atk:0}})
 }},units:[{chessId:'healer',row:10,col:3},{chessId:'target',row:10,col:4}]});h.run(1);
 const s=h.unit('healer'),t=h.unit('target');t.hp=t.s.maxHp/2;const before=t.hp;
 assert.equal(t.profile.noHeal,true);assert.equal(heal(h.b,s,t,100),0);assert.equal(heal(h.b,s,t,100,{self:true}),0);
 assert.equal(heal(h.b,s,t,100,{regen:true}),100);
 bardRegen(h.b,s,t,100,2);h.run(.5);assert.ok(t.hp>before+100);
});
