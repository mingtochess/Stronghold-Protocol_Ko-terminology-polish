import{readFile,writeFile}from'node:fs/promises';
import{fileURLToPath}from'node:url';
import{buildRecordOverlay}from'../shared/i18nData.js';
import{localizeNorthernRecord}from'./northern-text.mjs';
import{NORTHERN_OPERATORS}from'./build-northern-recruits.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),read=async p=>JSON.parse(await readFile(root+p,'utf8'));
function leaves(a,b,path=[],out=[]){if(typeof a==='string'&&typeof b==='string'&&a!==b)out.push({path,zh:a,en:b});else if(a&&b&&typeof a==='object')for(const k of Object.keys(a))leaves(a[k],b[k],[...path,Array.isArray(a)?Number(k):k],out);return out;}
export async function buildNorthernI18n(){
 const ko=await read('content/custom/northern/ko.json'),chess=await read('content/production/data/chess.json'),counts={};
 for(const lang of ['en','ja','zh']){
  const texts=await read(`content/custom/northern/${lang}.json`),fork=await read(`public/i18n/${lang}/fork.json`),overlay=lang==='zh'?null:await read(`public/i18n/${lang}/data.json`);let count=0;
  for(const op of NORTHERN_OPERATORS)for(const[id,r]of Object.entries(chess).filter(([,r])=>r.charId===op.charId)){
   const changes=leaves(r,localizeNorthernRecord(r,texts[op.key],ko[op.key]));count+=changes.length;
   for(const c of changes)fork[c.zh]=c.en;
   if(overlay){overlay.files.chess[id]=buildRecordOverlay(changes);overlay.names[r.name]=texts[op.key].name;}
  }
  await writeFile(root+`public/i18n/${lang}/fork.json`,JSON.stringify(fork,null,2)+'\n');if(overlay)await writeFile(root+`public/i18n/${lang}/data.json`,JSON.stringify(overlay)+'\n');counts[lang]=count;
 }
 return counts;
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(await buildNorthernI18n());
