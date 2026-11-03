// tools/ui-theme-textures.mjs — the texture layer of every UI theme (tools/build-ui-themes.mjs): what the default theme
// draws as textures is redrawn per theme, so a theme is more than a palette —
//   face    the filled buttons' end strip (default: the black hatch of the in-game 准备就绪 button)
//   grain   the panels' / dialogs' surface (default: fine scanlines)
//   card    the mode cards', seat cards' and shop cards' backdrop pattern
//   stripe  the dialog head stripe, the phase banner band, the empty-seat stripes
//   corner  the bracket corners (.brackets::after): a background stack, or 'none'
//   clip    the card silhouette (mode / seat / shop cards), or 'none'
//   sprite  a filter for the official shop sprites (refresh / freeze plates, cost mattes, their icons)
// All CSS gradients: no official artwork. Colours are literal so each theme reads on its own.
const L = (c, w = 'var(--bk-w)', l = 'var(--bk-l)') => [
  `linear-gradient(${c}, ${c}) top left / ${l} ${w} no-repeat`, `linear-gradient(${c}, ${c}) top left / ${w} ${l} no-repeat`,
  `linear-gradient(${c}, ${c}) top right / ${l} ${w} no-repeat`, `linear-gradient(${c}, ${c}) top right / ${w} ${l} no-repeat`,
  `linear-gradient(${c}, ${c}) bottom left / ${l} ${w} no-repeat`, `linear-gradient(${c}, ${c}) bottom left / ${w} ${l} no-repeat`,
  `linear-gradient(${c}, ${c}) bottom right / ${l} ${w} no-repeat`, `linear-gradient(${c}, ${c}) bottom right / ${w} ${l} no-repeat`].join(',\n    ');
const DOTS = (c, s = '5px') => [`radial-gradient(circle, ${c} 0 ${s}, transparent calc(${s} + 1px)) top left / .14rem .14rem no-repeat`,
  `radial-gradient(circle, ${c} 0 ${s}, transparent calc(${s} + 1px)) top right / .14rem .14rem no-repeat`,
  `radial-gradient(circle, ${c} 0 ${s}, transparent calc(${s} + 1px)) bottom left / .14rem .14rem no-repeat`,
  `radial-gradient(circle, ${c} 0 ${s}, transparent calc(${s} + 1px)) bottom right / .14rem .14rem no-repeat`].join(',\n    ');
const DIAMONDS = (c) => ['top left', 'top right', 'bottom left', 'bottom right'].map((p) =>
  `conic-gradient(from 45deg at 50% 50%, ${c} 0 90deg, transparent 90deg 360deg) ${p} / .12rem .12rem no-repeat`).join(',\n    ');
const CUT = 'polygon(0 0, calc(100% - .16rem) 0, 100% .16rem, 100% 100%, .16rem 100%, 0 calc(100% - .16rem))';
const NOTCH = 'polygon(.14rem 0, 100% 0, 100% calc(100% - .14rem), calc(100% - .14rem) 100%, 0 100%, 0 .14rem)';
const ARCH = 'polygon(0 .18rem, .18rem 0, calc(100% - .18rem) 0, 100% .18rem, 100% 100%, 0 100%)';

export const TEXTURES = {
  white: {
    radius: '.06rem',
    face: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, .35)) right center / .34rem 100% no-repeat',
    grain: 'linear-gradient(180deg, rgba(255, 255, 255, .7), transparent 40%)',
    card: 'radial-gradient(90% 60% at 100% 0%, rgba(0, 150, 125, .08), transparent 70%)',
    stripe: 'linear-gradient(90deg, #00967d, #00b894)',
    corner: 'none', clip: 'none', sprite: 'saturate(.75) brightness(1.08)',
  },
  space: {
    radius: '.3rem',
    face: 'radial-gradient(1px 1px at 30% 40%, #fff, transparent 60%) right center / .34rem 100% no-repeat, radial-gradient(1px 1px at 70% 70%, #cfe0ff, transparent 60%) right center / .34rem 100% no-repeat',
    grain: 'radial-gradient(1px 1px at 18% 22%, rgba(255, 255, 255, .5), transparent 60%), radial-gradient(1px 1px at 76% 64%, rgba(200, 210, 255, .45), transparent 60%), radial-gradient(1px 1px at 46% 88%, rgba(255, 255, 255, .35), transparent 60%)',
    card: 'radial-gradient(60% 50% at 80% 10%, rgba(170, 130, 255, .25), transparent 70%), radial-gradient(1px 1px at 20% 30%, #fff, transparent 60%), radial-gradient(1px 1px at 60% 70%, #cfe0ff, transparent 60%)',
    stripe: 'linear-gradient(90deg, #84aaff, #aa82ff, #84aaff)',
    corner: DOTS('rgba(170, 200, 255, .9)', '2px'), clip: 'none', sprite: 'hue-rotate(190deg) saturate(1.2)',
  },
  rhine: {
    radius: '0',
    face: 'repeating-linear-gradient(90deg, #e8d400 0 2px, transparent 2px 5px) right center / .34rem 100% no-repeat',
    grain: 'linear-gradient(rgba(17, 19, 18, .05) 1px, transparent 1px) 0 0 / 100% .1rem',
    card: 'linear-gradient(rgba(17, 19, 18, .06) 1px, transparent 1px) 0 0 / .12rem .12rem, linear-gradient(90deg, rgba(17, 19, 18, .06) 1px, transparent 1px) 0 0 / .12rem .12rem',
    stripe: 'repeating-linear-gradient(90deg, #111312 0 .1rem, #e8d400 .1rem .2rem)',
    corner: L('#111312', '1px', '.2rem'), clip: 'none', sprite: 'grayscale(1) contrast(1.15)',
  },
  cyber: {
    radius: '0',
    face: 'repeating-linear-gradient(-45deg, rgba(0, 240, 255, .55) 0 2px, transparent 2px 6px) right center / .34rem 100% no-repeat',
    grain: 'repeating-linear-gradient(0deg, rgba(0, 240, 255, .05) 0 1px, transparent 1px 3px), linear-gradient(90deg, rgba(255, 46, 136, .12), transparent 30%)',
    card: 'linear-gradient(rgba(255, 46, 136, .1) 1px, transparent 1px) 0 0 / .2rem .2rem, linear-gradient(90deg, rgba(0, 240, 255, .08) 1px, transparent 1px) 0 0 / .2rem .2rem, linear-gradient(160deg, rgba(255, 46, 136, .2), transparent 50%)',
    stripe: 'repeating-linear-gradient(-45deg, #ff2e88 0 .06rem, #0a0410 .06rem .12rem)',
    corner: L('#00f0ff', '2px', '.16rem'), clip: CUT, sprite: 'hue-rotate(250deg) saturate(1.6) brightness(1.1)',
  },
  'is-fungi': {
    radius: '.12rem',
    face: 'radial-gradient(circle at 30% 40%, rgba(255, 245, 210, .6) 0 2px, transparent 3px) right center / .34rem 100% no-repeat, radial-gradient(circle at 70% 70%, rgba(255, 245, 210, .45) 0 1.5px, transparent 2.5px) right center / .34rem 100% no-repeat',
    grain: 'radial-gradient(40% 30% at 20% 30%, rgba(201, 178, 122, .08), transparent 70%), radial-gradient(35% 28% at 80% 70%, rgba(143, 179, 107, .07), transparent 70%)',
    card: 'radial-gradient(circle at 15% 80%, rgba(201, 178, 122, .16) 0 .08rem, transparent .09rem), radial-gradient(circle at 35% 90%, rgba(201, 178, 122, .12) 0 .05rem, transparent .06rem), radial-gradient(60% 40% at 50% 110%, rgba(150, 160, 130, .25), transparent 70%)',
    stripe: 'linear-gradient(90deg, #8fb36b, #c9b27a, #8fb36b)',
    corner: DOTS('#c9b27a', '3px'), clip: 'none', sprite: 'sepia(.7) saturate(.8)',
  },
  'is-phantom': {
    radius: '0',
    face: 'conic-gradient(from 45deg at 50% 50%, rgba(217, 178, 95, .7) 0 90deg, transparent 90deg 360deg) right center / .17rem .17rem',
    grain: 'conic-gradient(from 45deg at 50% 50%, rgba(217, 178, 95, .05) 0 90deg, transparent 90deg 360deg) 0 0 / .24rem .24rem',
    card: 'conic-gradient(from 45deg at 50% 50%, rgba(217, 178, 95, .08) 0 90deg, transparent 90deg 360deg) 0 0 / .3rem .3rem, linear-gradient(180deg, rgba(236, 58, 85, .18), transparent 60%)',
    stripe: 'repeating-linear-gradient(90deg, #d9b25f 0 .04rem, #7a0e1f .04rem .2rem)',
    corner: DIAMONDS('#d9b25f'), clip: ARCH, sprite: 'hue-rotate(160deg) saturate(1.4) brightness(.9)',
  },
  'is-mizuki': {
    radius: '.3rem',
    face: 'radial-gradient(circle at 50% 120%, transparent 40%, rgba(180, 255, 250, .55) 42% 48%, transparent 50%) right center / .34rem .2rem',
    grain: 'radial-gradient(circle at 50% 120%, transparent 60%, rgba(63, 224, 232, .05) 62% 66%, transparent 68%) 0 0 / .6rem .3rem',
    card: 'radial-gradient(circle at 50% 120%, transparent 55%, rgba(63, 224, 232, .1) 57% 61%, transparent 63%) 0 0 / .8rem .4rem, radial-gradient(2px 2px at 30% 40%, rgba(111, 255, 216, .6), transparent 70%)',
    stripe: 'linear-gradient(90deg, #1fa8c8, #4ff0e8, #4b8cff)',
    corner: 'none', clip: 'none', sprite: 'hue-rotate(10deg) saturate(1.3)',
  },
  'is-frost': {
    radius: '.04rem',
    face: 'repeating-linear-gradient(60deg, rgba(255, 255, 255, .7) 0 1px, transparent 1px 5px) right center / .34rem 100% no-repeat, repeating-linear-gradient(-60deg, rgba(255, 255, 255, .7) 0 1px, transparent 1px 5px) right center / .34rem 100% no-repeat',
    grain: 'linear-gradient(160deg, rgba(93, 182, 232, .08), transparent 40%), repeating-linear-gradient(60deg, rgba(36, 95, 136, .025) 0 1px, transparent 1px 8px)',
    card: 'repeating-linear-gradient(60deg, rgba(36, 95, 136, .05) 0 1px, transparent 1px 10px), repeating-linear-gradient(-60deg, rgba(36, 95, 136, .05) 0 1px, transparent 1px 10px)',
    stripe: 'linear-gradient(90deg, #245f88, #8fd0f0, #245f88)',
    corner: L('#245f88', '1px', '.18rem'), clip: 'none', sprite: 'saturate(.6) hue-rotate(10deg) brightness(1.1)',
  },
  'is-sarkaz': {
    radius: '.06rem',
    face: 'radial-gradient(circle at 30% 70%, rgba(255, 210, 140, .8) 0 1.5px, transparent 2.5px) right center / .34rem 100% no-repeat, radial-gradient(circle at 65% 35%, rgba(255, 170, 90, .7) 0 1px, transparent 2px) right center / .34rem 100% no-repeat',
    grain: 'radial-gradient(60% 40% at 50% 110%, rgba(255, 138, 61, .1), transparent 70%), repeating-linear-gradient(90deg, rgba(166, 107, 255, .03) 0 1px, transparent 1px 6px)',
    card: 'radial-gradient(70% 50% at 50% 115%, rgba(255, 138, 61, .3), transparent 70%), radial-gradient(1.5px 1.5px at 30% 60%, rgba(255, 179, 92, .7), transparent 70%), radial-gradient(1px 1px at 70% 40%, rgba(255, 179, 92, .6), transparent 70%)',
    stripe: 'linear-gradient(90deg, #a66bff, #ff8a3d, #a66bff)',
    corner: DIAMONDS('#ff8a3d'), clip: NOTCH, sprite: 'hue-rotate(-30deg) saturate(1.3)',
  },
  'is-sui': {
    radius: '0',
    face: 'linear-gradient(100deg, transparent 20%, rgba(30, 20, 10, .35) 25% 35%, transparent 45%) right center / .34rem 100% no-repeat',
    grain: 'repeating-linear-gradient(0deg, rgba(120, 100, 70, .03) 0 1px, transparent 1px 4px), radial-gradient(50% 30% at 90% 100%, rgba(40, 35, 30, .06), transparent 70%)',
    card: 'radial-gradient(45% 35% at 10% 100%, rgba(40, 35, 30, .12), transparent 70%), radial-gradient(20% 14% at 85% 18%, rgba(154, 44, 37, .14), transparent 70%)',
    stripe: 'linear-gradient(90deg, #9a2c25 0 .1rem, #211a12 .1rem 100%)',
    corner: 'linear-gradient(#9a2c25, #9a2c25) top right / .1rem .1rem no-repeat, linear-gradient(#9a2c25, #9a2c25) bottom left / .1rem .1rem no-repeat',
    clip: 'none', sprite: 'sepia(.8) saturate(.7) brightness(1.05)',
  },
  'is-blackflow': {
    radius: '.02rem .02rem .1rem .1rem',
    face: 'repeating-linear-gradient(90deg, rgba(168, 240, 226, .4) 0 1px, transparent 1px 4px) right top / .34rem 70% no-repeat',
    grain: 'repeating-radial-gradient(ellipse at 50% 140%, rgba(127, 209, 194, .035) 0 1px, transparent 1px 8px)',
    card: 'linear-gradient(180deg, transparent 50%, rgba(0, 0, 0, .55)), repeating-radial-gradient(ellipse at 50% 140%, rgba(127, 209, 194, .06) 0 1px, transparent 1px 10px)',
    stripe: 'linear-gradient(90deg, #3a5a8c, #7fd1c2, #3a5a8c)',
    corner: 'linear-gradient(rgba(127, 209, 194, .8), rgba(127, 209, 194, 0)) top left / 1px .3rem no-repeat, linear-gradient(rgba(127, 209, 194, .8), rgba(127, 209, 194, 0)) top right / 1px .3rem no-repeat',
    clip: 'none', sprite: 'grayscale(.6) hue-rotate(-20deg)',
  },
  'f-yan': {
    radius: '.03rem',
    face: 'radial-gradient(circle, transparent 40%, rgba(255, 225, 150, .7) 42% 52%, transparent 54%) right center / .17rem .17rem',
    grain: 'radial-gradient(circle, transparent 46%, rgba(224, 164, 58, .05) 48% 52%, transparent 54%) 0 0 / .3rem .3rem',
    card: 'radial-gradient(circle, transparent 46%, rgba(224, 164, 58, .1) 48% 52%, transparent 54%) 0 0 / .4rem .4rem, linear-gradient(180deg, rgba(211, 58, 44, .2), transparent 60%)',
    stripe: 'linear-gradient(90deg, #9c2116, #e0a43a, #9c2116)',
    corner: L('#e0a43a', '2px', '.14rem'), clip: 'none', sprite: 'hue-rotate(-25deg) saturate(1.5)',
  },
  'f-sargon': {
    radius: '.04rem',
    face: 'repeating-linear-gradient(170deg, rgba(255, 240, 200, .6) 0 2px, transparent 2px 6px) right center / .34rem 100% no-repeat',
    grain: 'repeating-linear-gradient(170deg, rgba(135, 75, 8, .035) 0 1px, transparent 1px 7px)',
    card: 'repeating-linear-gradient(170deg, rgba(135, 75, 8, .06) 0 .03rem, transparent .03rem .2rem), radial-gradient(60% 40% at 80% 0%, rgba(255, 200, 100, .35), transparent 70%)',
    stripe: 'linear-gradient(90deg, #874b08, #e8b860, #2a7a6f)',
    corner: DIAMONDS('#874b08'), clip: NOTCH, sprite: 'sepia(.5) saturate(1.2) hue-rotate(-15deg)',
  },
  'f-victoria': {
    radius: '0',
    face: 'repeating-linear-gradient(90deg, rgba(240, 205, 120, .8) 0 1px, transparent 1px 4px) right center / .34rem 100% no-repeat',
    grain: 'linear-gradient(45deg, rgba(212, 175, 90, .03) 25%, transparent 25% 75%, rgba(212, 175, 90, .03) 75%) 0 0 / .2rem .2rem',
    card: 'linear-gradient(45deg, rgba(212, 175, 90, .07) 25%, transparent 25% 75%, rgba(212, 175, 90, .07) 75%) 0 0 / .3rem .3rem, linear-gradient(45deg, rgba(212, 175, 90, .07) 25%, transparent 25% 75%, rgba(212, 175, 90, .07) 75%) .15rem .15rem / .3rem .3rem',
    stripe: 'linear-gradient(90deg, #b23a48 0 33%, #d4af5a 33% 66%, #2a3658 66%)',
    corner: L('#d4af5a', '1px', '.2rem') + ',\n    ' + DIAMONDS('#d4af5a'), clip: 'none', sprite: 'hue-rotate(185deg) saturate(.9)',
  },
  'f-kjerag': {
    radius: '.08rem',
    face: 'linear-gradient(150deg, transparent 50%, rgba(255, 255, 255, .55) 50% 70%, transparent 70%) right center / .34rem 100% no-repeat',
    grain: 'linear-gradient(150deg, transparent 70%, rgba(47, 95, 146, .05) 70% 85%, transparent 85%)',
    card: 'linear-gradient(150deg, transparent 55%, rgba(47, 95, 146, .1) 55% 75%, transparent 75%), linear-gradient(210deg, transparent 62%, rgba(47, 95, 146, .08) 62% 80%, transparent 80%)',
    stripe: 'linear-gradient(90deg, #2f5f92, #c0392b 50%, #2f5f92)',
    corner: L('#2f5f92', '2px', '.12rem'), clip: 'none', sprite: 'saturate(.7) hue-rotate(15deg) brightness(1.08)',
  },
  'f-laterano': {
    radius: '.2rem',
    face: 'conic-gradient(from 0deg at 50% 100%, rgba(255, 240, 190, .6) 0 15deg, transparent 15deg 30deg, rgba(255, 240, 190, .6) 30deg 45deg, transparent 45deg 360deg) right center / .34rem 100% no-repeat',
    grain: 'radial-gradient(circle at 50% -10%, rgba(224, 178, 74, .12), transparent 45%)',
    card: 'conic-gradient(from 180deg at 50% 0%, rgba(224, 178, 74, .08) 0 10deg, transparent 10deg 20deg, rgba(224, 178, 74, .08) 20deg 30deg, transparent 30deg 330deg, rgba(224, 178, 74, .08) 330deg 340deg, transparent 340deg 350deg, rgba(224, 178, 74, .08) 350deg), radial-gradient(circle at 50% -20%, rgba(255, 220, 140, .4), transparent 45%)',
    stripe: 'linear-gradient(90deg, #c2455a, #e0b24a, #c2455a)',
    corner: DOTS('#a87d1f', '3px'), clip: ARCH, sprite: 'sepia(.4) saturate(1.1) brightness(1.08)',
  },
  'f-aegir': {
    radius: '0',
    face: 'linear-gradient(rgba(124, 245, 232, .5) 1px, transparent 1px) right center / .34rem 4px',
    grain: 'linear-gradient(rgba(34, 211, 197, .04) 1px, transparent 1px) 0 0 / .2rem .2rem, linear-gradient(90deg, rgba(34, 211, 197, .04) 1px, transparent 1px) 0 0 / .2rem .2rem',
    card: 'linear-gradient(rgba(34, 211, 197, .08) 1px, transparent 1px) 0 0 / .16rem .16rem, linear-gradient(90deg, rgba(34, 211, 197, .08) 1px, transparent 1px) 0 0 / .16rem .16rem, radial-gradient(70% 50% at 50% 120%, rgba(34, 211, 197, .2), transparent 70%)',
    stripe: 'linear-gradient(90deg, #22d3c5, #1a8fd8)',
    corner: L('#22d3c5', '2px', '.1rem'), clip: NOTCH, sprite: 'hue-rotate(0deg) saturate(1.3)',
  },
  'f-siracusa': {
    radius: '0',
    face: 'repeating-linear-gradient(90deg, rgba(224, 191, 130, .7) 0 1px, transparent 1px 3px) right center / .34rem 100% no-repeat',
    grain: 'repeating-linear-gradient(90deg, rgba(184, 149, 90, .03) 0 1px, transparent 1px 5px), radial-gradient(60% 80% at 50% 40%, rgba(255, 240, 210, .04), transparent 70%)',
    card: 'repeating-linear-gradient(90deg, rgba(184, 149, 90, .07) 0 1px, transparent 1px .12rem), linear-gradient(180deg, transparent 60%, rgba(138, 28, 43, .25))',
    stripe: 'linear-gradient(90deg, #8a1c2b 0 .1rem, #b8955a .1rem .12rem, #120a0a .12rem)',
    corner: L('#b8955a', '1px', '.26rem'), clip: 'none', sprite: 'grayscale(.8) sepia(.4)',
  },
  'f-kazimierz': {
    radius: '0',
    face: 'linear-gradient(115deg, transparent 40%, #d22d3d 40% 60%, transparent 60%) right center / .34rem 100% no-repeat',
    grain: 'linear-gradient(115deg, rgba(210, 45, 61, .06) 0 20%, transparent 20%)',
    card: 'linear-gradient(115deg, rgba(210, 45, 61, .22) 0 18%, transparent 18% 22%, rgba(232, 226, 208, .08) 22% 26%, transparent 26%)',
    stripe: 'linear-gradient(115deg, #d22d3d 0 50%, #e8e2d0 50%)',
    corner: 'linear-gradient(#d22d3d, #d22d3d) top left / .2rem 3px no-repeat, linear-gradient(#e8e2d0, #e8e2d0) bottom right / .2rem 3px no-repeat',
    clip: 'polygon(.12rem 0, 100% 0, calc(100% - .12rem) 100%, 0 100%)', sprite: 'grayscale(1) brightness(1.05)',
  },
  'f-ursus': {
    radius: '0',
    face: 'repeating-linear-gradient(45deg, rgba(0, 0, 0, .35) 0 3px, rgba(255, 106, 85, .35) 3px 6px) right center / .34rem 100% no-repeat',
    grain: 'repeating-linear-gradient(45deg, rgba(200, 205, 210, .025) 0 2px, transparent 2px 8px)',
    card: 'repeating-linear-gradient(45deg, rgba(200, 205, 210, .05) 0 .03rem, transparent .03rem .12rem), linear-gradient(180deg, rgba(201, 71, 58, .14), transparent 50%)',
    stripe: 'repeating-linear-gradient(45deg, #c9473a 0 .08rem, #1c1f21 .08rem .16rem)',
    corner: L('#737d83', '3px', '.12rem'), clip: 'none', sprite: 'grayscale(.7) contrast(1.1)',
  },
  'f-leithanien': {
    radius: '.14rem .02rem',
    face: 'repeating-linear-gradient(0deg, transparent 0 4px, rgba(242, 213, 140, .7) 4px 5px) right center / .34rem 100% no-repeat',
    grain: 'repeating-linear-gradient(0deg, transparent 0 .3rem, rgba(216, 184, 106, .04) .3rem calc(.3rem + 1px))',
    card: 'repeating-linear-gradient(0deg, transparent 0 .12rem, rgba(216, 184, 106, .07) .12rem calc(.12rem + 1px)), radial-gradient(70% 55% at 50% 0%, rgba(155, 123, 255, .22), transparent 70%)',
    stripe: 'linear-gradient(90deg, #9b7bff, #d8b86a, #9b7bff)',
    corner: DIAMONDS('#d8b86a'), clip: 'polygon(0 0, 100% 0, 100% calc(100% - .2rem), calc(100% - .2rem) 100%, 0 100%)', sprite: 'hue-rotate(210deg) saturate(1.1)',
  },
};

/** A background stack's top-level layers (commas inside parentheses are not separators). */
function topLayers(v) {
  const out = []; let depth = 0, cur = '';
  for (const ch of v) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** The texture rules of one theme. */
export function textureCss(id) {
  const x = TEXTURES[id];
  if (!x) return '';
  const s = `:root[data-ui-theme="${id}"]`;
  const out = [];
  // the filled buttons: the theme's end strip instead of the black hatch (their colours stay theirs)
  out.push(`${s} :is(.btn--amber, .btn--ice, .btn--danger) { background-image: ${x.face.replace(/ right center \/[^,]*?(?=,|$)/g, '')}, linear-gradient(180deg, rgba(255, 255, 255, .14), transparent 45%); background-size: .34rem 100%, 100% 100%; background-position: right center, 0 0; background-repeat: no-repeat; }`);
  out.push(`${s} .btn--primary { background-image: ${x.face.replace(/ right center \/[^,]*?(?=,|$)/g, '')}, var(--ui-primary-face, none); background-size: .34rem 100%, 100% 100%; background-position: right center, 0 0; background-repeat: no-repeat, no-repeat; }`);
  out.push(`${s} .btn--primary:disabled { background-image: none; }`);
  // panel / dialog surface
  // (isolation: the surface paints between the box's own background and its content, whatever their positioning)
  out.push(`${s} :is(.panel, .modal__box) { isolation: isolate; }`);
  out.push(`${s} :is(.panel, .modal__box)::before { content: ''; position: absolute; inset: 0; pointer-events: none; background: ${x.grain}; z-index: -1; }`);
  // cards
  out.push(`${s} :is(.mode-card__bg, .seat__stripes) { background: ${x.card}; }`);
  out.push(`${s} .seat { background-image: ${topLayers(x.card)[0].replace(/\s+\d[^)]*\/[^,]*$/, '').replace(/ 0 0 \/.*$/, '')}; }`);
  out.push(`${s} .scard__bg { background: ${x.card}, linear-gradient(180deg, var(--bg-3), var(--bg-1)); }`);
  if (x.clip && x.clip !== 'none') out.push(`${s} :is(.mode-card, .scard) { clip-path: ${x.clip}; }`);
  // stripes and bands
  out.push(`${s} .modal__stripe { background: ${x.stripe}; }`);
  out.push(`${s} .pbanner__band { background: ${x.stripe}; }`);
  // corners
  out.push(x.corner === 'none' ? `${s} .brackets::after { background: none; }` : `${s} .brackets::after {\n  background:\n    ${x.corner};\n}`);
  // the HUD's own frames: the top bar, the phase capsule, the clock, the shop card plates, the side effect chips, the
  // ready box, the shop tool buttons — the theme's corner radius / silhouette, surface and stripe
  const shape = x.clip && x.clip !== 'none' ? `border-radius: 0; clip-path: ${x.clip};` : `border-radius: ${x.radius};`;
  out.push(`${s} .gtop__center { background: ${x.grain}, linear-gradient(180deg, rgba(var(--bg-1-rgb), .92), rgba(var(--bg-0-rgb), .92)); ${shape} }`);
  out.push(`${s} .capsule { border-radius: ${x.radius === '0' ? '0' : '.25rem'}; background: ${x.stripe.replace(/;$/, '')} bottom / 100% 2px no-repeat, rgba(var(--bg-1-rgb), .92); }`);
  out.push(`${s} .scard__body { background: ${x.stripe} top / 100% 2px no-repeat, linear-gradient(180deg, rgba(var(--bg-0-rgb), .2), rgba(var(--bg-0-rgb), .94) 35%); }`);
  out.push(`${s} :is(.effect, .toolbtn:not(.obtn), .readybtn__box) { border-radius: ${x.radius}; }`);
  out.push(`${s} .effect { background: ${x.grain}, rgba(var(--bg-1-rgb), .88); }`);
  out.push(`${s} .lvcard { background: ${x.face.replace(/ right center \/[^,]*?(?=,|$)/g, '')}, linear-gradient(180deg, var(--mint-400), var(--mint-600)); background-size: .34rem 100%, 100% 100%; background-position: right bottom, 0 0; background-repeat: no-repeat; ${x.clip && x.clip !== 'none' ? `clip-path: ${x.clip};` : ''} }`);
  // the official shop sprites
  out.push(`${s} :is(.shopbar .obtn__plate, .obtn__cost, .toolbtn__img) { filter: ${x.sprite}; }`);
  // the title backdrop art gives way to the theme's own page
  out.push(`${s} :is(.title-bg__art, .title-bg__ridge-art, .title-bg__ridges, .title-bg__target, .title-bg__radar, .title-bg__haze) { display: none; }`);
  out.push(`${s} .app-bg, ${s} .app-bg::before, ${s} .app-bg::after { background: none; }`);
  return `/* ---- texture layer (tools/ui-theme-textures.mjs) */\n${out.join('\n')}\n`;
}
