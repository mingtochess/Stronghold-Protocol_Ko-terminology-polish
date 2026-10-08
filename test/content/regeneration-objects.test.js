import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadData} from '../../server/data.js';
import {makeBattle,chessRec} from '../helpers/battleHarness.js';
const data=loadData(new URL('../../.cache/ursus-data/',import.meta.url).pathname);
for(const real of [false,true])test(`${real?'Skadi S2':'bard trait'} regenerates objects and unhealable summons without direct healer targeting`,()=>{
 const id=real?'chess_char_6_04_a':'test_bard';
 const h=makeBattle({data:real?data:undefined,content:real?undefined:'none',defs:real?undefined:{chess:{test_bard:chessRec({id:'test_bard',profession:'SUPPORT',subProfessionId:'bard',skill:null,rangeGrid:[[0,0],[0,1],[0,2]],stats:{atk:100}})}},units:[{chessId:id,row:10,col:3, ...(real?{skillIndex:1}:{})}],autoFinish:false});
 h.run(2);const bard=h.unit(id);
 if(real){assert.equal(bard.skill.id,'skchr_skadi2_2');bard.skill.sp=bard.skill.spCost;h.run(.6);assert.equal(bard.skill.active,true);}
 const tile=bard.rangeKeys.map(k=>[Math.floor(k/21),k%21]).find(([r,c])=>h.b.grid.inRect(r,c)&&!(r===10&&c===3));
 const obj=h.b.spawnDevice('test_object',...tile,{hp:1000,blockCnt:0});assert.ok(obj);
 obj.hp=300;
 assert.equal(h.b.heal(bard,obj,100),0);
 assert.equal(h.b.injuredAlliesInKeys(bard.rangeKeys,bard).includes(obj),false);
 assert.equal(h.b.alliesInGrid(bard).includes(obj),false);
 assert.equal(h.b.alliesInGrid(bard,{includeDevices:true}).includes(obj),true);
 h.run(2);assert.ok(obj.hp>300,`actual aura must restore object HP, got ${obj.hp}`);
 if(real){
 const pos=bard.rangeKeys.map(k=>[Math.floor(k/21),k%21]).find(([r,c])=>h.b.grid.inRect(r,c)&&!(r===10&&c===3)&&!(r===tile[0]&&c===tile[1]));
 const shadow=h.b.spawnToken(bard,'token_10035_wisdel_wward',...pos,{anySource:true});assert.ok(shadow);h.run(3);shadow.hp=shadow.s.maxHp/2;const hp=shadow.hp;
 assert.equal(h.b.heal(bard,shadow,100),0);h.run(2);assert.ok(shadow.hp>hp,'actual Skadi aura restores shadow HP');
 }
});
