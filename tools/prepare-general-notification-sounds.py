"""Normalize CC0 Kenney alerts. Silence padding permits measuring very short cues."""
import argparse
import json
import math
import pathlib
import re
import subprocess
import wave

parser = argparse.ArgumentParser()
parser.add_argument('--ffmpeg', required=True)
args = parser.parse_args()
root = pathlib.Path(__file__).resolve().parent.parent
source = root / '.cache/chat-notification/general'
output = root / 'public/audio/chat-notification'
target = -18.4

def run(*flags):
    return subprocess.run([args.ffmpeg, '-hide_banner', '-nostdin', *map(str, flags)],
                          check=True, capture_output=True, text=True).stderr

def measure(file):
    log = run('-i', file, '-af', 'apad=pad_dur=1,loudnorm=I=-18.4:TP=-2:LRA=7:print_format=json', '-f', 'null', '-')
    return json.loads(re.search(r'\{\s*"input_i".*?\}', log, re.S).group())

metadata = json.loads((source / 'sources.json').read_text(encoding='utf8'))
for item in metadata['files']:
    original = source / item['file']
    with wave.open(str(original)) as wav:
        duration = wav.getnframes() / wav.getframerate()
    levels = measure(original)
    loudness, peak = float(levels['input_i']), float(levels['input_tp'])
    if not math.isfinite(loudness):
        raise ValueError(f'{item["id"]}: invalid measured loudness')
    # Leave headroom for MP3 encoding; cap gain so a short transient cannot clip.
    gain = min(target - loudness, -2.5 - peak)
    dest = output / f'{item["id"]}.mp3'
    run('-y', '-i', original, '-af', f'volume={gain}dB,afade=t=out:st={max(0,duration-.015)}:d=0.015',
        '-ar', '44100', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '128k', dest)
    verified = measure(dest)
    # MP3 encoding and stereo-to-mono conversion can change the true peak.
    # Re-encode from the lossless original with reduced gain if necessary.
    for _ in range(3):
        if float(verified['input_tp']) <= -2:
            break
        gain -= float(verified['input_tp']) + 2.5
        run('-y', '-i', original, '-af', f'volume={gain}dB,afade=t=out:st={max(0,duration-.015)}:d=0.015',
            '-ar', '44100', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '128k', dest)
        verified = measure(dest)
    if float(verified['input_tp']) > -2:
        raise ValueError(f'{item["id"]}: encoded true peak exceeds ceiling')
    item.update({'path':f'/audio/chat-notification/{item["id"]}.mp3', 'durationSeconds':round(duration,6),
                 'loudnessLUFS':float(verified['input_i']), 'truePeakDBTP':float(verified['input_tp']),
                 'gainDB':round(gain,3)})
    print(item['id'], round(duration,3), 's', verified['input_i'], 'LUFS', verified['input_tp'], 'dBTP')
metadata.update({'targetLUFS':target, 'measurement':'1 second silence padding for sub-400ms cues; peak headroom takes precedence'})
(output / 'general-processing.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2)+'\n', encoding='utf8')
