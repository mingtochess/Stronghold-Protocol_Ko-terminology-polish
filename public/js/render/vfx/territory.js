// Closed contours of the occupied cells; internal shared edges are not range boundaries.
export function territoryContours(tiles, cols=21){
 const cells=new Set(tiles),edges=new Map(),key=p=>p.join(',');
 const add=(a,b)=>{const k=key(a);if(!edges.has(k))edges.set(k,[]);edges.get(k).push(b);};
 for(const cell of cells){const row=Math.floor(cell/cols),col=cell%cols,x=col-.5,y=row-.5;
  if(!cells.has(cell-cols))add([x,y],[x+1,y]);
  if(col===cols-1||!cells.has(cell+1))add([x+1,y],[x+1,y+1]);
  if(!cells.has(cell+cols))add([x+1,y+1],[x,y+1]);
  if(col===0||!cells.has(cell-1))add([x,y+1],[x,y]);
 }
 const paths=[];
 while(edges.size){const first=edges.keys().next().value,start=first.split(',').map(Number),path=[start];let at=start,dx=0,dy=-1;
  for(;;){const k=key(at),next=edges.get(k);if(!next?.length)break;
   // Keep the occupied cells on the right at diagonal contacts too.
   next.sort((a,b)=>{const rank=p=>{const nx=p[0]-at[0],ny=p[1]-at[1],cross=dx*ny-dy*nx,dot=dx*nx+dy*ny;return cross>0?0:dot>0?1:cross<0?2:3;};return rank(a)-rank(b);});
   const p=next.shift();if(!next.length)edges.delete(k);dx=p[0]-at[0];dy=p[1]-at[1];at=p;path.push(p);if(key(p)===first)break;
  }
  if(path.length>2)paths.push(path);
 }
 return paths;
}
