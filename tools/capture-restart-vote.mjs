// Browser globals are only referenced inside Puppeteer callbacks.
/* global window, document */
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {fileURLToPath,pathToFileURL} from 'node:url';
const baseline=process.argv.includes('--before');
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
// --before uses a separate pristine master checkout. Optional SP_VOTE_ART_ROOT supplies locally installed art.
const baseRoot=baseline?path.resolve(process.env.SP_VOTE_BASELINE_ROOT||path.resolve(root,'../../.cache/master-vote-preview')):root;
const artRoot=process.env.SP_VOTE_ART_ROOT;
const {startServer}=await import(pathToFileURL(path.join(baseRoot,'server/index.js')));
import {TestClient} from '../test/helpers/wsClient.js';
import {canPlace} from '../server/match/board.js';
import {splitHashedPath} from '../shared/assetPaths.js';
const out=path.resolve(process.env.SP_VOTE_CAPTURE_OUT||'test/e2e/out/restart-vote');await fs.mkdir(out,{recursive:true});
process.env.SP_TEST_MODE='1';
const server=await startServer({port:0,host:'127.0.0.1',quiet:true,studio:false,seedFn:()=>9102});
const base=`http://127.0.0.1:${server.port}`;
const manifest={baseCommit:'656030bc',source:'origin/master',kind:baseline?'original master actual vote':'implemented vote in real master test rooms',implementationApplied:!baseline,scenarios:[],errors:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let browser;
const allGuests=[];
const mime={'.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg'};
try{
 browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,pipe:true,args:['--no-sandbox']});
 for(const count of (process.argv.includes('--mobile-only')?[4]:[4,8])){
  const context=await browser.createBrowserContext(),page=await context.newPage(),guests=[];
  page.setDefaultTimeout(45000);await page.setViewport({width:1600,height:1000});await page.setBypassServiceWorker(true);
  page.on('pageerror',e=>{manifest.errors.push(`${count}p: ${e.message}`);console.log('Page error',e.message);});
  await page.setRequestInterception(true);
  page.on('request',async req=>{try{const u=new URL(req.url());if(artRoot&&u.origin===base&&/^\/(assets|fonts)\//.test(u.pathname)){
   const file=path.resolve(artRoot,`.${decodeURIComponent(splitHashedPath(u.pathname).path)}`);
   if(file.startsWith(path.resolve(artRoot)+path.sep))try{await req.respond({status:200,contentType:mime[path.extname(file)]||'application/octet-stream',body:await fs.readFile(file)});return;}catch{}
  }await req.continue();}catch{try{await req.continue();}catch{}}});
  await page.evaluateOnNewDocument(n=>{localStorage.setItem('sp.name',`${n}인 검토 방장`);sessionStorage.setItem('sp.entered','1');},count);
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__SP__?.store.get().me.playerId&&window.__SP__.store.get().connection.status==='online');
  await page.evaluate(async()=>{const {updateSettings}=await import('/js/ui/settings.js');updateSettings({muted:true});});
  const send=async(type,fields={})=>page.evaluate(async({type,fields})=>window.__SP__.net.request(type,fields),{type,fields});
  await send('room.create',{mode:count===8?'coop8':'coop',difficulty:'NORMAL',gameplayMode:'custom',test:true});
  await send('room.setCustomExtensions',{selection:{bonds:[],stages:[],rules:['augments'],ruleValues:{augmentEnemyVote:1,...(baseline?{}:{restartRoomCooldown:0,restartPlayerCooldown:0,restartRequestLimit:10})}}});
  const roomCode=await page.evaluate(()=>window.__SP__.store.get().room.code);
  for(let i=1;i<count;i++){
   const client=await TestClient.connect(`ws://127.0.0.1:${server.port}/ws`),welcome=await client.hello(`검토 팀원 ${i+1}`);
   assert.equal((await client.request({t:'room.join',code:roomCode,testAck:true})).t,'ok');
   assert.equal((await client.request({t:'room.ready',ready:true})).t,'ok');
   guests.push({client,id:welcome.playerId});allGuests.push(client);
  }
  await send('room.start');
  const room=server.lobby.rooms.get(roomCode),match=room.match,hostId=await page.evaluate(()=>window.__SP__.store.get().me.playerId);
  console.log(`Started master ${count}p room ${roomCode}; seats=${room.seats.filter(Boolean).length}; phase=${match.phase}`);
  assert.equal(room.seats.filter(Boolean).length,count);
  const until=async(predicate,label)=>{const t=Date.now();while(!predicate()){if(Date.now()-t>45000)throw new Error(`Timeout ${count}p ${label}; phase=${match.phase} R${match.round}`);await sleep(100);}};
  const command=async(cmd,args)=>send('g.test',{cmd,args});
  const snap=async(name,extra={})=>{await page.screenshot({path:path.join(out,`${count}p-${name}.png`)});manifest.scenarios.push({file:`${count}p-${name}.png`,players:count,mode:room.mode,phase:match.phase,round:match.round,...extra});console.log(`Captured ${count}p-${name}`);};
  const preview=async(name,label,selector)=>{
   await page.waitForSelector(selector);await page.waitForSelector('.pbanner--overlay',{hidden:true,timeout:10000});await sleep(300);
   if(!await page.$('.game-chat__panel'))await page.click('.game-chat__toggle');
   const requested=await guests[0].client.request({t:'room.requestRestart',matchNo:room.matchCount});assert.equal(requested.t,'ok',JSON.stringify(requested));
   await page.waitForFunction(()=>!!window.__SP__.store.get().restartVote?.vote);
   if(!baseline)await page.waitForSelector('.restart-decision');else await page.waitForSelector('.restart-vote');
   await sleep(400);
   const badge=baseline?'적용 전 · master':'적용 후 · master 기반 구현';
   await page.evaluate(text=>{const b=document.createElement('div');b.id='capture-label';b.textContent=text;b.style.cssText='position:fixed;top:8px;left:8px;z-index:180;font:13px sans-serif;color:#ffe6a5;background:#251e11;border:1px solid #8e7542;padding:6px 10px;pointer-events:none';document.body.append(b);},`${badge} · ${count}인 ${label}`);
   if(!baseline){
    assert.equal(match.restartVotePaused,true);const before={phase:match.phase,deadline:match.deadline,clock:match._clockNow()};await sleep(1100);
    assert.deepEqual({phase:match.phase,deadline:match.deadline,clock:match._clockNow()},before);
    let rejected=false;try{await send('g.refresh');}catch{rejected=true;}assert.equal(rejected,true);
    await page.type('[aria-label="채팅 메시지"]','투표 중에도 채팅할 수 있습니다.');await page.click('.game-chat__panel button[type="submit"]');
    await page.waitForFunction(()=>document.querySelector('.game-chat__messages').textContent.includes('투표 중에도'));
    const hittable=await page.evaluate(()=>['.game-chat__toggle','.ewheel__btn','[aria-label="채팅 메시지"]'].every(sel=>{const e=document.querySelector(sel),r=e.getBoundingClientRect();return e===document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)||e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));assert.equal(hittable,true,'communication controls covered');
   }
   await snap(`${name}-${baseline?'before':'after'}`,{kind:baseline?'original-master-vote':'implemented-server-vote',serverPauseImplemented:!baseline});
   if(!baseline&&name==='prep'){
    if(process.argv.includes('--mobile-only')){
     for(const [width,height] of [[390,844],[320,640],[844,390]]){
      await page.setViewport({width,height});await sleep(300);
      await page.evaluate(()=>{const cards=document.querySelectorAll('.restart-decision__card');cards[1].click();cards[0].click();});
      await page.$eval('.restart-decision__card:first-child small',e=>e.scrollIntoView({block:'nearest'}));
      const visible=await page.evaluate(()=>['.restart-decision__card:first-child small','.game-chat__toggle','.ewheel__btn','[aria-label="채팅 메시지"]'].every(sel=>{const e=document.querySelector(sel);if(!e)return false;const r=e.getBoundingClientRect(),at=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return at===e||e.contains(at);}));
      assert.equal(visible,true,`controls covered at ${width}x${height}`);
      await snap(`layout-${width}x${height}-after`,{kind:'responsive-real-vote'});
     }
     await page.setViewport({width:1600,height:1000});await sleep(200);
     for(let i=0;i<20;i++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement.closest('.restart-overlay-host,.game-chat,.ewheel')),true);}
    }
    await page.click('.ewheel__btn');await page.waitForSelector('.ewheel__panel');await snap('prep-emotes-after',{kind:'implemented-vote-with-emote-wheel'});
    const item=await page.$('.ewheel__item');await item.click();await sleep(150);if(await page.$('.ewheel__panel'))await page.click('.ewheel__btn');
    assert.equal(await page.$('.restart-decision__confirm'),null);
    // A synchronous click pair exercises the real 150ms guard, including pre-render events.
    await page.evaluate(()=>{const cards=document.querySelectorAll('.restart-decision__card');if(cards[0].getAttribute('aria-pressed')!=='true')cards[0].click();cards[1].click();cards[1].click();});
    await sleep(40);assert.equal(await page.evaluate(()=>window.__SP__.store.get().restartVote.vote.answered),false);
    await sleep(180);await page.waitForFunction(()=>document.querySelector('.restart-decision__card--restart small').textContent.includes('동의 확정'));
    await snap('prep-selected-after',{kind:'card-selected-not-submitted'});
    await page.click('.restart-decision__card--restart');
    await page.waitForSelector('.restart-decision__waiting');
    assert.equal(await page.evaluate(()=>window.__SP__.store.get().restartVote.vote.myAnswer),true);
    assert.equal((await page.$eval('.restart-decision__waiting',e=>e.textContent)).includes('채팅과 이모티콘'),false);
    await snap('prep-voted-after',{kind:'card-confirmed-waiting'});
    const currentVote=await page.evaluate(()=>window.__SP__.store.get().restartVote.vote);
    assert.equal((await guests[1].client.request({t:'room.answerRestart',matchNo:room.matchCount,voteId:currentVote.id,agree:false})).t,'ok');

   }else await send('room.answerRestart',{matchNo:room.matchCount,voteId:await page.evaluate(()=>window.__SP__.store.get().restartVote.vote.id),agree:false});
   await page.waitForFunction(()=>!window.__SP__.store.get().restartVote?.vote);
   if(!baseline)assert.equal(match.restartVotePaused,false);
   await page.evaluate(()=>document.getElementById('capture-label').remove());
  };
  await send('g.infoReady');for(const g of guests)await g.client.request({t:'g.infoReady'});
  await until(()=>match.phase==='BAND_DRAFT','band');
  await command('phase',{name:'battleCheck'});
  await until(()=>match.phase==='PREP','prep');await sleep(2200);
  const ps=match.players.get(hostId),ids=match.gd.bandIds();
  const chessIds=[...match.pool.entries.keys()].filter(id=>{const c=match.gd.chess(id);return c&&!c.isGolden&&c.tier===1&&!match.bannedChess.includes(id);}).slice(0,3);
  for(const id of chessIds)await command('chess',{id});
  for(const piece of ps.hand.filter(p=>p?.kind==='chess')){
   const tile=[...ps.deployMap()].map(([key])=>key.split(',').map(Number)).find(([r,c])=>!ps.board.has(`${r},${c}`)&&canPlace(ps.deployMap(),ps._placementOf(piece),r,c));
   if(tile)await send('g.move',{uid:piece.uid,to:{area:'board',row:tile[0],col:tile[1]}});
  }
  await preview('prep','정비','.shopbar');
  if(baseline||process.argv.includes('--mobile-only')){for(const g of guests)await g.client.terminate();await context.close();continue;}
  await command('round',{round:3});
  await until(()=>match.phase==='SP_DRAFT'&&!!match.sp,'event');
  await preview('event','이벤트 선택','.spov:not(.augment-overlay)');
  await command('round',{round:4});
  await until(()=>!!match.augments.current&&match.augments.current.side==='ally','ally augment');
  await preview('augment-ally','아군 증강 선택','.augment-overlay--ally');
  const choose=async(side)=>{
   const selection=match.augments.current;
   for(const [pid,client] of [[hostId,null],...guests.map(g=>[g.id,g.client])]){
    const cards=side==='ally'?selection.slots.get(pid)?.cards:selection.boss.cards;
    const fields={eventId:selection.id,side,idx:0,cardId:cards[0].id};
    if(client)assert.equal((await client.request({t:'g.augmentPick',...fields})).t,'ok');else await send('g.augmentPick',fields);
   }
  };
  await choose('ally');await until(()=>match.augments.current?.side==='enemy','enemy augment');
  await preview('augment-enemy','적 증강 투표','.augment-overlay--enemy');
  await choose('enemy');await until(()=>match.phase==='PREP'&&!match.augments.current,'post augment prep');
  await command('phase',{name:'combat'});await until(()=>match.phase==='COMBAT','combat');
  await page.waitForSelector('.gm canvas');await sleep(1500);
  await preview('combat','일반 전투','.gm canvas');
  for(const g of guests)await g.client.request({t:'room.leave'});
  await send('room.leave');for(const g of guests)await g.client.terminate();
  await context.close();
 }
 console.log(`Completed ${manifest.scenarios.length} scenario screenshots`);
}catch(error){manifest.failure=error.stack;console.error(error);process.exitCode=1;}finally{
 await fs.writeFile(path.join(out,baseline?'manifest-before.json':process.argv.includes('--mobile-only')?'manifest-mobile.json':'manifest-after.json'),JSON.stringify(manifest,null,2));
 for(const client of allGuests)try{await client.terminate();}catch{}
 await browser?.close();await server.close();
}
