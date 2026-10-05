import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../../.cache/ursus-data/',import.meta.url);
test('disabled Ursus is absent from gameplay lookups without erasing the saved configuration catalogue', {skip:!existsSync(new URL('chess.json',root))},async()=>{
 const {data,matchData}=await import('../../public/js/data.js');
 const {store}=await import('../../public/js/store.js');
 const previousFetch=globalThis.fetch,previousMatch=store.get().match;
 globalThis.fetch=async url=>({ok:true,status:200,json:async()=>JSON.parse(readFileSync(new URL(String(url).split('/').pop(),root),'utf8'))});
 try {
  await data.loadAll('chess','bonds','items','bands');
  store.patch('match',{public:{customFactions:false}});
  assert.equal(matchData.lookup('bonds','ursusShip'),null);
  assert.ok(data.lookup('bonds','ursusShip'));
  for(const c of matchData.list('chess')) {assert.ok(!c.chessId.includes('custom_ursus'));assert.ok(!c.bonds.includes('ursusShip'));}
  for(const b of matchData.list('bonds')) assert.ok(!(b.visibleMembers||[]).some(id=>id.includes('custom_ursus')));
  assert.ok(!matchData.list('items').some(i=>i.giveBondId==='ursusShip'));
  store.patch('match',{public:{customFactions:true}});
  assert.ok(matchData.lookup('bonds','ursusShip'));
  assert.ok(matchData.lookup('chess','chess_custom_ursus_leto_a'));
 } finally {globalThis.fetch=previousFetch;store.set({match:previousMatch});}
});
