// One cosmetic selection source for every operator image. Gameplay loadouts stay independent.
let readEntries=()=>null;
export function setAppearanceSource(getEntries){readEntries=typeof getEntries==='function'?getEntries:()=>null;}
export function appearanceRecord(chess){
 if(!chess || chess.appearanceResolved || String(chess.assets?.spine||'').startsWith('skin_'))return chess;
 const id=chess.baseId||chess.chessId;
 const selected=id&&readEntries()?.[id]?.skin;
 const skin=chess.skins?.find(s=>s.id===selected);
 return skin?{...chess,assets:{...chess.assets,...skin.assets}}:chess;
}
