import {test} from 'node:test';
import assert from 'node:assert/strict';
import {customFactionData} from '../shared/customFactions.js';
import {garrisonTexts} from '../public/js/ui/loadoutModel.js';
test('disabled custom factions leave catalogue untouched and exclude custom gameplay records',()=>{
 const raw={chess:{gum:{bonds:['tank','ursusShip']},chess_custom_ursus_leto_a:{bonds:['ursusShip']}},bonds:{tank:{members:['gum','chess_custom_ursus_leto_a']},ursusShip:{}},items:{chess_item_custom_ursus_a:{},normal:{}}};
 const off=customFactionData(raw,false);
 assert.deepEqual(off.chess.gum.bonds,['tank']);assert.equal(off.chess.chess_custom_ursus_leto_a,undefined);assert.equal(off.bonds.ursusShip,undefined);assert.deepEqual(off.bonds.tank.members,['gum']);assert.equal(off.items.chess_item_custom_ursus_a,undefined);assert.deepEqual(raw.chess.gum.bonds,['tank','ursusShip']);assert.equal(customFactionData(raw,true),raw);
});
test('multi-effect traits do not repeat a line already shown in an earlier description',()=>{
 const records={a:{descRaw:'<배치 시> 맹약 +2\n<쓰러질 시> 맹약 +4'},b:{descRaw:'<배치 시> 맹약 +2'}};
 assert.deepEqual(garrisonTexts({garrisonIds:['a','b']},id=>records[id]),['<배치 시> 맹약 +2\n<쓰러질 시> 맹약 +4']);
});

import {makeMatch} from './match/harness.js';
import {loadData} from '../server/data.js';
import {existsSync} from 'node:fs';
const overlay=new URL('../.cache/ursus-data/',import.meta.url);
test('each match uses its host faction setting, including native Gummy affiliation',{skip:!existsSync(new URL('chess.json',overlay))},()=>{
 const data=loadData(overlay.pathname),gum=Object.values(data.chess).find(c=>c.charId==='char_196_sunbr'&&!c.isGolden);
 const off=makeMatch({data,customFactions:false}),on=makeMatch({data,customFactions:true});
 try{assert.equal(off.m.gd.chess('chess_custom_ursus_leto_a'),null);assert.ok(on.m.gd.chess('chess_custom_ursus_leto_a'));assert.ok(!off.m.ds.getChess(gum.chessId).raw.bonds.includes('ursusShip'));assert.ok(on.m.ds.getChess(gum.chessId).raw.bonds.includes('ursusShip'));assert.ok(data.chess[gum.chessId].bonds.includes('ursusShip'));}finally{off.m.dispose();on.m.dispose();}
});

test('disabled Ursus entries do not discard ordinary skill and skin preferences', {skip:!existsSync(new URL('chess.json',overlay))},()=>{
 const data=loadData(overlay.pathname),id='chess_char_1_01_a';
 const skin=data.chess[id].skins[0].id;
 const preferences={[id]:{skill:0,skin},chess_custom_ursus_leto_a:{skill:0}};
 const original=structuredClone(preferences);
 for(const enabled of [false,true,false]){
  const h=makeMatch({data,customFactions:enabled,seats:[{seat:0,playerId:'p_0',name:'P0',isBot:false,connected:true,loadout:preferences}]});
  try{
   assert.equal(h.ps('p_0').loadout[id].skill,0);
   assert.equal(h.ps('p_0').loadout[id].skin,skin);
   assert.equal(h.logs.warn.some(x=>x.includes('loadout')),false);
   assert.deepEqual(preferences,original,'session preferences remain available for later rooms');
  }finally{h.m.dispose();}
 }
});

import {GameData} from '../server/match/gamedata.js';
import {drawDisabledBonds} from '../server/match/pool.js';
import {createRng} from '../server/sim/rng.js';
test('Gummy remains eligible with Steadfast banned while enabled Ursus remains available', {skip:!existsSync(new URL('chess.json',overlay))},()=>{
 const data=loadData(overlay.pathname);
 const gum=Object.values(data.chess).find(c=>c.charId==='char_196_sunbr'&&!c.isGolden);
 let relevant=0;
 for(let seed=1;seed<=200;seed++){
  const gd=new GameData(customFactionData(data,true),'mode_multi_normal');
  const bans=drawDisabledBonds(gd,createRng(seed));
  if(bans.drawn.includes('steadShip')&&!bans.drawn.includes('ursusShip')){
   relevant++;assert.ok(!bans.banned.includes(gum.chessId));
  }
 }
 assert.ok(relevant>0,'exercise actual Steadfast bans');
 const off=customFactionData(data,false);
 for(const charId of ['char_196_sunbr','char_4207_branch']){
  for(const c of Object.values(off.chess).filter(c=>c.charId===charId))assert.ok(!c.bonds.includes('ursusShip'));
 }
});


test('enabling Ursus adds one core ban and keeps five core factions available in playable difficulties', {skip:!existsSync(new URL('chess.json',overlay))},()=>{
 const data=loadData(overlay.pathname);
 for(const difficulty of ['FUNNY','NORMAL','HARD','ABYSS']) for(const enabled of [false,true]) {
  const h=makeMatch({data,difficulty,customFactions:enabled});
  try {
   const pub=h.m.publicView();
   const disabled=new Set([...(pub.drawnDisabledBonds||[]),...(pub.disabledBonds||[])]);
   const available=h.m.gd.bondIds.filter(id=>h.m.gd.bond(id).isCore&&!disabled.has(id));
   assert.equal(available.length,5,`${difficulty} Ursus=${enabled}`);
   if(!enabled) assert.equal(h.m.gd.bond('ursusShip'),null);
  } finally {h.m.dispose();}
 }
});

test('Ursus descriptions use the same highlighted thresholds and live layer formatting as core bonds', {skip:!existsSync(new URL('bonds.json',overlay))},async()=>{
 const {formatBondEffect,parseRichText}=await import('../public/js/ui/richText.js');
 const bond=loadData(overlay.pathname).bonds.ursusShip;
 assert.deepEqual(bond.thresholds,[3,6]);
 assert.ok(bond.descRaw.includes('<@autochess.dgreen>3</>'));
 const effect=formatBondEffect(bond,10);
 assert.ok(effect.includes('+45%'));
 assert.ok(!effect.includes('{0:'));
 assert.ok(parseRichText(effect).some(s=>s.cls.includes('ba.vup')));
 assert.ok(effect.includes('[우르수스]'));
});
