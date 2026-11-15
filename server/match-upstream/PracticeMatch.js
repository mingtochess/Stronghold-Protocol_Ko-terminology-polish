// Browser-local practice on the 규정(规程) match (the 맹약 one: server/match/PracticeMatch.js), starting at a chosen round.
import {Match} from './Match.js';
import {GameData} from './gamedata.js';
import {SharedPool,bannedChessForBonds} from './pool.js';
import {regulationMode} from './LaboratoryMatch.js';
import {makeTypeSchedule,pickRoundEntry} from './waves.js';
import {PHASE} from '../../shared/constants.js';
import {RANDOM_BAND_ID} from '../../shared/randomBand.js';
export const PRACTICE_FUNDS=1_000_000_000;
export class PracticeMatch extends Match {
 constructor(opts){
  super({...opts,mode:'solo',modeId:opts.modeId||regulationMode(opts.data?.config,'SINGLE',opts.difficulty||'NORMAL'),clientCombat:true,verify:'off'});
  const s=opts.practice||{};
  const players=s.players??1;if(!Number.isInteger(players)||players<1||players>4)throw new TypeError('인원 기준이 올바르지 않습니다.');
  if(players>1){const ref=new GameData(this.data,regulationMode(this.data.config,'MULTI',this.gd.mode?.difficulty));this.gd.mode={...ref.mode};this.gd.enemyScale=r=>ref.enemyScale(r);this.gd.bossPoolShare=()=>ref.bossPoolShare(players);}

  if(!this.gd.stage(s.stageId)||!this.gd.bandAllowed(s.bandId)||!Number.isInteger(s.round)||s.round<1||s.round>(this.gd.hiddenRound||this.gd.lastRound))throw new TypeError('연습실 시작 설정이 올바르지 않습니다.');
  const factions=[...new Set(s.factions||[])];
  if(factions.some(k=>!this.gd.factions.types?.[k]?.involveRandom)||factions.length>3)throw new TypeError('적 특훈을 최대 3개 선택해주세요.');
  const bans=[...new Set(s.bannedBonds||[])];if(bans.some(k=>!this.gd.bond(k)))throw new TypeError('맹약 밴 설정이 올바르지 않습니다.');
  this.practice={...s,factions,bannedBonds:bans,players};
  this.stageId=s.stageId;this.stage=this.gd.stage(s.stageId);
  if(s.bossId&&this.gd.boss(s.bossId)&&!this.gd.boss(s.bossId).hidden)this.bossId=s.bossId;
  if(s.hiddenBossId&&this.gd.boss(s.hiddenBossId)?.hidden)this.hiddenBossId=s.hiddenBossId;
  // exactly the chosen bans (no random draw, no 단독 core-group pick)
  const staticOff=[...this.gd.modeInactiveBonds].filter(b=>this.gd.bond(b)).sort();
  this.disabledBonds=[...bans].sort();this.staticInactiveBonds=staticOff;this.bondChoice=null;this.bannedChess=bannedChessForBonds(this.gd,this.disabledBonds,staticOff);this.pool=new SharedPool(this.gd,{banned:this.bannedChess});
  this.factions=factions;const typeSlots=makeTypeSchedule(this.gd,this.rngSetup,factions),picks=[null];
  for(let r=1;r<=typeSlots.length;r++)picks.push(pickRoundEntry(this.gd,this.rngSetup,typeSlots[r-1],r));
  Object.defineProperty(this.factions,'schedule',{value:{typeSlots,picks}});
  for(const ps of this.order){
   ps.bandId=s.bandId===RANDOM_BAND_ID?this.rngDraft.pick(this.gd.bandIds().filter(k=>k!==RANDOM_BAND_ID)):s.bandId;
   ps.randomBandBonus=s.bandId===RANDOM_BAND_ID?5:0;ps.lp=this.gd.startLp(ps.bandId)+ps.randomBandBonus;
   ps.funds=PRACTICE_FUNDS;const spend=ps.spend;ps.spend=function(n){this.funds=Math.max(this.funds,PRACTICE_FUNDS,Number(n)||0);const ok=spend.call(this,n);this.funds=Math.max(this.funds,PRACTICE_FUNDS);return ok;};
  }
 }
 start(){if(this.disposed||this.ended||this.phase!==PHASE.LOBBY)return;this.guard(()=>{
  if(this.practice.round>1){this.round=1;for(const ps of this.order){ps.startRound(1);this.dispatch(ps,'onRoundStart',{round:1});this.dispatch(ps,'onPrepStart',{round:1});ps.recompute();}}
  this.hiddenReached=this.practice.round===this.gd.hiddenRound;this.startRound(this.practice.round);this.flush(true);
 });}
 enterPrep(){for(const ps of this.order)ps.funds=Math.max(ps.funds,PRACTICE_FUNDS);return super.enterPrep();}
 publicView(){return {...super.publicView(),practice:this.practice};}
}
