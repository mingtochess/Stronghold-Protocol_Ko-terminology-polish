// 규정 자선 편성에 더한 콜라보 오퍼레이터(tools/add-diy-picks.mjs)의 이름·스킬·재능 문구 한국어: 맹약 선발 기록
// (content/production/data/chess.json, 같은 charId)의 같은 스킬 ID·재능 순서 문구 중, 규정 문구의 수치(잠재 보너스 괄호 제외)가
// 모두 들어 있는 것을 고른다(潜能·등급마다 수치가 다르다). public/i18n/ko/regulation.json 에 없는 키만 더한다.
// Usage: node tools/add-diy-picks-ko.mjs char_4182_oblvns char_4217_makoto
//        node tools/add-diy-picks-ko.mjs --override --all   (every 자선 operator with a 맹약 record: the 맹약 wording replaces
//        the existing 규정 translation — names, skill / talent names and texts)
import { readFileSync, writeFileSync } from 'node:fs';
const argv = process.argv.slice(2);
const OVERRIDE = argv.includes('--override'), ALL = argv.includes('--all');
let ids = argv.filter((a) => !a.startsWith('--'));
const C = JSON.parse(readFileSync('content/production/data/chess.json', 'utf8'));
const B = JSON.parse(readFileSync('data/versions/act3autochess-v3_1/backups.json', 'utf8'));
const path = 'public/i18n/ko/regulation.json', R = JSON.parse(readFileSync(path, 'utf8'));
const strip = (s) => String(s || '').replace(/<[@$][^>]*>|<\/>/g, '');
const nums = (s) => strip(s).match(/\d+(?:\.\d+)?/g) || [];
// every number of the 규정 text (without its potential bonus 「（+5%）」) is in the 맹약 text, word order aside
const covers = (ko, cn) => { const k = nums(ko); for (const n of nums(String(cn).replace(/[（(][+＋][^）)]*[）)]/g, ''))) { const i = k.indexOf(n); if (i < 0) return false; k.splice(i, 1); } return true; };
if (ALL) { const have = new Set(Object.values(C).map((c) => c.charId)); ids = [...new Set([...B.diy.ownedPool, ...Object.values(B.diy.prototypes || {}).flat()])].filter((id) => have.has(id) && B.units[id]); }
let changed = 0;
const add = (k, v) => { if (!k || !v) return; if (k in R && (!OVERRIDE || R[k] === v)) return; R[k] = v; changed++; };
let missing = [];
for (const id of ids) {
  const recs = Object.values(C).filter((c) => c.charId === id);
  if (!recs.length) throw Error(`${id}: no 맹약 record`);
  add(B.units[id].name, recs[0].name);
  for (const f of Object.values(B.units[id].forms)) {
    const pairs = [...f.skills.map((s) => [s, recs.flatMap((r) => (r.skills || []).filter((x) => x.skillId === s.skillId))]),
      ...(f.talents || []).map((t, i) => [t, recs.flatMap((r) => (r.talents || []).filter((x, j) => (x.talentIndex ?? j) === i))])];
    for (const [s, cands] of pairs) {
      add(s.name, cands[0]?.name);
      const m = cands.find((x) => covers(x.desc, s.desc)) || (cands.length === 1 ? cands[0] : null);
      if (!m) { missing.push(`${id} ${s.skillId || s.name}`); continue; }
      add(s.desc, m.desc); add(s.descRaw, m.descRaw || m.desc);
    }
  }
}
writeFileSync(path, JSON.stringify(R, null, 1) + '\n');
console.log('operators', ids.length, 'changed', changed, 'missing', missing.length, missing.slice(0, 20));
