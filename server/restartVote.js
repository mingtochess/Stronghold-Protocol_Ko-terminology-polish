import { ERR } from '../shared/constants.js';

export const VOTE_MS = 30_000;
export const ROOM_COOLDOWN_MS = 120_000;
export const PLAYER_COOLDOWN_MS = 180_000;
const states = new WeakMap();
const ok = { ok: true };
const fail = (error, detail) => ({ error, detail });
function state(room) {
  if (!states.has(room)) states.set(room, { vote: null, serial: 0, roomUntil: 0, players: new Map(), counts: new Map(), matchNo: room.matchCount });
  const s = states.get(room);
  if (s.matchNo !== room.matchCount) { s.matchNo = room.matchCount; s.counts.clear(); }
  return s;
}
export function voteFrame(room, playerId, now) {
  const s = state(room), v = s.vote;
  return { t: 'room.restartVote', matchNo: room.matchCount,
    vote: v ? { id: v.id, deadline: v.deadline, total: v.ids.length,
      yes: [...v.answers.values()].filter(Boolean).length, no: [...v.answers.values()].filter(x => !x).length,
      eligible: v.ids.includes(playerId), answered: v.answers.has(playerId) } : null,
    nextRequestAt: Math.max(s.roomUntil, s.players.get(playerId) || 0), remaining: Math.max(0, 2 - (s.counts.get(playerId) || 0)), serverNow: now };
}
export function sendVotes(lobby, room) {
  for (const session of lobby.memberSessions(room)) lobby.sendToPlayer(room, session.playerId, voteFrame(room, session.playerId, lobby.now()));
}
export function cancelVote(lobby, room, outcome = 'cancelled') {
  const s = state(room);
  if (!s.vote) return;
  clearTimeout(s.vote.timer);
  s.vote = null;
  s.roomUntil = lobby.now() + ROOM_COOLDOWN_MS;
  lobby.broadcastRoom(room, { t: 'room.restartOutcome', outcome });
  sendVotes(lobby, room);
}
export function handleRestart(lobby, session, msg) {
  const room = lobby.roomOf(session);
  if (!room) return fail(ERR.NOT_IN_ROOM);
  const seat = room.seatOf(session.playerId);
  if (!seat || seat.isBot || seat.left) return fail(ERR.SPECTATOR);
  if (!room.match || ['LOBBY', 'INFO_CHECK', 'ENDED'].includes(room.match.phase)) return fail(ERR.WRONG_PHASE);
  if (msg.matchNo !== room.matchCount) return fail(ERR.BAD_TARGET, 'stale match');
  const s = state(room), now = lobby.now();
  if (msg.t === 'room.requestRestart') {
    if (s.vote || now < Math.max(s.roomUntil, s.players.get(session.playerId) || 0) || (s.counts.get(session.playerId) || 0) >= 2)
      return fail(ERR.RATE, '리방 요청 제한 중입니다. 잠시 후 다시 요청하세요.');
    const ids = room.activeHumans().map(x => x.playerId).filter(id => !room.match.players?.get(id)?.left);
    if (!ids.includes(session.playerId)) return fail(ERR.BAD_TARGET);
    s.players.set(session.playerId, now + PLAYER_COOLDOWN_MS);
    s.counts.set(session.playerId, (s.counts.get(session.playerId) || 0) + 1);
    const v = { id: ++s.serial, deadline: now + VOTE_MS, ids, answers: new Map([[session.playerId, true]]) };
    s.vote = v;
    v.timer = setTimeout(() => cancelVote(lobby, room, 'failed'), VOTE_MS);
    v.timer.unref?.();
  } else {
    const v = s.vote;
    if (!v || msg.voteId !== v.id || now >= v.deadline || !v.ids.includes(session.playerId)) return fail(ERR.BAD_TARGET);
    if (v.answers.has(session.playerId)) return fail(ERR.ALREADY);
    v.answers.set(session.playerId, msg.agree);
    if (!msg.agree) { cancelVote(lobby, room, 'failed'); return ok; }
  }
  const v = s.vote;
  sendVotes(lobby, room);
  if (v.ids.every(id => v.answers.get(id) === true)) {
    cancelVote(lobby, room, 'passed');
    const ctx = room.matchCtx;
    // Invalidate callbacks before disposing combat; preserve room seats, settings and chat.
    if (ctx) lobby.disposeMatchCtx(ctx);
    room.match = null; room.matchCtx = null; room.matchKey = null; room.replay = null; room.lastSummary = null; room.restartMatchNo = room.matchCount;
    for (let i = 0; i < room.seats.length; i++) {
      const member = room.seats[i];
      if (!member) continue;
      if (member.left) { room.seats[i] = null; continue; }
      if (!member.isBot) { member.ready = false; if (!member.connected) lobby.startGrace(room, member); }
    }
    lobby.broadcastRoom(room, { t: 'room.restartLobby', matchNo: room.matchCount });
    lobby.broadcastState(room);
  }
  return ok;
}
