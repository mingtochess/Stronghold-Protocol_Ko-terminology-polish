// 로비에서(방 없이 기본 시즌 데이터로) 받은 오퍼레이터 설정·선발 편성이 규정 방 경기에 반영된다:
// seatSettings가 원본(raw)을 방 시즌 데이터로 다시 거른다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Lobby } from '../server/lobby.js';
import { getVersionData } from '../server/data.js';
import { diyPool, diySlotIds, diySlot, checkDiyPick } from '../shared/diy.js';
import { KITTED_CHARS as A } from '../server/sim/content/kits/index.js';
import { KITTED_CHARS as B } from '../server/sim-upstream/content/kits/index.js';

const V = 'act3autochess@V3_1';
const data = getVersionData(V);
const kitted = [...new Set([...A, ...B])];
const self = { csOf: () => null, kittedFor: () => kitted, vanilla: null };

function picks12() {
  const pack = { chess: data.chess, backups: data.backups }, used = new Set(), out = {};
  for (const t of [5, 6]) {
    const pool = diyPool(t, { data: pack, kitted });
    let i = 0;
    for (const s of diySlotIds(pack).filter((x) => diySlot(x, pack).tier === t)) {
      while (i < pool.length && !out[s]) {
        const c = pool[i++];
        if (used.has(c)) continue;
        for (const k of [0, 1, 2]) { const r = checkDiyPick(s, { charId: c, skillIndex: k }, pack); if ('ok' in r) { out[s] = r.pick; used.add(c); break; } }
      }
    }
  }
  return out;
}

test('a 규정 room re-checks the raw 선발 picks sent outside any room: all 6 per tier reach the match', () => {
  const raw = picks12();
  assert.equal(Object.keys(raw).length, 12);
  const seat = { diy: null, diyRaw: Object.freeze(raw), diyVer: null, loadout: null, ops: null };
  const got = Lobby.prototype.seatSettings.call(self, { version: V }, seat, data);
  assert.equal(Object.keys(got.diy || {}).length, 12);
});

test('a 규정 room re-checks the raw loadout: a 규정 operator setting the default data refused is applied', () => {
  const id = Object.keys(data.chess).find((k) => { const c = data.chess[k]; return /_a$/.test(k) && !c.isGolden && c.visible !== false && !c.isHidden && !c.isDiy && (!c.baseId || c.baseId === k) && (c.skills || []).length > 1; });
  const seat = { loadout: null, ops: null, loadoutRaw: Object.freeze({ entries: { [id]: { skill: 0 } }, ops: {} }), loadoutVer: null };
  const got = Lobby.prototype.seatSettings.call(self, { version: V }, seat, data);
  assert.equal(got.loadout?.[id]?.skill, 0);
});

test('settings checked for this season are used as they are', () => {
  const seat = { diy: Object.freeze({}), diyRaw: Object.freeze(picks12()), diyVer: V };
  const got = Lobby.prototype.seatSettings.call(self, { version: V }, seat, data);
  assert.deepEqual(got.diy, {});
});
