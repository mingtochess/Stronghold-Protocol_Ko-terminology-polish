// Local experiment: inert unless the explicitly selected data directory contains the drone token.
import * as S from './support/index.js';
import {airTile} from './tokens.js';
export const DRONE_ID='token_custom_ursus_drone';
export function install(battle){
 if(!battle.data.rawToken?.(DRONE_ID))return;
 for(const p of battle.players){
  const pid=p.playerId;
  let drone=null;
  const active=()=>S.bondActive(battle,pid,'ursusShip');
  const six=()=>active()&&(S.bondState(battle,pid,'ursusShip').count>=6||S.bondTier(battle,pid,'ursusShip')>=2);
  const refresh=()=>{
   if(drone){const bonus=.25+.01*S.bondLayers(battle,pid,'ursusShip');S.passiveBuff(battle,drone,'bond:ursus:drone',S.directMods({atk:bonus,hp:bonus},{aspd:six()?50:0}));}
   for(const u of battle.allyUnits)if(u.ownerId===pid&&u.kind==='op'&&S.unitBonds(u).includes('ursusShip'))S.passiveBuff(battle,u,'bond:ursus:speed',{aspd:six()?50:0});
  };
  battle.on('battleStart',()=>{
   if(active()){
    const tile=airTile(battle,pid);
    if(tile){drone=battle.spawnToken(pid,DRONE_ID,...tile,{dir:p.dir,anySource:true});if(drone){drone.motion='FLY';refresh();drone.hp=drone.s.maxHp;}}
   }
   refresh();
  },{once:true});
  battle.on('deploy',refresh);
  // Layer state is committed after the event; refresh on the next simulation tick.
  battle.on('layerGain',c=>{if(c.playerId===pid&&c.bondId==='ursusShip')battle.after(0,refresh)},{priority:-100});
 }
}
