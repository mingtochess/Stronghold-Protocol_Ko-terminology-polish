// Connect a 규정 (act3autochess) effects extract (tools/build-regulation-extract-kit.py, EXTRACT-REGULATION.ps1 -Only fx)
// to the effects the browser loads, adding only what the served index and file list lack.
//
//   stage:   node tools/import-regulation-fx.mjs stage EXTRACT_DIR ASSETS_REPO TAG
//            EXTRACT_DIR is the unpacked regulation-<stamp>/ (assets/local/fx/{index,textures}.json, prefabs/, tex/,
//            mesh/, fx/local-fx.json). Reads the index / textures the catalogue serves now (their pinned commit in
//            ASSETS_REPO), adds the extract's units / skins / skills / projectiles / prefabs / costumes / generic and
//            textures whose keys are missing (an existing key is never replaced: tools/resource-packs.mjs
//            preservesIndex), stages the merged indexes and every referenced payload the catalogue does not list under
//            .cache/regulation-fx-staging/public, and writes the pack manifest content/custom/regulation-fx-TAG/assets.json
//            plus .cache/regulation-fx-TAG.json (the file-list entries to add). A payload the catalogue already lists
//            with other bytes keeps the catalogue's bytes (reported, not replaced).
//            Then publish (the CLI of tools/publish-resource-pack.mjs takes no payload root, so call it):
//              node -e "import('./tools/publish-resource-pack.mjs').then(m=>m.publishResourcePack(process.cwd(),
//                'ASSETS_REPO','content/custom/regulation-fx-TAG/assets.json','regulation-fx-TAG',
//                require('path').resolve('.cache/regulation-fx-staging/public'))).then(console.log)"
//            and commit and push the resource repository.
//   connect: node tools/import-regulation-fx.mjs connect TAG COMMIT
//            registers the pack (content/custom/resource-origin.json, after the packs whose index it extends), adds the
//            catalogue rows of the pack's files pinned to COMMIT and the missing content/production/data/local-fx.json
//            entries.
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { preservesIndex, resolveResourcePacks } from './resource-packs.mjs';
import { applyOrigin } from './resource-origin.mjs';

const root = process.cwd();
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
const sha = (b) => createHash('sha256').update(b).digest('hex');
const INDEX = '/assets/local/fx/index.json', TEXTURES = '/assets/local/fx/textures.json';
const SECTIONS = ['units', 'skins', 'skills', 'projectiles', 'prefabs', 'costumes', 'generic'];
const REPO = 'moring-m/Stronghold-Protocol_Ko_Arca_assets';
const STAGING = '.cache/regulation-fx-staging/public';

async function servedCatalogue() {
  const cfg = await read(resolve(root, 'content/custom/resource-origin.json'));
  const packs = await resolveResourcePacks(root, cfg);
  return applyOrigin(await read(resolve(root, 'content/production/resources.json')), { ...cfg, resolvedPacks: packs });
}

async function stage(extract, repo, tag) {
  if (!/^[0-9]{8}$/.test(tag)) throw Error('TAG is a date such as 20261115');
  const served = new Map((await servedCatalogue()).files.map((f) => [f.path, f]));
  const pinned = (path) => {
    const row = served.get(path), commit = row?.sources?.[0]?.match(/\/([0-9a-f]{40})\//)?.[1];
    if (!commit) throw Error(`${path}: no pinned resource commit in the catalogue`);
    const bytes = execFileSync('git', ['-C', repo, 'show', `${commit}:public${path}`], { maxBuffer: 1 << 30 });
    if (sha(bytes) !== row.sha256 || bytes.length !== row.bytes) throw Error(`${path}: pinned bytes differ from the catalogue row`);
    return { commit, value: JSON.parse(bytes.toString('utf8')) };
  };
  const { commit: indexCommit, value: before } = pinned(INDEX);
  const { value: texBefore } = pinned(TEXTURES);
  const fx = resolve(extract, 'assets/local/fx');
  const incoming = await read(resolve(fx, 'index.json')), incomingTex = await read(resolve(fx, 'textures.json'));
  const manifest = await read(resolve(extract, 'fx/local-fx.json'));

  const index = structuredClone(before), added = {};
  for (const s of SECTIONS) {
    if (!incoming[s] || typeof incoming[s] !== 'object') continue;
    index[s] ??= {};
    for (const [k, v] of Object.entries(incoming[s])) if (!Object.hasOwn(index[s], k)) { index[s][k] = v; added[s] = (added[s] || 0) + 1; }
  }
  const textures = structuredClone(texBefore);
  for (const [k, v] of Object.entries(incomingTex.textures || {})) if (!Object.hasOwn(textures.textures, k)) { textures.textures[k] = v; added.textures = (added.textures || 0) + 1; }
  if (!preservesIndex(before, index) || !preservesIndex(texBefore, textures)) throw Error('merge changed an existing key');

  const local = await read(resolve(root, 'content/production/data/local-fx.json'));
  const groups = {}, payload = [], kept = [];
  for (const [group, entries] of Object.entries(manifest.groups || {})) {
    if (group === 'fx') continue;   // the two indexes, staged below
    for (const [key, v] of Object.entries(entries)) {
      if (!local.groups[group]?.[key]) (groups[group] ??= {})[key] = v;
      for (const url of [v.path, v.half].filter(Boolean)) {
        const bytes = await readFile(resolve(extract, url.slice(1)));
        const row = served.get(url);
        if (!row) payload.push({ url, bytes });
        else if (row.sha256 !== sha(bytes)) kept.push(url);
      }
    }
  }
  // every prefab a merged unit names must be listed (local-fx.json) or the library never finds it
  const listed = (key) => !!(local.groups['fx/prefabs']?.[key] || groups['fx/prefabs']?.[key]);
  const unlisted = Object.entries(incoming.units || {}).flatMap(([id, u]) => (u.refs || []).filter((k) => index.prefabs[k] && !listed(k)).map((k) => `${id}:${k}`));
  if (unlisted.length) throw Error(`${unlisted.length} referenced prefabs missing from local-fx.json, e.g. ${unlisted[0]}`);

  const files = [];
  const put = async (url, bytes) => {
    const dest = resolve(root, STAGING, url.slice(1));
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, bytes);
    files.push({ path: url, bytes: bytes.length, sha256: sha(bytes) });
  };
  await put(INDEX, Buffer.from(JSON.stringify(index)));
  await put(TEXTURES, Buffer.from(JSON.stringify(textures)));
  for (const p of payload) await put(p.url, p.bytes);
  const units = Object.keys(incoming.units || {}).filter((id) => !Object.hasOwn(before.units, id)).sort();
  const packDir = resolve(root, `content/custom/regulation-fx-${tag}`);
  await mkdir(packDir, { recursive: true });
  await writeFile(resolve(packDir, 'assets.json'), JSON.stringify({
    description: `규정(act3autochess) 공식 이펙트 연결: 운영 색인(${indexCommit.slice(0, 8)})에 없는 유닛 ${units.length}개와 그 프리팹·텍스처 키만 추가한 색인 (tools/import-regulation-fx.mjs)`,
    units, files }, null, 1) + '\n');
  await writeFile(resolve(root, `.cache/regulation-fx-${tag}.json`), JSON.stringify({ groups }) + '\n');
  console.log('staged', { added, localFx: Object.values(groups).reduce((n, g) => n + Object.keys(g).length, 0), payload: payload.length, keptExisting: kept.length, files: files.length });
  if (kept.length) console.log('kept the catalogue bytes for', kept.filter((u) => u !== INDEX && u !== TEXTURES));
}

async function connect(tag, commit) {
  if (!/^[0-9a-f]{40}$/.test(commit)) throw Error('COMMIT must be the full resource repository commit');
  const name = `regulation-fx-${tag}`, manifestPath = `content/custom/${name}/assets.json`;
  const pack = await read(resolve(root, manifestPath));
  const originPath = resolve(root, 'content/custom/resource-origin.json'), originRaw = await readFile(originPath, 'utf8'), origin = JSON.parse(originRaw);
  origin.packs = origin.packs.filter((p) => p.name !== name);
  origin.packs.push({ name, repository: REPO, commit, manifest: manifestPath });   // last: its index wins over older packs'
  await writeFile(originPath, JSON.stringify(origin, null, 2) + (originRaw.endsWith('\n') ? '\n' : ''));

  const resPath = resolve(root, 'content/production/resources.json'), resRaw = await readFile(resPath, 'utf8'), res = JSON.parse(resRaw);
  const rows = new Map(res.files.map((f) => [f.path, f]));
  let added = 0, bytes = 0;
  for (const f of pack.files) {
    const enc = f.path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
    const old = rows.get(f.path);
    if (!old) { added++; bytes += f.bytes; } else bytes += f.bytes - (old.bytes || 0);
    // no `local`: tools/resource-origin.mjs would rewrite a local row to the base origin commit
    rows.set(f.path, { path: f.path, sources: [`https://raw.githubusercontent.com/${REPO}/${commit}/public/${enc}`, `https://cdn.jsdelivr.net/gh/${REPO}@${commit}/public/${enc}`], sha256: f.sha256, bytes: f.bytes });
  }
  res.files = [...rows.values()];
  res.estimatedBytes += bytes; if (res.estimatedStorageBytes) res.estimatedStorageBytes += bytes;
  res.version = sha(JSON.stringify(res.files)).slice(0, 20);
  await writeFile(resPath, JSON.stringify(res) + (resRaw.endsWith('\n') ? '\n' : ''));

  const stagedPath = resolve(root, `.cache/regulation-fx-${tag}.json`);
  if (!existsSync(stagedPath)) throw Error('run stage first (its local-fx.json entries are in ' + stagedPath + ')');
  const { groups } = await read(stagedPath);
  const localPath = resolve(root, 'content/production/data/local-fx.json'), localRaw = await readFile(localPath, 'utf8'), local = JSON.parse(localRaw);
  let entries = 0;
  for (const [group, list] of Object.entries(groups)) for (const [k, v] of Object.entries(list)) if (!local.groups[group]?.[k]) { (local.groups[group] ??= {})[k] = v; entries++; }
  await writeFile(localPath, JSON.stringify(local) + (localRaw.endsWith('\n') ? '\n' : ''));
  console.log('connected', { pack: name, catalogueRows: added, localFx: entries, version: res.version });
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'stage') await stage(resolve(args[0]), resolve(args[1]), args[2]);
else if (cmd === 'connect') await connect(args[0], args[1]);
else throw Error('usage: stage EXTRACT_DIR ASSETS_REPO TAG | connect TAG COMMIT');
