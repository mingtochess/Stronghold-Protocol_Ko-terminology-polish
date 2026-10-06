# Analyse base-skin matching skill prefabs; outputs candidate colours and evidence for review, never edits the renderer.
import sys,json,re,colorsys,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools/local-extract'));import aklz4,UnityPy
root=ROOT;cache=root/'.cache/skill-vfx-reference';inv=json.loads((cache/'inventory.json').read_text());report=[]
ledger=json.loads((cache/'downloaded.json').read_text())
for file in sorted(cache.rglob('*.ab')):
 relative=str(file.relative_to(cache))
 if ledger.get(relative)!=hashlib.md5(file.read_bytes()).hexdigest():raise ValueError('Unverified bundle: '+relative)
 name=file.stem;skills=[s for s in inv if s['skillId'].split('_')[1]==name]
 if not skills:continue
 env=UnityPy.load(str(file));objs={}
 for o in env.objects:
  if o.type.name in ['Transform','GameObject','Material','ParticleSystem','ParticleSystemRenderer','MeshRenderer']:
   try:objs[str(o.path_id)]={'type':o.type.name,'data':o.read_typetree()}
   except Exception:pass
 ts={k:v['data'] for k,v in objs.items() if v['type']=='Transform'};go2t={str(t['m_GameObject']['m_PathID']):k for k,t in ts.items()}
 def chain(g):
  parts=[];t=go2t.get(str(g));seen=set()
  while t in ts and t not in seen:
   seen.add(t);parts.append(objs.get(str(ts[t]['m_GameObject']['m_PathID']),{}).get('data',{}).get('m_Name','?'));t=str(ts[t]['m_Father']['m_PathID'])
  return '/'.join(reversed(parts))
 paths={k:chain(v['data'].get('m_GameObject',{}).get('m_PathID'))for k,v in objs.items() if v['type'] in ['ParticleSystem','ParticleSystemRenderer','MeshRenderer']}
 for s in skills:
  idx=s['index']+1;regex=re.compile(r'(?:skill[_-]?0?'+str(idx)+r'|sk'+str(idx)+r')(?:_|/|$)',re.I);samples=[];matched=set()
  for k,path in paths.items():
   if '#' in path or not regex.search(path.split('/')[0]):continue
   v=objs[k];p=v['data'];rootname=path.split('/')[0];matched.add(rootname);weight=3 if 'range' in path else 1
   if v['type']=='ParticleSystem':
    col=p.get('InitialModule',{}).get('startColor',{}).get('maxColor',{});samples.append({'path':path,'source':'particle','color':col,'weight':weight})
   else:
    for ref in p.get('m_Materials',[]):
     if ref.get('m_FileID',0)!=0:continue
     mat=objs.get(str(ref['m_PathID']),{}).get('data',{});colors=dict(mat.get('m_SavedProperties',{}).get('m_Colors',[]));col=colors.get('_TintColor',colors.get('_MainColor',colors.get('_Color',{})));samples.append({'path':path,'source':mat.get('m_Name','material'),'color':col,'weight':weight})
  chrom=[]
  for p in samples:
   c=p['color'];r,g,b=[max(0,min(1,c.get(k,0)))for k in ['r','g','b']];h,sat,val=colorsys.rgb_to_hsv(r,g,b);alpha=c.get('a',1)
   if val>.12 and sat>.2 and alpha>.045:chrom.append((h,sat,val,p['weight']*alpha,p))
  rangechrom=[c for c in chrom if c[4]['weight']==3];usable=rangechrom or chrom
  # Dominant hue family, never infer a colour from a different skill/skin.
  buckets={}
  for h,sat,val,w,p in usable:
   key=round(h*12)%12;buckets[key]=buckets.get(key,0)+w*sat
  if buckets:
   hue=max(buckets,key=buckets.get);chosen=[c for c in usable if round(c[0]*12)%12==hue];W=sum(c[3] for c in chosen);rgb=[sum(c[4]['color'].get(k,0)*c[3]for c in chosen)/W for k in ['r','g','b']];h,st,v=colorsys.rgb_to_hsv(*rgb);rgb=colorsys.hsv_to_rgb(h,min(.72,max(.30,st)),max(.72,v));color='#'+''.join(f'{round(x*255):02x}'for x in rgb);decision='skill-colour';evidence=[c[4]for c in sorted(chosen,key=lambda c:c[3],reverse=True)[:4]]
  else:color=None;decision='neutral-or-no-colour' if samples else 'no-skill-prefab';evidence=samples[:4]
  # A coloured flash/shadow is not sufficient to define the entire range's hue.
  # Require repeated colour evidence from sustained range/buff/trail elements.
  sustained=[c for c in chrom if any(k in c[4]['path'].split('/')[0] for k in ['range','buff','trail'])]
  colourWeight=sum(c[3] for c in sustained)
  neutralWeight=sum(p['weight']*p['color'].get('a',1) for p in samples if p['color'] and max(p['color'].get(k,0)for k in ['r','g','b'])>.35 and max(p['color'].get(k,0)for k in ['r','g','b'])-min(p['color'].get(k,0)for k in ['r','g','b'])<.12)
  confidence=colourWeight/(colourWeight+neutralWeight) if colourWeight+neutralWeight else 0
  if color and (len(sustained)<3 or confidence<.18):decision='mixed-or-minor-colour';color=None

  report.append({**s,'bundle':str(file.relative_to(cache)),'bundleMd5':ledger[str(file.relative_to(cache))],'roots':sorted(matched),'decision':decision,'suggestedColor':color,'usesRangePrefab':bool(rangechrom),'evidence':evidence,'samples':len(samples),'colourConfidence':round(confidence,3)})
 print(name,len(skills),flush=True)
missing=[{**s,'decision':'missing-bundle','suggestedColor':None,'roots':[],'evidence':[]}for s in inv if not any(r['skillId']==s['skillId']for r in report)]
report+=missing;(cache/'audit-candidates.json').write_text(json.dumps({'method':'base-skin matching skill particle/material analysis; chromatic dominant hue with readability adjustment; no video claimed','skills':report},ensure_ascii=False,indent=2));print('total',len(report),flush=True)
