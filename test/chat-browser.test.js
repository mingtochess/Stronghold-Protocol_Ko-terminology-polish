import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../server/index.js';

const chrome = process.env.CHROME_PATH || '/usr/bin/chromium';
test('two browsers chat over real game sockets: toggle, unread, safe text, Korean composition and reconnect',
  { skip: !existsSync(chrome), timeout: 60000 }, async () => {
    const fixtureDir = await mkdtemp(path.join(tmpdir(), 'stronghold-chat-'));
    const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
    for (const name of ['js', 'vendor', 'css']) await symlink(path.join(publicDir, name), path.join(fixtureDir, name));
    const server = await startServer({ port: 0, host: '127.0.0.1', quiet: true, publicDir: fixtureDir });
    const puppeteer = (await import('puppeteer-core')).default;
    let browser;
    const fixture = `<!doctype html><meta charset="utf-8"><link rel="icon" href="data:,"><link rel="stylesheet" href="/css/theme.css"><link rel="stylesheet" href="/css/chat.css"><div id="app"></div>
      <script type="module">
      import {render} from '/vendor/preact.module.js';
      import {html} from '/js/ui/components.js';
      import {ChatPanel} from '/js/ui/chat.js';
      import {store} from '/js/store.js';
      import {net} from '/js/net.js';
      let rid=0, socket, token, pending=new Map();
      const name=new URL(location.href).searchParams.get('name');
      window.request=(t,fields={})=>new Promise((resolve,reject)=>{const id=++rid;pending.set(id,{resolve,reject});socket.send(JSON.stringify({t,rid:id,...fields}));});
      net.request=window.request;
      window.connect=()=>{
        socket=new WebSocket('ws://'+location.host+'/ws');
        socket.onopen=()=>window.request('hello',{name,version:1,...(token?{token}:{})});
        socket.onclose=()=>store.patch('connection',{status:'offline'});
        socket.onmessage=e=>{const m=JSON.parse(e.data);
          if(m.t==='welcome'){token=m.token;store.set({me:{playerId:m.playerId,name:m.name},connection:{status:'online'}});window.ready=true;}
          if(m.t==='room.state')window.room=m;
          if(m.t==='m.public'){window.phase=m.phase;store.patch('match',{public:m});}
          if(m.t==='m.chat')store.set(s=>({chat:[...s.chat,m].slice(-100),chatFaction:m.playerId===s.me.playerId?m.faction??null:s.chatFaction}));
          if(m.t==='m.chatHistory')store.set({chat:m.messages,chatFaction:m.faction??null});
          if(m.rid && pending.has(m.rid)){const p=pending.get(m.rid);pending.delete(m.rid);m.t==='error'?p.reject(new Error(m.code)):p.resolve(m);}
        };
      };
      window.reconnect=()=>new Promise(resolve=>{socket.onclose=()=>{window.ready=false;window.connect();resolve();};socket.close();});
      window.store=store;window.connect();render(html\`<\${ChatPanel} />\`,document.getElementById('app'));
      </script>`;
    try {
      await writeFile(path.join(fixtureDir, 'chat-test.html'), fixture);
      browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] });
      const players = [];
      for (const name of ['Host', 'Guest']) {
        const page = await browser.newPage();
        page.on('pageerror', (error) => console.error(error.message));
        page.on('console', (msg) => { if (msg.type() === 'error') console.error(msg.text()); });
        await page.setViewport({ width: 1280, height: 720 });
        await page.goto(`http://127.0.0.1:${server.port}/chat-test.html?name=${name}`);
        await page.waitForFunction(() => window.ready, { polling: 100, timeout: 10000 });
        players.push(page);
      }
      const [host, guest] = players;
      await host.evaluate(() => window.request('room.create', { mode: 'coop', difficulty: 'NORMAL' }));
      const code = await host.evaluate(() => window.room.code);
      await guest.evaluate((code) => window.request('room.join', { code }), code);
      await guest.evaluate(() => window.request('room.ready', { ready: true }));
      await host.evaluate(() => window.request('room.start'));
      for (const page of players) await page.waitForFunction(() => window.phase === 'INFO_CHECK', { polling: 100 });
      assert.equal(await host.$('.game-chat__panel'), null);
      await host.bringToFront();
      await host.click('.game-chat__toggle');
      await host.type('.game-chat input', '안녕하세요!');
      await host.keyboard.press('Enter');
      await guest.bringToFront();
      await guest.waitForSelector('.game-chat__badge');
      await guest.click('.game-chat__toggle');
      await guest.waitForFunction(() => document.querySelector('.game-chat__messages').textContent.includes('안녕하세요!'), { polling: 100 });
      assert.equal(await guest.$('.game-chat__badge'), null);
      assert.match(await guest.$eval('.game-chat__messages', el => el.textContent), /Host/);
      await guest.type('.game-chat input', '<img src=x onerror=alert(1)>');
      await guest.keyboard.press('Enter');
      await host.waitForFunction(() => document.querySelector('.game-chat__messages').textContent.includes('<img'), { polling: 100 });
      assert.equal(await host.$('.game-chat__messages img'), null);
      await host.bringToFront();
      await new Promise(resolve => setTimeout(resolve, 1100));
      await host.evaluate(() => {
        const input=document.querySelector('.game-chat input');
        input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles:true }));
        input.value='한글 조합';input.dispatchEvent(new Event('input', { bubbles:true }));
        input.dispatchEvent(new KeyboardEvent('keydown', { key:'Enter', isComposing:true, bubbles:true, cancelable:true }));
        document.querySelector('.game-chat form').dispatchEvent(new Event('submit', { bubbles:true, cancelable:true }));
      });
      assert.equal(await host.evaluate(() => window.store.get().chat.length), 2, 'composition Enter must not send');
      await host.evaluate(() => document.querySelector('.game-chat input').dispatchEvent(new CompositionEvent('compositionend', { bubbles:true })));
      await host.keyboard.press('Enter');
      await guest.waitForFunction(() => window.store.get().chat.length === 3, { polling: 100 });
      await guest.bringToFront();
      await guest.keyboard.press('Escape');
      assert.equal(await guest.$('.game-chat__panel'), null);
      await guest.evaluate(async () => { window.store.set({ chat: [] }); await window.reconnect(); });
      await guest.waitForFunction(() => window.store.get().chat.length === 3, { polling: 100 });
      await guest.click('.game-chat__toggle');
      const bounds = await guest.$eval('.game-chat__panel', el => { const r=el.getBoundingClientRect();return {width:r.width,left:r.left,right:r.right,bottom:r.bottom}; });
      assert.ok(bounds.width === 360 && bounds.left >= 0 && bounds.right <= 1280 && bounds.bottom <= 720);
      await guest.setViewport({ width: 390, height: 640 });
      const mobile = await guest.$eval('.game-chat__panel', el => ({ width:el.getBoundingClientRect().width,right:el.getBoundingClientRect().right }));
      assert.ok(mobile.width <= 366 && mobile.right <= 390);
      const toggle = await guest.$eval('.game-chat__toggle', el => {const r=el.getBoundingClientRect();return {left:r.left,bottom:innerHeight-r.bottom,width:r.width,height:r.height,text:el.textContent.trim(),icon:!!el.querySelector('svg')};});
      assert.equal(toggle.left, toggle.bottom);
      assert.equal(toggle.width, 54); assert.equal(toggle.height, 54);
      assert.equal(toggle.text, ''); assert.ok(toggle.icon);
      await host.bringToFront();
      await host.click('.game-chat__faction-toggle');
      assert.equal(await host.$$eval('.game-chat__factions button', els => els.length), 8);
      await host.click('.game-chat__factions button');
      await guest.waitForFunction(() => window.store.get().chat.at(-1)?.text === '진영 선택: 염국', {polling:100});
      assert.equal(await guest.$eval('.game-chat__messages p:last-child .game-chat__faction', el=>el.textContent), '(염국)');
      assert.equal(await guest.$eval('.game-chat__messages p:last-child .game-chat__faction', el=>getComputedStyle(el).color), 'rgb(255, 59, 66)');
      await host.waitForFunction(()=>!document.querySelector('.game-chat__faction-toggle').disabled, {polling:100});
      await new Promise(resolve=>setTimeout(resolve,1100));
      await host.type('.game-chat input', '선택 후 메시지');
      await host.keyboard.press('Enter');
      await guest.waitForFunction(() => window.store.get().chat.at(-1)?.text === '선택 후 메시지', {polling:100});
      assert.equal(await guest.evaluate(()=>window.store.get().chat.at(-1).faction), '염국');
      await host.evaluate(async()=>{window.store.set({chatFaction:null});await window.reconnect();});
      await host.waitForFunction(()=>window.store.get().chatFaction==='염국', {polling:100});
      await host.waitForFunction(()=>document.querySelector('.game-chat__faction-toggle').textContent==='진영: 염국', {polling:100});
      await host.click('.game-chat__faction-toggle');
      await host.screenshot({path:'/tmp/stronghold-chat-factions.png'});
      await host.evaluate(() => window.request('g.leave'));
      await guest.evaluate(() => window.request('g.leave'));
    } finally { if (browser) await browser.close(); await server.close(); await rm(fixtureDir, { recursive: true, force: true }); }
  });
