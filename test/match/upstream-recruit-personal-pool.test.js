import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SharedPool,RecruitPool} from '../../server/match/pool.js';
test('recruits use independent personal stock, ordinary stock is shared, and draft edits update eligibility',()=>{
 const records={normal:{tier:1},recruit:{tier:5,optionalRecruit:true}};
 const gd={visibleChess:Object.keys(records),chess:id=>records[id],poolCopies:()=>3,tierOf:id=>records[id].tier};
 const shared=new SharedPool(gd),p1={gd,canRecruit:id=>id==='recruit'},p2={gd,canRecruit:id=>id==='recruit'};
 const a=new RecruitPool(shared,p1).sync(),b=new RecruitPool(shared,p2).sync();
 assert.equal(shared.has('recruit'),false);a.take('recruit',2);assert.equal(a.left('recruit'),1);assert.equal(b.left('recruit'),3);
 a.take('normal');assert.equal(b.left('normal'),2);assert.equal(shared.left('normal'),2);
 p1.canRecruit=()=>false;a.sync();assert.equal(a.has('recruit'),false);assert.equal(b.has('recruit'),true);
 p1.canRecruit=()=>true;a.sync();assert.equal(a.left('recruit'),1);a.give('recruit',2);assert.equal(a.left('recruit'),3);assert.equal(b.left('recruit'),3);
});
