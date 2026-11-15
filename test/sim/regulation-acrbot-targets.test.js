// “暴躁铁皮” 酋长之威 (PRTS 备注): each attack's max targets = the enemies it blocks now (at least 1).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { getVersionData } from '../../server/data.js';
import { DataSource } from '../../server/sim-upstream/simdata.js';
import { setGameData } from '../../server/sim-upstream/content/support/index.js';
import { makeBattle, enemyRec } from '../helpers/battleHarnessUpstream.js';

const raw = getVersionData('act3autochess@V3_1');
after(() => setGameData(null));

test('a blocking “暴躁铁皮” hits every enemy it blocks; one blocked → one target', () => {
  setGameData(raw);
  const data = new DataSource({ ...raw, enemies: { ...raw.enemies, test_enemy: enemyRec({ key: 'test_enemy', hp: 100000, speed: 0, atk: 0 }) } }, null);
  const h = makeBattle({ data, content: 'full', autoFinish: false, timeLimit: 30, stageId: 'act3autochess_m01',
    enemies: [0, 1, 2].map(() => ({ key: 'test_enemy', time: 0, pos: { row: 9, col: 3 } })),
    players: [{ playerId: 'p1', seat: 0, side: 'L', units: [{ uid: 1, kind: 'chess', chessId: 'chess_char_5_22_a', row: 9, col: 3, dir: 'RIGHT' }], bonds: {} }] });
  h.run(0.3);
  const u = h.unit(1);
  const foes = h.b.enemies.filter((e) => String(e.defId).endsWith('test_enemy'));
  for (const e of foes) { e.x = 3; e.y = 9; }
  h.run(0.5);
  const blocked = (u.blocking || []).filter((e) => e.alive).length;
  h.run(6);
  const hit = foes.filter((e) => e.hp < e.s.maxHp).length;
  assert.ok(blocked >= 2, `blocks ${blocked}`);
  assert.equal(hit, blocked, `hit ${hit} of ${blocked} blocked`);
});
