import {data} from '../js/data.js';import {assets} from '../js/assets.js';import {createFieldView} from '../js/render/app.js';
import {Battle} from '/sim/Battle.js';import {setSimData} from '/sim/simdata.js';import {setGameData} from '/sim/content/support/index.js';
const $=id=>document.getElementById(id),raw={};
const ko={古米:'굼',折桠:'베토치키',坚守:'수호',独行:'독행',助力:'조력',协防干员:'협동방어',精准:'정밀',奥术:'아케인',迅捷:'신속'};const name=s=>ko[s]||s;
try{
 const files=['config','chess','bonds','garrisons','tokens','assets','enemies','stages','waves','items','bands','effects','choices','factions','bosses'];
 await Promise.all(files.map(async f=>{raw[f]=await fetch(`/data/${f}.json`).then(r=>r.json())}));
 if(!raw.bonds.ursusShip)throw Error('npm run dev:ursus로 실행한 로컬 서버에서 열어 주세요.');
 setSimData(raw);setGameData(raw);await data.loadAll(...files);await assets.ready();
 const ops=Object.values(raw.chess).filter(c=>!c.isGolden&&c.bonds.includes('ursusShip'));
 for(const c of ops){const card=document.createElement('article');card.className='card';const img=document.createElement('img');img.src=raw.assets.chars[c.charId].portrait;img.alt=c.name;const title=document.createElement('h3');title.textContent=`${name(c.name)} · ${c.tier}단계`;const bonds=document.createElement('p');bonds.textContent=c.bonds.map(id=>name(raw.bonds[id]?.name||id)).join(' / ');const desc=document.createElement('p');desc.textContent=raw.garrisons[c.garrisonIds[0]]?.desc;card.append(img,title,bonds,desc);$('roster').append(card)}
 const view=await createFieldView($('field'),{data,assets,settings:{quality:'medium',damageNumbers:true},antialias:false});
 await view.setBoardMode?.('2d');let battle;
 const rows=Array.from({length:19},()=> '#'.repeat(21));rows[9]='##ErrrrrrrSrrrrrrrS##';rows[10]='##hrrrrrrrfrrrrrrrf##';rows[11]='##hrrrrrrrfrrrrrrrf##';rows[12]='##hrrrrrrrSrrrrrrrS##';
 const stage={id:'ursus-local',name:'우르수스 실험',rows,devices:[]};
 function restart(){const count=Number($('count').value),layers=Math.min(999,Math.max(0,Number($('layers').value)||0));
  const ids=ops.slice(0,count).map(c=>$('elite').checked?c.goldenId:c.chessId);
  battle=new Battle({data:raw,stage,autoFinish:false,fieldId:'ursus-local',kind:'normal',rect:{r0:9,r1:12,c0:2,c1:10},players:[{playerId:'local',coords:'board',units:ids.map((chessId,i)=>({chessId,row:10+Math.floor(i/4),col:3+i%4,dir:'RIGHT'})),bonds:{ursusShip:{count,active:count>=3,tier:count>=6?2:count>=3?1:0,layers}}}],flags:{dpInit:999,dpPerSec:0,startOpCooldown:0,autoFinish:false},timeLimit:180});
  battle.start();view.setStage(stage);view.enterBattle(battle.fieldMeta());view.setCamera('normal',{rect:battle.rect,instant:true});
  window.__ursus={battle,view,raw,restart};update();
 }
 function update(){const ev=battle.drainEvents();if(ev.length)view.pushEvents({t:'b.ev',fieldId:battle.fieldId,gt:battle.time,ev});view.pushSnapshot(battle.snapshot());const drone=battle.allyUnits.find(u=>u.defId==='token_custom_ursus_drone');$('stats').textContent=`우르수스 ${$('count').value}명 · ${$('layers').value}중첩\n${drone?`제국 드론: HP ${Math.round(drone.s.maxHp)} / 공격력 ${Math.round(drone.s.atk)} / 공격 속도 ${drone.s.aspd}`:'제국 드론: 미소환 (3명부터 활성화)'}\n${battle.allyUnits.filter(u=>u.kind==='op').map(u=>`${name(u.name)}: 공격 속도 ${Math.round(u.s.aspd)}`).join(' · ')}\n전투 오류: ${battle.errorCount}`;}
 $('restart').onclick=restart;restart();setInterval(()=>{battle.step();update()},1000/30);
}catch(e){$('error').textContent=e.stack;console.error(e)}
