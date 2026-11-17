// 규정 耀骑士临光 (garrison_58): knocked down in a real match battle, the rightmost 卡西米尔·突袭 hand operator enters.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getVersionData } from '../../server/data.js';
import { makeMatch, give, legalTileFor } from './harness.js';
import { GEO } from '../../shared/constants.js';
import { setGameData } from '../../server/sim-upstream/content/support/index.js';

test('regulation: Nearl the Radiant Knight summons the bench 卡西米尔·突袭 operator when knocked down', (t) => {
  const data = getVersionData('act3autochess@V3_1');
  const h = makeMatch({ data, version: 'act3autochess@V3_1', humans: 1, bots: 0, seed: 3 }).start();
  t.after(() => h.m.dispose());
  const m = h.m;
  m.handle('p_0', { t: 'g.autoplay', on: true });
  h.drive(() => m.phase === 'PREP' && m.round === 1);
  m.handle('p_0', { t: 'g.autoplay', on: false });
  const ps = m.players.get('p_0');
  const at = legalTileFor(m, ps, 'chess_char_6_05_a');
  const nearl = give(m, ps, 'chess_char_6_05_a', 'board', at);
  const blem = give(m, ps, 'chess_char_3_12_a', 'hand');
  const spec = ps.battleInput({ side: 'L', colOffset: 0 });
  assert.ok(Array.isArray(spec.bench) && spec.bench.some((b) => b.uid === blem.uid), 'the hand operator is in the battle input');
  // the server's process default (맹약 data), as before any 규정 battle
  setGameData(null);
  const b = m.newBattle({ seed: 1, kind: 'normal', modeId: m.modeId, round: m.round, stageId: m.stageId, rect: { ...GEO.NORMAL_RECT },
    timeLimit: 60, players: [spec], spawns: [], routes: m.wave ? m.wave.routes : [], sharedBoss: null,
    flags: { layerGainsEnabled: true, ...m.gd.dp }, fieldId: 'n:p_0', recordEvents: false });
  b.start?.();
  b.step();
  const unit = b.allyUnits.find((u) => u.uid === nearl.uid);
  assert.ok(unit?.alive, 'Nearl on the field');
  const before = { ...b.getPlayer('p_0').bonds.kazimierzShip };
  b.kill(unit);
  b.step();
  const summoned = b.allyUnits.find((u) => u.uid === blem.uid);
  assert.ok(summoned?.alive && summoned.deployed, 'the hand operator entered');
  // 卡西米尔 is not active with these two, so (correctly) no layers: the trait adds to active bonds only
  void before;
});

test('regulation: Irene gains SP when an enemy is knocked down near her (server-built battle)', (t) => {
  const data = getVersionData('act3autochess@V3_1');
  const h = makeMatch({ data, version: 'act3autochess@V3_1', humans: 1, bots: 0, seed: 4 }).start();
  t.after(() => h.m.dispose());
  const m = h.m;
  m.handle('p_0', { t: 'g.autoplay', on: true });
  h.drive(() => m.phase === 'PREP' && m.round === 1);
  m.handle('p_0', { t: 'g.autoplay', on: false });
  const ps = m.players.get('p_0');
  const irene = give(m, ps, 'chess_char_5_03_a', 'board', legalTileFor(m, ps, 'chess_char_5_03_a'));
  setGameData(null);
  const b = m.newBattle({ seed: 1, kind: 'normal', modeId: m.modeId, round: m.round, stageId: m.stageId, rect: { ...GEO.NORMAL_RECT },
    timeLimit: 60, players: [ps.battleInput({ side: 'L', colOffset: 0 })], spawns: [], routes: m.wave ? m.wave.routes : [], sharedBoss: null,
    flags: { layerGainsEnabled: true, ...m.gd.dp }, fieldId: 'n:p_0', recordEvents: false });
  b.start?.();
  b.step();
  const u = b.allyUnits.find((x) => x.uid === irene.uid);
  const e = b.spawnEnemy('enemy_1007_slime', { pos: [u.y, u.x + 1], route: { motion: 'WALK', start: [u.y, u.x + 1], end: [u.y, u.x + 1], steps: [{ t: 'wait', s: 999 }] } });
  b.step();
  const sp = u.skill.sp;
  b.kill(e, u);
  b.step();
  assert.equal(u.skill.sp - sp >= 3, true, `sp ${sp} → ${u.skill.sp}`);
});

test('regulation: a battle the server builds from a client spec (takeover / verification) installs the 규정 traits', (t) => {
  const data = getVersionData('act3autochess@V3_1');
  const h = makeMatch({ data, version: 'act3autochess@V3_1', humans: 2, bots: 0, seed: 3 }).start();
  t.after(() => h.m.dispose());
  const m = h.m;
  for (const p of ['p_0', 'p_1']) m.handle(p, { t: 'g.autoplay', on: true });
  h.drive(() => m.phase === 'PREP' && m.round === 2);
  for (const p of ['p_0', 'p_1']) m.handle(p, { t: 'g.autoplay', on: false });
  const ps = m.players.get('p_0');
  const irene = give(m, ps, 'chess_char_5_03_a', 'board', legalTileFor(m, ps, 'chess_char_5_03_a'));
  setGameData(null); // the server's process default (맹약 data)
  const f = m._ccField({ fieldId: 'n:p_0', kind: 'normal', players: ['p_0'], opts: m._normalOpts(ps) });
  const b = m._specBattle(f.spec);
  b.start?.();
  b.step();
  const u = b.allyUnits.find((x) => x.uid === irene.uid);
  const e = b.spawnEnemy('enemy_1007_slime', { pos: [u.y, u.x + 1], route: { motion: 'WALK', start: [u.y, u.x + 1], end: [u.y, u.x + 1], steps: [{ t: 'wait', s: 999 }] } });
  b.step();
  const sp = u.skill.sp;
  b.kill(e);
  b.step();
  assert.equal(u.skill.sp - sp >= 3, true, `sp ${sp} → ${u.skill.sp}`);
});
