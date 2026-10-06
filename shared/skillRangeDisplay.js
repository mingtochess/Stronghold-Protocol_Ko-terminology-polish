// Whole-field / unlimited selectors do not need a ground range overlay.
import { GEO } from './constants.js';
export function unlimitedSkillRange(skill, targeting = null) {
  if (targeting?.globalRange || targeting?.unlimitedRange || skill?.globalRange) return true;
  if (Number(targeting?.rangeRadius) >= Math.hypot(GEO.ROWS, GEO.COLS) || Number(targeting?.rangeExtend) >= GEO.COLS) return true;
  const grid=targeting?.rangeGrid || skill?.rangeGrid;
  if (grid?.length >= GEO.ROWS * GEO.COLS) return true;
  const desc=String(skill?.desc || skill?.description || '');
  return /(?:攻击|治[疗療])范围(?:扩大|扩展|扩張|扩张)?(?:至|到)?(?:整个|全)?战场|攻击距离无限|射程无限|공격\s*범위[^.\n]*(?:전장\s*전체|전체\s*전장)|사거리\s*(?:무제한|제한\s*없)/.test(desc);
}
