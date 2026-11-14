// 규정 선발 설정 in the 맹약 선발 layout (screens/loadout.js, tab 'recruits'): the season's 自选编队 (backups.json diy:
// 6 slots per tier 5 / 6, picked again at 선택자편) shown as the 맹약 선발 roster — every pickable operator a card with
// 선발 안 함 / 5단계 / 6단계, the chosen ones in 「N단계 후보 x/6」 — while the setting stays the slot roster
// (`{ [slotBaseId]: { charId, skillIndex?, uniEquipId? } }`, ui/loadoutSync.js setDiyPicks → room.diy).
// Each operator becomes one candidate record per tier (diyRecord of that tier's first slot: its forms, skills and modules
// at that tier) with a synthetic id `diyc_<charId>_<tier>_a` / `_b`, and the slot picks become loadout-like entries
// (`{ selected, skill, module }`) so the 맹약 cards, rows, filters and detail read them unchanged.

import { diySlotList, pickChoices, defaultPick, slotRecord, setPick, cleanPicks } from './diyModel.js';
import { diyPool, isPrototypePick } from '../../../shared/diy.js';

export const DIYC = /^diyc_(.+)_([56])_([ab])$/;
export const diycId = (charId, tier, elite = false) => `diyc_${charId}_${tier}_${elite ? 'b' : 'a'}`;
const TIERS = [5, 6];

/** The slots of a tier, in order. */
const slotsOf = (data, tier) => diySlotList(data).filter((s) => s.tier === tier);
/** The slot (base id) holding `charId` at `tier`, or null. */
export function slotOf(picks, data, charId, tier) {
  const roster = cleanPicks(picks);
  return slotsOf(data, tier).find((s) => roster[s.slotId]?.charId === charId)?.slotId ?? null;
}

/**
 * Candidate records and the synthetic entries. `records` maps every synthetic id to its record (normal `_a`, elite `_b`);
 * `bases` lists one normal record per operator (the tier it is picked at, else its first pickable tier); `entries`
 * carries the picks.
 * @param {any} data `{ chess, backups }` @param {Iterable<string>|null} kitted @param {any} picks
 */
export function diyCandidates(data, kitted, picks) {
  const kit = kitted ? [...kitted] : null;
  const roster = cleanPicks(picks);
  const records = new Map(), entries = {}, bases = [];
  const tiersOf = new Map();
  // no prototype (예비 오퍼레이터 / 앰버 그룹 …) is offered as a 선발 pick: the owned pool only
  for (const tier of TIERS) for (const charId of diyPool(tier, { data, kitted: kit })) if (!isPrototypePick(data, tier, charId)) (tiersOf.get(charId) || tiersOf.set(charId, []).get(charId)).push(tier);
  for (const [charId, tiers] of tiersOf) {
    let shown = null;
    for (const tier of tiers) {
      const slot = slotsOf(data, tier)[0];
      if (!slot) continue;
      const held = slotOf(roster, data, charId, tier);
      const pick = held ? roster[held] : defaultPick(charId, slot.slotId, data);
      const normal = slotRecord(slot.slotId, pick, data), elite = slotRecord(slot.slotId, pick, data, { elite: true });
      if (!normal) continue;
      const proto = isPrototypePick(data, tier, charId);
      const a = diycId(charId, tier), b = diycId(charId, tier, true);
      const wrap = (rec, id) => ({ ...rec, chessId: id, baseId: a, goldenId: b, isGolden: id === b, tier, optionalRecruit: true,
        recruitPrototype: proto, recruitReserve: !tiers.includes(6), diySlotTier: tier });
      records.set(a, wrap(normal, a));
      if (elite) records.set(b, wrap(elite, b));
      if (held) {
        const ch = pickChoices(charId, held, data);
        entries[a] = { selected: true, ...(Number.isInteger(pick.skillIndex) ? { skill: pick.skillIndex } : {}), ...(pick.uniEquipId !== undefined ? { module: pick.uniEquipId ?? null } : {}) };
        if (ch?.proto) delete entries[a].skill;
        shown ??= a;
      }
    }
    const first = shown || (tiers.length ? diycId(charId, tiers[0]) : null);
    if (first && records.has(first)) bases.push(records.get(first));
  }
  return { records, entries, bases };
}

/**
 * Pick (tier 5 / 6) or drop (0) an operator: removed from every slot, then put in the first free slot of the tier.
 * @returns {{ ok: true, picks: object } | { ok: false, full: true }}
 */
export function diySelect(picks, data, charId, tier) {
  let next = cleanPicks(picks);
  for (const t of TIERS) { const held = slotOf(next, data, charId, t); if (held) next = setPick(next, held, null); }
  if (!tier) return { ok: true, picks: next };
  const free = slotsOf(data, tier).find((s) => !next[s.slotId]);
  if (!free) return { ok: false, full: true };
  return { ok: true, picks: setPick(next, free.slotId, defaultPick(charId, free.slotId, data)) };
}

/** Drop an operator from one tier only (a prototype picked at both tiers keeps the other). */
export function diyDrop(picks, data, charId, tier) {
  const roster = cleanPicks(picks), held = slotOf(roster, data, charId, tier);
  return held ? setPick(roster, held, null) : roster;
}

/** Change the skill / module of a picked operator (the 맹약 detail's `{ skill, module }` patch). */
export function diyChoice(picks, data, charId, tier, patch) {
  const roster = cleanPicks(picks), held = slotOf(roster, data, charId, tier);
  if (!held) return roster;
  const pick = { ...roster[held] };
  if (Number.isInteger(patch?.skill)) pick.skillIndex = patch.skill;
  if (patch && 'module' in patch) pick.uniEquipId = patch.module ?? null;
  return setPick(roster, held, pick);
}

/** Back to the operator's default skill / module (keeps the pick). */
export function diyResetChoice(picks, data, charId, tier) {
  const roster = cleanPicks(picks), held = slotOf(roster, data, charId, tier);
  return held ? setPick(roster, held, defaultPick(charId, held, data)) : roster;
}

export const DIY_PER_TIER = (data, tier) => slotsOf(data, tier).length;
