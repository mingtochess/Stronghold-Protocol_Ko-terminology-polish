import {test} from 'node:test';import assert from 'node:assert/strict';
import {loadData} from '../../server/data.js';import {makeBattle,enemyRec,checkInvariants} from '../helpers/battleHarness.js';
import {setGameData} from '../../server/sim/content/support/index.js';
const data=loadData(new URL('../../.cache/ursus-data/',import.meta.url).pathname);
const recruits=Object.values(data.chess).filter(c=>c.optionalRecruit&&c.recruitSource==='upstream-0.2.1'&&c.tier===6);
for(const r of recruits)test(`${r.charId} ${r.isGolden?'elite':'normal'}: every selected skill executes with the imported kit`,()=>{
 setGameData(data);try{for(const skill of r.skills){
 const h=makeBattle({data:{...data,enemies:{...data.enemies,dummy:enemyRec({key:'dummy',hp:1e8,atk:300,speed:0})}},autoFinish:false,timeLimit:60,units:[{chessId:r.chessId,row:10,col:4,skillIndex:skill.index}],enemies:[{key:'dummy',pos:[10,5],route:{motion:'WALK',start:[10,5],end:[10,2],checkpoints:[]}}]});
 h.run(3);const u=h.unit(r.chessId);assert.ok(u);u.skill.gainSp(1000);if(!u.skill.active)u.skill.activate('test');h.run(20);
 assert.equal(h.b.errorCount,0,JSON.stringify(h.b.errors));checkInvariants(h.b);
 }}finally{setGameData(null)}
});
