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
