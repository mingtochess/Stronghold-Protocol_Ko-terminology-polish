import {test} from 'node:test';
import assert from 'node:assert/strict';
import {showsSkillArea} from '../../server/sim/skillArea.js';
const unit=id=>({side:'ally',def:{skill:{skillId:id}},skill:{spec:{}}});
test('area effects show fields; ordinary stat and attack range buffs do not',()=>{
 for(const id of ['skchr_lisa_3','skchr_mostma_2','skchr_mostma_3','skchr_slbell_2','skchr_rosesa_2','skchr_skadi2_3'])assert.equal(showsSkillArea(unit(id)),true,id);
 for(const id of ['skchr_lisa_1','skchr_lisa_2','skchr_mostma_1','skchr_silverash_3','skchr_helage_3','skcom_atk_up[3]'])assert.equal(showsSkillArea(unit(id)),false,id);
 const future=unit('new_skill');future.skill.spec.areaEffect=true;assert.equal(showsSkillArea(future),true);
 future.side='enemy';assert.equal(showsSkillArea(future),false);
});

test('field metadata and live snapshots exclude stat buffs but carry active area effects',async()=>{
 const {makeBattle,chessRec}=await import('../helpers/battleHarness.js');
 const {unitInfo}=await import('../../server/sim/snapshot.js');
 for(const [skillId,show] of [['skchr_lisa_3',true],['skchr_mostma_3',true],['skchr_lisa_1',false]]){
  const rec=chessRec({id:'area',skill:{skillId,rangeGrid:[[0,0],[0,1]]}});
  const h=makeBattle({content:'generic',autoFinish:false,defs:{chess:{area:rec}},units:[{chessId:'area',row:10,col:3}]});h.step();const u=h.unit('area');u.skill.active=true;
  assert.equal(!!unitInfo(u).skillZoneGrid,show,skillId);
  assert.equal(h.b.snapshot().skillRanges.some(e=>e[0]===u.id),show,skillId);
 }
});
