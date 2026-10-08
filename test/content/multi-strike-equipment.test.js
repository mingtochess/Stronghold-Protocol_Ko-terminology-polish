import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadData} from '../../server/data.js';
import {makeBattle,chessRec,enemyRec} from '../helpers/battleHarness.js';
import {effectiveProfile,performAttack} from '../../server/sim/ai.js';
import {setGameData} from '../../server/sim/content/support/index.js';
const data=loadData(new URL('../../.cache/ursus-data/',import.meta.url).pathname);
for(const hits of [1,2,4])test(`equipment applies on each of ${hits} strikes, while attack hooks run once`,()=>{
 setGameData(data);try{
 const h=makeBattle({data:{...data,chess:{...data.chess,test_op:chessRec({id:'test_op',skill:null})},enemies:{...data.enemies,dummy:enemyRec({key:'dummy',hp:1e7,speed:0})}},units:[{chessId:'test_op',row:10,col:3,items:['chess_item_4_03_e_a']}],enemies:[{key:'dummy',route:{motion:'WALK',start:[10,4],end:[10,2],checkpoints:[]}}],autoFinish:false});
 h.run(1);const u=h.unit('test_op'),e=h.enemy(),before=u.s.aspd;let attacks=0;h.b.on('attack',c=>{if(c.attacker===u)attacks++});
 performAttack(h.b,u,{...effectiveProfile(u),attack:'melee',hits},[e]);
 assert.equal(u.s.aspd-before,hits);assert.equal(attacks,1);
 }finally{setGameData(null)}
});
test('Wisdel S2 overload fires four separately equipped random strikes',()=>{
 setGameData(data);try{
 const id='chess_custom_recruit_wisdel_5_a';
 const h=makeBattle({data:{...data,enemies:{...data.enemies,dummy:enemyRec({key:'dummy',hp:1e7,speed:0})}},units:[{chessId:id,row:10,col:3,skillIndex:1,items:['chess_item_4_03_e_a']}],enemies:[{key:'dummy',route:{motion:'WALK',start:[10,4],end:[10,2],checkpoints:[]}}],autoFinish:false});
 h.run(1);const u=h.unit(id),e=h.enemy();u.skill.gainSp(1000);assert.ok(u.skill.active||u.skill.activate('test'));u.skill.timeLeft=u.skill.duration/2;u.skill.tick(.01);
 const profile=effectiveProfile(u);assert.ok(u.mem.wisdelOverload,'second half enters overload');
 const before=u.s.aspd,attackCount=u.stats.attacks;
 performAttack(h.b,u,profile,[e]);assert.equal(u.s.aspd-before,4);assert.equal(u.stats.attacks-attackCount,1);
 assert.equal(h.b.errorCount,0);
 }finally{setGameData(null)}
});

test('probability equipment rolls for every damage strike',()=>{
 setGameData(data);try{
 const h=makeBattle({data:{...data,chess:{...data.chess,test_op:chessRec({id:'test_op',skill:null})},enemies:{...data.enemies,dummy:enemyRec({key:'dummy',hp:1e7,speed:0})}},units:[{chessId:'test_op',row:10,col:3,items:['chess_item_5_02_e_a']}],enemies:[{key:'dummy',route:{motion:'WALK',start:[10,4],end:[10,2],checkpoints:[]}}],autoFinish:false});
 h.run(1);const u=h.unit('test_op'),e=h.enemy();let rolls=0;h.b.rng=()=>{rolls++;return .99};
 performAttack(h.b,u,{...effectiveProfile(u),attack:'melee',hits:4},[e]);assert.equal(rolls,4);
 }finally{setGameData(null)}
});
