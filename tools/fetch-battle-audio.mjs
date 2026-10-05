// Official bank names, taken from audio_data.json. Stable files are reused by Downloader.
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {indexAudio} from './assets/audio.mjs';
import {Downloader} from './assets/downloader.mjs';
import {RAW} from './assets/sources.mjs';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const raw=JSON.parse(await readFile(join(root,'.cache/gamedata/excel/audio_data.json'),'utf8'));
const index=indexAudio(raw),manifest=JSON.parse(await readFile(join(root,'data/assets.json'),'utf8'));
const dl=new Downloader({root:join(root,'public/assets'),ledgerPath:join(root,'.cache/battle-audio-ledger.json'),concurrency:4,retries:2});
await dl.loadLedger();const jobs=[];
const sound=path=>{const rel=`audio/${path}`;jobs.push({rel,urls:[RAW.aa2voice+path],kind:'binary'});return `/assets/${rel}`};
const bank=name=>{const path=index.bank(name)[0];if(!path)throw Error(`Missing official bank: ${name}`);return sound(path)};
const bgm=name=>{const track=index.bgm(name);if(!track)throw Error(`Missing official BGM: ${name}`);return {intro:track.intro?sound(track.intro):null,loop:sound(track.loop)}};
manifest.audio.bgm.unite=bgm('battle.ON_GAME_READY.corrosion');
manifest.audio.bgm.combatAlts=['bat_kazimierz2_1','bat_kazimierz2_2'].map(name=>bgm(`battle.ON_GAME_READY.${name}`));
Object.assign(manifest.audio.sfx.battle,{
 droneAim:bank('battle.ON_ABILITY_END.enemy_1112_emppnt.attack'),
 droneCast:bank('battle.ON_ABILITY_HIT.enemy_1112_emppnt.attack'),
 droneImpact:bank('battle.ON_PROJECTILE_HIT.projectile_enemy_emppnt'),
});
const result=await dl.run(jobs,'Official battle music and drone sounds');
for(const [path,item] of result)if(item.status==='miss'||item.status==='error')throw Error(`Failed official audio: ${path}`);
await writeFile(join(root,'data/assets.json'),JSON.stringify(manifest));
console.log(`Official audio installed (${jobs.length} files); manifest updated.`);
