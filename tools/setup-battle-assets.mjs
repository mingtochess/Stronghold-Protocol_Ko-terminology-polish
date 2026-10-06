// Optional official board/audio assets for the local experiment. Downloads are cached.
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const run=(cmd,args)=>new Promise((resolve,reject)=>{
 const p=spawn(cmd,args,{cwd:root,stdio:'inherit',env:process.env});
 p.on('error',reject);p.on('exit',code=>code===0?resolve():reject(Error(`${cmd} exited ${code}`)));
});
if(!process.argv.includes('--finish-only')){
 const venv=join(root,'.cache/battle-extract-venv'),python=join(venv,process.platform==='win32'?'Scripts/python.exe':'bin/python');
 if(!existsSync(python))await run('python3',['-m','venv',venv]);
 await run(python,['-m','pip','install','--cache-dir',join(root,'.cache/pip'),'-r','tools/local-extract/requirements.txt']);
 await run('python3',['tools/fetch-battle-bundles.py',...(process.argv.includes('--enemy-spines')?['--enemy-spines']:[])]);
 await run(python,['tools/local-extract/extract.py','--game','.cache/battle-bundles','--manifest','.cache/ursus-local-assets.json','--only','map','--only','mesh','--only','projectiles','--only','battle/projectiles','--only','battle/dedicated',...(process.argv.includes('--enemy-spines')?['--only','spine/enemy']:[])]);
 await run(process.execPath,['tools/fetch-battle-audio.mjs']);
 await run('python3',['tools/fetch-original-map-bundles.py']);
 await run(python,['tools/local-extract/extract-original-maps.py']);
}
await run(join(root,'.cache/battle-extract-venv',process.platform==='win32'?'Scripts/python.exe':'bin/python'),['tools/local-extract/bake-dedicated.py']);
const manifest=JSON.parse(await readFile(join(root,'.cache/ursus-local-assets.json'),'utf8'));
const tiles='/assets/local/map/autochess/tiles.json';
await run(process.execPath,['tools/crop-board-atlas.mjs']);
manifest.groups['battle/dedicated/chen3'] ||= {};
manifest.groups['battle/dedicated/chen3'].chenDragon={path:'/assets/local/battle/dedicated/chen3/chenDragon.png',kind:'derived-original-mesh'};
manifest.groups['map/autochess'].tiles={path:tiles,kind:'derived-uv-table'};
manifest.provenance=JSON.parse(await readFile(join(root,'.cache/battle-bundles/source.json'),'utf8'));
manifest.count=Object.values(manifest.groups).reduce((sum,group)=>sum+Object.keys(group).length,0);
await writeFile(join(root,'.cache/ursus-local-assets.json'),JSON.stringify(manifest));
await mkdir(join(root,'.cache/ursus-data'),{recursive:true});
await writeFile(join(root,'.cache/ursus-data/local-assets.json'),JSON.stringify(manifest));
console.log(`Official board ready: ${manifest.count} manifest entries. Restart npm run dev:ursus.`);
