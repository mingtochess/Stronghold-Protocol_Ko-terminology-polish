// The normal `npm start` keeps the official data. This launcher is loopback-only by design.
import {readFile,writeFile} from 'node:fs/promises';
import {attachAttackTimings} from '../shared/attackTiming.js';
import {buildAnimationRoles} from '../tools/build-animation-roles.mjs';
import {buildSkillSounds} from '../tools/build-skill-sounds.mjs';
import {buildSkins} from '../tools/build-skins.mjs';
import {buildUrsus} from '../tools/build-ursus.mjs';
import {getData,resetData} from '../server/data.js';
import {setSimData} from '../server/sim/simdata.js';
import {setGameData} from '../server/sim/content/support/index.js';
import {startServer} from '../server/index.js';
const {dir}=await buildUrsus();
await import('../tools/fetch-ursus-assets.mjs');
await import('../tools/build-battle-voices.mjs');
await buildSkins(process.cwd(),dir);
await buildSkillSounds(process.cwd(),dir);
await buildAnimationRoles(process.cwd(),dir);
const timingData = {};
for (const key of ['chess','enemies','tokens','assets']) timingData[key] = JSON.parse(await readFile(`${dir}/${key}.json`, 'utf8'));
attachAttackTimings(timingData, timingData.assets);
for (const key of ['chess','enemies','tokens']) await writeFile(`${dir}/${key}.json`, JSON.stringify(timingData[key]));
resetData();const data=getData({dir});setSimData(data);setGameData(data);
const {previewHandler}=await import('./ursus-preview-http.mjs');
const preview=await previewHandler(process.cwd(),Number(process.env.URSUS_PORT||3001));
const server=await startServer({dataDir:dir,host:'127.0.0.1',port:Number(process.env.URSUS_PORT||3001),handleRequest:preview.handle});
const url=`http://127.0.0.1:${server.port}/dev/ursus.html`;
console.log(`Local Ursus experiment: ${url}`);
if(process.argv.includes('--open')){const {openBrowser}=await import('./open-browser.mjs');openBrowser(url);}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{preview.close();await server.close();process.exit(0)});
