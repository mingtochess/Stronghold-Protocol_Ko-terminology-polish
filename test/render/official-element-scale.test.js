import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {installFakePixi,fakeViewCtx} from './fakepixi.js';
let fake,UnitView;
before(async()=>{fake=installFakePixi();({UnitView}=await import('../../public/js/render/units.js'));});
after(()=>fake.restore());
const view=()=>new UnitView(fakeViewCtx(fake.P),{id:1,side:'ally',kind:'op',defId:'char_x',tier:3,x:5,y:10,maxHp:1000,dir:'RIGHT'});

test('official element disc stays proportional to tile size, without a pixel cap',()=>{
 const v=view();v.el='burn';v.elFill=.4;
 const diameters=[];
 for(const s of [60,120,240]){v._updateElementBar(true,0,s*.74,0,4,s,0,{x:0,y:0});diameters.push(v._elBar.disc.width);}
 assert.ok(Math.abs(diameters[1]/diameters[0]-2)<1e-6);
 assert.ok(Math.abs(diameters[2]/diameters[1]-2)<1e-6);
 // The icon occupies less than a quarter of an ordinary official HP bar.
 assert.ok(diameters[0]*.64<60*.74*.25);
 v.destroy();
});
