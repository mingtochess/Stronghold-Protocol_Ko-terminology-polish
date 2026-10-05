import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeBattle,enemyRec} from '../helpers/battleHarness.js';
import {performAttack,effectiveProfile} from '../../server/sim/ai.js';

// These actual skill profiles use the shared area-projectile path, not a synthetic replacement.
for(const [name,id,index] of [
 ['Horn S1','chess_char_5_08_a',0],
 ['Blaze the Igniting Spark S3','chess_char_5_03_a',2],
 ['Nymph S2','chess_char_5_22_a',1],
 ['Rosmontis S2','chess_char_6_12_a',1],
]) test(`${name}: an already-fired area attack survives the designated enemy's death`,()=>{
 const h=makeBattle({units:[{chessId:id,row:10,col:3,skillIndex:index}],defs:{enemies:{enemy_main:enemyRec({key:'enemy_main',hp:1e7,speed:0}),enemy_near:enemyRec({key:'enemy_near',hp:1e7,speed:0})}},enemies:[{key:'enemy_main',pos:[10,6]},{key:'enemy_near',pos:[10,6.2]}],autoFinish:false});
 h.step();
 const u=h.unit(id),main=h.enemy('enemy_main'),near=h.enemy('enemy_near');
 if(!u.skill.active) assert.ok(u.skill.activate('manual',{free:true}));
 const profile=effectiveProfile(u);
 assert.ok(profile.splashRadius>0,'actual skill has a splash profile');
 const before=near.hp;
 performAttack(h.b,u,profile,[main],{noAmmo:true});
 assert.ok(h.b.projectiles.list.length>0,'attack was launched');
 h.b.kill(main);
 h.b.projectiles.update(10);
 assert.ok(near.hp<before,'blast still damages a nearby enemy');
 assert.equal(h.b.errors.length,0);
});
