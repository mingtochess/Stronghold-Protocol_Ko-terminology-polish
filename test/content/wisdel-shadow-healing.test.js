import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadData} from '../../server/data.js';
import {makeBattle,chessRec} from '../helpers/battleHarness.js';
import {heal} from '../../server/sim/damage.js';
import {bardRegen} from '../../server/sim/professions.js';
const data=loadData(new URL('../../.cache/ursus-data/',import.meta.url).pathname);
test('Wisdel shadow refuses direct healing and healer targeting, but receives bard regeneration',()=>{
 const h=makeBattle({data:{...data,chess:{...data.chess,test_healer:chessRec({id:'test_healer',profession:'MEDIC',dmgType:'heal',skill:null,rangeGrid:[[0,0],[0,1]],stats:{atk:100}})}},units:[{chessId:'test_healer',row:10,col:3}],autoFinish:false});
 h.run(1);const healer=h.unit('test_healer');
 const shadow=h.b.spawnToken(healer,'token_10035_wisdel_wward',10,4,{anySource:true});assert.ok(shadow);h.run(1.1);h.run(1.1);
 shadow.hp=shadow.s.maxHp/2;const before=shadow.hp;
 assert.equal(heal(h.b,healer,shadow,100),0);
 assert.equal(h.b.injuredAlliesInKeys(new Set([10*21+4]),healer).includes(shadow),false);
 bardRegen(h.b,healer,shadow,100,2);h.run(.5);
 assert.ok(shadow.hp>before);
 assert.equal(shadow.name,'레버넌트의 그림자');
});
