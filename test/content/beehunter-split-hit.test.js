import {test} from 'node:test';import assert from 'node:assert/strict';
import {loadData} from '../../server/data.js';import {makeBattle,enemyRec} from '../helpers/battleHarness.js';import {hitCount} from '../../server/sim/content/enemies.js';
const data=loadData(new URL('../../.cache/ursus-data/',import.meta.url).pathname);
for(const suffix of ['a','b'])for(const def of [0,300,5000])test(`Beehunter ${suffix} DEF ${def}: two half-final-damage hits, one attack`,()=>{
 const id=`chess_custom_ursus_brownb_${suffix}`,rec={...data.chess[id],garrisonIds:[]};
 const h=makeBattle({data:{...data,chess:{...data.chess,[id]:rec},enemies:{...data.enemies,dummy:enemyRec({key:'dummy',hp:1e8,speed:0,atk:0,def})}},captureNoisy:true,autoFinish:false,units:[{chessId:id,row:10,col:4,skillIndex:1}]});h.run(2);const u=h.unit(id);const e=h.spawn('dummy',{pos:[10,5]});h.run(2);
 const attacks=h.hooksOf('attack').filter(c=>c.attacker===u),hits=h.hooksOf('damaged').filter(c=>c.source===u&&c.dmg.isAttack);
 assert.ok(attacks.length>1);assert.equal(hits.length,attacks.length*2);
 for(const c of hits){const full=Math.max(c.dmg.amount-e.s.def,c.dmg.amount*.05);assert.ok(Math.abs(c.amount-full/2)<1e-6,`${c.amount} vs ${full/2}`);}
 e.hp=100;hitCount(h.b,e,true);const n=attacks.length;h.run(1);const added=h.hooksOf('attack').filter(c=>c.attacker===u).length-n;assert.equal(100-e.hp,added*2);
});
