import { normalizeAtlas } from './vendor/resource-atlas.mjs';

const PREFIX = 'stronghold-resources-';
let indexPromise;
let preparing;
const listeners = new Set();
const contentType = path => path.endsWith('.png') ? 'image/png' : path.endsWith('.atlas') ? 'text/plain' :
  path.endsWith('.mp3') ? 'audio/mpeg' : path.endsWith('.ogg') ? 'audio/ogg' :
  path.endsWith('.wav') ? 'audio/wav' : path.endsWith('.ttf') ? 'font/ttf' :
  path.endsWith('.otf') ? 'font/otf' : 'application/octet-stream';

async function index() {
  indexPromise ||= fetch('/vendor/browser-resources.json', { cache: 'no-store' }).then(async response => {
    if (!response.ok) throw new Error('리소스 목록을 불러오지 못했습니다.');
    return response.json();
  }).catch(error => { indexPromise = undefined; throw error; });
  return indexPromise;
}
const send = message => { for (const port of listeners) port.postMessage(message); };
async function complete(cache, resources) {
  const keys = new Set((await cache.keys()).map(key => new URL(key.url).pathname));
  return resources.files.every(file => keys.has(file.path)) && keys.has('/fonts/fonts.css') && keys.has('/__resources_ready__');
}

async function download(file, cache) {
  if (await cache.match(file.path)) return;
  let lastError;
  for (const source of file.sources) {
    const url = new URL(source);
    if (url.protocol !== 'https:' || !['cdn.jsdelivr.net', 'raw.githubusercontent.com'].includes(url.hostname)) throw new Error('허용되지 않은 리소스 출처');
    try {
      const response = await fetch(source, { mode: 'cors', credentials: 'omit', signal: AbortSignal.timeout(30000) });
      if (!response.ok || response.type === 'opaque') throw new Error(`HTTP ${response.status}`);
      if ((response.headers.get('content-type') || '').includes('text/html')) throw new Error('리소스 대신 HTML 응답');
      const body = await response.arrayBuffer();
      if (!body.byteLength) throw new Error('빈 파일');
      if (file.path.endsWith('.png') && new DataView(body).getUint32(0) !== 0x89504e47) throw new Error('잘못된 PNG');
      await cache.put(file.path, new Response(body, { headers: { 'Content-Type': contentType(file.path) } }));
      return;
    } catch (error) { lastError = error; }
  }
  throw new Error(`${file.path}: ${lastError?.message || '다운로드 실패'}`);
}

async function prepare() {
  const resources = await index();
  const cache = await caches.open(PREFIX + resources.version);
  await cache.delete('/__resources_ready__');
  const failures = [];
  let next = 0, done = 0;
  const run = async () => {
    while (next < resources.files.length) {
      const file = resources.files[next++];
      try { await download(file, cache); } catch (error) { failures.push(error.message); }
      send({ type: 'progress', done: ++done, total: resources.files.length });
    }
  };
  await Promise.all(Array.from({ length: 6 }, run));
  if (failures.length) throw new Error(`${failures.length}개 파일을 받지 못했습니다. 다시 시도하면 받은 파일은 재사용합니다.\n${failures.slice(0, 3).join('\n')}`);
  // Match the repository pipeline's atlas normalization, using actual cached PNG dimensions.
  for (const file of resources.files.filter(f => f.atlas)) {
    const sizes = new Map();
    for (const path of file.atlas.textures) {
      const png = await (await cache.match(path)).arrayBuffer();
      const view = new DataView(png);
      sizes.set(path.split('/').at(-1), { width: view.getUint32(16), height: view.getUint32(20) });
    }
    const text = await (await cache.match(file.path)).text();
    const normalized = normalizeAtlas(text, {
      pma: file.atlas.pma,
      renamePage: name => name.replace(/[^A-Za-z0-9._-]/g, '_'),
      pageSize: name => sizes.get(name.replace(/[^A-Za-z0-9._-]/g, '_')),
    });
    if (normalized.missingSize.length) throw new Error(`텍스처 크기 확인 실패: ${file.path}`);
    await cache.put(file.path, new Response(normalized.text, { headers: { 'Content-Type': 'text/plain' } }));
  }
  await cache.put('/fonts/fonts.css', new Response(resources.fontCss, { headers: { 'Content-Type': 'text/css' } }));
  await cache.put('/__resources_ready__', new Response(resources.version));
  // Keep previous versions for already-open tabs; browser quota management may evict them.
  return { type: 'ready', version: resources.version };
}

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('message', event => {
  const port = event.ports[0];
  if (!port) return;
  event.waitUntil((async () => {
    try {
      if (event.data.type === 'status') {
        indexPromise = undefined;
        const resources = await index();
        const cache = await caches.open(PREFIX + resources.version);
        port.postMessage({ type: 'status', ready: await complete(cache, resources) });
      } else if (event.data.type === 'prepare') {
        listeners.add(port);
        try {
          preparing ||= prepare().finally(() => { preparing = undefined; });
          port.postMessage(await preparing);
        } finally { listeners.delete(port); }
      }
    } catch (error) { port.postMessage({ type: 'error', message: error.message }); }
  })());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET' ||
      !/^\/(assets|fonts|media)\//.test(url.pathname)) return;
  event.respondWith((async () => {
    const resources = await index();
    const cache = await caches.open(PREFIX + resources.version);
    let path = url.pathname;
    if (path.startsWith('/media/')) {
      const stem = '/assets/audio/' + path.slice('/media/'.length);
      path = resources.files.find(f => ['.mp3', '.ogg', '.wav'].some(ext => f.path === stem + ext))?.path || path;
    }
    const cached = await cache.match(path);
    return cached || fetch(event.request);
  })());
});
