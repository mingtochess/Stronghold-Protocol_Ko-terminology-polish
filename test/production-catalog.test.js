import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
const root=new URL('../content/production/',import.meta.url).pathname;
const read=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
test('prepared production catalogue includes every referenced asset and current local defaults',{skip:!existsSync(join(root,'resources.json'))},()=>{
 const assets=read('data/assets.json'),chess=read('data/chess.json'),bands=read('data/bands.json'),index=read('resources.json');
 const files=new Map(index.files.map(f=>[f.path,f]));assert.equal(files.size,index.files.length);
 const walk=v=>{if(typeof v==='string'&&v.startsWith('/assets/'))assert.ok(files.has(v),`not cached: ${v}`);else if(v&&typeof v==='object')Object.values(v).forEach(walk)};
 walk(assets);walk(read('data/local-assets.json'));
 for(const f of index.files.filter(f=>f.local)){
  assert.deepEqual(f.sources,[f.path]);assert.ok(existsSync(join(root,'assets',f.path.slice('/assets/'.length))),f.path);
 }
 assert.match(bands.band_custom_ursus_kaschey.desc,/^\[영광과 번영\]<우르수스>/);
 assert.equal(bands.band_custom_ursus_kaschey.totalHp,22);
 assert.match(bands.band_custom_ursus_kaschey.desc,/라운드당 최대 1회/);
 for(const [key,skill] of Object.entries({absin:0,turdus:0,botany:0,glassb:1,leto:1,poca:1,helage:1,headb2:1}))for(const suffix of ['a','b'])assert.equal(chess[`chess_custom_ursus_${key}_${suffix}`].skill.index,skill);
 assert.ok(Object.keys(assets.audio.voice.kr).length>100);assert.ok(Object.keys(assets.audio.voice.jp).length>100);
});
