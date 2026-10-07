import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {makeBattle,enemyRec} from '../helpers/battleHarness.js';
const chess=JSON.parse(readFileSync(new URL('../../content/production/data/chess.json',import.meta.url)));
function scenario(index=1){const id='chess_custom_ursus_brownb_b';return makeBattle({autoFinish:false,defs:{chess:{[id]:chess[id]},enemies:{dummy:enemyRec({key:'dummy',speed:0,hp:1e7,atk:0})}},units:[{chessId:id,row:10,col:3,skillIndex:index}],enemies:[{key:'dummy',pos:[10,4]}]});}
test('Beehunter S1 grants permanent physical evasion',()=>{const h=scenario(0);h.run(1.2);const u=h.b.allyUnits[0];assert.equal(u.skill.kind,'passive');assert.equal(u.s.dodgePhys,.4);h.run(12);assert.equal(u.s.dodgePhys,.4);});
test('Beehunter S2 shortens interval, talent caps and switches target, module follows HP',()=>{
 const h=scenario(),u=h.b.allyUnits[0];h.run(1.2);const base=u.s.interval;assert.ok(u.skill.activate('test',{free:true}));h.step();assert.ok(u.s.interval<base*.6);
 h.run(4);assert.equal(u.mem.brownbStacks,5);
 const target=h.enemies()[0];u.mem.brownbTarget=-1;h.b.emit('beforeAttack',{attacker:u,targets:[target],profile:u.profile});assert.equal(u.mem.brownbStacks,1);
 u.hp=u.s.maxHp*.4;h.step();assert.equal(u.s.aspd,100);u.hp=u.s.maxHp*.8;h.step();assert.equal(u.s.aspd,110);
});
