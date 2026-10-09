import P from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdir,rm,readFile} from 'node:fs/promises';
const expectedCards=Object.values(JSON.parse(await readFile('.cache/ursus-data/chess.json','utf8'))).filter(c=>c.optionalRecruit&&!c.isGolden&&c.tier===5&&c.globalReleased!==false).length;
const profile='/tmp/recruit-final-chrome';
const b=await P.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',headless:true,userDataDir:profile,args:['--no-sandbox','--disable-dev-shm-usage','--disk-cache-size=1','--media-cache-size=1']});
try{
 const p=await b.newPage();p.on('pageerror',e=>console.error('PAGE ERROR:',e.message));await p.setViewport({width:1920,height:1080});
 await p.evaluateOnNewDocument(()=>{localStorage.setItem('sp.name','선발 통합 시험');sessionStorage.setItem('sp.entered','1')});
 await p.goto(process.env.RECRUITS_URL||'http://127.0.0.1:3004/',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>globalThis.__SP__?.store.get().connection.status==='online',{timeout:60000});
 await p.$eval('[data-testid="loadout-open"]',el=>el.click());await p.waitForSelector('.lo');
 await p.evaluate(()=>[...document.querySelectorAll('.lo button')].find(x=>x.textContent==='추가 선발').click());
 await p.waitForFunction(n=>document.querySelectorAll('.lo-card').length===n,{},expectedCards);
 for(const [cid,tier] of [['kalts',5],['chen',6]]){
  const sel=`[data-chess="chess_custom_recruit_${cid}_5_a"]`;
  await p.$eval(sel,(el,tier)=>[...el.parentElement.querySelectorAll('.lo-recruit-choice button')].find(x=>x.textContent===`${tier}단계`).click(),tier);
 }
 await p.waitForFunction(()=>document.querySelector('.lo').innerText.includes('5단계 1/2')&&document.querySelector('.lo').innerText.includes('6단계 1/2'));
 await p.waitForFunction(()=>[...document.querySelectorAll('.lo-card img')].filter(x=>x.src.includes('/char/avatar/')).slice(0,5).every(x=>x.complete&&x.naturalWidth>0),{timeout:60000});
 await p.waitForFunction(()=>document.querySelector('.lo').innerText.includes('동기화됨'),{timeout:30000}).catch(async e=>{console.log(await p.evaluate(async()=>({text:document.querySelector('.lo').innerText.slice(0,600),loadout:(await import('/js/ui/loadoutSync.js')).loadoutStore.get()})));throw e});
 await mkdir('docs/recruit-integration',{recursive:true});await p.screenshot({path:'docs/recruit-integration/selection.png'});
 const result=await p.evaluate(()=>({cards:document.querySelectorAll('.lo-card').length,selected:[...document.querySelectorAll('.lo-recruit-choice .is-on')].filter(x=>x.textContent!=='미선발').map(x=>x.textContent),sync:document.querySelector('.lo').innerText.includes('동기화됨')}));
 assert.equal(result.cards,expectedCards);assert.deepEqual(result.selected,['5단계','6단계']);assert.ok(result.sync);console.log(result);
}finally{await b.close();await rm(profile,{recursive:true,force:true});}
