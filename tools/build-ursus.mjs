// Opt-in local overlay. Never writes the committed data/ directory.
import {readFile, writeFile, mkdir, readdir, copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname, resolve, join} from 'node:path';
import {loadContext, buildChess} from './build-data.mjs';
import {buildRecruits} from './build-recruits.mjs';
import {loadKorean,localizeOperator} from './ursus-korean.mjs';
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
  const moduleId=(ctx.uniequip.charEquip?.[o.charId]||[]).find(id=>ctx.uniequip.equipDict[id]?.type==='ADVANCED')||null;
  const normal=`chess_custom_ursus_${o.key}_a`,golden=normal.replace(/_a$/,'_b');
  Object.assign(shop,{chessId:normal,goldenChessId:golden,charId:o.charId,defaultSkillIndex:o.skillIndex,defaultUniEquipId:moduleId,shopLevelSortId:90+i,isHidden:false,chessType:'NORMAL',backupCharId:null,backupCharUniEquipId:null});
  a.charShopChessDatas[normal]=shop;
  for(const [g,id] of [[false,normal],[true,golden]]){
   const r=structuredClone(a.charChessDataDict[g? a.charShopChessDatas[template].goldenChessId:template]);
   Object.assign(r,{chessId:id,identifier:9000+i*2+Number(g),isGolden:g,upgradeChessId:g?null:golden,upgradeNum:g?0:3,bondIds:o.bonds,garrisonIds:[`garrison_ursus_${o.key}_${g?'b':'a'}`]});
   r.status.equipLevel=g&&moduleId?3:0;
   const phases=ctx.charTable[o.charId].phases;
   const phase=Math.min(Number(r.status.evolvePhase.replace('PHASE_','')),phases.length-1);
   r.status.evolvePhase=`PHASE_${phase}`;r.status.charLevel=Math.min(r.status.charLevel,phases[phase].maxLevel);
   a.charChessDataDict[id]=r;a.chessNormalIdLookupDict[id]=normal;
  }
 }
 try{await copyFile(join(ROOT,'.cache/ursus-local-assets.json'),join(URSUS_DIR,'local-assets.json'))}catch(e){if(e.code!=='ENOENT')throw e}
 const bands=await json(join(URSUS_DIR,'bands.json'));
 const generated=buildChess(ctx).chess;
 const korean=await loadKorean(ROOT);
 const chess=await json(join(URSUS_DIR,'chess.json')), bonds=await json(join(URSUS_DIR,'bonds.json')),garrisons=await json(join(URSUS_DIR,'garrisons.json')),tokens=await json(join(URSUS_DIR,'tokens.json')),assets=await json(join(URSUS_DIR,'assets.json')),items=await json(join(URSUS_DIR,'items.json'));
 for(const o of ops)for(const suffix of ['a','b']){
  const id=`chess_custom_ursus_${o.key}_${suffix}`,r=generated[id];
  if(!r?.stats || !r.skill)throw Error(`Incomplete generated operator ${id}`);
  r.name=o.name;localizeOperator(r,korean,a.charChessDataDict[id].status);chess[id]=r;
  const elite=suffix==='b', count=o.key==='turdus'?4:elite?4:2;
  let source,desc;
  if(o.trait==='power'){source='garrison_100_a';desc=`[우르수스] 맹약이 3회 중첩할 때마다 공격력과 최대 HP +${elite?4:2}%`}
  else if(o.trait==='scale'){source='garrison_100_a';desc=`[우르수스]/[정밀] 맹약이 3회 중첩할 때마다 공격력 +${elite?4:2}%`}
  else if(o.trait==='slowedDeaths'){source='garrison_42_a';desc='<전투 중> 공격 범위 내 정지 상태의 적이 사망할 때마다 활성화된 [우르수스]/[예견] 맹약의 중첩 수 +2 (전투당 최대 7회 발동)'}
  else if(o.key==='leto'){source='garrison_42_a';desc='<전투 중> 아군 [우르수스] 오퍼레이터가 스킬을 발동할 때마다 활성화된 [우르수스] 맹약의 중첩 수 +2 (전투당 최대 10회 발동)'}
  else if(o.trait==='all'){source='garrison_80_a';desc=`<휴식 기간 진입 시> 자신의 활성화된 맹약 중첩 수 +${count}`}
  else if(o.key==='botany'){source='garrison_35_a';desc='<획득 시> [우르수스]/[신속] 맹약의 중첩 수 +6 (맹약 활성화 불필요)'}
  else {source='garrison_69_a';desc=`<휴식 기간 ${o.trait==='ursusStart'||o.trait==='swift'?'진입':'종료'} 시> 활성화된 [${o.trait==='swift'?'신속':'우르수스'}] 맹약의 중첩 수 +${o.trait==='ursusStart'?count*4:count}`}
  const gar=structuredClone(garrisons[source]);gar.garrisonId=r.garrisonIds[0];gar.name=o.name;gar.desc=desc;gar.descRaw=desc.replace(/\+\d+%?/g,'<@ba.vup>$&</>').replace('정지 상태','<@ba.vup>정지</> 상태');gar.requireActive=o.key!=='botany';
  // Every effect carries its own blackboard; update both top-level and nested representations.
  const change=e=>{if(!e||typeof e!=='object')return;
   if(o.trait==='slowedDeaths'){e.effectKey='custom_ursus_slowed_death';if(e.bbStr)Object.assign(e.bbStr,{key:'custom_ursus_slowed_death',bond_type:'bond_by_id',bond_id:'ursusShip,visiShip',bond_add_type:'by_count'});if(e.bb)Object.assign(e.bb,{bond_add_count:2,max_add_count_per_battle:14,max_trigger_count:7});return;}
   if(o.key==='leto'){e.effectKey='custom_ursus_ally_skill';if(e.bbStr)Object.assign(e.bbStr,{key:'custom_ursus_ally_skill',bond_id:'ursusShip'});if(e.bb)Object.assign(e.bb,{bond_add_count:2,max_add_count_per_battle:20});return;}
   if(e.bb){if(o.trait==='power')Object.assign(e.bb,{divide_num:3,atk:elite?.04:.02,max_hp:elite?.04:.02});else if(o.trait==='scale')e.bb.atk=elite?.04:.02;else e.bb.count=o.key==='botany'?6:o.trait==='ursusStart'?count*4:count;}
   if(e.bbStr){if(o.trait==='power')e.bbStr.bond_id='ursusShip';else if(o.key==='botany')e.bbStr.bond='ursusShip,swiftShip';else if(o.trait==='scale')e.bbStr.bond_id='ursusShip,preciShip';else if(['ursus','ursusStart','swift'].includes(o.trait))e.bbStr.bond=o.trait==='swift'?'swiftShip':'ursusShip';}
   if(o.trait==='ursusStart')if(e.eventType==='SERVER_PREP_FIN')e.eventType='SERVER_PREP_START';
  };change(gar);for(const e of gar.effects||[])change(e);gar.owners=[id];garrisons[gar.garrisonId]=gar;
 }
 for(const r of Object.values(chess))if(['char_196_sunbr','char_4207_branch'].includes(r.charId)&&!r.bonds.includes('ursusShip'))r.bonds.push('ursusShip');
 const members=Object.values(chess).filter(c=>!c.isGolden&&c.bonds.includes('ursusShip')).map(c=>c.chessId);
 const desc='<전장에 서로 다른 [우르수스] 오퍼레이터 3명> 전투 시작 시 스스로 이동하고 폭격하는 제국 드론 소환. 드론의 공격력·최대 HP +25% (중첩당 +2%p)\n<전장에 서로 다른 [우르수스] 오퍼레이터 6명> 제국 드론과 [우르수스] 오퍼레이터의 공격 속도 +50';
 const descRaw=desc.replace('3명>','<@autochess.dgreen>3</>명>').replace('6명>','<@autochess.dgreen>6</>명>').replace('+25%','<@ba.vup>+25%</>').replace('+2%p','<@ba.vup>+2%p</>').replace('+50','<@ba.vup>+50</>');
 const effectDesc='<전장에 서로 다른 [우르수스] 오퍼레이터 3명> 전투 시작 시 스스로 이동하고 폭격하는 제국 드론 소환. 드론의 공격력 +{0:0%}, 최대 HP +{1:0%} (중첩 수에 따라 변경)\n<전장에 서로 다른 [우르수스] 오퍼레이터 6명> 제국 드론과 [우르수스] 오퍼레이터의 공격 속도 +50';
 const effectDescRaw=effectDesc.replace('3명>','<@ba.vup>3</>명>').replace('6명>','<@ba.vup>6</>명>').replace('+{0:0%}','<@ba.vup>+{0:0%}</>').replace('+{1:0%}','<@ba.vup>+{1:0%}</>').replace('(중첩 수에 따라 변경)','<@ba.acrem>(중첩 수에 따라 변경)</>').replace('+50','<@ba.vup>+50</>');
 bonds.ursusShip={...structuredClone(bonds.yanShip),bondId:'ursusShip',name:'우르수스',identifier:90,powerIdList:['ursus'],iconId:'icon_ursusShip',thresholds:[3,6],activeCount:3,members,visibleMembers:members,desc,descRaw,effectName:'우르수스',effectId:'bondeffect_ursus',effectDesc,effectDescRaw,effectDescParams:[{index:0,base:'base_bonus',perStack:'atk_per_stack',format:'0%'},{index:1,base:'base_bonus',perStack:'hp_per_stack',format:'0%'}],bb:{base_bonus:.25,bonus_per_stack:.02,atk_per_stack:.02,hp_per_stack:.02,power_bond_char_cnt:6,attack_speed:50},bbStr:{},buffs:[],baseParams:['base_bonus','base_bonus'],perStackParams:['atk_per_stack','hp_per_stack'],spec:{tiers:[{count:3},{count:6}]}};
 for(const id of Object.keys(bonds)) if(id!=='ursusShip')for(const o of ops)if(o.bonds.includes(id)){const cid=`chess_custom_ursus_${o.key}_a`;for(const k of ['members','visibleMembers'])if(bonds[id][k]&&!bonds[id][k].includes(cid))bonds[id][k].push(cid);}
 const enemy=await json(join(URSUS_DIR,'enemies.json'));
 const drone=enemy.enemy_1112_emppnt;
 tokens.token_custom_ursus_drone={tokenId:'token_custom_ursus_drone',kind:'summon',name:'제국 드론',appellation:'Imperial Drone',desc:'우르수스 3 진영 효과로 소환되는 아군 제국 드론',profession:'TOKEN',position:'ALL',displayType:'DEFAULT',placeable:false,stats:{...drone.stats,blockCnt:0,cost:0,spRecovery:1,respawnTime:9999},rangeGrid:Array.from({length:5},(_,i)=>Array.from({length:5},(_,j)=>[i-2,j-2])).flat(),dmgType:'phys',attackKind:'ranged',projectile:'shell',canHitFly:true,deployLimit:1,count:1,owners:[],skill:null,spine:'enemy_1112_emppnt',immunities:drone.stats.immunities};
 assets.tokens.token_custom_ursus_drone={avatar:assets.enemies.enemy_1112_emppnt.icon,spine:assets.enemies.enemy_1112_emppnt.spine};
 // A local SVG gives the experimental faction an icon without claiming it is official artwork.
 assets.bonds.ursusShip='/assets/custom/ursus/icon-full.png';
 await mkdir(join(ROOT,'public/assets/custom/ursus'),{recursive:true});
 await writeFile(join(ROOT,'public/assets/custom/ursus/icon.svg'),'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="#b83838" d="M8 12h48v28L32 60 8 40z"/><path fill="white" d="M18 23h28v7H18zm6 12h16v7H24z"/></svg>');
 const extra=await json(join(ROOT,'.cache/ursus-extra-assets.json')).catch(()=>null);
 if(extra){Object.assign(assets.chars,extra.chars);Object.assign(assets.tokens,extra.tokens||{});Object.assign(assets.skillsById,extra.skillsById);Object.assign(assets.skills,extra.skills||{});for(const o of ops){const r=chess[`chess_custom_ursus_${o.key}_b`];r.assets.avatar=`${o.charId}_2`;r.assets.portrait=`${o.charId}_2`;}}
 // Ursus Cutlass: appearance/lore from Integrated Strategies, custom equipment effects for this mode.
 for(const suffix of ['a','b']){
  const id=`chess_item_custom_ursus_${suffix}`,elite=suffix==='b',rec=structuredClone(items[`chess_item_1_01_e_${suffix}`]);
  Object.assign(rec,{id,baseId:'chess_item_custom_ursus_a',goldenId:'chess_item_custom_ursus_b',upgradeChessId:elite?null:'chess_item_custom_ursus_b',identifier:9500+Number(elite),name:'우르수스 곡도',effectName:'우르수스 곡도',tier:3,shopSortId:90,trapId:'ursus_cutlass',iconId:'ursus_cutlass',giveBondId:'ursusShip',effectId:'eff_custom_ursus_cutlass',desc:`공격력·최대 HP +${elite?25:15}%. 변형 구조체와 함께 장착하면 우르수스 소속 추가.`,flavor:'강철의 홍수가 황량한 땅을 달린다. 우르수스는 내 두 손의 연장이다.',source:{relicId:'rogue_1_relic_c01',name:'乌萨斯弯刀',mode:'Integrated Strategies',effects:'custom'}});
  rec.descRaw=rec.desc;rec.buffs[0].bb={atk:elite?.25:.15,max_hp:elite?.25:.15};rec.params={...rec.buffs[0].bb,key:'attr_common_global_buff'};items[id]=rec;
 }
 assets.items.ursus_cutlass='/assets/custom/ursus/item/ursus-cutlass.png';
 for(const rec of Object.values(items))if(rec.canGiveBond)rec.descRaw=rec.desc+='\n우르수스 곡도와 함께 장착: 우르수스 소속 추가.';
 const bandId='band_custom_ursus_kaschey';
 const bandDesc='[영광과 번영]<우르수스> 오퍼레이터를 승급할 때마다 레벨업 비용 -2 (라운드당 최대 1회)';
 bands[bandId]={...structuredClone(bands.band_bldsk),bandId,sortId:90,name:'카셰이',iconId:'icon_custom_ursus_kaschey',totalHp:22,effectId:'effect_custom_ursus_kaschey',effectName:'영광과 번영',desc:bandDesc,descRaw:bandDesc,bondIds:['ursusShip'],buffs:[{key:'custom_ursus_merge_level_discount',bb:{count:2,max_count:1},bbStr:{}}],params:{count:2,max_count:1}};
 assets.bands[bandId]='/assets/custom/ursus/band/kaschey-portrait-v3.png';
 await writeFile(join(ROOT,'.cache/ursus-band-resources.json'),JSON.stringify({files:[{path:assets.bands[bandId],local:true,sources:[]}]}));
 for(const [key,value]of Object.entries({chess,bonds,garrisons,tokens,assets,items,bands}))await writeFile(join(URSUS_DIR,`${key}.json`),JSON.stringify(value));
 await buildRecruits(ROOT,URSUS_DIR);
 console.log(`Ursus overlay generated: ${members.length} operators, ${URSUS_DIR}`);return {dir:URSUS_DIR,ops};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await buildUrsus();
