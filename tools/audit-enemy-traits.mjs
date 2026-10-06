// Inventory every current enemy's handbook lines and its installed runtime handlers.
// This is routing evidence, not a claim that every timing/value has been independently verified against the original.
import fs from 'node:fs';
import {makeBattle} from '../test/helpers/battleHarness.js';
import * as enemies from '../server/sim/content/enemies.js';
import * as bosses from '../server/sim/content/bosses.js';
const data=JSON.parse(fs.readFileSync(new URL('../data/enemies.json',import.meta.url)));
const rows=[];
for(const [key,rec] of Object.entries(data)){
 const h=makeBattle({content:'generic',extraContent:[enemies,bosses],autoFinish:false});h.step();
 const e=h.spawn(key,{pos:[10,7],mods:{speedMul:0}});h.run(.2);
 rows.push({key,name:rec.name,abilities:rec.abilities.map(x=>x.text),route:enemies.KITS[key]?'enemy kit':bosses.BOSS_KITS[key]?'boss kit':'engine/context only',context:enemies.STATS_ONLY[key]||null,handlers:[...new Set((e.mem.ab?.list||[]).flatMap(a=>Object.keys(a).filter(k=>typeof a[k]==='function')))],errors:h.b.errorCount});
}
const out=new URL('../docs/LOCAL-ENEMY-TRAITS-AUDIT.json',import.meta.url);fs.writeFileSync(out,JSON.stringify({date:'2026-10-06',scope:'249 local enemies; spawn/tick routing, not full original-game equivalence',enemies:rows},null,2)+'\n');
const errors=rows.filter(r=>r.errors);console.log(JSON.stringify({enemies:rows.length,abilityLines:rows.reduce((n,r)=>n+r.abilities.length,0),errors,contextOnly:rows.filter(r=>r.context&&r.abilities.length).length}));if(errors.length)process.exitCode=1;
