// Audio manager (public/js/audio.js): BGM selection, manifest resolution, SFX limiter, and the manager's
// never-throw behaviour with a fake Web Audio implementation.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { combatTrackFor, bgmKeyFor, resolveBgm, SfxLimiter, AudioManager, VoiceGate, normalAttackSfx } from '../../public/js/audio.js';
import { mediaUrl } from '../../public/js/media.js';
import { PHASE } from '../../shared/constants.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(readFileSync(path.join(ROOT, 'data', 'assets.json'), 'utf8'));

// audio.js 取音频时**先请求无扩展名的 /media/…**（正是为了躲开下载管理器对 .mp3 后缀的嗅探），
// 只有那样 404 了才回退到 manifest 里的原始地址。所以「某个音效响了没有」不能拿原始地址去比对——
// 那样断言的是一个客户端永远不会请求的 URL。下面两个助手把比对放到同一条换算上。
/** 这个 manifest 地址被请求过吗（/media/ 形式或 404 后的原始形式）。 */
const asked = (urls, raw) => urls.includes(mediaUrl(raw)) || urls.includes(raw);
/** 这个 manifest 地址被请求了几次。 */
const askedCount = (urls, raw) => urls.filter((u) => u === mediaUrl(raw) || u === raw).length;

describe('bgm selection', () => {
  test('route and phase → key', () => {
    assert.equal(bgmKeyFor('title', null), 'lobby');
    assert.equal(bgmKeyFor('room', null), 'lobby');
    assert.equal(bgmKeyFor('game', null), 'lobby');
    assert.equal(bgmKeyFor('game', { phase: PHASE.INFO_CHECK }), 'lobby');
    assert.equal(bgmKeyFor('game', { phase: PHASE.PREP }), 'prep');
    assert.equal(bgmKeyFor('game', { phase: PHASE.SP_DRAFT }), 'prep');
    assert.equal(bgmKeyFor('game', { phase: PHASE.COMBAT }), 'combat');
    // 联防 has its own track: the official escaped_single / escaped_multi levels declare bgmEvent = corrosion
    assert.equal(bgmKeyFor('game', { phase: PHASE.UNITE }), 'unite');
    assert.equal(bgmKeyFor('game', { phase: PHASE.FINAL_ASSAULT, bossId: 'boss_4' }), 'boss:boss_4');
    assert.equal(bgmKeyFor('game', { phase: PHASE.FINAL_ASSAULT }), 'boss');
    assert.equal(bgmKeyFor('game', { phase: PHASE.HIDDEN_CORE, bossId: 'boss_1', hiddenBossId: 'boss_9' }), 'boss:boss_9');
    assert.equal(bgmKeyFor('game', { phase: PHASE.RESULT }), 'lobby');
    assert.equal(bgmKeyFor('weird', null), null);
  });
  test('combat music switches after round 7 while Unite keeps its official track', () => {
    for (const round of [1, 4, 7]) assert.equal(combatTrackFor(round), 1);
    for (const round of [8, 15, 30]) assert.equal(combatTrackFor(round), 0);
    for (const index of [0, 1]) {
      assert.equal(bgmKeyFor('game', {phase: PHASE.COMBAT}, index), `combat:${index}`);
      assert.equal(resolveBgm(manifest, `combat:${index}`).loop, manifest.audio.bgm.combatAlts[index].loop);
      assert.equal(bgmKeyFor('game', {phase: PHASE.UNITE}, index), 'unite');
    }
    assert.equal(resolveBgm({audio:{bgm:{combat:{loop:'/fallback.mp3'}}}}, 'combat:1').loop, '/fallback.mp3');
  });
  test('resolveBgm uses the manifest (boss fallback, intro optional)', () => {
    const lobby = resolveBgm(manifest, 'lobby');
    assert.ok(lobby && typeof lobby.loop === 'string');
    const b4 = resolveBgm(manifest, 'boss:boss_4');
    assert.equal(b4.loop, manifest.audio.bossBgm.boss_4.loop);
    assert.equal(resolveBgm(manifest, 'boss:nope').loop, manifest.audio.bgm.boss.loop);
    assert.equal(resolveBgm(manifest, 'prep').intro, manifest.audio.bgm.prep.intro ?? null);
    // 联防's own track (bgm.unite = corrosion, the official escaped levels' bgmEvent), and the fallback for an older
    // manifest that has no `unite` entry (the music must not go silent)
    const unite = manifest.audio.bgm.unite;
    assert.ok(unite && typeof unite.loop === 'string', 'the manifest carries 联防’s own track');
    assert.equal(resolveBgm(manifest, 'unite').loop, unite.loop);
    assert.equal(resolveBgm(manifest, 'unite').intro, unite.intro ?? null);
    assert.notEqual(unite.loop, manifest.audio.bgm.combat.loop, 'not the shop / default combat loop');
    assert.equal(resolveBgm({ audio: { bgm: { combat: { loop: '/shop.mp3' } } } }, 'unite').loop, '/shop.mp3');
    assert.equal(resolveBgm(null, 'lobby'), null);
    assert.equal(resolveBgm(manifest, null), null);
    assert.equal(resolveBgm(manifest, 'nope'), null);
  });
});

describe('SfxLimiter', () => {
  test('caps concurrent voices', () => {
    const l = new SfxLimiter({ maxVoices: 3, unitCooldownMs: 0, urlGapMs: 0 });
    assert.ok(l.tryAcquire(0, 1, 'a'));
    assert.ok(l.tryAcquire(0, 2, 'b'));
    assert.ok(l.tryAcquire(0, 3, 'c'));
    assert.equal(l.tryAcquire(0, 4, 'd'), false);
    l.release();
    assert.ok(l.tryAcquire(0, 4, 'd'));
    l.release(); l.release(); l.release(); l.release(); l.release();
    assert.equal(l.active, 0, 'never negative');
  });
  test('per-unit cooldown and per-url gap', () => {
    const l = new SfxLimiter({ maxVoices: 99, unitCooldownMs: 100, urlGapMs: 30 });
    assert.ok(l.tryAcquire(0, 'u1', 'x'));
    assert.equal(l.tryAcquire(50, 'u1', 'y'), false, 'same unit too soon');
    assert.equal(l.tryAcquire(10, 'u2', 'x'), false, 'same url too soon');
    assert.ok(l.tryAcquire(40, 'u2', 'x'));
    assert.ok(l.tryAcquire(120, 'u1', 'z'));
    assert.ok(l.tryAcquire(121, null, 'w'), 'no unit key ⇒ only url gap');
  });
  test('at most 2 overlapping copies of one sound (official banks: maxSoundAllowed 2)', () => {
    const l = new SfxLimiter({ maxVoices: 99, unitCooldownMs: 0, urlGapMs: 0 });
    assert.equal(l.maxPerUrl, 2);
    assert.ok(l.tryAcquire(0, 'a', 'heal'));
    assert.ok(l.tryAcquire(1, 'b', 'heal'));
    assert.equal(l.tryAcquire(2, 'c', 'heal'), false, 'a third copy waits');
    assert.ok(l.tryAcquire(2, 'c', 'other'), 'other sounds are not affected');
    l.release('heal');
    assert.ok(l.tryAcquire(3, 'c', 'heal'), 'one ended: room again');
  });
});

// ---- fake Web Audio -------------------------------------------------------------------------------------

function fakeWindow() {
  const listeners = new Map();
  const made = { sources: 0, started: 0 };
  class Param { constructor() { this.value = 1; } setValueAtTime(v) { this.value = v; } linearRampToValueAtTime(v) { this.value = v; } setTargetAtTime(v) { this.value = v; } cancelScheduledValues() {} }
  class Node { connect() {} disconnect() {} }
  class Gain extends Node { constructor() { super(); this.gain = new Param(); } }
  class Src extends Node { constructor() { super(); this.playbackRate = new Param(); made.sources++; } start() { made.started++; } stop() {} }
  class Ctx {
    constructor() { this.currentTime = 0; this.state = 'running'; this.destination = new Node(); }
    createGain() { return new Gain(); }
    createBufferSource() { return new Src(); }
    decodeAudioData(ab, ok) { ok({ duration: 1.5 }); }
    resume() { return Promise.resolve(); }
    suspend() { return Promise.resolve(); }
  }
  return {
    made,
    win: {
      AudioContext: Ctx,
      document: { hidden: false, addEventListener() {} },
      addEventListener(t, fn) { listeners.set(t, fn); },
      removeEventListener(t) { listeners.delete(t); },
    },
    fire(t) { listeners.get(t)?.(); },
  };
}

describe('AudioManager', () => {
  test('chat has an independent volume, drops bursts, and obeys mute/hidden state', async () => {
    const fw = fakeWindow();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ok: true, arrayBuffer: async () => new ArrayBuffer(8)});
    try {
      const a = new AudioManager({win: fw.win, getManifest: () => null});
      a.install(); fw.fire('pointerdown');
      a.setVolumes({sfx: 0, voice: 0, chatVolume: .4});
      assert.equal(a.chatGain.gain.value, .4 ** 2);
      assert.equal(await a.chatNotification('melantha-etto'), true, 'SFX and battle voice mute do not mute chat');
      const source = a.chatNode;
      assert.equal(await a.chatNotification('ceobe-dadada'), false, 'active clip blocks another sound');
      source.onended();
      assert.equal(await a.chatNotification('ceobe-dadada'), false, 'cooldown applies across sound choices');
      const nextAt = a.chatNextAt;
      a.setVolumes({chatCooldown: 31});
      assert.equal(a.chatNextAt - a.chatLastStartedAt, 5000, 'shared setting controls cooldown');
      a.setVolumes({chatCooldown: 4});
      assert.equal(a.chatNextAt - a.chatLastStartedAt, 4000, 'changing shared setting updates current cooldown');
      assert.notEqual(a.chatNextAt, nextAt);
      const beforePreview = a.chatNextAt;
      assert.equal(await a.chatNotification('ceobe-dadada', {preview: true}), true);
      assert.equal(a.chatNextAt, beforePreview, 'preview does not reset the notification cooldown');
      a.setVolumes({chatVolume: 0});
      assert.equal(a.chatNode, null);
      assert.equal(await a.chatNotification('ceobe-dadada', {preview: true}), false);
      a.setVolumes({chatVolume: 1, muted: true});
      assert.equal(await a.chatNotification('ceobe-dadada', {preview: true}), false);
      a.setVolumes({muted: false}); fw.win.document.hidden = true;
      assert.equal(await a.chatNotification('ceobe-dadada', {preview: true}), false);
    } finally { globalThis.fetch = originalFetch; }
  });
  test('turning chat off during a download cancels pending playback', async () => {
    const fw = fakeWindow();
    let resolveBuffer;
    const a = new AudioManager({win: fw.win, getManifest: () => null});
    a._buffer = () => new Promise(resolve => { resolveBuffer = resolve; });
    a.install(); fw.fire('pointerdown');
    const pending = a.chatNotification('kroos-kokodayo');
    a.setVolumes({chatSound: 'off'});
    resolveBuffer({duration: 2.9});
    assert.equal(await pending, false);
    assert.equal(a.chatNode, null);
  });
  test('no AudioContext / no manifest: every call is a silent no-op', () => {
    const a = new AudioManager({ win: null, getManifest: () => null });
    a.install();
    a.playBgm('prep');
    a.sfx('buy');
    a.battle('enemyDie');
    assert.equal(a.unit('char_x', 'attack', 1), false);
    a.handleBattleEvents([['atk', 1, 2, 'arrow'], 'junk', null]);
    a.setVolumes({ bgm: 5, sfx: -1, muted: true });
    assert.deepEqual(a.volumes, { bgm: 1, sfx: 0, voice: 0.6, voiceLanguage:'kr', chatVolume: 0.5, muted: true });
    assert.equal(a.unlocked, false);
  });
  test('unlocks on the first gesture, then plays BGM and SFX from the manifest', async () => {
    const fw = fakeWindow();
    const origFetch = globalThis.fetch;
    const urls = [];
    globalThis.fetch = async (u) => { urls.push(u); return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) }; };
    try {
      const a = new AudioManager({ win: fw.win, getManifest: () => manifest });
      a.install();
      a.playBgm('prep'); // remembered while locked
      assert.equal(urls.length, 0);
      fw.fire('pointerdown');
      assert.equal(a.unlocked, true);
      await new Promise((r) => setTimeout(r, 10));
      assert.ok(asked(urls, manifest.audio.bgm.prep.loop), 'BGM fetched after unlock');
      a.sfx('buy');
      a.sfx('nonexistent');
      await new Promise((r) => setTimeout(r, 10));
      assert.ok(asked(urls, manifest.audio.sfx.ui.buy));
      // same loop URL ⇒ no restart
      const before = fw.made.started;
      a.playBgm('combat');
      await new Promise((r) => setTimeout(r, 10));
      assert.equal(fw.made.started, before, 'prep → combat shares the loop');
      // battle events map to unit sounds (UnitInfo.spine = char id)
      const charId = Object.keys(manifest.audio.sfx.units).find((k) => k.startsWith('char_') && normalAttackSfx(k, manifest.audio.sfx.units[k].attack));
      a.setFieldUnits([{ id: 1, side: 'ally', spine: charId }, { id: 2, side: 'enemy', spine: 'enemy_nope' }]);
      a.handleBattleEvents([['atk', 1, 2, 'arrow'], ['dmg', 2, 100, 'phys'], ['die', 2], ['spawn', { id: 3, side: 'enemy', spine: 'x' }], ['bounty', 'p', 1]]);
      await new Promise((r) => setTimeout(r, 10));
      assert.ok(asked(urls, manifest.audio.sfx.units[charId].attack));
      assert.ok(asked(urls, manifest.audio.sfx.battle.enemyDie), 'fallback death sound');
      assert.ok(a.limiter.active <= a.limiter.maxVoices);
      a.setVolumes({ muted: true });
      const n = urls.length;
      a.sfx('refresh');
      assert.equal(urls.length, n, 'muted ⇒ nothing requested');
    } finally {
      globalThis.fetch = origFetch;
    }
  });
  test('fetch failures are swallowed', async () => {
    const fw = fakeWindow();
    const origFetch = globalThis.fetch;
    globalThis.fetch = async () => { throw new Error('offline'); };
    const origWarn = console.warn;
    let warns = 0;
    console.warn = () => { warns++; };
    try {
      const a = new AudioManager({ win: fw.win, getManifest: () => manifest });
      a.install();
      fw.fire('keydown');
      a.playBgm('lobby');
      a.sfx('buy');
      a.sfx('buy');
      await new Promise((r) => setTimeout(r, 20));
      assert.ok(warns >= 1);
    } finally {
      globalThis.fetch = origFetch;
      console.warn = origWarn;
    }
  });
  test('音频先走无扩展名的 /media/ 路由；只有它 404 才回退到带扩展名的原地址', async () => {
    const raw = manifest.audio.bgm.prep.loop;
    const media = mediaUrl(raw);
    assert.notEqual(media, raw, '前提：manifest 地址确实会被换算成 /media/ 路径');

    // 第一发 404：必须看到 /media/ 在前、原地址在后，两者都请求过
    {
      const fw = fakeWindow();
      const urls = [];
      const origFetch = globalThis.fetch;
      globalThis.fetch = async (u) => {
        urls.push(u);
        return u === media ? { ok: false, status: 404 } : { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
      };
      try {
        const a = new AudioManager({ win: fw.win, getManifest: () => manifest });
        a.install();
        fw.fire('pointerdown');
        a.playBgm('prep');
        await new Promise((r) => setTimeout(r, 25));
        const first = urls.indexOf(media);
        const fallback = urls.indexOf(raw);
        assert.ok(first !== -1, '先试无扩展名路径');
        assert.ok(fallback !== -1, '404 后回退到原地址');
        assert.ok(first < fallback, '顺序必须是先 /media/ 再原地址');
      } finally { globalThis.fetch = origFetch; }
    }

    // 第一发 200：不该再去碰带扩展名的地址（否则白白多一次请求，也正是 IDM 会拦的那个 URL）
    {
      const fw = fakeWindow();
      const urls = [];
      const origFetch = globalThis.fetch;
      globalThis.fetch = async (u) => { urls.push(u); return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) }; };
      try {
        const a = new AudioManager({ win: fw.win, getManifest: () => manifest });
        a.install();
        fw.fire('pointerdown');
        a.playBgm('prep');
        await new Promise((r) => setTimeout(r, 25));
        assert.ok(urls.includes(media), '走了 /media/');
        assert.ok(!urls.includes(raw), '/media/ 成功就不该再请求 .mp3 地址');
      } finally { globalThis.fetch = origFetch; }
    }

    // 第一发 200 但内容不是音频：有些静态托管对不存在的路径回 200 + index.html，解码会静默失败，也要回退。
    {
      const fw = fakeWindow();
      const urls = [];
      let cancelled = 0;
      const origFetch = globalThis.fetch;
      globalThis.fetch = async (u) => {
        urls.push(u);
        if (u !== media) return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
        return {
          ok: true,
          status: 200,
          headers: { get: (n) => (n.toLowerCase() === 'content-type' ? 'text/html; charset=utf-8' : null) },
          body: { cancel: async () => { cancelled += 1; } },
          arrayBuffer: async () => new ArrayBuffer(8),
        };
      };
      try {
        const a = new AudioManager({ win: fw.win, getManifest: () => manifest });
        a.install();
        fw.fire('pointerdown');
        a.playBgm('prep');
        await new Promise((r) => setTimeout(r, 25));
        assert.ok(urls.includes(raw), '内容不是音频时回退到原地址');
        assert.equal(cancelled, 1, '丢掉那个用不上的响应，别把连接挂着');
      } finally { globalThis.fetch = origFetch; }
    }

    // /media/ 直接给出 audio/*（服务端真实行为）：不回退，也不去 cancel 一个能用的响应
    {
      const fw = fakeWindow();
      const urls = [];
      let cancelled = 0;
      const origFetch = globalThis.fetch;
      globalThis.fetch = async (u) => {
        urls.push(u);
        return {
          ok: true,
          status: 200,
          headers: { get: (n) => (n.toLowerCase() === 'content-type' ? 'audio/mpeg' : null) },
          body: { cancel: async () => { cancelled += 1; } },
          arrayBuffer: async () => new ArrayBuffer(8),
        };
      };
      try {
        const a = new AudioManager({ win: fw.win, getManifest: () => manifest });
        a.install();
        fw.fire('pointerdown');
        a.playBgm('prep');
        await new Promise((r) => setTimeout(r, 25));
        assert.ok(urls.includes(media));
        assert.ok(!urls.includes(raw), 'audio/* 就是成功，不该再回退');
        assert.equal(cancelled, 0);
      } finally { globalThis.fetch = origFetch; }
    }
  });
});

// user playtest #4 item 6: 纯烬艾雅法拉's skill sound rang outside her skill — her manifest `hit` is her S3 impact
// (p_imp_gtshpbrnch_s, the audio bank ON_ABILITY_HIT.attack.2) and every damage on an ally she had just healed was
// attributed to her ('atk' healer → ally), so ordinary enemy hits on healed allies played it.
describe('impact sounds (user playtest #4 item 6)', () => {
  const AGOAT2 = 'char_1016_agoat2';
  async function rig(units) {
    const fw = fakeWindow();
    const urls = [];
    const origFetch = globalThis.fetch;
    globalThis.fetch = async (u) => { urls.push(u); return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) }; };
    const a = new AudioManager({ win: fw.win, getManifest: () => manifest });
    a.install();
    fw.fire('pointerdown');
    a.setFieldUnits(units);
    const settle = () => new Promise((r) => setTimeout(r, 5));
    return { a, urls, settle, restore: () => { globalThis.fetch = origFetch; } };
  }

  test('an operator never plays a skill-mode file (_d / _h / _s) as its normal attack or impact; enemies keep their _h', () => {
    const u = manifest.audio.sfx.units;
    // her impact: the S3 file (built before tools/assets/audio.mjs preferred normal-mode banks) is refused, the normal
    // one (projectile_chr_agoat2: p_imp_gtshpbrnch_n) plays
    assert.equal(normalAttackSfx(AGOAT2, '/assets/audio/sfx/player/p_imp/p_imp_gtshpbrnch_s.mp3'), false);
    assert.equal(normalAttackSfx(AGOAT2, '/assets/audio/sfx/player/p_imp/p_imp_gtshpbrnch_n.mp3'), true);
    if (u[AGOAT2].hit) assert.equal(normalAttackSfx(AGOAT2, u[AGOAT2].hit), !/_s\.mp3$/.test(u[AGOAT2].hit));
    assert.equal(normalAttackSfx(AGOAT2, u[AGOAT2].attack), true, 'p_atk_gtshpbrnch_n');
    assert.equal(normalAttackSfx('char_1014_nearl2', '/x/p_atk_goldspear_s.mp3'), false);
    assert.equal(normalAttackSfx('char_1028_texas2', '/x/p_imp_reticentsword_h.mp3'), false);
    assert.equal(normalAttackSfx('char_1045_svash2', '/x/p_atk_snwlprdg_n1.mp3'), true);
    assert.equal(normalAttackSfx('enemy_1045_hammer', '/x/e_atk_bigaxe_h.mp3'), true, 'enemy _h = heavy weapon');
    assert.equal(normalAttackSfx('char_x', null), false);
  });

  test('a heal never makes the healer the author of the next damage on the healed ally', async () => {
    const enemyId = Object.keys(manifest.audio.sfx.units).find((k) => k.startsWith('enemy_') && manifest.audio.sfx.units[k].hit);
    const { a, urls, settle, restore } = await rig([
      { id: 1, side: 'ally', kind: 'chess', spine: AGOAT2 }, { id: 2, side: 'ally', kind: 'chess', spine: 'char_x' },
      { id: 3, side: 'enemy', kind: 'enemy', spine: enemyId },
    ]);
    try {
      // 她的技能形态（_s）文件：这条断言要盯住它们一个都没响，所以先确认音效表里真的有 _s ——
      // 否则集合为空，断言会永远成立、形同虚设。
      const ownSkill = Object.values(manifest.audio.sfx.units[AGOAT2]).filter((x) => typeof x === 'string' && /_s\.mp3$/.test(x));
      assert.ok(ownSkill.length > 0, '前提：她的音效表里确实有 _s（技能形态）文件');
      a.handleBattleEvents([['atk', 1, 2, 'orb'], ['heal', 2, 300], ['dmg', 2, 120, 'phys'], ['dmg', 2, 80, 'arts']]);
      await settle();
      assert.ok(asked(urls, manifest.audio.sfx.units[AGOAT2].attack), 'her cast sound');
      assert.ok(!asked(urls, manifest.audio.sfx.units[AGOAT2].hit), 'no impact sound of hers on the ally');
      assert.ok(!ownSkill.some((p) => asked(urls, p)), 'nothing of her S3');
      // a hostile attack still authors its impact — once, and only for a real hit (not an element gauge fill)
      a.handleBattleEvents([['atk', 3, 2, 'none'], ['dmg', 2, 900, 'burn']]);
      await settle();
      assert.ok(!asked(urls, manifest.audio.sfx.units[enemyId].hit), 'a gauge fill is no impact');
      a.handleBattleEvents([['dmg', 2, 200, 'phys']]);
      await settle();
      assert.equal(askedCount(urls, manifest.audio.sfx.units[enemyId].hit), 1, 'the impact');
      a.limiter.lastByUnit.clear(); a.limiter.lastByUrl.clear();
      a.handleBattleEvents([['dmg', 2, 50, 'phys']]);
      await settle();
      assert.equal(askedCount(urls, manifest.audio.sfx.units[enemyId].hit), 1, 'a later tick is not the same attack\'s impact');
    } finally { restore(); }
  });

  test('a chain bounce plays no attack sound of the previous target; a stale attack is no impact', async () => {
    const enemyId = Object.keys(manifest.audio.sfx.units).find((k) => k.startsWith('enemy_') && manifest.audio.sfx.units[k].attack && manifest.audio.sfx.units[k].hit);
    const charId = Object.keys(manifest.audio.sfx.units).find((k) => k.startsWith('char_') && normalAttackSfx(k, manifest.audio.sfx.units[k].hit) && manifest.audio.sfx.units[k].hit);
    const { a, urls, settle, restore } = await rig([
      { id: 1, side: 'ally', kind: 'chess', spine: charId }, { id: 5, side: 'enemy', kind: 'enemy', spine: enemyId },
      { id: 6, side: 'enemy', kind: 'enemy', spine: enemyId },
    ]);
    const perf = globalThis.performance;
    let fakeNow = 1000;
    globalThis.performance = { now: () => fakeNow };
    try {
      a.handleBattleEvents([['atk', 5, 6, 'chain']]);
      await settle();
      assert.ok(!asked(urls, manifest.audio.sfx.units[enemyId].attack), 'the bounce is not an enemy attack');
      a.handleBattleEvents([['atk', 1, 5, 'arrow']]);
      fakeNow += 4000;
      a.handleBattleEvents([['dmg', 5, 100, 'phys']]);
      await settle();
      assert.ok(!asked(urls, manifest.audio.sfx.units[charId].hit), '4 s later: not that attack\'s impact');
    } finally { globalThis.performance = perf; restore(); }
  });
});

describe('official KR/JP operator voices',()=>{
  test('equal-priority active skills interrupt; passive skills obey their 10 second cooldown',()=>{
    const g=new VoiceGate();g.start('skill1',1,0);
    assert.equal(g.request('skill2',2,10),'preempt');
    assert.equal(g.request('select',1,10),'drop');
    g.reset();g.start('passiveImp',1,0);g.release();
    assert.equal(g.request('passiveImp',1,9999),'drop');
    assert.equal(g.request('passiveImp',1,10000),'play');
  });
  test('language switching picks official bank and stops the old voice before playback',async()=>{
    const fw=fakeWindow(),saved=globalThis.fetch;
    globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
    try{
      const m={audio:{voice:{kr:{char_test:{select:['/kr.mp3']}},jp:{char_test:{select:['/jp.mp3']}}}}};
      const a=new AudioManager({win:fw.win,getManifest:()=>m});a.install();fw.fire('pointerdown');await new Promise(r=>setTimeout(r,10));
      a.setVolumes({voiceLanguage:'kr'});assert.equal(a.voice('char_test','select'),true);
      await new Promise(r=>setTimeout(r,10));assert.equal(a.voiceNode.url,'/kr.mp3');
      const old=a.voiceNode;let stopped=false;old.src.stop=()=>{stopped=true};
      a.setVolumes({voiceLanguage:'jp'});assert.equal(a.voice('char_test','select'),true);
      assert.equal(stopped,true);await new Promise(r=>setTimeout(r,10));assert.equal(a.voiceNode.url,'/jp.mp3');
      a.setVolumes({muted:true});assert.equal(a.voiceNode,null);
      a._stopVoice();
    }finally{globalThis.fetch=saved}
  });
});

test('voice prewarming waits for gesture and shares decoded buffers with playback', async () => {
  const fw = fakeWindow();
  const old = globalThis.fetch, urls = [];
  globalThis.fetch = async url => { urls.push(url); return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}; };
  try {
    const a = new AudioManager({win:fw.win,getManifest:()=>({audio:{voice:{kr:{char_test:{select:['/assets/audio/test-select.mp3'],place:'/assets/audio/test-place.mp3'}}}}})});
    a.install(); a.warmVoices(['char_test']);
    assert.equal(urls.length,0);
    fw.fire('pointerdown');
    await new Promise(r=>setTimeout(r,20));
    assert.equal(urls.length,2);
    assert.equal(fw.made.started,0,'prewarming does not speak');
    a.voice('char_test','select');
    await new Promise(r=>setTimeout(r,20));
    assert.equal(urls.length,2,'click reuses decoded audio without another request');
    assert.ok(fw.made.started>0);
  } finally {globalThis.fetch=old;}
});

test('BGM coalesces pending same-track requests and keeps its loop alive',async()=>{
 const fw=fakeWindow(), a=new AudioManager({win:fw.win,getManifest:()=>manifest});
 a.install();fw.fire('pointerdown');
 let release; const pending=new Promise(r=>release=r); let calls=0;
 a._buffer=()=>{calls++;return pending;};
 a.playBgm('prep');const count=calls;
 for(let i=0;i<20;i++)a.playBgm('prep');
 assert.equal(calls,count,'room/private updates must not cancel and decode the same loading track');
 release({duration:3});await new Promise(r=>setTimeout(r,0));
 assert.ok(a.bgm);const loop=a.bgm.nodes.at(-1).src;
 assert.equal(loop.loop,true);assert.equal(loop.loopStart,0);assert.equal(loop.loopEnd,3);
 const starts=fw.made.started;for(let i=0;i<20;i++)a.playBgm('prep');
 assert.equal(fw.made.started,starts,'playing track is never restarted by state updates');
});

test('preparation uses rest music even when a round combat track is selected',()=>{
 for(const round of [1,7,8,12]){const track=combatTrackFor(round);
  const combat=bgmKeyFor('game',{phase:PHASE.COMBAT},track);
  assert.equal(bgmKeyFor('game',{phase:PHASE.PREP},track),'prep');
  assert.equal(bgmKeyFor('game',{phase:PHASE.SP_DRAFT},track),'prep');
 }
});

test('a skill without its own bank never borrows the sound of another equipped skill',()=>{
 const played=[];const a=new AudioManager({getManifest:()=>({audio:{sfx:{units:{char_test:{skill:'/other.mp3',skills:{0:null,1:'/correct.mp3'}}}}}})});
 a._play=(url)=>played.push(url);
 assert.equal(a.unit('char_test','skill',1,0),false);assert.deepEqual(played,[]);
 assert.equal(a.unit('char_test','skill',1,1),true);assert.deepEqual(played,['/correct.mp3']);
});

test('battle-start voice randomly selects the field lineup and only fires once',()=>{
 const a=new AudioManager({getManifest:()=>manifest,random:()=>.99});
 a.setFieldUnits([{id:1,side:'ally',kind:'op',spine:'char_first'}, {id:2,side:'ally',kind:'op',spine:'char_last'}, {id:3,side:'enemy',kind:'op',spine:'char_enemy'}]);
 a.ctx={};const lines=[];a.voice=(def,slot)=>{lines.push([def,slot]);return true;};
 a.handleBattleEvents([['deploy',1],['deploy',2]]);
 assert.deepEqual(lines,[['char_last','start'],['char_last','place']]);
});

test('imperial drone warning is quieter and ends when the vertical drop starts at any playback speed',()=>{
 const a=new AudioManager({getManifest:()=>({audio:{sfx:{battle:{droneAim:'/aim.mp3'}}}})});a.ctx={};const calls=[];a.battle=(name,options)=>calls.push({name,...options});
 a.handleBattleEvents([['fx','bombardShell',4,10,{id:7,vertical:true,t:3}]],{rate:2});
 const aim=calls.find(x=>x.name==='droneAim');assert.equal(aim.volume,.22);assert.equal(aim.maxDuration,1.28);
});
test('warning audio stop deadline includes decoding time, preventing a delayed warning during the fall',async()=>{
 const a=new AudioManager();let resolve;const calls=[];
 a.ctx={currentTime:5,createBufferSource:()=>({playbackRate:{},connect(){},start(){calls.push('start');},stop(t){calls.push(t);}}),createGain:()=>({gain:{},connect(){},disconnect(){}})};
 a._buffer=()=>new Promise(r=>resolve=r);a._play('/aim',{maxDuration:1});a.ctx.currentTime=6.1;resolve({duration:.01});await new Promise(r=>setImmediate(r));assert.deepEqual(calls,[]);
 a.ctx.currentTime=7;a._play('/aim',{maxDuration:1});resolve({duration:.01});await new Promise(r=>setImmediate(r));assert.deepEqual(calls,['start',8]);
});

// =====================================================================================================================
// 漏怪 sound (user request "接下来加漏怪的音效", then "应该是原版明日方舟关卡中的怪进蓝门的音效"). The sim emits
// `['leak', id]` when an enemy reaches its goal (Battle.leak) — NOT a `die` — so until now an escape was completely
// silent, for the player's own field and for a 联防 the helpers could not hold alike.
//
// The cue is the ORIGINAL Arknights stage alarm an enemy entering the exit plays in any normal stage: the manifest's
// `sfx.battle.leak`, bank `battle.ON_ENEMY_REACHED_EXIT`, file `Battle/b_ui/b_ui_alarmenter`. (The autochess banks
// have nothing named for an escape — all 13,948 SFX banks searched — but the stage itself does.) The official bank is
// a one-shot: `maxSoundAllowed: 1` with `popOldest: true` on the `Battle_UI_Important` mixer.

describe('漏怪 sound', () => {
  async function rig() {
    const fw = fakeWindow();
    const urls = [];
    const origFetch = globalThis.fetch;
    globalThis.fetch = async (u) => { urls.push(u); return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) }; };
    const a = new AudioManager({ win: fw.win, getManifest: () => manifest });
    a.install();
    fw.fire('pointerdown');
    const settle = () => new Promise((r) => setTimeout(r, 10));
    return { a, fw, urls, settle, restore: () => { globalThis.fetch = origFetch; } };
  }

  test('an escaped enemy plays the original stage exit alarm — and no death sound (a leak is not a `die`)', async () => {
    const { a, urls, settle, restore } = await rig();
    try {
      const url = manifest.audio.sfx.battle.leak;
      assert.ok(url, '前提：清单里有 sfx.battle.leak');
      assert.match(url, /b_ui_alarmenter\.mp3$/, '就是原版关卡里怪进蓝门那一声');
      a.handleBattleEvents([['leak', 7]]);
      await settle();
      assert.ok(asked(urls, url), `漏怪 plays ${url}`);
      assert.equal(askedCount(urls, manifest.audio.sfx.battle.enemyDie), 0, 'a leak is not a death — no death sound');
    } finally { restore(); }
  });

  test('leaks of one disaster are ONE alarm (the cue is 1.44 s long), a later one rings again', async () => {
    const { a, fw, urls, settle, restore } = await rig();
    try {
      const url = manifest.audio.sfx.battle.leak;
      a.handleBattleEvents([['leak', 1]]);
      await settle();
      assert.equal(askedCount(urls, url), 1, 'the first escape rings');
      // the plays themselves, not the fetches: the buffer is cached after the first one
      const before = fw.made.started;
      // six more at once — a wiped board, or a 联防 the helpers could not hold
      a.handleBattleEvents([['leak', 2], ['leak', 3], ['leak', 4], ['leak', 5], ['leak', 6], ['leak', 7]]);
      await settle();
      assert.equal(fw.made.started - before, 0, 'one disaster never stacks alarms (the official bank allows 1)');
      // a genuine later leak is a new disaster and rings again, once the cue (1.44 s) has finished
      await new Promise((r) => setTimeout(r, 1600));
      a.handleBattleEvents([['leak', 8]]);
      await settle();
      assert.equal(fw.made.started - before, 1, 'a later leak rings again');
      assert.ok(a.limiter.active <= a.limiter.maxVoices);
    } finally { restore(); }
  });
});
