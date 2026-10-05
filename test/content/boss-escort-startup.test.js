// Actual boss waves, including escorts, across both health phases and field sizes.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeBattle,chessRec} from '../helpers/battleHarness.js';
const waves=JSON.parse(fs.readFileSync(new URL('../../data/waves.json',import.meta.url)));
const rec=chessRec({id:'audit_wall',skill:null,stats:{maxHp:1e7,atk:0,def:500,res:30,blockCnt:3},rangeGrid:[[0,0]]});
for(const wave of Object.values(waves).filter(w=>['boss','hidden'].includes(w.kind))){
 test(`${wave.id}: leader, parts and escorts have no premature startup damage or invalid state`,()=>{
  for(const ratio of [1,.49]){
   const maxHp=1e8,sharedBoss={maxHp,hp:maxHp*ratio,damage(pid,n){this.hp=Math.max(0,this.hp-n);}};
   const errors=[];
   const players=(wave.solo?['L']:['L','R']).map((side,seat)=>({playerId:'p'+(seat+1),seat,side,colOffset:seat*10,units:Array.from({length:8},(_,i)=>({uid:i+1,chessId:'audit_wall',row:9+i%4,col:3+Math.floor(i/4),dir:side==='L'?'RIGHT':'LEFT'}))}));
   const h=makeBattle({kind:wave.kind,waveTemplate:wave,players,sharedBoss,autoFinish:false,timeLimit:90,defs:{chess:{audit_wall:rec}},kits:{audit_wall:()=>({trait:{noAttack:true}})},flags:{deploymentInterval:.2},captureNoisy:true,hooks:['damaged','enemySpawn'],logger:{error(...args){errors.push(args)},warn(){},info(){},debug(){}},setup(b){b.opts.templateId=wave.id;b.enemyOverrides=wave.overrides||{};}});
   h.run(1.3);assert.equal(h.hooksOf('damaged').filter(c=>c.target.side==='ally').length,0,'no damage before the staggered roster completes');
   h.run(78.7);assert.deepEqual(errors,[],'no swallowed content exceptions');assert.equal(h.invariants(),true);
   const hits=h.hooksOf('damaged').filter(c=>c.target.side==='ally');
   for(const c of hits){assert.ok(Number.isFinite(c.amount)&&c.amount>=0,'finite damage');assert.ok(c.source?.side==='enemy'||c.source===null,'enemy or explicitly sourceless damage');}
   const spawned=new Set(h.hooksOf('enemySpawn').map(c=>c.enemy.defId));
   for(const s of wave.spawns.filter(s=>(s.time??0)<75))assert.ok(spawned.has(s.key??s.enemyKey),`scheduled leader/escort ${s.key??s.enemyKey} actually runs`);
   const barrage=hits.filter(c=>c.source?.defId==='enemy_10027_vtsk'&&c.dmg.tags.includes('entranceBarrage'));
   const times=new Set();for(const c of barrage){const key=c.source.id+':'+c.t;assert.ok(!times.has(key),'no same-frame entrance barrage burst');times.add(key);}
  }
 });
}
