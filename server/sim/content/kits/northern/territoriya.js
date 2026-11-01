// PRTS 国度: persistent territorial cells, ground-only talent, all enemies for S3 attacks.
import {acquireTargets} from '../../../ai.js';
import {alive,num,talentBb,keyOf,fx,inCells,updateBuff} from './common.js';
export function territoriyaKit(_bb,raw){
 const skills=Object.fromEntries(raw.skills.map(s=>{
  const bb=s.bb||{};
  return[s.skillId,{kind:'duration',duration:s.duration,mods:{...(s.index===0?{}:{atkPct:num(bb.atk)}),aspd:s.index===2||s.index===0?num(bb.attack_speed):0},
   ...(s.rangeGrid?{targeting:{rangeGrid:s.rangeGrid}}:{}),
   onStart({battle:b,unit:u,skill}){const st=u.mem.territoriya;if(s.index===0)st.entered.clear();
    if(s.index===1&&++st.s2Casts>=2){skill.timeLeft=Infinity;const running=u.findBuff(skill._buffKey);if(running){running.timeLeft=Infinity;running.duration=Infinity;}b.addBuff(u,{key:'territoriya:permanent-speed',mods:{aspd:num(bb.attack_speed)},duration:Infinity});}
    fx(b,u,'territoriyaArea',{tiles:[...u.rangeKeys],dur:skill.timeLeft,skill:s.index});
   },
   onEnd({battle:b,unit:u,reason}){if(s.index===2){if(reason==='death')u.mem.territoriya.retireCells=new Set([...u.rangeKeys,...u.mem.territoriya.extra]);else{u.mem.territoriya.shownCells=null;u.mem.territoriya.extra.clear();fx(b,u,'territoriyaReset');}}},
  }];
 }));
 return{skills,install(b,u){
  const talent=talentBb(raw,0),retreat=talentBb(raw,1),module=talentBb(raw,-1),bb=u.skill.bb||{};
  const st=u.mem.territoriya={extra:new Set(),entered:new Set(),cells:new Set(),clock:0,lastSpread:-Infinity,s2Casts:0};
  const baseline={...u.profile};u.profile.acquireTargets=(battle,unit)=>{
   if(raw.skill.index===2&&unit.skill.active)return inCells(battle,unit,st.cells);
   return acquireTargets(battle,unit,baseline);
  };
  function cells(){st.cells=new Set([...u.rangeKeys,...st.extra]);return st.cells;}
  b.on('hit',c=>{
   if(!alive(u))return;
   if(u.skill.active&&raw.skill.index===1&&c.target.side==='enemy'&&!c.target.isFlying&&cells().has(keyOf(b,c.target))&&['phys','arts'].includes(c.dmg.type))c.dmg.canDodge=false;
   if(!u.skill.active||raw.skill.index!==2||!alive(c.source)||c.source.side!=='enemy'||c.source.isFlying||!c.dmg.isAttack||!st.cells.has(keyOf(b,c.target))||b.time-st.lastSpread<num(bb['attack@cd'],.5)-1e-9)return;
   st.lastSpread=b.time;const row=Math.round(c.source.y),col=Math.round(c.source.x),newCells=[];
   for(const[dr,dc]of [[1,0],[-1,0],[0,1],[0,-1]])if(b.grid.inRect(row+dr,col+dc)){const key=(row+dr)*b.grid.cols+col+dc;st.extra.add(key);newCells.push(key);}
   // The spread hits the attacker and its four adjacent tiles, not every enemy in the expanded territory.
   const splash=new Set([...newCells,row*b.grid.cols+col]);
   for(const enemy of inCells(b,u,splash))b.dealDamage(u,enemy,{amount:u.s.atk*num(bb['attack@aoe_atk_scale']),type:'phys',isSkill:true,tags:['territoriya-spread']});
   fx(b,u,'territoriyaSpread',{tiles:newCells,target:c.source.id,x:c.source.x,y:c.source.y});
  },{owner:u});
  b.on('tick',({dt})=>{
   if(!alive(u))return;cells();const signature=[...st.cells].sort((a,b)=>a-b).join(',');if(st.shownCells!==signature){st.shownCells=signature;fx(b,u,'territoriyaArea',{tiles:[...st.cells]});}st.clock+=dt;const pulse=st.clock>=1-1e-9;if(pulse)st.clock-=1;
   for(const enemy of inCells(b,u,st.cells)){
    updateBuff(b,enemy,`territoriya:aspd:${u.id}`,{aspd:num(talent.attack_speed)});
    if(pulse)b.dealDamage(u,enemy,{amount:u.s.atk*num(talent.atk_scale),type:'arts',isSkill:false,tags:['territoriya-territory','dot']});
    if(u.skill.active&&raw.skill.index===0&&!st.entered.has(enemy.id)){st.entered.add(enemy.id);b.applyStatus(enemy,'sluggish',{source:u,duration:num(bb.sluggish)});}
   }
   if(num(module.move_speed))for(const enemy of inCells(b,u,new Set(u.rangeKeys)))updateBuff(b,enemy,`territoriya:module:${u.id}`,{moveMul:Math.max(0,1+num(module.move_speed))});
  },{owner:u});
  b.on('deploy',c=>{if(c.unit===u){st.shownCells=null;st.s2Casts=0;st.extra.clear();st.cells.clear();st.entered.clear();delete st.retireCells;st.clock=0;st.lastSpread=-Infinity;}},{owner:u});
  b.on('death',c=>{
   if(c.unit!==u)return;
   // Death/retreat hooks still see the previous territory; remove it only after its retirement burst.
   for(const enemy of inCells(b,u,st.retireCells||cells())){b.dealDamage(u,enemy,{amount:u.s.atk*num(retreat.atk_scale),type:'arts',isSkill:false,tags:['territoriya-retreat']});if(alive(enemy))b.applyStatus(enemy,'stun',{source:u,duration:num(retreat.stun)});}
   st.extra.clear();st.cells.clear();fx(b,u,'territoriyaRetreat');
  },{owner:u});
 }};
}
