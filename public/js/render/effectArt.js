// Shared material drawings. Monochrome shading retains each character's tint;
// anatomy, highlights and a narrow rim make the silhouette readable on terrain.
function shape(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}
function grad(c,x0,y0,x1,y1,stops){const g=c.createLinearGradient(x0,y0,x1,y1);for(const [p,v]of stops)g.addColorStop(p,v);return g;}
export const EFFECT_MATERIALS=['arrowBody','bulletBody','shellBody','artsBody','fireBody','iceBody','healBody','waterBody','impactBody','energyContact','cloudBody','skillContact','kazimierzSword'];
export function drawEffectMaterial(c,key,x,y,w,h){
 c.save();c.translate(x,y);c.scale(w/64,h/64);c.lineJoin='round';c.lineCap='round';
 if(key==='kazimierzSword'){
  shape(c,[[29,19],[35,19],[36,46],[32,61],[28,46]]);c.fillStyle=grad(c,28,0,36,0,[[0,'#999'],[.5,'#fff'],[1,'#bcbcbc']]);c.fill();
  shape(c,[[19,17],[28,15],[29,6],[35,6],[36,15],[45,17],[43,22],[35,20],[29,20],[21,22]]);c.fillStyle='#eee';c.fill();c.strokeStyle='#fff';c.lineWidth=1;c.stroke();
 }else if(key==='arrowBody'){
  c.strokeStyle='#353535';c.lineWidth=5;c.beginPath();c.moveTo(8,32);c.lineTo(47,32);c.stroke();
  c.strokeStyle='#efefef';c.lineWidth=2;c.stroke();
  for(const s of [-1,1]){shape(c,[[5,32],[12,32+s*9],[24,32+s*4],[21,32]]);c.fillStyle='#b6b6b6';c.fill();}
  shape(c,[[42,25],[59,32],[42,39],[46,32]]);c.fillStyle='#eee';c.fill();c.strokeStyle='#555';c.lineWidth=1;c.stroke();
 }else if(key==='bulletBody'||key==='shellBody'){
  const shell=key==='shellBody';shape(c,[[10,shell?20:26],[40,shell?20:26],[56,32],[40,shell?44:38],[10,shell?44:38]]);
  c.fillStyle=grad(c,0,18,0,46,[[0,'#626262'],[.35,'#f8f8f8'],[.6,'#bdbdbd'],[1,'#343434']]);c.fill();c.strokeStyle='#383838';c.lineWidth=1.5;c.stroke();
  c.fillStyle='#f5f5f5';c.fillRect(12,shell?23:28,3,shell?18:8);c.fillStyle='#747474';c.fillRect(18,shell?21:27,2,shell?22:10);
 }else if(key==='cloudBody'){
  // Overlapping irregular wisps with finer lobes, no outlined circles.
  let state=61;const random=()=>{state=(Math.imul(state,1664525)+1013904223)|0;return(state>>>0)/4294967296;};
  for(let i=0;i<44;i++){const a=random()*Math.PI*2,r=Math.sqrt(random())*19,cx=32+Math.cos(a)*r,cy=32+Math.sin(a)*r*.72,sz=5+random()*12;const g=c.createRadialGradient(cx-2,cy-3,0,cx,cy,sz);g.addColorStop(0,'rgba(255,255,255,.22)');g.addColorStop(.45,'rgba(210,210,210,.16)');g.addColorStop(1,'rgba(120,120,120,0)');c.fillStyle=g;c.fillRect(cx-sz,cy-sz,sz*2,sz*2);}
 }else if(key==='iceBody'){
  shape(c,[[4,32],[20,23],[39,15],[60,32],[39,49],[20,41]]);c.fillStyle='#8c8c8c';c.fill();
  shape(c,[[4,32],[39,15],[60,32],[26,30]]);c.fillStyle='#e7e7e7';c.fill();shape(c,[[26,30],[60,32],[39,49]]);c.fillStyle='#bdbdbd';c.fill();c.strokeStyle='#fafafa';c.lineWidth=1.3;c.beginPath();c.moveTo(4,32);c.lineTo(39,15);c.lineTo(60,32);c.stroke();
 }else if(key==='fireBody'){
  shape(c,[[3,23],[18,25],[10,12],[31,22],[30,7],[44,20],[57,26],[61,34],[51,45],[32,50],[14,41],[2,44],[17,32]]);
  c.fillStyle=grad(c,3,32,61,32,[[0,'rgba(140,140,140,0)'],[.45,'#bcbcbc'],[1,'#fff']]);c.fill();
  shape(c,[[17,28],[32,31],[32,19],[49,26],[55,34],[46,41],[30,40]]);c.fillStyle='#f7f7f7';c.fill();
 }else if(key==='impactBody'||key==='energyContact'||key==='skillContact'){
  const energy=key!=='impactBody';
  for(let i=0;i<(energy?7:5);i++){const a=i*Math.PI*2/(energy?7:5)+.23,len=i%2?19:27;c.save();c.translate(32,32);c.rotate(a);shape(c,[[5,-2],[len,-1],[len+4,0],[8,2]]);c.fillStyle=grad(c,4,0,30,0,[[0,'#fff'],[.3,'#dedede'],[1,'rgba(255,255,255,0)']]);c.fill();c.restore();}
  c.fillStyle='#fff';c.beginPath();c.ellipse(32,32,energy?5:3,3,0,0,Math.PI*2);c.fill();
  if(energy){c.strokeStyle='rgba(255,255,255,.62)';c.lineWidth=1.3;c.beginPath();c.arc(32,32,15,.2,2.4);c.arc(32,32,20,3.1,5.5);c.stroke();}
 }else{
  const g=c.createRadialGradient(27,25,2,32,32,23);g.addColorStop(0,'#fff');g.addColorStop(.32,'#dfdfdf');g.addColorStop(.7,'#808080');g.addColorStop(.9,'#333');g.addColorStop(1,'rgba(80,80,80,0)');c.fillStyle=g;c.beginPath();c.arc(32,32,23,0,Math.PI*2);c.fill();
  c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=1.4;c.beginPath();c.ellipse(32,32,25,15,-.45,.2,2.7);c.stroke();
  c.lineWidth=2;c.beginPath();c.arc(29,28,14,3.5,4.9);c.stroke();
  if(key==='healBody'){c.fillStyle='#fff';c.fillRect(29,23,6,18);c.fillRect(23,29,18,6);}
  if(key==='waterBody'){c.strokeStyle='#eee';c.lineWidth=1;c.beginPath();c.ellipse(32,32,19,8,.4,0,Math.PI*2);c.stroke();}
 }
 c.restore();
}
export function projectileMaterial(spec,info={},active=false){
 if(spec.look==='dart')return spec.hit==='zap'?'bulletBody':'arrowBody';
 if(spec.look==='tracer')return 'bulletBody';
 if(spec.look==='shell'||spec.look==='mortar')return 'shellBody';
 if(spec.hit==='heal')return 'healBody';
 if(spec.look==='boomerang')return null;
 const text=active?String(info.skillName||''):'';
 if(/火|炎|불꽃|화염|작열|flame|fire/i.test(text))return 'fireBody';
 if(/冰|霜|雪|빙|서리|얼음|frost|ice/i.test(text))return 'iceBody';
 if(/潮|涌|波|파도|해일|tide|water/i.test(text))return 'waterBody';
 return 'artsBody';
}
