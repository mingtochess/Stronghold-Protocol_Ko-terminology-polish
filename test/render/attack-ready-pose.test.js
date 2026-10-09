import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {installFakePixi} from './fakepixi.js';
let fake,SpineActor;
before(async()=>{fake=installFakePixi();({SpineActor}=await import('../../public/js/render/spine.js'));});
after(()=>fake.restore());
const entry=JSON.parse(readFileSync(new URL('../../data/assets.json',import.meta.url))).chars.char_498_inside.spine.front;
function actor(continuous=true){const a=new SpineActor({animations:Object.keys(entry.animations).map(name=>({name}))},entry);a.clipPerAttack=true;a.continuousAttacks=continuous;return a;}
test('Insider holds Attack_Idle between shots, and lowers the gun only after the cadence stops',()=>{
 const a=actor();
 a.beginAttack(1.6,0);a.attack(1.6);a.update(1.01);
 assert.equal(a.current,'Attack_Idle');assert.equal(a.mode,'attackRest');
 a.update(.59);a.beginAttack(1.6,0);a.attack(1.6);
 assert.equal(a.current,'Attack_Loop');a.update(1.01);assert.equal(a.current,'Attack_Idle');
 a.update(.72);assert.equal(a.current,'Attack_End');assert.equal(a.mode,'base');
});
test('ready pose is interrupted by stun/cancellation and does not apply to enemies or one-off casts',()=>{
 for(const action of [a=>a.cancelAttack(),a=>a.setBase('stun')]){
  const a=actor();a.beginAttack(1.6,0);a.attack(1.6);a.update(1.01);action(a);
  assert.notEqual(a.mode,'attackRest');
  if(a.mode==='stun')assert.equal(a.frozen,true,'models without Stun freeze the current pose');
  else assert.notEqual(a.current,'Attack_Idle');
 }
 const enemy=actor(false);enemy.beginAttack(1.6,0);enemy.attack(1.6);enemy.update(1.01);assert.equal(enemy.current,'Attack_End');
 const cast=actor();cast.attack(1.6,true);cast.update(1.01);assert.equal(cast.current,'Attack_End');
});
