import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadData} from '../../server/data.js';
import {attackWindup} from '../../shared/attackTiming.js';
import {makeBattle,enemyRec} from '../helpers/battleHarness.js';
const data=loadData();
test('prepared catalogues restore timing for every attack model before freezing',()=>{
 let checked=0;
 for(const [kind,records] of [['chars',data.chess],['enemies',data.enemies],['tokens',data.tokens]])for(const [id,rec] of Object.entries(records||{})){
  const key=rec.assets?.spine||rec.spine||rec.charId||id;
  const sp=data.assets?.[kind]?.[key]?.spine||data.assets?.[kind]?.[id]?.spine;
  const front=sp?.front||sp;
  if(!(front?.animations?.[front.anims?.attack?.loop]>0)||front.anims.attack.via==='idle'||front.anims.attack.loop===front.anims.idle)continue;
  assert.ok(rec.attackTiming?.front?.attack,`${kind}/${id}`);checked++;
 }
 assert.ok(checked>100);assert.ok(Object.isFrozen(data.chess));
});
test('Indigo loaded from prepared data waits for her authored strike frame',()=>{
 const rec=Object.values(data.chess).find(x=>x.charId==='char_469_indigo'&&!x.isGolden);
 const h=makeBattle({content:'generic',captureNoisy:true,autoFinish:false,defs:{chess:{[rec.chessId]:rec},enemies:{dummy:enemyRec({key:'dummy',hp:100000,atk:0,speed:0})}},units:[{chessId:rec.chessId,row:10,col:3}],enemies:[{key:'dummy',pos:[10,4]}]});
 h.step();const u=h.unit(rec.chessId),e=h.enemies()[0];
 h.runUntil(()=>!!u.mem.attackWindup,5);
 assert.ok(attackWindup(u)>.5);assert.ok(u.mem.attackWindup);
 const hp=e.hp;h.run(.4);assert.equal(e.hp,hp);assert.equal(h.eventsOf('atk').filter(x=>x[1]===u.id).length,0);
 h.run(1.5);assert.ok(h.eventsOf('atk').some(x=>x[1]===u.id));assert.equal(h.b.errorCount,0);
});
