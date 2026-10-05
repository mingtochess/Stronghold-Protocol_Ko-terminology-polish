// Official voice slots and language availability; preview streams files through its persistent cache.
import {readFile,writeFile} from 'node:fs/promises';
import {indexVoice,VOICE_BATTLE_SLOTS,VOICE_DIRS} from './assets/audio.mjs';
import {RAW} from './assets/sources.mjs';
const tablePath='.cache/gamedata/excel/charword_table.json';
const table=JSON.parse(await readFile(tablePath,'utf8').then(async b=>{if(!process.argv.includes('--refresh'))return b;throw Error('Refresh requested')}).catch(async()=>{const r=await fetch('https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/zh_CN/gamedata/excel/charword_table.json');if(!r.ok)throw Error('Voice table unavailable');const b=await r.text();await writeFile(tablePath,b);return b}));
const ukusikKR=await fetch(RAW.aa2voice+'voice_kr/char_4224_turdus/cn_019.mp3',{method:'HEAD',signal:AbortSignal.timeout(5000)}).then(r=>r.ok).catch(()=>false);
const records=JSON.parse(await readFile('.cache/ursus-data/chess.json','utf8'));
const manifest=JSON.parse(await readFile('.cache/ursus-data/assets.json','utf8'));
const index=indexVoice(table,'CN',VOICE_BATTLE_SLOTS),ids=new Set(Object.values(records).map(c=>c.charId).filter(Boolean));
const files=[],voice={kr:{},jp:{}};
for(const lang of ['kr','jp'])for(const id of ids){
 const slots=index.get(id);if(!slots)continue;
 const available=table.voiceLangDict?.[id]?.dict;
 const actual=lang==='kr'&&(available?.KR||(id==='char_4224_turdus'&&ukusikKR))?'kr':'jp';
 voice[lang][id]=Object.fromEntries(Object.entries(slots).map(([slot,lines])=>[slot,lines.map(asset=>{
  const sub=`${VOICE_DIRS[actual]}/${asset.toLowerCase()}.mp3`,path=`/assets/audio/voice/${sub}`;
  files.push({path,sources:[RAW.aa2voice+sub]});return path;
 })]));
}
manifest.audio.voice=voice;
manifest.audio.voiceConditions=Object.fromEntries([...ids].map(id=>[id,Object.fromEntries(Object.values(records).filter(c=>c.charId===id).flatMap(c=>(c.skills||[c.skill]).filter(Boolean).map(sk=>[sk.index,{passive:sk.skillType!=='MANUAL',spCost:sk.spCost}])))]));
await writeFile('.cache/ursus-data/assets.json',JSON.stringify(manifest));
await writeFile('.cache/ursus-voice-resources.json',JSON.stringify({files:[...new Map(files.map(f=>[f.path,f])).values()]}));
console.log(`Official KR/JP voices indexed for ${Object.keys(voice.jp).length} operators; files cached on first playback.`);
