// Experimental operators: S1 kits and ordinary trait profiles use the official blackboards.
// Other skill loadouts retain the engine's generic fallback until separately authored.
import {genericKit} from '../generic.js';
import {num,talentBb,traitBb,batMod,isMainHit} from './tier1.js';
import * as S from '../support/index.js';
const STUDENTS=new Set(['char_196_sunbr','char_195_glassb','char_197_poca','char_194_leto','char_103_zima','char_1051_headb2']);
const student=u=>STUDENTS.has(u.def?.raw?.charId);
function kit(bb,raw,def){
 const k=genericKit(bb,raw,def),tal=talentBb(raw),tal2=talentBb(raw,1),tb=traitBb(raw),cid=raw.charId;
 const s1=def.skill?.index===0;
 if(s1&&cid==='char_188_helage')k.skill={...k.skill,attack:{...k.skill?.attack,hits:2,atkScale:num(bb.atk_scale,1)}};
 if(s1&&cid==='char_195_glassb')k.skill={...k.skill,mods:{...k.skill?.mods,batPct:batMod(bb.base_attack_time,raw,def.skill.description)}};
 if(s1&&cid==='char_4224_turdus')k.skill={...k.skill,heal:true,onStart:({unit})=>{unit.mem.ursusHeal=unit.profile.heal;unit.profile.heal={...unit.profile.heal,count:3+num(bb['attack@chain.extra_value'])}},onEnd:({unit})=>{if(unit.mem.ursusHeal)unit.profile.heal=unit.mem.ursusHeal}};
 if(s1&&cid==='char_405_absin')k.skill={...k.skill,targeting:{priority:'lowestHpRatio'}};
 if(s1&&cid==='char_4223_botany')k.skill={...k.skill,attack:{...k.skill?.attack,atkScale:num(bb.atk_scale)}};
 // Alternative skills are selected by content/index.js, which installs their generic effects once.
 const genericInstall=s1?k.install:null;
 k.install=(battle,u)=>{
  genericInstall?.(battle,u);
  if(cid==='char_188_helage'){
   const apply=()=>{if(u.alive&&u.deployed)S.passiveBuff(battle,u,'talent:ursus:hellagur',{aspd:num(tal.min_attack_speed)*Math.min(1,(1-u.hp/u.s.maxHp)/Math.max(.01,1-num(tal.min_hp_ratio,.3))),hpRegen:u.blocking?.length?0:num(tal2.hp_recovery_per_sec)})};
   battle.on('tick',apply,{owner:u});
  }
  if(cid==='char_195_glassb')S.passiveBuff(battle,u,'talent:ursus:istina',{defPct:num(tal.def),aspd:num(tal.attack_speed)});
  if(cid==='char_197_poca'){
   battle.on('hit',c=>{if(c.source===u&&c.target?.side==='enemy'&&c.dmg&&c.target.s.massLevel>=num(tal.value,3))c.dmg.defIgnorePct=Math.max(c.dmg.defIgnorePct||0,num(tal.def_penetrate))},{owner:u});
   for(const a of battle.allyUnits)if(a.ownerId===u.ownerId&&student(a))S.passiveBuff(battle,a,'talent:ursus:rosa',{atkPct:num(tal2.atk)});
  }
  if(cid==='char_405_absin')battle.on('hit',c=>{if(c.source===u&&c.target?.side==='enemy'&&c.dmg&&c.target.hp/c.target.s.maxHp<num(tal.hp_ratio))c.dmg.mul=(c.dmg.mul??1)*num(tal.damage_scale,1)},{owner:u});
  if(cid==='char_194_leto'){
   const key=`talent:ursus:leto:${u.id}`;
   const apply=()=>{for(const a of battle.allyUnits)if(a.ownerId===u.ownerId&&student(a))S.passiveBuff(battle,a,key,{aspd:u.alive&&u.deployed&&u.skill.active?num(tal.attack_speed):0})};
   battle.on('tick',apply);battle.on('skillEnd',apply);
  }
  if(cid==='char_1051_headb2'){
   // The adjacent-platform secondary explosion is intentionally left for a later accuracy pass.
   if(u.profile){u.profile.splashRadius=num(tb['attack@ability_range_radius'],1);u.profile.splashScale=num(tb['attack@atk_scale_2'],.5)*num(tal.damage_scale,1)}
   const key=`talent:ursus:zima:${u.id}`;
   battle.on('tick',()=>{for(const a of battle.allyUnits)if(a.ownerId===u.ownerId&&a.kind==='op'){const v=u.alive&&u.deployed&&u.skill.active?num(tal2.atk)*(student(a)?num(tal2.scale_bonus,2):1):0;S.passiveBuff(battle,a,key,{atkPct:v,defPct:v})}});
  }
  if(cid==='char_4223_botany'){
   let stacks=0;
   battle.on('elementBurst',c=>{if(c.element==='erosion'&&c.target?.side==='enemy'&&u.alive&&u.deployed&&S.bodyInKeys(c.target,new Set(u.rangeKeys))){stacks=Math.min(num(tal.max_stack_cnt,3),stacks+1);S.passiveBuff(battle,u,'talent:ursus:botany',{aspd:stacks*num(tal.attack_speed)})}},{owner:u});
   if(s1)battle.on('damaged',c=>{if(c.source!==u||!c.target?.alive||!c.dmg?.isSkill||!isMainHit(c.dmg))return;const t=c.target,extra=!(t.elem?.erosion>0)&&!t.s.flags.burstLock;const amount=u.s.atk*(num(bb.ep_damage_ratio)+(extra?num(bb['botany_s1_extra.ep_damage_ratio']):0));if(extra)battle.dealDamage(u,t,{amount:u.s.atk*num(bb['botany_s1_extra.atk_scale']),type:'arts',tags:['botany-extra']});battle.dealDamage(u,t,{amount,type:'element',element:'erosion',tags:['skill']})},{owner:u});
  }
 };
 return k;
}
export default Object.fromEntries(['turdus','helage','headb2','glassb','poca','leto','absin','botany'].map(key=>[`chess_custom_ursus_${key}_a`,kit]));
