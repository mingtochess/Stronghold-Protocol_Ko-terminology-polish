// Tile-target commands (규정 MAP_TILE) hit-test the render view through the guarded field view: tileAtClientPoint must
// be forwarded (ui/commandPanel.js targetAt), else no tile can ever be picked.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('the guarded field view forwards tileAtClientPoint', () => {
  const source = readFileSync(new URL('../../public/js/ui/fieldHost.js', import.meta.url), 'utf8')
    .replace(/^import .*;$/gm, '').replace(/^export /gm, '');
  const raw = { tileAtClientPoint: (x, y) => ({ row: 10, col: x + y }) };
  const ctx = { raw, console, out: null };
  vm.runInNewContext(source + `\nout = guardView(raw, 'engine').tileAtClientPoint(2, 3);`, ctx);
  assert.deepEqual({ ...ctx.out }, { row: 10, col: 5 });
});
