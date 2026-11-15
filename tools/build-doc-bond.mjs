// 결집 (docShip, 규정 부가 맹약 聚合) as a 맹약 커스텀 '맹약 추가' option: the 규정 bond record (its thresholds 2 / 3, bb,
// effect text) copied into content/production/data/bonds.json with Korean text, marked `customExtension` and with its
// members — the operators it is added to when the room enables it (shared/customExtensions.js DOC_CHARS); a match
// without it removes the bond (applyCustomExtensions). Effect: server/sim/content/doc.js. Idempotent.
// Usage: node tools/build-doc-bond.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { DOC_CHARS } from '../shared/customExtensions.js';
const D = {};
for (const n of readdirSync('public/i18n/ko')) if (n.endsWith('.json') && n !== 'compiled.json') Object.assign(D, JSON.parse(readFileSync(`public/i18n/ko/${n}`, 'utf8')));
const reg = JSON.parse(readFileSync('data/versions/act3autochess-v3_1/bonds.json', 'utf8')).docShip;
const path = 'content/production/data/bonds.json', raw = readFileSync(path, 'utf8'), bonds = JSON.parse(raw);
const chess = JSON.parse(readFileSync('content/production/data/chess.json', 'utf8'));
const members = Object.values(chess).filter((c) => DOC_CHARS.includes(c.charId) && !c.isGolden).map((c) => c.chessId).sort();
const ko = (s) => (s == null ? s : D[s] ?? s);
bonds.docShip = { ...reg, name: '결집', effectName: '결집', desc: ko(reg.desc), descRaw: ko(reg.descRaw), effectDesc: ko(reg.effectDesc), effectDescRaw: ko(reg.effectDescRaw),
  // weight 0 at rest: a match that does not enable it never draws it; withDocBond restores the 규정 weight
  customExtension: true, weight: 0, enabledWeight: reg.weight, members, visibleMembers: members };
for (const k of ['desc', 'descRaw', 'effectDesc', 'effectDescRaw']) if (/[一-鿿]/.test(bonds.docShip[k] || '')) console.warn('untranslated', k);
writeFileSync(path, JSON.stringify(bonds) + (raw.endsWith('\n') ? '\n' : ''));
console.log('docShip members', members.length);
