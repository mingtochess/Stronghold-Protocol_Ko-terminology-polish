import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeMatch } from './harness.js';
import { EMOTES } from '../../shared/constants.js';
import { BAND_DONE_SECONDS } from '../../server/match/Match.js';

for (const humans of [4, 8]) test(`restart vote freezes the strategy-complete five-second countdown (${humans} players)`, () => {
  const h = makeMatch({ mode: humans === 8 ? 'coop8' : 'coop', humans, fake: true }).autoHumans().start();
  const m = h.m;
  assert.equal(h.run(() => m.draft?.done === true), true);
  assert.equal(m.phase, 'BAND_DRAFT');
  const deadline = m.deadline;
  assert.equal(deadline - h.sched.now(), BAND_DONE_SECONDS * 1000);
  h.sched.advance(1250);
  const remaining = deadline - h.sched.now();
  assert.equal(m.beginRestartVote(true, 'p_0').ok, true);
  h.sched.advance(45000);
  assert.equal(m.phase, 'BAND_DRAFT');
  assert.equal(m.publicView().draft.done, true);
  assert.equal(m.deadline, deadline);
  m.setRestartVotePaused(false);
  assert.equal(m.deadline, deadline + 45000);
  h.sched.advance(remaining - 1);
  assert.equal(m.phase, 'BAND_DRAFT');
  h.sched.advance(1);
  assert.equal(m.phase, 'BATTLE_CHECK');
  assert.equal(m.errorCount, 0);
  m.dispose();
});

test('restart vote freezes prep timeout, rejects gameplay, and resumes the exact remaining duration', () => {
  const h = makeMatch({ humans: 2, fake: true }).start();
  h.toPrep();
  const m = h.m, deadline = m.deadline, pausedAt = h.sched.now();
  m.setRestartVotePaused(true);
  assert.equal(m.publicView().pausedAt, pausedAt);
  h.sched.advance(45_000);
  assert.equal(m.phase, 'PREP');
  assert.equal(m.deadline, deadline);
  assert.equal(m.handle('p_0', { t: 'g.ready', ready: true }).error, 'WRONG_PHASE');
  assert.equal(m.handle('p_0', { t: 'g.refresh' }).error, 'WRONG_PHASE');
  assert.equal(m.setLoadout('p_0', {}).error, 'WRONG_PHASE');
  assert.equal(m.handle('p_0', { t: 'g.chat', text: '투표 중' }).ok, true);
  assert.equal(m.handle('p_0', { t: 'g.emote', id: EMOTES[0] }).ok, true);
  m.setRestartVotePaused(false);
  assert.equal(m.deadline, deadline + 45_000);
  assert.equal(m.publicView().paused, false);
  h.sched.advance(deadline - pausedAt - 1);
  assert.equal(m.phase, 'PREP');
  h.sched.advance(1);
  assert.notEqual(m.phase, 'PREP');
  assert.equal(m.errorCount, 0);
  m.dispose();
});

for (const phase of ['BAND_DRAFT', 'SP_DRAFT']) test(`restart pause freezes ${phase} choices and bot callbacks`, () => {
  const h = makeMatch({ humans: 2, bots: 1, fake: true }).start();
  if (phase === 'BAND_DRAFT') {
    h.m.handle('p_0', { t: 'g.infoReady' }); h.m.handle('p_1', { t: 'g.infoReady' });
    h.runToPhase(phase);
  } else {
    h.toPrep(2);
    // Enter the real choice phase directly; card generation and timers use production code.
    h.m.enterSpDraft();
  }
  const m = h.m, deadline = m.deadline, turn = phase === 'BAND_DRAFT' ? m.draft.turnDeadline : m.sp.turnDeadline;
  m.setRestartVotePaused(true);
  const picks = JSON.stringify(phase === 'BAND_DRAFT' ? m.draft.picks : m.sp.picks);
  h.sched.advance(50_000);
  assert.equal(m.phase, phase);
  assert.equal(JSON.stringify(phase === 'BAND_DRAFT' ? m.draft.picks : m.sp.picks), picks);
  m.setRestartVotePaused(false);
  assert.equal(m.deadline, deadline ? deadline + 50_000 : 0);
  assert.equal(phase === 'BAND_DRAFT' ? m.draft.turnDeadline : m.sp.turnDeadline, turn ? turn + 50_000 : 0);
  assert.equal(m.errorCount, 0);
  m.dispose();
});

for (const clientCombat of [false, true]) test(`restart vote freezes ${clientCombat ? 'client authority and bot pacer' : 'server field runner'} combat clocks`, () => {
  const h = makeMatch({ humans: 2, bots: 1, fake: true, clientCombat, clients: false, instant: false, script: () => ({ duration: 90 }) }).start();
  h.toPrep();
  h.m.handle('p_0', { t: 'g.ready', ready: true }); h.m.handle('p_1', { t: 'g.ready', ready: true });
  h.runToPhase('COMBAT');
  const m = h.m;
  h.sched.advance(1000);
  const times = m.fields.map(f => f.battle?.time ?? m._fieldElapsed(f));
  const deadline = m.deadline;
  m.setRestartVotePaused(true);
  m.onDisconnect('p_0');
  m.onReconnect('p_1');
  h.sched.advance(40_000);
  assert.equal(m.phase, 'COMBAT');
  assert.equal(m.paused, true);
  assert.equal(m.deadline, deadline);
  assert.deepEqual(m.fields.map(f => f.battle?.time ?? m._fieldElapsed(f)), times);
  assert.equal(m.handle('p_1', { t: 'g.pause', on: false }).error, 'WRONG_PHASE');
  m.setRestartVotePaused(false);
  assert.equal(m.deadline, deadline + 40_000);
  h.sched.advance(100);
  assert.equal(m.paused, false);
  assert.equal(m.errorCount, 0, JSON.stringify(m.errors));
  m.dispose();
});

test('reports in flight are held until resume, duplicate pause is harmless, dispose never runs held callbacks', () => {
  const h = makeMatch({ humans: 2, fake: true, clientCombat: true, clients: false }).start();
  h.toPrep();
  const m = h.m;
  let ran = false;
  m.later(50, () => { ran = true; });
  m.setRestartVotePaused(true);
  m.setRestartVotePaused(true);
  assert.equal(m.handle('p_0', { t: 'b.result', battleId: 'old', result: {} }).ok, true);
  assert.equal(m._restartReports.size, 1);
  h.sched.advance(1000);
  assert.equal(ran, false);
  m.setRestartVotePaused(false);
  assert.equal(m._restartReports.size, 0);
  h.sched.advance(49);
  assert.equal(ran, false);
  h.sched.advance(1);
  assert.equal(ran, true);
  m.setRestartVotePaused(true);
  m.later(0, () => { throw new Error('must never run after dispose'); });
  m.dispose();
  h.sched.advance(100_000);
  assert.equal(m.errorCount, 0);
});

test('a pre-existing solo pause is preserved, and disconnect during the vote cannot strand it', () => {
  for (const disconnect of [false, true]) {
    const h = makeMatch({ mode: 'solo', fake: true, clientCombat: true, clients: false, instant: false, script: () => ({ duration: 90 }) }).start();
    h.toPrep(); h.m.handle('p_0', { t: 'g.ready', ready: true }); h.runToPhase('COMBAT');
    const m = h.m;
    assert.equal(m.setPause(m.players.get('p_0'), true).ok, true);
    m.setRestartVotePaused(true);
    if (disconnect) m.onDisconnect('p_0');
    h.sched.advance(20_000);
    assert.equal(m.paused, true);
    m.setRestartVotePaused(false);
    assert.equal(m.paused, !disconnect);
    assert.equal(m.errorCount, 0);
    m.dispose();
  }
});

for (const clientCombat of [false, true]) test(`boss pool, team HP, overtime and clocks freeze (${clientCombat ? 'client' : 'server'} combat)`, () => {
  const h = makeMatch({ mode: 'coop', difficulty: 'FUNNY', humans: 2, fake: true, clientCombat, instant: false,
    script: b => b.kind === 'boss' ? { bossDps: 1 } : { duration: 1 } }).start();
  h.autoHumans();
  h.drive(() => h.m.phase === 'FINAL_ASSAULT');
  const m = h.m;
  m.setRestartVotePaused(true);
  const initial = { hp: m.bossPool.hp, deadline: m.deadline, overtime: m.overtimeAt, start: m._bossStartAt, teamLp: m.teamLp };
  h.sched.advance(60_000);
  assert.equal(m.phase, 'FINAL_ASSAULT');
  assert.deepEqual({ hp: m.bossPool.hp, deadline: m.deadline, overtime: m.overtimeAt, start: m._bossStartAt, teamLp: m.teamLp }, initial);
  m.setRestartVotePaused(false);
  assert.equal(m.deadline, initial.deadline + 60_000);
  assert.equal(m.overtimeAt, initial.overtime + 60_000);
  assert.equal(m.errorCount, 0);
  m.dispose();
});
