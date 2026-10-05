import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeMatch } from './harness.js';
import { validateC2S } from '../../shared/protocol.js';
import { CHAT_MAX_LENGTH, CHAT_HISTORY_LIMIT, CHAT_COOLDOWN_MS, CHAT_FACTIONS } from '../../shared/chat.js';
import { EMOTES } from '../../shared/constants.js';

test('chat validates content, length and normalizes text with server-owned identity', () => {
  const h = makeMatch({ humans: 2 }).start();
  try {
    for (const text of ['', '  \n\t', null, 7, '가'.repeat(CHAT_MAX_LENGTH + 1)]) {
      assert.ok(validateC2S({ t: 'g.chat', text }));
      assert.equal(h.m.handle('p_0', { t: 'g.chat', text }).error, 'BAD_MSG');
    }
    assert.equal(validateC2S({ t: 'g.chat', text: '가'.repeat(CHAT_MAX_LENGTH) }), null);
    assert.deepEqual(h.m.handle('p_0', { t: 'g.chat', text: '  안녕\n팀원들!  ', name: 'Forged', playerId: 'p_1' }), { ok: true });
    const msg = h.bc.find((m) => m.t === 'm.chat');
    assert.equal(msg.name, 'P0');
    assert.equal(msg.playerId, 'p_0');
    assert.equal(msg.text, '안녕 팀원들!');
  } finally { h.m.dispose(); }
});

test('chat cooldown is per sender and separate from emotes; history is bounded and restored', () => {
  const h = makeMatch({ humans: 2 }).start();
  try {
    assert.deepEqual(h.m.handle('p_0', { t: 'g.chat', text: 'first' }), { ok: true });
    assert.deepEqual(h.m.handle('p_0', { t: 'g.emote', id: EMOTES[0] }), { ok: true });
    assert.equal(h.m.handle('p_0', { t: 'g.chat', text: 'spam' }).error, 'RATE');
    assert.deepEqual(h.m.handle('p_1', { t: 'g.chat', text: 'reply' }), { ok: true });
    for (let i = 0; i < CHAT_HISTORY_LIMIT; i++) {
      h.sched.t += CHAT_COOLDOWN_MS;
      assert.deepEqual(h.m.handle('p_0', { t: 'g.chat', text: `line ${i}` }), { ok: true });
    }
    assert.equal(h.m.chatHistory.length, CHAT_HISTORY_LIMIT);
    assert.equal(h.m.chatHistory[0].text, 'line 0');
    h.m.onReconnect('p_1');
    assert.deepEqual(h.lastTo('p_1', 'm.chatHistory').messages, h.m.chatHistory);
  } finally { h.m.dispose(); }
});

test('outsiders, bots and departed players cannot send; other matches have separate histories', () => {
  const a = makeMatch({ humans: 2, bots: 1 }).start();
  const b = makeMatch({ humans: 1 }).start();
  try {
    for (const id of ['outsider', 'ai_0']) assert.equal(a.m.handle(id, { t: 'g.chat', text: 'no' }).error, 'NOT_IN_ROOM');
    a.ps('p_1').left = true;
    assert.equal(a.m.handle('p_1', { t: 'g.chat', text: 'no' }).error, 'NOT_IN_ROOM');
    a.m.handle('p_0', { t: 'g.chat', text: 'private to this game' });
    assert.equal(b.m.chatHistory.length, 0);
    assert.equal(b.bc.filter((m) => m.t === 'm.chat').length, 0);
  } finally { a.m.dispose(); b.m.dispose(); }
});

test('factions are validated, announced with authoritative identity and retained on reconnect', () => {
  const h = makeMatch({ humans: 2 }).start();
  try {
    for (const faction of ['unknown', 'constructor', null, 7]) {
      assert.ok(validateC2S({t:'g.chatFaction', faction}));
      assert.equal(h.m.handle('p_0', {t:'g.chatFaction', faction}).error, 'BAD_MSG');
    }
    for (const {name} of CHAT_FACTIONS) {
      h.sched.t += CHAT_COOLDOWN_MS;
      assert.equal(validateC2S({t:'g.chatFaction', faction:name}), null);
      assert.deepEqual(h.m.handle('p_0', {t:'g.chatFaction', faction:name, name:'Forged'}), {ok:true});
      const last=h.m.chatHistory.at(-1);
      assert.equal(last.name, 'P0'); assert.equal(last.faction, name);
      assert.equal(last.text, `진영 선택: ${name}`);
      const count=h.m.chatHistory.length;
      assert.deepEqual(h.m.handle('p_0', {t:'g.chatFaction', faction:name}), {ok:true});
      assert.equal(h.m.chatHistory.length, count);
    }
    assert.equal(h.m.handle('p_0', {t:'g.chatFaction', faction:'염국'}).error, 'RATE');
    assert.deepEqual(h.m.handle('p_1', {t:'g.chatFaction', faction:'염국'}), {ok:true});
    h.m.handle('p_0', {t:'g.chat', text:'hello', faction:'염국'});
    assert.equal(h.m.chatHistory.at(-1).faction, CHAT_FACTIONS.at(-1).name);
    assert.equal(h.m.chatHistory[0].faction, '염국');
    h.m.onReconnect('p_0');
    assert.equal(h.lastTo('p_0','m.chatHistory').faction, CHAT_FACTIONS.at(-1).name);
  } finally { h.m.dispose(); }
});
