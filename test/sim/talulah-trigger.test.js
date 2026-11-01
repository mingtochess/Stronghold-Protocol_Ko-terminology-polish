import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadData} from '../../server/data.js';
import {makeBattle,enemyRec} from '../helpers/battleHarness.js';
import {eightUniteStage,EIGHT_UNITE_RECT} from '../../shared/cooperativeEight.js';
import {dirVec} from '../../server/sim/dir.js';
const data=loadData(new URL('../../content/production/data/',import.meta.url).pathname);
const id='chess_custom_recruit_talulah_6_b';
function setup(dir='RIGHT',eight=false,col=10){
 const stage=eight?eightUniteStage(data.stages.act1autochess_m01):data.stages.act1autochess_m01;
 const h=makeBattle({data,stage,kind:'unite',rect:eight?EIGHT_UNITE_RECT:undefined,units:[{chessId:id,row:10,col,dir,skillIndex:2}],enemies:[],autoFinish:false,timeLimit:120});
 h.run(1.2);const u=h.unit(id);u.skill.gainSp(1000);return{h,u};
}
function enemy(h,u,along,lane=0){
 const [dr,dc]=dirVec(u.dir),rec=enemyRec({hp:1e8,speed:0});
 return h.b.spawnEnemy(rec.key,{def:{...rec,stats:{...rec.stats,maxHp:1e8,atk:0,moveSpeed:0}},pos:[u.tileR+dr*along+dc*lane,u.tileC+dc*along-dr*lane]});
}
for(const flying of [false,true])for(const eight of [false,true])for(const dir of ['UP','DOWN','LEFT','RIGHT'])test(`Talulah S3 ${eight?8:4}p ${dir}: auto casts for an identified ${flying?'flying':'ground'} enemy beyond normal attack range`,()=>{
 const {h,u}=setup(dir,eight);h.step();assert.equal(u.skill.active,false);
 const e=enemy(h,u,dir==='UP'?-5:5,dir==='DOWN'?5:0);assert.ok(e);if(flying)e.motion='FLY';assert.ok(!u.baseRangeKeys.includes(Math.round(e.y)*h.b.grid.cols+Math.round(e.x)));
 h.step();assert.equal(u.skill.active,true);assert.equal(u.mem.talulah.waveSerial,1);assert.deepEqual(h.b.errors,[]);
});
for(const kind of ['outside','stealth','untargetable','hidden','dead'])test(`Talulah S3 does not auto cast for ${kind} enemies`,()=>{
 const {h,u}=setup(kind==='outside'?'UP':'RIGHT');const e=enemy(h,u,4,kind==='outside'?8:0);assert.ok(e);
 if(kind==='stealth'||kind==='untargetable')h.b.addBuff(e,{key:'test',duration:10,flags:{[kind]:true}});
 if(kind==='hidden')e.hidden=true;if(kind==='dead')e.alive=false;
 h.step();assert.equal(u.skill.active,false);assert.deepEqual(h.b.errors,[]);
 if(kind==='stealth'){h.b.removeBuff(e,'test');h.step();assert.equal(u.skill.active,true);}
});
test('Talulah S3 includes the rear-origin and overdrive-only lanes',()=>{
 for(const [along,lane]of [[-5,0],[4,6]]){const {h,u}=setup();assert.ok(enemy(h,u,along,lane));h.step();assert.equal(u.skill.active,true);}
});

test('Talulah S3 waits for an enemy within the eleven-tile rear origin',()=>{
 const {h,u}=setup('RIGHT',true,24);assert.ok(enemy(h,u,-16));h.step();assert.equal(u.skill.active,false);
 assert.ok(enemy(h,u,-10));h.step();assert.equal(u.skill.active,true);assert.deepEqual(h.b.errors,[]);
});

for(const flag of ['stealth','untargetable'])test(`Talulah S3 still rejects ${flag} flying enemies`,()=>{
 const {h,u}=setup();const e=enemy(h,u,5);e.motion='FLY';h.b.addBuff(e,{key:'test-air',duration:10,flags:{[flag]:true}});
 h.step();assert.equal(u.skill.active,false);h.b.removeBuff(e,'test-air');h.step();assert.equal(u.skill.active,true);assert.deepEqual(h.b.errors,[]);
});
