// tools/build-ui-theme-resources.mjs — the official UI art the UI themes use (ui/uiThemes.js), downloaded only when a
// player picks such a theme (shared/resourceSelection.js scope `theme-<id>`; resource-bootstrap.js). Every file comes
// from the pinned ArknightsAssets2 commit (the same mirror and commit as the other official UI files) and is listed under
// /assets/ui-themes/<theme>/<key>.png:
//   left / right   the home background halves (homebackground/wrapper) — the page backdrop (a scene of that world)
//   logo           the faction emblem (camplogo) — a watermark
// Only art that is that world as it is: textures, frames and shapes are CSS (tools/ui-theme-textures.mjs).
// `node tools/build-ui-theme-resources.mjs` measures each file and rewrites content/custom/ui/ui-theme-resources.json,
// public/js/ui/uiThemeAssets.js and the theme entries of content/production/resources.json.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const COMMIT = '44b3d7b3fad6f50ca505bc41414a2fea8eaa0c48';
// ArknightsAssets/ArknightsAssets (the older mirror) keeps the 2022–2024 events' lobby art the newer one dropped
const COMMIT1 = 'c0be4e4428f79c7e87c6889067a6906361ae979b';
// agutyauno/a9sr-data keeps the official story scene backgrounds (AVG, 1024x576)
const COMMIT_A9 = '5782da41a49efbd51a962d01ad6a88d1306ab63b';
const A9 = (f) => `a9:images/backgrounds/${f}.png`;
const A1 = (p) => `aa1:assets/torappu/dynamicassets/${p}`;
const IS = 'assets/torappu/arts/ui/rogueliketopic/topics/[pack]';
const HOME = 'dyn/arts/ui/homebackground/wrapper';
const LOGO = 'dyn/arts/camplogo';
const ACT = (n, f) => `dyn/activity/[uc]act${n}side/prefabs/act${n}side_activity_stage/${f}`;
const home = (bg) => ({ left: `${HOME}/${bg}/${bg}_left.png`, right: `${HOME}/${bg}/${bg}_right.png` });
export const THEME_ART = {
  'is-phantom': { ...home('bg_rogue_1') },
  'is-mizuki': { ...home('bg_rogue_2') },
  'is-frost': { ...home('bg_rogue_3') },
  'is-sarkaz': { ...home('bg_rogue_4') },
  'is-sui': { ...home('bg_rogue_5') },
  rhine: { ...home('bg_rhine_1'), logo: `${LOGO}/logo_rhine.png` },
  'f-yan': { ...home('bg_yan_1'), logo: `${LOGO}/logo_yan.png` },
  'f-victoria': { lobby: A1('activity/[uc]act37side/prefabs/act37side_activity_stage/page_bg.png'), logo: `${LOGO}/logo_victoria.png` },
  'f-laterano': { lobby: A1('activity/[uc]act26sre/prefabs/act26sre_activity_stage/bg_full.png'), logo: `${LOGO}/logo_laterano.png` },
  'f-kazimierz': { lobby: A9('bg_kxstreet'), logo: `${LOGO}/logo_kazimierz.png` },
  'f-ursus': { ...home('bg_ursus_1'), logo: `${LOGO}/logo_ursus.png` },
  'f-aegir': { lobby: A1('activity/[uc]act34side/prefabs/act34side_activity_stage/bg.png'), logo: `${LOGO}/logo_egir.png` },
  'f-sargon': { lobby: A9('bg_desert_3'), logo: `${LOGO}/logo_sargon.png` },
  'ss-vultures': { lobby: A9('bg_desert_1') },
  'ss-lonetrail': { left: A1('activity/[uc]act25sre/prefabs/panel_act25side_entry_01/act25side_bg_01_left.png'), right: A1('activity/[uc]act25sre/prefabs/panel_act25side_entry_01/act25side_bg_01_right.png') },
  'ss-adele': { left: A1('activity/[uc]act27sre/prefabs/panel_act27sre_entry_02/bg_day_left.png'), right: A1('activity/[uc]act27sre/prefabs/panel_act27sre_entry_02/bg_day_right.png') },
  'ss-mendacium': { lobby: ACT(48, 'act48side_entry_img_bkg.png') },
  'ss-elegies': { lobby: ACT(41, 'entry_bg[#1].png') },
  'ss-unrealized': { lobby: ACT(47, 'bg_1.png') },
  'f-kjerag': { lobby: A9('30_ex1_snowmount'), logo: `${LOGO}/logo_kjerag.png` },
  'f-siracusa': { lobby: A9('33_g2_srcalley'), logo: `${LOGO}/logo_siracusa.png` },
  'f-leithanien': { logo: `${LOGO}/logo_leithanien.png` },
};
const enc = (p) => p.split('/').map(encodeURIComponent).join('/');
const sources = (p) => p.startsWith('a9:')
  ? [`https://cdn.jsdelivr.net/gh/agutyauno/a9sr-data@${COMMIT_A9}/${enc(p.slice(3))}`, `https://raw.githubusercontent.com/agutyauno/a9sr-data/${COMMIT_A9}/${enc(p.slice(3))}`]
  : p.startsWith('aa1:')
  ? [`https://cdn.jsdelivr.net/gh/ArknightsAssets/ArknightsAssets@${COMMIT1}/${enc(p.slice(4))}`, `https://raw.githubusercontent.com/ArknightsAssets/ArknightsAssets/${COMMIT1}/${enc(p.slice(4))}`]
  : [`https://cdn.jsdelivr.net/gh/ArknightsAssets/ArknightsAssets2@${COMMIT}/assets/${enc(p)}`, `https://raw.githubusercontent.com/ArknightsAssets/ArknightsAssets2/${COMMIT}/assets/${enc(p)}`];

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = [], assets = {};
  for (const [theme, art] of Object.entries(THEME_ART)) {
    assets[theme] = {};
    for (const [key, src] of Object.entries(art)) {
      const [primary, fallback] = sources(src);
      let r = await fetch(fallback);
      if (!r.ok) r = await fetch(primary);
      if (!r.ok) throw new Error(`${theme}/${key}: ${r.status} ${src}`);
      const bytes = (await r.arrayBuffer()).byteLength;
      const path = `/assets/ui-themes/${theme}/${key}.png`;
      files.push({ path, sources: sources(src), bytes });
      assets[theme][key] = { path, bytes };
      console.log(theme, key, bytes);
    }
  }
  await mkdir(resolve(ROOT, 'content/custom/ui'), { recursive: true });
  await writeFile(resolve(ROOT, 'content/custom/ui/ui-theme-resources.json'), JSON.stringify({ commit: COMMIT, commitAA1: COMMIT1, commitA9: COMMIT_A9, files }, null, 1) + '\n');
  await writeFile(resolve(ROOT, 'public/js/ui/uiThemeAssets.js'), `// ui/uiThemeAssets.js — generated by tools/build-ui-theme-resources.mjs: each UI theme's downloaded official art
// ({ key: { path, bytes } }); css/themes/<id>.css reads them as --ta-<key> once they are in (ui/uiThemes.js).
export const UI_THEME_ASSETS = Object.freeze(${JSON.stringify(assets, null, 1)});
`);
  const catalogPath = resolve(ROOT, 'content/production/resources.json');
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  catalog.files = catalog.files.filter((f) => !f.path.startsWith('/assets/ui-themes/')).concat(files);
  await writeFile(catalogPath, JSON.stringify(catalog));
  console.log('files', files.length, 'bytes', files.reduce((n, f) => n + f.bytes, 0));
}
