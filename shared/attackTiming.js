import {FORMS} from './animationForms.js';
// A non-attacking skill stance must not supply normal attack timing.
export function skillIsStance(sp, role) {
  return !!(sp?.hits?.[sp?.anims?.attack?.loop]?.length && role?.loop && !sp?.hits?.[role.loop]?.length && !(role.idle && role.idle !== role.loop));
}
// Authored channels can contain OnAttack markers without being one-shot attacks.
// Keep their timing metadata; only the renderer suppresses per-attack restarts.
export function skillIsContinuous(sp, role) {
  const key = sp?.skel || '';
  const channels = {'char_388_mint':[1], 'char_291_aglina':[1], 'char_358_lisa':[2]};
  return skillIsStance(sp, role) || Object.entries(channels).some(([id, indices]) => key.includes(id) && indices.includes(role?.index) && role?.via !== 'attack' && !(role?.idle && role.idle !== role.loop));
}
export function selectedSkillClip(sp, index) {
  const role = sp?.anims?.skills?.[String(index)] || null;
  // Utage's unnumbered Skill_Start/Loop/End is her sheathed S1, not S2.
  if (index === 1 && /char_337_utage/.test(sp?.skel || '') && role && skillIsStance(sp, role))
    return {...sp.anims.attack, begin:null, end:null, index, via:'attack'};
  return role;
}
// Compact authoritative timing copied from Spine's OnAttack events at data-build time.
const clipTiming = (sp, role) => {
  const clip = role?.loop, dur = sp?.animations?.[clip];
  if (!(dur > 0) || role?.via === 'idle' || clip === sp?.anims?.idle || skillIsStance(sp, role)) return null;
  const hit = sp.hits?.[clip]?.[0];
  return { dur, hit: Number.isFinite(hit) ? Math.min(dur, Math.max(0, hit)) : dur / 2 };
};
export function spineAttackTiming(sp) {
  if (!sp?.anims) return null;
  const skills = {};
  for (const [i, role] of Object.entries(sp.anims.skills || {})) {
    if (role.via !== 'attack') { const timing = clipTiming(sp, role); if (timing) skills[i] = timing; }
  }
  if (sp.anims.skill?.index != null && !skills[sp.anims.skill.index] && sp.anims.skill.via !== 'attack') {
    const timing = clipTiming(sp, sp.anims.skill); if (timing) skills[sp.anims.skill.index] = timing;
  }
  return { attack: clipTiming(sp, sp.anims.attack), skills, deploy: sp.anims.deploy !== sp.anims.idle ? Math.max(0,sp.animations?.[sp.anims.deploy] || 0) : 0 };
}
export function attachAttackTimings({ chess, enemies, tokens }, assets) {
  for (const [kind, records] of [['chars', chess], ['enemies', enemies], ['tokens', tokens]]) {
    for (const [id, rec] of Object.entries(records || {})) {
      const key = rec.assets?.spine || rec.spine || rec.charId || id;
      const sp = assets?.[kind]?.[key]?.spine || assets?.[kind]?.[id]?.spine;
      if (!sp) continue;
      const front = spineAttackTiming(sp.front || sp), back = sp.back ? spineAttackTiming(sp.back) : null;
      if (front?.deploy > 0 || front?.attack || Object.keys(front?.skills || {}).length) {
        const forms = {};
        for (const [name, form] of Object.entries(FORMS[key] || {})) forms[name] = spineAttackTiming({...sp, anims:{...sp.anims,...form.roles}});
        rec.attackTiming = { front, back, forms };
      }
    }
  }
}
export function attackClipTiming(unit) {
  const all = unit.def?.attackTiming;
  const timing = (unit.form && all?.forms?.[unit.form]) || (unit.dir === 'UP' && all?.back) || all?.front;
  const clip = (unit.skill?.active && timing?.skills?.[unit.skill.index]) || timing?.attack;
  return clip || null;
}
export function attackWindup(unit) {
  const clip = attackClipTiming(unit);
  if (!clip || !(clip.dur > 0)) return 0;
  const speed = Math.max(1, Math.min(4, clip.dur / Math.max(.08, unit.s.interval)));
  return clip.hit / speed;
}
