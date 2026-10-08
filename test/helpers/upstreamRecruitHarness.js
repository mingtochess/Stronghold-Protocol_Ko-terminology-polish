// Run upstream fidelity assertions against the actual stable-ID integration, not another engine checkout.
import {makeBattle as original,enemyRec,checkInvariants,flatStage,flatRoutes,chessRec,ALL_HOOKS,hashOf} from './battleHarness.js';
import {readFileSync} from 'node:fs';
import {loadData} from '../../server/data.js';
export {enemyRec,checkInvariants,flatStage,flatRoutes,chessRec,ALL_HOOKS,hashOf};
const data=loadData(new URL('../../.cache/ursus-data/',import.meta.url).pathname);
export function makeBattle(opts={}){
 const mapUnit=u=>{
  if(!u.diy)return u;const slot=u.diy.slot??u.chessId;const tier=(typeof slot==='number'?slot:Number(slot.match(/chess_char_(\d)_/)[1]));const elite=u.elite??String(slot).endsWith('_b');const c=Object.values(data.chess).find(c=>c.optionalRecruit&&c.charId===u.diy.charId&&c.tier===tier&&!!c.isGolden===!!elite);
  if(!c)throw Error(`Missing recruit ${u.diy.charId}/${tier}`);
  return {...u,chessId:c.chessId,skillIndex:u.diy.skillIndex,moduleId:u.diy.uniEquipId??'none',diy:undefined};
 };
 const units=opts.units?.map(mapUnit),players=opts.players?.map(p=>({...p,units:p.units.map(mapUnit)}));
 const ancillary=JSON.parse(readFileSync(new URL('../../content/upstream-recruits/chess.json',import.meta.url)));
 const raw={...data,chess:{...data.chess,...ancillary}};for(const [k,v]of Object.entries(opts.defs||{}))raw[k]={...raw[k],...v};
 return original({...opts,units,players,data:raw});
}
