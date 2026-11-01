// Native assets; manual nodes cover mechanisms whose original controllers live in game code.
const isNorthern=kind=>/^(talulah|territoriya|toska)/.test(kind);
export class NorthernFx{
 constructor(w){this.w=w;this.live=new Map();this.keyIndex=null;this.keyLists=null;}
 keys(views){
  const codes=new Set(views.map(v=>({'char_4247_oxi':'oxi_','char_4246_dminon':'dminon_','char_4244_tocka':'tocka_'})[v.info?.charId]).filter(Boolean));
  if(!codes.size)return [];
  if(this.keyIndex!==this.w.idx){this.keyIndex=this.w.idx;this.keyLists=new Map(['oxi_','dminon_','tocka_'].map(prefix=>[prefix,Object.keys(this.w.idx?.prefabs||{}).filter(k=>k.startsWith(prefix))]));}
  return [...codes].flatMap(prefix=>this.keyLists.get(prefix)||[]);
 }
 _stop(key){const e=this.live.get(key);if(e){e.handle.stop();this.live.delete(key);}}
 _keep(key,handle,owner,dur=Infinity){if(!handle)return false;this._stop(key);this.live.set(key,{handle,owner,until:this.w.ofx.time+dur});return true;}
 simFx(kind,x,y,e,owner){
  if(!isNorthern(kind))return false;
  const w=this.w;if(!w.ofx.active||!owner)return false;
  const id=owner.id??owner.info?.id,at={x,y,z:0},target=w.view(e.target),play=(key,v=at)=>!!w.playOn(key,v,{flipFrom:owner,...(v.root?{depthOwner:v,unitLayer:true}:{})});
  if(kind==='talulahWave'){
   const start=w.ofx.time,speed=Number(e.speed)||0,dur=Number(e.dur)||0,dx=Number(e.dx)||0,dy=Number(e.dy)||0;
   const handle=w.ofx.spawn('oxi_skill_03_trail_01',{pos:[x-10,y-9,0],groundZ:0,rootRot:[0,0,0,1]},{loop:true,important:true,owner,
    track:effect=>{const time=Math.max(0,Math.min(dur,w.ofx.time-start));effect.anchor[0]=x-10+dx*speed*time;effect.anchor[1]=y-9+dy*speed*time;effect.anchor[2]=0;effect.groundZ=0;effect.yaw=Math.atan2(dy,dx);}});
   return this._keep(`wave:${id}:${e.wave}:${e.lane}`,handle,owner,dur);
  }
  if(kind==='talulahWaveHit'){this._stop(`wave:${id}:${e.wave}:${e.lane}`);return play('oxi_skill_03_hit_01');}
  if(kind==='talulahChannelEnd'){for(const key of this.live.keys())if(key.startsWith(`wave:${id}:`))this._stop(key);return true;}
  if(kind==='talulahTrail')return this._keep(`trail:${id}:${x}:${y}`,w.playOn('oxi_buff_01',at,{loop:true}),owner,Number(e.dur)||3);
  if(kind==='talulahS1')return play('oxi_skill_01_hit_01');
  if(kind==='talulahGuard')return play('oxi_skill_02_hit_01',target||owner);
  if(kind==='talulahChannel'||kind==='talulahOverdrive'||kind==='territoriyaArea')return true; // Native skill graph already draws these.
  if(kind==='territoriyaSpread'){
   let drawn=false;for(const cell of e.tiles||[]){const row=Math.floor(cell/21),col=cell%21;drawn=this._keep(`territory:${id}:${cell}`,w.playOn('dminon_talent_range_01',{x:col,y:row,z:0},{loop:true}),owner)||drawn;}
   play('dminon_talent_range_hit_01',target||at);return drawn;
  }
  if(kind==='territoriyaReset'||kind==='territoriyaRetreat'){for(const key of this.live.keys())if(key.startsWith(`territory:${id}:`))this._stop(key);return kind==='territoriyaReset'||play('dminon_talent_hit_01',owner);}
  if(kind==='toskaDelivery'){const p=w.projectileOf(w.idx?.projectiles?.projectile_chr_tocka_s2,owner);if(!target||!p)return false;w._fly(p,owner,target,'arts',w.ofx.time,{dur:Number(e.t)||.01});return true;}
  if(kind==='toskaMark'){
   if(!target)return false;const n=Number(e.kind)+1;
   return this._keep(`mark:${id}:${e.target}:${e.kind}`,w.playOn(`tocka_skill_0${n}_buff_${n<3?'02':'01'}`,target,{loop:true,follow:true,flipFrom:owner,depthOwner:target,unitLayer:true}),target);
  }
  if(kind==='toskaTrigger'){
   this._stop(`mark:${id}:${e.target}:${e.kind}`);
   if(!target)return false;const index=Number(e.kind),drawn=play(index===2?'tocka_skill_03_buff_start_01':`tocka_skill_0${index+1}_buff_02_start_01`,target);
   if(index<2)this._keep(`active:${id}:${e.target}:${index}`,w.playOn(`tocka_skill_0${index+1}_buff_01`,target,{loop:true,follow:true,depthOwner:target,unitLayer:true,flipFrom:owner}),target,Number(e.dur)||10);
   return drawn;
  }
  return false;
 }
 tick(){for(const[key,e]of this.live)if(!this.w.ofx.active||e.owner.alive===false||this.w.ofx.time>=e.until)this._stop(key);}
 clear(){for(const key of this.live.keys())this._stop(key);}
}
