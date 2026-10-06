import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeBattle,chessRec,enemyRec} from '../helpers/battleHarness.js';
import {getDefaultSource} from '../../server/sim/simdata.js';
import {acquireTargets,effectiveProfile} from '../../server/sim/ai.js';

const enemy=(key,motion='WALK')=>enemyRec({key,hp:1e6,speed:0,atk:0,motion});
const enemies={ground:enemy('ground'),air:enemy('air','FLY')};

test('every marksman normal/elite, selected skill and module prioritizes an unblocked flyer over the nearer ground enemy',()=>{
 const d=getDefaultSource();let checked=0;
 for(const id of d.chessIds()){
  const raw=d.rawChess(id);if(d.getChess(id).subProf!=='fastshot')continue;
  for(const skill of raw.skills||[raw.skill])for(const moduleId of [undefined,'none',...(raw.modules||[]).map(m=>m.uniEquipId)]){
   const h=makeBattle({units:[{chessId:id,skillIndex:skill?.index,moduleId,row:10,col:4}],defs:{enemies},content:'full',autoFinish:false});h.b.start();
   const u=h.unit(id),ground=h.spawn('ground',{pos:[10,5]}),air=h.spawn('air',{pos:[10,6]});
   h.b._buildEnemyIndex();
   const label=`${id} skill=${skill?.index} module=${moduleId}`;
   assert.equal(u.profile.priority,'fly',label);
   assert.equal(acquireTargets(h.b,u,effectiveProfile(u))[0],air,label);
   if(u.skill&&!u.skill.noSkill&&u.skill.kind!=='passive'){
    u.skill.active=true;const p=effectiveProfile(u);
    if(p.priority==='ranged'){
     assert.match(u.def.skill.description,/优先攻击.*远程/,'only an explicitly documented skill may override the branch priority');
     ground.base.rangeRadius=1;ground.markDirty();ground.def={...ground.def,applyWay:'RANGED'};
     assert.equal(acquireTargets(h.b,u,p)[0],ground,label+' documented skill priority');
    }else assert.equal(acquireTargets(h.b,u,p)[0],air,label+' active');
   }
   assert.equal(ground.isFlying,false);assert.equal(air.isFlying,true);checked++;
  }
 }
 assert.ok(checked>=50,`${checked} loadouts`);
});

test('marksman acquires flyers after a ground wind-up ends; own blocked ground enemy remains the documented first priority',()=>{
 const h=makeBattle({units:[{chessId:'chess_char_3_01_a',row:10,col:4}],defs:{enemies},content:'none',autoFinish:false,captureNoisy:true});h.b.start();
 const u=h.unit('chess_char_3_01_a'),ground=h.spawn('ground',{pos:[10,5]});
 u.def={...u.def,attackTiming:{front:{attack:{dur:1,hit:.3}}}};
 h.step();const air=h.spawn('air',{pos:[10,6]});h.b._buildEnemyIndex();
 assert.equal(acquireTargets(h.b,u,effectiveProfile(u))[0],air);
 h.run(2);assert.ok(h.eventsOf('atk').some(e=>e[1]===u.id&&e[2]===air.id),'the next volley shoots the flyer');
 u.blocking=[ground];ground.blockedBy=u;
 assert.equal(acquireTargets(h.b,u,effectiveProfile(u))[0],ground,'own block > branch priority');
});

test('musha restores HP on each direct multi-hit, not once per volley; a dodged volley restores nothing',()=>{
 const rec=chessRec({id:'musha',profession:'WARRIOR',subProfessionId:'musha',skill:null,stats:{maxHp:10000,atk:100,bat:2},rangeGrid:[[0,0],[0,1]]});
 const h=makeBattle({defs:{chess:{musha:rec},enemies},units:[{chessId:'musha',row:10,col:4}],content:'none',autoFinish:false});h.b.start();
 const u=h.unit('musha'),target=h.spawn('ground',{pos:[10,5]});u.hp=5000;
 u.profile.hits=2;h.b.forceAttack(u,[target]);assert.equal(u.hp,5100);
 h.b.addBuff(target,{key:'test:miss',mods:{dodgePhys:1}});h.b.forceAttack(u,[target]);assert.equal(u.hp,5100);
});

test('reaper restores HP for direct hits up to its block count per instant, including skill hits; buff DoT never heals it',()=>{
 const rec=chessRec({id:'reaper',profession:'WARRIOR',subProfessionId:'reaper',skill:null,stats:{maxHp:10000,atk:100,blockCnt:2},rangeGrid:[[0,0],[0,1]]});
 const h=makeBattle({defs:{chess:{reaper:rec},enemies},units:[{chessId:'reaper',row:10,col:4}],content:'none',autoFinish:false});h.b.start();const u=h.unit('reaper'),e=h.spawn('ground',{pos:[10,5]});u.hp=5000;
 for(let i=0;i<3;i++)h.b.dealDamage(u,e,{amount:100,type:'phys',isSkill:true});assert.equal(u.hp,5100);
 h.b.dealDamage(u,e,{amount:100,type:'arts',tags:['dot']});assert.equal(u.hp,5100);
});

test('every bard rejects all inspire paths including a seaborn and HP inspiration, while a normal operator can receive them',()=>{
 const d=getDefaultSource();let n=0;
 for(const id of d.chessIds())if(d.getChess(id).subProf==='bard'){
  const h=makeBattle({units:[{chessId:id,row:10,col:4},{chessId:'chess_char_1_01_a',row:10,col:5}],content:'full',autoFinish:false});h.b.start();const bard=h.unit(id),other=h.unit('chess_char_1_01_a');
  for(const key of ['inspire','inspire:def','inspire:hp','inspire:123','cetsyr:inspire']){
   assert.equal(h.b.addBuff(bard,{key,duration:1,mods:{atkFlat:100}}),null,`${id} ${key}`);
   assert.ok(h.b.addBuff(other,{key,duration:1,mods:{atkFlat:100}}));
  }n++;
 }
 assert.ok(n>=4);
});
