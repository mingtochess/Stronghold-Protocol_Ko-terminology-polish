import {test} from 'node:test';import assert from 'node:assert/strict';import {loadData} from '../../server/data.js';import {makeBattle,enemyRec} from '../helpers/battleHarness.js';
import {installDroneBombardment,installDroneFlight} from '../../server/sim/content/ursus.js';
const data=loadData(new URL('../../.cache/ursus-data/',import.meta.url).pathname);
test('drone can acquire again immediately after losing all targets before launch; completed shots retain cooldown',()=>{
 const h=makeBattle({data:{...data,enemies:{...data.enemies,dummy:enemyRec({key:'dummy',hp:1e8,speed:0,atk:0})}},captureNoisy:true,autoFinish:false,units:[{chessId:'chess_char_1_01_a',row:10,col:2}]});h.run(2);h.b.allyUnits[0].profile.noAttack=true;
 const u=h.b.spawnToken('p1','token_custom_ursus_drone',10,5,{anySource:true});installDroneFlight(h.b,u);installDroneBombardment(h.b,u);
 const e=h.spawn('dummy',{pos:[10,6]});h.step();assert.ok(u.mem.attackWindup);assert.ok(u.atkCd>4);
 e.x=12;h.step();assert.equal(u.mem.attackWindup,undefined);assert.equal(u.atkCd,0);
 e.x=6;h.step();assert.ok(u.mem.attackWindup);h.run(.4);
 assert.equal(h.hooksOf('attack').filter(c=>c.attacker===u).length,1);assert.ok(u.atkCd>4,'a launched shot still waits for its actual attack cooldown');
});
