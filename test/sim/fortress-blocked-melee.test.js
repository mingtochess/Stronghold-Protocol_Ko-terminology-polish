import {test} from 'node:test';import assert from 'node:assert/strict';
import {makeBattle,chessRec,enemyRec} from '../helpers/battleHarness.js';
import {performAttack} from '../../server/sim/ai.js';
import {fortressMeleeRole} from '../../shared/attackTiming.js';
test('fortress blocked strikes hit only their own blocked target; ranged shots still splash',()=>{
 const op=chessRec({id:'fort',subProfessionId:'fortress',profession:'TANK',skill:null,stats:{atk:500,blockCnt:3}});
 const h=makeBattle({content:'none',autoFinish:false,defs:{chess:{fort:op},enemies:{dummy:enemyRec({key:'dummy',hp:10000,atk:0,speed:0})}},units:[{chessId:'fort',row:10,col:4}],enemies:[{key:'dummy',pos:[10,4]},{key:'dummy',pos:[10,4.3]}]});
 h.step();const u=h.unit('fort'),[a,c]=h.enemies();a.blockedBy=u;u.blocking=[a];
 const profile={...u.profile,fortress:true,splashRadius:1,attack:'ranged',projectile:'bomb',dmgType:'phys'};
 performAttack(h.b,u,profile,[a]);assert.ok(a.hp<10000);assert.equal(c.hp,10000);assert.equal(h.b.projectiles.list.length,0);
 const remaining=a.hp;a.blockedBy=null;u.blocking=[];u.atkCd=100;performAttack(h.b,u,profile,[a]);h.run(.1);assert.ok(a.hp<remaining);assert.ok(c.hp<10000);
});
test('fortress authored melee clips select Attack02 and Horn B variants',()=>{
 assert.equal(fortressMeleeRole({skel:'char_431_ashlok',animations:{Attack02:1.4}},{loop:'Attack01'}).loop,'Attack02');
 assert.equal(fortressMeleeRole({skel:'char_4039_horn',animations:{Skill_3_B_Loop:1}},{loop:'Skill_3_A_Loop'}).loop,'Skill_3_B_Loop');
});
