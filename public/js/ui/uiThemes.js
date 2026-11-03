// ui/uiThemes.js — UI 테마 (title screen picker): each theme is a stylesheet css/themes/<id>.css loaded on demand and
// keyed by <html data-ui-theme>. A theme restyles every HTML UI — menus, rooms, the prep / battle HUD (shop, bond list,
// panels) — never what the renderer draws (battlefield, units, effects, the official HP bars). A theme with `assets`
// (images) asks before it downloads them; until they are in, its CSS-only look is shown.
/** Theme groups of the picker, in order. */
export const UI_THEME_GROUPS = Object.freeze([
  Object.freeze({ id: 'basic', name: '기본' }), Object.freeze({ id: 'special', name: '스타일' }),
  Object.freeze({ id: 'is', name: '통합전략' }), Object.freeze({ id: 'faction', name: '진영' }),
]);
// the generated themes (cyber, is-*, f-*): tools/build-ui-themes.mjs writes their stylesheets
export const UI_THEME_LIST = Object.freeze([
  Object.freeze({ id: 'default', name: '기본', group: 'basic', swatch: ['#0c0f0e', '#4ed8af'] }),
  Object.freeze({ id: 'white', name: '화이트', group: 'basic', swatch: ['#eef1f3', '#00967d'], light: true }),
  Object.freeze({ id: 'space', name: '우주', group: 'special', swatch: ['#05060d', '#84aaff'], assets: Object.freeze([]) }),
  Object.freeze({ id: 'rhine', name: '라인 생명', group: 'special', swatch: ['#f4f5f2', '#1a1c1b'], light: true }),
  Object.freeze({ id: 'cyber', name: '사이버펑크', group: 'special', swatch: ['#07060c', '#ff2e88'] }),
  Object.freeze({ id: 'is-fungi', name: '케오베의 버섯 안개 미궁', group: 'is', swatch: ['#121412', '#c9b27a'] }),
  Object.freeze({ id: 'is-phantom', name: '팬텀 & 크림슨 솔리테어', group: 'is', swatch: ['#0e0709', '#c8102e'] }),
  Object.freeze({ id: 'is-mizuki', name: '미즈키 & 카이룰라 아버', group: 'is', swatch: ['#020a14', '#3fe0e8'] }),
  Object.freeze({ id: 'is-frost', name: '탐험가의 은빛 서리 끝자락', group: 'is', swatch: ['#e7eef3', '#2a6f9e'], light: true }),
  Object.freeze({ id: 'is-sarkaz', name: '살카즈의 영겁 기담', group: 'is', swatch: ['#0d0910', '#ff8a3d'] }),
  Object.freeze({ id: 'is-sui', name: '쉐이의 기이한 계원', group: 'is', swatch: ['#efe8da', '#a8322a'], light: true }),
  Object.freeze({ id: 'is-blackflow', name: '침몰자의 블랙 플로우', group: 'is', swatch: ['#040506', '#7fd1c2'] }),
  Object.freeze({ id: 'f-yan', name: '염국', group: 'faction', swatch: ['#140807', '#e0a43a'] }),
  Object.freeze({ id: 'f-sargon', name: '사르곤', group: 'faction', swatch: ['#efe3c8', '#a45d10'], light: true }),
  Object.freeze({ id: 'f-victoria', name: '빅토리아', group: 'faction', swatch: ['#070b16', '#d4af5a'] }),
  Object.freeze({ id: 'f-kjerag', name: '쉐라그', group: 'faction', swatch: ['#eef3f7', '#3a6ea5'], light: true }),
  Object.freeze({ id: 'f-laterano', name: '라테라노', group: 'faction', swatch: ['#f4f1ea', '#a67c1e'], light: true }),
  Object.freeze({ id: 'f-aegir', name: '에기르', group: 'faction', swatch: ['#020c10', '#22d3c5'] }),
  Object.freeze({ id: 'f-siracusa', name: '시라쿠사', group: 'faction', swatch: ['#0b0909', '#b8955a'] }),
  Object.freeze({ id: 'f-kazimierz', name: '카시미어', group: 'faction', swatch: ['#0b0a0c', '#e8e2d0'] }),
  Object.freeze({ id: 'f-ursus', name: '우르수스', group: 'faction', swatch: ['#0c0d0e', '#c9473a'] }),
  Object.freeze({ id: 'f-leithanien', name: '라이타니엔', group: 'faction', swatch: ['#0c0912', '#d8b86a'] }),
]);
export const UI_THEMES = Object.freeze(UI_THEME_LIST.map((t) => t.id));
export const uiTheme = (id) => UI_THEME_LIST.find((t) => t.id === id) || UI_THEME_LIST[0];

/** Bytes a theme still has to download (0: nothing, or all of it is already in the browser cache). */
export function themeDownloadBytes(id) {
  return (uiTheme(id).assets || []).reduce((n, a) => n + (a.bytes || 0), 0);
}

const LINK_ID = 'ui-theme-css';
/** Put the theme on the page: its stylesheet (once) and <html data-ui-theme>. */
export function applyUiTheme(id) {
  const doc = globalThis.document;
  if (!doc) return;
  const t = uiTheme(id);
  const el = doc.documentElement;
  let link = doc.getElementById(LINK_ID);
  if (t.light) el.dataset.uiLight = ''; else delete el.dataset.uiLight;
  if (t.id === 'default') {
    delete el.dataset.uiTheme;
    if (link) link.remove();
    el.style.removeProperty('--space-nebula');
    return;
  }
  const href = `/css/themes/${t.id}.css`;
  if (!link) { link = doc.createElement('link'); link.id = LINK_ID; link.rel = 'stylesheet'; doc.head.appendChild(link); }
  if (link.getAttribute('href') !== href) link.setAttribute('href', href);
  el.dataset.uiTheme = t.id;
  for (const a of t.assets || []) if (a.cssVar && themeAssetsReady(t.id)) el.style.setProperty(a.cssVar, `url("${a.url}")`);
}

const READY_KEY = 'sp.uiTheme.assets';
const readyMap = () => { try { return JSON.parse(globalThis.localStorage?.getItem(READY_KEY) || '{}') || {}; } catch { return {}; } };
/** Whether the theme's images were downloaded on this browser (the user agreed and they loaded). */
export function themeAssetsReady(id) { const t = uiTheme(id); return !(t.assets || []).length || readyMap()[id] === assetsKey(t); }
const assetsKey = (t) => (t.assets || []).map((a) => a.url).join('|');

/** Download a theme's images (after the user agreed): resolves true when every one loaded. */
export async function downloadThemeAssets(id, onProgress = () => {}) {
  const t = uiTheme(id), list = t.assets || [];
  let done = 0;
  for (const a of list) {
    const r = await fetch(a.url, { cache: 'force-cache' });
    if (!r.ok) throw new Error(`${a.url}: ${r.status}`);
    await r.blob();
    onProgress(++done, list.length);
  }
  try { const m = readyMap(); m[id] = assetsKey(t); globalThis.localStorage?.setItem(READY_KEY, JSON.stringify(m)); } catch { /* the next start asks again */ }
  return true;
}
