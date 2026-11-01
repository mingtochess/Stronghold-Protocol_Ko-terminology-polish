import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolveResourcePacks,packedSources} from '../../tools/resource-packs.mjs';
import {applyOrigin} from '../../tools/resource-origin.mjs';
const root=new URL('../../',import.meta.url);
const read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
test('new recruit catalog verifies local metadata and immutable hosted payload connections',async()=>{
 const patch=await read('content/custom/northern/assets.json'),manifest=await read('content/production/resources.json');
 const config=await read('content/custom/resource-origin.json'),packs=await resolveResourcePacks(root.pathname,config),catalog=new Map(applyOrigin(manifest,{...config,resolvedPacks:packs}).files.map(f=>[f.path,f])),hosted=new Map(packs.flatMap(p=>p.files.map(f=>[f.path,p])));
 for(const row of patch.files){try{const bytes=await readFile(new URL('content/production'+row.path,root));assert.equal(bytes.length,row.bytes,row.path);assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256,row.path);}catch(error){if(error.code!=='ENOENT')throw error;assert.ok(hosted.has(row.path),row.path);assert.deepEqual(catalog.get(row.path)?.sources,packedSources(hosted.get(row.path),row.path));}assert.equal(catalog.get(row.path)?.sha256,row.sha256,row.path);}
});
test('all three recruits have front/back animation metadata and three distinct skill sound connections',async()=>{
 const assets=await read('content/production/data/assets.json');
 for(const cid of ['char_4247_oxi','char_4246_dminon','char_4244_tocka']){
  for(const facing of ['front','back']){const spine=assets.chars[cid].spine[facing];assert.ok(spine.skel);assert.ok(spine.atlas);assert.ok(Object.keys(spine.animations).length);assert.ok(spine.hits);}
  const sounds=assets.audio.sfx.units[cid].skills;assert.ok(sounds);assert.equal(new Set(Object.values(sounds).map(x=>JSON.stringify(x))).size,3,cid);
 }
});
