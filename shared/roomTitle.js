export const ROOM_TITLE_MAX=15;
export const ROOM_TITLE_LOCALES=['ko','en','ja','zh'];
export const isRoomTitle=value=>typeof value==='string'&&[...value].length<=ROOM_TITLE_MAX&&!/[\u0000-\u001f\u007f]/.test(value);
export function defaultRoomTitle(mode,name='',locale='ko',sync=false){
 const n=mode==='coop8'?8:mode==='coop'?4:1;
 // 동기화 시뮬레이션 rooms say so in their default title (kept within ROOM_TITLE_MAX by the caller's name)
 if(locale==='en')return `${name||'Host'}'s ${n}-Player ${sync?'Sync ':''}Simulation`;
 if(locale==='ja')return `${name||'ホスト'}ドクターの${n}人${sync?'同期':''}シミュレーション`;
 if(locale==='zh')return `${name||'房主'}博士的${n}人${sync?'同步':''}模拟`;
 return `${name||'방장'} 박사님의 ${n}인 ${sync?'동기화 ':''}시뮬레이션`;
}
