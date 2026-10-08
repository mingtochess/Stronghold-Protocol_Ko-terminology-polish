// Original audio_data ability banks. Ability suffixes are operator-specific,
// so never infer a skill index from an arbitrary numbered ability.
export const SKILL_COMBAT_BANKS = {
 char_213_mostma: {2:{attack:'ON_ABILITY_ON.attack.1'}},
 char_4064_mlynar: {1:{attack:'ON_ABILITY_START.attack.2'},2:{attack:'ON_ABILITY_START.attack.3'}},
 char_279_excu: {1:{attack:'ON_ABILITY_START.attack.2'}},
 char_4080_lin: {
  0:{attack:'ON_ABILITY_START.attack.1',hit:'ON_ABILITY_ON.attack.1'},
  1:{attack:'ON_ABILITY_START.attack.2',hit:'ON_ABILITY_HIT.attack.2'},
  2:{attack:'ON_ABILITY_START.attack.3',hit:'ON_ABILITY_ON.attack.3'}},
 char_1032_excu2: {0:{attack:'ON_ABILITY_ON.attack.1'},1:{attack:'ON_ABILITY_START.attack.2'},2:{attack:'ON_ABILITY_ON.attack.3'}},
};
export function skillCombatSounds(audio,id,index){
 const roles=SKILL_COMBAT_BANKS[id]?.[index],out={};
 for(const [role,bank] of Object.entries(roles||{})){
  const paths=audio.unitBanks.get(id)?.get(bank);
  if(paths?.length)out[role]={path:paths[0],bank,mix:audio.mixOf(paths)};
 }
 return out;
}
