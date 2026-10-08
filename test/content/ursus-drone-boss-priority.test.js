import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeBattle,enemyRec} from '../helpers/battleHarness.js';
import {droneTargets} from '../../server/sim/content/ursus.js';
test('Ursus drone prioritises bosses, choosing the closest boss; firing considers only in-range candidates',()=>{
 const h=makeBattle({defs:{enemies:{dummy:enemyRec({key:'dummy',hp:1e8,atk:0,speed:0})}},autoFinish:false,units:[{chessId:'chess_char_1_01_a',row:10,col:3}],enemies:[]});h.run(2);const u=h.b.allyUnits[0];
 const spawn=c=>h.spawn('dummy',{pos:[10,c],route:{motion:'WALK',start:[10,c],end:[10,2],checkpoints:[]}});
 const ordinary=spawn(4),farBoss=spawn(8),nearBoss=spawn(5);farBoss.isBoss=nearBoss.isBoss=true;farBoss.tag=nearBoss.tag='boss';
 assert.equal(droneTargets(h.b,u)[0],nearBoss,'closest boss beats base-leading ordinary enemy and farther boss');
 assert.equal(droneTargets(h.b,u,true)[0],nearBoss,'in-range boss wins firing priority');
 nearBoss.x=7;assert.equal(droneTargets(h.b,u)[0],nearBoss);assert.equal(droneTargets(h.b,u,true)[0],ordinary,'can shoot ordinary enemies while approaching out-of-range bosses');
 farBoss.isBoss=nearBoss.isBoss=false;farBoss.tag=nearBoss.tag='bounty';farBoss.def={...farBoss.def,rank:'BOSS'};nearBoss.def={...nearBoss.def,rank:'BOSS'};assert.equal(droneTargets(h.b,u)[0],ordinary,'bounty bosses use ordinary base-distance priority');
});
