"""Trim the collected Japanese lines and normalize their loudness with FFmpeg.

Run with --ffmpeg PATH. Original MP3s are preserved. No speed/pitch changes.
"""
import argparse
import json
import pathlib
import re
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--ffmpeg', required=True)
args = parser.parse_args()
root = pathlib.Path(__file__).resolve().parent.parent
sources = root / 'public/assets/audio/chat-notification/originals'
output = root / 'public/audio/chat-notification'
output.mkdir(parents=True, exist_ok=True)
cuts = {
    'kroos-kokodayo': (0, 2.9),
    'melantha-etto': (0, .8),
    'swire-gao': (1.1, 2.65),
    'exusiai-apple-pie': (0, .95),
    'exusiai-alter-char-siu-apple-pie': (0, 2.16),
    'ceobe-dadada': (0, .92),
}

def run(*flags):
    return subprocess.run([args.ffmpeg, '-hide_banner', '-nostdin', *map(str, flags)],
                          check=True, capture_output=True, text=True).stderr

records = []
for source in json.loads((sources / 'sources.json').read_text(encoding='utf8'))['files']:
    key = source['id']
    start, end = cuts[key]
    trim = f'atrim=start={start}:end={end},asetpts=PTS-STARTPTS'
    analysis = run('-i', sources / f'{key}.mp3', '-af',
                   trim + ',loudnorm=I=-18:TP=-2:LRA=7:print_format=json', '-f', 'null', '-')
    measured = json.loads(re.search(r'\{\s*"input_i".*?\}', analysis, re.S).group())
    if measured['input_i'] == '-inf':
        raise RuntimeError(f'{key}: clip is too short for loudness measurement')
    norm = ('loudnorm=I=-18:TP=-2:LRA=7:linear=true'
            f':measured_I={measured["input_i"]}:measured_TP={measured["input_tp"]}'
            f':measured_LRA={measured["input_lra"]}:measured_thresh={measured["input_thresh"]}'
            f':offset={measured["target_offset"]}')
    run('-y', '-i', sources / f'{key}.mp3', '-af', trim + ',' + norm +
        f',afade=t=in:d=0.005,afade=t=out:st={end-start-.025}:d=0.025',
        '-ar', '44100', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '128k', output / f'{key}.mp3')
    check = run('-i', output / f'{key}.mp3', '-af',
                'loudnorm=I=-18:TP=-2:LRA=7:print_format=json', '-f', 'null', '-')
    verified = json.loads(re.search(r'\{\s*"input_i".*?\}', check, re.S).group())
    records.append({'id': key, 'label': source['label'], 'sourceUrl': source['sourceUrl'],
                    'sourceSha256': source['sha256'], 'startSeconds': start, 'endSeconds': end,
                    'durationSeconds': round(end-start, 3), 'loudnessLUFS': float(verified['input_i']),
                    'truePeakDBTP': float(verified['input_tp']), 'path': f'/audio/chat-notification/{key}.mp3'})
    print(key, records[-1]['durationSeconds'], 's', verified['input_i'], 'LUFS', verified['input_tp'], 'dBTP')
(output / 'processing.json').write_text(json.dumps({'targetLUFS': -18, 'truePeakCeilingDBTP': -2,
    'clips': records}, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
