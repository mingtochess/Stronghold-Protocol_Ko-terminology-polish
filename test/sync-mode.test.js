// test/sync-mode.test.js — 동기화 시뮬레이션: an alliance room (coop / coop8) created with `sync`, listed as such, and its
// match runs with shared HP, no round LP cap and no 联防.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../server/index.js';
import { StubMatch } from '../server/match/StubMatch.js';
import { TestClient } from './helpers/wsClient.js';
import { makeMatch } from './match/harness.js';

test('a sync room: created on coop / coop8 only, says so in its state and in the public list', async () => {
  const server = await startServer({ port: 0, host: '127.0.0.1', quiet: true, dataDir: 'content/production/data', MatchClass: StubMatch });
  let host, viewer;
  try {
    host = await TestClient.connect(`ws://127.0.0.1:${server.port}/ws`); viewer = await TestClient.connect(`ws://127.0.0.1:${server.port}/ws`);
    await host.hello('H'); await viewer.hello('V');
    assert.equal((await host.request({ t: 'room.create', mode: 'solo', sync: true, difficulty: 'NORMAL' })).t, 'error', 'no solo sync room');
    await host.request({ t: 'room.create', mode: 'coop8', sync: true, difficulty: 'NORMAL', isPublic: true });
    const room = await host.waitFor('room.state', (r) => r.mode === 'coop8');
    assert.equal(room.sync, true);
    assert.equal(room.seats.length, 8);
    assert.match(room.title, /동기화/);
    const list = (await viewer.request({ t: 'room.list' })).rooms;
    assert.equal(list.length, 1); assert.equal(list[0].sync, true);
  } finally { host?.terminate(); viewer?.terminate(); await server.close(); }
});

test('a sync match: shared HP on, no round LP cap, no 联防 plan', () => {
  const { m } = makeMatch({ mode: 'coop', sync: true, humans: 2 });
  assert.equal(m.sync, true);
  assert.equal(m.gd.config.customRules?.sharedHp, true);
  assert.ok(m.gd.lpCapPerRound >= 1e9);
  const plain = makeMatch({ mode: 'coop', humans: 2 }).m;
  assert.equal(plain.sync, false);
  assert.equal(plain.gd.lpCapPerRound, 10);
});
