import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleRestart, voteFrame, cancelVote } from '../server/restartVote.js';
import { validateC2S } from '../shared/protocol.js';

function fixture() {
  let now = 1000, disposed = 0;
  const sessions = ['a','b','c','d'].map(playerId => ({ playerId, connected: true }));
  const frames = [];
  const room = { matchCount: 1, match: { phase: 'PREP', players: new Map() }, matchCtx: {}, seats: sessions.map(x=>({...x,ready:true})),
    activeHumans() { return this.seats.filter(x=>!x.isBot&&!x.left); }, seatOf(id) { return this.seats.find(x=>x.playerId===id); } };
  const lobby = { now:()=>now, roomOf:()=>room, memberSessions:()=>sessions,
    sendToPlayer:(r,id,msg)=>frames.push({id,msg}), broadcastRoom:(r,msg)=>frames.push({msg}),
    disposeMatchCtx:()=>disposed++, broadcastState:()=>{}, startGrace:()=>{} };
  const request=(id='a')=>handleRestart(lobby,{playerId:id},{t:'room.requestRestart',matchNo:room.matchCount});
  const answer=(id,agree=true,voteId=1)=>handleRestart(lobby,{playerId:id},{t:'room.answerRestart',matchNo:room.matchCount,voteId,agree});
  return {room,lobby,frames,request,answer,tick:ms=>now+=ms,disposed:()=>disposed};
}
test('anonymous unanimous vote preserves room seats and returns everyone unready',()=>{
  const f=fixture();assert.equal(f.request().ok,true);
  const frame=voteFrame(f.room,'b',1000);
  assert.equal(frame.vote.answered,false);assert.equal(frame.vote.yes,1);
  assert.ok(!JSON.stringify(frame).includes('playerId'));assert.ok(!('ids' in frame.vote));
  assert.equal(f.answer('a').error,'ALREADY');
  f.answer('b');f.answer('c');assert.ok(f.room.match);
  f.answer('d');assert.equal(f.room.match,null);assert.equal(f.disposed(),1);
  assert.equal(f.room.seats.length,4);assert.ok(f.room.seats.every(s=>s.ready===false));
});
test('rejection, room cooldown, personal cooldown and quota are server enforced',()=>{
  const f=fixture();f.request();f.answer('b',false);assert.ok(f.room.match);
  assert.equal(f.request('b').error,'RATE');f.tick(120000);
  assert.equal(f.request().error,'RATE');assert.equal(f.request('b').ok,true);
  cancelVote(f.lobby,f.room);f.tick(180000);assert.equal(f.request().ok,true);
  cancelVote(f.lobby,f.room);f.tick(180000);assert.equal(f.request().error,'RATE');
});
test('stale votes, expired votes, spectators and briefing requests fail',()=>{
  const f=fixture();assert.equal(f.request('spectator').error,'SPECTATOR');
  f.room.match.phase='INFO_CHECK';assert.equal(f.request().error,'WRONG_PHASE');f.room.match.phase='COMBAT';
  f.request();assert.equal(f.answer('b',true,9).error,'BAD_TARGET');f.tick(30000);
  assert.equal(f.answer('b').error,'BAD_TARGET');cancelVote(f.lobby,f.room);
  assert.equal(validateC2S({t:'room.answerRestart',matchNo:1,voteId:1,agree:'yes'}),'bad field agree');
});

test('timeout closes the vote without disposing the match',t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  const f=fixture();f.request();f.tick(30000);t.mock.timers.tick(30000);
  assert.equal(voteFrame(f.room,'a',31000).vote,null);
  assert.ok(f.room.match);assert.equal(f.disposed(),0);
  assert.ok(f.frames.some(x=>x.msg.t==='room.restartOutcome'&&x.msg.outcome==='failed'));
});
