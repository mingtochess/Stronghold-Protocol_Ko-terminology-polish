#!/usr/bin/env python3
"""Fetch just the official board/projectile bundles listed by ArknightsAssets.

Uses that repository's download_bundles.sh URL convention, verifies each archive
against its index MD5, and keeps a stable cache. Does not download the full game.
Then run tools/local-extract/extract.py with the printed cache path.
"""
import hashlib
import io
import json
from pathlib import Path
import sys
import urllib.request
import urllib.parse
import zipfile

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.cache/battle-bundles'
INDEX = 'https://raw.githubusercontent.com/ArknightsAssets/ArknightsAssets2/cn/bundles/hot_update_list.json'
NAMES = {
    'arts/maps/map_autochess/res.ab', 'arts/maps/map_autochesssand/res.ab',
    'arts/maps/map_autochess/bkg_mesh.ab',
    'arts/maps/common/meshes/s_background_common.ab',
    'arts/maps/common/meshes/s_common_box_01.ab',
    'arts/maps/common/meshes/s_wind_device.ab',
    'arts/maps/common/res.ab', 'arts/maps/effect.ab',
    'arts/effects/[pack]map.ab', 'battle/prefabs/[uc]projectiles.ab',
    'battle/prefabs/effects/common.ab', 'battle/prefabs/effects/buff.ab', 'battle/[pack]common.ab', 'arts/[pack]common.ab', 'config/buff_template_holder.ab', 'battle/prefabs/[uc]globalbuffs.ab',
    'shaders/standarddirectional.ab', 'shaders/other.ab', '[uc]shaders.ab',
}

def fetch(url):
    with urllib.request.urlopen(url, timeout=90) as r:
        return r.read()

def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    index = json.loads(fetch(INDEX))
    config = json.loads(json.loads(fetch('https://ak-conf.hypergryph.com/config/prod/official/network_config'))['content'])
    network = config['configs'][str(config['funcVer'])]['network']
    base = network['hu'].rstrip('/') + '/Android/assets/' + index['versionId']
    ledger_path = CACHE / 'downloaded.json'
    ledger = json.loads(ledger_path.read_text()) if ledger_path.exists() else {}
    if '--enemy-spines' in sys.argv:
        NAMES.update(b['name'] for b in index['abInfos'] if b['name'].startswith('refs/arts/enm_art_'))
    selected = {b['name']: b for b in index['abInfos'] if b['name'] in NAMES}
    if set(selected) != NAMES:
        raise ValueError(f'Missing bundles in index: {NAMES-set(selected)}')
    for name, entry in selected.items():
        if (CACHE / name).is_file() and ledger.get(name) == entry['md5']:
            print('cached:', name)
            continue
        encoded = name.replace('/', '_').replace('#', '__').rsplit('.', 1)[0] + '.dat'
        body = fetch(base + '/' + urllib.parse.quote(encoded))
        with zipfile.ZipFile(io.BytesIO(body)) as archive:
            if hashlib.md5(archive.read(name)).hexdigest() != entry['md5']:
                raise ValueError('Bundle checksum mismatch: ' + name)
            for member in archive.infolist():
                destination = (CACHE / member.filename).resolve()
                if not destination.is_relative_to(CACHE.resolve()):
                    raise ValueError('Unsafe archive path')
            archive.extractall(CACHE)
        if not (CACHE / name).is_file():
            raise ValueError('Expected bundle absent from archive: ' + name)
        ledger[name] = entry['md5']
        ledger_path.write_text(json.dumps(ledger, indent=2))
        print('downloaded:', name, len(body))
    (CACHE / 'source.json').write_text(json.dumps({'index': INDEX, 'version': index['versionId'], 'bundles': sorted(NAMES)}, indent=2))
    print('Bundle cache:', CACHE)

if __name__ == '__main__':
    main()
