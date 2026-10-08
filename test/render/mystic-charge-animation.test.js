import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {installFakePixi} from './fakepixi.js';
let fake,SpineActor;before(async()=>{fake=installFakePixi();({SpineActor}=await import('../../public/js/render/spine.js'));});after(()=>fake.restore());
test('Indigo uses Attack_Charge at the charging interval and returns to idle; active skill stance is preserved',()=>{
 const entry=JSON.parse(readFileSync(new URL('../../data/assets.json',import.meta.url))).chars.char_469_indigo.spine.front;
 const a=new SpineActor({animations:Object.keys(entry.animations).map(name=>({name}))},entry);
 assert.equal(a.chargeEnergy(2),true);assert.equal(a.current,'Attack_Charge');assert.equal(a.mode,'energyCharge');
 assert.equal(a.spine.state.tracks[0].timeScale,entry.animations.Attack_Charge/2);
 a.setBase('idle');assert.equal(a.current,'Attack_Charge');a.update(2.05);assert.equal(a.current,'Idle');
 a.skillOn=true;assert.equal(a.chargeEnergy(2),false);assert.equal(a.current,'Idle');
});
