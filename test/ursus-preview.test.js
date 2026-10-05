import {test} from 'node:test';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
import {startServer} from '../server/index.js';import {previewHandler} from '../scripts/ursus-preview-http.mjs';import {PROTOCOL_VERSION} from '../shared/constants.js';
test('HTTP preview bridge carries welcome, room creation and match start; duplicate sends are idempotent',async()=>{
 let preview;const server=await startServer({host:'127.0.0.1',port:0,quiet:true,handleRequest:(req,res)=>preview?.handle(req,res)||false});preview=await previewHandler(fileURLToPath(new URL('../',import.meta.url)),server.port);
 const post=async msg=>{const r=await fetch(`http://127.0.0.1:${server.port}/dev/ursus-transport`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(msg)});assert.equal(r.status,200);return r.json()};
 let id;try{({id}=await post({action:'open'}));let ack=0,seq=0;const seen=[];
 for(const msg of [{t:'hello',rid:1,name:'preview',version:PROTOCOL_VERSION},{t:'room.create',rid:2,mode:'solo',difficulty:'NORMAL'},{t:'room.start',rid:3}]){
  const sends=[{seq:++seq,data:JSON.stringify(msg)}];for(let i=0;i<20;i++){const result=await post({id,ack,send:sends});for(const m of result.messages){if(m.seq>ack){ack=m.seq;seen.push(JSON.parse(m.data))}}if(seen.some(m=>m.rid===msg.rid))break;await new Promise(r=>setTimeout(r,10))}
 }
 assert.ok(seen.some(m=>m.t==='welcome'));assert.ok(seen.some(m=>m.t==='m.private'));assert.ok(seen.some(m=>m.t==='m.public'));assert.ok(!seen.some(m=>m.t==='error'));assert.equal(seen.filter(m=>m.rid===2).length,1);
 }finally{if(id)await post({action:'close',id});preview.close();await server.close()}
});
