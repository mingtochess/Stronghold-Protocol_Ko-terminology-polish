import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DATA,makeMatch} from './harness.js';
import {PHASE} from '../../shared/constants.js';

test('recruit picks (not candidates) set personal eligibility before the first shop opens',()=>{
 const data=structuredClone(DATA);
 const base=Object.values(data.chess).find(c=>c.visible&&!c.isGolden&&c.tier===5&&!c.isDiy&&!c.isHidden&&c.bonds?.some(id=>!['emptyShip'].includes(id)));
 base.bonds=['emptyShip'];
 base.optionalRecruit=true;
 if(data.chess[base.goldenId])data.chess[base.goldenId].optionalRecruit=true;
 const h=makeMatch({data,mode:'solo',humans:1,bots:0,seed:41}).start();
 try{
  h.m.phase=PHASE.BAND_DRAFT;
  const ps=h.ps('p_0');
  assert.equal(ps.canRecruit(base.chessId),false);
  // a candidate alone is not a recruit: only a 선발 선택 pick is (shared/recruitPick.js)
  assert.equal(h.m.setLoadout('p_0',{[base.chessId]:{selected:true}}).ok,true);
  assert.equal(ps.canRecruit(base.chessId),false);
  h.m.phase=PHASE.RECRUIT_PICK;
  // as 규정 선택자편: an unconfirmed list changes nothing, the one confirmation fixes the picks
  assert.equal(h.m.recruitPick(ps,{picks:[base.chessId],ready:false}).ok,true);
  assert.equal(ps.canRecruit(base.chessId),false);
  assert.equal(h.m.recruitPick(ps,{picks:[base.chessId],ready:true}).ok,true);
  assert.equal(ps.canRecruit(base.chessId),true);
  assert.ok(h.m.recruitPick(ps,{picks:[],ready:true}).error,'confirmed once');
 }finally{h.m.dispose();}
});
