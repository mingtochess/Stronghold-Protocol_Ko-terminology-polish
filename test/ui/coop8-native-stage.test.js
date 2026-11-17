// 8인 연합방어 (coop8_unite_*): a 규정 stage keeps its official model through the regulation alias
import { test } from 'node:test';
import assert from 'node:assert/strict';
const { nativeStageId } = await import('../../public/js/render/board3d/scene.js');

test('a regulation 8-player unite stage resolves to the official map it is drawn as', () => {
  assert.equal(nativeStageId({ id: 'coop8_unite_act3autochess_m01', originalStageId: 'act3autochess_m01', coopEightStage: true }), 'act1autochess_m01');
  assert.equal(nativeStageId({ id: 'coop8_unite_act2autochess_m02', originalStageId: 'act2autochess_m02', coopEightStage: true }), 'act2autochess_m02');
  assert.equal(nativeStageId({ id: 'act3autochess_m06' }), 'act2autochess_m02');
});
