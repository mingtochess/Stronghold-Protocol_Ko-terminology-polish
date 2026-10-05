// Resolve every equipped skill against the official bank, including custom/recruit operators.
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {indexAudio} from './assets/audio.mjs';
import {RAW} from './assets/sources.mjs';
export async function buildSkillSounds(root,dir){
 const read=async p=>JSON.parse(await readFile(p,'utf8'));
 const audio=indexAudio(await read(join(root,'.cache/gamedata/excel/audio_data.json')));
 const chess=await read(join(dir,'chess.json')),assets=await read(join(dir,'assets.json'));
 assets.audio.bgm.prep=assets.audio.bgm.lobby; // official mode theme during rest; never retain a battle loop
 const units=assets.audio.sfx.units,files=[],audit=[];
 for(const [id,records]of Map.groupBy(Object.values(chess),c=>c.charId)){
  if(!id)continue;
  const skills=new Map(records.flatMap(c=>c.skills||[c.skill]).filter(Boolean).map(s=>[s.index,s]));
  const mapping={};
  for(const [i,s]of skills){
   const paths=audio.bank(`battle.ON_SKILL_START.${s.skillId}`);
   const sound=paths[0];mapping[i]=null;
   if(sound){const path=`/assets/audio/sfx/${sound}`;mapping[i]=path;files.push({path,sources:[RAW.aa2voice+sound]});}
   audit.push({charId:id,skillId:s.skillId,index:i,sound:sound||null});
  }
  units[id]={...(units[id]||{}),skills:mapping};
 }
 await writeFile(join(dir,'assets.json'),JSON.stringify(assets));
 await writeFile(join(root,'.cache/skill-sound-resources.json'),JSON.stringify({files:[...new Map(files.map(f=>[f.path,f])).values()]}));
 await writeFile(join(root,'docs/SKILL-SOUND-AUDIT.json'),JSON.stringify(audit,null,2)+'\n');
 console.log(`Skill sound banks: ${audit.filter(s=>s.sound).length}/${audit.length}; absent banks remain silent.`);
}
if(process.argv[1]?.endsWith('build-skill-sounds.mjs'))await buildSkillSounds(process.cwd(),join(process.cwd(),'.cache/ursus-data'));
