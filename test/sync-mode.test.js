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

test('sync settlement: each field a shared enemy got through costs the team, a kill takes one back', async (t) => {
  const { syncRound, syncCredit, syncNoteLeaks, syncLeakLoss } = await import('../server/match/sync.js');
  const { buildNormalWave } = await import('../server/match/waves.js');
  const h = makeMatch({ mode: 'coop', sync: true, humans: 2, fake: true });
  t.after(() => h.m.dispose());
  const m = h.m;
  m.round = 3; m.wave = buildNormalWave(m.gd, m.rngWaves, m.factions, 3);
  syncRound(m);
  // s0.0 got through on fields a and b (a reports it twice), s1.0 (LP 2) on a alone
  syncNoteLeaks(m, [{ key: 's0.0', lpr: 1 }, { key: 's0.0', lpr: 1 }, { key: 's1.0', lpr: 2 }], 'n:a');
  syncNoteLeaks(m, [{ key: 's0.0', lpr: 1 }], 'n:b');
  assert.equal(syncLeakLoss(m), 4);
  syncCredit(m, 'n:b', { 's1.0': 500 }, { 's1.0': 500 }, []); // s1.0 killed: its one leak is taken back
  assert.equal(syncLeakLoss(m), 2);
  syncCredit(m, 'n:c', { 's0.0': 1e9 }, { 's0.0': 500 }, []); // s0.0 killed: 2 leaks − 1
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

test('sync bounty: pays only the player who picked it, once per bounty enemy, whoever killed it', async (t) => {
  const { syncRound, syncCredit } = await import('../server/match/sync.js');
  const { buildNormalWave } = await import('../server/match/waves.js');
  const h = makeMatch({ mode: 'coop', sync: true, humans: 2, fake: true });
  t.after(() => h.m.dispose());
  const m = h.m;
  m.round = 3; m.wave = buildNormalWave(m.gd, m.rngWaves, m.factions, 3);
  const [a, b] = m.order;
  const key = m.wave.spawns.find((s) => m.gd.enemy(s.enemyKey))?.enemyKey;
  m.addBounty(a, { enemyKey: key, coin: 3, count: 2, payout: 'kill' });
  const st = syncRound(m);
  const keys = st.spawns.filter((s) => s.tag === 'bounty').map((s) => s.syncKey);
  assert.equal(keys.length >= 1, true);
  const units = st.spawns.filter((s) => s.tag === 'bounty').flatMap((s) => Array.from({ length: s.count || 1 }, (_, i) => `${s.syncKey}.${i}`));
  assert.equal(units.length, 2);
  // b's field kills the first, a's field the second; both report again afterwards
  for (const [fid, k] of [['n:' + b.playerId, units[0]], ['n:' + a.playerId, units[1]]]) {
    syncCredit(m, fid, { [k]: 1e9 }, { [k]: 1000 }, []);
    syncCredit(m, fid, { [k]: 2e9 }, { [k]: 1000 }, []);
    syncCredit(m, 'n:other', { [k]: 1e9 }, { [k]: 1000 }, []);
  }
  assert.equal(st.paidBy.get(a.playerId), 6);
  assert.equal(st.paidBy.get(b.playerId) || 0, 0);
});

test('sync 8-player rooms: a kill takes back up to three leaks', async (t) => {
  const { syncRound, syncCredit, syncNoteLeaks, syncLeakLoss } = await import('../server/match/sync.js');
  const { buildNormalWave } = await import('../server/match/waves.js');
  const h = makeMatch({ mode: 'coop8', sync: true, humans: 8, fake: true });
  t.after(() => h.m.dispose());
  const m = h.m;
  m.round = 3; m.wave = buildNormalWave(m.gd, m.rngWaves, m.factions, 3);
  syncRound(m);
  for (const f of ['n:1', 'n:2', 'n:3', 'n:4', 'n:5']) syncNoteLeaks(m, [{ key: 's0.0', lpr: 1 }], f);
  syncNoteLeaks(m, [{ key: 's1.0', lpr: 1 }], 'n:1'); syncNoteLeaks(m, [{ key: 's1.0', lpr: 1 }], 'n:2');
  assert.equal(syncLeakLoss(m), 7);
  syncCredit(m, 'n:6', { 's0.0': 1e9, 's1.0': 1e9 }, { 's0.0': 100, 's1.0': 100 }, []);
  assert.equal(syncLeakLoss(m), 2, '5 − 3 and 2 − 2');
});

test('sync surrender: the replay bills its leaks as shared ones (unspawned enemies too), killed elsewhere ⇒ taken back', async (t) => {
  const { PHASE } = await import('../shared/constants.js');
  const { syncLeakLoss } = await import('../server/match/sync.js');
  const h = makeMatch({ mode: 'coop', sync: true, humans: 2, clientCombat: true, clients: false, instant: false });
  t.after(() => h.m.dispose());
  const m = h.m;
  h.start();
  h.run(() => m.phase === PHASE.COMBAT, { maxSteps: 2e6 });
  const [a] = m.order;
  const f = m.fields.find((x) => x.players.includes(a.playerId));
  assert.ok(f && f.spec.sync);
  h.sched.advance(2000);
  assert.equal(m.endBattle(a, f.fieldId, 1).ok ?? true, true);
  h.run(() => f.done, { maxSteps: 2e6 });
  const leaked = Object.values(f.result.perPlayer).flatMap((p) => p.leaked || []);
  assert.ok(leaked.length > 0, 'a surrender leaks the field');
  assert.ok(leaked.every((l) => typeof l.syncKey === 'string'), 'every leak is a shared one');
  assert.ok(leaked.some((l) => l.spawned === false), 'unspawned enemies too');
  // the round's leaks reach the shared tally when combat finishes
  h.run(() => m.phase !== PHASE.COMBAT, { maxSteps: 3e6 });
  assert.ok(m._sync.leaks.size > 0);
  assert.ok(syncLeakLoss(m) >= 0);
});
