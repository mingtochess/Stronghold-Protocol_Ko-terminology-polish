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
    btn: `border-radius: 0; font-family: var(--font-display); letter-spacing: .16em;`,
    primary: `background: linear-gradient(90deg, #b3171f, #7a0c12); color: #f4f0ec; border-color: rgba(255, 255, 255, .7);`,
    extra: `:root[data-ui-theme="is-phantom"] .micro::before { content: '◆ '; color: #e3a33b; }
:root[data-ui-theme="is-phantom"] :is(.panel, .modal__box)::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .45), transparent); pointer-events: none; }
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
:root[data-ui-theme="is-sarkaz"] :is(.panel, .modal__box)::after { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: linear-gradient(180deg, #b3202a, transparent 70%); pointer-events: none; }`,
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
:root[data-ui-theme="is-blackflow"] .num { font-family: 'Cormorant Garamond', var(--font-num); }`,
    bondFilter: 'sepia(.5) saturate(1.1) brightness(1.05)',
  },
  // ---- 진영 (core bonds) ---------------------------------------------------------------------------------------------
  {
    id: 'f-yan', name: '염국', group: 'faction',
    p: { bg: ['#140807', '#1d0c0a', '#28110e', '#331612', '#3f1c17'], line: ['#5a241b', '#7c3324', '#a44a33'],
      accent: '#e0a43a', glow: '#ffcf6b', accent2: '#d33a2c', text: ['#fbefe0', '#e2ccb3', '#b2967c', '#8a705a'], onAccent: '#200c04' },
    body: `background-color: var(--bg-0);
  background-image: radial-gradient(circle at 50% 50%, transparent 58%, rgba(224, 164, 58, .07) 59% 61%, transparent 62%),
    radial-gradient(70% 55% at 50% 0%, rgba(211, 58, 44, .25), transparent 70%), linear-gradient(180deg, #1d0b09, #0b0403);
  background-size: .7rem .7rem, 100% 100%, 100% 100%;`,
    panel: `background: linear-gradient(180deg, rgba(51, 22, 18, .94), rgba(22, 9, 7, .96)); border: 1px solid #a44a33; border-radius: .03rem;
  box-shadow: inset 0 0 0 2px rgba(20, 8, 7, .9), inset 0 0 0 3px rgba(224, 164, 58, .35), 0 .08rem .3rem rgba(0, 0, 0, .55);`,
    btn: `border-radius: .03rem;`,
    primary: `background: linear-gradient(180deg, #d9402f, #9c2116); color: #fff1dc; border-color: #e0a43a;`,
    bondFilter: 'hue-rotate(195deg) saturate(1.2) sepia(.25)',
  },
  {
    id: 'f-sargon', name: '사르곤', group: 'faction', light: true,
    p: { bg: ['#efe3c8', '#f6ecd6', '#fcf6e8', '#e6d6b4', '#dac69d'], line: ['#cdb284', '#a98a55', '#7c6234'],
      accent: '#874b08', glow: '#b8670f', accent2: '#2a7a6f', text: ['#241708', '#47341a', '#5f4b2a', '#6a5836'], onAccent: '#fff6e6' },
    body: `background-color: var(--bg-0);
  background-image: repeating-linear-gradient(170deg, rgba(164, 93, 16, .05) 0 .06rem, transparent .06rem .3rem),
    radial-gradient(70% 50% at 80% 0%, rgba(255, 200, 100, .35), transparent 70%), linear-gradient(180deg, #f6ead0, #e1cda3);`,
    panel: `background: linear-gradient(180deg, rgba(252, 246, 232, .97), rgba(242, 230, 205, .97)); border: 1px solid #a98a55; border-radius: .04rem;
  box-shadow: 0 .05rem .2rem rgba(90, 60, 20, .16);`,
    btn: `border-radius: .04rem;`,
    primary: `background: linear-gradient(180deg, #c9771e, #94500c); color: #fff6e6; border-color: #7c4408;`,
    bondFilter: 'invert(1) sepia(.7) hue-rotate(-10deg) saturate(1.2)',
  },
  {
    id: 'f-victoria', name: '빅토리아', group: 'faction',
    p: { bg: ['#070b16', '#0c1222', '#121a30', '#18213d', '#1f2a4b'], line: ['#2a3658', '#3c4b76', '#5a6c9c'],
      accent: '#d4af5a', glow: '#f0cd78', accent2: '#b23a48', text: ['#eef1fa', '#c6cde2', '#8f98b5', '#6a7392'], onAccent: '#140f02' },
    body: `background-color: var(--bg-0);
  background-image: linear-gradient(45deg, rgba(212, 175, 90, .04) 25%, transparent 25% 75%, rgba(212, 175, 90, .04) 75%),
    linear-gradient(45deg, rgba(212, 175, 90, .04) 25%, transparent 25% 75%, rgba(212, 175, 90, .04) 75%),
    radial-gradient(70% 50% at 50% 0%, rgba(80, 100, 170, .3), transparent 70%), linear-gradient(180deg, #0c1326, #04070e);
  background-size: .5rem .5rem, .5rem .5rem, 100% 100%, 100% 100%; background-position: 0 0, .25rem .25rem, 0 0, 0 0;`,
    panel: `background: linear-gradient(180deg, rgba(24, 33, 61, .95), rgba(10, 15, 30, .96)); border: 1px solid #d4af5a; border-radius: 0;
  box-shadow: inset 0 0 0 3px rgba(7, 11, 22, .9), inset 0 0 0 4px rgba(212, 175, 90, .3), 0 .08rem .3rem rgba(0, 0, 0, .55);`,
    btn: `border-radius: 0; font-family: var(--font-display); letter-spacing: .1em;`,
    primary: `background: linear-gradient(180deg, #e6c46f, #b38a3a); color: #140f02; border-color: #f0cd78;`,
    bondFilter: 'hue-rotate(185deg) sepia(.4) saturate(1.1)',
  },
  {
    id: 'f-kjerag', name: '쉐라그', group: 'faction', light: true,
    p: { bg: ['#eef3f7', '#f6f9fb', '#ffffff', '#e2eaf0', '#d4dfe8'], line: ['#bccbd7', '#97abbc', '#6d8597'],
      accent: '#2f5f92', glow: '#4f8cc5', accent2: '#c0392b', text: ['#132030', '#33465a', '#4c5f72', '#576a7c'], onAccent: '#ffffff' },
    body: `background-color: var(--bg-0);
  background-image: linear-gradient(150deg, transparent 55%, rgba(120, 150, 180, .2) 55% 75%, transparent 75%),
    linear-gradient(210deg, transparent 62%, rgba(100, 130, 165, .18) 62% 80%, transparent 80%), linear-gradient(180deg, #fafcfd, #dde7ee);`,
    panel: `background: rgba(255, 255, 255, .96); border: 1px solid #bccbd7; border-radius: .08rem; box-shadow: 0 .05rem .2rem rgba(30, 60, 90, .12);`,
    btn: `border-radius: .08rem;`,
    primary: `background: linear-gradient(180deg, #4a80b8, #2c5c8f); color: #fff; border-color: #2c5c8f;`,
    bondFilter: 'invert(1) hue-rotate(190deg) brightness(1.04)',
  },
  {
    id: 'f-laterano', name: '라테라노', group: 'faction', light: true,
    p: { bg: ['#f4f1ea', '#faf8f2', '#ffffff', '#ebe6da', '#e0d9c8'], line: ['#d6cbb2', '#b9a77f', '#8f7b50'],
      accent: '#7f5d10', glow: '#a87d1f', accent2: '#c2455a', text: ['#1e1a12', '#3f382a', '#575040', '#655c4a'], onAccent: '#ffffff' },
    body: `background-color: var(--bg-0);
  background-image: radial-gradient(circle at 50% -20%, rgba(255, 220, 140, .45), transparent 45%),
    conic-gradient(from 0deg at 50% -10%, rgba(224, 178, 74, .06) 0 10deg, transparent 10deg 20deg, rgba(224, 178, 74, .06) 20deg 30deg, transparent 30deg 360deg),
    linear-gradient(180deg, #fbf9f3, #ece5d3);`,
    panel: `background: rgba(255, 255, 255, .97); border: 1px solid #d6cbb2; border-radius: .2rem .2rem .04rem .04rem;
  box-shadow: 0 .05rem .2rem rgba(120, 95, 40, .14), inset 0 2px 0 rgba(224, 178, 74, .45);`,
    btn: `border-radius: .2rem;`,
    primary: `background: linear-gradient(180deg, #c99a33, #95701b); color: #fff; border-color: #7f5e14;`,
    extra: `@keyframes ui-halo { from { box-shadow: 0 0 0 0 rgba(224, 178, 74, .6); } to { box-shadow: 0 0 0 .1rem rgba(224, 178, 74, 0); } }
@media (prefers-reduced-motion: no-preference) { :root[data-ui-theme="f-laterano"] .btn:hover { animation: ui-halo .9s ease-out infinite; } }`,
    bondFilter: 'invert(1) sepia(.6) hue-rotate(-5deg) brightness(1.03)',
  },
  {
    id: 'f-aegir', name: '에기르', group: 'faction',
    p: { bg: ['#020c10', '#05151b', '#091f27', '#0d2933', '#123440'], line: ['#14404c', '#1d5a68', '#2b7f90'],
      accent: '#22d3c5', glow: '#7cf5e8', accent2: '#3d7bff', text: ['#e6fbfa', '#b2dcda', '#76a4a3', '#557d7e'], onAccent: '#011312' },
    body: `background-color: var(--bg-0);
  background-image: linear-gradient(rgba(34, 211, 197, .06) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 197, .06) 1px, transparent 1px),
    radial-gradient(80% 60% at 50% 120%, rgba(34, 211, 197, .18), transparent 70%), linear-gradient(180deg, #04141a, #010608);
  background-size: .4rem .4rem, .4rem .4rem, 100% 100%, 100% 100%;`,
    panel: `background: linear-gradient(180deg, rgba(13, 41, 51, .9), rgba(3, 14, 18, .94)); border: 1px solid rgba(34, 211, 197, .5); border-radius: .02rem;
  clip-path: polygon(.12rem 0, 100% 0, 100% calc(100% - .12rem), calc(100% - .12rem) 100%, 0 100%, 0 .12rem);
  box-shadow: inset 0 0 .2rem rgba(34, 211, 197, .12);`,
    btn: `clip-path: polygon(.08rem 0, 100% 0, 100% calc(100% - .08rem), calc(100% - .08rem) 100%, 0 100%, 0 .08rem);`,
    primary: `background: linear-gradient(90deg, #22d3c5, #1a8fd8); color: #011312; border-color: transparent;`,
    extra: `@keyframes ui-scan { from { background-position: 0 -100%; } to { background-position: 0 200%; } }
@media (prefers-reduced-motion: no-preference) { :root[data-ui-theme="f-aegir"] .btn:hover { background-image: linear-gradient(180deg, transparent 40%, rgba(124, 245, 232, .25) 50%, transparent 60%); background-size: 100% 200%; animation: ui-scan 1s linear infinite; } }`,
    bondFilter: 'hue-rotate(10deg) saturate(1.2)',
  },
  {
    id: 'f-siracusa', name: '시라쿠사', group: 'faction',
    p: { bg: ['#0b0909', '#131010', '#1b1616', '#231c1c', '#2c2323'], line: ['#3b2e2e', '#544040', '#765a5a'],
      accent: '#b8955a', glow: '#e0bf82', accent2: '#8a1c2b', text: ['#f1ebe4', '#cfc4ba', '#9c9087', '#776c64'], onAccent: '#140d04' },
    body: `background-color: var(--bg-0);
  background-image: repeating-linear-gradient(90deg, rgba(184, 149, 90, .05) 0 1px, transparent 1px .3rem),
    radial-gradient(50% 70% at 50% 40%, rgba(255, 240, 210, .07), transparent 70%), linear-gradient(180deg, #151111, #050404);`,
    panel: `background: linear-gradient(180deg, rgba(35, 28, 28, .96), rgba(14, 11, 11, .97)); border: 1px solid #765a5a; border-radius: 0;
  box-shadow: 0 0 0 1px rgba(184, 149, 90, .35), 0 .1rem .4rem rgba(0, 0, 0, .6);`,
    btn: `border-radius: 0; letter-spacing: .14em; font-family: var(--font-display);`,
    primary: `background: linear-gradient(180deg, #2b1a1a, #120a0a); color: #e0bf82; border-color: #b8955a;`,
    extra: `:root[data-ui-theme="f-siracusa"] .btn--primary:hover { background: #8a1c2b; color: #f1ebe4; }
:root[data-ui-theme="f-siracusa"] body { filter: none; }`,
    bondFilter: 'grayscale(.7) sepia(.5) hue-rotate(-15deg)',
  },
  {
    id: 'f-kazimierz', name: '카시미어', group: 'faction',
    p: { bg: ['#0b0a0c', '#141216', '#1d1a20', '#26222a', '#302a35'], line: ['#3f3846', '#5a5064', '#7d7088'],
      accent: '#e8e2d0', glow: '#ffffff', accent2: '#d22d3d', text: ['#f6f3ec', '#d3cdc2', '#a29b90', '#7d776e'], onAccent: '#141011' },
    body: `background-color: var(--bg-0);
  background-image: linear-gradient(135deg, rgba(210, 45, 61, .12) 0 30%, transparent 30%),
    linear-gradient(315deg, rgba(232, 226, 208, .05) 0 25%, transparent 25%), linear-gradient(180deg, #161419, #070608);`,
    panel: `background: linear-gradient(180deg, rgba(38, 34, 42, .95), rgba(15, 13, 17, .96)); border: 1px solid #5a5064; border-left: 3px solid #d22d3d; border-radius: 0;
  box-shadow: 0 .08rem .3rem rgba(0, 0, 0, .5);`,
    btn: `border-radius: 0; transform: skewX(-8deg);`,
    primary: `background: linear-gradient(90deg, #e8e2d0, #c9c1aa); color: #141011; border-color: #ffffff;`,
    extra: `:root[data-ui-theme="f-kazimierz"] .btn > * { transform: skewX(8deg); }
:root[data-ui-theme="f-kazimierz"] .btn:hover { box-shadow: -3px 0 0 #d22d3d; }`,
    bondFilter: 'grayscale(1) brightness(1.15)',
  },
  {
    id: 'f-ursus', name: '우르수스', group: 'faction',
    p: { bg: ['#0c0d0e', '#141617', '#1c1f21', '#24282a', '#2d3235'], line: ['#3a4044', '#525a5f', '#737d83'],
      accent: '#c9473a', glow: '#ff6a55', accent2: '#c7ccd0', text: ['#eef0f1', '#c8cdd0', '#959da2', '#71787d'], onAccent: '#fff2ef' },
    body: `background-color: var(--bg-0);
  background-image: repeating-linear-gradient(45deg, rgba(200, 205, 210, .03) 0 .04rem, transparent .04rem .16rem),
    radial-gradient(80% 50% at 50% 0%, rgba(201, 71, 58, .14), transparent 70%), linear-gradient(180deg, #16191b, #060707);`,
    panel: `background: linear-gradient(180deg, rgba(36, 40, 42, .96), rgba(15, 17, 18, .97)); border: 2px solid #3a4044; border-radius: 0;
  box-shadow: inset 0 0 0 1px rgba(201, 71, 58, .25), 0 .08rem .3rem rgba(0, 0, 0, .6);`,
    btn: `border-radius: 0; border-width: 2px;`,
    primary: `background: linear-gradient(180deg, #d4513f, #9b2f22); color: #fff2ef; border-color: #ff6a55;`,
    bondFilter: 'grayscale(.6) hue-rotate(180deg) saturate(1.5)',
  },
  {
    id: 'f-leithanien', name: '라이타니엔', group: 'faction',
    p: { bg: ['#0c0912', '#130f1c', '#1b1527', '#231b33', '#2c2240'], line: ['#3b2e55', '#544276', '#76609e'],
      accent: '#d8b86a', glow: '#f2d58c', accent2: '#9b7bff', text: ['#f4f0fb', '#d0c8e2', '#9d94b4', '#787090'], onAccent: '#160f02' },
    body: `background-color: var(--bg-0);
  background-image: repeating-linear-gradient(0deg, transparent 0 .5rem, rgba(216, 184, 106, .06) .5rem calc(.5rem + 1px), transparent calc(.5rem + 1px) .52rem,
      rgba(216, 184, 106, .06) .52rem calc(.52rem + 1px), transparent calc(.52rem + 1px) .54rem),
    radial-gradient(70% 55% at 50% 0%, rgba(155, 123, 255, .25), transparent 70%), linear-gradient(180deg, #161024, #07050b);`,
    panel: `background: linear-gradient(180deg, rgba(35, 27, 51, .94), rgba(15, 11, 22, .96)); border: 1px solid #76609e; border-radius: .14rem .02rem;
  box-shadow: 0 .08rem .3rem rgba(0, 0, 0, .5), inset 0 0 0 1px rgba(216, 184, 106, .18);`,
    btn: `border-radius: .14rem .02rem;`,
    primary: `background: linear-gradient(180deg, #e6c87c, #b8953f); color: #160f02; border-color: #f2d58c;`,
    extra: `@keyframes ui-note { from { letter-spacing: .06em; } to { letter-spacing: .14em; } }
@media (prefers-reduced-motion: no-preference) { :root[data-ui-theme="f-leithanien"] .btn:hover .btn__label { animation: ui-note .4s var(--ease-out) forwards; } }`,
    bondFilter: 'hue-rotate(205deg) sepia(.3) saturate(1.2)',
  },
];

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
    '--bond-filter': t.bondFilter || 'none',
  };
  if (light) Object.assign(v, {
    '--ink-hi': text[0], '--ink-md': text[1], '--ink-lo': text[2], '--ink-rgb': rgb(text[0]), '--surf-hi': '#ffffff', '--dim-rgb': '150, 150, 150',
    '--bond-name': text[0], '--rt-vup': '#0a6fb5', '--ice': '#0a6fb5', '--red-premium': '#c62828', '--amber': '#a36000', '--gold': '#8a6d00', '--gold-2': '#7d5f00',
  });
  if (accent2) v['--ui-accent-2'] = accent2;
  return v;
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
  ${t.body}
}
${sel} .screen:not(.gm) { background: transparent; }
${sel} .panel,
${sel} .modal__box {
  ${t.panel}
}
${sel} .btn { ${t.btn} }
${sel} .btn--primary { ${t.primary.replace(/background:\s*([^;]+);/, '--ui-primary-face: $1; background-color: var(--mint-500);')} }
${sel} .modal { background: ${t.light ? 'rgba(40, 40, 40, .35)' : 'rgba(0, 0, 0, .6)'}; }
${t.light ? `${sel} :is(.btn--secondary, .btn--ghost) { --btn-bg: #ffffff; --btn-bg-hover: ${t.p.bg[1]}; }\n` : ''}${t.extra ? t.extra + '\n' : ''}${textureCss(t.id, !!t.light)}`;
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
