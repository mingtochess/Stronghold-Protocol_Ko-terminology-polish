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
    assert.equal((await guest.waitFor('m.chat')).text,'진영 선택: 염국');
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
    await ok(resumed,{t:'room.leave'});
    assert.equal((await resumed.request({t:'g.chat',text:'left'})).code,'NOT_IN_ROOM');
  } finally {for(const c of clients) await c.terminate();await server.close();}
});
