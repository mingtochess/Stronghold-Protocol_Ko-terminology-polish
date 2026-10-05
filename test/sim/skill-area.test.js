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


test('expanded attack ranges show only while the skill is active, including kit-generated grids',()=>{
 const u=unit('skchr_silverash_3');u.rangeKeys=[1,2,3];u.baseRangeKeys=[1,2];
 assert.equal(showsSkillArea(u),false);
 u.skill.active=true;assert.equal(showsSkillArea(u),true);
 u.rangeKeys=[1,2];assert.equal(showsSkillArea(u),false);
 u.skill.spec.areaEffect=false;u.rangeKeys=[1,2,3];assert.equal(showsSkillArea(u),true);
 u.side='enemy';assert.equal(showsSkillArea(u),false);
});


test('Texas S2 independent field remains through its delayed release and clears on completion or retreat',async()=>{
 const {makeBattle}=await import('../helpers/battleHarness.js');
 const h=makeBattle({autoFinish:false,units:[{chessId:'chess_char_1_08_a',row:10,col:3}]});h.run(1);
 const u=h.unit('chess_char_1_08_a');assert.ok(u.skill.activate('manual',{free:true}));
 const field=()=>h.b.snapshot().skillRanges.find(e=>e[0]===u.id);
 assert.equal(field()[1].length,13,'uses Sword Rain grid, not the two attack tiles');
 h.run(1.9);assert.ok(field(),'wind-up range remains');h.run(.3);assert.equal(field(),undefined,'release finishes');
 assert.ok(u.skill.activate('manual',{free:true}));h.b.kill(u,null);assert.equal(field(),undefined,'death clears field');
});

test('Degenbrecher S3 shows its real field during the full slash sequence',async()=>{
 const {makeBattle}=await import('../helpers/battleHarness.js');
 const h=makeBattle({autoFinish:false,units:[{chessId:'chess_char_6_19_a',row:10,col:4}]});h.run(1);
 const u=h.unit('chess_char_6_19_a');assert.ok(u.skill.activate('manual',{free:true}));
 const field=()=>h.b.snapshot().skillRanges.find(e=>e[0]===u.id);
 assert.equal(field()[1].length,13);h.run(2.8);assert.ok(field());h.run(.3);assert.equal(field(),undefined);
});
