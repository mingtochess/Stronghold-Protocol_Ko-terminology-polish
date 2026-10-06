import {test} from 'node:test';import assert from 'node:assert/strict';
import {startServer} from '../server/index.js';import {StubMatch} from '../server/match/StubMatch.js';import {TestClient} from './helpers/wsClient.js';
test('host extension selection reaches the match and preserves both participants loadouts',async()=>{
 class Recording extends StubMatch {constructor(o){super(o);Recording.opts=o;}}
 const srv=await startServer({port:0,host:'127.0.0.1',MatchClass:Recording,log:{info(){},warn(){},error(){}}});let host,guest;
 const ok=async(c,m)=>assert.equal((await c.request(m)).t,'ok');
 try {
  host=await TestClient.connect(`ws://127.0.0.1:${srv.port}/ws`);await host.hello('Host');
  guest=await TestClient.connect(`ws://127.0.0.1:${srv.port}/ws`);await guest.hello('Guest');
  const prefs={chess_char_1_01_a:{skill:0,module:'none'}};
  await ok(host,{t:'room.loadout',entries:prefs});await ok(guest,{t:'room.loadout',entries:prefs});
  await ok(host,{t:'room.create',mode:'coop',difficulty:'NORMAL'});const room=await host.waitFor('room.state');
  await ok(guest,{t:'room.join',code:room.code});
  assert.equal((await guest.request({t:'room.setCustomExtensions',selection:{bonds:['ursus'],stages:[]}})).code,'NOT_HOST');
  for(const bonds of [['ursus'],[],['ursus']]) await ok(host,{t:'room.setCustomExtensions',selection:{bonds,stages:[]}});
  assert.equal((await host.request({t:'room.setCustomExtensions',selection:{stages:['custom_nonexistent']}})).t,'error');
  await ok(guest,{t:'room.ready',ready:true});await ok(host,{t:'room.start'});
  assert.deepEqual(Recording.opts.customExtensions,{bonds:['ursus'],stages:[]});
  for(const seat of Recording.opts.seats.filter(s=>s&&!s.isBot)) assert.deepEqual(seat.loadout,prefs);
 } finally {await host?.terminate();await guest?.terminate();await srv.close();}
});
