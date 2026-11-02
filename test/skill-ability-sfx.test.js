// The official skill-level ability banks reach the manifest (tools/import-skill-ability-sfx.mjs): 重岳's skills strike and
// hit with their own sounds while they run.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const assets = JSON.parse(readFileSync(new URL('../content/production/data/assets.json', import.meta.url), 'utf8'));
const files = new Set(JSON.parse(readFileSync(new URL('../content/production/resources.json', import.meta.url), 'utf8')).files.map((f) => f.path));

test("重岳's skills carry their official strike / impact sounds, each a catalogued file", () => {
  const sc = assets.audio.sfx.units.char_2024_chyue.skillCombat;
  assert.match(sc[0].hit, /p_imp_cypunch_d\.mp3$/);
  assert.match(sc[1].attack, /p_atk_cypunch_h\.mp3$/);
  assert.match(sc[2].attack, /p_atk_cypunch_s1\.mp3$/);
  for (const u of Object.values(assets.audio.sfx.units)) for (const c of Object.values(u.skillCombat || {})) for (const r of ['attack', 'hit']) if (c[r]) assert.ok(files.has(c[r]), c[r]);
});

test('银灰 S1: its strike lands with the official ON_ABILITY_HIT.skchr_svrash_1 sound (p_atk_hawk_h), not the plain sword hit', async () => {
  const { readFileSync } = await import('node:fs');
  const a = JSON.parse(readFileSync(new URL('../content/production/data/assets.json', import.meta.url), 'utf8'));
  const u = a.audio.sfx.units.char_172_svrash;
  assert.match(u.skillCombat?.[0]?.hit || '', /p_atk_hawk_h\.mp3$/);
  const r = JSON.parse(readFileSync(new URL('../content/production/resources.json', import.meta.url), 'utf8'));
  assert.ok(r.files.some((f) => f.path === u.skillCombat[0].hit && f.sources?.length), 'listed for download');
});
