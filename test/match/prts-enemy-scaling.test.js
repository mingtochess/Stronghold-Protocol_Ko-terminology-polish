import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GameData} from '../../server/match/gamedata.js';
import {DATA} from './harness.js';
import {makeBattle} from '../helpers/battleHarness.js';
import {buildNormalWave,buildBossWave,setupMatchWaves} from '../../server/match/waves.js';
import {createRng} from '../../server/sim/rng.js';
const wiki=JSON.parse(readFileSync(new URL('../fixtures/prts-enemy-scaling.json',import.meta.url),'utf8'));
const close=(actual,expected,label)=>assert.ok(Math.abs(actual-expected)<=Math.max(1e-6,Math.abs(expected)*1e-6),`${label}: ${actual} vs ${expected}`);
for(const [mode,rows]of Object.entries(wiki.modes))test(`${mode}: current PRTS table reaches actual spawned stats; documented HP exception`,()=>{
 const gd=new GameData(DATA,mode), h=makeBattle({content:'none',autoFinish:false});
 for(const [round,row]of Object.entries(rows)){
  if(row.atk.multiplier===null)continue;
  const modifiers=gd.enemyScale(Number(round));
  const hpException=/mode_single_(funny|normal)$/.test(mode);
  const atk=row.atk.multiplier,hp=row.hp.multiplier*(hpException?.75/.7:1),speed=mode.endsWith('_abyss')&&Number(round)>=3?1.15:1;
  close(modifiers.atkMul,atk,`${mode} R${round} ATK`);close(modifiers.hpMul,hp,`${mode} R${round} HP`);close(modifiers.speedMul,speed,'speed');
  const enemy=h.spawn('enemy_1000_gopro_2',{mods:modifiers});
  close(enemy.s.maxHp,enemy.def.maxHp*hp,'spawn HP');close(enemy.s.atk,enemy.def.atk*atk,'spawn ATK');close(enemy.s.moveSpeed,enemy.def.moveSpeed*speed,'spawn speed');
  close(enemy.s.def,enemy.def.def,'DEF unchanged');close(enemy.s.res,enemy.def.res,'RES unchanged');close(enemy.s.aspd,enemy.def.aspd,'ASPD unchanged');close(enemy.s.bat,enemy.def.bat,'attack interval unchanged');
 }
});
test('waves and boss escorts carry the scaling; leader HP excludes it, leader ATK and speed retain it',()=>{
 for(const mode of Object.keys(wiki.modes)){
  const gd=new GameData(DATA,mode),setup=setupMatchWaves(gd,createRng(13));
  for(const r of Object.keys(wiki.modes[mode]).map(Number)){
   if(wiki.modes[mode][r].atk.multiplier===null)continue;
   const scale=gd.enemyScale(r);const wave=buildNormalWave(gd,createRng(13),setup,r);
   for(const spawn of wave.spawns){close(spawn.mods.atkMul,scale.atkMul,'wave ATK');if(spawn.tag!=='boss')close(spawn.mods.hpMul,scale.hpMul,'wave HP');}
  }
  const round=mode==='mode_single_funny'?9:14;
  const wave=buildBossWave(gd,createRng(1),setup,round,{bossId:'boss_1',solo:gd.isSolo});
  assert.ok(wave.spawns.some(s=>s.tag==='boss'));
  for(const spawn of wave.spawns){close(spawn.mods.atkMul,gd.enemyScale(round).atkMul,'leader/escort ATK');close(spawn.mods.speedMul,gd.enemyScale(round).speedMul,'leader/escort speed');if(spawn.tag==='boss')assert.equal(spawn.mods.hpMul,undefined);else close(spawn.mods.hpMul,gd.enemyScale(round).hpMul,'escort HP');}
 }
});
test('solo uses base HP; co-op boss and hidden boss scale by 1–4 alive participants',()=>{
 for(const mode of Object.keys(wiki.modes)){
  const gd=new GameData(DATA,mode);
  for(const [id,boss]of Object.entries(DATA.bosses))for(const alive of [1,2,3,4])assert.equal(gd.bossPoolHp(id,alive),Math.round(boss.bloodPoint[gd.difficulty]*(gd.isSolo?1:alive)));
 }
 assert.equal(DATA.config.bossHpScale.aliveScaling,true);assert.equal(DATA.config.bossHpScale.soloAssumed,false);
});
