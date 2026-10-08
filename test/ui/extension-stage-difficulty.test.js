import {test} from 'node:test';import assert from 'node:assert/strict';
import {stageDifficultyLabels} from '../../public/js/ui/customExtensions.js';
test('map difficulty badges deduplicate solo/co-op modes and omit unavailable difficulties',()=>{
 assert.deepEqual(stageDifficultyLabels({modes:['mode_single_normal','mode_multi_normal','mode_single_abyss']}),['험지','초월']);
 assert.deepEqual(stageDifficultyLabels({modes:['mode_training_1']}),['훈련']);
 assert.deepEqual(stageDifficultyLabels(null),[]);
});
