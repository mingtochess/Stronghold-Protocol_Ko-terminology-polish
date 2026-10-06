#!/usr/bin/env python3
"""Bake the original chen3 dragon mesh/UV into an orthographic web FX sprite.
The source texture is an atlas: displaying the entire PNG would show unrelated parts.
This keeps the original mesh's texture coordinates; Unity dissolve shaders are not ported.
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0,str(Path(__file__).parent))
import aklz4, UnityPy
from UnityPy.export.MeshExporter import export_mesh_obj
root=Path(__file__).resolve().parents[2]
env=UnityPy.load(str(root/'.cache/battle-bundles/battle/prefabs/effects/chen3.ab'))
mesh=next(o.read() for o in env.objects if o.type.name=='Mesh' and o.read().m_Name=='chenlong')
vertices=[];uvs=[];faces=[]
for line in export_mesh_obj(mesh).splitlines():
 p=line.split()
 if not p:continue
 if p[0]=='v':vertices.append([float(v) for v in p[1:4]])
 elif p[0]=='vt':uvs.append([float(v) for v in p[1:3]])
 elif p[0]=='f':
  points=[tuple(int(v)-1 for v in x.split('/')[:2]) for x in p[1:]]
  for i in range(1,len(points)-1):faces.append([points[0],points[i],points[i+1]])
v=np.array(vertices);uv=np.array(uvs);size=512
xy=v[:,:2].copy();xy[:,1]*=-1;lo=xy.min(axis=0);span=xy.max(axis=0)-lo;xy=(xy-lo)*((size-16)/span.max())+8
tex=np.array(Image.open(root/'public/assets/local/battle/dedicated/chen3/chen3_04.png').convert('RGBA'));h,w=tex.shape[:2]
out=np.zeros((size,size,4),dtype=np.uint8);depth=np.full((size,size),-np.inf)
for face in faces:
 ids=[p[0] for p in face];ts=uv[[p[1] for p in face]];a,b,c=xy[ids];den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
 if abs(den)<1e-8:continue
 left,top=np.maximum(0,np.floor(np.min([a,b,c],axis=0)).astype(int));right,bottom=np.minimum(size-1,np.ceil(np.max([a,b,c],axis=0)).astype(int));Y,X=np.mgrid[top:bottom+1,left:right+1]
 p=((b[1]-c[1])*(X-c[0])+(c[0]-b[0])*(Y-c[1]))/den;q=((c[1]-a[1])*(X-c[0])+(a[0]-c[0])*(Y-c[1]))/den;r=1-p-q
 z=p*v[ids[0],2]+q*v[ids[1],2]+r*v[ids[2],2];mask=(p>=-1e-5)&(q>=-1e-5)&(r>=-1e-5)&(z>depth[top:bottom+1,left:right+1]);U=p*ts[0,0]+q*ts[1,0]+r*ts[2,0];V=p*ts[0,1]+q*ts[1,1]+r*ts[2,1]
 pixels=tex[np.clip(((1-V)*(h-1)).astype(int),0,h-1),np.clip((U*(w-1)).astype(int),0,w-1)];out[top:bottom+1,left:right+1][mask]=pixels[mask];depth[top:bottom+1,left:right+1][mask]=z[mask]
image=Image.fromarray(out);bbox=image.getbbox();image=image.crop(bbox) if bbox else image
image.save(root/'public/assets/local/battle/dedicated/chen3/chenDragon.png')
print('Baked original chenlong mesh:',len(faces),'triangles',image.size)
