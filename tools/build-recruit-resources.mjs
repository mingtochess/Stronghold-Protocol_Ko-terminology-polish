import {readFile,writeFile} from 'node:fs/promises';
export async function buildRecruitResources(root){
 const a=JSON.parse(await readFile(`${root}/content/upstream-recruits/assets.json`)),b=JSON.parse(await readFile(`${root}/content/upstream-recruits/backups.json`));
 const ids=new Set([...b.diy.ownedPool,...Object.values(b.diy.prototypes).flat()]),files=new Map(),raw='https://raw.githubusercontent.com/';
 function walk(x){if(!x||typeof x!=='object')return;for(const v of Object.values(x)){if(typeof v==='string'&&v.startsWith('/assets/')){let sources=[];const op=v.match(/^\/assets\/spine\/op\/([^/]+)\/(front|back)\/(.+)$/);if(op){const [,id,side,name]=op;for(const dir of [side==='front'?'Front':'Back','Spine'])sources.push(`${raw}fexli/ArknightsResource/main/spine/${id}/${id}/${dir}/${name}`);}else if(v.startsWith('/assets/char/'))sources=[`${raw}yuanyan3060/ArknightsGameResource/main/${v.replace('/assets/char/','')}`];else if(v.startsWith('/assets/token/avatar/'))sources=[`${raw}yuanyan3060/ArknightsGameResource/main/avatar/${v.split('/').at(-1)}`];else if(v.startsWith('/assets/skill/'))sources=[`${raw}yuanyan3060/ArknightsGameResource/main/skill/skill_icon_${v.split('/').at(-1)}`];if(sources.length)files.set(v,{path:v,sources});}else walk(v);}if(x.atlas&&files.has(x.atlas))files.get(x.atlas).atlas={textures:x.textures,pma:x.pma};}
 for(const id of ids)walk(a.chars[id]);walk(a.skills);walk(a.skillsById);walk(a.tokens);
 await writeFile(`${root}/.cache/upstream-recruit-resources.json`,JSON.stringify({files:[...files.values()]}));
}
if(process.argv[1]?.endsWith('build-recruit-resources.mjs'))await buildRecruitResources(process.cwd());
