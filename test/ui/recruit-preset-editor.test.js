import{test}from'node:test';import assert from'node:assert/strict';
import{loadData}from'../../server/data.js';
import{recruitPresetCandidates,editRecruitPreset,sameRecruitSelection}from'../../public/js/ui/recruitPresetModel.js';
const data=loadData(new URL('../../content/production/data/',import.meta.url).pathname),get=id=>data.chess[id],id=(n,t=5)=>`chess_custom_recruit_${n}_${t}_a`;
test('preset editing selects, replaces and removes recruits without mutating live settings',()=>{
 const initial={[id('talulah')]:{selected:true,skill:2}},snapshot=JSON.stringify(initial);
 const added=editRecruitPreset(initial,get(id('territoriya')),5,null,get);assert.equal(added.ok,true);assert.equal(Object.keys(added.entries).length,2);
 assert.equal(editRecruitPreset(added.entries,get(id('toska')),5,null,get).ok,false);
 const replaced=editRecruitPreset(added.entries,get(id('toska')),5,id('territoriya'),get);assert.equal(replaced.ok,true);assert.ok(replaced.entries[id('toska')]?.selected);assert.equal(replaced.entries[id('territoriya')],undefined);
 const removed=editRecruitPreset(replaced.entries,null,5,id('talulah'),get);assert.equal(Object.keys(removed.entries).length,1);assert.equal(JSON.stringify(initial),snapshot);
 assert.equal(sameRecruitSelection(initial,{[id('talulah')]:{selected:true,skill:0},ordinary:{skill:1}}),true);
 assert.equal(sameRecruitSelection(initial,added.entries),false);
});
test('preset picker follows loadout recruit visibility and reserve tier rules',()=>{
 for(const tier of [5,6]){const rows=recruitPresetCandidates(Object.values(data.chess),tier);assert.ok(rows.some(c=>c.chessId===id('talulah',tier)));assert.ok(rows.every(c=>c.optionalRecruit&&c.tier===tier&&!c.isGolden&&c.visible));if(tier===6)assert.ok(rows.every(c=>!c.recruitReserve));}
});
