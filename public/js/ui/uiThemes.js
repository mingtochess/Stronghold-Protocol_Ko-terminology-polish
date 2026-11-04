// ui/uiThemes.js — UI 테마 (title screen picker): each theme is a stylesheet css/themes/<id>.css loaded on demand and
// keyed by <html data-ui-theme>. A theme restyles every HTML UI — menus, rooms, the prep / battle HUD (shop, bond list,
// panels) — never what the renderer draws (battlefield, units, effects, the official HP bars). A theme with `assets`
// (images) asks before it downloads them; until they are in, its CSS-only look is shown.
import { UI_THEME_ASSETS } from './uiThemeAssets.js';
/** Theme groups of the picker, in order. */
export const UI_THEME_GROUPS = Object.freeze([
  Object.freeze({ id: 'basic', name: '기본' }), Object.freeze({ id: 'special', name: '스타일' }),
  Object.freeze({ id: 'is', name: '통합전략' }), Object.freeze({ id: 'faction', name: '진영' }),
  Object.freeze({ id: 'side', name: '사이드 스토리' }),
]);
// the generated themes (cyber, is-*, f-*): tools/build-ui-themes.mjs writes their stylesheets
export const UI_THEME_LIST = Object.freeze([
  Object.freeze({ id: 'default', name: '기본', group: 'basic', swatch: ['#0c0f0e', '#4ed8af'] }),
  Object.freeze({ id: 'white', name: '화이트', group: 'basic', swatch: ['#eef1f3', '#00967d'], light: true }),
  Object.freeze({ id: 'space', name: '우주', group: 'special', swatch: ['#05060d', '#84aaff'] }),
  Object.freeze({ id: 'rhine', name: '라인 생명', group: 'special', swatch: ['#f4f5f2', '#1a1c1b'], light: true }),
  Object.freeze({ id: 'cyber', name: '사이버펑크', group: 'special', swatch: ['#07060c', '#ff2e88'] }),
  Object.freeze({ id: 'is-fungi', name: '케오베의 버섯 안개 미궁', group: 'is', swatch: ['#121412', '#c9b27a'] }),
  Object.freeze({ id: 'is-phantom', name: '팬텀 & 크림슨 솔리테어', group: 'is', swatch: ['#0a0808', '#e3a33b'] }),
  Object.freeze({ id: 'is-mizuki', name: '미즈키 & 카이룰라 아버', group: 'is', swatch: ['#03060f', '#5fd4ff'] }),
  Object.freeze({ id: 'is-frost', name: '탐험가의 은빛 서리 끝자락', group: 'is', swatch: ['#040a0c', '#1fc4d6'] }),
  Object.freeze({ id: 'is-sarkaz', name: '살카즈의 영겁 기담', group: 'is', swatch: ['#0b0b0c', '#d9a63a'] }),
  Object.freeze({ id: 'is-sui', name: '쉐이의 기이한 계원', group: 'is', swatch: ['#eef3ef', '#167f78'], light: true }),
  Object.freeze({ id: 'is-blackflow', name: '침몰자의 블랙 플로우', group: 'is', swatch: ['#070706', '#e6d48a'] }),
  Object.freeze({ id: 'f-yan', name: '염국', group: 'faction', swatch: ['#e4e7e3', '#a92d2a'], light: true }),
  Object.freeze({ id: 'f-sargon', name: '사르곤', group: 'faction', swatch: ['#f6f6f8', '#fcce46'], light: true }),
  Object.freeze({ id: 'f-victoria', name: '빅토리아', group: 'faction', swatch: ['#120806', '#d6a64a'] }),
  Object.freeze({ id: 'f-kjerag', name: '쉐라그', group: 'faction', swatch: ['#16206a', '#e9eefc'] }),
  Object.freeze({ id: 'f-laterano', name: '라테라노', group: 'faction', swatch: ['#eceff2', '#3d8fae'], light: true }),
  Object.freeze({ id: 'f-aegir', name: '에기르', group: 'faction', swatch: ['#101418', '#5fd3d0'] }),
  Object.freeze({ id: 'f-siracusa', name: '시라쿠사', group: 'faction', swatch: ['#19191b', '#b3262e'] }),
  Object.freeze({ id: 'f-kazimierz', name: '카시미어', group: 'faction', swatch: ['#1c1e26', '#d02b3a'] }),
  Object.freeze({ id: 'f-ursus', name: '우르수스', group: 'faction', swatch: ['#141417', '#b3242c'] }),
  Object.freeze({ id: 'f-leithanien', name: '라이타니엔', group: 'faction', swatch: ['#1a110d', '#d4743c'] }),
  Object.freeze({ id: 'ss-adele', name: '화산의 꿈 여행', group: 'side', swatch: ['#f8e1e5', '#d34a62'], light: true }),
  Object.freeze({ id: 'ss-vultures', name: '부정축재', group: 'side', swatch: ['#0f1417', '#d4d93a'] }),
  Object.freeze({ id: 'ss-lonetrail', name: '론 트레일', group: 'side', swatch: ['#ece7de', '#e8602c'], light: true }),
  Object.freeze({ id: 'ss-mendacium', name: '아테누스 복수록', group: 'side', swatch: ['#ebc9aa', '#b4521f'], light: true }),
  Object.freeze({ id: 'ss-unrealized', name: '허락받지 못한 땅', group: 'side', swatch: ['#c4e5ea', '#c4333a'], light: true }),
  Object.freeze({ id: 'ss-elegies', name: '불타버린 엘레지여', group: 'side', swatch: ['#0d1023', '#c9ae72'] }),
]);
export const UI_THEMES = Object.freeze(UI_THEME_LIST.map((t) => t.id));
export const uiTheme = (id) => UI_THEME_LIST.find((t) => t.id === id) || UI_THEME_LIST[0];

/** A theme's downloaded official art: { key: { path, bytes } } (ui/uiThemeAssets.js). */
export const themeAssets = (id) => UI_THEME_ASSETS[uiTheme(id).id] || {};
/** Bytes of a theme's art (0: CSS only). */
export function themeDownloadBytes(id) {
  return Object.values(themeAssets(id)).reduce((n, a) => n + (a.bytes || 0), 0);
}
/** Whether the theme's art was downloaded on this browser (resource-bootstrap.js marks it when its scope finished). */
export function themeAssetsReady(id) {
  if (!themeDownloadBytes(id)) return true;
  try { return !!globalThis.localStorage?.getItem('sp.resources.themeReady.' + uiTheme(id).id); } catch { return false; }
}

const LINK_ID = 'ui-theme-css';
/** Put the theme on the page: its stylesheet (once), <html data-ui-theme>, and its art as --ta-<key> once downloaded. */
export function applyUiTheme(id) {
  const doc = globalThis.document;
  if (!doc) return;
  const t = uiTheme(id);
  const el = doc.documentElement;
  for (const k of [...el.style]) if (k.startsWith('--ta-')) el.style.removeProperty(k);
  if (t.light) el.dataset.uiLight = ''; else delete el.dataset.uiLight;
  let link = doc.getElementById(LINK_ID);
  if (t.id === 'default') {
    delete el.dataset.uiTheme;
    delete el.dataset.uiArt;
    if (link) link.remove();
    return;
  }
  const href = `/css/themes/${t.id}.css`;
  if (!link) { link = doc.createElement('link'); link.id = LINK_ID; link.rel = 'stylesheet'; doc.head.appendChild(link); }
  if (link.getAttribute('href') !== href) link.setAttribute('href', href);
  el.dataset.uiTheme = t.id;
  const art = themeAssets(t.id);
  if (Object.keys(art).length && themeAssetsReady(t.id)) {
    for (const [k, a] of Object.entries(art)) el.style.setProperty(`--ta-${k}`, `url("${a.path}")`);
    el.dataset.uiArt = '';
  } else delete el.dataset.uiArt;
}

/** Download a theme's art through the resource worker (the player agreed): resolves true when it is in. */
export function downloadThemeAssets(id) {
  const theme = uiTheme(id).id;
  return new Promise((resolve, reject) => {
    const done = (e) => {
      if (e.detail?.theme !== theme) return;
      globalThis.removeEventListener('sp-ui-theme-ready', done);
      if (e.detail.error || e.detail.missing) reject(new Error(e.detail.error || 'missing')); else resolve(true);
    };
    globalThis.addEventListener('sp-ui-theme-ready', done);
    globalThis.dispatchEvent(new CustomEvent('sp-request-theme-download', { detail: { theme } }));
  });
}
