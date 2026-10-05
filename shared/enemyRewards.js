/** Offspring keep their parent's combat scaling, but never inherit the parent's bounty reward. */
export function offspringMods(mods) {
  if (!mods) return null;
  const out = { ...mods };
  delete out.bountyId;
  delete out.bountyCoins;
  return out;
}
