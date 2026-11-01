import {territoryContours} from './territory.js';
// Native assets; manual nodes cover mechanisms whose original controllers live in game code.
const isNorthern=kind=>/^(talulah|territoriya|toska)/.test(kind);
export class NorthernFx{
 constructor(w){this.w=w;this.live=new Map();this.keyIndex=null;this.keyLists=null;this.areas=new Map();}
 keys(views){
  const codes=new Set(views.map(v=>({'char_4247_oxi':'oxi_','char_4246_dminon':'dminon_','char_4244_tocka':'tocka_'})[v.info?.charId]).filter(Boolean));
  if(!codes.size)return [];
  if(this.keyIndex!==this.w.idx){this.keyIndex=this.w.idx;this.keyLists=new Map(['oxi_','dminon_','tocka_'].map(prefix=>[prefix,Object.keys(this.w.idx?.prefabs||{}).filter(k=>k.startsWith(prefix))]));}
  return [...codes].flatMap(prefix=>this.keyLists.get(prefix)||[]);
 }
 _stop(key){const e=this.live.get(key);if(e){e.handle.stop();this.live.delete(key);}}
 _keep(key,handle,owner,dur=Infinity,independent=false){if(!handle)return false;this._stop(key);this.live.set(key,{handle,owner,independent,until:this.w.ofx.time+dur});return true;}
 simFx(kind,x,y,e,owner){
  if(!isNorthern(kind))return false;
  if(kind==='talulahAttackMode'||kind==='territoriyaRetreatStart'||kind==='territoriyaRetreatHit')return true;
  const w=this.w;if(!w.ofx.active||!owner)return false;
  const id=owner.id??owner.info?.id,at={x,y,z:0},target=w.view(e.target),play=(key,v=at)=>!!w.playOn(key,v,{flipFrom:owner,...(v.root?{depthOwner:v,unitLayer:true}:{})});
  if(kind==='talulahWave'){
   const absolute=Number.isFinite(e.born)&&typeof w.opts?.gameTime==='function',clock=()=>absolute?w.opts.gameTime():w.ofx.time,start=absolute?e.born:clock(),speed=Number(e.speed)||0,dur=Number(e.dur)||0,dx=Number(e.dx)||0,dy=Number(e.dy)||0;
   const heightAt=(x,y)=>(Number(w.ofx.ctx?.heightAt?.(Math.round(y),Math.round(x)))||0)+.18,height=heightAt(x,y);
   const handle=w.ofx.spawn('oxi_skill_03_trail_01',{pos:[x-10,y-9,-height],groundZ:-(height-.18),rootRot:[0,0,0,1]},{loop:true,important:true,owner,
    track:effect=>{const time=Math.max(0,Math.min(dur,clock()-start));effect.anchor[0]=x-10+dx*speed*time;effect.anchor[1]=y-9+dy*speed*time;const ground=heightAt(x+dx*speed*time,y+dy*speed*time)-.18;effect.anchor[2]=-(ground+.18);effect.groundZ=-ground;effect.yaw=Math.atan2(dy,dx);}});
   const key=`wave:${id}:${e.wave}:${e.lane}`,kept=this._keep(key,handle,owner,dur,true);if(kept&&absolute)this.live.get(key).endsAt=start+dur;return kept;
  }
  if(kind==='talulahWaveHit'){this._stop(`wave:${id}:${e.wave}:${e.lane}`);return play('oxi_skill_03_hit_01');}
  if(kind==='talulahChannelEnd')return true; // Already-fired waves finish by collision or flight lifetime.
  if(kind==='talulahTrail')return this._keep(`trail:${id}:${x}:${y}`,w.playOn('oxi_buff_01',at,{loop:true}),owner,Number(e.dur)||3);
  if(kind==='talulahS1')return play('oxi_skill_01_hit_01');
  if(kind==='talulahGuard')return play('oxi_skill_02_hit_01',target||owner);
  if(kind==='talulahChannel'||kind==='talulahOverdrive')return true; // Native skill graph already draws these.
  if(kind==='territoriyaArea'){this._area(owner,e.tiles||[]);return true;}
  if(kind==='territoriyaSpread'){
   let drawn=false;for(const cell of e.tiles||[]){const row=Math.floor(cell/21),col=cell%21;drawn=this._keep(`territory:${id}:${cell}`,w.playOn('dminon_talent_range_01',{x:col,y:row,z:0},{loop:true}),owner)||drawn;}
   play('dminon_talent_range_hit_01',target||at);return drawn;
  }
  if(kind==='territoriyaReset'||kind==='territoriyaRetreat'){this.areas.delete(id);for(const key of this.live.keys())if(key.startsWith(`territory:${id}:`)||key.startsWith(`boundary:${id}:`))this._stop(key);return kind==='territoriyaReset'||play('dminon_talent_hit_01',owner);}
  if(kind==='toskaDelivery'){const p=w.projectileOf(w.idx?.projectiles?.projectile_chr_tocka_s2,owner);if(!target||!p)return false;w._fly(p,owner,target,'arts',w.ofx.time,{dur:Number(e.t)||.01});return true;}
  if(kind==='toskaMark'){
   if(!target)return false;const n=Number(e.kind)+1;
   return this._keep(`mark:${id}:${e.target}:${e.kind}`,w.playOn(`tocka_skill_0${n}_buff_${n<3?'02':'01'}`,target,{loop:true,follow:true,spawn:5,flipFrom:owner}),target);
  }
  if(kind==='toskaTrigger'){
   this._stop(`mark:${id}:${e.target}:${e.kind}`);
   if(!target)return false;const index=Number(e.kind),drawn=index===2?!!w.playOn('tocka_skill_03_buff_start_01',target,{spawn:5,follow:true,flipFrom:owner}):play(`tocka_skill_0${index+1}_buff_02_start_01`,target);
   if(index<2)this._keep(`active:${id}:${e.target}:${index}`,w.playOn(`tocka_skill_0${index+1}_buff_01`,target,{loop:true,follow:true,depthOwner:target,unitLayer:true,flipFrom:owner}),target,Number(e.dur)||10);
   return drawn;
  }
  return false;
 }
 _area(owner,tiles){
  const w=this.w,id=owner.id??owner.info?.id,cells=[...new Set(tiles)].sort((a,b)=>a-b),signature=cells.join(',');
  if(this.areas.get(id)===signature)return;this.areas.set(id,signature);
  const wanted=new Set(cells.map(cell=>`territory:${id}:${cell}`));
  for(const key of this.live.keys())if(key.startsWith(`territory:${id}:`)&&!wanted.has(key))this._stop(key);
  for(const cell of cells){const key=`territory:${id}:${cell}`;if(!this.live.has(key))this._keep(key,w.playOn('dminon_talent_range_01',{x:cell%21,y:Math.floor(cell/21),z:0},{loop:true}),owner);}
  for(const key of this.live.keys())if(key.startsWith(`boundary:${id}:`))this._stop(key);
  for(const [i,path]of territoryContours(cells).entries()){const points=path.map(([x,y])=>[x-10,y-9,-.015]);this._keep(`boundary:${id}:${i}`,w.ofx.spawn('dminon_range_line_01',{pos:[0,0,0],groundZ:0},{loop:true,owner,track:effect=>{for(let n=0;n<effect.def.n;n++)if(effect.def.line[n])effect.linePts.set(n,points);}}),owner);}
 }
 tick(){for(const[key,e]of this.live)if(!this.w.ofx.active||(e.owner.alive===false&&!e.independent)||(e.endsAt!=null?this.w.opts.gameTime()>=e.endsAt:this.w.ofx.time>=e.until)){if(e.owner.alive===false)this.areas.delete(e.owner.id??e.owner.info?.id);this._stop(key);}}
 clear(){for(const key of this.live.keys())this._stop(key);this.areas.clear();}
}
