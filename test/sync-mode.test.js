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

test('sync round spawns: the same keyed list on every field, HP × living players (bounties +0.5 each)', async (t) => {
  const { buildNormalWave } = await import('../server/match/waves.js');
  const { syncHpFactor } = await import('../server/match/sync.js');
  const h = makeMatch({ mode: 'coop', sync: true, humans: 3, fake: true });
  t.after(() => h.m.dispose());
  const m = h.m;
  m.round = 3; m.wave = buildNormalWave(m.gd, m.rngWaves, m.factions, 3);
  const base = m.wave.spawns.filter((s) => s.tag !== 'boss' && s.tag !== 'part');
  const [a, b] = [m._normalOpts(m.order[0]), m._normalOpts(m.order[1])];
  assert.equal(a.sync, true);
  assert.deepEqual(a.spawns.map((s) => s.syncKey), b.spawns.map((s) => s.syncKey));
  assert.ok(a.spawns.every((s) => /^s\d+$/.test(s.syncKey)));
  const hp0 = base[0].mods?.hpMul ?? 1;
  assert.ok(Math.abs(a.spawns[0].mods.hpMul - hp0 * 3) < 1e-9);
  assert.equal(syncHpFactor(2, true), 1.5);
  assert.equal(syncHpFactor(3, true), 2);
  assert.equal(syncHpFactor(4, false), 4);
});

test('sync settlement: a leak costs the team once, and nothing when the enemy died on another field', async (t) => {
  const { syncRound, syncCredit, syncNoteLeaks, syncLeakLoss } = await import('../server/match/sync.js');
  const { buildNormalWave } = await import('../server/match/waves.js');
  const h = makeMatch({ mode: 'coop', sync: true, humans: 2, fake: true });
  t.after(() => h.m.dispose());
  const m = h.m;
  m.round = 3; m.wave = buildNormalWave(m.gd, m.rngWaves, m.factions, 3);
  syncRound(m);
  syncNoteLeaks(m, [{ key: 's0.0', lpr: 1 }, { key: 's0.0', lpr: 1 }, { key: 's1.0', lpr: 2 }]);
  assert.equal(syncLeakLoss(m), 3);
  syncCredit(m, 'n:b', { 's1.0': 500 }, { 's1.0': 500 }, []);
  assert.equal(syncLeakLoss(m), 1);
});

for (const clientCombat of [false, true]) test(`a sync match of bots runs its normal rounds without errors (${clientCombat ? 'client combat: paced server fields' : 'server combat'})`, async () => {
  const { PHASE } = await import('../shared/constants.js');
  const seats = [0, 1, 2, 3].map((i) => ({ seat: i, playerId: `ai_${i}`, name: `AI${i}`, isBot: true, connected: true }));
  const h = makeMatch({ mode: 'coop', difficulty: 'NORMAL', sync: true, seats, seed: 21, clientCombat });
  const m = h.m;
  let synced = 0;
  const orig = m._normalOpts.bind(m);
  m._normalOpts = (...a) => { const o = orig(...a); if (o.spawns.some((s) => s.syncKey)) synced++; return o; };
  h.start();
  h.run(() => h.ended != null || (m.phase === PHASE.SETTLE && m.round === 4), { maxSteps: 5e6 });
  assert.equal(m.errorCount, 0);
  assert.ok(synced > 0);
  assert.ok(m._sync && m._sync.pools.pools.size > 0, 'shared pools were made');
  m.dispose();
});
