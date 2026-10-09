import P from 'puppeteer-core';import assert from 'node:assert/strict';import {rm,mkdir} from 'node:fs/promises';
const profile='/tmp/022-release-chrome',browser=await P.launch({executablePath:'/usr/bin/chromium',headless:true,userDataDir:profile,args:['--no-sandbox','--disable-dev-shm-usage','--disk-cache-size=1','--media-cache-size=1']});
const errors=[];
try{
 const p=await browser.newPage();const cdp=await p.createCDPSession();await cdp.send('Network.enable');cdp.on('Network.webSocketFrameSent',e=>{const v=e.response.payloadData;if(v.includes('g.buy'))console.log('BUY SENT',v)});cdp.on('Network.webSocketFrameReceived',e=>{const v=e.response.payloadData;try{const m=JSON.parse(v);if(m.t==='ok'||m.t==='error')console.log('ACK',m.t,m.rid,m.code)}catch{}});p.on('console',m=>{if(['error','warn'].includes(m.type()) || m.text().startsWith('ACTION'))console.error('BROWSER:',m.text())});p.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR:',e.message)});
 await p.evaluateOnNewDocument(()=>{localStorage.setItem('sp.name','릴리스 검증');sessionStorage.setItem('sp.entered','1');localStorage.setItem('sp.patchNotes.seenVersion','0.2.2a')});
 await p.setViewport({width:1280,height:900});await p.goto('http://127.0.0.1:3005/',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>globalThis.__SP__?.store.get().connection.status==='online',{timeout:60000}).catch(async e=>{console.log('Initialization:',errors,await p.evaluate(()=>({body:document.body.innerText.slice(0,500),state:globalThis.__SP__?.store.get()})));throw e});
 await p.$eval('.patch-entry__button',b=>b.click());await p.waitForSelector('.patch-notes');
 const sizes=[];
 for(const width of [1280,740,390]){await p.setViewport({width,height:900});await new Promise(r=>setTimeout(r,100));sizes.push(await p.$eval('.patch-notes',el=>{const nav=el.querySelector('.patch-notes__versions'),buttons=[...nav.children];return {width:innerWidth,boxWidth:el.getBoundingClientRect().width,navRows:new Set(buttons.map(b=>Math.round(b.getBoundingClientRect().top))).size,horizontalScroll:nav.scrollWidth>nav.clientWidth}}));}
 await mkdir('docs/release-0.2.2a',{recursive:true});await p.screenshot({path:'docs/release-0.2.2a/patchnotes-mobile.png'});
 for(const s of sizes){assert.equal(s.navRows,1);assert.ok(s.boxWidth<=s.width);}console.log('Patch notes layout:',sizes);
 await p.setViewport({width:1280,height:900});await p.screenshot({path:'docs/release-0.2.2a/patchnotes-desktop.png'});await p.$eval('.patch-notes .modal__actions button',b=>b.click());
 await p.evaluate(async()=>{await __SP__.net.request('room.create',{mode:'solo',difficulty:'NORMAL'});await __SP__.net.request('room.start',{});});
 await p.waitForFunction(()=>__SP__.store.get().match?.public?.phase==='INFO_CHECK');await p.evaluate(()=>__SP__.net.request('g.infoReady',{}));
 await p.waitForFunction(()=>__SP__.store.get().match?.public?.phase==='BAND_DRAFT');
 await p.evaluate(()=>__SP__.net.request('g.band',{bandId:'band_bldsk'}));
 await p.waitForFunction(()=>__SP__.store.get().match?.public?.phase==='PREP',{timeout:30000});await p.waitForSelector('canvas',{timeout:30000}).catch(async e=>{console.log('FIELD STATUS:',await p.evaluate(()=>document.body.innerText.slice(-2500)));throw e});
 await new Promise(r=>setTimeout(r,2500));assert.deepEqual(errors,[]);await mkdir('docs/release-0.2.2a',{recursive:true});await p.screenshot({path:'docs/release-0.2.2a/prep.png'});
 console.log('Gameplay prep:',await p.evaluate(()=>({phase:__SP__.store.get().match.public.phase,canvas:!!document.querySelector('canvas'),teamRows:document.querySelectorAll('.team__row').length})),errors);
 await p.evaluate(async()=>{const slot=__SP__.store.get().match.private.shop.slots.findIndex(s=>s?.kind==='chess');if(slot<0)throw Error('No operator in shop');console.log('ACTION buy',slot);await __SP__.net.request('g.buy',{slot}).catch(e=>{console.log('ACTION buy failed state',JSON.stringify({connection:__SP__.store.get().connection,hand:__SP__.store.get().match.private.hand}));throw e});console.log('ACTION bought');await new Promise(r=>setTimeout(r,250));const piece=__SP__.store.get().match.private.hand.find(p=>p?.kind==='chess');if(!piece)throw Error('Purchase did not create a piece');let placed=false;for(let row=9;row<=12&&!placed;row++)for(let col=2;col<=10&&!placed;col++){try{console.log('ACTION move',row,col);await __SP__.net.request('g.move',{uid:piece.uid,to:{area:'board',row,col},dir:'RIGHT'});placed=true}catch{await new Promise(r=>setTimeout(r,150));}}if(!placed)throw Error('No legal placement');(await import('/js/diag.js')).clearErrorLog();console.log('ACTION ready');await __SP__.net.request('g.ready',{ready:true});console.log('ACTION ready done');});
 await p.waitForFunction(()=>__SP__.store.get().match?.public?.phase==='COMBAT',{timeout:30000});
 await new Promise(r=>setTimeout(r,6000));
 const diag=await p.evaluate(async()=> (await import('/js/diag.js')).errorLog());assert.deepEqual(diag,[]);assert.deepEqual(errors,[]);
 await p.screenshot({path:'docs/release-0.2.2a/battle.png'});console.log('Gameplay battle: no runtime or simulation errors');

}finally{await browser.close();await rm(profile,{recursive:true,force:true});}
