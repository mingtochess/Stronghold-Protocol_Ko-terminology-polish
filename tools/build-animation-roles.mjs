// Re-index existing skeletons for all selectable skills; never replace artwork or models.
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {selectedSkillClip} from '../shared/attackTiming.js';
import {resolveRoles} from './assets/anim-roles.mjs';
export async function buildAnimationRoles(root,dir){
 const assets=JSON.parse(await readFile(join(dir,'assets.json'),'utf8'));
 const audit=[];
 for(const [id,c]of Object.entries(assets.chars||{}))for(const [side,sp]of Object.entries(c.spine||{})){
  if(!sp?.animations)continue;
  const indices=[sp.anims?.skill?.index??0,0,1,2];
  sp.anims=resolveRoles(Object.keys(sp.animations),{skillIndices:indices,durations:sp.animations});
  audit.push({id,side,skills:Object.fromEntries(Object.entries(sp.anims.skills||{}).map(([i,r])=>[i,{clip:(selectedSkillClip(sp,Number(i))||r).loop,via:(selectedSkillClip(sp,Number(i))||r).via||null}]))});
 }
 for(const e of Object.values(assets.enemies||{})){
  const sp=e.spine;
  if(sp?.animations)sp.anims=resolveRoles(Object.keys(sp.animations),{skillIndices:[0],numberedSkills:true,durations:sp.animations});
 }
 await writeFile(join(dir,'assets.json'),JSON.stringify(assets));
 await writeFile(join(root,'docs/SKILL-ANIMATION-AUDIT.json'),JSON.stringify(audit,null,2)+'\n');
 console.log(`Animation roles indexed: ${audit.length} Front/Back models.`);
}
if(process.argv[1]?.endsWith('build-animation-roles.mjs'))await buildAnimationRoles(process.cwd(),join(process.cwd(),'.cache/ursus-data'));
