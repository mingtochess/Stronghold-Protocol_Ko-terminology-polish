// server/sim-upstream/fixedPost.js — a fixed boss (고정형 보스): a leader that holds its post — its route only waits where it
// starts (spawns.js `stationary`: 规程's 假想敌：茧 / 胄 / 管 / 械 …) or its data does not walk (moveSpeed ≤ 0.1, the HP bar
// rule of render/units.js). Nothing an operator does moves it (owner's rule, 2026-11-15 — a 克莱门莎 S2 carriage carried
// 假想敌：茧 across a co-op field): carry / teleport / conveyor / ride and the 诱导 / 恐惧 statuses refuse it; push and pull
// already leave every leader in place (battle/displacement.js _displaceable).

/** @param {any} e */
export function isFixedPost(e) {
  return !!(e && e.side === 'enemy' && e.isBoss && (e.stationary || !(Number(e.base?.moveSpeed) > 0.1)));
}
