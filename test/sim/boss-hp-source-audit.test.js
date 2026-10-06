import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {GameData} from '../../server/match/gamedata.js';
import {SharedBossPool,bossPoolHp} from '../../server/match/finalAssault.js';
import {makeBattle} from '../helpers/battleHarness.js';
import {DATA} from '../match/harness.js';
const sourcePath=new URL('../../.cache/gamedata/excel/activity_table.json',import.meta.url);
const season=existsSync(sourcePath)?JSON.parse(readFileSync(sourcePath,'utf8')).activity.AUTOCHESS_SEASON.act2autochess:null;
const columns={FUNNY:'bloodPoint',NORMAL:'bloodPointNormal',HARD:'bloodPointHard',ABYSS:'bloodPointAbyss'};
for(const [difficulty,column]of Object.entries(columns))test(`${difficulty}: every boss matches source HP; mirrored bodies neither divide HP nor duplicate damage`,{skip:!season&&'official source cache unavailable'},()=>{
 const gd=new GameData(DATA,`mode_multi_${difficulty.toLowerCase()}`);
 for(const [id,raw]of Object.entries(season.bossInfoDict)){
  assert.equal(bossPoolHp(gd,id,1),gd.bossPoolHp(id,1));assert.equal(gd.bossPoolHp(id,1),raw[column]);assert.equal(gd.bossPoolHp(id,4),raw[column]*4);
  const pool=new SharedBossPool(gd.bossPoolHp(id,4));
  const h=makeBattle({kind:'boss',sharedBoss:pool,content:'none',autoFinish:false});
  const copies=Array.from({length:4},()=>h.spawn(gd.boss(id).enemyKey,{tag:'boss'}));
  for(const copy of copies){assert.equal(copy.s.maxHp,raw[column]*4);assert.equal(copy.hp,raw[column]*4);}
  h.b.dealDamage(null,copies[0],{amount:100,type:'true',ignoreSelect:true,canDodge:false});
  assert.equal(pool.hp,raw[column]*4-100,'one hit credited once despite four boss bodies');
  h.b._bossSync();for(const copy of copies)assert.equal(copy.hp,pool.hp);
  assert.equal(h.b.snapshot().boss.max,raw[column]*4);assert.equal(h.b.snapshot().boss.hp,raw[column]*4-100);
 }
});

for(const [difficulty,column] of Object.entries(columns)) test(`${difficulty}: solo boss and hidden boss use the full base pool consistently`, {skip:!season&&'official source cache unavailable'},()=>{
 const gd=new GameData(DATA,`mode_single_${difficulty.toLowerCase()}`);
 for(const [id,raw] of Object.entries(season.bossInfoDict)) {
  assert.equal(bossPoolHp(gd,id,1),gd.bossPoolHp(id,1));assert.equal(gd.bossPoolHp(id,1),raw[column]);
 }
});
