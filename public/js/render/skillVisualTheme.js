// Art direction, not combat rules: combines the operator's palette with the selected skill's motif.
// Dedicated original sprites remain authoritative (dedicatedEffects.js).
const CONCEPTS = [
  ['poison', /毒云|毒雾|독\s*구름|독안개|poison.*cloud/i, 0x789945],
  ['ice', /冰|霜|雪|빙|서리|눈보라|얼음|frost|freeze/i, 0x8ecce5],
  ['fire', /烈焰|火焰|灼|熔|불꽃|화염|작열|용암|flame|inferno/i, 0xe99748],
  ['water', /潮|涌|波涛|조류|파도|해일|밀물|썰물|tidal|tide/i, 0x65b6cf],
  ['wind', /旋风|风暴|飓风|소용돌이|회오리|폭풍|vortex|tornado/i, 0x8ac8bb],
  ['time', /时光|时间|시간|시공|time/i, 0x8399e0],
  ['shadow', /暗影|阴影|어둠|그림자|shadow/i, 0x9678b9],
  ['light', /圣光|辉煌|曙光|성광|광휘|여명|radiance/i, 0xe9c76c],
];
const MOTIFS = {
  mlynar: ['light',0xf1c64f], svrash:['ice',0xb0d5e9], mostma:['time',0x759be0],
  mint:['wind',0x8fc9b9], lisa:['light',0xe4cf8c], demkni:['light',0xd9b779],
  chen3:['water',0x79b8cf], wisdel:['fire',0xd18b70], ascal:['shadow',0x9d84ba],
  narant:['shadow',0xbd81a4], rmixer:['light',0xc7a7d9], reed2:['fire',0xeb9d5a],
  surtr:['fire',0xe98265], eyjafj:['fire',0xdb9c8a], skadi2:['water',0xcc86a2],
  sntlla:['ice',0xadcce0], botany:['ice',0x92b8a0], absin:['shadow',0x8bbbad],
  poca:['ice',0xc6a0b7], glassb:['wind',0xc2bb87], headb2:['water',0xc08c85],
  helage:['light',0xc7ac7c], leto:['light',0xd19586], dusk:['shadow',0x8bac9e],
  indigo:['time',0xa294d6], silent:['light',0x93bea8], shining:['light',0xbdcde2],
};
export function skillVisualTheme(info={}, representative=0xc7d4d9) {
  const key=String(info.charId||info.spine||'').match(/^char_\d+_([^_]+)/)?.[1];
  const text=String(info.skillName||'');
  const explicit=CONCEPTS.find(([,pattern])=>pattern.test(text));
  const motif=MOTIFS[key];
  const effect=String(info.skillDescription||'');
  const mechanic=/빙결|寒冷|冻结/.test(effect)?'ice':/밀어내|끌어당|推开|拖拽/.test(effect)?'wind':/지속.*피해|持续.*伤害/.test(effect)?'shadow':/치료|治疗/.test(effect)?'light':null;
  // Semantic accents may change per skill; preserve the character's recognizable palette.
  const accent=explicit?.[0]||motif?.[0]||mechanic;
  const color=explicit?.[2]||motif?.[1]||representative;
  return {color,accent,fillAlpha:accent==='shadow'?.14:.17,source:explicit?'skill-concept':motif?'operator-concept':'operator-art'};
}
