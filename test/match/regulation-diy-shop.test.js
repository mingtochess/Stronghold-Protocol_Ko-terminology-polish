// 규정 선발: the shop only ever offers the 선발 slots confirmed at 선택자편 (g.diyBring), never the other candidates.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getVersionData } from '../../server/data.js';
import { diySlot, diySlotIds } from '../../shared/diy.js';
import { makeMatch } from './harness.js';

const act3 = getVersionData('act3autochess@V3_1');

function protoPicks(data, n) {
  const slots = diySlotIds(data), picks = {}, chars = [];
  for (const tier of [5, 6]) {
    const ids = slots.filter((id) => diySlot(id, data)?.tier === tier);
    const pool = data.backups.diy.prototypes[tier] || data.backups.diy.prototypes[String(tier)];
    for (let i = 0; i < n; i++) { picks[ids[i]] = { charId: pool[i] }; chars.push(pool[i]); }
  }
  return { picks, chars };
}

test('regulation: unconfirmed 선발 candidates never reach the shop', (t) => {
  const { picks, chars } = protoPicks(act3, 6);
  const h = makeMatch({ data: act3, mode: 'coop', difficulty: 'FUNNY', seed: 3, kitted: chars,
    seats: [{ playerId: 'p', seat: 0, name: 'P', isBot: false, connected: true, diy: picks }] });
  t.after(() => h.m.dispose());
  const m = h.m;
  h.start();
  const ps = h.ps('p');
  for (let i = 0; i < 200 && m.phase !== 'CUSTOM_CHECK'; i++) {
    if (m.phase === 'INFO_CHECK' && !ps.infoReady) m.handle('p', { t: 'g.infoReady' });
    if (m.phase === 'BAND_DRAFT' && m.draftTurn() === 'p' && m.draft.picks.p == null) m.handle('p', { t: 'g.band', bandId: m.gd.bandIds().find((b) => !m.bandTaken(b, 'p')) });
    if (m.phase !== 'CUSTOM_CHECK') h.sched.runNext();
  }
  assert.equal(m.phase, 'CUSTOM_CHECK');
  const slots = Object.keys(ps.diy);
  const bring = [5, 6].flatMap((tier) => slots.filter((id) => diySlot(id, act3)?.tier === tier).slice(-2));
  assert.equal(m.handle('p', { t: 'g.diyBring', slots: bring }).ok, true);
  const bringSet = new Set(bring.flatMap((id) => [id, diySlot(id, act3)?.goldenId]));
  const stray = new Set(), seen = new Set();
  const look = () => { for (const s of ps.shop.slots) { const id = s?.id ?? s?.chessId ?? s; if (typeof id === 'string' && /diy/.test(id)) (bringSet.has(id) ? seen : stray).add(id); } };
  h.handleAll?.();
  for (let i = 0; i < 400 && m.round < 8; i++) {
    if (m.phase === 'PREP') { ps.funds = 999; ps.shop.level = 6; for (let k = 0; k < 20; k++) { const r = m.handle('p', { t: 'g.refresh' }); look(); } }
    h.sched.runNext();
  }
  assert.ok(seen.size > 0, 'the confirmed 선발 slots are offered');
  assert.deepEqual([...stray], [], 'stray 선발 offers');
});
