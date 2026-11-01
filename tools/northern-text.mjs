import{textPair}from'./build-data.mjs';
export function annotateNorthernDescription(text,bb={}){
 let depth=0;return String(text).split(/(<[^>]*>)/g).map(part=>{if(part.startsWith('<')){if(part==='</>')depth=Math.max(0,depth-1);else if(/^<[@$]/.test(part))depth++;return part;}return depth?part:part.replace(/\{([^}:]+)(?::[^}]+)?\}/g,(all,key)=>`<@ba.${Number(bb[key])<0?'vdown':'vup'}>${all}</>`);}).join('');
}
/** Localize the entire record, including potential deltas, module choices and module talent overrides. */
export function localizeNorthernRecord(record,texts,source){
 const names=new Map([[source.name,texts.name],[record.name,texts.name],[record.subProfessionName,texts.subProfessionName],
  ...(source.talents||[]).map((v,i)=>[v[0],texts.talents[i][0]]),...(source.skills||[]).map((v,i)=>[v[0],texts.skills[i][0]]),
  ...Object.entries(source.modules||{}).map(([id,v])=>[v,texts.modules?.[id]||v])]);
 function visit(value,key,inheritedTalent=null){
  if(typeof value==='string')return names.get(value)||value;
  if(!value||typeof value!=='object')return value;
  const talentIndex=['talents','talentsBase','talentChanges'].includes(key)?value.index??value.talentIndex??inheritedTalent:inheritedTalent;
  const out=Array.isArray(value)?value.map(v=>visit(v,key,talentIndex)):Object.fromEntries(Object.entries(value).map(([k,v])=>[k,visit(v,k,talentIndex)]));
  if(Array.isArray(out))return out;
  if(value.bb){
   let desc;
   if(value.skillId){const index=Number(value.skillId.slice(-1))-1;if(texts.skills[index]){out.name=texts.skills[index][0];desc=texts.skills[index][1];}}
   else if(['trait','traitBase','traitOverride'].includes(key))desc=texts.trait;
   else if(['talents','talentsBase','talentChanges','potBelow'].includes(key)){const index=value.index??value.talentIndex??talentIndex;if(texts.talents[index]){out.name=texts.talents[index][0];desc=texts.talents[index][1];}}
   if(desc)Object.assign(out,textPair(annotateNorthernDescription(desc,value.bb),value.bb,value.bbStr));
   if(value.moduleDescRaw&&texts.moduleAdditional){const t=textPair(texts.moduleAdditional,value.bb,value.bbStr);out.moduleDescRaw=t.descRaw;out.moduleDesc=t.desc;}
  }
  const mid=value.uniEquipId||value.id;if(mid&&texts.modules?.[mid])out.name=texts.modules[mid];
  return out;
 }
 const localized=visit(record);localized.name=texts.name;localized.subProfessionName=texts.subProfessionName;return localized;
}
