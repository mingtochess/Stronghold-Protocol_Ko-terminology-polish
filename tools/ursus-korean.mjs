// Korean labels only: preserve the combat values from the current CN tables.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {textPair} from './build-data.mjs';
const BASE='https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/master/kr/gamedata/excel/';
export async function loadKorean(root){
 const dir=join(root,'.cache/ursus-source');await mkdir(dir,{recursive:true});
 const table=async name=>{const path=join(dir,`kr-${name}.json`);try{return JSON.parse(await readFile(path,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;}
  const res=await fetch(`${BASE}${name}.json`,{signal:AbortSignal.timeout(30000)});if(!res.ok)throw Error(`Korean table ${name}: HTTP ${res.status}`);const text=await res.text(),parsed=JSON.parse(text);await writeFile(path,text);return parsed;
 };
 const [chars,skills,equip,battleEquip]=await Promise.all([table('character_table'),table('skill_table'),table('uniequip_table'),table('battle_equip_table')]);return{chars,skills,equip,battleEquip};
}
export function localizeOperator(rec,source,status){
 const ch=source.chars[rec.charId];if(!ch)return;
 rec.name=ch.name||rec.name;
 const phase=Number(status.evolvePhase.replace('PHASE_','')),level=status.charLevel;
 const eligible=c=>{const p=Number((c.unlockCondition?.phase||'PHASE_0').replace('PHASE_',''));return (p<phase||(p===phase&&(c.unlockCondition?.level||0)<=level))&&(c.requiredPotentialRank||0)<=5;};
 const last=list=>list?.filter(eligible).at(-1);
 for(const m of rec.modules||[]){const meta=source.equip.equipDict[m.uniEquipId];if(meta)m.name=meta.uniEquipName;}if(rec.module?.id){const meta=source.equip.equipDict[rec.module.id];if(meta)rec.module.name=meta.uniEquipName;}
 const trait=last(ch.trait?.candidates);
 const desc=trait?.overrideDescripton||ch.description;
 if(desc)Object.assign(rec.trait,textPair(desc,rec.trait.bb,rec.trait.bbStr));
 for(const list of [rec.talents,rec.talentsBase])for(const t of list||[]){const candidate=last(ch.talents?.[t.index]?.candidates);if(candidate){t.name=candidate.name;Object.assign(t,textPair(candidate.description,t.bb,t.bbStr));}}
 for(const sk of rec.skills||[]){const level=source.skills[sk.skillId]?.levels?.[sk.level-1];if(level){sk.name=level.name;Object.assign(sk,textPair(level.description,sk.bb,sk.bbStr));}}
 const applyModule=(m,trait,talents)=>{const ph=source.battleEquip[m.uniEquipId||m.id]?.phases?.find(p=>p.equipLevel===m.level);if(!ph)return;
  for(const part of ph.parts||[]){if(part.isToken)continue;const tr=last(part.overrideTraitDataBundle?.candidates);if(tr&&trait){if(tr.overrideDescripton)Object.assign(trait,textPair(tr.overrideDescripton,trait.bb,trait.bbStr));if(tr.additionalDescription){const text=textPair(tr.additionalDescription,trait.bb,trait.bbStr);trait.desc+='\n'+text.desc;trait.descRaw+='\n'+text.descRaw;trait.moduleDesc=text.desc;trait.moduleDescRaw=text.descRaw;}}
   const tc=last(part.addOrOverrideTalentDataBundle?.candidates);if(tc){const t=talents?.find(t=>(t.index??t.talentIndex)===tc.talentIndex&&t.hidden===!!tc.isHideTalent);if(t){if(tc.name)t.name=tc.name;const text=tc.upgradeDescription||tc.description;if(text)Object.assign(t,textPair(text,t.bb,t.bbStr));}}
  }
 };
 if(rec.module?.active)applyModule(rec.module,rec.trait,rec.talents);
 if(rec.traitBase&&desc)Object.assign(rec.traitBase,textPair(desc,rec.traitBase.bb,rec.traitBase.bbStr));
 for(const m of rec.modules||[]){if(m.traitOverride&&desc)Object.assign(m.traitOverride,textPair(desc,m.traitOverride.bb,m.traitOverride.bbStr));applyModule(m,m.traitOverride,m.talentChanges);}
 const selected=rec.skills?.find(sk=>sk.index===rec.skill.index);if(selected)Object.assign(rec.skill,{name:selected.name,desc:selected.desc,descRaw:selected.descRaw});
}

export function localizeToken(rec, source) {
 const ch=source.chars[rec.tokenId];if(!ch)return;
 rec.name=ch.name||rec.name;
 if(ch.description)Object.assign(rec,textPair(ch.description,rec.trait?.bb||{},rec.trait?.bbStr||{}));
 const visit=value=>{
  if(!value||typeof value!=='object')return;
  if(value.skillId){const level=source.skills[value.skillId]?.levels?.[Math.max(0,(value.level||1)-1)];if(level){value.name=level.name;Object.assign(value,textPair(level.description,value.bb,value.bbStr));}}
  if(value.trait&&ch.description)Object.assign(value.trait,textPair(ch.description,value.trait.bb,value.trait.bbStr));
  for(const child of Object.values(value))if(child&&typeof child==='object')visit(child);
 };
 visit(rec);
}
