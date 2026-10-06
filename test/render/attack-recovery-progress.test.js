import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {installFakePixi} from './fakepixi.js';
const assets=JSON.parse(readFileSync(new URL('../../data/assets.json',import.meta.url)));
let fake,SpineActor;
before(async()=>{fake=installFakePixi();({SpineActor}=await import('../../public/js/render/spine.js'));});
after(()=>fake.restore());
function actor(entry,index){const a=new SpineActor({animations:Object.keys(entry.animations).map(name=>({name}))},entry);a.clipPerAttack=true;if(index!=null){a.setSkillIndex(index);a.skillOn=true;}return a;}
function check(entry,index,label){
 const a=actor(entry,index),clip=a._attackClip();if(!clip||a._continuousSkillLoop())return false;
 const duration=a.dur(clip.loop),hit=a._hitTime(clip.loop,duration);if(!(hit>0&&duration>hit))return false;
 const interval=Math.max(duration,1.6);
 a.beginAttack(interval,hit);
 // An event can be displayed one render frame before the skeleton reaches its OnAttack key.
 a.update(Math.max(0,hit-.03));
 const e=a.spine.state.tracks[0],position=e.trackTime;
 a.attack(interval);
 assert.equal(a.spine.state.tracks[0],e,`${label}: no restart at impact`);
 assert.ok(Math.abs(a.attackUntil-a.clock-(duration-position)/e.timeScale)<1e-8,`${label}: deadline uses the actual pose`);
 const remaining=(duration-position)/e.timeScale;
 a.update(Math.max(0,remaining-.001));
 assert.equal(a.current,clip.loop,`${label}: recovery retained`);
 let finalProgress=0;const update=a.spine.update.bind(a.spine);
 a.spine.update=dt=>{update(dt);finalProgress=e.trackTime;};
 a.update(.002);
 assert.ok(finalProgress>=duration,`${label}: final frame advances before idle`);
 return true;
}
test('Vendela S2 Front and Back finish their short Skill attack recovery before idle',()=>{
 for(const face of ['front','back'])assert.ok(check(assets.chars.char_494_vendla.spine[face],1,`Vendela ${face}`));
});
test('all manifest operator, enemy and token attack clips share the recovery fix',()=>{
 let count=0;
 for(const group of ['chars','enemies','tokens'])for(const [id,value] of Object.entries(assets[group]||{})){
  const sp=value.spine;if(!sp)continue;
  for(const [face,entry] of sp.front?Object.entries(sp).filter(([k])=>k==='front'||k==='back'):[['front',sp]]){
   if(!entry?.animations||!entry.anims)continue;
   if(check(entry,null,`${id}/${face}/attack`))count++;
   for(const index of Object.keys(entry.anims.skills||{}))if(check(entry,Number(index),`${id}/${face}/S${Number(index)+1}`))count++;
  }
 }
 assert.ok(count>500,`audited ${count} attack clips`);
 console.log(`Recovery audit: ${count} authored attack/skill clips`);
});
