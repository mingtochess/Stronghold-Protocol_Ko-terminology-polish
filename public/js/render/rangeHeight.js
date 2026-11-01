import {TILE_H} from './style.js';

// Only the attack-range overlay uses these two planes. Standing/picking/physics
// continue to use the terrain and device model's actual heights.
export function officialRangeHeight(tile, raisedDevice=false){
 return tile?.h>0 || tile?.raised || raisedDevice ? TILE_H.wall : 0;
}

export function raisedRangeTiles(devices=[]){
 const cells=new Set();
 for(const d of devices){
  if(!d || d.active===false || (d.active!==true && d.hidden) || !['platform','crate','mound'].includes(d.role??d.kind))continue;
  const [r,c]=d.pos??[d.r,d.c];
  if(Number.isInteger(r)&&Number.isInteger(c))cells.add(`${r},${c}`);
 }
 return cells;
}
