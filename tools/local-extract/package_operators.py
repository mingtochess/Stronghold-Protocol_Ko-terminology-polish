"""Package an existing operator extraction without uploading bulky recovery ABs.

Original extraction files and old archives are never modified or removed.
"""
import argparse
import hashlib
import json
from pathlib import Path
import time
import zipfile


RAW_DIRS = {'source-bundles', 'source-bundle'}


def package(output, include_sources=False, archive=None, part_bytes=20*1024*1024):
    output = Path(output).resolve()
    if not (output/'operator-report.json').is_file():
        raise ValueError('Choose the extracted cn-operators-* folder containing operator-report.json, not a ZIP or client folder.')
    archive = Path(archive).resolve() if archive else output.parent/(output.name+'-upload-'+str(time.time_ns())+'.zip')
    if archive == output or output in archive.parents:
        raise ValueError('Archive must be outside the extraction folder.')
    if archive.exists(): raise ValueError('Archive already exists; choose a new filename.')
    if part_bytes <= 0: raise ValueError('Part size must be positive.')
    paths, omitted, inventory = [], [], []
    for path in sorted(output.rglob('*')):
        if not path.is_file(): continue
        rel = path.relative_to(output)
        if path.is_symlink(): raise ValueError('Unexpected symbolic link in extraction: '+str(rel))
        if not include_sources and rel.parts[0] in RAW_DIRS and path.suffix.lower() != '.json':
            omitted.append({'path': rel.as_posix(), 'bytes': path.stat().st_size}); continue
        if rel.as_posix() in ('files.json', 'upload-manifest.json'): continue
        paths.append(path)
    with zipfile.ZipFile(archive, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=3) as z:
        for path in paths:
            rel = path.relative_to(output).as_posix()
            z.write(path, output.name+'/'+rel)
            digest = hashlib.sha256()
            with path.open('rb') as stream:
                for block in iter(lambda: stream.read(1024*1024), b''): digest.update(block)
            inventory.append({'path': rel, 'bytes': path.stat().st_size, 'sha256': digest.hexdigest()})
        manifest = {'format': 'cn-operator-upload', 'includeSourceBundles': include_sources,
                    'omittedRecoveryFiles': omitted, 'omittedBytes': sum(r['bytes'] for r in omitted),
                    'note': 'Recovery ABs remain in the original extraction folder. Converted resources and reports are included.'}
        z.writestr(output.name+'/files.json', json.dumps(inventory, ensure_ascii=False, indent=2))
        z.writestr(output.name+'/upload-manifest.json', json.dumps(manifest, ensure_ascii=False, indent=2))
    parts = []
    if archive.stat().st_size > part_bytes:
        with archive.open('rb') as stream:
            number = 1
            while chunk := stream.read(part_bytes):
                part = Path(str(archive)+f'.{number:03d}')
                with part.open('xb') as dest: dest.write(chunk)
                parts.append(part.name); number += 1
    print(f'Recovery bundles omitted from upload: {len(omitted)} files, {manifest["omittedBytes"]/1024/1024:.1f} MiB; originals retained.', flush=True)
    print('UPLOAD: '+', '.join(parts or [archive.name]), flush=True)
    return parts or [archive.name]


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('folder', help='Existing cn-operators-* extraction folder')
    parser.add_argument('--include-sources', action='store_true', help='Also upload the full recovery bundle closure')
    parser.add_argument('--out', help='New archive path, outside the extraction folder')
    args = parser.parse_args()
    package(args.folder, args.include_sources, args.out)
