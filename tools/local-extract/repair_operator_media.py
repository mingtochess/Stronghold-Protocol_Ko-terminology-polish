"""Extract missing operator audio/icons from an existing run, without repeating models/FX."""
import argparse
from pathlib import Path
import time

from new_operators import TABLES, read, write, make_plan, export_sprites, export_audio, voice_owners
from package_operators import package


def repair(result, game=None, output=None, log=print):
    result = Path(result).resolve()
    if not (result/'operator-report.json').is_file(): raise ValueError('Choose the original cn-operators-* result folder.')
    if game is None:
        if not result.name.startswith('cn-operators-'): raise ValueError('Renamed result folder: specify --client-view explicitly.')
        # Match this run exactly. Never silently pick an unrelated/latest work folder.
        game = result.parent/'work'/result.name.replace('cn-operators-', 'cn-client-', 1)
    game = Path(game).resolve()
    if not game.is_dir(): raise ValueError('Matching prepared client folder is absent. Specify --client-view with the original work/cn-client-* folder.')
    original = read(result/'operator-report.json')
    tables = {name: read(result/'tables/client'/(name+'.json')) for name in TABLES if (result/'tables/client'/(name+'.json')).is_file()}
    plan = make_plan(tables, original['requested'])
    if plan['unresolvedOperators']: raise ValueError('Original result is missing required operator tables.')
    output = Path(output).resolve() if output else result.parent/('cn-operators-media-'+time.strftime('%Y%m%d-%H%M%S')+'-'+str(time.time_ns())[-6:])
    if output.exists(): raise ValueError('Use a new output folder; original results are not overwritten.')
    if any(output == root or root in output.parents for root in (game, result)):
        raise ValueError('Follow-up output must be outside the client and original result folder.')
    output.mkdir(parents=True)
    report = {'format': 'cn-operator-media-followup', 'complete': False, 'originalResult': result.name,
              'operators': plan['operators'], 'stages': {}, 'note': 'Merge with original result; models and FX were not re-extracted.'}
    try:
        write(output/'operator-plan.json', plan)
        banks = read(result/'audio-banks.json')
        log('STAGE: missing skill/module icons')
        icons = export_sprites(game, output/'sprites', plan, log)
        report['stages']['icons'] = {'missingRequired': icons['missingRequired'], 'errors': icons['errors']}
        owners = voice_owners(tables, plan)
        log('STAGE: battle SFX and voices; expected speakers: '+', '.join(sorted(owners)))
        audio = export_audio(game, output/'audio', banks, owners, log)
        report['stages']['audio'] = {k: audio[k] for k in ('missingSfx', 'missingVoiceOwners', 'errors')}
        report['counts'] = {'sprites': len(icons['sprites']), 'audioFiles': len(audio['files'])}
        report['complete'] = not any(v for stage in report['stages'].values() for v in stage.values())
    except Exception as e:
        report['error'] = str(e)
        log('FAIL: '+str(e))
    finally:
        write(output/'operator-report.json', report)
        package(output)
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('result', help='Original completed cn-operators-* folder')
    parser.add_argument('--client-view', help='Exact original prepared client folder if not found automatically')
    parser.add_argument('--out')
    args = parser.parse_args()
    report = repair(args.result, args.client_view, args.out)
    if not report['complete']: raise SystemExit(2)
