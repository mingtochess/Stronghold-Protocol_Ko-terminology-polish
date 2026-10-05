import {skillIsStance,selectedSkillClip} from '../../../shared/attackTiming.js';
// render/spine.js — Spine battle chibi wrapper + animation state machine (research 07 §5.4–5.5, ASSETS.md Roles).
//
// SpineActor owns one PIXI.spine.Spine built from cached skeleton data (assets.spine LRU; the instance never
// owns the atlas, so destroying it never frees shared textures). Animation roles come from the manifest
// (`anims`: idle, deploy, attack{begin,loop,end}, attackDown, skill{begin,loop,end,idle}, die, move, stun).
//
// Driving (units.js calls these; the sim is authoritative, the actor only visualises):
//   setBase('idle'|'move'|'stun')        the resting state from the snapshot anim code
//   attack(interval, once)                one attack happened now (b.ev 'atk'): plays begin→loop, re-phases the loop
//                                         so its OnAttack frame lands now, timeScale = loopDuration / interval;
//                                         `once` (a one-off cast, style.js PROJ[kind].once — 暴鸰's bomb drop): the
//                                         clip plays once at its own speed, then base; `clipPerAttack` (enemies,
//                                         GitHub #58): every attack plays the clip once — at its own speed, faster
//                                         only when the attacks come quicker than the clip —, then base (Move while
//                                         the sim walks it: it stands for that clip, server/sim/ai.js attackStand)
//   setSkill(on)                          skill begin, then — when the skill has an idle clip of its own (skill.idle,
//                                         not its loop) — that idle between attacks, its loop (the skill's attack clip)
//                                         only on attacks (community report #23: 折桠's S2 jump attack looped with no
//                                         enemy engaged); a skill without one keeps its loop as the stance; end on stop
//   deploy()                              'Start' once, then base
//   die()                                 die clip once (callers fade out afterwards); a skeleton without one holds its
//                                         idle clip's first frame (GitHub issue #25: the attack loop went on)
//   stunned (setBase('stun'))             stun clip, or the current track frozen at timeScale 0
//   setForm(roles, change, end)           another clip set of the skeleton (an enemy's mode, a 傀儡师's 替身), after a change clip
//                                         (no attack cuts the change clip short); `end` = { clip, in, roles? }: a
//                                         closing clip timed to end `in` s from now (a 重生's last clip ends with the
//                                         重生), landing in `roles`
//   update(dt)                            advances the skeleton (autoUpdate is off: one clock for everything)
// Attack mode lasts until ~1.4 attack intervals without a new attack (a `once` cast and every attack of a
// `clipPerAttack` actor: to the end of its clip), then the end clip (if any) and base — except the attacks of a skill
// with its own idle clip, which go straight back to that idle: the skill's end clip closes the skill, not each spell of
// attacks while it runs.

const clampN = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

/** Longest wind-up compression (× the rhythm speed) when the look-ahead is shorter than the natural wind-up. */
export const MAX_WIND_SPEEDUP = 2.5;

/**
 * Attack clip timing (pure). `loopDur` / `hit` are clip seconds (strike frame at `hit`), `interval` and `lead` game
 * seconds. The clip plays at `ts = loopDur / interval` (one loop per attack); started `lead` before the attack it
 * reaches the strike frame on time: from `start = hit − lead·ts` at `ts` when little of the wind-up is lost,
 * otherwise from (nearly) the beginning at up to MAX_WIND_SPEEDUP × ts (`tsWind`).
 * @returns {{ ts: number, tsWind: number, start: number }}
 */
export function windUpPlan(loopDur, hit, interval, lead) {
  const ts = clampN(loopDur / Math.max(0.08, interval), 0.35, 4);
  const L = Math.max(0, lead);
  let start = Math.max(0, hit - L * ts), tsWind = ts;
  if (start > hit * 0.15 && L > 0) {
    tsWind = Math.min(ts * MAX_WIND_SPEEDUP, hit / L);
    start = Math.max(0, hit - L * tsWind);
  }
  return { ts, tsWind, start };
}

/** Whether any skin of the skeleton data has a clipping attachment (pixi-spine AttachmentType.Clipping = 6). */
export function hasClipping(data) {
  try {
    for (const skin of data?.skins || []) {
      const list = typeof skin.getAttachments === 'function' ? skin.getAttachments() : [];
      for (const e of list) {
        const a = e && e.attachment;
        if (a && (a.type === 6 || a.constructor?.name === 'ClippingAttachment' || ('endSlot' in a && 'vertices' in a && !('uvs' in a)))) return true;
      }
    }
  } catch { /* unknown runtime shape: assume none */ }
  return false;
}

export class SpineActor {
  /**
   * @param {any} spineData PIXI.spine skeleton data
   * @param {object} entry manifest Spine entry (anims, animations, hits, bounds, pma)
   */
  constructor(spineData, entry) {
    const P = globalThis.PIXI;
    this.entry = entry;
    this.roles = entry.anims || {};
    this.durations = entry.animations || {};
    this.spine = new P.spine.Spine(spineData);
    this.spine.autoUpdate = false;
    this.names = new Set((spineData.animations || []).map((a) => a.name));
    /**
     * Clipping attachments render as stencil masks (≈1.5 ms of GPU each per frame on tiled GPUs): such skeletons
     * are drawn through the impostor atlas while clipping is on, and clipping is switched off (unclipped slots,
     * visually negligible on battle chibis) when too many of them share a field (app.js budget).
     */
    this.clipped = hasClipping(spineData);
    this.clipOn = true;
    if (this.clipped) {
      const sp = this.spine;
      const orig = typeof sp.createGraphics === 'function' ? sp.createGraphics.bind(sp) : null;
      if (orig) sp.createGraphics = (slot, att) => { const g = orig(slot, att); if (!this.clipOn && slot.clippingContainer) { slot.clippingContainer.mask = null; g.renderable = false; } return g; };
    }
    try { this.spine.stateData.defaultMix = 0.12; } catch { /* ignore */ }
    this.base = 'idle';
    this.mode = 'base';           // base | attack | skillBegin | deploy | die | stun | change
    this.endClip = null;          // setForm's closing clip, played as a change clip once the clock reaches endAt,
    this.endAt = 0;               // landing in endRoles (the next form's) when given
    this.endRoles = null;
    this.skillOn = false;
    this.attackUntil = 0;
    this.clock = 0;
    this.current = '';
    this.frozen = false;
    this.dead = false;
    this.interval = 1;
    /**
     * Enemies (render/units.js, GitHub #58): each attack plays the attack clip once — at its own speed, faster only when
     * the attacks come quicker than the clip — and then the resting state; the sim stands the enemy for exactly that
     * clip (server/sim/ai.js attackStand). Off (operators): the clip loops over the attack rhythm.
     */
    this.clipPerAttack = false;
    this.wound = false;           // clipPerAttack: wound up for the coming attack (windUp → attack)
    this._play(this._idleName(), true);
  }

  /** Enable / disable the skeleton's clipping masks. */
  setClipping(on) {
    on = !!on;
    if (!this.clipped || on === this.clipOn) return;
    this.clipOn = on;
    for (const slot of this.spine?.skeleton?.slots || []) {
      if (!slot.clippingContainer) continue;
      slot.clippingContainer.mask = on ? slot.currentGraphics || null : null;
      // PIXI makes a released mask renderable again: the clip polygon must never draw as a white shape
      if (slot.currentGraphics) slot.currentGraphics.renderable = false;
    }
  }

  /**
   * The equipped skill (DESIGN §16 loadout, UnitInfo.skillIndex): its own Spine clip when the model has one per skill
   * index (`anims.skills`), else the primary skill's clip.
   * @param {number|undefined} index 0-based skill index
   */
  setSkillIndex(index) {
    const anims = this.entry?.anims || {};
    const clip = Number.isInteger(index) && anims.skills ? selectedSkillClip(this.entry,index) : null;
    this.roles = this.baseRoles = Number.isInteger(index) && anims.skills ? { ...anims, skill: clip || null } : anims;
  }

  /** Compose authored state attachments with the default skin; never drop the unit's body. */
  setVisualStates(states) {
    const skeleton = this.spine?.skeleton;
    const skins = skeleton?.data?.skins || [];
    const base = skeleton?.data?.defaultSkin || skins.find(s=>s.name==='default');
    const aliases = {stun:['stun','stunned'],sleep:['sleep'],invuln:['invuln','invincible'],freeze:['freeze','frozen'],cold:['cold'],burn:['burn','burning'],poison:['poison'],rage:['rage','angry','enrage','berserk','lowhp'],shield:['shield'],refraction:['refraction'],stealth:['stealth','invisible']};
    const chosen = [];
    for (const state of states || []) {
      const names = aliases[state] || (/^skill[123]$/.test(state) ? [state,state.replace('skill','skill_')] : [state]);
      const skin = skins.find(s=>names.includes(String(s.name).toLowerCase()));
      if (skin && skin !== base && !chosen.includes(skin)) chosen.push(skin);
    }
    const key = chosen.map(s=>s.name).sort().join('|');
    if (key === this.visualSkinKey) return chosen.length > 0;
    this.visualSkinKey = key;
    if (!base || typeof base.addSkin !== 'function') return false;
    const composite = new base.constructor('runtime-state');
    composite.addSkin(base);
    for (const skin of chosen) composite.addSkin(skin);
    skeleton.setSkin(composite);
    skeleton.setSlotsToSetupPose();
    this.spine.state?.apply?.(skeleton);
    return chosen.length > 0;
  }

  /** The unit's own roles: the manifest's with its equipped skill's clip (setSkillIndex) — what a form ends in. */
  _baseRoles() { return this.baseRoles || this.entry?.anims || {}; }

  /**
   * Another clip set of the same skeleton — an enemy's mode (render/units.js FORMS: 掠海漂移体's 爬行模式 plays its *_02
   * clips), a 傀儡师's 替身: `roles` override the unit's own roles (null = back to them — the equipped skill's clip
   * included); `change` = a transition clip played once first (also while stunned: the pose it ends in is the one a stun
   * then holds). `end` = { clip, in, roles? } (game s): a closing clip played the same way so that it ends `in` s from
   * now, landing in `roles` — a leader's 重生 ends on its last clip while the sim still holds it, and the next form
   * starts on its own clips.
   */
  setForm(roles, change = null, end = null) {
    const anims = this._baseRoles();
    this.roles = roles ? { ...anims, ...roles } : anims;
    this.endClip = null;
    if (this.dead) return;
    if (end && this.has(end.clip) && end.in > 0) {
      this.endClip = end.clip;
      this.endAt = this.clock + Math.max(0, end.in - this.dur(end.clip));
      this.endRoles = end.roles || null;
    }
    if (change && this.has(change)) this._change(change);
    else if (this.mode === 'base') this._play(this._baseName(), true);
    else if (this.mode === 'stun' && this.has(this.roles.stun?.loop)) this._play(this.roles.stun.loop, true);
  }

  /** Play a form's transition clip once; attacks and the resting state wait for it (mode 'change'). */
  _change(clip) {
    if (this.mode !== 'change') this.stunWanted = this.mode === 'stun';
    this.frozen = false;
    this.mode = 'change';
    this._play(clip, false, { mix: 0.08 });
    this.changeUntil = this.clock + this.dur(clip);
  }

  has(name) { return !!name && this.names.has(name); }
  dur(name) { const d = this.durations[name]; return typeof d === 'number' && d > 0 ? d : this._durFromData(name); }

  _durFromData(name) {
    try { const a = this.spine.spineData.findAnimation(name); return a && a.duration > 0 ? a.duration : 1; } catch { return 1; }
  }

  _idleName() {
    const sk = this.roles.skill;
    if (this.skillOn && sk && this.has(sk.idle)) return sk.idle;
    if (this.skillOn && sk && skillIsStance(this.entry,sk) && this.has(sk.loop)) return sk.loop;
    return this.has(this.roles.idle) ? this.roles.idle : (this.has('Idle') ? 'Idle' : [...this.names][0]);
  }

  _baseName() {
    if (this.base === 'move') {
      const mv = this.roles.move;
      if (mv && this.has(mv.loop)) return mv.loop;
    }
    return this._idleName();
  }

  _play(name, loop, { timeScale = 1, mix, track = 0, start = 0 } = {}) {
    if (!this.has(name)) return false;
    const st = this.spine.state;
    const e = st.setAnimation(track, name, loop);
    if (e) {
      e.timeScale = timeScale;
      if (mix != null) e.mixDuration = mix;
      if (start) e.trackTime = start;
    }
    this.current = name;
    return true;
  }

  _queue(name, loop, timeScale = 1) {
    if (!this.has(name)) return false;
    const e = this.spine.state.addAnimation(0, name, loop, 0);
    if (e) {e.timeScale = timeScale;e.mixDuration=Math.min(.18,this.dur(name)*.25);}
    return true;
  }

  /** Resting state from the snapshot. */
  setBase(base) {
    if (this.dead) return;
    const b = base === 'move' || base === 'stun' ? base : 'idle';
    // a mode change clip plays out first; the resting state it lands in is remembered
    if (this.mode === 'change') { this.stunWanted = b === 'stun'; if (b !== 'stun') this.base = b; return; }
    if (b === 'stun') { this._enterStun(); return; }
    if (this.mode === 'stun') this._leaveStun();
    if (b === this.base && this.mode !== 'stun') return;
    this.base = b;
    if (this.mode === 'base') this._play(this._baseName(), true);
  }

  _enterStun() {
    if (this.mode === 'stun') return;
    this.mode = 'stun';
    const s = this.roles.stun;
    if (s && this.has(s.loop)) {
      if (this.has(s.begin)) { this._play(s.begin, false); this._queue(s.loop, true); }
      else this._play(s.loop, true);
    } else {
      this.frozen = true;
    }
  }

  _leaveStun() {
    this.frozen = false;
    this.mode = 'base';
    this._play(this._baseName(), true);
  }

  /**
   * An attack is due in `lead` game seconds (the renderer sees it ahead in the snapshot buffer): start the attack
   * clip from its wind-up so the strike frame lands when the attack event is rendered. Returns true once started;
   * false when it is still too early (call again next frame) or there is nothing to wind up.
   */
  windUp(interval, lead, once = false) {
    if (this.dead || this.mode === 'stun' || this.mode === 'die' || this.mode === 'change' || this.mode === 'skillCast' || this.mode === 'skillBegin' || !(lead >= 0)) return false;
    const clip = this._attackClip();
    if (!clip) return false;
    const single = once || this.clipPerAttack;
    // in rhythm: attack() re-phases; a clip-per-attack actor starts each attack's clip anew unless already wound up for it
    if (this.mode === 'attack' && this.current === clip.loop && (!this.clipPerAttack || once || this.wound)) return false;
    const loopDur = this.dur(clip.loop);
    // a one-off cast plays at the clip's own speed (one loop per clip length), whatever the attack rhythm
    const iv = once ? loopDur : clampN(Number.isFinite(interval) && interval > 0 ? interval : this.interval, 0.08, 8);
    const hit = this._hitTime(clip.loop, loopDur);
    // clip per attack: its own speed, sped up only when the attacks come quicker than the clip
    const plan = windUpPlan(loopDur, hit, this.clipPerAttack && !once ? Math.min(iv, loopDur) : iv, lead);
    if (!(hit > 0) || lead * plan.ts > hit + 1e-6) return false;
    if (!once) this.interval = iv;
    this.mode = 'attack';
    this.attackUntil = this.clock + lead + (single ? Math.max(0, loopDur - hit) / plan.ts : Math.max(0.45, iv * 1.4));
    this._play(clip.loop, !single, { timeScale: plan.tsWind, start: plan.start, mix: 0.06 });
    this.windTs = plan.ts;
    this.windUntil = this.clock + lead;
    this.wound = true;
    return true;
  }

  /** Explicit sim wind-up: retain the entire clip before its OnAttack frame. */
  beginAttack(interval, lead) {
    if (this.dead || this.mode === 'stun' || this.mode === 'die' || this.mode === 'change' || this.mode === 'skillCast' || this.mode === 'skillBegin') return false;
    const clip = this._attackClip(); if (!clip) return false;
    const dur = this.dur(clip.loop), hit = this._hitTime(clip.loop, dur);
    this.interval = clampN(interval, .08, 8);
    const ts = lead > 0 && hit > 0 ? hit / lead : Math.max(1, Math.min(4, dur / this.interval));
    this.mode = 'attack'; this.wound = true;
    this.windUntil = null;
    this.attackUntil = this.clock + lead + Math.max(0, dur - hit) / ts;
    this._play(clip.loop, false, { timeScale: ts, start: 0, mix: .04 });
    return true;
  }

  cancelAttack() {
    if (this.mode !== 'attack') return;
    this.wound = false; this.windUntil = null; this.mode = 'base';
    this._play(this._baseName(), true, { mix: .06 });
  }

  /**
   * An attack happened now. `interval` = seconds between attacks (game time already scaled to real); `once` = a one-off
   * cast (no rhythm): the clip plays once at its own speed from its strike frame, then the resting state.
   */
  attack(interval, once = false) {
    if (this.dead || this.mode === 'stun' || this.mode === 'die' || this.mode === 'change' || this.mode === 'skillCast' || this.mode === 'skillBegin') return;   // a form change plays out
    if (!once) this.interval = clampN(Number.isFinite(interval) && interval > 0 ? interval : this.interval, 0.08, 8);
    const clip = this._attackClip();
    if (!clip) return;
    const loopDur = this.dur(clip.loop);
    const per = this.clipPerAttack && !once;
    const single = once || per;
    // clip per attack: its own speed (ts 1), faster only when the attacks come quicker than the clip
    let ts = once ? 1 : per ? clampN(loopDur / Math.min(this.interval, loopDur), 1, 4) : clampN(loopDur / this.interval, 0.35, 4);
    const hit = this._hitTime(clip.loop, loopDur);
    // (a clip-per-attack actor still playing the previous attack's clip was not wound up for this one)
    // Preserve the clip's authored speed; attack-speed buffs may accelerate it.
    // Stretching only the recovery made fast attacks suddenly crawl.
    if(this.continuousAttacks && single && !once) ts = clampN(loopDur/Math.min(this.interval,loopDur),1,4);
    const wasAttacking = this.mode === 'attack' && this.current === clip.loop && (!per || this.wound);
    this.mode = 'attack';
    this.attackUntil = this.clock + (single ? Math.max(0, loopDur - hit) / ts : Math.max(0.45, this.interval * 1.4));
    this.windUntil = null;
    this.wound = false;
    if (!wasAttacking) {
      // not wound up (no look-ahead, e.g. a batch that arrived late): the sim already resolved the hit, so show
      // the strike frame now
      this._play(clip.loop, !single, { timeScale: ts, start: hit, mix: 0.06 });
    } else if (single) {
      const e = this.spine.state.tracks[0];
      if (e) e.timeScale = ts;
    } else {
      const e = this.spine.state.tracks[0];
      if (e) {
        e.timeScale = ts;
        // re-phase gently so the strike frame lines up with this attack
        const t = e.trackTime % loopDur;
        let d = hit - t;
        if (d > loopDur / 2) d -= loopDur; else if (d < -loopDur / 2) d += loopDur;
        e.trackTime += d * 0.8;
      }
    }
  }

  _attackClip() {
    const sk = this.roles.skill;
    if (this.skillOn && sk && this.has(sk.loop) && sk.via !== 'attack' && !this._skillIsBuffOnly()) return sk;
    const a = this.roles.attack;
    if (a && this.has(a.loop)) return a;
    return null;
  }

  // Skill loops that are pure stances (no OnAttack in the loop) are still valid attack visuals during a skill;
  // only an idle-typed skill loop is treated as buff-only.
  _skillIsBuffOnly() {
    const sk = this.roles.skill;
    return !!sk && (sk.loop === this.roles.idle || skillIsStance(this.entry,sk));
  }

  /**
   * The running skill's own idle clip when its attacks are its loop clip (anims skill.idle ≠ skill.loop: 折桠's
   * Skill_2_Idle beside the Skill_2_Loop jump attack, 史尔特尔's Skill_3_Idle, 耀骑士临光's Skill_3_Idle …): the pose
   * between its attacks. null otherwise — no skill on, no idle clip, or the loop is that idle (蕾缪安's S2 / S3).
   */
  _skillIdle() {
    const sk = this.roles.skill;
    if (!this.skillOn || !sk || sk.idle === sk.loop || !this.has(sk.idle)) return null;
    return this._attackClip() === sk ? sk.idle : null;
  }

  _hitTime(anim, dur) {
    const hits = this.entry.hits && this.entry.hits[anim];
    if (Array.isArray(hits) && hits.length && Number.isFinite(hits[0])) return clampN(hits[0], 0, dur);
    return dur * 0.5;
  }

  /** Skill active flag changed. */
  setSkill(on, {instant=false} = {}) {
    on = !!on;
    if (on === this.skillOn || this.dead) return;
    this.skillOn = on;
    const sk = this.roles.skill;
    if (this.mode === 'stun' || this.mode === 'die') return;
    // a skill that ends as the unit (re)deploys — 乌尔比安's 【返回】 is a 【移动】 (sim Battle.moveRedeploy) right before
    // his S3's 'skill' off event — lets the deploy clip play out (then the plain idle) instead of cutting it with the End
    if (!on && this.mode === 'deploy') return;
    if (!on && this.mode === 'skillCast') return;
    if (!on && this.mode === 'attack' && !this.wound && this.current === sk?.loop && this.clock < this.attackUntil) {
      this.pendingSkillEnd = true;
      return;
    }
    if (on && instant && sk && !sk.via && this.has(sk.loop)) {
      this.mode='skillCast';
      this._play(sk.begin || sk.loop,false,{mix:.12});
      if(sk.begin)this._queue(sk.loop,false);
      this.skillCastUntil=this.clock+(sk.begin?this.dur(sk.begin):0)+this.dur(sk.loop);
      return;
    }
    if (on && sk) {
      if (this.has(sk.begin)) {
        this.mode = 'skillBegin';
        this._play(sk.begin, false, { mix: 0.08 });
        this.skillBeginUntil = this.clock + this.dur(sk.begin);
        // then the skill's own idle until an attack plays its loop (community report #23); without one, the loop
        const next = this._skillIdle() || (this.has(sk.loop) ? sk.loop : null);
        if (next) this._queue(next, true);
      } else if (this.mode === 'base') this._play(this._baseName(), true);
    } else if (!on && sk) {
      if (this.has(sk.end)) {
        this.mode = 'skillEnd';
        this._play(sk.end, false, { mix: 0.08 });
        this.skillEndUntil = this.clock + this.dur(sk.end);
      } else {
        this.mode = 'base';
        this._play(this._baseName(), true);
      }
    }
  }

  deploy() {
    if (this.dead) return;
    const d = this.roles.deploy;
    if (this.has(d) && d !== this.roles.idle) {
      this.mode = 'deploy';
      this._play(d, false, { mix: 0 });
      this.deployAt = this.clock;
      this.deployUntil = this.clock + this.dur(d);
    }
  }

  /** Seconds into the deploy clip while it plays, else null (a model swapped mid-deploy carries it over: units.js). */
  deployElapsed() {
    return this.mode === 'deploy' ? Math.max(0, this.clock - (this.deployAt || 0)) : null;
  }

  /** The skeleton's death clip, or null. */
  dieClip() {
    const d = this.roles.die || (this.has('Die') ? 'Die' : null);
    return d && this.has(d) ? d : null;
  }

  /**
   * Play the death clip; returns its duration (0 when there is none). A skeleton without one (131 of the 135 Back
   * models, GitHub issue #25; a few idle-only summons and enemies) stops whatever looped — an attack, a skill or the idle —
   * and holds the first frame of its idle clip (frozen when it has none either) [ASSUMED look]: a dead unit never goes on attacking. A
   * knocked-out operator shows its fall with the Front model instead (render/units.js _wantsBack).
   */
  die() {
    if (this.dead) return 0;
    this.dead = true;
    this.frozen = false;
    this.mode = 'die';
    const d = this.dieClip();
    if (d) { this._play(d, false, { mix: 0.05 }); return this.dur(d); }
    const idle = this.has(this.roles.idle) ? this.roles.idle : this.has('Idle') ? 'Idle' : null;
    if (idle) this._play(idle, false, { mix: 0.1, timeScale: 0 });
    else this.frozen = true;
    return 0;
  }

  /** Revive (redeploy after death). */
  revive() {
    this.dead = false;
    this.frozen = false;
    this.mode = 'base';
    this.skillOn = false;
    this._play(this._baseName(), true);
  }

  update(dt) {
    if (!(dt > 0)) return;
    this.clock += dt;
    if (this.endClip && this.clock >= this.endAt) {
      const clip = this.endClip;
      this.endClip = null;
      if (this.endRoles) this.roles = { ...this._baseRoles(), ...this.endRoles };
      if (!this.dead) this._change(clip);
    }
    if (this.windUntil != null && this.clock >= this.windUntil) {
      // a compressed wind-up reached its strike frame: back to the rhythm speed (attack() also does it)
      this.windUntil = null;
      const e = this.spine.state.tracks[0];
      if (e && this.mode === 'attack') e.timeScale = this.windTs;
    }
    switch (this.mode) {
      case 'attack':
        if (this.clock > this.attackUntil) {
          if (this.pendingSkillEnd) {
            this.pendingSkillEnd = false;
            this.mode = 'base'; this.skillOn = true; this.setSkill(false);
            break;
          }
          this.mode = 'base';
          this.wound = false;
          const clip = this._attackClip() || this.roles.attack;
          // a skill with its own idle: back to that idle (its end clip is for the end of the skill, setSkill(false))
          const toSkillIdle = clip === this.roles.skill && !!this._skillIdle();
          if (clip && this.has(clip.end) && !toSkillIdle) { this._play(clip.end, false); this._queue(this._baseName(), true); }
          else this._play(this._baseName(), true, { mix: 0.15 });
        }
        break;
      case 'skillBegin':
        if (this.clock >= this.skillBeginUntil) { this.mode = 'base'; if (!this.has(this.roles.skill?.loop)) this._play(this._baseName(), true); }
        break;
      case 'skillCast':
        if(this.clock >= this.skillCastUntil){this.mode='base';this._play(this._baseName(),true,{mix:.18});}
        break;
      case 'skillEnd':
        if (this.clock >= this.skillEndUntil) { this.mode = 'base'; this._play(this._baseName(), true,{mix:.18}); }
        break;
      case 'deploy':
        if (this.clock >= this.deployUntil) { this.mode = 'base'; this._play(this._baseName(), true,{mix:.18}); }
        break;
      case 'change':
        if (this.clock >= this.changeUntil) {
          this.mode = 'base';
          if (this.stunWanted) { this.stunWanted = false; this._enterStun(); } else this._play(this._baseName(), true);
        }
        break;
      default: break;
    }
    if (!this.frozen) {
      try { this.spine.update(dt); } catch { /* a broken skeleton must not stop the frame */ }
    }
  }

  /** Model height in skeleton units (setup-pose bounds, else a chibi default). */
  get height() {
    const b = this.entry.bounds;
    if (b && Number.isFinite(b.height) && b.height > 20) return Math.min(b.height, 900);
    return 380;
  }

  destroy() {
    try { this.spine.destroy({ children: true, texture: false, baseTexture: false }); } catch { /* ignore */ }
    this.spine = null;
  }
}
