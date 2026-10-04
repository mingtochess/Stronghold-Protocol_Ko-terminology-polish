import {test} from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeBattle,chessRec,enemyRec,checkInvariants} from '../helpers/battleHarness.js';
import {DRONE_ID} from '../../server/sim/content/ursus.js';
const drone={tokenId:DRONE_ID,name:'Drone',stats:{maxHp:13000,atk:1000,def:800,res:50,aspd:100,bat:5,blockCnt:0,cost:0},position:'ALL',rangeGrid:[[0,0],[0,1],[0,2]],dmgType:'phys',canHitFly:true};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
function setup(n,layers=0){
 const chess=Object.fromEntries(Array.from({length:7},(_,i)=>[`u${i}_a`,chessRec({id:`u${i}_a`,bonds:i<6?['ursusShip']:[],stats:{atk:500,maxHp:2000,aspd:100,blockCnt:1},skill:null})]));
 return makeBattle({defs:{chess,tokens:{[DRONE_ID]:drone}},units:Object.keys(chess).map((chessId,i)=>({chessId,row:10,col:i+3})),bonds:{ursusShip:{active:n>=3,count:n,tier:n>=6?2:n>=3?1:0,layers}}});
}
test('Ursus 2: no drone or speed buff',()=>{const h=setup(2);h.step(1);assert.equal(h.b.allyUnits.filter(u=>u.defId===DRONE_ID).length,0);close(h.unit('u0_a').s.aspd,100)});
for(const n of [3,5,6])test(`Ursus ${n}: one drone, layer scaling, selective +50 ASPD`,()=>{
 const h=setup(n,10);h.step(1);const d=h.b.allyUnits.find(u=>u.defId===DRONE_ID);assert.ok(d);close(d.s.atk,1350);close(d.s.maxHp,17550);close(d.hp,d.s.maxHp);close(d.s.aspd,n===6?150:100);close(h.unit('u0_a').s.aspd,n===6?150:100);close(h.unit('u6_a').s.aspd,100);
 h.b.addLayers('p1','ursusShip',20,'test');h.step(2);close(d.s.atk,1550);close(d.s.maxHp,20150);close(d.s.aspd,n===6?150:100);assert.equal(h.b.allyUnits.filter(u=>u.defId===DRONE_ID).length,1);checkInvariants(h.b);
});
test('Default official data has no experimental faction, operators, or drone',()=>{
 for(const [file,key]of [['bonds','ursusShip'],['tokens',DRONE_ID],['chess','chess_custom_ursus_helage_a']])assert.equal(JSON.parse(readFileSync(new URL(`../../data/${file}.json`,import.meta.url)))[key],undefined);
});
test('Coop Ursus effects and live layer gains stay with the owning player',()=>{
 const chess={u_a:chessRec({id:'u_a',bonds:['ursusShip'],stats:{atk:500,maxHp:2000,aspd:100},skill:null})};
 const state=(count,layers)=>({ursusShip:{count,layers,active:count>=3,tier:count>=6?2:1}});
 const h=makeBattle({kind:'unite',flags:{layerGainsEnabled:true},rect:{r0:9,r1:12,c0:2,c1:18},defs:{chess,tokens:{[DRONE_ID]:drone}},players:[
 {playerId:'p1',units:[{chessId:'u_a',row:10,col:3}],bonds:state(6,0)},
 {playerId:'p2',colOffset:8,units:[{chessId:'u_a',row:10,col:12}],bonds:state(3,20)}]});
 h.step(1);const d1=h.b.allyUnits.find(u=>u.defId===DRONE_ID&&u.ownerId==='p1'),d2=h.b.allyUnits.find(u=>u.defId===DRONE_ID&&u.ownerId==='p2');assert.ok(d1&&d2);close(d1.s.atk,1250);close(d2.s.atk,1450);close(d1.s.aspd,150);close(d2.s.aspd,100);
 for(const u of h.b.allyUnits.filter(u=>u.kind==='op'))close(u.s.aspd,u.ownerId==='p1'?150:100);
 h.b.addLayers('p2','ursusShip',10,'test');h.step(2);close(d1.s.atk,1250);close(d2.s.atk,1550);checkInvariants(h.b);
});
