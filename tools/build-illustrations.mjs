import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {RAW} from './assets/sources.mjs';
export async function buildIllustrations(root,dir){
 const assets=JSON.parse(await readFile(join(dir,'assets.json'),'utf8'));
 const skins=JSON.parse(await readFile(join(root,'.cache/skins/zh.json'),'utf8'));
 const resources=JSON.parse(await readFile(join(root,'.cache/skin-resources.json'),'utf8'));
 const skinByModel=new Map(Object.values(skins.charSkins).filter(s=>typeof s.battleSkin?.skinOrPrefabId==='string').map(s=>['skin_'+s.battleSkin.skinOrPrefabId.replace(/[^A-Za-z0-9_]/g,'_'),s]));
 for(const [id,c]of Object.entries(assets.chars)){
  const skin=skinByModel.get(id),char=skin?.charId || id.replace(/_[12]$/,'');
  if(!char.startsWith('char_'))continue;
  const add=(name,key)=>{const path=`/assets/custom/illustrations/${encodeURIComponent(name).replace(/%/g,'_')}.png`;c[key]=path;resources.files.push({path,sources:[`${RAW.aa2}arts/characters/${char}/${encodeURIComponent(name.toLowerCase())}.png`]});};
  if(skin)add(skin.portraitId,'illustration');
  else {add(`${char}_1`,'illustration');if(c.portraitE2 || id.endsWith('_2'))add(`${char}_2`,'illustrationE2');if(id.endsWith('_2'))c.illustration=c.illustrationE2;}
 }
 const map=new Map(resources.files.map(f=>[f.path,f]));resources.files=[...map.values()];
 await writeFile(join(dir,'assets.json'),JSON.stringify(assets));await writeFile(join(root,'.cache/skin-resources.json'),JSON.stringify(resources));
 console.log(`Full illustration catalogue ready; ${resources.files.filter(f=>f.path.includes('/illustrations/')).length} images`);
}
