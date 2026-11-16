// 규정 선발: the 自选 candidates carry their operator's skin list, as a 맹약 recruit record does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { diyCandidates } from '../../public/js/ui/diyRecruit.js';

const dir = 'data/versions/act3autochess-v3_1';
const data = { chess: JSON.parse(readFileSync(`${dir}/chess.json`, 'utf8')), backups: JSON.parse(readFileSync(`${dir}/backups.json`, 'utf8')) };

test('regulation 선발 candidates list skins', () => {
  const { records } = diyCandidates(data, null, {});
  const withSkins = [...records.values()].filter((r) => r.skins?.length);
  assert.ok(withSkins.length > 0, 'some candidates have skins');
  for (const r of withSkins) assert.ok(r.skins.every((s) => typeof s.id === 'string' && s.id), r.chessId);
});
