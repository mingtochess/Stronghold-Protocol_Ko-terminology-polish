import {test} from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeBattle,chessRec,enemyRec,checkInvariants} from '../helpers/battleHarness.js';
import {DRONE_ID} from '../../server/sim/content/ursus.js';
const drone={tokenId:DRONE_ID,name:'Drone',stats:{maxHp:13000,atk:1000,def:800,res:50,aspd:100,bat:5,blockCnt:0,cost:0},position:'ALL',rangeGrid:[[0,0],[0,1],[0,2]],dmgType:'phys',canHitFly:true};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
function setup(n,layers=0){
 const chess=Object.fromEntries(Array.from({length:7},(_,i)=>[`u${i}_a`,chessRec({id:`u${i}_a`,bonds:i<6?['ursusShip']:[],stats:{atk:500,maxHp:2000,aspd:100,blockCnt:1},skill:null})]));
 return makeBattle({defs:{chess,tokens:{[DRONE_ID]:drone},enemies:{dummy:enemyRec({key:'dummy',hp:1e8,speed:0,atk:0})}},units:Object.keys(chess).map((chessId,i)=>({chessId,row:10,col:i+3})),bonds:{ursusShip:{active:n>=3,count:n,tier:n>=6?2:n>=3?1:0,layers}}});
}
test('Ursus 2: no drone or speed buff',()=>{const h=setup(2);h.step(1);assert.equal(h.b.allyUnits.filter(u=>u.defId===DRONE_ID).length,0);close(h.unit('u0_a').s.aspd,100)});
for(const n of [3,5,6])test(`Ursus ${n}: one drone, layer scaling, selective +50 ASPD`,()=>{
 const h=setup(n,10);h.step(1);const d=h.b.allyUnits.find(u=>u.defId===DRONE_ID);assert.ok(d);close(d.s.atk,1450);close(d.s.maxHp,18850);close(d.hp,d.s.maxHp);close(d.s.aspd,n===6?150:100);close(h.unit('u0_a').s.aspd,n===6?150:100);close(h.unit('u6_a').s.aspd,100);
 h.b.addLayers('p1','ursusShip',20,'test');h.step(2);close(d.s.atk,1850);close(d.s.maxHp,24050);close(d.s.aspd,n===6?150:100);assert.equal(h.b.allyUnits.filter(u=>u.defId===DRONE_ID).length,1);checkInvariants(h.b);
});
test('Default official data has no experimental faction, operators, or drone',()=>{
 for(const [file,key]of [['bonds','ursusShip'],['tokens',DRONE_ID],['chess','chess_custom_ursus_helage_a']])assert.equal(JSON.parse(readFileSync(new URL(`../../data/${file}.json`,import.meta.url)))[key],undefined);
});
test('Coop Ursus effects and live layer gains stay with the owning player',()=>{
 const chess={u_a:chessRec({id:'u_a',bonds:['ursusShip'],stats:{atk:500,maxHp:2000,aspd:100},skill:null})};
 const state=(count,layers)=>({ursusShip:{count,layers,active:count>=3,tier:count>=6?2:1}});
 const h=makeBattle({kind:'unite',flags:{layerGainsEnabled:true},rect:{r0:9,r1:12,c0:2,c1:18},defs:{chess,tokens:{[DRONE_ID]:drone},enemies:{dummy:enemyRec({key:'dummy',hp:1e8,speed:0,atk:0})}},players:[
 {playerId:'p1',units:[{chessId:'u_a',row:10,col:3}],bonds:state(6,0)},
 {playerId:'p2',colOffset:8,units:[{chessId:'u_a',row:10,col:12}],bonds:state(3,20)}]});
 h.step(1);const d1=h.b.allyUnits.find(u=>u.defId===DRONE_ID&&u.ownerId==='p1'),d2=h.b.allyUnits.find(u=>u.defId===DRONE_ID&&u.ownerId==='p2');assert.ok(d1&&d2);close(d1.s.atk,1250);close(d2.s.atk,1650);close(d1.s.aspd,150);close(d2.s.aspd,100);
 for(const u of h.b.allyUnits.filter(u=>u.kind==='op'))close(u.s.aspd,u.ownerId==='p1'?150:100);
 h.b.addLayers('p2','ursusShip',10,'test');h.step(2);close(d1.s.atk,1250);close(d2.s.atk,1850);checkInvariants(h.b);
});

test('Drone +50 ASPD shortens actual launches from five seconds to 3.33 seconds',()=>{
 const counts=[];
 for(const n of [3,6]){
  const h=setup(n),b=h.b;h.step();
  const d=b.allyUnits.find(u=>u.defId===DRONE_ID);
  const e=h.spawn('dummy',{route:{motion:'WALK',start:[10,7],end:[10,2],checkpoints:[]},pos:[10,7]});
  e.base.maxHp=1e8;e.hp=1e8;e.base.moveSpeed=0;e.markDirty();
  h.run(10.2);counts.push(d.stats.attacks);close(d.s.interval,n===6?5/1.5:5);
 }
 assert.deepEqual(counts,[3,4]);
});

test('drone pursues the enemy nearest the base despite other enemies in range, fires while travelling, and resumes',()=>{
 const h=setup(3);h.step();const d=h.b.allyUnits.find(u=>u.defId===DRONE_ID);d.x=8;d.y=10;d.atkCd=1;
 const leading=h.spawn('dummy',{pos:[10,3],route:{motion:'WALK',start:[10,3],end:[10,2],checkpoints:[]}});
 const nearby=h.spawn('dummy',{pos:[10,7],route:{motion:'WALK',start:[10,7],end:[10,2],checkpoints:[]}});
 leading.base.moveSpeed=nearby.base.moveSpeed=0;leading.markDirty();nearby.markDirty();
 h.run(.5);assert.ok(d.x<8,'does not park beside an in-range trailing enemy');const x=d.x;
 h.run(.7);assert.ok(d.stats.attacks>=1,'fires when cooldown expires during pursuit');
 assert.ok(h.eventsOf('atk').some(e=>e[1]===d.id&&e[2]===nearby.id),'fires at nearest base enemy within current radius');
 h.run(1);assert.ok(d.x<x,'resumes pursuit after its attack');assert.equal(d.profile.fixedFacing,true);
 assert.equal(h.eventsOf('spawn').find(e=>e[1].id===d.id)?.[1].fixedFacing,true,'spawn metadata carries fixed facing before flight installation');
});

test('drone cannot receive external heals and targets large enemy bodies intersecting its radius',()=>{
 const h=setup(3);h.step();const d=h.b.allyUnits.find(u=>u.defId===DRONE_ID),source=h.allies().find(u=>u.kind==='op');
 d.hp-=1000;const before=d.hp;
 h.b.heal(source,d,1000);assert.equal(d.hp,before);assert.equal(d.profile.noHeal,true);
 const enemy=h.spawn('dummy',{pos:[10,10],route:{motion:'WALK',start:[10,10],end:[10,2],checkpoints:[]}});
 d.x=7.5;d.y=10;
  // Use the same body shape as the stationary bosses (half width one tile).
 enemy.hitArea={width:3,height:1,offsetX:0,offsetY:0};
 assert.ok(d.profile.acquireTargets(h.b,d).includes(enemy),'body, not just its centre, can be within firing range');
});
