// Texture references verified against the original effect prefab's _MainTex.
export const DEDICATED_TEXTURES = Object.freeze({
 chenDragon:['chen3','chenDragon'], titiDream:['titi','special_object_titi_06'],
 wisdelShell:['wisdel','wisdel_03'], narantBlade:['narant','narant_weapon01'],
});
export function dedicatedProjectile(info={}, active=false) {
 const id=info.charId || info.spine || '';
 if(id==='char_4056_titi' && active && info.skillIndex===2)return 'titiDream';
 if(id==='char_1035_wisdel')return 'wisdelShell';
 if(id==='char_4138_narant' && active && info.skillIndex===2)return 'narantBlade';
 return null;
}
