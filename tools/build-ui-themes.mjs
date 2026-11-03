// tools/build-ui-themes.mjs — generates public/css/themes/<id>.css for the spec'd UI themes (ui/uiThemes.js) and prints
// the registry entries. `node tools/build-ui-themes.mjs` rewrites every generated theme; the hand-written themes
// (space, white, rhine) are not touched. Each theme: a palette (every token css/theme.css exposes, the surface / ink
// fallbacks derived from it), a page backdrop, the panel and button shapes and their hover motion, extra decoration.
// Art direction only — no official artwork, logos or text: patterns are CSS gradients.
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { textureCss } from './ui-theme-textures.mjs';
import { GUIDE_THEMES } from './ui-theme-guides.mjs';
import { shapeCss, motifCss } from './ui-theme-shapes.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hex = (h) => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const rgb = (h) => hex(h).join(', ');
const mixHex = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');

/** @typedef {{ id: string, name: string, group: string, light?: boolean, swatch?: [string, string], p: any, body: string,
 *  panel: string, btn: string, primary: string, extra?: string, bondFilter?: string }} ThemeSpec */
export const THEMES = [
  // ---- special ---------------------------------------------------------------------------------------------------
  {
    id: 'cyber', name: '사이버펑크', group: 'special',
    p: { bg: ['#07060c', '#0e0b17', '#161122', '#1d1630', '#261c3d'], line: ['#3a2a55', '#55397a', '#7b55a8'],
      accent: '#ff2e88', glow: '#00f0ff', accent2: '#ffe600', text: ['#f6f2ff', '#cbbfe6', '#9283b4', '#6f6290'], onAccent: '#0a0410' },
    body: `background-color: var(--bg-0);
  background-image:
    repeating-linear-gradient(0deg, rgba(0, 240, 255, .035) 0 1px, transparent 1px 4px),
    linear-gradient(rgba(255, 46, 136, .07) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 46, 136, .07) 1px, transparent 1px),
    radial-gradient(70% 60% at 85% 0%, rgba(255, 46, 136, .22), transparent 70%), radial-gradient(60% 55% at 0% 100%, rgba(0, 240, 255, .18), transparent 70%);
  background-size: 100% 4px, .6rem .6rem, .6rem .6rem, 100% 100%, 100% 100%;`,
    panel: `background: linear-gradient(160deg, rgba(29, 22, 48, .92), rgba(10, 8, 18, .94));
  border: 1px solid rgba(255, 46, 136, .55);
  clip-path: polygon(0 0, calc(100% - .16rem) 0, 100% .16rem, 100% 100%, .16rem 100%, 0 calc(100% - .16rem));
  box-shadow: inset 0 0 0 1px rgba(0, 240, 255, .12), 0 0 .2rem rgba(255, 46, 136, .25);`,
    btn: `clip-path: polygon(0 0, calc(100% - .1rem) 0, 100% .1rem, 100% 100%, .1rem 100%, 0 calc(100% - .1rem)); text-transform: uppercase;`,
    primary: `background: linear-gradient(90deg, #ff2e88, #b02cff); color: #fff; border-color: transparent; text-shadow: 0 0 6px rgba(255, 255, 255, .5);`,
    extra: `@keyframes ui-cyber-glitch { 0%, 100% { transform: none; text-shadow: none; } 20% { transform: translate(1px, -1px); text-shadow: -2px 0 #00f0ff, 2px 0 #ff2e88; } 40% { transform: translate(-1px, 1px); } 60% { transform: none; text-shadow: 2px 0 #00f0ff, -2px 0 #ff2e88; } }
@media (prefers-reduced-motion: no-preference) { :root[data-ui-theme="cyber"] .btn:hover .btn__label { animation: ui-cyber-glitch .35s steps(2) 1; } }
:root[data-ui-theme="cyber"] .micro { color: #00f0ff; }
:root[data-ui-theme="cyber"] .topbar__title { text-shadow: 0 0 .1rem rgba(255, 46, 136, .65); }`,
    bondFilter: 'hue-rotate(195deg) saturate(1.6)',
  },
  // ---- 통합전략 (Integrated Strategies 1-6) -------------------------------------------------------------------------
  {
    id: 'is-fungi', name: '케오베의 버섯 안개 미궁', group: 'is',
    p: { bg: ['#121412', '#1a1d1a', '#232723', '#2b302b', '#343a33'], line: ['#3d4439', '#525b4c', '#6e7a66'],
      accent: '#c9b27a', glow: '#e7d49a', accent2: '#8fb36b', text: ['#eeeadc', '#c9c4b2', '#97927f', '#726e5f'], onAccent: '#15130c' },
    body: `background-color: var(--bg-0);
  background-image:
    radial-gradient(4px 4px at 20% 30%, rgba(231, 212, 154, .18), transparent 70%), radial-gradient(3px 3px at 70% 60%, rgba(143, 179, 107, .16), transparent 70%),
    radial-gradient(5px 5px at 45% 85%, rgba(231, 212, 154, .12), transparent 70%),
    radial-gradient(80% 60% at 50% 110%, rgba(150, 160, 130, .22), transparent 70%), linear-gradient(180deg, #161816, #0d0f0d);
  background-size: 180px 180px, 240px 240px, 300px 300px, 100% 100%, 100% 100%;`,
    panel: `background: linear-gradient(180deg, rgba(43, 48, 43, .92), rgba(22, 25, 22, .95)); border: 1px solid #525b4c; border-radius: .12rem;
  box-shadow: 0 .06rem .3rem rgba(0, 0, 0, .5), inset 0 0 .3rem rgba(201, 178, 122, .06);`,
    btn: `border-radius: .1rem;`,
    primary: `background: linear-gradient(180deg, #d8c48d, #b29a62); color: #15130c; border-color: #e7d49a;`,
    extra: `@keyframes ui-spore { from { opacity: .0; transform: translateY(0); } 50% { opacity: .9; } to { opacity: 0; transform: translateY(-.3rem); } }
:root[data-ui-theme="is-fungi"] .btn:hover::before { content: ''; position: absolute; left: 50%; bottom: 0; width: 4px; height: 4px; border-radius: 50%; background: #e7d49a; animation: ui-spore 1.2s ease-out infinite; pointer-events: none; }`,
    bondFilter: 'sepia(.6) hue-rotate(-20deg) saturate(.8)',
  },
  {
    id: 'is-phantom', name: '팬텀 & 크림슨 솔리테어', group: 'is',
    // in-game (rogue_1): near-black stage with a red curtain, fading white hairlines, orange diamond markers, outlined pill
    // tags, roman numerals in a serif, a slanted mask, soft light blooms — no gilt frames
    p: { bg: ['#0a0808', '#121010', '#1a1616', '#221c1c', '#2b2323'], line: ['#3a3030', '#554646', '#7a6666'],
      accent: '#e3a33b', glow: '#f2c46a', accent2: '#b3171f', text: ['#f4f0ec', '#cfc6c0', '#9b918b', '#766d68'], onAccent: '#1a0f02' },
    body: `background-color: var(--bg-0);
  background-image: radial-gradient(60% 50% at 50% 0%, rgba(255, 225, 180, .10), transparent 70%),
    repeating-linear-gradient(90deg, rgba(110, 10, 18, .28) 0 .22rem, rgba(40, 4, 8, .28) .22rem .44rem),
    linear-gradient(180deg, #160809 0%, #060404 70%);`,
    panel: `background: linear-gradient(180deg, rgba(26, 22, 22, .9), rgba(10, 8, 8, .94)); border: 0; border-top: 1px solid rgba(255, 255, 255, .55); border-radius: 0;
  box-shadow: 0 .1rem .4rem rgba(0, 0, 0, .7);`,
    btn: `border-radius: 0; font-family: var(--font-display); letter-spacing: .06em;`,
    primary: `background: linear-gradient(90deg, #b3171f, #7a0c12); color: #f4f0ec; border-color: rgba(255, 255, 255, .7);`,
    extra: `:root[data-ui-theme="is-phantom"] .micro::before { content: '◆ '; color: #e3a33b; }
:root[data-ui-theme="is-phantom"] :is(.panel, .modal__box, .bpop, .dpanel)::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .45), transparent); pointer-events: none; }
:root[data-ui-theme="is-phantom"] .mode-card.is-selected { box-shadow: 0 0 .24rem rgba(227, 163, 59, .35); border-color: #e3a33b; }
:root[data-ui-theme="is-phantom"] :is(.dtag, .bslot__count, .ui-theme-chip) { border-radius: 999px; }`,
    bondFilter: 'hue-rotate(160deg) saturate(.9) brightness(1.05)',
  },
  {
    id: 'is-mizuki', name: '미즈키 & 카이룰라 아버', group: 'is',
    // in-game (rogue_2): navy-black depths, blue ink washes (shuimo), cyan particle glows, radial ray bursts, a thin
    // geometric numeral face, fine white rules, blue diamond points; magenta only for the boss
    p: { bg: ['#03060f', '#070c1a', '#0c1426', '#121b33', '#182341'], line: ['#1b2a4a', '#284066', '#3d5c8c'],
      accent: '#5fd4ff', glow: '#7ff7ff', accent2: '#d23c8f', text: ['#eaf6ff', '#b9cde6', '#7f95b6', '#5d7192'], onAccent: '#02101a' },
    body: `background-color: var(--bg-0);
  background-image: radial-gradient(45% 35% at 20% 30%, rgba(40, 80, 200, .28), transparent 70%), radial-gradient(40% 30% at 80% 75%, rgba(30, 60, 170, .22), transparent 70%),
    radial-gradient(2px 2px at 30% 40%, rgba(127, 247, 255, .7), transparent 70%), radial-gradient(1.5px 1.5px at 70% 60%, rgba(127, 247, 255, .5), transparent 70%),
    linear-gradient(180deg, #060b1a, #010208);
  background-size: 100% 100%, 100% 100%, 260px 260px, 320px 320px, 100% 100%;`,
    panel: `background: linear-gradient(180deg, rgba(12, 20, 38, .86), rgba(3, 6, 15, .92)); border: 1px solid rgba(95, 212, 255, .22); border-radius: 0;
  box-shadow: 0 0 .3rem rgba(40, 90, 220, .18);`,
    btn: `border-radius: 0; letter-spacing: .12em;`,
    primary: `background: linear-gradient(90deg, rgba(95, 212, 255, .9), rgba(60, 120, 255, .9)); color: #02101a; border-color: #bff3ff;`,
    extra: `:root[data-ui-theme="is-mizuki"] .micro::before { content: '◆ '; color: #4b8cff; }
:root[data-ui-theme="is-mizuki"] .btn:hover { box-shadow: 0 0 .16rem rgba(127, 247, 255, .5); }
:root[data-ui-theme="is-mizuki"] .num { font-weight: 300; letter-spacing: .04em; }`,
    bondFilter: 'hue-rotate(25deg) saturate(1.1)',
  },
  {
    id: 'is-frost', name: '탐험가의 은빛 서리 끝자락', group: 'is',
    // in-game (rogue_3): a night forest under a teal aurora, rune circles and constellation lines, cyan progress arcs,
    // pale-blue diamond outlines on dark translucent plates
    p: { bg: ['#040a0c', '#08131a', '#0d1c24', '#13262f', '#1a313b'], line: ['#1d3a44', '#2b5560', '#427c88'],
      accent: '#1fc4d6', glow: '#7af0d0', accent2: '#9b7bff', text: ['#e8f6f6', '#bad3d6', '#7f9ea3', '#5e7b80'], onAccent: '#021014' },
    body: `background-color: var(--bg-0);
  background-image: radial-gradient(60% 35% at 60% 0%, rgba(60, 220, 170, .28), transparent 70%), radial-gradient(40% 30% at 25% 5%, rgba(40, 160, 200, .22), transparent 70%),
    radial-gradient(1px 1px at 20% 30%, rgba(255, 255, 255, .8), transparent 70%), radial-gradient(1px 1px at 65% 20%, rgba(255, 255, 255, .7), transparent 70%),
    linear-gradient(180deg, #071a1e 0%, #030708 65%);
  background-size: 100% 100%, 100% 100%, 200px 200px, 260px 260px, 100% 100%;`,
    panel: `background: linear-gradient(180deg, rgba(13, 28, 36, .82), rgba(4, 10, 12, .9)); border: 1px solid rgba(122, 240, 208, .2); border-radius: 0;
  box-shadow: inset 0 1px 0 rgba(122, 240, 208, .12), 0 .08rem .3rem rgba(0, 0, 0, .55);`,
    btn: `border-radius: 0; letter-spacing: .14em;`,
    primary: `background: linear-gradient(90deg, #0e8fa8, #1fc4d6); color: #021014; border-color: #8ff4e6;`,
    extra: `:root[data-ui-theme="is-frost"] .micro::before { content: '◇ '; color: #7fd6ff; }
:root[data-ui-theme="is-frost"] .countdown { filter: drop-shadow(0 0 4px rgba(31, 196, 214, .5)); }`,
    bondFilter: 'hue-rotate(5deg) saturate(1.1)',
  },
  {
    id: 'is-sarkaz', name: '살카즈의 영겁 기담', group: 'is',
    // in-game (rogue_4): rough painted brush bands (ochre gold, blue, grey ink) behind the nodes, folk-art teal and ochre,
    // blood-red streaks, grey stone with stardust, a gold ring, white chevrons, torn edges
    p: { bg: ['#0b0b0c', '#141415', '#1c1c1e', '#252527', '#2e2e31'], line: ['#3a3a3d', '#545458', '#77777c'],
      accent: '#d9a63a', glow: '#f5c84a', accent2: '#b3202a', text: ['#f1eee8', '#cfcbc3', '#9a968f', '#77736d'], onAccent: '#1a1203' },
    body: `background-color: var(--bg-0);
  background-image: radial-gradient(1px 1px at 20% 30%, rgba(255, 255, 255, .5), transparent 70%), radial-gradient(1px 1px at 70% 70%, rgba(255, 255, 255, .4), transparent 70%),
    radial-gradient(50% 40% at 85% 10%, rgba(179, 32, 42, .14), transparent 70%), linear-gradient(180deg, #161617, #070707);
  background-size: 180px 180px, 240px 240px, 100% 100%, 100% 100%;`,
    panel: `background: linear-gradient(180deg, rgba(37, 37, 39, .93), rgba(14, 14, 15, .96)); border: 0; border-radius: 0;
  box-shadow: 0 .08rem .3rem rgba(0, 0, 0, .6);`,
    btn: `border-radius: 0;`,
    primary: `background: linear-gradient(100deg, transparent 0 4%, #d9a63a 6% 92%, transparent 95%), radial-gradient(60% 120% at 50% 50%, #e9bb55, #a87a1f); color: #1a1203; border-color: transparent;`,
    extra: `:root[data-ui-theme="is-sarkaz"] .micro::before { content: '» '; color: #f5c84a; }
:root[data-ui-theme="is-sarkaz"] :is(.panel, .modal__box, .bpop, .dpanel)::after { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: linear-gradient(180deg, #b3202a, transparent 70%); pointer-events: none; }`,
    bondFilter: 'sepia(.6) saturate(1.3) hue-rotate(-10deg)',
  },
  {
    id: 'is-sui', name: '쉐이의 기이한 계원', group: 'is', light: true,
    // in-game (rogue_5): jade-teal and cinnabar tiles with lattice borders, pink / mint auspicious clouds, octagonal
    // copper-coin frames, a pastel pink-to-mint wash, vertical calligraphy, paper grain
    p: { bg: ['#eef3ef', '#f6f8f5', '#ffffff', '#e2ebe5', '#d4e1d8'], line: ['#b7cfc4', '#7fa596', '#4c7a6a'],
      accent: '#167f78', glow: '#2fb3a8', accent2: '#b8232b', text: ['#14211d', '#34443e', '#52625c', '#5f6f69'], onAccent: '#ffffff' },
    body: `background-color: var(--bg-0);
  background-image: linear-gradient(180deg, rgba(245, 190, 205, .35), rgba(255, 255, 255, 0) 45%, rgba(150, 225, 200, .35)),
    radial-gradient(30% 20% at 12% 85%, rgba(31, 163, 154, .12), transparent 70%), radial-gradient(25% 18% at 88% 20%, rgba(184, 35, 43, .08), transparent 70%),
    linear-gradient(180deg, #f6f4f1, #e8f1ec);`,
    panel: `background: rgba(255, 255, 255, .94); border: 1px solid #7fa596; border-radius: 0;
  box-shadow: inset 0 0 0 3px #ffffff, inset 0 0 0 4px rgba(22, 127, 120, .35), 0 .05rem .2rem rgba(20, 60, 50, .12);`,
    btn: `border-radius: 0;`,
    primary: `background: linear-gradient(180deg, #1c948c, #12655f); color: #ffffff; border-color: #0c4a45;`,
    extra: `:root[data-ui-theme="is-sui"] .btn--danger { background-color: #b8232b; }
:root[data-ui-theme="is-sui"] .mode-card.is-selected { border-color: #b8232b; box-shadow: inset 0 0 0 3px #fff, inset 0 0 0 4px #b8232b; }
:root[data-ui-theme="is-sui"] .topbar__title { letter-spacing: .2em; }`,
    bondFilter: 'invert(1) hue-rotate(170deg) saturate(.9)',
  },
  {
    id: 'is-blackflow', name: '침몰자의 블랙 플로우', group: 'is',
    // in-game (rogue_6): black plates with soft pale-gold light and gold top / bottom rules on a selection, teal confirm
    // bars, red tags, an elegant serif numeral face, black root-like organics, drifting light particles
    p: { bg: ['#070706', '#0e0e0c', '#161613', '#1e1e1a', '#272721'], line: ['#2e2d26', '#46443a', '#6b6856'],
      accent: '#e6d48a', glow: '#fff0b0', accent2: '#3fb0a0', text: ['#f3f0e2', '#cfcab4', '#9b967f', '#76725f'], onAccent: '#14110a' },
    body: `background-color: var(--bg-0);
  background-image: radial-gradient(3px 3px at 25% 35%, rgba(255, 240, 176, .45), transparent 70%), radial-gradient(2px 2px at 70% 60%, rgba(255, 240, 176, .35), transparent 70%),
    radial-gradient(50% 40% at 50% 100%, rgba(230, 212, 138, .1), transparent 70%), linear-gradient(180deg, #0f0f0c, #030303);
  background-size: 300px 300px, 360px 360px, 100% 100%, 100% 100%;`,
    panel: `background: linear-gradient(180deg, rgba(30, 30, 26, .92), rgba(10, 10, 9, .96)); border: 0; border-radius: .06rem;
  box-shadow: 0 .1rem .35rem rgba(0, 0, 0, .7);`,
    btn: `border-radius: .04rem;`,
    primary: `background: linear-gradient(90deg, #2f8f83, #3fb0a0); color: #031210; border-color: transparent;`,
    extra: `:root[data-ui-theme="is-blackflow"] .mode-card.is-selected { box-shadow: inset 0 2px 0 #e6d48a, inset 0 -2px 0 #e6d48a, 0 0 .2rem rgba(230, 212, 138, .3); }
`,
    bondFilter: 'sepia(.5) saturate(1.1) brightness(1.05)',
  },
  // ---- 진영 (core bonds) ---------------------------------------------------------------------------------------------
  {
    id: 'f-yan', name: '염국', group: 'faction', light: true,
    // event 登临意: warm rice-paper beige, orange-brown ink washes, vertical brush calligraphy, a red seal
    p: { bg: ['#efe6d6', '#f6efe3', '#fbf7ef', '#e6dac4', '#d9c9ad'], line: ['#cdb894', '#a88a5c', '#7a6038'], accent: '#a8341f', glow: '#c4492c', accent2: '#2e2a24', text: ['#221a10', '#45382a', '#665746', '#6f6150'], onAccent: '#fbf3e6' },
    body: `background-color: var(--bg-0);
  background-image: radial-gradient(55% 40% at 85% 15%, rgba(200, 110, 50, .18), transparent 70%), radial-gradient(50% 35% at 10% 90%, rgba(60, 45, 30, .14), transparent 70%), linear-gradient(180deg, #f5ecdc, #e9dcc4);`,
    panel: `background: rgba(251, 247, 239, .95); border: 0; border-left: 3px solid #a8341f; border-radius: 0; box-shadow: 0 .04rem .18rem rgba(70, 50, 25, .14);`,
    btn: `border-radius: 0;`,
    primary: `background: #a8341f; color: #fbf3e6; border-color: #7e2414;`,
    extra: `:root[data-ui-theme="f-yan"] .topbar__title { letter-spacing: .28em; }
:root[data-ui-theme="f-yan"] .mode-card.is-selected { border-color: #a8341f; box-shadow: inset 0 0 0 1px #a8341f; }`,
    bondFilter: 'invert(1) sepia(.6) hue-rotate(-20deg) saturate(1.1)',
  },
  {
    id: 'f-sargon', name: '사르곤', group: 'faction',
    // event 生息演算·沙中之火 (Reclamation Algorithm): muted olive / sand, black rectangular plates, a pale lime highlight label, stencil-like type
    p: { bg: ['#1a1b16', '#22231d', '#2b2c25', '#35362e', '#404137'], line: ['#45463b', '#5e5f51', '#828371'], accent: '#dfe68a', glow: '#eef4a2', accent2: '#b89a62', text: ['#efeee4', '#cfcdbd', '#a19f8e', '#7f7d6d'], onAccent: '#14150c' },
    body: `background-color: var(--bg-0);
  background-image: linear-gradient(180deg, rgba(150, 140, 100, .12), transparent 40%), radial-gradient(70% 40% at 50% 100%, rgba(184, 154, 98, .16), transparent 70%), linear-gradient(180deg, #23241d, #121310);`,
    panel: `background: rgba(18, 18, 15, .92); border: 0; border-radius: 0; box-shadow: none;`,
    btn: `border-radius: 0; letter-spacing: .1em;`,
    primary: `background: #dfe68a; color: #14150c; border-color: #dfe68a;`,
    extra: `:root[data-ui-theme="f-sargon"] .section-label, :root[data-ui-theme="f-sargon"] .micro { color: #dfe68a; }
:root[data-ui-theme="f-sargon"] .mode-card.is-selected { border-color: #dfe68a; box-shadow: inset 0 0 0 1px #dfe68a; }`,
    bondFilter: 'grayscale(.4) sepia(.5) hue-rotate(20deg)',
  },
  {
    id: 'f-victoria', name: '빅토리아', group: 'faction',
    // event 照我以火 (What the Firelight Casts): deep violet-black, silver serif, a diamond lattice rule, purple flame glows
    p: { bg: ['#08070d', '#0f0d17', '#171421', '#1f1a2c', '#282238'], line: ['#2e2840', '#463c60', '#6a5c8c'], accent: '#c9c2e6', glow: '#a77bff', accent2: '#7b4cd8', text: ['#efedf7', '#c8c3db', '#948ead', '#706b88'], onAccent: '#0c0a14' },
    body: `background-color: var(--bg-0);
  background-image: radial-gradient(45% 35% at 75% 15%, rgba(140, 80, 230, .24), transparent 70%), radial-gradient(40% 30% at 15% 80%, rgba(110, 60, 200, .16), transparent 70%), linear-gradient(180deg, #110e1b, #050409);`,
    panel: `background: linear-gradient(180deg, rgba(31, 26, 44, .9), rgba(9, 8, 14, .95)); border: 1px solid rgba(201, 194, 230, .25); border-radius: 0; box-shadow: 0 .1rem .35rem rgba(0, 0, 0, .6);`,
    btn: `border-radius: 0; font-family: var(--font-display); letter-spacing: .06em;`,
    primary: `background: linear-gradient(180deg, #e0dbf2, #a9a1cc); color: #0c0a14; border-color: #efedf7;`,
    extra: `:root[data-ui-theme="f-victoria"] :is(.panel, .modal__box, .bpop, .dpanel)::after { content: ''; position: absolute; left: 20%; right: 20%; bottom: -1px; height: 5px; background: repeating-linear-gradient(90deg, transparent 0 4px, rgba(201, 194, 230, .5) 4px 6px); clip-path: polygon(0 50%, 50% 0, 100% 50%, 50% 100%); pointer-events: none; }`,
    bondFilter: 'hue-rotate(220deg) saturate(.7) brightness(1.1)',
  },
  {
    id: 'f-kjerag', name: '쉐라그', group: 'faction', light: true,
    // event 雪山降临: vivid royal blue and white, red ornament accents, a technical display type
    p: { bg: ['#eef2fb', '#f6f8fd', '#ffffff', '#e1e8f7', '#d0dbf2'], line: ['#b6c5e8', '#7f97d0', '#4d68b0'], accent: '#1f3fbf', glow: '#3c62e6', accent2: '#d22c3c', text: ['#0f1a3a', '#2c3a62', '#4a5880', '#56648c'], onAccent: '#ffffff' },
    body: `background-color: var(--bg-0);
  background-image: linear-gradient(120deg, rgba(31, 63, 191, .16), transparent 45%), radial-gradient(40% 30% at 90% 90%, rgba(60, 98, 230, .14), transparent 70%), linear-gradient(180deg, #f7f9fe, #e3eaf8);`,
    panel: `background: rgba(255, 255, 255, .96); border: 1px solid #b6c5e8; border-radius: 0; box-shadow: 0 .04rem .16rem rgba(20, 40, 110, .12);`,
    btn: `border-radius: 0; letter-spacing: .08em;`,
    primary: `background: linear-gradient(90deg, #1f3fbf, #3c62e6); color: #ffffff; border-color: #16308f;`,
    extra: `:root[data-ui-theme="f-kjerag"] .micro::before { content: '◆ '; color: #d22c3c; }`,
    bondFilter: 'invert(1) hue-rotate(195deg) saturate(1.2)',
  },
  {
    id: 'f-laterano', name: '라테라노', group: 'faction', light: true,
    // event 空想花庭 (Hortus de Escapismo): white marble, pale grey-blue, a widely spaced serif, halos, pink wing accents
    p: { bg: ['#f1f3f5', '#f8f9fa', '#ffffff', '#e5e9ed', '#d6dce2'], line: ['#c6ced6', '#98a4b0', '#6c7884'], accent: '#5a6c80', glow: '#e88aa6', accent2: '#e88aa6', text: ['#1a2027', '#38424d', '#55606b', '#606b76'], onAccent: '#ffffff' },
    body: `background-color: var(--bg-0);
  background-image: radial-gradient(circle at 50% -20%, rgba(255, 255, 255, .9), transparent 50%), radial-gradient(40% 30% at 85% 85%, rgba(232, 138, 166, .1), transparent 70%), linear-gradient(180deg, #f8f9fa, #e3e8ed);`,
    panel: `background: rgba(255, 255, 255, .95); border: 1px solid #c6ced6; border-radius: 0; box-shadow: 0 .04rem .2rem rgba(40, 60, 80, .1);`,
    btn: `border-radius: 0; font-family: var(--font-display); letter-spacing: .06em;`,
    primary: `background: linear-gradient(180deg, #6b7e93, #4c5d70); color: #ffffff; border-color: #3d4b5b;`,
    extra: `:root[data-ui-theme="f-laterano"] .mode-card.is-selected { border-color: #e88aa6; box-shadow: 0 0 0 1px #e88aa6, 0 0 .2rem rgba(232, 138, 166, .3); }
:root[data-ui-theme="f-laterano"] .topbar__title { letter-spacing: .3em; }`,
    bondFilter: 'invert(1) hue-rotate(180deg) saturate(.4) brightness(1.05)',
  },
  {
    id: 'f-aegir', name: '에기르', group: 'faction',
    // event 覆潮之下 (Under Tides): dark grey-black, slanted triangle splits, a widely spaced thin serif, a cold teal cast
    p: { bg: ['#0a0c0d', '#111416', '#181c1f', '#1f2428', '#272d32'], line: ['#2c3338', '#424b52', '#636e76'], accent: '#a9c2c4', glow: '#6fd0d0', accent2: '#2f8f8f', text: ['#e8eeee', '#c1cbcc', '#8e9a9c', '#6b7779'], onAccent: '#091011' },
    body: `background-color: var(--bg-0);
  background-image: linear-gradient(118deg, rgba(255, 255, 255, .04) 0 40%, transparent 40%), linear-gradient(118deg, transparent 0 62%, rgba(0, 0, 0, .35) 62%), linear-gradient(180deg, #161a1c, #050607);`,
    panel: `background: linear-gradient(180deg, rgba(31, 36, 40, .92), rgba(10, 12, 13, .96)); border: 0; border-top: 1px solid rgba(169, 194, 196, .35); border-radius: 0;`,
    btn: `border-radius: 0; font-family: var(--font-display); letter-spacing: .06em;`,
    primary: `background: linear-gradient(90deg, #8eaaac, #c2d6d7); color: #091011; border-color: transparent;`,
    extra: `:root[data-ui-theme="f-aegir"] .topbar__title { letter-spacing: .3em; font-weight: 400; }`,
    bondFilter: 'grayscale(.6) hue-rotate(150deg) brightness(1.1)',
  },
  {
    id: 'f-siracusa', name: '시라쿠사', group: 'faction',
    // event 叙拉古人 (Il Siracusano): monochrome noir greys, red titles with thin red rules, a serif
    p: { bg: ['#0b0b0b', '#121212', '#1a1a1a', '#222222', '#2b2b2b'], line: ['#333333', '#4a4a4a', '#6e6e6e'], accent: '#d1242f', glow: '#ff4a52', accent2: '#c9c9c9', text: ['#efefef', '#c9c9c9', '#969696', '#737373'], onAccent: '#ffffff' },
    body: `background-color: var(--bg-0);
  background-image: radial-gradient(60% 70% at 50% 40%, rgba(255, 255, 255, .05), transparent 70%), repeating-linear-gradient(0deg, rgba(255, 255, 255, .012) 0 1px, transparent 1px 3px), linear-gradient(180deg, #151515, #050505);`,
    panel: `background: linear-gradient(180deg, rgba(34, 34, 34, .94), rgba(12, 12, 12, .96)); border: 1px solid #333333; border-radius: 0; box-shadow: 0 .1rem .35rem rgba(0, 0, 0, .6);`,
    btn: `border-radius: 0; font-family: var(--font-display); letter-spacing: .06em;`,
    primary: `background: #d1242f; color: #ffffff; border-color: #ff4a52;`,
    extra: `:root[data-ui-theme="f-siracusa"] .section-label { color: #d1242f; }
:root[data-ui-theme="f-siracusa"] :is(.panel, .modal__box, .bpop, .dpanel)::after { content: ''; position: absolute; left: 0; right: 0; top: .1rem; height: 1px; background: linear-gradient(90deg, transparent, rgba(209, 36, 47, .6), transparent); pointer-events: none; }`,
    bondFilter: 'grayscale(1) contrast(1.1)',
  },
  {
    id: 'f-kazimierz', name: '카시미어', group: 'faction',
    // event 长夜临光 (Near Light): a sports-broadcast look — red / white / blue, a bold italic sans, sharp slashes
    p: { bg: ['#0a0d1a', '#111628', '#181f36', '#1f2844', '#283252'], line: ['#2b3658', '#3e4c7a', '#5f6fa4'], accent: '#e6283c', glow: '#ff4f62', accent2: '#2f6bff', text: ['#f4f6fc', '#ccd2e6', '#97a0bd', '#727b98'], onAccent: '#ffffff' },
    body: `background-color: var(--bg-0);
  background-image: linear-gradient(115deg, rgba(230, 40, 60, .16) 0 18%, transparent 18% 20%, rgba(255, 255, 255, .05) 20% 22%, transparent 22%), radial-gradient(60% 50% at 90% 10%, rgba(47, 107, 255, .2), transparent 70%), linear-gradient(180deg, #131a30, #05070d);`,
    panel: `background: linear-gradient(180deg, rgba(31, 40, 68, .92), rgba(10, 13, 26, .95)); border: 0; border-left: 4px solid #e6283c; border-radius: 0;`,
    btn: `border-radius: 0; font-weight: 800; letter-spacing: .04em;`,
    primary: `background: linear-gradient(100deg, #e6283c 0 70%, #2f6bff 70%); color: #ffffff; border-color: transparent;`,
    extra: `:root[data-ui-theme="f-kazimierz"] .topbar__title { font-weight: 800; }`,
    bondFilter: 'hue-rotate(150deg) saturate(1.4)',
  },
  {
    id: 'f-ursus', name: '우르수스', group: 'faction',
    // event 乌萨斯的孩子们 (Children of Ursus): a constructivist poster — orange / black stripes, a bold condensed type, a yellow highlight bar
    p: { bg: ['#0d0b08', '#15120d', '#1e1912', '#272118', '#312a1f'], line: ['#3a3022', '#564631', '#7a6446'], accent: '#f08a1c', glow: '#ffb040', accent2: '#f2d23a', text: ['#f6efe2', '#d6cab4', '#a69881', '#82765f'], onAccent: '#140a00' },
    body: `background-color: var(--bg-0);
  background-image: repeating-linear-gradient(90deg, rgba(240, 138, 28, .14) 0 .5rem, rgba(0, 0, 0, 0) .5rem 1rem), linear-gradient(180deg, rgba(240, 138, 28, .12), transparent 60%), linear-gradient(180deg, #1a140c, #060504);`,
    panel: `background: rgba(16, 13, 9, .94); border: 2px solid #f08a1c; border-radius: 0; box-shadow: none;`,
    btn: `border-radius: 0; font-weight: 900; letter-spacing: .02em;`,
    primary: `background: #f2d23a; color: #140a00; border-color: #140a00;`,
    extra: `:root[data-ui-theme="f-ursus"] .section-label { background: #f2d23a; color: #140a00; padding: 0 .08rem; }
:root[data-ui-theme="f-ursus"] .topbar__title { font-weight: 900; letter-spacing: 0; }`,
    bondFilter: 'sepia(.8) saturate(1.8) hue-rotate(-15deg)',
  },
  {
    id: 'f-leithanien', name: '라이타니엔', group: 'faction',
    // event 尘影余音 (Lingering Echoes): a dark burgundy concert hall, a gold calligraphic script, fine gold rules
    p: { bg: ['#0d0607', '#160a0c', '#200f12', '#2a1418', '#351a1f'], line: ['#3e1f25', '#5c2f37', '#834651'], accent: '#d6b56c', glow: '#f0d290', accent2: '#8a1c2b', text: ['#f5ece4', '#d8c7bb', '#a89488', '#857166'], onAccent: '#1a0f04' },
    body: `background-color: var(--bg-0);
  background-image: radial-gradient(50% 40% at 50% 0%, rgba(255, 220, 160, .1), transparent 70%), radial-gradient(60% 50% at 50% 100%, rgba(138, 28, 43, .22), transparent 70%), linear-gradient(180deg, #1a0b0e, #060203);`,
    panel: `background: linear-gradient(180deg, rgba(42, 20, 24, .92), rgba(13, 6, 7, .96)); border: 1px solid rgba(214, 181, 108, .35); border-radius: 0; box-shadow: 0 .1rem .35rem rgba(0, 0, 0, .65);`,
    btn: `border-radius: 0; font-family: var(--font-display); letter-spacing: .06em;`,
    primary: `background: linear-gradient(180deg, #8a1c2b, #5a0f1a); color: #f0d290; border-color: #d6b56c;`,
    extra: `:root[data-ui-theme="f-leithanien"] :is(.panel, .modal__box, .bpop, .dpanel)::after { content: ''; position: absolute; left: .12rem; right: .12rem; top: .06rem; height: 1px; background: linear-gradient(90deg, transparent, rgba(214, 181, 108, .55), transparent); pointer-events: none; }`,
    bondFilter: 'sepia(.7) saturate(1.2) hue-rotate(-10deg)',
  },
];
// the event-guide themes (tools/ui-theme-guides.mjs) replace the same ids and add the side-story group
for (const g of GUIDE_THEMES) { const i = THEMES.findIndex((t) => t.id === g.id); if (i >= 0) THEMES[i] = g; else THEMES.push(g); }

/** The HUD bond boards are official sprites drawn in mint (hue ≈ 162°): turned to the theme's accent hue, desaturated
 *  for a grey accent; never inverted (the board stays a dark disc, so its number keeps reading on every theme). */
function bondFilter(accent) {
  const [r, g, b] = hex(accent).map((v) => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
  const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  if (sat < .25) return `grayscale(${(1 - sat * 2).toFixed(2)}) brightness(1.05)`;
  return `hue-rotate(${Math.round(h - 162)}deg) saturate(${Math.min(1.4, .6 + sat * .8).toFixed(2)})`;
}

function tokens(t) {
  const { bg, line, accent, glow, accent2, text, onAccent } = t.p;
  const light = !!t.light;
  const surf = light ? [bg[3], bg[1], bg[2], '#ffffff'] : [bg[0], bg[1], bg[2], bg[3]];
  const v = {
    '--bg-0': bg[0], '--bg-1': bg[1], '--bg-2': bg[2], '--bg-3': bg[3], '--bg-4': bg[4],
    '--bg-deep': light ? bg[3] : mixHex(bg[0], '#000000', .2), '--bg-panel': light ? '#ffffff' : bg[1], '--bg-panel-2': light ? bg[1] : mixHex(bg[1], bg[0], .5), '--bg-tint': mixHex(bg[1], accent, .06),
    '--bg-0-rgb': rgb(bg[0]), '--bg-1-rgb': rgb(bg[1]), '--bg-glass-rgb': rgb(light ? '#ffffff' : bg[1]), '--shade-rgb': rgb(light ? bg[1] : mixHex(bg[0], '#000000', .3)),
    '--line': line[0], '--line-2': line[1], '--line-3': line[2],
    '--accent-rgb': rgb(accent), '--glow-rgb': rgb(glow),
    '--mint-500': accent, '--mint-400': light ? mixHex(accent, '#000000', .12) : mixHex(accent, '#ffffff', .2), '--mint-350': light ? mixHex(accent, '#000000', .08) : mixHex(accent, '#ffffff', .15),
    '--mint-600': mixHex(accent, '#000000', .1), '--mint-glow': light ? mixHex(accent, '#000000', .1) : glow, '--mint-700': light ? mixHex(accent, '#000000', .42) : mixHex(accent, '#000000', .12),
    '--mint-800': light ? mixHex(accent, '#ffffff', .7) : mixHex(accent, bg[0], .7), '--mint-900': light ? mixHex(accent, '#ffffff', .86) : mixHex(accent, bg[0], .84),
    '--text-on-mint': onAccent, '--text-hi': text[0], '--text-md': text[1], '--text-lo': text[2], '--text-dim': text[3],
    '--surf-0': surf[0], '--surf-1': surf[1], '--surf-2': surf[2], '--surf-3': surf[3],
    '--surf-0-rgb': rgb(surf[0]), '--surf-1-rgb': rgb(surf[1]), '--surf-2-rgb': rgb(surf[2]), '--surf-3-rgb': rgb(surf[3]),
    '--bond-filter': bondFilter(accent),
  };
  if (light) Object.assign(v, {
    '--ink-hi': text[0], '--ink-md': text[1], '--ink-lo': text[2], '--ink-rgb': rgb(text[0]), '--surf-hi': '#ffffff', '--dim-rgb': '150, 150, 150',
    '--bond-name': text[0], '--rt-vup': '#0a6fb5', '--ice': '#0a6fb5', '--red-premium': '#c62828', '--amber': '#a36000', '--gold': '#8a6d00', '--gold-2': '#7d5f00',
  });
  if (accent2) v['--ui-accent-2'] = accent2;
  return v;
}

/** Plain fills instead of the two-colour fades that only shaded a surface (meaningful gradients — patterns, light, a fade to
 *  transparent — are kept): a background that is a linear-gradient of colours only becomes its first colour, and the body's
 *  closing fade is dropped (its background-color stays). */
const COLOR = /^(#[0-9a-f]{3,8}|rgba?\([^)]*\))(\s+[\d.]+%)*$/i;
function splitTop(v) { const out = []; let d = 0, cur = ''; for (const ch of v) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && !d) { out.push(cur.trim()); cur = ''; } else cur += ch; } out.push(cur.trim()); return out; }
function flatFill(css) {
  return css.replace(/linear-gradient\(((?:[^()]|\([^()]*\))*)\)/g, (m, args, off, str) => {
    const before = str.slice(Math.max(0, off - 12), off);
    if (!/background(-color)?:\s*$/.test(before)) return m;
    const parts = splitTop(args); if (/deg|^to /.test(parts[0])) parts.shift();
    return parts.length >= 2 && parts.every((p) => COLOR.test(p)) ? parts[0].replace(/\s+[\d.]+%/g, '') : m;
  });
}
function flatBody(css) {
  if (/background-size/.test(css)) return css;
  return css.replace(/,\s*linear-gradient\(180deg, #[0-9a-f]{3,6}, #[0-9a-f]{3,6}\);/i, ';');
}

function css(t) {
  const sel = `:root[data-ui-theme="${t.id}"]`;
  const v = tokens(t);
  return `/* themes/${t.id}.css — ${t.name} (generated by tools/build-ui-themes.mjs — edit the spec there) */
${sel} {
  color-scheme: ${t.light ? 'light' : 'dark'};
${Object.entries(v).map(([k, x]) => `  ${k}: ${x};`).join('\n')}
}
${sel} body {
  ${flatBody(t.body)}
}
${sel} .screen:not(.gm) { background: transparent; }
${sel} .panel,
${sel} .modal__box,
${sel} .bpop,
${sel} .dpanel {
  ${flatFill(t.panel)}
}
${sel} .btn { ${t.btn} }
${sel} .btn--primary { ${flatFill(t.primary).replace(/background:\s*([^;]+);/, '--ui-primary-face: $1; background-color: var(--mint-500);')} }
${sel} .modal { background: ${t.light ? 'rgba(40, 40, 40, .35)' : 'rgba(0, 0, 0, .6)'}; }
${t.light ? `${sel} :is(.btn--secondary, .btn--ghost) { --btn-bg: #ffffff; --btn-bg-hover: ${t.p.bg[1]}; }\n` : ''}${t.extra ? t.extra + '\n' : ''}${textureCss(t.id, !!t.light)}${shapeCss(t.id)}${motifCss(t.id)}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await mkdir(resolve(ROOT, 'public/css/themes'), { recursive: true });
  // (an @import is only valid at the very top of a stylesheet)
  const hoist = (src) => { const imports = src.match(/^@import [^\n]+\n/gm) || []; return imports.join('') + imports.reduce((x, i) => x.replace(i, ''), src); };
  for (const t of THEMES) await writeFile(resolve(ROOT, `public/css/themes/${t.id}.css`), hoist(css(t)));
  // the hand-written themes get the texture layer between their markers
  for (const id of ['white', 'space', 'rhine']) {
    const p = resolve(ROOT, `public/css/themes/${id}.css`);
    const tx = textureCss(id, id !== 'space');
    const imports = (tx.match(/^@import [^\n]+\n/gm) || []).join('');
    const block = `/* tx:start */\n${tx.replace(/^@import [^\n]+\n/gm, '')}/* tx:end */\n`;
    let src = (await readFile(p, 'utf8')).replace(/^@import [^\n]+\n/gm, '');
    src = /\/\* tx:start \*\/[\s\S]*?\/\* tx:end \*\/\n/.test(src) ? src.replace(/\/\* tx:start \*\/[\s\S]*?\/\* tx:end \*\/\n/, block) : src + '\n' + block;
    await writeFile(p, imports + src);
  }
  console.log(JSON.stringify(THEMES.map((t) => ({ id: t.id, name: t.name, group: t.group, light: !!t.light, swatch: t.swatch || [t.p.bg[0], t.p.accent] }))));
}
