import {checkLoadout} from '../../../shared/protocol.js';
import {setRecruitSelection,rosterOf} from './loadoutModel.js';

export const selectedRecruits = entries => Object.fromEntries(Object.entries(entries||{}).filter(([,e])=>e?.selected===true));
export function recruitPresetCandidates(records,tier){
 const roster=rosterOf(records),leithanien=new Set(roster.filter(c=>c.chessId.startsWith('chess_custom_leithanien_')).map(c=>c.charId));
 return roster.filter(c=>c.optionalRecruit&&c.tier===tier&&!leithanien.has(c.charId)&&!(tier===6&&c.recruitReserve));
}
export function editRecruitPreset(entries,chess,tier,replacing,getChess){
 let next={...entries};
 if(replacing)delete next[replacing];
 if(chess)next=setRecruitSelection(next,chess,tier,getChess);
 next=selectedRecruits(next);
 const check=checkLoadout(next,getChess);
 return check.ok?{ok:true,entries:next}:{ok:false,detail:check.detail};
}
export function sameRecruitSelection(a,b){
 const ids=e=>Object.keys(selectedRecruits(e)).sort();
 return JSON.stringify(ids(a))===JSON.stringify(ids(b));
}
