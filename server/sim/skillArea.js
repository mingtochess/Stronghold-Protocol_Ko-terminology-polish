// Skill fields, not ordinary attack-range or stat buffs. New kits may opt in explicitly.
const AREA_SKILLS = new Set([
  'skchr_lisa_3', 'skchr_mostma_2', 'skchr_mostma_3',
  'skchr_demkni_2', 'skchr_demkni_3', 'skchr_shining_3', 'skchr_cgbird_3',
  'skchr_slbell_2', 'skchr_indigo_2', 'skchr_haini_2', 'skchr_rosesa_2',
  'skchr_skadi2_2', 'skchr_skadi2_3', 'skchr_sora_2', 'skchr_heidi_1', 'skchr_heidi_2',
  'skchr_mlynar_3', 'skchr_sbell2_3',
]);
export function showsSkillArea(u) {
  if (u?.side !== 'ally') return false;
  if (typeof u.skill?.spec?.areaEffect === 'boolean') return u.skill.spec.areaEffect;
  return AREA_SKILLS.has(u.def?.skill?.skillId ?? u.skill?.id);
}
