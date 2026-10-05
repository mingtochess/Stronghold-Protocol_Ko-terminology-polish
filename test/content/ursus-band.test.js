import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadData} from '../../server/data.js';
import {makeMatch,give} from '../match/harness.js';
import {setGameData} from '../../server/sim/content/support/index.js';
import {allowedBands} from '../../public/js/screens/bandDraft.js';
import {existsSync} from 'node:fs';
const overlay=new URL('../../.cache/ursus-data/',import.meta.url);
const band='band_custom_ursus_kaschey';
test('Kaschey: host gate, HP 22, promotion discount once per round, floor zero',{skip:!existsSync(new URL('bands.json',overlay))},t=>{
 const data=loadData(overlay.pathname);setGameData(data);t.after(()=>setGameData(null));
 const off=makeMatch({data,customFactions:false});t.after(()=>off.m.dispose());
 assert.equal(off.m.gd.bandAllowed(band),false);
 assert.ok(!allowedBands(Object.values(data.bands),'SINGLE',false).some(b=>b.bandId===band));
 assert.ok(allowedBands(Object.values(data.bands),'SINGLE',true).some(b=>b.bandId===band));
 const h=makeMatch({data,customFactions:true,fake:true}).start();t.after(()=>h.m.dispose());
 assert.equal(h.m.gd.bandAllowed(band),true);assert.equal(h.m.gd.startLp(band),22);
 h.toPrep(1);const ps=h.ps('p_0');ps.bandId=band;ps.shop.upgradePrice=10;
 ps.board.clear();ps.hand.fill(null);ps.temp.fill(null);
 const ursus='chess_custom_ursus_absin_a';
 const normal=Object.values(data.chess).find(c=>!c.isGolden&&!c.bonds.includes('ursusShip'));
 ps.promote(give(h.m,ps,normal.chessId));assert.equal(ps.shop.upgradePrice,10);
 // Real automatic three-copy merge.
 for(let i=0;i<3;i++)ps.acquireChess(ursus,{source:'test'});
 assert.equal(ps.shop.upgradePrice,8);
 ps.promote(give(h.m,ps,ursus));assert.equal(ps.shop.upgradePrice,8);
 h.m.round++;ps.promote(give(h.m,ps,ursus));assert.equal(ps.shop.upgradePrice,6);
 h.m.round++;ps.shop.upgradePrice=1;ps.promote(give(h.m,ps,ursus));assert.equal(ps.shop.upgradePrice,0);
});
