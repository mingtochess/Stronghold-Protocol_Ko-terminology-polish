import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { EMOTES } from '../../shared/constants.js';
import { bundledEmoteArt } from '../../shared/emote-art.js';
import { startServer } from '../../server/index.js';

test('all 36 replacement emotes have distinct, valid WebP files and safe lookups', () => {
  const paths = EMOTES.map(bundledEmoteArt);
  assert.equal(new Set(paths).size, 36);
  for (const path of paths) {
    assert.match(path, /^\/assets\/emotes\/[a-h]\d+\.webp$/);
    const bytes = readFileSync(new URL(`../../public${path}`, import.meta.url));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  }
  for (const id of ['unknown', '__proto__', 'constructor', null, undefined]) assert.equal(bundledEmoteArt(id), null);
});

const chrome = process.env.CHROME_PATH || '/usr/bin/chromium';
test('browser renders every replacement image without the extracted asset manifest', {skip:!existsSync(chrome),timeout:30000}, async () => {
  const server = await startServer({port:0,host:'127.0.0.1',quiet:true});
  const puppeteer = (await import('puppeteer-core')).default;
  let browser;
  try {
    browser = await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox']});
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${server.port}/dev/uikit.html`);
    await page.evaluate(async () => {
      const [{render}, {html}, {EmoteArt}, {EMOTES}] = await Promise.all([
        import('/vendor/preact.module.js'), import('/js/ui/components.js'),
        import('/js/ui/emotes.js'), import('/shared/constants.js')]);
      const container=document.createElement('div');container.id='replacement-art';document.body.append(container);
      render(html`${EMOTES.map(id=>html`<${EmoteArt} key=${id} id=${id} />`)}`,container);
    });
    await page.waitForFunction(() => {
      const images=[...document.querySelectorAll('#replacement-art img')];
      return images.length===36 && images.every(img=>img.complete && img.naturalWidth>0);
    });
    assert.equal(await page.$$eval('#replacement-art img', imgs=>new Set(imgs.map(i=>i.src)).size),36);
  } finally {await browser?.close();await server.close();}
});
