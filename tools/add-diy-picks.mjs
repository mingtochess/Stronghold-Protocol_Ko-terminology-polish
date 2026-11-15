// 규정 자선 편성(backups.json diy)에 공식 생성에서 콜라보로 빠지는 오퍼레이터를 더한다 (오블리비온스, 유키 마코토).
// tools/build-data.mjs 를 SP_DIY_INCLUDE=<charId,…> 로 돌린 출력(BUILT_DIR/backups.json)에서 그 오퍼레이터의 unit·summon
// token·diy.operators 항목만 가져와 data/versions/<slug>/backups.json 에 합치고 ownedPool 에 넣고 excluded 에서 뺀다.
// 나머지(다른 유닛, 슬롯)는 건드리지 않는다. 그다음 tools/attach-season-timing.mjs 로 공격 타이밍을 붙인다.
// Usage: SP_DIY_INCLUDE=a,b node tools/build-data.mjs --version act3autochess@V3_1 --out BUILT_DIR --force
//        node tools/add-diy-picks.mjs BUILT_DIR data/versions/act3autochess-v3_1 char_4182_oblvns char_4217_makoto
import { readFileSync, writeFileSync } from 'node:fs';
const [built, dir, ...ids] = process.argv.slice(2);
const N = JSON.parse(readFileSync(`${built}/backups.json`, 'utf8'));
const path = `${dir}/backups.json`, raw = readFileSync(path, 'utf8'), O = JSON.parse(raw);
for (const id of ids) {
  if (!N.units[id] || !N.diy.ownedPool.includes(id)) throw Error(`${id}: not an owned pick in ${built} (run build-data with SP_DIY_INCLUDE)`);
  O.units[id] = N.units[id];
  for (const [k, t] of Object.entries(N.tokens || {})) {
    const own = Object.keys(t.variants || {}).filter((v) => v.startsWith(id + '@'));
    if (!own.length) continue;
    O.tokens[k] ??= { ...t, variants: {} };
    for (const v of own) O.tokens[k].variants[v] = t.variants[v];
  }
  if (N.diy.operators?.[id]) (O.diy.operators ||= {})[id] = N.diy.operators[id];
  if (!O.diy.ownedPool.includes(id)) O.diy.ownedPool.push(id);
  O.diy.excluded = (O.diy.excluded || []).filter((x) => x !== id);
}
writeFileSync(path, JSON.stringify(O, null, raw.includes('\n  ') ? 2 : raw.includes('\n ') ? 1 : 0) + (raw.endsWith('\n') ? '\n' : ''));
console.log('added', ids, 'ownedPool', O.diy.ownedPool.length);
