import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadData} from '../../server/data.js';
import {makeMatch} from '../match/harness.js';
import {makeBattle,enemyRec,checkInvariants} from '../helpers/battleHarness.js';
import {setGameData} from '../../server/sim/content/support/index.js';
import {drawDisabledBonds} from '../../server/match/pool.js';
import {checkLoadout} from '../../shared/protocol.js';
import {parseStored,sanitizeEntries,setChoice} from '../../public/js/ui/loadoutModel.js';
const data=loadData(new URL('../../.cache/ursus-data/',import.meta.url).pathname),get=id=>data.chess[id];
const id=(key,tier=6,elite=false)=>`chess_custom_recruit_${key}_${tier}_${elite?'b':'a'}`;
const keys=['oblvns','chen3','wisdel','narant','ascln'];
function combat(key,index=0,elite=false,tier=6,extra={}){
 const raw={...data,enemies:{...data.enemies,dummy:enemyRec({key:'dummy',hp:1e7,speed:0.05,atk:100,mass:4})}};
 const h=makeBattle({data:raw,autoFinish:false,captureNoisy:true,units:[{chessId:id(key,tier,elite),row:10,col:3,skillIndex:index}],enemies:[{key:'dummy',time:0,route:{motion:'WALK',start:[10,4],end:[10,2],checkpoints:[]}}],...extra});h.step();h.run(Math.max(0,...h.b.allyUnits.map(u=>u.deployRemaining)));return h;
}
test('optional recruits: all 60 skill variants activate without content errors, no garrison traits',()=>{
 setGameData(data);try{for(const key of keys)for(const tier of [5,6])for(const elite of [false,true])for(const index of [0,1,2]){
  const r=get(id(key,tier,elite));assert.deepEqual(r.garrisonIds,[]);assert.equal(r.optionalRecruit,true);const h=combat(key,index,elite,tier),u=h.unit(r.chessId);
  u.skill.gainSp(1000);if(!u.skill.active)assert.ok(u.skill.activate('test'));h.run(Math.max(10,u.skill.duration+1));assert.equal(h.b.errorCount,0,`${r.name} ${index}`);checkInvariants(h.b);
 }}finally{setGameData(null)}
});
test('server validates per-tier limits, uniqueness and optional-only selection',()=>{
 const entries=Object.fromEntries([id('oblvns',5),id('wisdel',5),id('chen3'),id('ascln')].map(k=>[k,{selected:true}]));assert.ok(checkLoadout(entries,get).ok);
 assert.equal(checkLoadout({...entries,[id('narant',5)]:{selected:true}},get).error,'BAD_TARGET');
 assert.equal(checkLoadout({[id('wisdel',5)]:{selected:true},[id('wisdel')]:{selected:true}},get).error,'BAD_TARGET');
 const ordinary=Object.values(data.chess).find(c=>c.visible&&!c.isGolden&&!c.optionalRecruit);assert.equal(checkLoadout({[ordinary.chessId]:{selected:true}},get).error,'BAD_TARGET');
 assert.equal(parseStored({entries})[id('wisdel',5)].selected,true);assert.equal(sanitizeEntries(entries,get)[id('wisdel',5)].selected,true);
 const base=get(id('wisdel',5));assert.equal(setChoice(entries,base,get(base.goldenId),{skill:0})[base.chessId].selected,true);
});
test('personal selection filters shop, reward and grants, including another player selection',()=>{
 const h=makeMatch({data,mode:'coop',humans:2,fake:true}).start();h.toPrep(1);const a=h.ps('p_0'),b=h.ps('p_1');assert.ok(a.setLoadout({[id('wisdel')]:{selected:true}}));
 assert.equal(a.canRecruit(id('wisdel')),true);assert.equal(b.canRecruit(id('wisdel')),false);assert.equal(a.canRecruit(id('wisdel',5)),false);
 assert.equal(b.acquireChess(id('wisdel'),{fromPool:false}),null);assert.equal(a.pushRewardOffer('test',{ids:[id('wisdel'),id('narant')]}).slots.length,1);assert.equal(b.pushRewardOffer('test',{ids:[id('wisdel')]}),null);
 for(const [cid,e] of h.m.pool.entries)if(cid!==id('wisdel'))e.left=0;
 assert.equal(b._rollChessSlot(),null);a.shop.level=6;assert.equal(a._rollChessSlot()?.id,id('wisdel'));
});
test('Ascalon poison stacks, slows and ticks arts damage; elite module boosts it',()=>{
 setGameData(data);try{const h=combat('ascln',1,true),u=h.unit(id('ascln',6,true)),e=h.enemy();assert.ok(h.runUntil(()=>e.findBuff(`ascln:poison:${u.id}`)?.stacks===3,12));const poison=e.findBuff(`ascln:poison:${u.id}`);assert.ok(poison);assert.equal(poison.stacks,3);assert.ok(e.s.moveSpeed<e.base.moveSpeed||e.s.speed<e.base.speed);assert.ok(h.hooksOf('hit').some(c=>c.dmg.tags?.includes('ascln-poison')))}finally{setGameData(null)}
});
test('Narantuya steals stats up to cap and collects returning boomerangs',()=>{
 setGameData(data);try{const h=combat('narant',2,true),u=h.unit(id('narant',6,true));h.run(40);assert.ok(u.mem.narantSteal.atk>0);assert.ok(u.mem.narantSteal.atk<=300);assert.ok(u.mem.narantReturns>0);assert.equal(h.b.errorCount,0)}finally{setGameData(null)}
});
test('Ascalon periodic basic damage activates Dormant Progeny healing without another attack or poison recursion',()=>{
 setGameData(data);try{
  const cid=id('ascln'),h=combat('ascln',0,false,6,{units:[{chessId:cid,row:10,col:3,items:['chess_item_4_06_e_a']}]}),u=h.unit(cid),e=h.enemy();
  h.b.dealDamage(u,e,{amount:10,type:'arts',isAttack:true});h.b.loseHp(u,u.s.maxHp*.5);h.b.addBuff(u,{key:'test-disarm',flags:{disarm:true},duration:10});const before=u.hp,attacks=u.stats.attacks,stacks=e.findBuff(`ascln:poison:${u.id}`).stacks;
  h.run(1.1);assert.ok(u.hp>before,'periodic damage heals the equipment carrier');assert.equal(u.stats.attacks,attacks,'DOT does not start another attack animation');assert.equal(e.findBuff(`ascln:poison:${u.id}`).stacks,stacks,'DOT never recursively stacks itself');
  const hits=h.hooksOf('hit').filter(c=>c.dmg.tags?.includes('ascln-poison'));assert.ok(hits.length);assert.ok(hits.every(c=>c.dmg.isAttack&&!c.dmg.isSkill));
 }finally{setGameData(null)}
});
test('all seven official modules select their exact data and execute the authored kits',()=>{
 setGameData(data);try{let count=0;for(const key of keys){const r=get(id(key,6,true));for(const m of r.modules){const h=combat(key,2,true,6,{units:[{chessId:r.chessId,row:10,col:3,skillIndex:2,moduleId:m.uniEquipId}]}),u=h.unit(r.chessId);assert.equal(u.def.raw.module.id,m.uniEquipId);u.skill.gainSp(1000);if(!u.skill.active)u.skill.activate('test');h.run(8);assert.equal(h.b.errorCount,0,`${key} ${m.uniEquipId}`);checkInvariants(h.b);count++;}}assert.equal(count,7)}finally{setGameData(null)}
});

test('personally selected candidates remain in the pool when every one of their bonds is banned',()=>{
 const candidate=get(id('wisdel'));
 const gd={difficulty:'NORMAL',bans:()=>({core:1,addon:0}),modeInactiveBonds:new Set(),bondIds:['emptyShip'],bond:()=>({weight:1,isCore:true}),visibleChess:[candidate.chessId,'ordinary'],chess:cid=>cid==='ordinary'?{bonds:['emptyShip']}:candidate};
 const rng=()=>0;rng.shuffle=()=>{};
 const result=drawDisabledBonds(gd,rng);assert.deepEqual(result.banned,['ordinary']);
});
