import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {BoardScene} from '../../public/js/render/board3d/scene.js';
import {TileField} from '../../public/js/render/tiles.js';
import {officialRangeHeight,raisedRangeTiles} from '../../public/js/render/rangeHeight.js';
import {TILE_H} from '../../public/js/render/style.js';
const grid=()=>[[{glyph:'r',h:0},{glyph:'h',h:TILE_H.wall,raised:true},{glyph:'#',h:TILE_H.forbid,raised:true},{glyph:'X',h:TILE_H.sep,raised:true},{glyph:'r',h:0}]];
const cells=[[0,0],[0,1],[0,2],[0,3],[0,4]];
test('range heights have only ground/hill levels and do not modify terrain or device heights',()=>{
 const tiles=grid(),before=structuredClone(tiles),devices=[{role:'platform',pos:[0,4],active:true}],raised=raisedRangeTiles(devices);
 assert.deepEqual(tiles[0].map((t,c)=>officialRangeHeight(t,raised.has(`0,${c}`))),[0,TILE_H.wall,TILE_H.wall,TILE_H.wall,TILE_H.wall]);
 assert.deepEqual(tiles,before);assert.equal(TILE_H.platform,.465);assert.equal(TILE_H.forbid,.3);assert.equal(TILE_H.sep,.55);
 assert.equal(raisedRangeTiles([{role:'platform',pos:[0,4],active:false}]).size,0);
 assert.equal(raisedRangeTiles([{role:'platform',pos:[0,4],hidden:true}]).size,0);
 assert.ok(raisedRangeTiles([{kind:'crate',r:0,c:2},{kind:'mound',r:0,c:3}]).has('0,3'));
});
test('3D official range quads ignore irregular mesh heights, while other mark surfaces retain native heights',()=>{
 const board={grid:grid(),devices:[{kind:'platform',r:0,c:4}]},before=structuredClone(board),nativeHeights=[.07,.49,.61,.72,.465];let rays=0;
 const s={THREE,scene:new THREE.Scene(),board,_nativeTileHeight:(_b,_r,c)=>{rays++;return nativeHeights[c];}};
 BoardScene.prototype.setMarks.call(s,[{tiles:cells,color:0xffa020,alpha:1,stripes:true}]);
 const z=[...s._marks[0].geometry.attributes.position.array].filter((_,i)=>i%3===2);
 for(let i=0;i<5;i++)for(const h of z.slice(i*4,i*4+4))assert.ok(Math.abs(h-(i?TILE_H.wall+.004:.004))<1e-6);
 assert.equal(rays,0);assert.equal(s._marks[0].material.depthWrite,false);assert.equal(s._marks[0].material.depthTest,false);assert.deepEqual(board,before);
 BoardScene.prototype.setMarks.call(s,[{tiles:cells,color:0x00ff00,alpha:.5}]);
 const fill=[...s._marks[0].geometry.attributes.position.array].filter((_,i)=>i%3===2);
 for(let i=0;i<5;i++)assert.ok(Math.abs(fill[i*4]-(nativeHeights[i]+.004))<1e-6);
 assert.equal(rays,5);assert.equal(s._marks[0].material.depthTest,true);assert.deepEqual(board,before);
});
test('2D official stripes use the same two display heights, including a platform tile',()=>{
 const heights=[],tiles=grid(),g={clear(){},lineStyle(){},beginFill(){},drawPolygon(){},endFill(){}};
 const field={hlGfx:g,hlStripeGfx:g,rowSurfaces:new Map(),cam:{project(x,y,z,p){heights.push(z);p.x=x;p.y=y;}},highlights:new Map([['range',{tiles:cells,style:{stripes:true}}]]),officialMarks:true,_stageDevices:()=>[{role:'platform',pos:[0,4]}],tile:(r,c)=>tiles[r][c],_p:{},time:0};
 TileField.prototype._drawHighlights.call(field);
 assert.deepEqual([...new Set(heights)].sort((a,b)=>a-b),[.012,TILE_H.wall+.012]);
});
