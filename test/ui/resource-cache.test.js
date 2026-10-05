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
