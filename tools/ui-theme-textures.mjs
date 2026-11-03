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
import { THEME_ART as ART } from './build-ui-theme-resources.mjs';
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
    face: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, .5)) right center / .34rem 1px no-repeat',
    grain: 'radial-gradient(60% 40% at 50% 0%, rgba(255, 225, 180, .06), transparent 70%)',
    card: 'radial-gradient(70% 50% at 50% 0%, rgba(179, 23, 31, .22), transparent 70%), repeating-linear-gradient(90deg, rgba(110, 10, 18, .14) 0 .1rem, rgba(40, 4, 8, .14) .1rem .2rem)',
    stripe: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, .7), transparent)',
    corner: DIAMONDS('#e3a33b'), clip: 'none', sprite: 'grayscale(.4) sepia(.3) hue-rotate(-10deg)',
  },
  'is-mizuki': {
    radius: '.3rem',
    face: 'repeating-linear-gradient(90deg, rgba(255, 255, 255, .5) 0 1px, transparent 1px 4px) right center / .34rem 100% no-repeat',
    grain: 'radial-gradient(40% 30% at 20% 20%, rgba(40, 80, 200, .1), transparent 70%)',
    card: 'radial-gradient(45% 35% at 30% 30%, rgba(40, 80, 200, .3), transparent 70%), radial-gradient(2px 2px at 60% 60%, rgba(127, 247, 255, .7), transparent 70%), repeating-conic-gradient(from 0deg at 50% 110%, rgba(95, 212, 255, .05) 0 2deg, transparent 2deg 8deg)',
    stripe: 'linear-gradient(90deg, transparent, #5fd4ff, transparent)',
    corner: DIAMONDS('#4b8cff'), clip: 'none', sprite: 'hue-rotate(20deg) saturate(1.1)',
  },
  'is-frost': {
    radius: '.04rem',
    face: 'linear-gradient(90deg, transparent, rgba(122, 240, 208, .6)) right center / .34rem 100% no-repeat',
    grain: 'radial-gradient(60% 30% at 60% 0%, rgba(60, 220, 170, .08), transparent 70%)',
    card: 'radial-gradient(60% 40% at 60% 0%, rgba(60, 220, 170, .25), transparent 70%), radial-gradient(1px 1px at 30% 40%, #fff, transparent 70%), radial-gradient(1px 1px at 70% 30%, #fff, transparent 70%), radial-gradient(circle at 50% 120%, transparent 58%, rgba(122, 240, 208, .1) 59% 60%, transparent 61%)',
    stripe: 'linear-gradient(90deg, #0e8fa8, #1fc4d6, transparent)',
    corner: DIAMONDS('#7fd6ff'), clip: 'none', sprite: 'hue-rotate(10deg) saturate(.9)',
  },
  'is-sarkaz': {
    radius: '.06rem',
    face: 'radial-gradient(70% 60% at 50% 50%, rgba(255, 255, 255, .3), transparent 70%) right center / .34rem 100% no-repeat',
    grain: 'radial-gradient(1px 1px at 30% 40%, rgba(255, 255, 255, .25), transparent 70%), radial-gradient(1px 1px at 70% 70%, rgba(255, 255, 255, .2), transparent 70%)',
    card: 'radial-gradient(80% 30% at 50% 50%, rgba(217, 166, 58, .28), transparent 70%), radial-gradient(40% 20% at 30% 60%, rgba(60, 110, 200, .18), transparent 70%), radial-gradient(1px 1px at 20% 20%, rgba(255, 255, 255, .5), transparent 70%)',
    stripe: 'linear-gradient(90deg, #b3202a, #d9a63a 30%, #d9a63a 70%, transparent)',
    corner: 'none', clip: NOTCH, sprite: 'sepia(.5) saturate(1.2)',
  },
  'is-sui': {
    radius: '0',
    face: 'repeating-linear-gradient(90deg, rgba(255, 255, 255, .4) 0 2px, transparent 2px 5px) right center / .34rem 100% no-repeat',
    grain: 'linear-gradient(180deg, rgba(245, 190, 205, .12), transparent 50%, rgba(150, 225, 200, .12))',
    card: 'linear-gradient(180deg, rgba(245, 190, 205, .3), transparent 50%, rgba(150, 225, 200, .3)), radial-gradient(30% 20% at 80% 85%, rgba(22, 127, 120, .14), transparent 70%)',
    stripe: 'linear-gradient(90deg, #167f78 0 50%, #b8232b 50%)',
    corner: L('#167f78', '2px', '.12rem'), clip: 'polygon(.12rem 0, calc(100% - .12rem) 0, 100% .12rem, 100% calc(100% - .12rem), calc(100% - .12rem) 100%, .12rem 100%, 0 calc(100% - .12rem), 0 .12rem)', sprite: 'saturate(.8) hue-rotate(-10deg) brightness(1.05)',
  },
  'is-blackflow': {
    radius: '.02rem .02rem .1rem .1rem',
    face: 'linear-gradient(90deg, transparent, rgba(255, 240, 176, .55)) right center / .34rem 100% no-repeat',
    grain: 'radial-gradient(50% 40% at 50% 100%, rgba(230, 212, 138, .06), transparent 70%)',
    card: 'radial-gradient(3px 3px at 30% 40%, rgba(255, 240, 176, .5), transparent 70%), radial-gradient(60% 40% at 50% 110%, rgba(230, 212, 138, .14), transparent 70%)',
    stripe: 'linear-gradient(90deg, transparent, #e6d48a, transparent)',
    corner: 'none', clip: 'none', sprite: 'sepia(.4) brightness(1.05)',
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

/** An SVG fractal-noise grain as a data URI: { f: base frequency, o: octaves, c: [r, g, b], a: alpha, t: 'fractalNoise' | 'turbulence' } */
function noise({ f = .8, o = 3, c = [255, 255, 255], a = .08, t = 'fractalNoise' }) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='${t}' baseFrequency='${f}' numOctaves='${o}' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 ${(c[0] / 255).toFixed(3)} 0 0 0 0 ${(c[1] / 255).toFixed(3)} 0 0 0 0 ${(c[2] / 255).toFixed(3)} 0 0 0 ${a} 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`;
  return `url("data:image/svg+xml,${svg.replace(/"/g, "'").replace(/</g, '%3C').replace(/>/g, '%3E')}")`;
}
const SERIF_KR = { q: 'family=Noto+Serif+KR:wght@500;700;900', family: "'Noto Serif KR'" };
const CINZEL = { q: 'family=Cinzel:wght@600;800&family=Noto+Serif+KR:wght@500;700;900', family: "'Cinzel', 'Noto Serif KR'" };
const MONO = { q: 'family=Share+Tech+Mono', family: "'Share Tech Mono'" };
const BRUSH = { q: 'family=Nanum+Myeongjo:wght@700;800', family: "'Nanum Myeongjo'" };
const GOLD = (c = '#d9b25f') => `inset 0 0 0 1px rgba(0, 0, 0, .7), inset 0 0 0 3px ${c}, inset 0 0 0 4px rgba(0, 0, 0, .6), inset 0 0 0 5px rgba(255, 230, 170, .25), 0 .1rem .4rem rgba(0, 0, 0, .65)`;
// the materials: grain, face, frame
const MAT = {
  white: { noise: { f: .9, o: 2, c: [20, 30, 40], a: .03 } },
  space: { noise: { f: .6, o: 2, c: [190, 200, 255], a: .05 } },
  rhine: { noise: { f: 1.2, o: 1, c: [17, 19, 18], a: .025 }, font: { q: 'family=IBM+Plex+Mono:wght@500', family: "'IBM Plex Mono'" } },
  cyber: { noise: { f: 1.4, o: 1, c: [0, 240, 255], a: .05 }, font: MONO, frame: 'inset 0 0 0 1px rgba(0, 240, 255, .18), 0 0 .18rem rgba(255, 46, 136, .35)' },
  'is-fungi': { noise: { f: .5, o: 4, c: [201, 178, 122], a: .09 }, font: SERIF_KR },
  'is-phantom': { noise: { f: .7, o: 3, c: [255, 255, 255], a: .035 }, font: CINZEL },
  'is-mizuki': { noise: { f: .25, o: 4, c: [60, 110, 230], a: .08, t: 'turbulence' }, font: { q: 'family=Josefin+Sans:wght@300;600', family: "'Josefin Sans'" } },
  'is-frost': { noise: { f: .9, o: 3, c: [122, 240, 208], a: .04 } },
  'is-sarkaz': { noise: { f: .55, o: 5, c: [230, 230, 230], a: .07 }, font: SERIF_KR },
  'is-sui': { noise: { f: 1.1, o: 2, c: [60, 80, 70], a: .05 }, font: SERIF_KR },
  'is-blackflow': { noise: { f: .8, o: 3, c: [255, 240, 176], a: .03 }, font: { q: 'family=Cormorant+Garamond:wght@500;700&family=Noto+Serif+KR:wght@500;700', family: "'Cormorant Garamond', 'Noto Serif KR'" } },
  'f-yan': { noise: { f: .6, o: 4, c: [224, 164, 58], a: .07 }, font: BRUSH, frame: GOLD('#e0a43a') },
  'f-sargon': { noise: { f: .5, o: 5, c: [135, 75, 8], a: .12 }, font: SERIF_KR },
  'f-victoria': { noise: { f: .9, o: 3, c: [212, 175, 90], a: .05 }, font: CINZEL, frame: GOLD('#d4af5a') },
  'f-kjerag': { noise: { f: 1.4, o: 2, c: [255, 255, 255], a: .45 }, font: SERIF_KR },
  'f-laterano': { noise: { f: 1, o: 3, c: [168, 125, 31], a: .05 }, font: CINZEL, frame: 'inset 0 0 0 1px rgba(255, 255, 255, .9), inset 0 0 0 2px rgba(224, 178, 74, .55), 0 .05rem .2rem rgba(120, 95, 40, .14)' },
  'f-aegir': { noise: { f: .3, o: 3, c: [34, 211, 197], a: .06, t: 'turbulence' } },
  'f-siracusa': { noise: { f: .9, o: 3, c: [255, 240, 210], a: .05 }, font: CINZEL, frame: 'inset 0 0 0 1px rgba(184, 149, 90, .45), inset 0 0 0 4px rgba(14, 11, 11, .9), inset 0 0 0 5px rgba(184, 149, 90, .25), 0 .1rem .4rem rgba(0, 0, 0, .6)' },
  'f-kazimierz': { noise: { f: 1.1, o: 2, c: [232, 226, 208], a: .04 } },
  'f-ursus': { noise: { f: .8, o: 4, c: [200, 205, 210], a: .07 }, frame: 'inset 0 0 0 2px rgba(0, 0, 0, .6), inset 0 0 0 3px rgba(115, 125, 131, .35), 0 .08rem .3rem rgba(0, 0, 0, .6)' },
  'f-leithanien': { noise: { f: .8, o: 3, c: [216, 184, 106], a: .05 }, font: CINZEL, frame: GOLD('#d8b86a') },
};

/** A background stack's top-level layers (commas inside parentheses are not separators). */
function topLayers(v) {
  const out = []; let depth = 0, cur = '';
  for (const ch of v) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** The texture rules of one theme. */
export function textureCss(id, light = false) {
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
  // the theme's official art (tools/build-ui-theme-resources.mjs), only once it is downloaded (<html data-ui-art>)
  const a = `${s}[data-ui-art]`;
  const veil = light ? 'rgba(var(--bg-0-rgb), .78)' : 'rgba(var(--bg-0-rgb), .62)';
  const veilCard = light ? 'rgba(var(--bg-1-rgb), .82)' : 'rgba(var(--bg-1-rgb), .55)';
  const art = ART[id] || {};
  if (art.left) out.push(`${a} body { background-image: ${MAT[id]?.noise ? noise(MAT[id].noise) + ', ' : ''}linear-gradient(${veil}, ${veil}), var(--ta-left), var(--ta-right); background-size: ${MAT[id]?.noise?.size || '240px'} auto, 100% 100%, 50.1% 100%, 50.1% 100%; background-position: 0 0, 0 0, left center, right center; background-repeat: repeat, no-repeat, no-repeat, no-repeat; }`);
  if (art.logo) out.push(`${a} body::after { content: ''; position: fixed; right: 4vw; bottom: 6vh; width: 34vmin; height: 34vmin; background: var(--ta-logo) center / contain no-repeat; opacity: ${light ? '.08' : '.07'}; pointer-events: none; z-index: -1; ${light ? 'filter: invert(1);' : ''} }`);
  // material: an SVG noise grain (paper / velvet / stone / frost) over the surfaces, the theme's face, its frame
  const m = MAT[id];
  if (m) {
    if (m.font) out.unshift(`@import url("https://fonts.googleapis.com/css2?${m.font.q}&display=swap");`);
    if (m.font) out.push(`${s} :is(.topbar__title, .modal__title, .panel__title, .mode-card__name, .btn, .section-label, .capsule__label, .lvcard__label, .scard__name, .seat__name) { font-family: ${m.font.family}, var(--font-cjk); }`);
    if (m.noise) {
      const n = noise(m.noise);
      out.push(`${s} :is(.panel, .modal__box)::before { background: ${n}, ${x.grain}; background-size: ${m.noise.size || '240px'} auto, auto; }`);
      out.push(`${s} body { background-image: ${n}, var(--ui-body-art, none); }`);
      out.push(`${s} :is(.mode-card__bg, .scard__bg) { background: ${n}, ${x.card}; }`);
    }
    if (m.frame) out.push(`${s} :is(.panel, .modal__box, .mode-card, .seat, .gtop__center) { box-shadow: ${m.frame}; }`);
    if (m.edge) out.push(`${s} :is(.panel, .modal__box, .mode-card, .seat) { border: ${m.edge}; }`);
    if (m.extra) out.push(m.extra.replaceAll('$S', s));
  }
  return `/* ---- texture layer (tools/ui-theme-textures.mjs) */\n${out.join('\n')}\n`;
}
