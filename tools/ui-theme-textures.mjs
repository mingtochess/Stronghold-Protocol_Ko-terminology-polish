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
import { GUIDE_TEXTURES, GUIDE_MAT, THEME_FONTS, THEME_MICRO } from './ui-theme-guides.mjs';
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
    radius: '0',
    face: 'linear-gradient(100deg, transparent 20%, rgba(255, 245, 230, .35) 25% 35%, transparent 45%) right center / .34rem 100% no-repeat',
    grain: 'radial-gradient(50% 40% at 90% 10%, rgba(200, 110, 50, .06), transparent 70%)',
    card: 'radial-gradient(55% 40% at 85% 15%, rgba(200, 110, 50, .2), transparent 70%), radial-gradient(40% 30% at 10% 90%, rgba(60, 45, 30, .12), transparent 70%)',
    stripe: 'linear-gradient(90deg, #a8341f 0 .14rem, transparent .14rem)',
    corner: 'linear-gradient(#a8341f, #a8341f) top right / .1rem .1rem no-repeat', clip: 'none', sprite: 'sepia(.5) saturate(.9)',
  },
  'f-sargon': {
    radius: '0',
    face: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, .25)) right center / .34rem 100% no-repeat',
    grain: 'linear-gradient(180deg, rgba(150, 140, 100, .06), transparent 50%)',
    card: 'linear-gradient(180deg, rgba(150, 140, 100, .16), transparent 60%), radial-gradient(70% 40% at 50% 100%, rgba(184, 154, 98, .18), transparent 70%)',
    stripe: 'linear-gradient(90deg, #dfe68a 0 .3rem, #14150c .3rem)',
    corner: 'none', clip: 'none', sprite: 'grayscale(.5) sepia(.3)',
  },
  'f-victoria': {
    radius: '0',
    face: 'repeating-linear-gradient(90deg, rgba(255, 255, 255, .45) 0 1px, transparent 1px 4px) right center / .34rem 100% no-repeat',
    grain: 'radial-gradient(40% 30% at 80% 10%, rgba(140, 80, 230, .1), transparent 70%)',
    card: 'radial-gradient(45% 35% at 75% 15%, rgba(140, 80, 230, .28), transparent 70%)',
    stripe: 'linear-gradient(90deg, transparent, #c9c2e6, transparent)',
    corner: DIAMONDS('#c9c2e6'), clip: 'none', sprite: 'hue-rotate(220deg) saturate(.6)',
  },
  'f-kjerag': {
    radius: '0',
    face: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, .45)) right center / .34rem 100% no-repeat',
    grain: 'linear-gradient(120deg, rgba(31, 63, 191, .05), transparent 40%)',
    card: 'linear-gradient(120deg, rgba(31, 63, 191, .18), transparent 50%)',
    stripe: 'linear-gradient(90deg, #1f3fbf 0 80%, #d22c3c 80%)',
    corner: L('#1f3fbf', '2px', '.12rem'), clip: 'none', sprite: 'saturate(.8) hue-rotate(10deg)',
  },
  'f-laterano': {
    radius: '0',
    face: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, .5)) right center / .34rem 100% no-repeat',
    grain: 'radial-gradient(circle at 50% -10%, rgba(255, 255, 255, .6), transparent 45%)',
    card: 'radial-gradient(circle at 50% -20%, rgba(255, 255, 255, .9), transparent 50%), radial-gradient(30% 20% at 85% 85%, rgba(232, 138, 166, .12), transparent 70%)',
    stripe: 'linear-gradient(90deg, transparent, #98a4b0, transparent)',
    corner: 'none', clip: 'none', sprite: 'saturate(.5) brightness(1.08)',
  },
  'f-aegir': {
    radius: '0',
    face: 'linear-gradient(118deg, transparent 45%, rgba(255, 255, 255, .35) 45% 55%, transparent 55%) right center / .34rem 100% no-repeat',
    grain: 'linear-gradient(118deg, rgba(255, 255, 255, .03) 0 40%, transparent 40%)',
    card: 'linear-gradient(118deg, rgba(255, 255, 255, .06) 0 45%, transparent 45%), linear-gradient(118deg, transparent 0 70%, rgba(0, 0, 0, .3) 70%)',
    stripe: 'linear-gradient(90deg, transparent, #a9c2c4, transparent)',
    corner: 'none', clip: 'polygon(.16rem 0, 100% 0, 100% 100%, 0 100%, 0 .16rem)', sprite: 'grayscale(.6)',
  },
  'f-siracusa': {
    radius: '0',
    face: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, .3)) right center / .34rem 100% no-repeat',
    grain: 'repeating-linear-gradient(0deg, rgba(255, 255, 255, .012) 0 1px, transparent 1px 3px)',
    card: 'radial-gradient(60% 70% at 50% 40%, rgba(255, 255, 255, .06), transparent 70%), linear-gradient(180deg, transparent 70%, rgba(209, 36, 47, .14))',
    stripe: 'linear-gradient(90deg, transparent, #d1242f, transparent)',
    corner: 'none', clip: 'none', sprite: 'grayscale(1)',
  },
  'f-kazimierz': {
    radius: '0',
    face: 'linear-gradient(115deg, transparent 40%, #ffffff 40% 52%, transparent 52%) right center / .34rem 100% no-repeat',
    grain: 'linear-gradient(115deg, rgba(230, 40, 60, .06) 0 18%, transparent 18%)',
    card: 'linear-gradient(115deg, rgba(230, 40, 60, .22) 0 16%, transparent 16% 19%, rgba(255, 255, 255, .08) 19% 22%, transparent 22%), radial-gradient(60% 50% at 90% 10%, rgba(47, 107, 255, .22), transparent 70%)',
    stripe: 'linear-gradient(115deg, #e6283c 0 45%, #ffffff 45% 55%, #2f6bff 55%)',
    corner: 'none', clip: 'polygon(.12rem 0, 100% 0, calc(100% - .12rem) 100%, 0 100%)', sprite: 'hue-rotate(150deg) saturate(1.3)',
  },
  'f-ursus': {
    radius: '0',
    face: 'repeating-linear-gradient(90deg, rgba(0, 0, 0, .35) 0 4px, transparent 4px 8px) right center / .34rem 100% no-repeat',
    grain: 'repeating-linear-gradient(90deg, rgba(240, 138, 28, .04) 0 .3rem, transparent .3rem .6rem)',
    card: 'repeating-linear-gradient(90deg, rgba(240, 138, 28, .16) 0 .2rem, transparent .2rem .4rem), linear-gradient(180deg, rgba(240, 138, 28, .12), transparent 60%)',
    stripe: 'linear-gradient(90deg, #f2d23a 0 .6rem, #f08a1c .6rem)',
    corner: 'none', clip: 'none', sprite: 'sepia(.8) saturate(1.6) hue-rotate(-15deg)',
  },
  'f-leithanien': {
    radius: '0',
    face: 'linear-gradient(90deg, transparent, rgba(240, 210, 144, .6)) right center / .34rem 100% no-repeat',
    grain: 'radial-gradient(50% 40% at 50% 0%, rgba(255, 220, 160, .05), transparent 70%)',
    card: 'radial-gradient(50% 40% at 50% 0%, rgba(255, 220, 160, .12), transparent 70%), radial-gradient(60% 50% at 50% 100%, rgba(138, 28, 43, .25), transparent 70%)',
    stripe: 'linear-gradient(90deg, transparent, #d6b56c, transparent)',
    corner: DIAMONDS('#d6b56c'), clip: 'none', sprite: 'sepia(.6) saturate(1.1)',
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
  'is-mizuki': { noise: { f: .25, o: 4, c: [60, 110, 230], a: .08, t: 'turbulence' }, font: { q: 'family=Josefin+Sans:wght@600', family: "'Josefin Sans'" } },
  'is-frost': { noise: { f: .9, o: 3, c: [122, 240, 208], a: .04 } },
  'is-sarkaz': { noise: { f: .55, o: 5, c: [230, 230, 230], a: .07 }, font: SERIF_KR },
  'is-sui': { noise: { f: 1.1, o: 2, c: [60, 80, 70], a: .05 }, font: SERIF_KR },
  'is-blackflow': { noise: { f: .8, o: 3, c: [255, 240, 176], a: .03 }, font: { q: 'family=Cormorant+Garamond:wght@500;700&family=Noto+Serif+KR:wght@500;700', family: "'Cormorant Garamond', 'Noto Serif KR'" } },
  'f-yan': { noise: { f: .9, o: 3, c: [90, 60, 30], a: .07, size: '300px' }, font: BRUSH },
  'f-sargon': { noise: { f: .8, o: 3, c: [200, 190, 150], a: .05 }, font: { q: 'family=Oswald:wght@600', family: "'Oswald'" } },
  'f-victoria': { noise: { f: .7, o: 3, c: [200, 190, 240], a: .04 }, font: CINZEL },
  'f-kjerag': { noise: { f: 1, o: 2, c: [30, 60, 190], a: .03 }, font: { q: 'family=Rajdhani:wght@600;700', family: "'Rajdhani'" } },
  'f-laterano': { noise: { f: 1.2, o: 2, c: [90, 108, 128], a: .03 }, font: CINZEL },
  'f-aegir': { noise: { f: .6, o: 3, c: [169, 194, 196], a: .04 }, font: { q: 'family=Cormorant+Garamond:wght@400;600&family=Noto+Serif+KR:wght@500', family: "'Cormorant Garamond', 'Noto Serif KR'" } },
  'f-siracusa': { noise: { f: .9, o: 3, c: [255, 255, 255], a: .045 }, font: { q: 'family=Playfair+Display:wght@600;800&family=Noto+Serif+KR:wght@500;700', family: "'Playfair Display', 'Noto Serif KR'" } },
  'f-kazimierz': { noise: { f: 1.1, o: 2, c: [255, 255, 255], a: .03 }, font: { q: 'family=Barlow+Condensed:wght@700', family: "'Barlow Condensed'" } },
  'f-ursus': { noise: { f: .8, o: 4, c: [240, 200, 150], a: .06 }, font: { q: 'family=Oswald:wght@600;700', family: "'Oswald'" } },
  'f-leithanien': { noise: { f: .7, o: 3, c: [214, 181, 108], a: .045 }, font: { q: 'family=Cinzel:wght@600&family=Noto+Serif+KR:wght@500;700', family: "'Cinzel', 'Noto Serif KR'" } },
};

Object.assign(TEXTURES, GUIDE_TEXTURES);
Object.assign(MAT, GUIDE_MAT);
for (const [id, font] of Object.entries(THEME_FONTS)) MAT[id] = { ...MAT[id], font };

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
  // the theme-only aliases (unset in the default theme, whose literal colours stay): screens with their own palette
  // (laboratory / practice setup) read these
  out.push(`${s} { --tx-radius: ${x.radius}; --th-accent: var(--mint-500); --th-accent-rgb: var(--accent-rgb); --th-accent-deep: ${light ? "var(--mint-700)" : "var(--mint-800)"}; --th-surf1: var(--surf-1); --th-line: var(--line-2); --th-ink-hi: var(--text-hi); --th-ink-md: var(--text-md); --th-ink-lo: var(--text-lo); }`);
  // (one size / position / repeat per face layer, then the fill: a two-layer face shifted the lists and shrank the fill)
  const nf = topLayers(x.face).length;
  const lay = (a, b) => Array(nf).fill(a).concat(b).join(', ');
  // the filled buttons: the theme's end strip instead of the black hatch (their colours stay theirs)
  out.push(`${s} :is(.btn--amber, .btn--ice, .btn--danger) { background-image: ${x.face.replace(/ right center \/[^,]*?(?=,|$)/g, '')}, linear-gradient(180deg, rgba(255, 255, 255, .14), transparent 45%); background-size: ${lay('.34rem 100%', '100% 100%')}; background-position: ${lay('right center', '0 0')}; background-repeat: ${lay('no-repeat', 'no-repeat')}; }`);
  out.push(`${s} .btn--primary { background-image: ${x.face.replace(/ right center \/[^,]*?(?=,|$)/g, '')}, var(--ui-primary-face, linear-gradient(var(--mint-500), var(--mint-500))); background-size: ${lay('.34rem 100%', '100% 100%')}; background-position: ${lay('right center', '0 0')}; background-repeat: ${lay('no-repeat', 'no-repeat')}; }`);
  out.push(`${s} .btn--primary:disabled { background-image: none; }`);
  // panel / dialog surface
  // (isolation: the surface paints between the box's own background and its content, whatever their positioning)
  out.push(`${s} :is(.panel, .modal__box, .bpop, .dpanel) { isolation: isolate; }`);
  out.push(`${s} :is(.panel, .modal__box, .bpop, .dpanel)::before { content: ''; position: absolute; inset: 0; pointer-events: none; background: ${x.grain}; z-index: -1; }`);
  // cards
  out.push(`${s} :is(.mode-card__bg, .seat__stripes) { background: ${x.card}; }`);
  out.push(`${s} .seat { background-image: ${topLayers(x.card)[0].replace(/\s+\d[^)]*\/[^,]*$/, '').replace(/ 0 0 \/.*$/, '')}; }`);
  // (a shop card holds an operator portrait: its plate stays dark under a light theme)
  out.push(`${s} .scard__bg { background: ${x.card}, linear-gradient(180deg, ${light ? '#3a3e42, #1d2023' : 'var(--bg-3), var(--bg-1)'}); }`);
  // (no card silhouettes: a clipped card cut its own text and icons)
  // stripes and bands
  out.push(`${s} .modal__stripe { background: ${x.stripe}; }`);
  out.push(`${s} .pbanner__band { background: ${x.stripe}; }`);
  // corners
  out.push(x.corner === 'none' ? `${s} .brackets::after { background: none; }` : `${s} .brackets::after {\n  background:\n    ${x.corner};\n}`);
  // the HUD's own frames: the top bar, the phase capsule, the clock, the shop card plates, the side effect chips, the
  // ready box, the shop tool buttons — the theme's corner radius / silhouette, surface and stripe
  const shape = `border-radius: ${x.radius};`;
  out.push(`${s} .gtop__center { background: ${x.grain}, linear-gradient(rgba(var(--bg-1-rgb), .94), rgba(var(--bg-1-rgb), .94)); ${shape} }`);
  out.push(`${s} .capsule { border-radius: ${x.radius === '0' ? '0' : '.25rem'}; background: ${x.stripe.replace(/;$/, '')} bottom / 100% 2px no-repeat, rgba(var(--bg-1-rgb), .92); }`);
  out.push(`${s} :is(.effect, .toolbtn:not(.obtn), .readybtn__box) { border-radius: ${x.radius}; }`);
  out.push(`${s} .effect { background: ${x.grain}, rgba(var(--bg-1-rgb), .88); }`);
  out.push(`${s} .lvcard { background-color: var(--mint-500); background-image: ${x.face.replace(/ right center \/[^,]*?(?=,|$)/g, '')}; background-size: .34rem 100%; background-position: right bottom; background-repeat: no-repeat; }`);
  // the official shop sprites
  // (the official shop sprites — 冻结 / 刷新 plates, cost mattes — keep their own colours in every theme)
  // official portraits / icons are drawn light on dark: their plates stay dark under a light theme
  if (light) out.push(`${s} :is(.lo-card__art, .lo-dhead__art, .extension-art:not(.extension-art--map), .lo-chip--tier) { background-color: #2b2e31; }`);
  // the title backdrop art gives way to the theme's own page
  out.push(`${s} :is(.title-bg__art, .title-bg__ridge-art, .title-bg__ridges, .title-bg__target, .title-bg__radar, .title-bg__haze) { display: none; }`);
  out.push(`${s} .app-bg, ${s} .app-bg::before, ${s} .app-bg::after { background: none; }`);
  // the theme's official art (tools/build-ui-theme-resources.mjs), only once it is downloaded (<html data-ui-art>)
  const a = `${s}[data-ui-art]`;
  const veil = light ? 'rgba(var(--bg-0-rgb), .78)' : 'rgba(var(--bg-0-rgb), .62)';
  const veilCard = light ? 'rgba(var(--bg-1-rgb), .82)' : 'rgba(var(--bg-1-rgb), .55)';
  const art = ART[id] || {};
  // (each home background half is 910x1024: together 1820x1024 — sized to cover the viewport at that ratio, the halves meeting at its centre)
  if (art.left) out.push(`${a} body { background-image: ${MAT[id]?.noise ? noise(MAT[id].noise) + ', ' : ''}linear-gradient(${veil}, ${veil}), var(--ta-left), var(--ta-right); background-size: ${MAT[id]?.noise?.size || '240px'} auto, 100% 100%, auto max(100vh, 56.27vw), auto max(100vh, 56.27vw); background-position: 0 0, 0 0, right 50% center, left 50% center; background-attachment: scroll, scroll, fixed, fixed; background-repeat: repeat, no-repeat, no-repeat, no-repeat; }`);
  if (art.logo) out.push(`${a} body::after { content: ''; position: fixed; right: 4vw; bottom: 6vh; width: 34vmin; height: 34vmin; background: var(--ta-logo) center / contain no-repeat; opacity: ${light ? '.08' : '.07'}; pointer-events: none; z-index: -1; ${light ? 'filter: invert(1);' : ''} }`);
  // material: an SVG noise grain (paper / velvet / stone / frost) over the surfaces, the theme's face, its frame
  const m = MAT[id];
  if (m) {
    if (m.font) out.unshift(`@import url("https://fonts.googleapis.com/css2?${m.font.q}&display=swap");`);
    const mi = THEME_MICRO[id];
    if (mi) out.unshift(`@import url("https://fonts.googleapis.com/css2?${mi.q}&display=swap");`);
    if (mi) out.push(`${s} { --font-micro: ${mi.family}, var(--font-display); }\n${s} :is(.micro, .micro--mint) { font-family: var(--font-micro); }`);
    // the body face for all text (--font-cjk), the display face for titles / buttons / labels (--font-display); numbers
    // keep the number face
    if (m.font) out.push(`${s} { --font-cjk: ${m.font.body}, 'Noto Sans KR', 'Noto Sans SC', sans-serif; --font-display: ${m.font.display}, ${m.font.body}, 'Noto Sans KR', sans-serif; --font-ui: var(--font-display); }
${s} body { font-family: var(--font-cjk); }
${s} :is(.topbar__title, .modal__title, .panel__title, .mode-card__name, .section-label, .btn, .scard__name, .seat__name, .capsule__label, .hbond__name, h1, h2, h3, h4) { font-family: var(--font-display); }`);
    if (m.noise) {
      const n = noise(m.noise);
      out.push(`${s} :is(.panel, .modal__box, .bpop, .dpanel)::before { background: ${n}, ${x.grain}; background-size: ${m.noise.size || '240px'} auto, auto; }`);
      out.push(`${s} body { background-image: ${n}, var(--ui-body-art, none); }`);
      out.push(`${s} .mode-card__bg { background: ${n}, ${x.card}; }`);
      out.push(`${s} .scard__bg { background: ${n}, ${x.card}, linear-gradient(180deg, ${light ? '#3a3e42, #1d2023' : 'var(--bg-3), var(--bg-1)'}); }`);
    }
    if (m.frame) out.push(`${s} :is(.panel, .modal__box, .mode-card, .seat, .gtop__center) { box-shadow: ${m.frame}; }`);
    if (m.edge) out.push(`${s} :is(.panel, .modal__box, .mode-card, .seat) { border: ${m.edge}; }`);
    if (m.extra) out.push(m.extra.replaceAll('$S', s));
  }
  return `/* ---- texture layer (tools/ui-theme-textures.mjs) */\n${out.join('\n')}\n`;
}
