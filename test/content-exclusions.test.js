import {test} from 'node:test';import assert from 'node:assert/strict';
import {applyCustomExtensions,normalizeCustomExtensions,customExtensionCatalog,validateExtensionMinimums} from '../shared/customExtensions.js';
import {DATA,makeMatch} from './match/harness.js';
const core=Object.keys(DATA.bonds).filter(id=>DATA.bonds[id].isCore);
const selection={bonds:[],stages:[],disabledBonds:[core[0]],disabledStages:['act1autochess_m01'],disabledBosses:['boss_1'],disabledBands:['band_bldsk']};
test('only core bonds are excludable; a single-core operator disappears, a dual-core operator keeps the other core',()=>{
 const raw=structuredClone(DATA);const id=Object.keys(raw.chess)[0];raw.chess.single={...raw.chess[id],chessId:'single',bonds:[core[0],'swiftShip']};raw.chess.dual={...raw.chess[id],chessId:'dual',bonds:[core[0],core[1],'swiftShip']};
 assert.ok(customExtensionCatalog(raw).disabledBonds.every(x=>raw.bonds[x.id].isCore));
 assert.ok(!normalizeCustomExtensions({disabledBonds:['swiftShip']},raw).disabledBonds);
 const result=applyCustomExtensions(raw,selection);assert.equal(result.chess.single,undefined);assert.deepEqual(result.chess.dual.bonds,[core[1],'swiftShip']);assert.equal(result.bonds[core[0]],undefined);assert.ok(raw.chess.single);
});
test('excluded maps, bosses, strategies and bond equipment leave their actual pools',()=>{
 const d=applyCustomExtensions(DATA,selection);assert.equal(d.stages.act1autochess_m01,undefined);assert.equal(d.bosses.boss_1,undefined);assert.equal(d.bands.band_bldsk,undefined);assert.equal(d.enemies[DATA.bosses.boss_1.enemyKey],undefined);
 for(const m of Object.values(d.config.modes)){assert.ok(!m.stages.includes('act1autochess_m01'));assert.equal(m.bossWeights.boss_1,undefined);}
 assert.ok(Object.values(d.items).every(i=>i.giveBondId!==core[0]));
 const h=makeMatch({data:DATA,customExtensions:selection}).start();try{assert.notEqual(h.m.stageId,'act1autochess_m01');assert.ok(!h.m.gd.bandIds().includes('band_bldsk'));assert.ok(!h.m.gd.bossWeights().some(([id])=>id==='boss_1'));}finally{h.m.dispose();}
});
test('minimums prevent empty map/boss/strategy pools and preserve five core bonds',()=>{
 assert.deepEqual(validateExtensionMinimums(DATA,selection),[]);
 const all=customExtensionCatalog(DATA);
 for(const category of ['disabledBonds','disabledStages','disabledBosses','disabledBands'])assert.ok(validateExtensionMinimums(DATA,{bonds:[],stages:[],[category]:all[category].map(e=>e.id)}).length,category);
 const s={bonds:[],stages:[],disabledBonds:core.slice(0,3)};const h=makeMatch({data:DATA,customExtensions:s});try{assert.equal(h.m.gd.bondIds.filter(id=>h.m.gd.bond(id).isCore&&!h.m.disabledBonds?.includes(id)).length>=5,true);}finally{h.m.dispose();}
});
test('disabling content does not invalidate or erase saved skill and skin preferences',()=>{
 const removed=Object.values(DATA.chess).find(c=>c.bonds?.includes(core[0])&&c.bonds.filter(b=>DATA.bonds[b]?.isCore).length===1&&!c.isGolden&&c.visible);
 const prefs={[removed.chessId]:{skill:0}};const h=makeMatch({data:DATA,customExtensions:selection,seats:[{seat:0,playerId:'p_0',name:'P0',isBot:false,connected:true,loadout:prefs}]});try{assert.deepEqual(prefs,{[removed.chessId]:{skill:0}});assert.equal(h.ps('p_0').loadout[removed.chessId],undefined);assert.equal(h.m.gd.chess(removed.chessId),null);}finally{h.m.dispose();}
});
