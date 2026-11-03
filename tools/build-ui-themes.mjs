// tools/build-ui-themes.mjs — generates public/css/themes/<id>.css for the spec'd UI themes (ui/uiThemes.js) and prints
// the registry entries. `node tools/build-ui-themes.mjs` rewrites every generated theme; the hand-written themes
// (space, white, rhine) are not touched. Each theme: a palette (every token css/theme.css exposes, the surface / ink
// fallbacks derived from it), a page backdrop, the panel and button shapes and their hover motion, extra decoration.
// Art direction only — no official artwork, logos or text: patterns are CSS gradients.
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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
    p: { bg: ['#0e0709', '#170b0f', '#221016', '#2c151c', '#381a23'], line: ['#4a2029', '#6a2c38', '#93465a'],
      accent: '#ec3a55', glow: '#ff5a6e', accent2: '#d9b25f', text: ['#f6ece6', '#d8c3bb', '#a68a83', '#7d625d'], onAccent: '#fff3f0' },
    body: `background-color: var(--bg-0);
  background-image:
    repeating-linear-gradient(90deg, rgba(120, 10, 30, .22) 0 .18rem, rgba(60, 5, 15, .22) .18rem .36rem),
    radial-gradient(60% 45% at 50% 0%, rgba(255, 220, 170, .14), transparent 70%), linear-gradient(180deg, #1a0a0f, #070304);`,
    panel: `background: linear-gradient(180deg, rgba(44, 21, 28, .94), rgba(18, 8, 11, .96)); border: 1px solid #d9b25f; border-radius: 0;
  box-shadow: 0 0 0 3px rgba(14, 7, 9, .9), 0 0 0 4px rgba(217, 178, 95, .45), 0 .1rem .4rem rgba(0, 0, 0, .6);`,
    btn: `border-radius: 0; font-family: var(--font-display); letter-spacing: .12em;`,
    primary: `background: linear-gradient(180deg, #d81b3a, #8e0b20); color: #fff3f0; border-color: #d9b25f;`,
    extra: `@keyframes ui-curtain { from { transform: scaleY(0); } to { transform: scaleY(1); } }
:root[data-ui-theme="is-phantom"] .btn:hover { box-shadow: 0 0 0 1px #d9b25f, 0 0 .14rem rgba(255, 59, 82, .55); }
:root[data-ui-theme="is-phantom"] .modal__box { animation: ui-curtain .28s var(--ease-out); transform-origin: top; }
:root[data-ui-theme="is-phantom"] .micro { color: #d9b25f; letter-spacing: .2em; }`,
    bondFilter: 'hue-rotate(195deg) saturate(1.3) brightness(.95)',
  },
  {
    id: 'is-mizuki', name: '미즈키 & 카이룰라 아버', group: 'is',
    p: { bg: ['#020a14', '#06121f', '#0a1b2c', '#0f2438', '#142e45'], line: ['#16394f', '#1f5068', '#2f7590'],
      accent: '#3fe0e8', glow: '#6fffd8', accent2: '#4b8cff', text: ['#e8fbff', '#b5dbe6', '#7ba4b4', '#577c8b'], onAccent: '#021016' },
    body: `background-color: var(--bg-0);
  background-image:
    radial-gradient(2px 2px at 15% 25%, rgba(111, 255, 216, .6), transparent 70%), radial-gradient(2px 2px at 65% 70%, rgba(63, 224, 232, .5), transparent 70%),
    radial-gradient(1.5px 1.5px at 85% 35%, rgba(150, 200, 255, .5), transparent 70%),
    radial-gradient(90% 70% at 50% -10%, rgba(40, 130, 190, .35), transparent 70%), linear-gradient(180deg, #06182a, #01060c);
  background-size: 220px 220px, 300px 300px, 260px 260px, 100% 100%, 100% 100%;`,
    panel: `background: linear-gradient(180deg, rgba(15, 36, 56, .8), rgba(4, 14, 26, .9)); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
  border: 1px solid rgba(63, 224, 232, .35); border-radius: .18rem; box-shadow: 0 0 .3rem rgba(63, 224, 232, .14), inset 0 1px 0 rgba(180, 255, 255, .08);`,
    btn: `border-radius: .3rem;`,
    primary: `background: linear-gradient(180deg, #4ff0e8, #1fa8c8); color: #021016; border-color: #8ffff0;`,
    extra: `@keyframes ui-ripple { from { box-shadow: 0 0 0 0 rgba(63, 224, 232, .55); } to { box-shadow: 0 0 0 .14rem rgba(63, 224, 232, 0); } }
@media (prefers-reduced-motion: no-preference) { :root[data-ui-theme="is-mizuki"] .btn:hover { animation: ui-ripple 1.1s ease-out infinite; } }`,
    bondFilter: 'hue-rotate(20deg) saturate(1.2)',
  },
  {
    id: 'is-frost', name: '탐험가의 은빛 서리 끝자락', group: 'is', light: true,
    p: { bg: ['#e7eef3', '#f2f6f9', '#ffffff', '#dde6ec', '#cfdbe3'], line: ['#b7c7d2', '#94a9b8', '#6b8396'],
      accent: '#245f88', glow: '#4a9ccd', accent2: '#8a6d3b', text: ['#14212b', '#354754', '#4d5f6c', '#56687a'], onAccent: '#ffffff' },
    body: `background-color: var(--bg-0);
  background-image:
    radial-gradient(1.5px 1.5px at 20% 20%, rgba(255, 255, 255, .95), transparent 70%), radial-gradient(2px 2px at 70% 50%, rgba(255, 255, 255, .9), transparent 70%),
    linear-gradient(160deg, transparent 60%, rgba(140, 170, 195, .25) 60% 62%, transparent 62%),
    linear-gradient(200deg, transparent 70%, rgba(110, 145, 175, .22) 70% 72%, transparent 72%),
    linear-gradient(180deg, #f4f8fb, #d9e4ec);
  background-size: 140px 140px, 190px 190px, 100% 100%, 100% 100%, 100% 100%;`,
    panel: `background: linear-gradient(180deg, rgba(255, 255, 255, .95), rgba(240, 246, 250, .95)); border: 1px solid #b7c7d2; border-radius: .04rem;
  box-shadow: 0 .05rem .2rem rgba(40, 70, 95, .14); border-top: 2px solid #2a6f9e;`,
    btn: `border-radius: .04rem;`,
    primary: `background: linear-gradient(180deg, #3480b4, #22608a); color: #fff; border-color: #22608a;`,
    extra: `:root[data-ui-theme="is-frost"] .btn:hover { box-shadow: 0 0 0 1px #5db6e8, 0 0 .12rem rgba(93, 182, 232, .5); }
:root[data-ui-theme="is-frost"] .micro { letter-spacing: .24em; }`,
    bondFilter: 'invert(1) hue-rotate(185deg) brightness(1.05)',
  },
  {
    id: 'is-sarkaz', name: '살카즈의 영겁 기담', group: 'is',
    p: { bg: ['#0d0910', '#150f19', '#1e1524', '#271b2f', '#30223a'], line: ['#3e2c48', '#563d63', '#77578a'],
      accent: '#ff8a3d', glow: '#ffb35c', accent2: '#a66bff', text: ['#f5ebe6', '#d6c4bd', '#a3918d', '#7f6e6c'], onAccent: '#1a0b02' },
    body: `background-color: var(--bg-0);
  background-image:
    radial-gradient(45% 35% at 50% 105%, rgba(255, 138, 61, .35), transparent 70%),
    radial-gradient(2px 2px at 30% 70%, rgba(255, 179, 92, .5), transparent 70%), radial-gradient(1.5px 1.5px at 60% 80%, rgba(255, 179, 92, .4), transparent 70%),
    radial-gradient(70% 50% at 50% 0%, rgba(120, 70, 170, .2), transparent 70%), linear-gradient(180deg, #120c16, #070409);
  background-size: 100% 100%, 200px 200px, 260px 260px, 100% 100%, 100% 100%;`,
    panel: `background: linear-gradient(180deg, rgba(39, 27, 47, .93), rgba(16, 11, 20, .96)); border: 1px solid #563d63; border-radius: .06rem;
  box-shadow: 0 .08rem .3rem rgba(0, 0, 0, .55), inset 0 -.06rem .2rem rgba(255, 138, 61, .08);`,
    btn: `border-radius: .06rem;`,
    primary: `background: linear-gradient(180deg, #ff9a4d, #d9601e); color: #1a0b02; border-color: #ffc27a;`,
    extra: `@keyframes ui-ember { 0%, 100% { box-shadow: 0 0 .06rem rgba(255, 138, 61, .35); } 50% { box-shadow: 0 0 .18rem rgba(255, 179, 92, .7); } }
@media (prefers-reduced-motion: no-preference) { :root[data-ui-theme="is-sarkaz"] .btn--primary { animation: ui-ember 2.4s ease-in-out infinite; } }`,
    bondFilter: 'hue-rotate(-140deg) saturate(1.4)',
  },
  {
    id: 'is-sui', name: '쉐이의 기이한 계원', group: 'is', light: true,
    p: { bg: ['#efe8da', '#f6f1e6', '#fbf8f1', '#e7dfcd', '#ddd2bb'], line: ['#c9b99a', '#a8916a', '#7d6a4b'],
      accent: '#9a2c25', glow: '#b8473a', accent2: '#2f6b5e', text: ['#211a12', '#43382b', '#5c5140', '#685c4a'], onAccent: '#fbf3e6' },
    body: `background-color: var(--bg-0);
  background-image:
    radial-gradient(60% 40% at 15% 100%, rgba(40, 35, 30, .14), transparent 70%), radial-gradient(40% 30% at 90% 95%, rgba(40, 35, 30, .1), transparent 70%),
    radial-gradient(30% 22% at 80% 15%, rgba(168, 50, 42, .1), transparent 70%),
    repeating-linear-gradient(0deg, rgba(120, 100, 70, .035) 0 1px, transparent 1px 5px), linear-gradient(180deg, #f5efe2, #e6dcc7);`,
    panel: `background: linear-gradient(180deg, rgba(251, 248, 241, .97), rgba(243, 236, 222, .97)); border: 1px solid #a8916a; border-radius: 0;
  box-shadow: 0 0 0 3px rgba(251, 248, 241, .9), 0 0 0 4px rgba(168, 145, 106, .55), 0 .06rem .2rem rgba(60, 45, 25, .15);`,
    btn: `border-radius: 0;`,
    primary: `background: linear-gradient(180deg, #b8392f, #8e261f); color: #fbf3e6; border-color: #6e1c16;`,
    extra: `:root[data-ui-theme="is-sui"] .btn:hover { box-shadow: inset 0 0 0 1px #a8322a; }
:root[data-ui-theme="is-sui"] .topbar__title { letter-spacing: .24em; }`,
    bondFilter: 'invert(1) sepia(.5) hue-rotate(-15deg) brightness(1.02)',
  },
  {
    id: 'is-blackflow', name: '침몰자의 블랙 플로우', group: 'is',
    p: { bg: ['#040506', '#0a0c0e', '#111417', '#171b1f', '#1e2328'], line: ['#262c33', '#36404a', '#52606d'],
      accent: '#7fd1c2', glow: '#a8f0e2', accent2: '#3a5a8c', text: ['#e9eef0', '#c1cacd', '#8e999d', '#6c777b'], onAccent: '#031210' },
    body: `background-color: var(--bg-0);
  background-image:
    repeating-radial-gradient(ellipse at 50% 120%, rgba(127, 209, 194, .05) 0 .04rem, transparent .04rem .22rem),
    linear-gradient(180deg, rgba(10, 14, 18, 0) 50%, rgba(0, 0, 0, .55)), radial-gradient(70% 45% at 50% 0%, rgba(58, 90, 140, .2), transparent 70%),
    linear-gradient(180deg, #0b0e11, #020303);`,
    panel: `background: linear-gradient(180deg, rgba(23, 27, 31, .94), rgba(6, 7, 9, .97)); border: 1px solid #36404a; border-radius: .02rem .02rem .12rem .12rem;
  box-shadow: 0 .12rem .3rem rgba(0, 0, 0, .7), inset 0 -2px 0 rgba(127, 209, 194, .18);`,
    btn: `border-radius: .02rem .02rem .1rem .1rem;`,
    primary: `background: linear-gradient(180deg, #8fdccd, #4ea597); color: #031210; border-color: #a8f0e2;`,
    extra: `@keyframes ui-sink { from { transform: translateY(0); } 50% { transform: translateY(2px); } to { transform: translateY(0); } }
@media (prefers-reduced-motion: no-preference) { :root[data-ui-theme="is-blackflow"] .btn:hover { animation: ui-sink 1.4s ease-in-out infinite; } }`,
    bondFilter: 'grayscale(.5) hue-rotate(-10deg) brightness(.95)',
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
${sel} .btn--primary { ${t.primary} }
${sel} .modal { background: ${t.light ? 'rgba(40, 40, 40, .35)' : 'rgba(0, 0, 0, .6)'}; }
${t.light ? `${sel} :is(.btn--secondary, .btn--ghost) { --btn-bg: #ffffff; --btn-bg-hover: ${t.p.bg[1]}; }\n` : ''}${t.extra ? t.extra + '\n' : ''}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await mkdir(resolve(ROOT, 'public/css/themes'), { recursive: true });
  for (const t of THEMES) await writeFile(resolve(ROOT, `public/css/themes/${t.id}.css`), css(t));
  console.log(JSON.stringify(THEMES.map((t) => ({ id: t.id, name: t.name, group: t.group, light: !!t.light, swatch: t.swatch || [t.p.bg[0], t.p.accent] }))));
}
