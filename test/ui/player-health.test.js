import {test} from 'node:test';
import assert from 'node:assert/strict';
import {currentPlayerLp,liveLp} from '../../public/js/ui/hud.js';
import {rowLp} from '../../public/js/ui/teamPanel.js';
const pub={phase:'COMBAT',round:2,players:[{playerId:'p1',lp:22},{playerId:'p2',lp:15,pendingLp:3}]};
test('current HP uses private updates for self and public updates for watched players, including zero',()=>{
 assert.equal(currentPlayerLp(pub,{playerId:'p1',lp:18},'p1'),18);
 assert.equal(currentPlayerLp(pub,{playerId:'p1',lp:22},'p2'),15);
 assert.equal(currentPlayerLp({...pub,players:[{playerId:'p2',lp:0}]},null,'p2'),0);
});
test('watching a battle immediately applies local leaks to its roster HP without waiting for public updates',()=>{
 const p=pub.players[1];assert.deepEqual(rowLp(p,pub,null,{normalLeaks:{'n:p2':5}}),{lp:15,pending:5,unite:false,left:null});
 assert.equal(rowLp({...p,lp:10},{...pub,phase:'PREP'},null,{normalLeaks:{'n:p2':5}}).pending,0,'settled HP is not charged again');
});
test('ordinary HP drops with leaks, then keeps the settled value across later rounds',()=>{
 const start=liveLp(null,{phase:'COMBAT',round:2,lp:22,statsLeaks:0,leaks:4});assert.equal(start.shown,18);
 assert.equal(liveLp(start.base,{phase:'SETTLE',round:2,lp:18,statsLeaks:4,leaks:4}).shown,18);
 assert.equal(liveLp(null,{phase:'COMBAT',round:3,lp:18,statsLeaks:4,leaks:2}).shown,16);
});
