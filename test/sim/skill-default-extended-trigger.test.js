import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {makeBattle,enemyRec} from '../helpers/battleHarness.js';
import {absoluteRangeKeys} from '../../server/sim/targeting.js';
const chess=JSON.parse(readFileSync(new URL('../../content/production/data/chess.json',import.meta.url)));
for(const [charId,index] of [['char_496_wildmn',1],['char_1050_chen3',2],['char_1047_halo2',2]])for(const dir of ['UP','RIGHT','DOWN','LEFT'])test(`${charId} S${index+1} ${dir}: casts for an enemy inside only the skill range`,()=>{
 const raw=Object.values(chess).find(c=>c.charId===charId&&!c.isGolden);assert.ok(raw);
 const grid=raw.skills[index].rangeGrid;const own=new Set(absoluteRangeKeys(raw.rangeGrid,11,5,dir,0));
 const key=absoluteRangeKeys(grid,11,5,dir,0).find(k=>!own.has(k)&&Math.floor(k/21)>8&&Math.floor(k/21)<14);
 assert.ok(key!=null,'extended tile exists');
 const enemyKey='enemy_extended';
 const h=makeBattle({autoFinish:false,defs:{chess:{[raw.chessId]:raw},enemies:{[enemyKey]:enemyRec({key:enemyKey,hp:1e7,speed:0,atk:0})}},units:[{chessId:raw.chessId,row:11,col:5,dir,skillIndex:index}],enemies:[{key:enemyKey,pos:[Math.floor(key/21),key%21]}]});
 h.run(2);const u=h.unit(raw.chessId);assert.equal(h.b.enemiesInKeys(u.baseRangeKeys,u,u.profile).length,0);
 u.skill.sp=u.skill.spCost;u.skill.charges=1;const n=u.skill.activations;h.run(.2);assert.equal(u.skill.activations,n+1);
});
test('expanded-range skills do not fire when there is no target in either range',()=>{
 const raw=Object.values(chess).find(c=>c.charId==='char_496_wildmn'&&!c.isGolden);const enemyKey='enemy_extended';
 const h=makeBattle({autoFinish:false,defs:{chess:{[raw.chessId]:raw},enemies:{[enemyKey]:enemyRec({key:enemyKey,hp:1e7,speed:0,atk:0})}},units:[{chessId:raw.chessId,row:11,col:5,skillIndex:1}],enemies:[{key:enemyKey,pos:[10,9]}]});
 h.run(2);const u=h.unit(raw.chessId);u.skill.sp=u.skill.spCost;u.skill.charges=1;h.run(.2);assert.equal(u.skill.activations,0,'no valid target in either range');
});

for(const charId of ['char_1050_chen3','char_1047_halo2'])test(`${charId} S3 casts when the only enemy in its extended range is airborne`,()=>{
 const raw=Object.values(chess).find(c=>c.charId===charId&&!c.isGolden),enemyKey='enemy_air';
 const own=new Set(absoluteRangeKeys(raw.rangeGrid,11,5,'RIGHT',0));
 const key=absoluteRangeKeys(raw.skills[2].rangeGrid,11,5,'RIGHT',0).find(k=>!own.has(k));
 const h=makeBattle({autoFinish:false,defs:{chess:{[raw.chessId]:raw},enemies:{[enemyKey]:enemyRec({key:enemyKey,hp:1e7,speed:0,atk:0,motion:'FLY'})}},units:[{chessId:raw.chessId,row:11,col:5,skillIndex:2}],enemies:[{key:enemyKey,pos:[Math.floor(key/21),key%21]}]});
 h.run(2);const u=h.unit(raw.chessId);assert.equal(h.b.enemiesInKeys(u.baseRangeKeys,u,u.profile).length,0);u.skill.sp=u.skill.spCost;u.skill.charges=1;h.run(.2);assert.ok(u.skill.activations>=1);
});
