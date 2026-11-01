import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadData} from '../../server/data.js';
import {makeBattle} from '../helpers/battleHarness.js';
import {customFactionData} from '../../shared/customFactions.js';
const data=loadData(new URL('../../content/production/data/',import.meta.url).pathname);
const key=(name,form='b',tier=6)=>`chess_custom_recruit_${name}_${tier}_${form}`;
const tank={...data.enemies.enemy_1010_demon,stats:{...data.enemies.enemy_1010_demon.stats,maxHp:1e8,atk:0,moveSpeed:0,def:0,res:0}};
const durable={...data,enemies:{...data.enemies,enemy_1010_demon:tank}};
function scenario(name,index,others=[],enemies=[{key:'enemy_1010_demon',pos:[10,4]}]){
 const id=key(name);
 const h=makeBattle({data:durable,units:[{chessId:id,row:10,col:3,skillIndex:index},...others],enemies,autoFinish:false,timeLimit:120});h.run(1.2);return{h,u:h.unit(id)};
}
for(const name of ['talulah','territoriya','toska'])for(const tier of [5,6])for(const form of ['a','b'])test(`${name} ${tier}/${form}: optional recruit stays out of the shop and survives Ursus disable`,()=>{
 const id=key(name,form,tier),r=data.chess[id];assert.ok(r?.optionalRecruit);assert.equal(r.isDiy,false);assert.equal(r.skills.length,3);assert.deepEqual(r.bonds,['ursusShip']);
 assert.deepEqual(customFactionData(data,false).chess[id].bonds,['emptyShip']);assert.deepEqual(data.chess[id].bonds,['ursusShip']);
});
for(const name of ['talulah','territoriya','toska'])for(let i=0;i<3;i++)test(`${name} S${i+1}: selected kit starts and runs without errors`,()=>{
 const {h,u}=scenario(name,i,[{chessId:'chess_char_1_02_a',row:10,col:4}]);assert.equal(u.def.raw.skill.index,i);u.skill.gainSp(1000);h.run(12);assert.deepEqual(h.b.errors,[]);assert.ok(u.mem[name]||u.mem.toska);
});
test('Talulah adds burn gauge from actual arts damage',()=>{
 const {h,u}=scenario('talulah',0);u.skill.noSkill=true;const e=h.enemies()[0],before=e.elem.burn;h.b.dealDamage(u,e,{amount:100,type:'arts',isAttack:true});assert.ok(e.elem.burn>before);assert.deepEqual(h.b.errors,[]);
});
test('Territoriya territory continuously reduces ground ASPD and deals periodic arts damage',()=>{
 const {h,u}=scenario('territoriya',0);u.skill.noSkill=true;const e=h.enemies()[0],hp=e.hp;h.run(1.2);assert.ok(e.hp<hp);assert.ok(e.s.aspd<e.base.aspd);assert.ok(u.mem.territoriya.cells.size);assert.deepEqual(h.b.errors,[]);
});
test('Toska mark consumption gives a decaying barrier, stuns the attacking enemy and heals via talent',()=>{
 const {h,u}=scenario('toska',0,[{chessId:'chess_char_1_02_a',row:10,col:4}]);u.skill.gainSp(1000);h.run(2);const ally=h.allies().find(a=>a!==u);assert.ok(ally.buffs.some(b=>b.tags?.includes('toska-trigger-0')));
 const enemy=h.enemies()[0];h.b.dealDamage(enemy,ally,{amount:10,type:'phys',isAttack:true});assert.ok(ally.s.shield>0);assert.ok(enemy.s.flags.stun);assert.ok(!ally.buffs.some(b=>b.tags?.includes('toska-trigger-0')));assert.deepEqual(h.b.errors,[]);
});
test('Talulah idle arcane charges in steps and loses one step per attack',()=>{
 const {h,u}=scenario('talulah',2,[],[]);h.run(7);const st=u.mem.talulah,cap=u.def.raw.talents.find(t=>t.index===0).bb.arcane_max;assert.ok(Math.abs(st.arcane-cap)<1e-6);h.b.emit('attack',{attacker:u,targets:[],isSkill:false});assert.ok(st.arcane<cap);assert.ok(st.arcane>0);h.run(2);assert.ok(st.arcane<cap);
});
test('Talulah guard protects its triggering hit, spends one charge and ignores damage over time',()=>{
 const {h,u}=scenario('talulah',1);u.skill.gainSp(1000);const enemy=h.enemies()[0],before=u.hp,charges=u.skill.charges;
 h.b.dealDamage(enemy,u,{amount:1000,type:'arts',isAttack:true});assert.ok(before-u.hp<150,`${before-u.hp}`);assert.equal(u.skill.charges,charges-1);
 const remaining=u.skill.charges;h.b.dealDamage(enemy,u,{amount:50,type:'arts',isAttack:false,tags:['dot']});assert.equal(u.skill.charges,remaining);assert.deepEqual(h.b.errors,[]);
});
for(const dir of ['RIGHT','UP','LEFT','DOWN'])test(`Talulah flame waves honor ${dir} and grow from 5 lanes to overdrive`,()=>{
 const id=key('talulah');const h=makeBattle({data:durable,units:[{chessId:id,row:10,col:5,dir,skillIndex:2}],autoFinish:false,hooks:['damaged']});h.run(1.2);const u=h.unit(id);u.skill.gainSp(1000);assert.ok(u.skill.activate('test'));h.run(3);
 assert.equal(u.mem.talulah.waveSerial,1);assert.ok(u.mem.talulah.waves.length>0);const wave=u.mem.talulah.waves[0];assert.equal(wave.dr,dir==='UP'?1:dir==='DOWN'?-1:0);assert.equal(wave.dc,dir==='RIGHT'?1:dir==='LEFT'?-1:0);
 h.run(16);assert.equal(u.mem.talulah.wavePhase,1);const emitted=u.mem.talulah.waves.length;u.skill.end('test');u.skill.noSkill=true;assert.equal(u.mem.talulah.waves.length,emitted);h.run(22);assert.equal(u.mem.talulah.waves.length,0);assert.deepEqual(h.b.errors,[]);
});
test('Territoriya second S2 keeps ATK, range and extra ASPD beyond the first duration',()=>{
 const {h,u}=scenario('territoriya',1);u.skill.gainSp(1000);assert.ok(u.skill.activate('test'));h.run(.2);u.skill.end('test');u.skill.gainSp(1000);assert.ok(u.skill.activate('test'));h.run(25);assert.equal(u.skill.active,true);assert.equal(u.skill.timeLeft,Infinity);assert.ok(u.s.atk>u.base.atk);assert.ok(u.s.aspd>=130);assert.ok(u.findBuff(u.skill._buffKey));assert.deepEqual(h.b.errors,[]);
});
test('Territoriya S3 spreads through hits on units in territory, with a global 0.5s gate and reset',()=>{
 const {h,u}=scenario('territoriya',2,[{chessId:'chess_char_1_02_a',row:10,col:4}]);u.skill.gainSp(1000);u.skill.activate('test');h.run(.2);const ally=h.allies().find(a=>a!==u),enemy=h.enemies()[0];
 h.b.dealDamage(enemy,ally,{amount:1,type:'phys',isAttack:true});assert.ok(u.mem.territoriya.extra.size>0);const last=u.mem.territoriya.lastSpread;h.b.dealDamage(enemy,ally,{amount:1,type:'phys',isAttack:true});assert.equal(u.mem.territoriya.lastSpread,last);
 u.skill.end('test');assert.equal(u.mem.territoriya.extra.size,0);assert.deepEqual(h.b.errors,[]);
});
test('Toska S2 waits for readiness, then forces a manual skill without changing its strategy',()=>{
 const {h,u}=scenario('toska',1,[{chessId:'chess_char_1_02_a',row:10,col:4}],[]);const ally=h.allies().find(a=>a!==u),rule=ally.skill.rule;ally.skill.charges=0;ally.skill.sp=0;
 u.skill.gainSp(1000);h.run(1.2);assert.ok(ally.buffs.some(b=>b.tags?.includes('toska-trigger-1')));const before=ally.skill.activations;ally.skill.gainSp(1000);h.run(.5);assert.ok(ally.skill.activations>before);assert.equal(ally.skill.rule,rule);assert.ok(ally.s.aspd>ally.base.aspd);assert.deepEqual(h.b.errors,[]);
});
test('Toska S3 mark boosts before skill execution, transfers to another holder and retains one owner',()=>{
 const {h,u}=scenario('toska',2,[{chessId:'chess_char_1_02_a',row:10,col:4},{chessId:'chess_char_1_03_a',row:11,col:4}],[]);u.skill.gainSp(1000);assert.ok(u.skill.activate('test'));h.run(.2);
 const st=u.mem.toska,mark=[...st.marks.values()].find(m=>m.index===2);assert.ok(mark);const first=mark.unit;first.skill.gainSp(1000);first.skill.activate('test');assert.ok(first.s.atk>first.base.atk);assert.ok(u.s.atk>u.base.atk);assert.equal([...st.marks.values()].filter(m=>m.index===2).length,1);assert.ok(!st.marks.has(first.id));assert.deepEqual(h.b.errors,[]);
});
for(const [name,index,delay]of [['talulah',0,.333],['toska',0,.367],['toska',1,.8]])test(`${name} S${index+1} does not resolve before the shared Spine impact marker`,()=>{
 const {h,u}=scenario(name,index,[{chessId:'chess_char_1_02_a',row:10,col:4}]);u.profile.noAttack=true;u.skill.gainSp(1000);const enemy=h.enemies()[0],hp=enemy.hp,ally=h.allies().find(a=>a!==u);
 assert.ok(u.skill.activate('test'));h.run(delay-.1);
 if(name==='talulah')assert.equal(enemy.hp,hp);else assert.ok(!ally.buffs.some(x=>x.tags?.includes(`toska-trigger-${index}`)));
 h.run(.4);if(name==='talulah')assert.ok(enemy.hp<hp);else assert.ok(ally.buffs.some(x=>x.tags?.includes(`toska-trigger-${index}`)));
 assert.deepEqual(h.b.errors,[]);
});
test('Talulah reactive cast uses the authored Cambat clip while S3 uses the existing begin/loop/end roles',()=>{
 const r=data.chess[key('talulah')],asset=data.assets.chars[r.charId].spine;
 for(const side of ['front','back']){assert.equal(asset[side].anims.skills[1].loop,'Skill_2_Cambat');assert.equal(asset[side].anims.skills[2].begin,'Skill_3_Begin');assert.equal(asset[side].anims.skills[2].end,'Skill_3_End');assert.ok(Math.abs(r.attackTiming[side].skills[1].hit-.167)<1e-8);}
});

test('Talulah overdrive uses the same two duration gauges and overheated flag as existing overdrive skills',async()=>{
 const {unitTuple}=await import('../../server/sim/snapshot.js');const {UF}=await import('../../shared/constants.js');
 const {h,u}=scenario('talulah',2);u.skill.gainSp(1000);u.skill.activate('test');
 for(const [fraction,shown,hot]of [[1,1,false],[.75,.5,false],[.5,1,true],[.25,.5,true]]){
  u.skill.timeLeft=u.skill.duration*fraction;const row=unitTuple(u,h.b.time);assert.ok(Math.abs(row[5]/row[6]-shown)<1e-6);assert.equal(!!(row[7]&UF.OVERHEATED),hot);
 }
});
test('Territoriya publishes the default country before any skill or attack',()=>{
 const {h,u}=scenario('territoriya',2);u.skill.noSkill=true;
 const events=h.eventsOf('fx');assert.ok(events.some(e=>e[1]==='territoriyaArea'));assert.ok(u.mem.territoriya.cells.size>0);
});
