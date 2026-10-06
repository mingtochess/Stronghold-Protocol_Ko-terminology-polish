#!/usr/bin/env python3
"""Fetch MD5-verified original Arknights stage bundles from a pinned asset index.
The live index no longer lists these event scenes; use the matching archived resource version.
"""
import hashlib, io, json, urllib.parse, urllib.request, zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
COMMIT='7ddea107cef9ab24d55052f36bf984fcd1bff9ed'
INDEX_URL=f'https://raw.githubusercontent.com/ArknightsAssets/ArknightsAssets2/{COMMIT}/bundles/hot_update_list.json'
CACHE=ROOT/'.cache/original-map-bundles'
def main():
 CACHE.mkdir(parents=True,exist_ok=True)
 index_path=CACHE/'index.json'
 if not index_path.exists():index_path.write_bytes(urllib.request.urlopen(INDEX_URL,timeout=60).read())
 index=json.loads(index_path.read_text())
 conf=json.loads(json.load(urllib.request.urlopen('https://ak-conf.hypergryph.com/config/prod/official/network_config',timeout=60))['content'])
 net=conf['configs'][str(conf['funcVer'])]['network'];base=net['hu'].rstrip('/')+'/Android/assets/'+index['versionId']
 resources={'shaders/standardrealtimeshadow.ab', 'arts/maps/common/trap/trap_110.ab', 'arts/maps/map_syracuse_metro/res.ab', 'arts/maps/common/meshes/s_background_common.ab', 'arts/maps/effect.ab', 'arts/maps/map_doss_shore/res.ab', 'arts/maps/map_yumen/res.ab', 'arts/maps/map_survivaloasis_city/res.ab', 'arts/maps/map_lakegarden/res.ab', 'arts/maps/map_lm_center/res.ab', 'arts/maps/map_kxmr/res.ab', 'arts/maps/map_autochesssand/res.ab'}
 selected=[a for a in index['abInfos'] if a['name'] in resources or (a['name'].startswith(('scenes/activities/act1autochess/','scenes/activities/act2autochess/')) and ((a['name'].count('/')==4 and 'lighting' not in a['name']) or a['name'].endswith('/lightingdata.ab')))]
 for a in selected:
  name=a['name'];p=CACHE/name
  if p.exists() and hashlib.md5(p.read_bytes()).hexdigest()==a['md5']:continue
  url=base+'/'+urllib.parse.quote(name.replace('/','_').replace('#','__').rsplit('.',1)[0]+'.dat')
  body=urllib.request.urlopen(url,timeout=90).read();raw=zipfile.ZipFile(io.BytesIO(body)).read(name)
  if hashlib.md5(raw).hexdigest()!=a['md5']:raise ValueError('Checksum mismatch: '+name)
  p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(raw);print(name,len(raw),flush=True)
 (CACHE/'source.json').write_text(json.dumps({'repository':'ArknightsAssets/ArknightsAssets2','indexCommit':COMMIT,'indexUrl':INDEX_URL,'versionId':index['versionId'],'bundles':[{k:a[k] for k in ('name','md5')} for a in selected]},indent=2))
if __name__=='__main__':main()
