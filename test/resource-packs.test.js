import{test}from'node:test';import assert from'node:assert/strict';import{mkdtemp,mkdir,writeFile,readFile,rm}from'node:fs/promises';import{tmpdir}from'node:os';import{join}from'node:path';import{createHash}from'node:crypto';
import{resolveResourcePacks,installResourcePacks,packBases,preservesIndex}from'../tools/resource-packs.mjs';import{applyOrigin}from'../tools/resource-origin.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),commit='a'.repeat(40);
async function fixture(run){const root=await mkdtemp(join(tmpdir(),'resource-packs-'));try{await run(root);}finally{await rm(root,{recursive:true,force:true});}}
test('a pinned addition changes only its own source URLs and preserves the base pack',()=>fixture(async root=>{const f={path:'/assets/local/new#1.mp3',bytes:3,sha256:sha('new')};await writeFile(join(root,'pack.json'),JSON.stringify({files:[f]}));const config={baseUrls:['https://raw.githubusercontent.com/o/base/'+'b'.repeat(40)+'/public'],packs:[{name:'new',repository:'o/assets',commit,manifest:'pack.json'}]};const packs=await resolveResourcePacks(root,config),input={files:[{...f,local:true},{path:'/assets/old',local:true},{path:'/assets/upstream',sources:['https://upstream.invalid/a']}]},out=applyOrigin(input,{...config,resolvedPacks:packs});assert.match(out.files[0].sources[0],/o\/assets\/a{40}\/public\/assets\/local\/new%231.mp3$/);assert.equal(out.files[1].sources[0],config.baseUrls[0]+'/assets/old');assert.deepEqual(out.files[2],input.files[2]);assert.equal(input.files[0].sources,undefined);assert.throws(()=>packBases({repository:'o/r',commit:'main'}));}));
test('verified assets install from the pinned origin and reuse the local cache',()=>fixture(async root=>{const bytes=Buffer.from('payload'),f={path:'/assets/local/new.mp3',bytes:bytes.length,sha256:sha(bytes)},pack={bases:['https://raw.githubusercontent.com/o/r/'+commit+'/public'],files:[f]};let downloads=0;await installResourcePacks(root,[pack],{fetcher:async url=>{downloads++;assert.match(url,/a{40}/);return{ok:true,arrayBuffer:async()=>bytes};}});assert.equal(await readFile(join(root,'public/assets/local/new.mp3'),'utf8'),'payload');await installResourcePacks(root,[pack],{fetcher:()=>{throw Error('must not fetch');}});assert.equal(downloads,1);}));
test('checksum failures leave the installed tree unchanged',()=>fixture(async root=>{const f={path:'/assets/a.mp3',bytes:3,sha256:sha('new')};await assert.rejects(installResourcePacks(root,[{bases:['https://example.invalid'],files:[f]}],{fetcher:async()=>({ok:true,arrayBuffer:async()=>Buffer.from('bad')})}),/download failed/i);await assert.rejects(readFile(join(root,'public/assets/a.mp3')),/ENOENT/);}));
test('canonical indexes may add keys but cannot overwrite an existing effect',()=>fixture(async root=>{const file='/assets/local/fx/index.json',before={prefabs:{base:{x:1}}},after={prefabs:{base:{x:1},new:{x:2}}},bytes=Buffer.from(JSON.stringify(after)),f={path:file,bytes:bytes.length,sha256:sha(bytes)},source=join(root,'source');await mkdir(join(root,'public/assets/local/fx'),{recursive:true});await writeFile(join(root,'public',file),JSON.stringify(before));await mkdir(join(source,'assets/local/fx'),{recursive:true});await writeFile(join(source,file),bytes);await installResourcePacks(root,[{files:[f]}],{sourceRoot:source});assert.deepEqual(JSON.parse(await readFile(join(root,'public',file))),after);const bad=Buffer.from(JSON.stringify({prefabs:{base:{x:99}}}));await writeFile(join(source,file),bad);await assert.rejects(installResourcePacks(root,[{files:[{...f,bytes:bad.length,sha256:sha(bad)}]}],{sourceRoot:source}),/complete merged index/);assert.deepEqual(JSON.parse(await readFile(join(root,'public',file))),after);}));

test('build hydration adds a pack after costume merging and registers canonical checksums',()=>fixture(async root=>{
 const {installHostedResources}=await import('../tools/install-hosted-resources.mjs');
 const base=join(root,'base'),source=join(root,'pack'),put=async(p,d)=>{await mkdir(join(p,'..'),{recursive:true});await writeFile(p,JSON.stringify(d));};
 const index={units:{},projectiles:{},skills:{},skins:{existing:{points:{HeadPoint:{all:{pos:[0,1,0]}}}}},costumes:{},prefabs:{base:{}}},next={...index,skins:{existing:{...index.skins.existing, mountBindings:{s0:{front:'HeadPoint'}},points:{HeadPoint:{...index.skins.existing.points.HeadPoint,front:{pos:[0,1,0]}}}}},prefabs:{base:{},new:{}}},textures={textures:{}};
 await put(join(root,'public/assets/local/fx/index.json'),index);await put(join(root,'public/assets/local/fx/textures.json'),textures);
 await put(join(root,'data/local-fx.json'),{groups:{fx:{index:{},textures:{}}}});await put(join(root,'public/vendor/browser-resources.json'),{files:[]});
 await put(join(base,'inventory.json'),{files:0,bytes:0,inventory:[]});await mkdir(join(base,'public/assets/local/fx'),{recursive:true});await put(join(base,'metadata/costume-supplement.json'),{...index,textures:{},groups:{},files:[]});
 const bytes=Buffer.from(JSON.stringify(next)),f={path:'/assets/local/fx/index.json',bytes:bytes.length,sha256:sha(bytes)};await put(join(source,f.path),next);await put(join(root,'pack.json'),{files:[f]});await put(join(root,'origin.json'),{repository:'o/base',commit:'b'.repeat(40),packs:[{name:'new',repository:'o/assets',commit,manifest:'pack.json'}]});
 const report=await installHostedResources(root,join(root,'origin.json'),base,{packSourceRoot:source});assert.equal(report.packResources,1);
 assert.deepEqual(JSON.parse(await readFile(join(root,'public/assets/local/fx/index.json'))),next);
 const catalog=JSON.parse(await readFile(join(root,'public/vendor/browser-resources.json')));assert.equal(catalog.files.find(e=>e.path===f.path).sha256,f.sha256);
}));

test('pack manifests cannot write outside the assets directory',()=>fixture(async root=>{const f={path:'/assets/../outside.txt',bytes:0,sha256:sha('')};await writeFile(join(root,'pack.json'),JSON.stringify({files:[f]}));await assert.rejects(resolveResourcePacks(root,{packs:[{name:'bad',repository:'o/r',commit,manifest:'pack.json'}]}),/Unsafe asset path/);}));

test('canonical FX indexes allow nested mount aliases while retaining every existing value',()=>{
 const before={version:1,skins:{existing:{points:{HeadPoint:{all:{pos:[0,1,0]}}}}}};
 const after={version:1,skins:{existing:{points:{HeadPoint:{all:{pos:[0,1,0]},front:{pos:[0,1,0]}},Special0:{front:{bone:'weapon'}}},mountBindings:{s0:{front:'Special0'}}}}};
 assert.equal(preservesIndex(before,after),true);
 const changed=structuredClone(after);changed.skins.existing.points.HeadPoint.all.pos[1]=2;
 assert.equal(preservesIndex(before,changed),false);
 const missing=structuredClone(after);delete missing.skins.existing.points.HeadPoint.all;
 assert.equal(preservesIndex(before,missing),false);
 assert.equal(preservesIndex({...before,version:2},after),false);
 assert.equal(preservesIndex({units:{present:null}},{units:{}}),false);
});
