// tools/add-regulation-diy-skins.mjs — 규정 선발 (自选) operators' skin lists: backups.json `units[charId].skins`.
// The season's chess.json only carries skins for its own chess records; the 自选 pool (backups units) had none, so the
// 선발 detail listed no skin. Copies each unit's list from the season's chess records, else the 맹약 production chess
// (the same skin ids: the shared asset catalogue draws them). Idempotent.
//   node tools/add-regulation-diy-skins.mjs [versionDir]
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] || 'data/versions/act3autochess-v3_1';
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const backups = read(join(dir, 'backups.json'));
const sources = [read(join(dir, 'chess.json')), read('content/production/data/chess.json')];
const skinsOf = (charId) => {
  for (const chess of sources) for (const r of Object.values(chess)) if (r?.charId === charId && r.skins?.length) return r.skins;
  return null;
};
let n = 0;
for (const [charId, unit] of Object.entries(backups.units || {})) {
  const skins = skinsOf(charId);
  if (skins) { unit.skins = skins.map((s) => ({ ...s })); n++; } else delete unit.skins;
}
writeFileSync(join(dir, 'backups.json'), JSON.stringify(backups));
console.log(`skins on ${n} of ${Object.keys(backups.units || {}).length} units`);
