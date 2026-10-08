import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../server/index.js';
import { StubMatch } from '../server/match/StubMatch.js';
import { TestClient } from './helpers/wsClient.js';

test('reroll replaces only the match, preserves room readiness, and consumes a shared allowance', async () => {
  const instances = [];
  class Recording extends StubMatch {
    constructor(opts) {
      if (Recording.fail) throw new Error('injected construction failure');
      super(opts); this.opts = opts; instances.push(this);
    }
  }
  const srv = await startServer({ port: 0, host: '127.0.0.1', MatchClass: Recording, log: { info() {}, warn() {}, error() {} } });
  let host, guest;
  const ok = async (c, msg) => assert.equal((await c.request(msg)).t, 'ok');
  try {
    host = await TestClient.connect(`ws://127.0.0.1:${srv.port}/ws`); await host.hello('Host');
    guest = await TestClient.connect(`ws://127.0.0.1:${srv.port}/ws`); await guest.hello('Guest');
    await ok(host, { t: 'room.create', mode: 'coop', difficulty: 'NORMAL' });
    const state = await host.waitFor('room.state');
    await ok(guest, { t: 'room.join', code: state.code });
    assert.equal((await guest.request({ t: 'room.setRerollLimit', limit: 3 })).code, 'NOT_HOST');
    assert.equal((await host.request({ t: 'room.setRerollLimit', limit: 2 })).code, 'BAD_MSG');
    await ok(host, { t: 'room.setRerollLimit', limit: 1 });
    await ok(host, { t: 'room.addBot' });
    await ok(guest, { t: 'room.ready', ready: true });
    await ok(host, { t: 'room.start' });
    const room = srv.lobby.rooms.get(state.code);
    const before = room.seats.map(s => s && { ...s });
    await ok(guest, { t: 'g.infoReady', matchNo: 1 });
    assert.equal((await guest.request({ t: 'room.reroll', matchNo: 1 })).code, 'NOT_HOST');
    Recording.fail = true;
    assert.equal((await host.request({ t: 'room.reroll', matchNo: 1 })).code, 'INTERNAL');
    assert.equal(room.match, instances[0]);
    assert.equal(instances[0].disposed, false);
    assert.equal(room.rerollsUsed, 0);
    Recording.fail = false;
    await ok(host, { t: 'room.reroll', matchNo: 1 });
    assert.equal(instances.length, 2);
    assert.equal(instances[0].disposed, true);
    assert.equal(room.match, instances[1]);
    assert.deepEqual(room.seats, before);
    assert.deepEqual(instances[1].opts.seats, instances[0].opts.seats);
    assert.equal(room.matchCount, 2);
    assert.equal(room.rerollsUsed, 1);
    assert.equal(instances[1].players.get(guest.playerId)?.ready ?? [...instances[1].players.values()].find(p => p.name === 'Guest').ready, false);
    assert.equal((await host.request({ t: 'room.reroll', matchNo: 1 })).code, 'BAD_TARGET');
    assert.equal((await guest.request({ t: 'g.infoReady', matchNo: 1 })).code, 'BAD_TARGET');
    assert.equal((await host.request({ t: 'room.reroll', matchNo: 2 })).t, 'error');
    assert.equal((await host.request({ t: 'room.setRerollLimit', limit: -1 })).code, 'ROOM_STARTED');
    await ok(guest, { t: 'g.infoReady', matchNo: 2 });
    await ok(host, { t: 'g.infoReady', matchNo: 2 });
    await host.waitFor('room.state', r => !r.inMatch && r.matchNo === 2);
    assert.equal((await host.request({ t: 'room.reroll', matchNo: 2 })).code, 'WRONG_PHASE');
    await ok(guest, { t: 'room.ready', ready: true });
    await ok(host, { t: 'room.start' });
    assert.equal(room.rerollsUsed, 0);
  } finally { await host?.terminate(); await guest?.terminate(); await srv.close(); }
});

test('real solo matches reroll with fresh seeds, no deadline, and unlimited allowance', async () => {
  const srv = await startServer({ port: 0, host: '127.0.0.1', heavyBurst: 30, log: { info() {}, warn() {}, error() {} } });
  let host;
  try {
    host = await TestClient.connect(`ws://127.0.0.1:${srv.port}/ws`); await host.hello('Host');
    assert.equal((await host.request({ t: 'room.create', mode: 'solo', difficulty: 'HARD' })).t, 'ok');
    const state = await host.waitFor('room.state');
    assert.equal((await host.request({ t: 'room.start' })).t, 'ok');
    const room = srv.lobby.rooms.get(state.code);
    assert.equal((await host.request({ t: 'room.reroll', matchNo: 1 })).t, 'error');
    // Set up an unlimited allowance directly to exercise the real engine without ending a solo run.
    room.rerollLimit = -1;
    for (let n = 1; n <= 7; n++) {
      const old = room.match;
      assert.equal((await host.request({ t: 'room.reroll', matchNo: n })).t, 'ok');
      assert.equal(old.disposed, true);
      assert.notEqual(room.match.seed, old.seed);
      assert.equal(room.match.phase, 'INFO_CHECK');
      assert.equal(room.match.deadline, 0);
      assert.equal(room.rerollsUsed, n);
      assert.equal(room.match.order.find(p => !p.isBot).infoReady, false);
    }
    room.match.enterBandDraft();
    assert.equal((await host.request({ t: 'room.reroll', matchNo: 8 })).code, 'WRONG_PHASE');
  } finally { await host?.terminate(); await srv.close(); }
});
