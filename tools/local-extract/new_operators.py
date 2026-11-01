"""Offline, client-sourced operator onboarding; never substitute public game tables."""
import argparse
import base64
import gc
import gzip
import hashlib
import json
from pathlib import Path
import re
import shutil
import sys
import time
import traceback
import zlib

TABLES = ('character_table', 'skill_table', 'range_table', 'skin_table', 'uniequip_table',
          'battle_equip_table', 'charword_table', 'audio_data', 'char_patch_table', 'handbook_info_table')
REQUIRED = set(TABLES[:-1])
DEFAULT_TARGETS = ['塔露拉', '国度', '冻河']
ALIASES = {'塔露拉': ['塔露拉', 'Talulah'], '国度': ['国度', 'Территория'], '冻河': ['冻河', 'Тоска'], 'Тоска': ['冻河', 'Тоска']}
CHAR_ID = re.compile(r'^char_\d+_[a-z0-9_]+$', re.I)


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def write(path, value):
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    def binary(obj):
        if isinstance(obj, (bytes, bytearray)): return {'encoding': 'base64', 'data': base64.b64encode(obj).decode('ascii')}
        raise TypeError(type(obj).__name__)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, default=binary), encoding='utf-8')


def strings(value):
    if isinstance(value, str): yield value
    elif isinstance(value, dict):
        for key, entry in value.items():
            yield str(key)
            yield from strings(entry)
    elif isinstance(value, (list, tuple)):
        for entry in value: yield from strings(entry)


def field_strings(value, keys):
    if isinstance(value, dict):
        for key, entry in value.items():
            if key in keys and isinstance(entry, str) and entry: yield entry
            yield from field_strings(entry, keys)
    elif isinstance(value, (list, tuple)):
        for entry in value: yield from field_strings(entry, keys)


def table_name(value):
    leaf = str(value).replace('\\', '/').rsplit('/', 1)[-1].lower()
    return next((name for name in TABLES if leaf in (name, name+'.json', name+'.bytes', name+'.txt')), None)


def decode_table(payload):
    if isinstance(payload, str): payload = payload.encode('utf-8', 'surrogateescape')
    candidates = [bytes(payload)]
    for unpack in (gzip.decompress, zlib.decompress):
        try: candidates.append(unpack(payload))
        except (OSError, EOFError, ValueError, zlib.error): pass
    for data in candidates:
        for encoding in ('utf-8-sig', 'utf-16'):
            try:
                value = json.loads(data.decode(encoding))
                if isinstance(value, dict): return value
            except (UnicodeError, ValueError): pass
    raise ValueError('Unsupported client table encoding; raw bytes retained for diagnosis (no online replacement).')


def load_tables(game, output, supplied=None, installed=None, log=print):
    """Explicit/updated local tables -> updated bundles -> loose base tables. Never use an online snapshot."""
    result, sources, errors, claimed = {}, {}, [], set()
    roots = [Path(supplied)] if supplied else []
    if supplied and not roots[0].is_dir(): raise ValueError('Local table folder does not exist')
    roots.append(Path(game)/'gamedata/excel')
    if installed: roots.append(Path(installed)/'Arknights_Data/PersistentData/gamedata/excel')
    fallback = [Path(installed)/'gamedata/excel', Path(installed)/'Arknights_Data/StreamingAssets/gamedata/excel'] if installed else []
    def accept(name, data, source):
        if name in claimed: return
        claimed.add(name)  # An unreadable update must not fall back to an older base copy.
        raw = Path(output)/'tables/raw'/(name+'-'+hashlib.sha256(data).hexdigest()[:12]+'.bin')
        raw.parent.mkdir(parents=True, exist_ok=True); raw.write_bytes(data)
        try:
            result[name] = decode_table(data)
            sources[name] = {**source, 'sha256': hashlib.sha256(data).hexdigest()}
        except ValueError as e: errors.append({'table': name, **source, 'error': str(e)})
    def loose(directories):
        for directory in directories:
            if not directory.is_dir(): continue
            for path in sorted(directory.iterdir()):
                name = table_name(path.name)
                if name and name not in claimed and path.is_file():
                    accept(name, path.read_bytes(), {'source': 'local-file', 'file': str(path)})
    # PC builds may keep loose tables outside the historical gamedata/excel path.
    # Inspect named table files only; don't decode arbitrary installation files.
    if installed:
        for area in ('PersistentData', 'StreamingAssets'):
            parent = Path(installed)/'Arknights_Data'/area
            directories = sorted({p.parent for p in parent.rglob('*')
                                  if p.is_file() and table_name(p.name)}) if parent.is_dir() else []
            (roots if area == 'PersistentData' else fallback).extend(directories)
    loose(roots)
    if REQUIRED-set(result):
        # Bundle filenames can be opaque/packed. Prefer likely paths, but never
        # conclude that tables are absent without inspecting remaining bundles.
        bundles = sorted((p for p in Path(game).rglob('*') if p.is_file() and p.suffix.lower() in ('.ab', '.bin')),
                         key=lambda p: (not any(n in p.relative_to(game).as_posix().lower()
                                                for n in ('gamedata', 'excel', 'table')), str(p)))
        log(f'Client table search: {len(bundles)} bundles; loose tables decoded {len(result)}/{len(TABLES)}')
        write(Path(output)/'tables/bundle-inventory.json', [p.relative_to(game).as_posix() for p in bundles])
        if bundles:
            import aklz4  # noqa: F401 (UnityPy decoder registration)
            import UnityPy
        for i, path in enumerate(bundles, 1):
            if REQUIRED <= claimed: break
            try:
                env = UnityPy.load(str(path))
                for obj in env.objects:
                    if obj.type.name != 'TextAsset': continue
                    text = obj.read(); name = table_name(text.m_Name)
                    if not name or name in claimed: continue
                    payload = text.m_Script
                    data = bytes(payload) if isinstance(payload, (bytes, bytearray)) else payload.encode('utf-8', 'surrogateescape')
                    accept(name, data, {'source': 'client-TextAsset', 'bundle': path.relative_to(game).as_posix()})
            except Exception as e: errors.append({'bundle': path.relative_to(game).as_posix(), 'error': str(e)})
            if i % 20 == 0: log(f'Client table bundles {i}/{len(bundles)}; decoded {len(result)}/{len(TABLES)}')
            gc.collect()
    loose(fallback)
    for name, value in result.items(): write(Path(output)/'tables/client'/(name+'.json'), value)
    report = {'sources': sources, 'missingRequired': sorted(REQUIRED-set(result)), 'missingOptional': sorted(set(TABLES)-REQUIRED-set(result)),
              'errors': errors, 'onlineTablesUsed': False}
    write(Path(output)/'tables/table-report.json', report)
    log(f'Client tables decoded {len(result)}/{len(TABLES)}; read errors {len(errors)}')
    if report['missingRequired']: log('Missing required client tables: '+', '.join(report['missingRequired']))
    for error in errors[:5]: log('Table read error: '+str(error))
    return result, report


def select_targets(character_table, requested):
    selected, missing = set(), []
    for request in requested:
        names = {s.strip().casefold() for s in request.split('/') if s.strip()}
        for key, aliases in ALIASES.items():
            group = {s.casefold() for s in [key, *aliases]}
            if names & group: names.update(group)
        matches = [cid for cid, c in character_table.items() if CHAR_ID.fullmatch(cid) and isinstance(c, dict)
                   and (cid.casefold() in names or cid.rsplit('_', 1)[-1].casefold() in names or str(c.get('name', '')).casefold() in names)]
        if matches: selected.update(matches)
        else: missing.append(request)
    return sorted(selected), missing


def make_plan(tables, requested):
    chars = tables.get('character_table', {})
    selected, missing = select_targets(chars, requested)
    units = set(selected)
    # Tokens may spawn other tokens. Resolve the declared chain without adding unrelated operators.
    equips = tables.get('uniequip_table', {}).get('equipDict') or {}
    modules = {key: value for key, value in equips.items() if isinstance(value, dict) and value.get('charId') in selected}
    module_ids = set(modules)
    for cid in selected: module_ids.update(tables.get('uniequip_table', {}).get('charEquip', {}).get(cid) or [])
    modules.update({key: equips[key] for key in module_ids if key in equips})
    battle_equips = {key: value for key, value in tables.get('battle_equip_table', {}).items() if key in module_ids}
    patch = tables.get('char_patch_table') or {}
    patch_info = {section: {cid: value[cid] for cid in selected if cid in value}
                  for section, value in patch.items() if isinstance(value, dict)}
    patch_refs = set(strings(patch_info))
    patch_chars = patch.get('patchChars') or {}
    chars = {**chars, **{cid: row for cid, row in patch_chars.items() if isinstance(row, dict)}}
    for cid in patch_refs:
        if cid in chars and cid.startswith('char_'): units.add(cid)
    while True:
        skill_ids = {r.get('skillId') for cid in units for r in (chars.get(cid, {}).get('skills') or []) if isinstance(r, dict) and r.get('skillId')}
        skills = {key: value for key, value in tables.get('skill_table', {}).items() if key in skill_ids}
        refs = set(strings([*(chars.get(cid, {}) for cid in units), skills, modules, battle_equips]))
        tokens = {key for key in refs if key.startswith('token_') and key in chars}
        if tokens <= units: break
        units.update(tokens)
    skin_rows = [dict(row, skinId=key) for key, row in (tables.get('skin_table', {}).get('charSkins') or {}).items()
                 if isinstance(row, dict) and row.get('charId') in units]
    ranges = {key: val for key, val in tables.get('range_table', {}).items() if key in refs}
    required_ranges = set(field_strings([*(chars.get(cid,{}) for cid in units),skills,battle_equips], {'rangeId','rangeGridId'}))
    sprite_required = {row[key] for row in skin_rows for key in ('avatarId', 'portraitId') if isinstance(row.get(key), str) and row[key]}
    sprite_required.update(row.get('iconId') or key for key,row in skills.items())
    sprite_required.update(row.get('uniEquipIcon') or row.get('iconId') or key for key,row in modules.items())
    for record in [*skills.values(), *modules.values()]:
        sprite_required.update(s for key, s in record.items() if key in ('iconId', 'uniEquipIcon') and isinstance(s, str) and s)
        for level in record.get('levels') or []:
            if isinstance(level, dict) and level.get('iconId'): sprite_required.add(level['iconId'])
    sprites = sprite_required | {cid+suffix for cid in units for suffix in ('', '_1', '_2')}
    return {'requested': requested, 'operators': selected, 'units': sorted(units), 'unresolvedOperators': missing,
            'skins': skin_rows, 'skillIds': sorted(skill_ids), 'requiredSprites': sorted(sprite_required), 'sprites': sorted(sprites),
            'tables': {'characters': {cid: chars[cid] for cid in sorted(units)}, 'skills': skills, 'ranges': ranges,
                       'modules': modules, 'battleEquips': battle_equips,
                       'charPatch': patch_info, 'charWords': tables.get('charword_table') or {}},
            'missingSkills': sorted(skill_ids-set(skills)), 'missingRanges': sorted(required_ranges-set(ranges)),
            'missingModules': sorted(module_ids-set(modules))}


def raw_graphs(game, work, output, plan, log):
    import fx
    from skin_fx import skin_components
    cabs = fx.scan_cabs(game, dirs=fx.CAB_DIRS+('refs/arts', 'chararts', 'charpack'))
    effects = fx.container_index(game, fx.EFFECT_GLOBS, work/'.cache/fx/effects.json', 1, log)
    token_index = fx.container_index(game, (fx.TOKEN_GLOB,), work/'.cache/fx/tokens.json', 1, log)
    gd = fx.game_data(work); gd['chars'] = plan['operators']; gd['tokens'] = [u for u in plan['units'] if u.startswith('token_')]; gd['enemies'] = []
    gd['skills'] = {cid: [r['skillId'] for r in plan['tables']['characters'][cid].get('skills') or [] if isinstance(r, dict) and r.get('skillId')] for cid in plan['units']}
    gd['talentKeys'] = fx.talent_keys(plan['units'], plan['tables']['characters'], plan['tables']['battleEquips'], {'equipDict': plan['tables']['modules']})
    units, projectiles, skills, skins, refs = fx.crawl_units(game, cabs, plan['units'], gd, effects, {}, token_index, log)
    wiring = {'units': units, 'projectiles': projectiles, 'skills': skills, 'skins': skins}
    write(output/'unit-skill-projectiles.json', wiring)
    # Preserve every serialized node in the targeted charpack, including inactive sub-forms and action references.
    env = fx.AssetEnv(game, cabs); components = {}
    for cid in plan['operators']:
        for prefix in ('charpack', 'chararts'):
            rel = prefix+'/'+cid+'.ab'
            if not (game/rel).is_file(): continue
            for container, root in env.prefabs(rel, full=True).items():
                rows, extra = skin_components(env, root, effects)
                components[rel+':'+container] = rows; refs.update(extra)
    write(output/'raw-unit-components.json', components)
    templates, owners = {}, {}
    for sf in env.load_rel(fx.BUFF_TEMPLATES):
        for obj in sf.objects.values():
            if obj.type.name != 'MonoBehaviour': continue
            for row in env.tt(obj).get('_templates') or []:
                if isinstance(row, dict) and row.get('templateKey'): templates[row['templateKey']] = row; owners[row['templateKey']] = obj
    lookup = {key.casefold(): key for key in templates}
    references = {v.casefold() for v in strings([wiring, components])}
    codes = [cid.rsplit('_', 1)[-1] for cid in plan['units']]
    pattern = re.compile(r'(?<![a-z0-9])(?:'+'|'.join(re.escape(code) for code in codes)+r')(?![a-z0-9])', re.I)
    todo = {key for key in templates if key.casefold() in references or pattern.search(key)}; kept = {}
    while todo:
        key = todo.pop()
        if key in kept: continue
        row, owner = templates[key], owners[key]
        def pointer(ptr, obj=owner):
            sf, target = env.resolve(obj.assets_file, ptr)
            return {'reference': env.tt(target).get('m_Name'), 'type': target.type.name} if target is not None and sf != 'builtin' else None
        kept[key] = fx.enc_value(row, pointer)
        todo.update(lookup[s.casefold()] for s in strings(row) if s.casefold() in lookup and lookup[s.casefold()] not in kept)
    write(output/'buff-action-graphs.json', kept)
    refs.update(s.lower() for s in strings([components, kept]) if s.lower() in effects)
    # Unreferenced authored effects (e.g. summon entry or cabin renderers) must be retained as well.
    refs.update(key for key, rel in effects.items() if pattern.search(key) or pattern.search(rel))
    keys = sorted(refs)
    if keys:
        fx.export_fx(game, output/'base-fx/public/assets/local', {}, log, selection='keys', keys=keys,
                     jobs=1, root=work, fx_manifest=output/'base-fx/data/local-fx.json')
    return {'missingUnits': sorted(set(plan['units'])-set(units)), 'units': len(units), 'skills': len(skills),
            'projectiles': len(projectiles), 'requestedEffects': keys}, wiring, set(strings([wiring, components, kept]))


def export_sprites(game, output, plan, log):
    import aklz4  # noqa: F401
    import UnityPy
    wanted = {key.lower().removesuffix('.png') for key in plan['sprites']}; found, rows, errors = set(), [], []
    output.mkdir(parents=True, exist_ok=True)
    bundles = sorted(p for p in game.rglob('*.ab') if 'spritepack' in p.as_posix().lower())
    for i, path in enumerate(bundles, 1):
        try:
            env = UnityPy.load(str(path))
            for obj in env.objects:
                if obj.type.name not in ('Sprite', 'Texture2D'): continue
                item = obj.read(); key = item.m_Name.lower().removesuffix('.png')
                if key not in wanted: continue
                image = item.image; data_name = hashlib.sha256(item.m_Name.encode()).hexdigest()[:12]
                dest = output/(re.sub(r'[^a-zA-Z0-9_-]', '_', item.m_Name)+'-'+data_name+'.png')
                image.save(dest); found.add(key)
                rows.append({'name': item.m_Name, 'file': dest.name, 'bundle': path.relative_to(game).as_posix(), 'width': image.width, 'height': image.height})
        except Exception as e: errors.append({'bundle': path.relative_to(game).as_posix(), 'error': str(e)})
        if i % 50 == 0: log(f'Sprite bundles {i}/{len(bundles)}; found {len(found)} requested sprites')
        gc.collect()
    report = {'sprites': rows, 'missingRequired': sorted({s.lower().removesuffix('.png') for s in plan['requiredSprites']}-found), 'errors': errors}
    write(output/'sprites.json', report); return report


def select_audio(tables, plan, extra):
    from skin_recovery import select_audio as choose
    data = tables.get('audio_data') or {}
    banks = choose(data, plan['units'], extra)
    controls = choose({'soundFXBanks': data.get('soundFXCtrlBanks') or []}, plan['units'], extra)
    by_name = {b['name']: b for b in data.get('soundFXBanks') or [] if isinstance(b, dict) and b.get('name')}
    aliases = data.get('bankAlias') or {}; todo = [b['name'] for b in banks]+[b['targetBank'] for b in controls if b.get('targetBank')]; seen = set()
    while todo:
        key = todo.pop()
        if key in seen: continue
        seen.add(key)
        if isinstance(aliases.get(key), str): todo.append(aliases[key])
    return {'banks': [by_name[k] for k in sorted(seen) if k in by_name], 'controlBanks': controls,
            'aliases': {k: v for k, v in aliases.items() if k in seen}}


def voice_owners(tables, plan):
    # Include explicitly declared voice aliases (skins/forms can share or replace their speaker).
    owners = set(plan['operators'])
    for row in plan['skins']:
        for key in ('voiceId', 'voiceCharId', 'voiceTemplateId'):
            value = row.get(key)
            if isinstance(value, str) and CHAR_ID.fullmatch(value): owners.add(value)
    for key, row in (tables.get('charword_table', {}).get('charWords') or {}).items():
        if not isinstance(row, dict): continue
        if row.get('charId') in owners or any(cid in key for cid in plan['operators']):
            for value in strings(row):
                if CHAR_ID.fullmatch(value): owners.add(value)
    return owners


def export_audio(game, output, banks, owners, log):
    import aklz4  # noqa: F401
    import UnityPy
    from skin_audio import audio_names
    requested = audio_names([banks]); found = set(); rows, errors = [], []
    output.mkdir(parents=True)
    bundles = sorted(p for p in game.rglob('*') if p.suffix.lower() in ('.ab', '.bin', '.bundle', '.unity3d')
                     and any(s in p.as_posix().lower() for s in ('audio', 'sound', 'aud_', 'voice')))
    owner_patterns = {cid: re.compile(r'(?<![a-z0-9_])'+re.escape(cid)+r'(?![a-z0-9_])', re.I) for cid in owners}
    for i, path in enumerate(bundles, 1):
        try:
            env = UnityPy.load(str(path)); container_paths = {}
            for key, obj in env.container.items(): container_paths.setdefault((id(obj.assets_file), obj.path_id), []).append(str(key))
            for obj in env.objects:
                if obj.type.name != 'AudioClip': continue
                clip = obj.read(); name = clip.m_Name.lower().removesuffix('.mp3').removesuffix('.wav')
                locations = [path.relative_to(game).as_posix(), *container_paths.get((id(obj.assets_file), obj.path_id), [])]
                matches = [cid for cid, pattern in owner_patterns.items() if any(pattern.search(s) for s in locations)]
                voice = bool(matches and (re.match(r'^(?:cn|jp|en|kr|cv)_?\d+', name, re.I) or any('voice' in s.lower() for s in locations)))
                if not voice and name not in requested: continue
                samples = clip.samples
                if not samples: raise ValueError('AudioClip has no samples: '+clip.m_Name)
                for leaf, data in samples.items():
                    role = 'voice' if voice else 'sfx'; digest = hashlib.sha256(('|'.join(locations)+str(obj.path_id)+str(getattr(obj.assets_file,'name',''))).encode()+data).hexdigest()[:14]
                    safe = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', Path(leaf.replace('\\','/')).name)
                    dest = output/role/digest/safe; dest.parent.mkdir(parents=True, exist_ok=True); dest.write_bytes(data)
                    rows.append({'kind': role, 'name': clip.m_Name, 'owners': matches, 'locations': locations,
                                 'file': dest.relative_to(output).as_posix(), 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)})
                if not voice: found.add(name)
        except Exception as e: errors.append({'bundle': path.relative_to(game).as_posix(), 'error': str(e)})
        if i % 20 == 0: log(f'Audio bundles {i}/{len(bundles)}; SFX {len(found)}/{len(requested)}; voice clips {sum(r["kind"]=="voice" for r in rows)}')
        gc.collect()
    report = {'files': rows, 'missingSfx': sorted(requested-found), 'missingVoiceOwners': sorted(set(owners)-{cid for row in rows if row['kind']=='voice' for cid in row['owners']}), 'errors': errors}
    write(output/'audio-report.json', report); return report


def copy_sources(game, output, seeds, log):
    import fx
    cabs = fx.scan_cabs(game, dirs=('.',), files=())
    env = fx.AssetEnv(game, cabs); pending = set(seeds); seen, missing, errors, files = set(), set(), [], []
    root = game.resolve()
    while pending:
        rel = pending.pop()
        if rel in seen: continue
        seen.add(rel); path = (game/rel).resolve()
        if root not in path.parents or not path.is_file():
            errors.append({'bundle': rel, 'error': 'Invalid or absent source path'}); continue
        if len(seen) > 4096:
            errors.append({'error': 'Source dependency closure exceeded 4096 bundles; not silently truncated.'}); break
        dest = output/rel; dest.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(path, dest)
        files.append({'path': rel, 'bytes': path.stat().st_size})
        try:
            for sf in env.load_rel(rel):
                for external in sf.externals:
                    name = external.path.replace('\\', '/').rsplit('/', 1)[-1].lower()
                    if 'unity_builtin' in name or 'unity default resources' in name: continue
                    source = cabs.get(name)
                    if source:
                        pending.add(Path(source).resolve().relative_to(root).as_posix())
                    elif name: missing.add(name)
        except Exception as e: errors.append({'bundle': rel, 'error': str(e)})
        if len(seen) % 20 == 0: log(f'Raw source bundles {len(seen)}; pending dependencies {len(pending)}')
    report = {'files': files, 'missingDependencies': sorted(missing), 'errors': errors}
    write(output/'source-report.json', report); return report


def check_fx(output):
    missing, indexes = [], []
    for path in output.rglob('index.json'):
        if path.parent.name == 'fx': indexes.append((path, read(path)))
    known = {key for _, index in indexes for key in (index.get('prefabs') or {})}
    for path, index in indexes:
        for key, record in (index.get('prefabs') or {}).items():
            if record.get('file') and not (path.parent/record['file']).is_file():
                missing.append({'index': str(path), 'prefab': key, 'file': record['file']})
            for ref in record.get('refs') or []:
                if ref not in known: missing.append({'index': path.relative_to(output).as_posix(), 'from': key, 'effect': ref})
    return missing


def run(kit, game, output, requested, supplied=None, installed=None, plan_only=False, log=print):
    kit, game, output = map(Path, (kit, game, output))
    if output.exists(): raise ValueError('Use a fresh output folder; previous extraction results are never overwritten.')
    for source in [game, Path(installed) if installed else None]:
        if source and (output.resolve()==source.resolve() or source.resolve() in output.resolve().parents):
            raise ValueError('Output must be outside the client/prepared view.')
    output.mkdir(parents=True); report = {'format': 'cn-new-operators', 'version': 1, 'requested': requested, 'stages': {}, 'complete': False, 'onlineTablesUsed': False}
    work = kit/'work'/('operator-run-'+time.strftime('%Y%m%d-%H%M%S')+'-'+str(time.time_ns())[-6:]); work.mkdir(parents=True)
    logs, results, warnings = [], {}, []
    def say(line):
        log(line); logs.append(str(line))
        if re.match(r'^\s*(?:warn|fail|skip \(no such)', str(line), re.I): warnings.append(str(line))
    def stage(name, fn):
        say('STAGE: '+name)
        try:
            result = fn(); results[name] = result
            report['stages'][name] = {'ok': True}
            return result
        except Exception as e:
            report['stages'][name] = {'ok': False, 'error': str(e), 'trace': traceback.format_exc()[-4000:]}; say('FAIL '+name+': '+str(e)); return None
    try:
        loaded = stage('client tables', lambda: load_tables(game, output, supplied, installed, say))
        tables, tr = loaded if loaded else ({}, {'missingRequired': sorted(REQUIRED)})
        plan = make_plan(tables, requested); write(output/'operator-plan.json', plan)
        if plan['unresolvedOperators']: say('Operators not found in decoded client tables: '+', '.join(plan['unresolvedOperators']))
        report['tableReport'] = tr; report['unresolvedOperators'] = plan['unresolvedOperators']; report['operators'] = plan['operators']; report['missingSkills'] = plan['missingSkills']; report['missingRanges'] = plan['missingRanges']; report['missingModules'] = plan['missingModules']
        if plan['operators'] and not plan_only:
            # A new standalone root restricts the existing exporter to these units; no game roster baseline is used.
            write(work/'data/chess.json', {cid: {'charId': cid, 'skills': [{'skillId': k} for k in plan['skillIds']]} for cid in plan['operators']})
            write(work/'data/tokens.json', {cid: plan['tables']['characters'][cid] for cid in plan['units'] if cid.startswith('token_')})
            for name, value in tables.items(): write(work/'.cache/gamedata/excel'/(name+'.json'), value)
            write(work/'skin-catalog.json', plan['skins']); write(work/'skin-baseline.json', {'prefabs': [], 'textures': [], 'meshes': [], 'skills': [], 'projectiles': [], 'graphics': {}})
            from recovery_models import export_models
            from skin_fx import export_skins
            from complete_skin_fx import complete
            from cn_skins import validate_payloads
            models = stage('all base, skin and token models', lambda: export_models(game, output/'models', plan['skins'], plan['units'], say)) or {}
            graph = stage('unit, skill, projectile and buff graphs', lambda: raw_graphs(game, work, output, plan, say))
            wire, extra = (graph[1], graph[2]) if graph else ({}, set())
            baseline = read(work/'skin-baseline.json')
            baseline['graphics'] = {cid: row['graphic'] for cid, row in (wire.get('units') or {}).items() if row.get('graphic')}
            write(work/'skin-baseline.json', baseline)
            if plan['skins']:
                stage('all skin FX and mount points', lambda: export_skins(game, work, output/'costumes', log=say, strict_catalog=True, jobs=1))
                stage('skin skill and projectile closure', lambda: complete(game, work, output/'costumes', output/'costume-wiring', log=say, jobs=1))
            stage('portraits, skill and module icons', lambda: export_sprites(game, output/'sprites', plan, say))
            extra.update(strings(models)); banks = select_audio(tables, plan, extra); write(output/'audio-banks.json', banks)
            stage('battle SFX and installed character voices', lambda: export_audio(game, output/'audio', banks, voice_owners(tables, plan), say))
            stage('FX file integrity', lambda: validate_payloads(output))
            # Metadata points to original bundles; include shared skills/projectiles/template roots as well.
            import fx
            seed_values = set(strings([models, results.get('all skin FX and mount points'), results.get('battle SFX and installed character voices'), wire, tr]))
            seed_values.update([fx.PROJECTILES, fx.SKILLS, fx.BUFF_TEMPLATES])
            for index_file in output.rglob('index.json'):
                if index_file.parent.name == 'fx': seed_values.update(strings(read(index_file)))
            seeds = {value for value in seed_values if isinstance(value,str) and value.lower().endswith(('.ab','.bin')) and (game/value).is_file()}
            stage('raw source bundle dependency closure', lambda: copy_sources(game, output/'source-bundles', seeds, say))
            report['missingEffectReferences'] = check_fx(output)
        report['planOnly'] = plan_only
        report['complete'] = not plan_only and bool(plan['operators']) and bool(results.get('raw source bundle dependency closure',{}).get('files')) and not report['unresolvedOperators'] and not tr['missingRequired'] and not plan['missingSkills'] and not plan['missingRanges'] and not plan['missingModules'] and all(s['ok'] for s in report['stages'].values())
        for key in ('all base, skin and token models', 'unit, skill, projectile and buff graphs', 'portraits, skill and module icons', 'battle SFX and installed character voices', 'raw source bundle dependency closure'):
            res = results.get(key)
            if isinstance(res, tuple): res = res[0]
            if isinstance(res, dict):
                problems = {k: v for k, v in res.items() if v and k in ('missingSkinModels', 'missingBaseModels', 'errors', 'missingUnits', 'missingRequired', 'missingSfx', 'missingVoiceOwners', 'missingDependencies')}
                if problems: report.setdefault('diagnostics', {})[key] = problems; report['complete'] = False
        skins = results.get('all skin FX and mount points') or {}
        if skins.get('diagnostics') or skins.get('unmatchedSkinIds'):
            report['skinDiagnostics'] = {'errors': skins.get('diagnostics'), 'unmatched': skins.get('unmatchedSkinIds')}; report['complete'] = False
        report['exportWarnings'] = warnings
        if warnings or report.get('missingEffectReferences'): report['complete'] = False
        model_rows = results.get('all base, skin and token models') or {}
        if not model_rows.get('models') and not plan_only: report['complete'] = False
    except Exception as e:
        report['fatal'] = {'error': str(e), 'trace': traceback.format_exc()[-4000:]}
        report['complete'] = False
        say('FAIL: '+str(e))
    finally:
        write(output/'operator-report.json', report)
        (output/'run.log').write_text('\n'.join(logs), encoding='utf-8')
        write(output/'files.json', [{'path': p.relative_to(output).as_posix(), 'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(output.rglob('*')) if p.is_file()])
        # Only this run's disposable root is removed. No client bundle or old output is touched.
        shutil.rmtree(work)
        from cn_skins import package
        package(output)
    say('COMPLETE' if report['complete'] else 'PARTIAL: upload every listed volume and operator-report.json; missing assets were not silently accepted.')
    return report


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--root'); p.add_argument('--client'); p.add_argument('--tables'); p.add_argument('--out')
    p.add_argument('--operator', action='append', dest='operators'); p.add_argument('--plan-only', action='store_true')
    a = p.parse_args(); kit = Path(__file__).resolve().parents[2]
    sys.path.insert(0, str(kit))
    stamp = time.strftime('%Y%m%d-%H%M%S')+'-'+str(time.time_ns())[-6:]
    if a.root: game = Path(a.root).resolve()
    elif a.client:
        from cn_skins import discover_client
        from prepare_client import prepare
        base, updates = discover_client(a.client); game = kit/'work'/('cn-client-'+stamp); prepare(base, updates, game)
    else: p.error('Specify --client (installed CN client) or --root (explicit prepared view).')
    if not game.is_dir(): p.error('Client/prepared view does not exist.')
    report = run(kit, game, Path(a.out).resolve() if a.out else kit/('cn-operators-'+stamp), a.operators or DEFAULT_TARGETS, a.tables, a.client, a.plan_only)
    if not report['complete']: raise SystemExit(2)


if __name__ == '__main__': main()
