// 규정 engine (server/sim-upstream) fixes ported from / matched to the 맹약 engine (server/sim):
// - 공포 (fear) movement: no engine error (an internal error every tick force-ended the battle as a timeout after 200,
//   every enemy still on the field leaking — "the battle froze, then ended and the enemies leaked")
// - 증강 재생 (augment regen) never on a 频次 (hit-count) form, even one switched on after the augment's deploy hook
// - BattleSpec results keep all eight players of an 8인 연합 방어 battle
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeBattle, enemyRec } from './helpers/battleHarnessUpstream.js';
import { compactResult } from '../server/sim-upstream/spec.js';

test('a feared enemy walks away without an engine error (no forced timeout)', () => {
  const h = makeBattle({
    defs: { enemies: { fear_dummy: enemyRec({ key: 'fear_dummy', hp: 1e6, speed: 1 }) } },
    units: [{ chessId: 'chess_char_1_01_a', row: 10, col: 5 }],
    enemies: [{ key: 'fear_dummy', time: 0, route: 0 }],
    autoFinish: false,
    timeLimit: 60,
  });
  h.run(1);
  const e = h.enemies()[0];
  assert.ok(e && e.alive, 'the enemy is on the field');
  h.b.applyStatus(e, 'fear', { duration: 4, source: h.allies()[0] });
  h.run(8);
  assert.equal(h.b.internalErrorCount || 0, 0, JSON.stringify(h.b.errors));
  assert.equal(h.b.finished, false, 'not force-ended');
});

test('augment regen is not counted on a hit-count form switched on after deploy', () => {
  const h = makeBattle({
    defs: { enemies: { regen_dummy: enemyRec({ key: 'regen_dummy', hp: 5000, speed: 0 }) } },
    enemies: [{ key: 'regen_dummy', time: 0, route: 0 }],
    autoFinish: false,
  });
  h.run(0.5);
  const e = h.enemies()[0];
  h.b.addBuff(e, { key: 'augment:0:regen', mods: { hpRegen: 50 }, persist: true });
  e.markDirty();
  assert.equal(e.s.hpRegen, 50, 'a normal enemy regenerates');
  h.b.addBuff(e, { key: 'ab:hitCount', persist: true, flags: { hitCount: true } });
  e.markDirty();
  assert.equal(e.s.hpRegen, 0, 'its hit-count form does not');
});

test('compactResult keeps all eight players of an 8인 연합 방어 field', () => {
  const perPlayer = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`p${i}`, { killed: i, total: 8, leaked: [], perfect: true, layerGains: {} }]));
  const r = compactResult({ reason: 'cleared', perPlayer });
  assert.equal(Object.keys(r.perPlayer).length, 8);
});
