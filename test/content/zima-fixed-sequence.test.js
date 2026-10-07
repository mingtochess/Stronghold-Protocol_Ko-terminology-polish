import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadData} from '../../server/data.js';
import {makeBattle,enemyRec} from '../helpers/battleHarness.js';
import {setGameData} from '../../server/sim/content/support/index.js';
const data=loadData(new URL('../../.cache/ursus-data/',import.meta.url).pathname);
test('Zima S3 spends five bullets on its authored fixed cadence, even without targets and regardless of ASPD',()=>{
 setGameData(data);
 try{const results=[];
 for(const aspd of [-50,0,100]){
 const h=makeBattle({data:{...data,enemies:{...data.enemies,dummy:enemyRec({key:'dummy',hp:1e8,atk:0,speed:0})}},autoFinish:false,captureNoisy:true,units:[{chessId:'chess_custom_ursus_headb2_a',row:10,col:3,skillIndex:2}],enemies:[]});
 h.run(2);const u=h.unit('chess_custom_ursus_headb2_a');h.b.addBuff(u,{key:'test:aspd',mods:{aspd}});u.skill.gainSp(1000,'test');assert.ok(u.skill.activate('test'));
 const start=h.b.time,times=[];h.b.on('ammoUsed',c=>{if(c.unit===u)times.push(h.b.time-start)});h.run(8);
 assert.equal(times.length,5);for(let i=0;i<5;i++)assert.ok(Math.abs(times[i]-[1.1,2.8,4.433,6.067,7.767][i])<.06);
 assert.equal(u.skill.active,false);assert.equal(h.b.errorCount,0);results.push(times);
 }assert.deepEqual(results[0],results[1]);assert.deepEqual(results[1],results[2]);
 }finally{setGameData(null)}
});
