// Display policy only: never changes combat damage or HP. Legacy on/off preferences remain readable.
export const DAMAGE_NUMBER_MODES = Object.freeze(['none', 'sum', 'all', 'basic']);
export function damageNumberMode(settings) {
  return DAMAGE_NUMBER_MODES.includes(settings?.damageNumberMode) ? settings.damageNumberMode
    : settings?.damageNumbers === false ? 'none' : 'sum';
}
// PRTS 作战机制 §伤害红字: final >= 1.5 × expected, without penetration/post-mitigation gains.
export function criticalDamage(final, expected, forced = false) {
  return !!forced || (Number.isFinite(final) && Number.isFinite(expected) && final >= expected * 1.5 - 1e-9);
}
export function showDamageNumber(settings, meta, heal = false) {
  const mode = damageNumberMode(settings);
  return mode !== 'none' && (mode !== 'basic' || heal || !!meta?.critical || !!meta?.blocked);
}
// The original client rounds visual numbers to nearest, ties to even.
export function roundedDamageNumber(value) {
  const floor = Math.floor(value), fraction = value - floor;
  return Math.abs(fraction - .5) < 1e-9 ? floor + (floor % 2 ? 1 : 0) : Math.round(value);
}
