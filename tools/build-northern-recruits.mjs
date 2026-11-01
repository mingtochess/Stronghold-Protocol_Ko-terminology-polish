import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {localizeNorthernRecord} from './northern-text.mjs';
import {attachAttackTimings} from '../shared/attackTiming.js';
import {createOfficialUnitBuilders} from '../server/plugins/officialUnitBuilder.js';
import {composeUnitRecord} from '../shared/standIn.js';
import {withPotentialData,textPair} from './build-data.mjs';
export const NORTHERN_OPERATORS = Object.freeze([
 {charId:'char_4247_oxi',key:'talulah',name:'탈룰라',skillIndex:2},
 {charId:'char_4246_dminon',key:'territoriya',name:'테리토리야',skillIndex:2},
 {charId:'char_4244_tocka',key:'toska',name:'토스카',skillIndex:2},
]);
export async function buildNorthernRecruits(root,dir){
 const read=async p=>JSON.parse(await readFile(p,'utf8'));
 const tables=await read(`${root}/content/custom/northern/official.json`),slots=await read(`${root}/content/upstream-recruits/slots.json`);
 const chess=await read(`${dir}/chess.json`),bonds=await read(`${dir}/bonds.json`);
 const texts=await read(`${root}/content/custom/northern/ko.json`),source=await read(`${root}/content/custom/northern/zh.json`);
 const {buildUnitHead,buildUnitForm}=createOfficialUnitBuilders(()=>{});
 for(const [i,op] of NORTHERN_OPERATORS.entries())for(const tier of [5,6])for(const elite of [false,true]){
  const identity=structuredClone(slots[`chess_char_${tier}_diy1_${elite?'b':'a'}`]);
  const mid=elite?(tables.uniequip.charEquip[op.charId]||[]).find(id=>tables.uniequip.equipDict[id]?.type==='ADVANCED'):null;
  const values=Array.from({length:6},(_,potRank)=>{const ctx={...tables,potRank};return composeUnitRecord(identity,buildUnitHead(ctx,op.charId),buildUnitForm(ctx,op.charId,identity.status),{skillIndex:op.skillIndex,moduleId:mid,bonds:['ursusShip']});});
  const errors=[],rec=withPotentialData(values,op.charId,errors);if(errors.length)throw Error(errors.join('\n'));
  const base=`chess_custom_recruit_${op.key}_${tier}_a`,id=base.replace(/_a$/,elite?'_b':'_a');
  Object.assign(rec,{chessId:id,baseId:base,goldenId:base.replace(/_a$/,'_b'),upgradeChessId:elite?null:base.replace(/_a$/,'_b'),identifier:25000+i*8+(tier-5)*2+Number(elite),isDiy:false,chessType:'NORMAL',visible:true,isHidden:false,optionalRecruit:true,recruitSource:'local-northern',recruitSlot:identity.baseId,garrisonIds:[],shopSortId:-4+i,globalReleased:false,name:op.name});
  const t=texts[op.key];
  const translate=(record)=>{
   const trait=x=>{if(x)Object.assign(x,textPair(t.trait,x.bb,x.bbStr));};trait(record.trait);trait(record.traitBase);
   for(const list of [record.talents,record.talentsBase])for(const talent of list||[]){const value=t.talents[talent.index];if(value)Object.assign(talent,{name:value[0]},textPair(value[1],talent.bb,talent.bbStr));}
   for(const sk of record.skills||[]){const value=t.skills[sk.index];Object.assign(sk,{name:value[0],locked:false},textPair(value[1],sk.bb,sk.bbStr));}
   if(record.skill)Object.assign(record.skill,record.skills.find(x=>x.index===record.skill.index));
   return record;
  };
  translate(rec);rec.assets.voice=op.charId;
  // No promotion/skin state from an unrelated record is inherited.
  if(chess[id]?.skins)rec.skins=chess[id].skins;
  chess[id]=localizeNorthernRecord(rec,t,source[op.key]);
  if(!elite)for(const bid of ['ursusShip'])for(const field of ['members','visibleMembers'])if(bonds[bid]?.[field]&&!bonds[bid][field].includes(id))bonds[bid][field].push(id);
 }
 for(const field of ['members','visibleMembers'])if(bonds.emptyShip?.[field])bonds.emptyShip[field]=bonds.emptyShip[field].filter(id=>chess[id]?.recruitSource!=='local-northern');
 const patch=await read(`${root}/content/custom/northern/assets.json`).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
 if(patch){
  const assets=await read(`${dir}/assets.json`);for(const[k,v]of Object.entries(patch.chars))assets.chars[k]={...assets.chars[k],...v};
  for(const field of ['skills','modules'])Object.assign(assets[field]??={},patch[field]);
  Object.assign(assets.audio.sfx.units,patch.audio.sfx.units);for(const lang of ['jp','kr'])Object.assign(assets.audio.voice[lang],patch.audio.voice[lang]);
  for(const rec of Object.values(chess).filter(c=>c.recruitSource==='local-northern'))rec.assets={...rec.assets,spine:rec.charId,voice:rec.charId,avatar:rec.charId+(rec.isGolden?'_2':''),portrait:rec.charId+(rec.isGolden?'_2':''),skillIcon:rec.skill.iconId||rec.skill.skillId};
  attachAttackTimings({chess:Object.fromEntries(Object.entries(chess).filter(([,c])=>c.recruitSource==='local-northern'))},assets);await writeFile(`${dir}/assets.json`,JSON.stringify(assets));
  if(patch.fxGroups){const local=await read(`${dir}/local-fx.json`);for(const[group,entries]of Object.entries(patch.fxGroups))Object.assign(local.groups[group]??={},entries);await writeFile(`${dir}/local-fx.json`,JSON.stringify(local));}
 }
 await writeFile(`${dir}/chess.json`,JSON.stringify(chess));await writeFile(`${dir}/bonds.json`,JSON.stringify(bonds));return patch?.files||[];
}
if(process.argv[1]===fileURLToPath(import.meta.url))await buildNorthernRecruits(process.cwd(),process.argv[2]||'content/production/data');
