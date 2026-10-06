import {test} from 'node:test';import assert from 'node:assert/strict';
import {makeBattle,chessRec,enemyRec} from '../helpers/battleHarness.js';
test('Start animation finishes before the first attack wind-up',()=>{
 const op={...chessRec({id:'start_op',skill:null,stats:{atk:100,blockCnt:0}}),attackTiming:{front:{deploy:1,attack:{dur:1,hit:.4},skills:{}}}};
 const h=makeBattle({content:'generic',autoFinish:false,defs:{chess:{start_op:op},enemies:{dummy:enemyRec({key:'dummy',speed:0,hp:10000,atk:0})}},units:[{chessId:'start_op',row:10,col:3}],enemies:[{key:'dummy',pos:[10,4]}]});
 const u=h.unit('start_op');h.run(.9);assert.equal(u.canAct,false);assert.equal(u.mem.attackWindup,undefined);assert.equal(u.stats.attacks,0);
 h.run(.2);assert.equal(u.canAct,true);assert.ok(u.mem.attackWindup);assert.ok(u.mem.attackWindup.until>=1.4-1e-6);assert.equal(u.stats.attacks,0);
 h.run(.5);assert.ok(u.stats.attacks>0);
});
test('initial units deploy sequentially down the left column before the next column',()=>{
 const op=chessRec({id:'stagger',skill:null});
 const h=makeBattle({content:'generic',autoFinish:false,flags:{deploymentInterval:.1},defs:{chess:{stagger:op}},units:[{chessId:'stagger',row:9,col:3},{chessId:'stagger',row:12,col:3},{chessId:'stagger',row:12,col:4}]});
 h.b.start();
 const units=h.b.allyUnits;
 assert.equal(units.filter(u=>u.deployed).length,1);
 assert.equal(units.find(u=>u.deployed).homeR,12);
 h.run(.15);assert.equal(units.filter(u=>u.deployed).length,2);
 h.run(.15);assert.equal(units.filter(u=>u.deployed).length,3);
 assert.ok(units.find(u=>u.homeC===4).deployedAt>=.2-1e-6);
});

test('wave spawns wait for initial deployment while preserving their relative spacing',()=>{
 const op=chessRec({id:'roster',skill:null});
 const h=makeBattle({content:'generic',autoFinish:false,flags:{deploymentInterval:.2},defs:{chess:{roster:op},enemies:{dummy:enemyRec({key:'dummy',speed:0,hp:10000,atk:0})}},units:[{chessId:'roster',row:10,col:3},{chessId:'roster',row:10,col:4},{chessId:'roster',row:10,col:5}],enemies:[{key:'dummy',time:0,pos:[9,10]},{key:'dummy',time:.3,pos:[9,10]}]});
 h.run(.3);assert.equal(h.enemies().length,0);
 h.run(.2);assert.equal(h.enemies().length,1);
 h.run(.3);assert.equal(h.enemies().length,2);
 assert.equal(h.hooksOf('battleStart').length,1);
});

for (const kind of ['normal','unite','boss','hidden']) test(`${kind}: explicit prep order survives shuffled tiles and boss mirroring`,()=>{
 const op=chessRec({id:'ordered',skill:null});
 const units=[{chessId:'ordered',row:9,col:8,placementOrder:1,uid:11},{chessId:'ordered',row:12,col:3,placementOrder:3,uid:33},{chessId:'ordered',row:10,col:4,placementOrder:2,uid:22}];
 const h=makeBattle({kind,content:'generic',autoFinish:false,flags:{deploymentInterval:.2},defs:{chess:{ordered:op}},players:[{playerId:'p',side:'R',units}]});
 h.b.start();h.run(.6);
 const deployed=h.hooksOf('deploy').filter(e=>e.initial&&e.unit.kind==='op');
 assert.deepEqual(deployed.map(e=>e.unit.uid),[11,22,33]);
 assert.ok(deployed[1].unit.deployedAt>=.2-1e-6);assert.ok(deployed[2].unit.deployedAt>=.4-1e-6);
});
