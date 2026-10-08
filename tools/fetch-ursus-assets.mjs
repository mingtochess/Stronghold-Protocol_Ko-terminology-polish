// Fetch only the local experiment's additional public artwork. Existing resource cache stays untouched.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';import {dirname,resolve,join} from 'node:path';
import {Downloader} from './assets/downloader.mjs';
import {processModels} from './assets/spine.mjs';
import {RAW} from './assets/sources.mjs';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..'),root=join(ROOT,'public/assets');
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const ops=[...await json(join(ROOT,'content/custom/ursus/operators.json')),...(await json(join(ROOT,'content/custom/ursus/recruits.json'))).map(o=>({...o,recruit:true}))];
const dataDir=join(ROOT,'.cache/ursus-data');
const assets=await json(join(dataDir,'assets.json')),chess=await json(join(dataDir,'chess.json'));
const dl=new Downloader({root,ledgerPath:join(ROOT,'.cache/ursus-assets-ledger.json'),concurrency:8,retries:2,timeoutMs:30000});await dl.loadLedger();
const jobs=[],models=new Map();
 jobs.push({rel:'custom/ursus/icon-full.png',urls:[RAW.aa2+'arts/camplogo/logo_ursus.png'],kind:'png'});
 jobs.push({rel:'custom/ursus/item/ursus-cutlass.png',urls:[RAW.aa2+'arts/ui/rogueliketopic/itempic/rogue_1_relic_c01.png'],kind:'png'});
jobs.push({rel:'custom/ursus/item/emperors-favor.png',urls:[RAW.aa2+'arts/ui/rogueliketopic/itempic/rogue_1_relic_a14.png'],kind:'png'});
const job=(rel,url)=>({rel,urls:[url],kind:rel.endsWith('.png')?'png':'binary'});
for(const o of ops){
 const c=assets.chars[o.charId]={spine:{}};
 for(const [key,folder,file]of [['avatar','avatar',`${o.charId}.png`],['avatarE2','avatar',`${o.charId}_2.png`],['portrait','portrait',`${o.charId}_1.png`],['portraitE2','portrait',`${o.charId}_2.png`]]){
  const rel=`custom/ursus/${folder}/${file}`;c[key]=`/assets/${rel}`;jobs.push(job(rel,RAW.yuanyan+`${folder}/${file}`));
 }
 const rec=chess[o.recruit?`chess_custom_recruit_${o.key}_6_a`:`chess_custom_ursus_${o.key}_a`];
 for(const sk of rec.skills||[rec.skill])if(sk?.iconId){const rel=`custom/ursus/skill/${sk.iconId}.png`;jobs.push(job(rel,RAW.yuanyan+`skill/skill_icon_${sk.iconId}.png`));assets.skills[sk.iconId]=`/assets/${rel}`;assets.skillsById[sk.skillId]=sk.iconId;}
 // Same documented Front/Back hierarchy as docs/research/07-assets.json.
 for(const side of ['front','back']){
  const baseUrl=RAW.fexli+`spine/${o.charId}/${o.charId}/${side==='front'?'Front':'Back'}/`,dir=`custom/ursus/spine/${o.charId}/${side}/`;
  models.set(`${o.charId}:${side}`,{key:`${o.charId}:${side}`,kind:'op',dir,pma:false,skillIndices:[0,1,2],baseUrl,skel:job(dir+`${o.charId}.skel`,baseUrl+`${o.charId}.skel`),atlas:{...job(dir+`${o.charId}.atlas`,baseUrl+`${o.charId}.atlas`),mutable:true},pngs:[job(dir+`${o.charId}.png`,baseUrl+`${o.charId}.png`)]});
 }
}
const tokenId='token_10035_wisdel_wward',variant=`${tokenId}_game_9`,tokenDir=`custom/ursus/spine/${tokenId}/front/`,tokenUrl=RAW.fexli+`spine/${tokenId}/${variant}/Front/`;
models.set(`token:${tokenId}`,{key:`token:${tokenId}`,kind:'token',dir:tokenDir,pma:false,skillIndices:[0],baseUrl:tokenUrl,skel:job(tokenDir+variant+'.skel',tokenUrl+variant+'.skel'),atlas:{...job(tokenDir+variant+'.atlas',tokenUrl+variant+'.atlas'),mutable:true},pngs:[job(tokenDir+variant+'.png',tokenUrl+variant+'.png')]});
const browserIndex=await json(join(ROOT,'public/vendor/browser-resources.json'));
 for(const f of browserIndex.files)if(['char_196_sunbr','char_4207_branch','enemy_1112_emppnt','/assets/ui/entry/bg_mountains_tiled.png','/assets/ui/battle/sprite_shadow.png'].some(id=>f.path.includes(id)))jobs.push({rel:f.path.replace(/^\/assets\//,''),urls:f.sources,kind:f.path.endsWith('.png')?'png':'binary'});
 const downloads=await dl.run(jobs,'Ursus portraits and skill icons');
 const missing=[...downloads].filter(([,r])=>r.status==='miss'||r.status==='error');
 if(missing.length)throw Error(`Missing Ursus artwork: ${missing.map(([path])=>path).join(', ')}`);
const result=await processModels(models,{root,dl,cachePath:join(ROOT,'.cache/ursus-spine.json')});
for(const [key,value]of result.entries){const [id,side]=key.split(':');if(id==='token'){assets.tokens[side]={owner:'char_1035_wisdel',avatar:assets.chars.char_1035_wisdel.avatar,spine:value};}else assets.chars[id].spine[side]=value;}
// Elites use the requested E2 portraits rather than the base image when available.
for(const o of ops){const r=chess[o.recruit?`chess_custom_recruit_${o.key}_6_b`:`chess_custom_ursus_${o.key}_b`];r.assets.avatar=`${o.charId}_2`;r.assets.portrait=`${o.charId}_2`;}
await writeFile(join(dataDir,'assets.json'),JSON.stringify(assets));await writeFile(join(dataDir,'chess.json'),JSON.stringify(chess));
await mkdir(join(ROOT,'.cache'),{recursive:true});await writeFile(join(ROOT,'.cache/ursus-extra-assets.json'),JSON.stringify({chars:Object.fromEntries(ops.map(o=>[o.charId,assets.chars[o.charId]])),skillsById:assets.skillsById,skills:assets.skills,tokens:{token_10035_wisdel_wward:assets.tokens.token_10035_wisdel_wward}}));
if(result.problems.length)throw Error(result.problems.join('\n'));
if(result.entries.size!==ops.length*2+1)throw Error('Expected Front/Back battle models for all operators');
console.log('Extra assets saved; missing files are reported above.');
