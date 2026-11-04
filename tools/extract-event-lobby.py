#!/usr/bin/env python3
"""tools/extract-event-lobby.py — export the event lobby (activity entry) art from an unpacked Arknights client.

Scans the client's activity AssetBundles (…/activity/[uc]act<N>side.ab and the like), opens each with UnityPy and
saves every Texture2D / Sprite that is large enough to be a background (default 800x450) as PNG, with an index.csv,
under .cache/event-lobby/<bundle>/. Nothing is copied into the game repository: pick the files from there and publish
them through the assets repository (tools/publish-resource-pack.mjs) as with any new asset.

  pip install UnityPy Pillow
  python tools/extract-event-lobby.py <client dir> [--out .cache/event-lobby] [--filter act34side,act43side]
                                      [--min 800x450] [--all]

  <client dir>  the unpacked client: an extracted APK (…/assets/AB/Android/…) or a PC/emulator data folder; every
                *.ab / *.bundle / extension-less file under a path containing "activity" is tried
  --filter      only bundles whose name contains one of these (comma separated)
  --min         smallest WIDTHxHEIGHT kept (default 800x450)
  --all         keep every texture regardless of size and name
"""
import argparse, csv, os, re, sys
from pathlib import Path

try:
    import UnityPy
except Exception as e:  # missing, or failed to import in this interpreter
    sys.exit(f'UnityPy could not be imported in {sys.executable} (Python {sys.version.split()[0]}): {e!r}\n'
             f'install it for this interpreter: "{sys.executable}" -m pip install UnityPy Pillow')

NAME_HINT = re.compile(r'(bg|bkg|kv|entry|main|scene|back|illust|title)', re.I)


def bundles(root: Path, flt):
    for p in root.rglob('*'):
        if not p.is_file() or 'activity' not in str(p).lower():
            continue
        if p.suffix.lower() not in ('.ab', '.bundle', '') or p.stat().st_size < 64 * 1024:
            continue
        if flt and not any(f in p.name.lower() or f in str(p.parent).lower() for f in flt):
            continue
        yield p


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('client')
    ap.add_argument('--out', default='.cache/event-lobby')
    ap.add_argument('--filter', default='')
    ap.add_argument('--min', default='800x450')
    ap.add_argument('--all', action='store_true')
    a = ap.parse_args()
    root, out = Path(a.client), Path(a.out)
    mw, mh = (int(v) for v in a.min.lower().split('x'))
    flt = [f.strip().lower() for f in a.filter.split(',') if f.strip()]
    out.mkdir(parents=True, exist_ok=True)
    rows, nb = [], 0
    for b in bundles(root, flt):
        try:
            env = UnityPy.load(str(b))
        except Exception as e:  # not a bundle / unreadable
            continue
        nb += 1
        tag = re.sub(r'[^\w.-]+', '_', b.stem)
        for path, obj in list(env.container.items()) or [(None, o) for o in env.objects]:
            if obj.type.name not in ('Texture2D', 'Sprite'):
                continue
            try:
                d = obj.read()
                img = d.image
            except Exception:
                continue
            name = getattr(d, 'm_Name', None) or getattr(d, 'name', '') or 'tex'
            w, h = img.size
            if not a.all and (w < mw or h < mh) and not (NAME_HINT.search(name) and w * h >= mw * mh * .5):
                continue
            dst = out / tag / f"{re.sub(r'[^\\w.-]+', '_', name)}.png"
            dst.parent.mkdir(parents=True, exist_ok=True)
            if dst.exists():
                dst = dst.with_name(f'{dst.stem}_{obj.path_id}.png')
            img.save(dst)
            rows.append((tag, name, w, h, path or '', str(dst)))
            print(f'{tag}  {name}  {w}x{h}')
    with open(out / 'index.csv', 'w', newline='', encoding='utf-8') as f:
        csv.writer(f).writerows([('bundle', 'name', 'width', 'height', 'container', 'file')] + rows)
    print(f'\n{nb} bundles read, {len(rows)} images -> {out}/ (index.csv)')


if __name__ == '__main__':
    main()
