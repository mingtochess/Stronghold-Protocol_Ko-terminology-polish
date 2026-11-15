// 결집 (docShip, 聚合 — 규정 부가 맹약) in the 맹약 engine, enabled by the room's 커스텀 '맹약 추가 → 결집'
// (shared/customExtensions.js: the bond and its operators). Ported from the 규정 engine
// (server/sim-upstream/content/bonds/regulation.js installDoc), its numbers read from the bond record's bb:
//   every second each on-field [결집] operator restores, to every own operator in its attack range, HP = (heal_base +
//   heal_per_stack × L) × its ATK and element damage = (ep_heal_base + ep_heal_per_stack × L) × its ATK;
//   3 [결집] operators on the field (power_bond_char_cnt): those operators also get 庇护 — damage taken ×(1 − (damage_res_base +
//   damage_res_per_stack × L)), the strongest of the overlapping members, not summed [ASSUMED, as 규정].
import * as S from './support/index.js';
import { burstLocked } from '../damage.js';

const BOND = 'docShip';
const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);

function healElement(target, amount) {
  if (!target?.elem || burstLocked(target) || !(amount > 0)) return;
  for (const k of Object.keys(target.elem)) target.elem[k] = Math.max(0, (target.elem[k] || 0) - amount);
}

export function install(battle) {
  if (!battle || !Array.isArray(battle.players)) return;
  const bb = S.bondRecord(BOND)?.bb;
  if (!bb) return;
  for (const p of battle.players) {
    const pid = p.playerId;
    if (!S.bondActive(battle, pid, BOND)) continue;
    battle.every(1, () => {
      const members = S.bondMembers(battle, pid, BOND).filter(S.onField);
      if (!members.length) return;
      const L = S.bondLayers(battle, pid, BOND);
      const healR = num(bb.heal_base) + num(bb.heal_per_stack) * L;
      const epR = num(bb.ep_heal_base) + num(bb.ep_heal_per_stack) * L;
      const three = members.length >= num(bb.power_bond_char_cnt, 3);
      const res = three ? num(bb.damage_res_base) + num(bb.damage_res_per_stack) * L : 0;
      const covered = new Map();
      for (const m of members) {
        const atk = num(m.s?.atk);
        for (const a of battle.allyUnits) {
          if (!a.alive || !a.deployed || a.ownerId !== pid || !S.isOp(a) || !S.inRange(m, a)) continue;
          if (healR > 0 && a.hp < a.s.maxHp) battle.heal(m, a, healR * atk, { bond: BOND });
          if (epR > 0) healElement(a, epR * atk);
          if (res > (covered.get(a) || 0)) covered.set(a, res);
        }
      }
      for (const a of battle.allyUnits) {
        if (a.ownerId !== pid || !S.isOp(a)) continue;
        const v = covered.get(a) || 0;
        S.passiveBuff(battle, a, 'bond:doc:res', { dmgTakenMul: Math.max(0, 1 - v) });
      }
    });
  }
}
