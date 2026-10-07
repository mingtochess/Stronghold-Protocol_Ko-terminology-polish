import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {installFakePixi} from './fakepixi.js';
import {spineAttackTiming} from '../../shared/attackTiming.js';
let fake,SpineActor;
before(async()=>{fake=installFakePixi();({SpineActor}=await import('../../public/js/render/spine.js'));});
after(()=>fake.restore());
const entry=JSON.parse(readFileSync(new URL('../../.cache/ursus-data/assets.json',import.meta.url))).chars.char_1051_headb2.spine.front;
test('Zima S3 uses the five-strike sequence once, with each bullet aligned to its own marker',()=>{
 const a=new SpineActor({animations:Object.keys(entry.animations).map(name=>({name}))},entry);a.setSkillIndex(2);
 a.setSkill(true);assert.equal(a.current,'Skill_3');assert.equal(a.mode,'base');
 for(const t of entry.hits.Skill_3){a.beginAttack(1.8,1.1);a.attack(1.8);assert.equal(a.current,'Skill_3');assert.equal(a.spine.state.tracks[0].trackTime,t);assert.equal(a.mode,'base');}
 a.setSkill(false);assert.equal(a.mode,'skillCast','last bullet retains the final recovery');a.update(2);assert.equal(a.mode,'base');assert.equal(a.current,'Idle');
});
test('Zima S3 attack timing describes a strike, not the entire five-strike animation',()=>{
 assert.equal(spineAttackTiming(entry).skills[2],undefined,'fixed sequence never supplies ordinary attack timing');
});
