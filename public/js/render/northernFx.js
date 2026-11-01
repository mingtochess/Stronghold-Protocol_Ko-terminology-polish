// Procedural fallback is world anchored and uses the same simulation event positions as official FX.
const FIRE=0xff8c43,ICE=0x8ee1ed,DARK=0x7899cf;
const known=kind=>/^(talulah|territoriya|toska)/.test(kind);
const waveKey=(id,e)=>`${id}:${e.wave}:${e.lane}`;
export function northernSimpleFx(fx,kind,x,y,e={}){
 if(!known(kind))return false;
 const owner=fx._viewOf(e.src??e.id),ts=fx._ts();
 const target=fx._viewOf(e.target)||owner;
 const pulse=(at,color,r=.65)=>{const p=at||{x,y},z=fx._groundZ(p.x,p.y);fx.ring(p.x,p.y,z+.015,.08,r,color,.35/ts);};
 const cells=tiles=>(tiles||[]).map(k=>Array.isArray(k)?k:[Math.floor(k/21),k%21]);
 if(kind==='talulahWave'){
  const waves=fx._northernWaves??=new Map();if(waves.size>=128)waves.delete(waves.keys().next().value);
  waves.set(waveKey(e.src??e.id,e),{x,y,dx:Number(e.dx)||0,dy:Number(e.dy)||0,speed:Number(e.speed)||0,left:Number(e.dur)||0,clock:0});return true;
 }
 if(kind==='talulahWaveHit'){fx._northernWaves?.delete(waveKey(e.src??e.id,e));pulse({x,y},FIRE,1.5);return true;}
 if(kind==='talulahChannelEnd'){for(const key of fx._northernWaves?.keys()||[])if(key.startsWith((e.src??e.id)+':'))fx._northernWaves.delete(key);return true;}
 if(kind==='talulahTrail'){fx.tileFlash([[Math.round(y),Math.round(x)]],FIRE,Math.min(1,Number(e.dur)||.4)/ts);return true;}
 if(kind==='territoriyaSpread'||kind==='territoriyaArea'){fx.tileFlash(cells(e.tiles),DARK,.5/ts);return true;}
 if(kind==='territoriyaReset')return true;
 pulse(kind==='talulahS1'?{x,y}:target,kind.startsWith('talulah')?FIRE:kind.startsWith('toska')?ICE:DARK,kind==='territoriyaRetreat'?1.7:.7);
 return true;
}
export function updateNorthernSimpleFx(fx,dt){
 if(!fx._northernWaves?.size)return;
 const elapsed=dt*fx._ts();
 for(const[key,w]of fx._northernWaves){w.left-=elapsed;if(w.left<=0){fx._northernWaves.delete(key);continue;}w.x+=w.dx*w.speed*elapsed;w.y+=w.dy*w.speed*elapsed;w.clock+=elapsed;
  if(w.clock>=.15){w.clock=0;fx.ring(w.x,w.y,fx._groundZ(w.x,w.y)+.02,.08,.38,FIRE,.2/fx._ts());}
 }
}
