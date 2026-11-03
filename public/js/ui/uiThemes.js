// ui/uiThemes.js — UI 테마 (title screen picker): each theme is a stylesheet css/themes/<id>.css loaded on demand and
// keyed by <html data-ui-theme>. A theme restyles every HTML UI — menus, rooms, the prep / battle HUD (shop, bond list,
// panels) — never what the renderer draws (battlefield, units, effects, the official HP bars). A theme with `assets`
// (images) asks before it downloads them; until they are in, its CSS-only look is shown.
export const UI_THEME_LIST = Object.freeze([
  Object.freeze({ id: 'default', name: '기본', swatch: ['#0c0f0e', '#4ed8af'] }),
  Object.freeze({ id: 'space', name: '우주', swatch: ['#05060d', '#84aaff'], assets: Object.freeze([]) }),
  Object.freeze({ id: 'white', name: '화이트', swatch: ['#eef1f3', '#00967d'], light: true }),
  Object.freeze({ id: 'rhine', name: '라인 생명', swatch: ['#f4f5f2', '#1a1c1b'], light: true }),
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
