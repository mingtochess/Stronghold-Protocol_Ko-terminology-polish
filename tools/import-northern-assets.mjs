// Import only the three verified local operators; preserve every existing resource and FX key.
import{readFile,writeFile,mkdir,copyFile}from'node:fs/promises';
import{resolve,dirname,basename}from'node:path';
import{createHash}from'node:crypto';
import{execFileSync}from'node:child_process';
import{parseSkel}from'./assets/skel.mjs';
import{atlasInfo}from'./assets/atlas.mjs';
import{resolveRoles}from'./assets/anim-roles.mjs';
import{indexAudio,VOICE_SLOTS}from'./assets/audio.mjs';
import{unitCombatSounds}from'./assets/unit-combat-sounds.mjs';
import{attachAttackTimings}from'../shared/attackTiming.js';
import{NORTHERN_OPERATORS}from'./build-northern-recruits.mjs';
const root=process.cwd(),incoming=resolve(process.argv[2]||'/workspace/incoming/cn-operators-20261101-133603-390700');
const read=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));
const write=async(p,x)=>{await mkdir(dirname(resolve(root,p)),{recursive:true});await writeFile(resolve(root,p),JSON.stringify(x));};
const assets=await read('content/production/data/assets.json'),chess=await read('content/production/data/chess.json'),manifest=await read('content/production/resources.json');
const fileMap=new Map(manifest.files.map(f=>[f.path,f])),newFiles=new Map(),patch={chars:{},skills:{},modules:{},audio:{sfx:{units:{}},voice:{jp:{},kr:{}}}};
async function payload(url,from){
 const dest=resolve(root,'content/production'+url);await mkdir(dirname(dest),{recursive:true});
 if(from&&resolve(from)!==dest)await copyFile(from,dest);
 const bytes=await readFile(dest),entry={path:url,local:true,sources:[url],bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
 fileMap.set(url,entry);newFiles.set(url,entry);return url;
}
const models=await read(incoming+'/models/models.json'),plan=await read(incoming+'/operator-plan.json');
for(const row of models.models)for(const skeleton of row.skeletons||[])for(const url of skeleton.files)await payload(url,resolve(incoming,'models/public'+url));
for(const op of NORTHERN_OPERATORS){
 const model=models.models.find(r=>r.baseCharId===op.charId&&r.skeletons.some(s=>/FaceSwitcher\/(Front|Back)$/.test(s.node)));
 if(!model)throw Error('Missing front/back model: '+op.charId);
 const spine={};for(const s of model.skeletons.filter(s=>/FaceSwitcher\/(Front|Back)$/.test(s.node))){const a=atlasInfo(await readFile(resolve(root,'content/production'+s.atlas),'utf8')),sk=parseSkel(await readFile(resolve(root,'content/production'+s.skeleton)),new Set(a.regions));if(sk.missingRegions.length)throw Error('Missing atlas regions '+op.charId+': '+sk.missingRegions.join(','));spine[s.node.endsWith('/Front')?'front':'back']={skel:s.skeleton,atlas:s.atlas,textures:s.files.filter(x=>x.endsWith('.png')),pma:true,animations:sk.durations,hits:sk.hits,bounds:sk.bounds,anims:resolveRoles(sk.animations,{skillIndices:[0,1,2],durations:sk.durations})};}
 if(op.charId==='char_4247_oxi')for(const model of Object.values(spine))model.anims.skills[1]={begin:null,loop:'Skill_2_Cambat',end:null,index:1,idle:null};
 patch.chars[op.charId]={spine};patch.chars[op.charId+'_2']={spine};
}
const sprites=await read(incoming+'/sprites/sprites.json');
for(const op of NORTHERN_OPERATORS)for(const row of plan.skins.filter(s=>s.charId===op.charId)){
 const mount=op.charId+(row.skinId.endsWith('#2')?'_2':'');
 for(const[role,name]of [['avatar',row.avatarId],['portrait',row.portraitId]]){
  const matches=sprites.sprites.filter(s=>s.name===name).sort((a,b)=>role==='avatar'?a.width*a.height-b.width*b.height:b.width*b.height-a.width*a.height);
  if(!matches.length)throw Error(`Missing ${role} ${name}`);
  const s=matches[0];patch.chars[mount][role]=await payload('/assets/local/northern/sprites/'+s.file,resolve(incoming,'sprites',s.file));
 }
}
for(const s of sprites.sprites)if(s.name.startsWith('skill_icon_skchr_')||s.name==='uniequip_002_dminon'){
 const url=await payload('/assets/local/northern/sprites/'+s.file,resolve(incoming,'sprites',s.file));
 if(s.name.startsWith('skill_icon_'))patch.skills[s.name.slice(11)]=url;else patch.modules[s.name]=url;
}
const base=await read('content/production/assets/local/fx/index.json'),textures=await read('content/production/assets/local/fx/textures.json'),local=await read('content/production/data/local-fx.json');
const fxRoot=incoming+'/base-fx',idx=await read(fxRoot+'/public/assets/local/fx/index.json'),tex=await read(fxRoot+'/public/assets/local/fx/textures.json'),fxManifest=await read(fxRoot+'/data/local-fx.json');
for(const[k,v]of Object.entries(idx.prefabs))if(base.prefabs[k]&&JSON.stringify(base.prefabs[k])!==JSON.stringify(v))throw Error('Existing prefab collision: '+k);else base.prefabs[k]=v;
for(const[k,v]of Object.entries(tex.textures))textures.textures[k]??=v;
for(const[group,entries]of Object.entries(fxManifest.groups)){
 if(group==='fx')continue;local.groups[group]??={};for(const[k,v]of Object.entries(entries)){local.groups[group][k]??=v;for(const url of [v.path,v.half])if(url)await payload(url,resolve(fxRoot,'public'+url));}
}
const wiring=await read(incoming+'/unit-skill-projectiles.json');
for(const section of ['units','skills','projectiles'])for(const[k,v]of Object.entries(wiring[section])){
 if(base[section][k]&&JSON.stringify(base[section][k])!==JSON.stringify(v))throw Error('Existing wiring collision '+section+':'+k);base[section][k]=v;
}
local.groups.fx.index.prefabs=Object.keys(base.prefabs).length;local.groups.fx.textures.count=Object.keys(textures.textures).length;
await write('content/production/assets/local/fx/index.json',base);await write('content/production/assets/local/fx/textures.json',textures);
await payload('/assets/local/fx/index.json');await payload('/assets/local/fx/textures.json');await write('content/production/data/local-fx.json',local);
const audio=indexAudio(await read(incoming+'/tables/client/audio_data.json')),report=await read(incoming+'/audio/audio-report.json');
const clips=new Map(report.files.filter(x=>x.kind==='sfx').map(x=>[x.name.toLowerCase(),x]));
async function encode(row,url){const dest=resolve(root,'content/production'+url);await mkdir(dirname(dest),{recursive:true});execFileSync('ffmpeg',['-v','error','-y','-i',resolve(incoming,'audio',row.file.replaceAll('\\','/')),'-codec:a','libmp3lame','-b:a','128k',dest]);return payload(url);}
async function remap(value){
 if(typeof value==='string'&&value.startsWith('/assets/audio/sfx/')){const name=basename(value,'.mp3').toLowerCase(),row=clips.get(name);if(!row)throw Error('Missing exact SFX '+name);return encode(row,'/assets/local/northern/sfx/'+name+'.mp3');}
 if(Array.isArray(value))return Promise.all(value.map(remap));
 if(value&&typeof value==='object'){const o={};for(const[k,v]of Object.entries(value))o[k]=await remap(v);return o;}
 return value;
}
const bankPath=key=>{const path=audio.bank(key)?.[0];return path?'/assets/audio/sfx/'+path:null;};
for(const op of NORTHERN_OPERATORS){
 const record=Object.values(chess).find(c=>c.charId===op.charId),{unit}=unitCombatSounds(audio,op.charId,record.skills);
 if(op.key==='talulah'){
  unit.skills[0]=bankPath('battle.ON_ABILITY_START.skchr_oxi_1');
  unit.skills[1]=bankPath('battle.ON_ABILITY_START.skchr_oxi_2');
  unit.fx={talulahS1:bankPath('battle.ON_ABILITY_HIT.skchr_oxi_1'),talulahGuard:bankPath('battle.ON_ABILITY_HIT.skchr_oxi_2'),talulahWave:bankPath('battle.ON_PROJECTILE_BORN.projectile_chr_oxi_s_3_heatwave'),talulahWaveHit:bankPath('battle.ON_PROJECTILE_HIT.projectile_chr_oxi_s_3_heatwave'),talulahTrail:bankPath('battle.ON_CUSTOM_TRIGGER.oxi_fire_field_create'),talulahOverdrive:bankPath('battle.ON_CUSTOM_TRIGGER.oxi_s_3_overload')};
 }else if(op.key==='territoriya')unit.fx={territoriyaSpread:bankPath('battle.ON_CUSTOM_TRIGGER.dminon_s3_expand'),territoriyaRetreat:bankPath('battle.ON_PROJECTILE_REACH.projectile_chr_dminon_withdraw')};
 else{
  unit.skills[0]=bankPath('battle.ON_ABILITY_START.skchr_tocka_1');
  unit.skills[1]=bankPath('battle.ON_ABILITY_START.skchr_tocka_2');
  unit.attack=bankPath('battle.ON_ABILITY_ON.char_4244_tocka.attack.0.2');
  unit.fx={toskaMark:{1:bankPath('battle.ON_PROJECTILE_HIT.projectile_chr_tocka_s2')},toskaTrigger:{0:bankPath('battle.ON_BUFF_SHOW_EFFECT.tocka_s1_shield_start_audio'),1:bankPath('battle.ON_BUFF_SHOW_EFFECT.tocka_s2_auto_skill_audio'),2:bankPath('battle.ON_BUFF_SHOW_EFFECT.tocka_s3_bonus_start_audio')}};
 }
 patch.audio.sfx.units[op.charId]=await remap(unit);
}
const words=await read(incoming+'/tables/client/charword_table.json');
for(const op of NORTHERN_OPERATORS){const slots={};for(const word of Object.values(words.charWords).filter(w=>w.charId===op.charId&&VOICE_SLOTS[w.placeType]&&w.voiceAsset)){
 const row=report.files.find(f=>f.kind==='voice'&&f.owners.includes(op.charId)&&f.name.toLowerCase()===word.voiceId.toLowerCase());if(!row)throw Error('Missing declared voice '+word.charWordId);
 const url=await encode(row,`/assets/local/northern/voice/${op.charId}/${word.voiceId.toLowerCase()}.mp3`);(slots[VOICE_SLOTS[word.placeType]]??=[]).push(url);
 }patch.audio.voice.jp[op.charId]=slots;patch.audio.voice.kr[op.charId]=slots;}
for(const[k,v]of Object.entries(patch.chars))assets.chars[k]={...assets.chars[k],...v};assets.skills={...assets.skills,...patch.skills};assets.modules={...assets.modules,...patch.modules};
assets.audio.sfx.units={...assets.audio.sfx.units,...patch.audio.sfx.units};for(const lang of ['jp','kr'])Object.assign(assets.audio.voice[lang],patch.audio.voice[lang]);
for(const r of Object.values(chess).filter(c=>c.recruitSource==='local-northern')){r.assets={...r.assets,spine:r.charId,voice:r.charId,avatar:r.charId+(r.isGolden?'_2':''),portrait:r.charId+(r.isGolden?'_2':''),skillIcon:r.skill.iconId||r.skill.skillId};}
attachAttackTimings({chess:Object.fromEntries(Object.entries(chess).filter(([,c])=>c.recruitSource==='local-northern'))},assets);
await write('content/production/data/assets.json',assets);await write('content/production/data/chess.json',chess);
manifest.files=[...fileMap.values()];manifest.version=createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex').slice(0,20);manifest.estimatedBytes=manifest.files.reduce((n,f)=>n+(f.bytes??256*1024),0);manifest.estimatedStorageBytes=Math.ceil(manifest.estimatedBytes*2.2);delete manifest.totalBytes;await write('content/production/resources.json',manifest);
patch.fxGroups={...fxManifest.groups,fx:local.groups.fx};patch.files=[...newFiles.values()];await write('content/custom/northern/assets.json',patch);
console.log('Northern assets imported:',newFiles.size,'resources;',Object.keys(patch.chars).length,'character mounts');
