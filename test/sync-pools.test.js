// 동기화 시뮬레이션 stage 2: one HP pool per scheduled enemy shared by every field (server/sim/syncPools.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeBattle } from './helpers/battleHarness.js';
import { SharedSyncPools, FieldSyncPools, LocalSyncPools } from '../server/sim/syncPools.js';

const ENEMY = 'enemy_1422_lrsldr';

test('server pools: per-field credit is idempotent and depletion fires once', () => {
  const dead = [];
  const sp = new SharedSyncPools({ onDepleted: (k) => dead.push(k) });
  sp.credit('a', 'k.0', 300, 1000);
  sp.credit('a', 'k.0', 300, 1000); // same report again: nothing new
  sp.credit('b', 'k.0', 500, 1000);
  assert.equal(sp.hp('k.0'), 200);
  sp.credit('a', 'k.0', 900, 1000);
  assert.equal(sp.hp('k.0'), 0);
  assert.deepEqual(dead, ['k.0']);
  assert.equal(sp.alive('k.0'), false);
  assert.deepEqual(sp.state().acked, { a: { 'k.0': 900 }, b: { 'k.0': 500 } });
});

test('local pools: report / sync round trip', () => {
  const lp = new LocalSyncPools();
  const p = lp.get('k.0', 1000);
  p.damage('p1', 250);
  assert.equal(p.hp, 750);
  assert.deepEqual(lp.report(), { dmg: { 'k.0': 250 }, max: { 'k.0': 1000 } });
  lp.sync({ hp: { 'k.0': 400 }, acked: { f1: { 'k.0': 250 } } }, 'f1'); // other field dealt 350
  assert.equal(p.hp, 400);
  p.damage('p1', 100);
  assert.equal(p.hp, 300);
});

test('two fields share each enemy: damage on one shows on the other, a kill anywhere kills it everywhere', () => {
  const shared = new SharedSyncPools();
  const mk = (fid) => makeBattle({ fieldId: fid, syncPools: new FieldSyncPools(shared, fid), autoFinish: false,
    enemies: [{ key: ENEMY, time: 0, route: 0, syncKey: 's0' }] });
  const a = mk('A'), b = mk('B');
  a.step(2); b.step(2);
  const ea = a.enemies()[0], eb = b.enemies()[0];
  assert.equal(ea.syncKey, 's0.0');
  assert.equal(eb.syncKey, 's0.0');
  const max = ea.s.maxHp;
  shared.pool('s0.0').damage(0); // pool exists
  ea.bossPool.damage('x', max * 0.4);
  b.step(1);
  assert.ok(Math.abs(eb.hp - max * 0.6) < 1e-6, `B hp ${eb.hp}`);
  eb.bossPool.damage('x', max);
  a.step(1); b.step(1);
  assert.equal(ea.alive, false);
  assert.equal(eb.alive, false);
});

test('a battle without sync pools is unchanged (no syncKey)', () => {
  const h = makeBattle({ enemies: [{ key: ENEMY, time: 0, route: 0, syncKey: 's0' }] });
  h.step(2);
  const e = h.enemies()[0];
  assert.equal(e.bossPool, null);
  assert.equal(e.hp, e.s.maxHp);
});
