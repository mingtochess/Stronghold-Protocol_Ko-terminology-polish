// Procedural fallback is world anchored and uses the same simulation event positions as official FX.
const FIRE=0xff8c43,ICE=0x8ee1ed,DARK=0x7899cf;
const known=kind=>/^(talulah|territoriya|toska)/.test(kind);
const waveKey=(id,e)=>`${id}:${e.wave}:${e.lane}`;
function dropWave(fx,key){const wave=fx._northernWaves?.get(key);if(wave?.visual)fx._releaseProj(wave.visual);fx._northernWaves?.delete(key);}
function drawWave(fx,w){
 const cam=fx.ctx.cam(),height=w.dx!==0?.18:0,z=fx._groundZ(w.x,w.y)+height,p=cam.project(w.x,w.y,z),q=cam.project(w.x-w.dx*.4,w.y-w.dy*.4,z);
 const pr=w.visual,s=p.s/128;
 for(const sp of [pr.halo,pr.core,pr.trail]){sp.visible=true;sp.position.set(p.x,p.y);}
 pr.halo.scale.set(s*.8);pr.halo.alpha=.8;pr.core.scale.set(s*.28);pr.core.alpha=1;
 pr.trail.rotation=Math.atan2(p.y-q.y,p.x-q.x);pr.trail.scale.set(Math.hypot(p.x-q.x,p.y-q.y)/128,s*.2);pr.trail.alpha=.85;
}
export function clearNorthernSimpleFx(fx){for(const key of fx._northernWaves?.keys()||[])dropWave(fx,key);fx._northernAreas?.clear();}

export function northernSimpleFx(fx,kind,x,y,e={}){
 if(!known(kind))return false;
 const owner=fx._viewOf(e.src??e.id),ts=fx._ts();
 const target=fx._viewOf(e.target)||owner;
 const pulse=(at,color,r=.65)=>{const p=at||{x,y},z=fx._groundZ(p.x,p.y);fx.ring(p.x,p.y,z+.015,.08,r,color,.35/ts);};
 const cells=tiles=>(tiles||[]).map(k=>Array.isArray(k)?k:[Math.floor(k/21),k%21]);
 if(kind==='talulahWave'){
  const waves=fx._northernWaves??=new Map();if(waves.size>=128)dropWave(fx,waves.keys().next().value);
  const key=waveKey(e.src??e.id,e);dropWave(fx,key);const visual=fx._takeProj();
  visual.halo.texture=fx.tex.glow;visual.halo.tint=FIRE;visual.core.texture=fx.tex.orb;visual.core.tint=0xffe9ab;visual.trail.texture=fx.tex.tracer;visual.trail.tint=FIRE;visual.shadow.visible=false;visual.path?.clear();
  waves.set(key,{visual,x,y,dx:Number(e.dx)||0,dy:Number(e.dy)||0,speed:Number(e.speed)||0,left:Number(e.dur)||0,clock:0});drawWave(fx,waves.get(key));return true;
 }
 if(kind==='talulahWaveHit'){dropWave(fx,waveKey(e.src??e.id,e));pulse({x,y},FIRE,1.5);return true;}
 if(kind==='talulahChannelEnd'){for(const key of fx._northernWaves?.keys()||[])if(key.startsWith((e.src??e.id)+':'))dropWave(fx,key);return true;}
 if(kind==='talulahTrail'){fx.tileFlash([[Math.round(y),Math.round(x)]],FIRE,Math.min(1,Number(e.dur)||.4)/ts);return true;}
 if(kind==='territoriyaArea'){(fx._northernAreas??=new Map()).set(e.src??e.id,{tiles:cells(e.tiles),clock:0});fx.tileFlash(cells(e.tiles),DARK,.4/ts);return true;}
 if(kind==='territoriyaSpread'){fx.tileFlash(cells(e.tiles),DARK,.5/ts);return true;}
 if(kind==='territoriyaReset'||kind==='territoriyaRetreat'){fx._northernAreas?.delete(e.src??e.id);if(kind==='territoriyaReset')return true;}
 pulse(kind==='talulahS1'?{x,y}:target,kind.startsWith('talulah')?FIRE:kind.startsWith('toska')?ICE:DARK,kind==='territoriyaRetreat'?1.7:.7);
 return true;
}
export function updateNorthernSimpleFx(fx,dt){
 const elapsed=dt*fx._ts();
 for(const[id,area]of fx._northernAreas||[]){const owner=fx._viewOf(id);if(!owner||owner.alive===false){fx._northernAreas.delete(id);continue;}area.clock+=elapsed;if(area.clock>=.25){area.clock%=.25;fx.tileFlash(area.tiles,DARK,.4/fx._ts());}}
 if(!fx._northernWaves?.size)return;
 for(const[key,w]of fx._northernWaves){w.left-=elapsed;if(w.left<=0){dropWave(fx,key);continue;}w.x+=w.dx*w.speed*elapsed;w.y+=w.dy*w.speed*elapsed;w.clock+=elapsed;drawWave(fx,w);
  if(w.clock>=.15){w.clock=0;fx.ring(w.x,w.y,fx._groundZ(w.x,w.y)+.02,.08,.38,FIRE,.2/fx._ts());}
 }
}
