import {num,talentBb} from '../shared/tier1.js';
export {num,talentBb};
export const alive=u=>!!u?.alive&&u.deployed&&!u.hidden;
export const keyOf=(b,u)=>Math.round(u.y)*b.grid.cols+Math.round(u.x);
export const fx=(b,u,kind,extra={})=>b.fx(kind,{id:u.id,src:u.id,x:u.x,y:u.y,...extra});
export const groundProfile=Object.freeze({canHitFly:false,groundOnly:true});
export const inCells=(b,u,cells,air=false)=>b.enemiesInKeys([...cells],u,air?{canHitFly:true,groundOnly:false}:groundProfile);
export function updateBuff(b,u,key,mods,duration=.15){
 const old=u.findBuff(key);
 if(old){old.timeLeft=duration;old.mods=mods;u.markDirty();return old;}
 return b.addBuff(u,{key,mods,duration});
}
export function temporaryDecay(b,u,key,mods,duration){
 const start={...mods};
 return b.addBuff(u,{key,duration,mods,interval:.1,onTick:({buff})=>{const ratio=Math.max(0,buff.timeLeft/duration);buff.mods=Object.fromEntries(Object.entries(start).map(([k,v])=>[k,v*ratio]));u.markDirty();}});
}
