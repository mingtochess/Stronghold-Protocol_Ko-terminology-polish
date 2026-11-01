import {unitCombatSounds} from './assets/unit-combat-sounds.mjs';

// Exact native events: numbered abilities below are verified against the exported
// Default/S1/S2/S3 ability graphs, not guessed from their suffixes.
export function northernCombatSounds(audio,op,record){
 const {unit}=unitCombatSounds(audio,op.charId,record.skills);
 const path=key=>{const p=audio.bank('battle.'+key)?.[0];return p?'/assets/audio/sfx/'+p:null;};
 const ability=(event,id)=>path(event+'.'+id);
 if(op.key==='talulah'){
  unit.attackStart=ability('ON_ABILITY_START','char_4247_oxi.attack.0.2');
  unit.forms={talulah_buffed:{attack:unit.attackStart,hit:ability('ON_ABILITY_HIT','char_4247_oxi.attack.0.1')}};
  for(let i=0;i<2;i++)unit.skills[i]=ability('ON_ABILITY_START',`skchr_oxi_${i+1}`);
  unit.fx={talulahS1:ability('ON_ABILITY_HIT','skchr_oxi_1'),talulahGuard:ability('ON_ABILITY_HIT','skchr_oxi_2'),talulahWave:ability('ON_PROJECTILE_BORN','projectile_chr_oxi_s_3_heatwave'),talulahWaveHit:ability('ON_PROJECTILE_HIT','projectile_chr_oxi_s_3_heatwave'),talulahTrail:ability('ON_CUSTOM_TRIGGER','oxi_fire_field_create'),talulahOverdrive:ability('ON_CUSTOM_TRIGGER','oxi_s_3_overload')};
 }else if(op.key==='territoriya'){
  unit.attackStart=ability('ON_ABILITY_START','char_4246_dminon.attack.0');
  unit.attack=ability('ON_ABILITY_ON','char_4246_dminon.attack.0');unit.attackStarts={};unit.attacks={};unit.skillAbilityStarts={};
  for(let i=0;i<3;i++){unit.skillAbilityStarts[i]=ability('ON_ABILITY_START',`skchr_dminon_${i+1}`);unit.attackStarts[i]=ability('ON_ABILITY_START',`char_4246_dminon.attack.${i+1}`);unit.attacks[i]=ability('ON_ABILITY_ON',`char_4246_dminon.attack.${i+1}`);}
  unit.fx={territoriyaSpread:ability('ON_CUSTOM_TRIGGER','dminon_s3_expand'),territoriyaRetreatHit:ability('ON_CUSTOM_TRIGGER','dminon_talent_hit'),territoriyaRetreatStart:ability('ON_PROJECTILE_BORN','projectile_chr_dminon_dead'),territoriyaRetreat:ability('ON_PROJECTILE_REACH','projectile_chr_dminon_withdraw')};
 }else{
  unit.attack=ability('ON_ABILITY_ON','char_4244_tocka.attack.0.2');
  unit.forms={toska_t2:{attack:ability('ON_ABILITY_ON','char_4244_tocka.attack.0.1'),hit:ability('ON_PROJECTILE_HIT','projectile_chr_tocka_t2')}};
  unit.hits={...unit.hits,2:ability('ON_PROJECTILE_HIT','projectile_chr_tocka_s3')};
  unit.skillReleases={};unit.skillAbilityStarts={2:ability('ON_ABILITY_START','skchr_tocka_3')};
  for(let i=0;i<2;i++){unit.skills[i]=ability('ON_ABILITY_START',`skchr_tocka_${i+1}`);unit.skillReleases[i]=ability('ON_ABILITY_ON',`skchr_tocka_${i+1}`);}
  unit.fx={toskaMark:{0:ability('ON_ABILITY_HIT','skchr_tocka_1'),1:ability('ON_PROJECTILE_HIT','projectile_chr_tocka_s2'),2:ability('ON_BUFF_START','tocka_s3_trigger_start_audio')},toskaTrigger:{0:ability('ON_BUFF_SHOW_EFFECT','tocka_s1_shield_start_audio'),1:ability('ON_BUFF_SHOW_EFFECT','tocka_s2_auto_skill_audio'),2:ability('ON_BUFF_SHOW_EFFECT','tocka_s3_bonus_start_audio')}};
 }
 return unit;
}
