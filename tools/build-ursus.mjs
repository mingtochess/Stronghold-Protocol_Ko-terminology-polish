// Opt-in local overlay. Never writes the committed data/ directory.
import {readFile, writeFile, mkdir, readdir, copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname, resolve, join} from 'node:path';
import {loadContext, buildChess} from './build-data.mjs';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const URSUS_DIR=join(ROOT,'.cache/ursus-data');
const json=async p=>JSON.parse(await readFile(p,'utf8'));
export async function buildUrsus(){
 await mkdir(URSUS_DIR,{recursive:true});
 for(const f of await readdir(join(ROOT,'data'))) if(f.endsWith('.json')) await copyFile(join(ROOT,'data',f),join(URSUS_DIR,f));
 const ops=await json(join(ROOT,'content/custom/ursus/operators.json'));
 const ctx=await loadContext({operatorsOnly:true});
 const a=ctx.act;
 for(const [i,o] of ops.entries()){
  const template=Object.keys(a.charShopChessDatas).find(id=>a.charShopChessDatas[id].chessLevel===o.tier && a.charChessDataDict[id] && !a.charShopChessDatas[id].isHidden && a.charShopChessDatas[id].chessType!=='DIY');
  if(!template || !ctx.charTable[o.charId]) throw Error(`Missing official source: ${o.charId}`);
  const shop=structuredClone(a.charShopChessDatas[template]);
  const normal=`chess_custom_ursus_${o.key}_a`,golden=normal.replace(/_a$/,'_b');
  Object.assign(shop,{chessId:normal,goldenChessId:golden,charId:o.charId,defaultSkillIndex:o.skillIndex,defaultUniEquipId:null,shopLevelSortId:90+i,isHidden:false,chessType:'NORMAL',backupCharId:null,backupCharUniEquipId:null});
  a.charShopChessDatas[normal]=shop;
  for(const [g,id] of [[false,normal],[true,golden]]){
   const r=structuredClone(a.charChessDataDict[g? a.charShopChessDatas[template].goldenChessId:template]);
   Object.assign(r,{chessId:id,identifier:9000+i*2+Number(g),isGolden:g,upgradeChessId:g?null:golden,upgradeNum:g?0:3,bondIds:o.bonds,garrisonIds:[`garrison_ursus_${o.key}_${g?'b':'a'}`]});
   r.status.equipLevel=0;
   const phases=ctx.charTable[o.charId].phases;
   const phase=Math.min(Number(r.status.evolvePhase.replace('PHASE_','')),phases.length-1);
   r.status.evolvePhase=`PHASE_${phase}`;r.status.charLevel=Math.min(r.status.charLevel,phases[phase].maxLevel);
   a.charChessDataDict[id]=r;a.chessNormalIdLookupDict[id]=normal;
  }
 }
 const generated=buildChess(ctx).chess;
 const chess=await json(join(URSUS_DIR,'chess.json')), bonds=await json(join(URSUS_DIR,'bonds.json')),garrisons=await json(join(URSUS_DIR,'garrisons.json')),tokens=await json(join(URSUS_DIR,'tokens.json')),assets=await json(join(URSUS_DIR,'assets.json'));
 for(const o of ops)for(const suffix of ['a','b']){
  const id=`chess_custom_ursus_${o.key}_${suffix}`,r=generated[id];
  if(!r?.stats || !r.skill)throw Error(`Incomplete generated operator ${id}`);
  r.name=o.name;chess[id]=r;
  const elite=suffix==='b', count=elite?4:2;
  let source,desc;
  if(o.trait==='power'){source='garrison_03_a';desc=`전투 중 공격력·최대 HP +${elite?40:20}%`}
  else if(o.trait==='scale'){source='garrison_100_a';desc=`전투 중 우르수스·정밀 중첩 3당 공격력 +${elite?4:2}%`}
  else if(o.trait==='front'){source='garrison_79_a';desc=`준비 종료 시 자신과 앞 칸 오퍼레이터의 활성 진영 중첩 +${count}`}
  else if(o.trait==='all'){source='garrison_80_a';desc=`준비 시작 시 자신의 활성 진영 중첩 +${count}`}
  else {source='garrison_69_a';desc=`준비 ${o.trait==='ursusStart'||o.trait==='swift'?'시작':'종료'} 시 ${o.trait==='swift'?'신속':'우르수스'} 중첩 +${o.trait==='ursusStart'?count*2:count}`}
  const gar=structuredClone(garrisons[source]);gar.garrisonId=r.garrisonIds[0];gar.name=o.name;gar.desc=gar.descRaw=desc;
  // Every effect carries its own blackboard; update both top-level and nested representations.
  const change=e=>{if(!e||typeof e!=='object')return;
   if(e.bb){if(o.trait==='power')Object.assign(e.bb,{atk:elite?1.4:1.2,max_hp:elite?1.4:1.2});else if(o.trait==='scale')e.bb.atk=elite?.04:.02;else e.bb.count=o.trait==='ursusStart'?count*2:count;}
   if(e.bbStr){if(o.trait==='scale')e.bbStr.bond_id='ursusShip,preciShip';else if(['ursus','ursusStart','swift'].includes(o.trait))e.bbStr.bond=o.trait==='swift'?'swiftShip':'ursusShip';}
   if(o.trait==='ursusStart'||o.trait==='swift')if(e.eventType==='SERVER_PREP_FIN')e.eventType='SERVER_PREP_START';
  };change(gar);for(const e of gar.effects||[])change(e);gar.owners=[id];garrisons[gar.garrisonId]=gar;
 }
 for(const r of Object.values(chess))if(['char_196_sunbr','char_4207_branch'].includes(r.charId)&&!r.bonds.includes('ursusShip'))r.bonds.push('ursusShip');
 const members=Object.values(chess).filter(c=>!c.isGolden&&c.bonds.includes('ursusShip')).map(c=>c.chessId);
 const desc='3 우르수스: 전투 시작 시 제국 드론 소환. 드론 HP·공격력 +25% (우르수스 중첩당 +1%p).\n6 우르수스: 제국 드론과 우르수스 오퍼레이터의 공격 속도 +50.';
 bonds.ursusShip={...structuredClone(bonds.yanShip),bondId:'ursusShip',name:'우르수스',identifier:90,powerIdList:['ursus'],iconId:'icon_ursusShip',thresholds:[3,6],activeCount:3,members,visibleMembers:members,desc,descRaw:desc,effectName:'우르수스',effectId:'bondeffect_ursus',effectDesc:desc,effectDescRaw:desc,effectDescParams:[],bb:{base_bonus:.25,bonus_per_stack:.01,power_bond_char_cnt:6,attack_speed:50},bbStr:{},buffs:[],baseParams:[],perStackParams:[],spec:{tiers:[{count:3},{count:6}]}};
 for(const id of Object.keys(bonds)) if(id!=='ursusShip')for(const o of ops)if(o.bonds.includes(id)){const cid=`chess_custom_ursus_${o.key}_a`;for(const k of ['members','visibleMembers'])if(bonds[id][k]&&!bonds[id][k].includes(cid))bonds[id][k].push(cid);}
 const enemy=await json(join(URSUS_DIR,'enemies.json'));
 const drone=enemy.enemy_1112_emppnt;
 tokens.token_custom_ursus_drone={tokenId:'token_custom_ursus_drone',kind:'summon',name:'제국 드론',appellation:'Imperial Drone',desc:'우르수스 3 진영 효과로 소환되는 아군 제국 드론',profession:'TOKEN',position:'ALL',displayType:'DEFAULT',placeable:false,stats:{...drone.stats,blockCnt:0,cost:0,spRecovery:1,respawnTime:9999},rangeGrid:Array.from({length:5},(_,i)=>Array.from({length:5},(_,j)=>[i-2,j-2])).flat(),dmgType:'phys',attackKind:'ranged',projectile:'shell',canHitFly:true,deployLimit:1,count:1,owners:[],skill:null,spine:'enemy_1112_emppnt',immunities:drone.stats.immunities};
 assets.tokens.token_custom_ursus_drone={avatar:assets.enemies.enemy_1112_emppnt.icon,spine:assets.enemies.enemy_1112_emppnt.spine};
 // A local SVG gives the experimental faction an icon without claiming it is official artwork.
 assets.bonds.ursusShip='/assets/custom/ursus/icon.svg';
 await mkdir(join(ROOT,'public/assets/custom/ursus'),{recursive:true});
 await writeFile(join(ROOT,'public/assets/custom/ursus/icon.svg'),'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="#b83838" d="M8 12h48v28L32 60 8 40z"/><path fill="white" d="M18 23h28v7H18zm6 12h16v7H24z"/></svg>');
 const extra=await json(join(ROOT,'.cache/ursus-extra-assets.json')).catch(()=>null);
 if(extra){Object.assign(assets.chars,extra.chars);Object.assign(assets.skillsById,extra.skillsById);for(const o of ops){const r=chess[`chess_custom_ursus_${o.key}_b`];r.assets.avatar=`${o.charId}_2`;r.assets.portrait=`${o.charId}_2`;}}
 for(const [key,value]of Object.entries({chess,bonds,garrisons,tokens,assets}))await writeFile(join(URSUS_DIR,`${key}.json`),JSON.stringify(value));
 console.log(`Ursus overlay generated: ${members.length} operators, ${URSUS_DIR}`);return {dir:URSUS_DIR,ops};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await buildUrsus();
