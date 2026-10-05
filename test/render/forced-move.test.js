import {test} from 'node:test';import assert from 'node:assert/strict';
import {SnapshotBuffer} from '../../public/js/render/interp.js';
const tuple=x=>[1,x,5,100,100,0,0,0,0];
test('strong push glides over its trajectory instead of triggering teleport snap',()=>{
 const b=new SnapshotBuffer();b.push({t:0,units:[tuple(0)]},0);
 b.push({t:.1,units:[tuple(5)],shifts:[[1,0,5,5,5,.05,.4]]},.05);
 let prev=0;for(let t=.05;t<.45;t+=.025){const x=b.sample(t).get(1).x;assert.ok(x>=prev&&x<5);prev=x;}
 assert.ok(prev>4);assert.equal(b.sample(.45).get(1).x,5);
});
test('a real teleport without a displacement trajectory still snaps',()=>{
 const b=new SnapshotBuffer();b.push({t:0,units:[tuple(0)]},0);b.push({t:.1,units:[tuple(5)]},.05);
 assert.equal(b.sample(.05).get(1).x,0);assert.equal(b.sample(.1).get(1).x,5);
});

test('a short push is not extrapolated as high-speed walking',()=>{
 const b=new SnapshotBuffer();b.push({t:0,units:[tuple(0)]},0);
 b.push({t:.1,units:[tuple(1)],shifts:[[1,0,5,1,5,.05,.2]]},.05);
 assert.ok(Math.abs(b.sample(.15).get(1).x-.5)<1e-6);
 assert.equal(b.sample(.3).get(1).x,1);
});
