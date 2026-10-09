// Match official CN/KR templates, then render translations with the current combat blackboards.
// This preserves current values when upstream changes potential, levels, modules or skill ranks.
import {readFile,writeFile} from 'node:fs/promises';
import {textPair} from '../build-data.mjs';
const root=new URL('../../',import.meta.url),read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const templates=new Map(),names=new Map(),numeric=new Map();
const plain=s=>s.replace(/<[@$][^>]*>|<\/>/g,'').replace(/\\n/g,'\n').replace(/\s/g,'');
const shape=s=>plain(s).replace(/\{[^}]*\}/g,'#').replace(/[-+]?\d+(?:\.\d+)?%?/g,'#').replace(/%/g,'');
function pairs(cn,kr,key=''){
 if(typeof cn==='string'&&typeof kr==='string'&&/[一-鿿]/.test(cn)&&/[가-힣]/.test(kr)&&!/[一-鿿]/.test(kr)){
  names.set(cn,kr);
  const k=shape(cn);if(!numeric.has(k))numeric.set(k,[]);numeric.get(k).push([cn,kr]);
  if(/desc|description/i.test(key)){const k=shape(cn);if(!templates.has(k))templates.set(k,[]);templates.get(k).push([cn,kr]);}
 }else if(Array.isArray(cn)&&Array.isArray(kr))cn.forEach((x,i)=>pairs(x,kr[i],key));
 else if(cn&&kr&&typeof cn==='object'&&typeof kr==='object')for(const k of Object.keys(cn))pairs(cn[k],kr[k],k);
}
for(const table of ['character_table','skill_table','battle_equip_table','uniequip_table'])pairs(await read(`.cache/gamedata/excel/${table}.json`),await read(`.cache/ursus-source/kr-${table}.json`));
const out=await read('public/i18n/ko/data.json');let added=0;const unresolved=new Map();
function add(src,dst){if(typeof src!=='string'||typeof dst!=='string'||!/[一-鿿]/.test(src)||!/[가-힣]/.test(dst)||/[一-鿿]/.test(dst))return;if(!out[src]){out[src]=dst;added++;}}
const numbers=s=>plain(s).match(/[-+]?\d+(?:\.\d+)?%?/g)||[];
function numericTranslation(value){
 for(const [cn,kr]of numeric.get(shape(value))||[]){
  const original=numbers(cn),current=numbers(value),translated=numbers(kr);
  if(original.length!==current.length||original.length!==translated.length)continue;
  if([...original].sort().join('|')!==[...translated].sort().join('|'))continue;
  const replacements=new Map();let valid=true;
  original.forEach((n,i)=>{if(replacements.has(n)&&replacements.get(n)!==current[i])valid=false;replacements.set(n,current[i]);});
  if(!valid)continue;
  return kr.split(/(<[^>]*>)/g).map(part=>part.startsWith('<')?part:part.replace(/[-+]?\d+(?:\.\d+)?%?/g,n=>replacements.get(n)??n)).join('');
 }
 return null;
}
function visit(node,path){if(!node||typeof node!=='object')return;
 for(const [key,value]of Object.entries(node)){
  if(typeof value==='string'&&['name','desc','descRaw','description','effectName'].includes(key)&&/[一-鿿]/.test(value)){
   if(names.has(value))add(value,names.get(value));
   if(!out[value]&&node.bb){for(const [cn,kr]of templates.get(shape(value))||[]){const source=textPair(cn,node.bb,node.bbStr||{});if(plain(source.desc)===plain(value)){const translated=textPair(kr,node.bb,node.bbStr||{});add(value,key==='descRaw'?translated.descRaw:translated.desc);break;}}}
   if(!out[value])add(value,numericTranslation(value));
   if(!out[value])unresolved.set(value,path+'.'+key);
  }else if(value&&typeof value==='object')visit(value,path+'.'+key);
 }
}
for(const file of ['chess','garrisons','items','tokens']){const records=await read(`content/production/data/${file}.json`);for(const [id,record]of Object.entries(records)){if(file==='chess'&&(record.visible===false||record.globalReleased===false))continue;visit(record,file+'.'+id);}}
await writeFile(new URL('public/i18n/ko/data.json',root),JSON.stringify(out,null,0).replace(/","/g,'",\n"')+'\n');
console.log({added,unresolved:unresolved.size});
await writeFile('/tmp/runtime-text-unresolved.json',JSON.stringify([...unresolved].map(([source,path])=>({source,path})),null,2));
