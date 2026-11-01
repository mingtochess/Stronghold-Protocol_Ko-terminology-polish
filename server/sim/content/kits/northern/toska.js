import {hypot} from '../../../detmath.js';
// PRTS 冻河: one-use trigger marks are distinct from the timed buffs produced by consuming them.
import {alive,num,talentBb,fx,temporaryDecay} from './common.js';
const markKey=(u,index)=>`toska:trigger:${index}:${u.id}`;
const hasMark=(a,index)=>a.buffs.some(x=>x.tags?.includes(`toska-trigger-${index}`));
const eligible=(b,u,global=false)=>b.allyUnits.filter(a=>alive(a)&&a.kind==='op'&&a!==u&&(global||u.rangeKeySet.has(Math.round(a.y)*b.grid.cols+Math.round(a.x))));
const spRatio=a=>a.skill?.spCost>0?(a.skill.spTotal||0)/a.skill.spCost:0;
const bySp=(a,b)=>spRatio(b)-spRatio(a)||a.id-b.id;
export function toskaKit(_bb,raw){
 const skills=Object.fromEntries(raw.skills.map(s=>{
  const bb=s.bb||{};
  if(s.index<2)return[s.skillId,{kind:'instant',trigger:'SP_FULL',hasTargets:({battle:b,unit:u})=>eligible(b,u,s.index===1).some(a=>!hasMark(a,s.index)),onStart({unit:u}){u.mem.toska.give(s.index,bb);}}];
  return[s.skillId,{kind:'duration',duration:s.duration,mods:{aspd:num(bb.attack_speed)},targeting:{maxTargets:num(bb['attack@max_target'],4)},attack:{atkScale:num(bb['attack@atk_scale']),onEachHit({battle,unit,target}){battle.applyStatus(target,'stun',{duration:num(bb['attack@stun']),source:unit});}},
   onStart({unit:u}){u.mem.toska.give(2,bb);}}];
 }));
 return{skills,install(b,u){
  const talent=talentBb(raw,0),second=talentBb(raw,1);const st=u.mem.toska={enhanced:false,marks:new Map(),acc:0};
  function talentTrigger(target,index,bb){
   if(alive(u)){u.skill.gainSp(num(talent.sp),'toska-trigger');const a=b.injuredAlliesInKeys(u.rangeKeys,u).filter(x=>x.kind==='op')[0];if(a)b.heal(u,a,u.s.atk*num(talent.heal_scale),{talent:true});}
   fx(b,u,'toskaTrigger',{target:target.id,kind:index,dur:num(index===0?bb.shield_time:index===1?bb.buff_duration:bb.bonus_duration,15)});
  }
  function remove(a,index){b.removeBuff(a,markKey(u,index));st.marks.delete(a.id);}
  function apply(a,index,bb){
   b.addBuff(a,{key:markKey(u,index),duration:Infinity,tags:[`toska-trigger-${index}`],data:{owner:u.id}});st.marks.set(a.id,{unit:a,index,bb});st.enhanced=true;
   fx(b,u,'toskaMark',{target:a.id,kind:index});
  }
  function consume(a,index,bb,source=null){
   remove(a,index);talentTrigger(a,index,bb);
   if(index===0){const duration=num(bb.shield_time,10),amount=u.s.atk*num(bb.shield_atk_scale);
    b.addBuff(a,{key:`toska:barrier:${u.id}`,duration,shield:amount,interval:.1,visible:true,onTick:({buff})=>{buff.shield=Math.max(0,buff.shield-amount*.1/duration);a.markDirty();}});
    if(alive(source))b.applyStatus(source,'stun',{source:u,duration:num(bb.stun)});
   }else if(index===1){b.addBuff(a,{key:`toska:auto:${u.id}`,duration:num(bb.buff_duration,15),mods:{aspd:num(bb.attack_speed)},data:{toskaAuto:true}});
   }else{
    for(const target of new Set([a,u]))if(alive(target))temporaryDecay(b,target,`toska:atk:${u.id}`,{atkPct:num(bb.bonus_init_atk)},num(bb.bonus_duration,15));
    const next=b.allyUnits.filter(x=>alive(x)&&x.kind==='op'&&x!==a&&u.rangeKeySet.has(Math.round(x.y)*b.grid.cols+Math.round(x.x))&&!hasMark(x,2)).sort(bySp)[0];
    if(next)apply(next,index,bb);
   }
  }
  st.give=(index,bb)=>{
   const candidates=eligible(b,u,index===1).sort(index===1?bySp:(a,c)=>a.hp/a.s.maxHp-c.hp/c.s.maxHp||a.id-c.id);
   if(index===2){const old=[...st.marks.values()].find(x=>x.index===2&&alive(x.unit));if(old){consume(old.unit,2,bb);return;}}
   let left=num(bb.max_target,1);
   for(const a of candidates)if(left>0&&!hasMark(a,index)){
    if(index===1){const speed=10;fx(b,u,'toskaDelivery',{target:a.id,t:hypot(a.x-u.x,a.y-u.y)/speed});b.addProjectile({from:u,target:a,speed,source:u,visual:'projectile_chr_tocka_s2',onHit:({target})=>{if(alive(target))apply(target,index,bb);}});}
    else apply(a,index,bb);left--;
   }
  };
  b.on('hit',c=>{
   if(c.source?.side!=='enemy'||!c.dmg.isAttack||!['phys','arts','true'].includes(c.dmg.type))return;
   const mark=st.marks.get(c.target.id);if(mark?.index===0&&c.target.findBuff(markKey(u,0)))consume(c.target,0,mark.bb,c.source);
  },{owner:u});
  b.on('skillActivating',c=>{
   const mark=st.marks.get(c.unit.id);if(mark?.index===2&&c.unit.findBuff(markKey(u,2)))consume(c.unit,2,mark.bb);
  },{owner:u});
  b.on('beforeAttack',c=>{
   if(c.attacker!==u||!st.enhanced||!num(second['attack@t2_buff_duration']))return;
   st.enhanced=false;c.profile.splashRadius=num(second['attack@projectile_range'],1.5);c.profile.tags=[...(c.profile.tags||[]),'toska-enhanced'];
   // Select the authored enhanced projectile; no extra simulated attack is created.
   c.profile.projectile='arts';c.profile.visualProjectile='projectile_chr_tocka_t2';
  },{owner:u});
  b.on('damaged',c=>{
   if(c.source!==u||!c.dmg.isAttack||!c.dmg.tags?.includes('toska-enhanced')||!alive(c.target))return;
   const target=c.target;b.addBuff(target,{key:`toska:trace:${u.id}`,duration:num(second['attack@t2_buff_duration']),mods:{atkMul:1+num(second['attack@t2_atk'])},interval:1,onTick:()=>{if(alive(target))b.dealDamage(u,target,{amount:u.s.atk*num(second['attack@t2_magic_atk_scale']),type:'arts',isSkill:false,tags:['toska-trace','dot']});}});
  },{owner:u});
  b.on('tick',({dt})=>{
   st.acc+=dt;const spTick=st.acc>=1-1e-9;if(spTick)st.acc-=1;
   for(const [id,mark]of st.marks){const a=mark.unit;if(!alive(a)||!a.findBuff(markKey(u,mark.index))){st.marks.delete(id);continue;}
    if(mark.index===1&&a.canAct&&!a.s.flags.silence&&a.skill?.ready&&!a.skill.active&&a.skill.kind!=='passive'){consume(a,1,mark.bb);}
    if(mark.index===2&&spTick&&alive(u)&&raw.skill.index===2&&u.skill.active)a.skill.gainSp(num(mark.bb.bonus_sp),'toska-s3');
   }
   for(const a of b.allyUnits)if(alive(a)&&a.canAct&&!a.s.flags.silence&&a.buffs.some(x=>x.data?.toskaAuto)&&a.skill?.ready&&!a.skill.active&&a.skill.kind!=='passive'&&!a.skill._opCooling()&&b.time>=(a.mem.skillCastUntil||0))a.skill.activate('toska-auto');
  },{owner:u});
 }};
}
