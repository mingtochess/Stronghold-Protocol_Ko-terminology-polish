// Build download metadata only; never download game art or rewrite data/assets.json.
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { buildPlan } from './assets/plan.mjs';
import { loadIndexes } from './assets/cache.mjs';
import { indexAudio } from './assets/audio.mjs';
import { mirrorUrl, safeName, urlDir, encodePath } from './assets/sources.mjs';
import { FONTS, fontJobs } from './assets/fonts.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = async p => JSON.parse(await readFile(root + p, 'utf8'));
const manifest = await read('data/assets.json');
const [assets07, ops03, enemies05, maps05, extraEnemies, extraTokens, bosses] = await Promise.all(
  ['docs/research/07-assets.json', 'docs/research/03-operators.json', 'docs/research/05-enemies.json',
    'docs/research/05-maps.json', 'data/enemies.json', 'data/tokens.json', 'data/bosses.json'].map(read));
const { audioData, modelsData } = await loadIndexes(root);
const plan = buildPlan({ assets07, ops03, enemies05, maps05, audio: indexAudio(audioData), modelsData,
  extraEnemyIds: Object.keys(extraEnemies), extraTokenIds: Object.keys(extraTokens),
  extraHandbook: Object.fromEntries(Object.values(bosses).filter(b => b.enemyKey && b.handbookId).map(b => [b.enemyKey, b.handbookId])) });
const files = new Map();
function add(path, urls, extra = {}) {
  const sources = [...new Set(urls.flatMap(u => [mirrorUrl(u), u]).filter(Boolean))];
  if (!sources.length) throw new Error(`Missing source for ${path}`);
  if (!files.has(path)) files.set(path, { path, sources, ...extra });
}
function walk(template, value) {
  if (!template || !value) return;
  if (template.alts) {
    const alternatives = template.alts.filter(a => '/assets/' + a.rel === value);
    if (!alternatives.length) throw new Error(`Unmapped asset ${value}`);
    add(value, alternatives.flatMap(alternative => alternative.urls));
  } else if (template.model) {
    const model = plan.models.get(template.model);
    add(value.skel, model.skel.urls);
    add(value.atlas, model.atlas.urls, { atlas: { textures: value.textures, pma: value.pma } });
    for (const path of value.textures) {
      const rel = path.slice('/assets/'.length);
      const job = model.pngs.find(p => p.rel === rel);
      add(path, job?.urls || [...new Set([model.baseUrl, ...model.atlas.urls.map(urlDir)].filter(Boolean))]
        .map(base => base + encodePath(path.split('/').at(-1))));
    }
  } else if (typeof template === 'object') {
    for (const [key, node] of Object.entries(template)) walk(node, value[key]);
  }
}
walk(plan.template, manifest);
for (const job of fontJobs()) add('/fonts/' + job.rel, job.urls);
// Verify every asset URL used by the committed game manifest has a downloadable source.
function check(value) {
  if (typeof value === 'string' && value.startsWith('/assets/') && !files.has(value)) throw new Error(`No source: ${value}`);
  if (value && typeof value === 'object') Object.values(value).forEach(check);
}
check(manifest);
const list = [...files.values()].sort((a, b) => a.path.localeCompare(b.path));
const hash = createHash('sha256').update(JSON.stringify(list) + manifest.hash).digest('hex').slice(0, 20);
const css = FONTS.map(f => `@font-face{font-family:'${f.family}';font-weight:${f.weight};font-style:${f.style};font-display:swap;src:url('/fonts/${f.name}.${f.ext}')}`).join('\n');
await mkdir(root + 'public/vendor', { recursive: true });
await copyFile(root + 'tools/assets/atlas.mjs', root + 'public/vendor/resource-atlas.mjs');
await writeFile(root + 'public/vendor/browser-resources.json', JSON.stringify({ version: hash, estimatedBytes: manifest.stats.bytes, files: list, fontCss: css }));
console.log(`Browser resource index: ${list.length} files, version ${hash}. No art downloaded.`);
