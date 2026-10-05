// Cache every synchronized resource, including future costumes and audio, across test sessions.
const CACHE='stronghold-ursus-preview-assets-v1';
self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin||event.request.method!=='GET')return;
 const metadata=/^\/(data|i18n)\//.test(url.pathname)||url.pathname==='/vendor/browser-resources.json';
 if(!metadata&&!/^\/(assets|fonts|media)\//.test(url.pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),key=url.pathname+url.search;
  if(metadata){
   try{const response=await fetch(event.request);if(response.ok)await cache.put(key,response.clone());return response;}
   catch(error){const old=await cache.match(key);if(old)return old;throw error;}
  }
  const old=await caches.match(key);if(old)return old;
  const response=await fetch(event.request);if(response.ok)await cache.put(key,response.clone());return response;
 })());
});

let warming=null;
self.addEventListener('message',event=>{
 if(event.data?.type!=='warmPatch')return;
 if(!warming)warming=(async()=>{
  const r=await fetch('/dev/patch-resources.json',{cache:'no-store'});if(!r.ok)return;
  const {paths}=await r.json(),cache=await caches.open(CACHE),queue=paths.filter(p=>/^\/(assets|fonts|media)\//.test(p));
  async function worker(){while(queue.length){const path=queue.shift();if(await caches.match(path))continue;try{const response=await fetch(path);if(response.ok)await cache.put(path,response);}catch{}await new Promise(r=>setTimeout(r,100));}}
  await Promise.all([worker(),worker()]);
 })().finally(()=>{warming=null;});
 event.waitUntil(warming);
});
