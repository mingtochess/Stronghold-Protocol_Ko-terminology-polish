import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../server/index.js';
import { TestClient } from './helpers/wsClient.js';

test('room chat stays private and survives waiting, game, results and reconnect', {timeout:20000}, async () => {
  let now=10000;
  const server=await startServer({port:0,host:'127.0.0.1',quiet:true});
  server.lobby.now=()=>now;
  const clients=[];
  const connect=async(name,token)=>{
    const c=await TestClient.connect(`ws://127.0.0.1:${server.port}/ws`);clients.push(c);
    const w=await c.hello(name,token);c.id=w.playerId;c.token=w.token;return c;
  };
  const ok=async(c,msg)=>assert.equal((await c.request(msg)).t,'ok');
  try {
    const host=await connect('Host');const guest=await connect('Guest');const outsider=await connect('Other');
    await ok(host,{t:'room.create',mode:'coop',difficulty:'NORMAL'});
    const code=(await host.waitFor('room.state')).code;
    await ok(guest,{t:'room.join',code});
    await ok(outsider,{t:'room.create',mode:'coop',difficulty:'NORMAL'});
    await ok(host,{t:'g.chatFaction',faction:'염국'});
    const selected=await guest.waitFor('m.chat');
    assert.equal(selected.text,'진영 선택: 염국');
    assert.equal(selected.kind,'faction');
    await ok(host,{t:'g.chat',text:'대기실 대화',name:'Forged'});
    const waiting=await guest.waitFor('m.chat');assert.equal(waiting.name,'Host');
    assert.equal(waiting.faction,'염국');
    assert.equal((await host.request({t:'g.chat',text:'spam'})).code,'RATE');
    await ok(guest,{t:'room.ready',ready:true});await ok(host,{t:'room.start'});
    now+=1100;
    await ok(host,{t:'g.chat',text:'게임 중 대화'});
    const room=server.lobby.rooms.get(code);
    room.match.finish({victory:true,reason:'victory'});
    now+=1100;
    await ok(host,{t:'g.chat',text:'결과창 대화'});
    assert.equal(room.chatHistory.length,4);
    assert.equal(outsider.log.filter(m=>m.t==='m.chat').length,0);
    await host.terminate();
    const resumed=await connect('Host',host.token);
    const history=await resumed.waitFor('m.chatHistory',m=>m.messages.length===4);
    assert.equal(history.faction,'염국');
    assert.deepEqual(history.messages.map(m=>m.text),['진영 선택: 염국','대기실 대화','게임 중 대화','결과창 대화']);
    now+=1100;
    await ok(resumed,{t:'g.chatFaction',faction:null});
    const cleared=await guest.waitFor('m.chat',m=>m.text==='진영 선택 취소');
    assert.equal(cleared.faction,null);
    assert.equal(cleared.kind,'faction');
    await ok(resumed,{t:'g.chat',text:'진영 선택 취소',kind:'faction'});
    const ordinary=await guest.waitFor('m.chat',m=>m.kind==='text'&&m.text==='진영 선택 취소');
    assert.equal(ordinary.faction,null);
    assert.equal(ordinary.kind,'text');
    await ok(resumed,{t:'room.leave'});
    assert.equal((await resumed.request({t:'g.chat',text:'left'})).code,'NOT_IN_ROOM');
  } finally {for(const c of clients) await c.terminate();await server.close();}
});

test('spectators can chat with authoritative grey-label role through game and reconnect',{timeout:20000},async()=>{
 const server=await startServer({port:0,host:'127.0.0.1',quiet:true});let now=10000;server.lobby.now=()=>now;
 const clients=[];const connect=async(name,token)=>{const c=await TestClient.connect(`ws://127.0.0.1:${server.port}/ws`);clients.push(c);const w=await c.hello(name,token);c.token=w.token;return c;};
 const ok=async(c,msg)=>assert.equal((await c.request(msg)).t,'ok');
 try{
  const host=await connect('Host'),viewer=await connect('Viewer');
  await ok(host,{t:'room.create',mode:'coop',difficulty:'NORMAL'});const code=(await host.waitFor('room.state')).code;
  await ok(host,{t:'g.chat',text:'earlier',spectator:true});
  await ok(viewer,{t:'room.spectate',code});
  assert.equal((await viewer.waitFor('m.chatHistory',m=>m.messages.length===1)).messages[0].spectator,false);
  await ok(viewer,{t:'g.chat',text:'관전자 채팅',name:'Forged',spectator:false});
  const received=await host.waitFor('m.chat',m=>m.text==='관전자 채팅');assert.equal(received.name,'Viewer');assert.equal(received.spectator,true);
  await ok(host,{t:'room.start'});now+=1100;await ok(viewer,{t:'g.chat',text:'전투 관전'});
  assert.equal((await viewer.request({t:'g.refresh'})).code,'SPECTATOR');
  await viewer.terminate();const resumed=await connect('Viewer',viewer.token);
  assert.equal((await resumed.waitFor('m.chatHistory',m=>m.messages.length===3)).messages[2].spectator,true);
  await ok(resumed,{t:'room.leave'});assert.equal((await resumed.request({t:'g.chat',text:'left'})).code,'NOT_IN_ROOM');
 }finally{for(const c of clients)await c.terminate();await server.close();}
});
