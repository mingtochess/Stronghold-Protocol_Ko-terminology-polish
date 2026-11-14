// 맹약 커스텀 '맹약 추가 → 결집' (shared/customExtensions.js withDocBond, tools/build-doc-bond.mjs, server/sim/content/doc.js).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { loadData } from '../../server/data.js';
import { applyCustomExtensions, customExtensionCatalog, DOC_CHARS } from '../../shared/customExtensions.js';
import { DataSource } from '../../server/sim/simdata.js';
import { setGameData } from '../../server/sim/content/support/index.js';
import { makeBattle } from '../helpers/battleHarness.js';

const raw = loadData(new URL('../../content/production/data', import.meta.url).pathname, { log: { warn() {}, log() {}, error() {} } });
after(() => setGameData(null));
const sel = (bonds) => ({ bonds, stages: [] });

test('offered as 맹약 추가; on: the eight operators carry 결집; off: no bond at all', () => {
  assert.ok(customExtensionCatalog(raw).bonds.some((b) => b.id === 'doc'));
  const on = applyCustomExtensions(raw, sel(['doc']));
  for (const cid of DOC_CHARS) assert.ok(Object.values(on.chess).filter((c) => c.charId === cid).every((c) => c.bonds.includes('docShip')), cid);
  assert.ok(on.bonds.docShip.weight > 0);
  const off = applyCustomExtensions(raw, sel([]));
  assert.equal(off.bonds.docShip, undefined);
  assert.ok(!Object.values(off.chess).some((c) => (c.bonds || []).includes('docShip')));
});

function healed(on) {
  const data = applyCustomExtensions(raw, sel(['doc']));
  setGameData(data);
  const ds = new DataSource(data, null);
  const skadi = Object.values(data.chess).find((c) => c.charId === 'char_1012_skadi2' && !c.isGolden).chessId;
  const ally = Object.values(data.chess).find((c) => c.tier === 1 && !c.isGolden && c.profession === 'WARRIOR' && !(c.bonds || []).includes('docShip')).chessId;
  const h = makeBattle({ data: ds, content: 'full', autoFinish: false, timeLimit: 10,
    players: [{ playerId: 'p1', seat: 0, side: 'L', units: [{ uid: 1, chessId: skadi, row: 10, col: 5, dir: 'RIGHT' }, { uid: 2, chessId: ally, row: 10, col: 6, dir: 'RIGHT' }],
      bonds: on ? { docShip: { count: 2, active: true, tier: 1, layers: 10 } } : {} }] });
  h.step();
  const u = h.unit(2); u.hp = u.s.maxHp * 0.3; const before = u.hp;
  h.run(3.2);
  return { amount: h.unit(2).hp - before, atk: h.unit(1).s.atk };
}
test('in battle: 결집 heals an injured ally in the member\'s range by (heal_base + per stack × L) × ATK each second', () => {
  const on = healed(true), off = healed(false), bb = raw.bonds.docShip.bb;
  const expected = 3 * (bb.heal_base + bb.heal_per_stack * 10) * on.atk;
  assert.ok(Math.abs(on.amount - off.amount - expected) <= expected * 0.05, `extra ${on.amount - off.amount} vs ${expected}`);
});
