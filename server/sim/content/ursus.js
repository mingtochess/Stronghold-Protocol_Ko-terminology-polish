// Local experiment: inert unless the explicitly selected data directory contains the drone token.
import * as S from './support/index.js';
import {attackClipTiming} from '../../../shared/attackTiming.js';
import {tileFree} from './tokens.js';
import {MOVE_SCALE,COLS,ROWS} from '../constants.js';
import {canTargetEnemy} from '../targeting.js';
import {bodyDist} from '../body.js';
export const DRONE_ID='token_custom_ursus_drone';
export const DRONE_RANGE=2,DRONE_FLIGHT=3,DRONE_BLAST=1.2;
export function droneCenter(battle,pid){
 const R=battle.rect,p=battle.getPlayer(pid);let c0=R.c0,c1=R.c1;
 if(battle.players.length>1){if(p?.half==='R')c0=Math.max(11,c0);else c1=Math.min(10,c1)}
 return [(R.r0+R.r1)/2,Math.min(c1,(c0+c1)/2+1)];
}
export function droneTile(battle,pid){
 const R=battle.rect,[centerR,centerC]=droneCenter(battle,pid),tiles=[];
 for(let r=R.r0;r<=R.r1;r++)for(let c=R.c0;c<=R.c1;c++)if(tileFree(battle,r,c)&&(battle.players.length===1||(battle.getPlayer(pid)?.half==='R'?c>=11:c<=10)))tiles.push([r,c]);
 return tiles.sort((a,b)=>Math.hypot(a[0]-centerR,a[1]-centerC)-Math.hypot(b[0]-centerR,b[1]-centerC)||a[0]-b[0]||a[1]-b[1])[0]||null;
}
export function installDroneBombardment(battle,u){
 u.profile.deferHit=true;u.profile.projectile='mortar';u.profile.visibleRangeRadius=DRONE_RANGE;
 battle.on('attack',({attacker,targets})=>{if(attacker!==u)return;
  const atk=u.s.atk;
  for(const target of targets){const x=target.x,y=target.y;
   battle.fx('bombardShell',{x,y,id:u.id,r:DRONE_BLAST,t:DRONE_FLIGHT,vertical:true});
   battle.after(DRONE_FLIGHT,()=>{
    battle.fx('bombard',{x,y,id:u.id,r:DRONE_BLAST,kind:'emppnt'});
    for(const e of battle.enemiesInRadius(x,y,DRONE_BLAST))if(e.alive&&!e.s.flags.untargetable&&!e.s.flags.sleep)battle.dealDamage(u,e,{amount:atk,type:'phys',isAttack:true,isSkill:false,sourceless:true,tags:['ursus-shell']});
   });
  }
 },{owner:u});
}

export function droneTargets(b,u,inRange=false){
 return b.enemies.filter(e=>canTargetEnemy(u,e,u.profile)&&(!inRange||bodyDist(e,u.x,u.y)<=DRONE_RANGE+1e-9)).sort((a,c)=>b.remainingDistance(a)-b.remainingDistance(c)||a.spawnSeq-c.spawnSeq||a.id-c.id);
}

// Like the existing flying Yan summon, keep its spawn tile reserved but move the airborne world position.
export function installDroneFlight(battle,u){
 u.profile.fixedFacing=true;
 u.profile.noHeal=true;
 u.profile.acquireTargets=(b,unit)=>droneTargets(b,unit,true).slice(0,1);
 const radius=DRONE_RANGE,speed=(u.def.raw.stats.moveSpeed??.5)*MOVE_SCALE;
 const refresh=()=>{const keys=[];for(let r=Math.max(0,Math.floor(u.y-radius));r<=Math.min(ROWS-1,Math.ceil(u.y+radius));r++)for(let c=Math.max(0,Math.floor(u.x-radius));c<=Math.min(COLS-1,Math.ceil(u.x+radius));c++)if(Math.hypot(c-u.x,r-u.y)<=radius+1e-9)keys.push(r*COLS+c);u.rangeKeys=keys;u.rangeKeySet=new Set(keys);u.baseRangeKeys=keys;};
 u.motion='FLY';u.ground=false;for(const key of ['terrain:mire','terrain:smog','terrain:deepsea','terrain:infection'])battle.removeBuff(u,key);u.mem.terrain=0;refresh();
 battle.on('tick',({dt})=>{
  if(!u.alive||!u.deployed)return;
  // Keep pursuing the leading enemy even when other enemies are already in firing range.
  // Ally AI fires first each tick; the movement hook respects its wind-up and recovery.
  const clip=attackClipTiming(u),scale=clip?Math.max(1,Math.min(4,clip.dur/Math.max(.08,u.s.interval))):1;
  const recovery=clip?Math.max(0,clip.dur-clip.hit)/scale:.45;
  if(u.mem.attackWindup || battle.time-u.lastAttackAt<recovery-1e-9){refresh();return;}
  const target=droneTargets(battle,u)[0];
  if(target&&u.canAct&&!u.s.flags.noMove&&!u.s.flags.bind&&speed>0){
   const dx=target.x-u.x,dy=target.y-u.y,d=Math.hypot(dx,dy),stop=radius-.25;
   if(d>stop){const step=Math.min(d-stop,speed*dt),R=battle.rect;u.x=Math.max(R.c0,Math.min(R.c1,u.x+dx/d*step));u.y=Math.max(R.r0,Math.min(R.r1,u.y+dy/d*step));}
  }
  refresh();
 },{owner:u});
}
export function install(battle){
 if(!battle.data.rawToken?.(DRONE_ID))return;
 for(const p of battle.players){
  const pid=p.playerId;
  let drone=null;
  const active=()=>S.bondActive(battle,pid,'ursusShip');
  const six=()=>active()&&(S.bondState(battle,pid,'ursusShip').count>=6||S.bondTier(battle,pid,'ursusShip')>=2);
  const refresh=()=>{
   if(drone){const layers=S.bondLayers(battle,pid,'ursusShip');S.passiveBuff(battle,drone,'bond:ursus:drone',S.directMods({atk:.25+.02*layers,hp:.25+.02*layers},{aspd:six()?50:0}));}
   for(const u of battle.allyUnits)if(u.ownerId===pid&&u.kind==='op'&&S.unitBonds(u).includes('ursusShip'))S.passiveBuff(battle,u,'bond:ursus:speed',{aspd:six()?50:0});
  };
  battle.on('battleStart',()=>{
   if(active()){
    const tile=droneTile(battle,pid);
    if(tile){drone=battle.spawnToken(pid,DRONE_ID,...tile,{dir:p.dir,anySource:true,kit:{trait:{visibleRangeRadius:DRONE_RANGE,fixedFacing:true}}});if(drone){const [r,c]=droneCenter(battle,pid);drone.x=c;drone.y=r;installDroneFlight(battle,drone);installDroneBombardment(battle,drone);refresh();drone.hp=drone.s.maxHp;}}
   }
   refresh();
  },{once:true});
  battle.on('deploy',refresh);
  // Layer state is committed after the event; refresh on the next simulation tick.
  battle.on('layerGain',c=>{if(c.playerId===pid&&c.bondId==='ursusShip')battle.after(0,refresh)},{priority:-100});
 }
}
