import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
test('future assets are cached automatically; metadata refreshes and falls back offline',async()=>{
 const handlers={},saved=new Map();let calls=0,offline=false;
 const cache={match:async key=>saved.get(key)?.clone(),put:async(key,response)=>saved.set(key,response.clone())};
 const caches={open:async()=>cache,match:cache.match};
 runInNewContext(readFileSync(new URL('../../public/dev/ursus-resource-worker.js',import.meta.url),'utf8'),{
  URL,caches,self:{location:{origin:'https://example.test'},addEventListener:(k,fn)=>handlers[k]=fn},
  fetch:async request=>{calls++;if(offline)throw Error('offline');return new Response(String(calls));}
 });
 const get=async path=>{let promise;handlers.fetch({request:{url:'https://example.test'+path,method:'GET'},respondWith:p=>promise=p});return(await promise).text();};
 assert.equal(await get('/assets/custom/new-skin.png'),'1');
 assert.equal(await get('/assets/custom/new-skin.png'),'1');assert.equal(calls,1);
 assert.equal(await get('/data/assets.json'),'2');assert.equal(await get('/data/assets.json'),'3');
 offline=true;assert.equal(await get('/data/assets.json'),'3');
 assert.equal(await get('/assets/custom/new-skin.png'),'1');
});

test('production background warming serves fonts before completion and fills missing resources from mirrors on demand',async()=>{
 const handlers={},saved=new Map();let release;const slow=new Promise(resolve=>release=resolve);
 const file={path:'/assets/local/map/original/test-v1.json.gz',local:true,sources:['https://raw.githubusercontent.com/example/game/master/map.gz']};
 const index={version:'test',files:[file],fontCss:'@font-face{font-family:test}',estimatedBytes:8};
 const cache={match:async key=>saved.get(typeof key==='string'?key:key.url)?.clone(),put:async(key,response)=>saved.set(key,response.clone()),delete:async key=>saved.delete(key),keys:async()=>[...saved.keys()].map(path=>({url:'https://example.test'+path}))};
 const script=readFileSync(new URL('../../public/resource-worker.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/,'');
 let mirrorCalls=0;
 runInNewContext(script,{URL,Response,TextDecoder,DataView,AbortSignal,caches:{open:async()=>cache,match:cache.match,keys:async()=>['stronghold-resources-test']},self:{location:{origin:'https://example.test'},addEventListener:(k,fn)=>handlers[k]=fn},normalizeAtlas:()=>{throw Error('no atlas expected');},fetch:async request=>{
  const url=typeof request==='string'?request:request.url;
  if(url==='/vendor/browser-resources.json')return new Response(JSON.stringify(index));
  if(url===file.sources[0]){mirrorCalls++;await slow;return new Response(new Uint8Array([1,2,3]));}
  throw Error('Unexpected fetch '+url);
 }});
 const get=async path=>{let p;handlers.fetch({request:{url:'https://example.test'+path,method:'GET'},respondWith:r=>p=r});return p;};
 const received=[];let background;
 handlers.message({data:{type:'preparePatch'},ports:[{postMessage:m=>received.push(m)}],waitUntil:p=>background=p});
 await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(await(await get('/fonts/fonts.css')).text(),index.fontCss,'fonts usable while optional map is still downloading');
 assert.equal(received.some(m=>m.type==='ready'),false);
 const foreground=get(file.path);
 await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(mirrorCalls,1,'on-demand and background requests share the same download');
 release();await background;await foreground;
 assert.ok(received.some(m=>m.type==='ready'));
 const before=mirrorCalls;assert.deepEqual([...new Uint8Array(await(await get(file.path)).arrayBuffer())],[1,2,3]);assert.equal(mirrorCalls,before,'completed file served from cache');
 saved.delete(file.path);assert.deepEqual([...new Uint8Array(await(await get(file.path)).arrayBuffer())],[1,2,3],'a missing requested file is fetched from its configured mirror');
});
