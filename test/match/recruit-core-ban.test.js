import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadData} from '../../server/data.js';
import {makeMatch} from './harness.js';
import {PHASE} from '../../shared/constants.js';
const data=loadData(new URL('../../.cache/ursus-data/',import.meta.url).pathname);
test('selecting a single-core recruit during strategy draft cannot bypass the match ban, shop or grants',()=>{
 let h;
 for(let seed=1;seed<=100;seed++){
  const candidate=makeMatch({data,mode:'solo',humans:1,fake:true,seed}).start();
  if(candidate.m.disabledBonds.includes('yanShip')){h=candidate;break;}
  candidate.m.dispose();
 }
 assert.ok(h,'find a real match with the recruit core banned');
 try{
  const m=h.m,ps=h.ps('p_0');m.phase=PHASE.BAND_DRAFT;
  for(const tier of [5,6]){
   const id=`chess_custom_recruit_chen3_${tier}_a`;
   assert.deepEqual(m.setLoadout('p_0',{[id]:{selected:true}}),{ok:true});
   assert.equal(ps.loadout[id].selected,true,'the saved choice remains intact');
   assert.ok(m.bannedChess.includes(id));assert.equal(m.pool.has(id),false);
   assert.equal(ps.canRecruit(id),false);assert.equal(ps.acquireChess(id,{fromPool:false}),null);
   assert.equal(ps.pushRewardOffer('test',{ids:[id]}),null);
  }
 }finally{h.m.dispose();}
});
