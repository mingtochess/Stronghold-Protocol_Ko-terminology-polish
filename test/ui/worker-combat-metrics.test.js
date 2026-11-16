// 작전 통계 for Worker battles (규정 rooms): the Worker runs the meter and each packet carries its reading.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSimWorker } from '../../public/js/battle/simWorkerRuntime.js';

function fakeSim() {
  const hooks = [];
  const op = { id: 'u1', uid: 7, ownerId: 'p_0', defId: 'chess_x', name: 'X', kind: 'op', side: 'ally', def: { name: 'X' }, stats: { dmg: 0 } };
  const battle = {
    time: 0, tickCount: 0, finished: false, allyUnits: [op], enemies: [], players: [{ playerId: 'p_0' }], flags: {},
    on(ev, fn) { hooks.push(fn); return fn; }, off() {}, heal() { return 0; },
    step() { this.tickCount++; this.time += 1 / 30; op.stats.dmg += 10; for (const h of hooks) h({ source: op, type: 'phys' }); },
    snapshot: () => ({}), drainEvents: () => [], fieldMeta: () => ({ units: [] }), getPlayer: () => ({ bonds: {} }),
  };
  return { spec: { createBattleFromSpec: () => battle, attachLpMeter: () => ({ lp: 0 }), battleProgress: () => ({}) }, ds: {} };
}

test('a Worker battle started with metrics returns the meter rows and the damage sample', async () => {
  const dispatch = createSimWorker({ loadSim: async () => fakeSim() });
  await dispatch('load', [{ cs: 'c', data: {} }]);
  const spec = { kind: 'normal', players: [{ playerId: 'p_0' }] };
  const first = await dispatch('start', [spec, { metrics: true }]);
  assert.ok(first.metrics, 'meter attached');
  const p = await dispatch('step', [3]);
  const row = p.metrics.rows.find((r) => r.ownerId === 'p_0');
  assert.equal(row.damage, 30);
  assert.equal(row.types.phys, 30);
  assert.equal(p.sample[0].id, 'u1');
});

test('without metrics the packet carries none', async () => {
  const dispatch = createSimWorker({ loadSim: async () => fakeSim() });
  await dispatch('load', [{ cs: 'c', data: {} }]);
  const p = await dispatch('start', [{ kind: 'normal', players: [{ playerId: 'p_0' }] }]);
  assert.equal(p.metrics, undefined);
});
