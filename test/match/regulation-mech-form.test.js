// 假想敌：械: its armor pair (below half HP) switches the model to the WithArmor (B_) set — 'armor' form fx, display only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getVersionData, setData } from '../../server/data.js';
const data = getVersionData('act3autochess@V3_1');
setData({ ...data });
const { LaboratoryMatch } = await import('../../server/match-upstream/LaboratoryMatch.js');
const spec = await import('../../server/sim-upstream/spec.js');
const { DataSource } = await import('../../server/sim-upstream/simdata.js');
test('假想敌：械 shows its armor form while the armor pair lives', () => {
  const sent = [];
  const m = new LaboratoryMatch({ seats: [{ seat: 0, playerId: 'p', name: 'P', isBot: false, connected: true }], seed: 1, data,
    send: (_, msg) => { sent.push(msg); return true; }, broadcast: (msg) => sent.push(msg), onEnd() {},
    laboratory: { stageId: 'act3autochess_m01', bossId: 'boss_11', bandId: Object.keys(data.bands)[1], kind: 'boss', players: 1 } });
  m.start(); m.phase = 'PREP'; m.endPrep();
  const bs = sent.find((x) => x?.t === 'b.start');
  const b = spec.createBattleFromSpec(bs.spec, new DataSource(data), {});
  for (let i = 0; i < 60; i++) b.step();
  const boss = b.enemies.find((e) => e.isBoss);
  if (b.sharedBoss) b.sharedBoss.hp = b.sharedBoss.maxHp * 0.4; boss.hp = boss.s.maxHp * 0.4;
  const forms = [];
  for (let i = 0; i < 30 * 40; i++) { b.step(); for (const ev of b.drainEvents?.() || []) if (ev[0] === 'fx' && ev[4]?.form !== undefined) forms.push([b.time.toFixed(1), ev[4].form]); }
  assert.ok(b.enemies.filter((e) => e.defId === 'enemy_9027_acfnca' && e.alive).length > 0, 'the armor pair is up');
  assert.equal(forms[0]?.[1], 'armor');
  assert.equal(boss.form, 'armor');
  m.dispose?.();
});
