import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {DATA,makeMatch} from './harness.js';import {GameData} from '../../server/match/gamedata.js';import {hiddenEligible} from '../../server/match/finalAssault.js';
const official=JSON.parse(readFileSync(new URL('../../.cache/gamedata/excel/activity_table.json',import.meta.url)));
const source=official.activity.AUTOCHESS_SEASON.act2autochess;
for(const type of ['single','multi'])test(`ABYSS ${type}: official round/draft/boss configuration reaches the actual match`,()=>{
 const id=`mode_${type}_abyss`,gd=new GameData(DATA,id),mode=DATA.config.modes[id];
 assert.equal(gd.difficulty,'ABYSS');assert.equal(gd.isSolo,type==='single');
 assert.equal(mode.lastRound,14);assert.equal(mode.bossRound,14);assert.equal(mode.hiddenRound,15);
 assert.deepEqual(mode.activeBondIds,source.modeDataDict[id].activeBondIdList);
 assert.deepEqual(mode.inactiveEnemyKeys,source.modeDataDict[id].inactiveEnemyKey);
 const rounds=source.battleDataDict[id];
 assert.deepEqual(gd.spRounds(),Object.keys(rounds).filter(r=>rounds[r].some(x=>x.isSpPrepare)).map(Number));
 assert.deepEqual(gd.spRounds(),[3,9,11]);
 for(const [r,rows] of Object.entries(rounds)){
  const built=mode.rounds[r];assert.equal(built.isBoss,Number(r)>=14);assert.equal(built.isHidden,Number(r)===15);
  const turn=official.autoChessData.turnInfoDataDict[id][r];
  assert.equal(built.prepTimeData,turn.normalPhaseTime);
  assert.equal(built.prepTime,type==='single'?null:turn.normalPhaseTime);
  if(Number(r)>=14){for(const row of rows)assert.equal(built.bossTemplates[row.bossId],row.levelId.split('level_')[1].toLowerCase());}
  else assert.equal(built.template,rows[0].levelId.split('level_')[1].toLowerCase());
 }
 const h=makeMatch({mode:type==='single'?'solo':'coop',difficulty:'ABYSS',fake:true});
 assert.equal(h.m.gd.modeId,id);assert.equal(h.m.publicView().difficulty,'ABYSS');
 const limit=type==='single'?350:1200;
 assert.equal(hiddenEligible(gd,{layerSum:limit,teamLp:22}),false);
 assert.equal(hiddenEligible(gd,{layerSum:limit+1,teamLp:2}),true);
 assert.equal(hiddenEligible(gd,{layerSum:limit+1,teamLp:1}),false);
 assert.equal(DATA.choices.schedule[id].rounds['3'].cards,type==='single'?3:6);
 assert.equal(DATA.config.timers.spFirst,30);assert.equal(DATA.config.timers.spTurn,16);
 h.m.dispose();
});
