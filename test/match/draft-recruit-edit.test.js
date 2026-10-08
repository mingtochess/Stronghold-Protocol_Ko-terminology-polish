import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DATA,makeMatch} from './harness.js';
import {PHASE} from '../../shared/constants.js';

test('draft recruit edits replace personal eligibility before the first shop opens',()=>{
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
  assert.equal(h.m.setLoadout('p_0',{[base.chessId]:{selected:true}}).ok,true);
  assert.equal(ps.canRecruit(base.chessId),true);
  assert.equal(h.m.setLoadout('p_0',{}).ok,true);
  assert.equal(ps.canRecruit(base.chessId),false);
 }finally{h.m.dispose();}
});
