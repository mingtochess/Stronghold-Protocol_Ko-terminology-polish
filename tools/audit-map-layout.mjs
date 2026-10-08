// Read-only comparison with the original level JSON files in .cache/map-layout-audit.
import {readFile,writeFile} from 'node:fs/promises';
const stages=JSON.parse(await readFile('.cache/ursus-data/stages.json','utf8')),report=[];
for(const [id,s]of Object.entries(stages)){
 const lv=JSON.parse(await readFile(`.cache/map-layout-audit/${id}.json`,'utf8')),differences=[];
 let tiles=0;
 for(let r=0;r<s.rows.length;r++)for(let c=0;c<s.rows[r].length;c++){
  const native=lv.mapData.tiles[lv.mapData.map[s.rows.length-1-r][c]],current=s.tiles[s.rows[r][c]];
  tiles++;
  if(native.tileKey!==current.tileKey || (native.heightType==='HIGHLAND'?'HIGH':'LOW')!==current.height)differences.push({type:'tile',r,c,native: native.tileKey,current:current.tileKey});
 }
 const original=(lv.predefines.tokenInsts||[]).map(t=>[t.inst.characterKey,t.position.row,t.position.col,t.direction,!!t.hidden]);
 const current=(s.devices||[]).map(t=>[t.key,...t.pos,t.dir,!!t.hidden]);
 if(JSON.stringify(original)!==JSON.stringify(current))differences.push({type:'device-list',original,current});
 report.push({id,tiles,devices:original.length,differences});
}
await writeFile('docs/ORIGINAL-MAP-LAYOUT-AUDIT.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({maps:report.length,tiles:report.reduce((n,r)=>n+r.tiles,0),devices:report.reduce((n,r)=>n+r.devices,0),differences:report.filter(r=>r.differences.length)}));
if(report.some(r=>r.differences.length))process.exitCode=1;
