// Kenney Interface Sounds 1.0 (CC0), pinned mirror revision.
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base = 'https://raw.githubusercontent.com/Calinou/kenney-interface-sounds/4596a49eaf5a533948d49a47467f606bcdea70ff/';
const directory = '.cache/chat-notification/general';
const clips = [
  ['notification-glass', '일반 — 맑은 유리음', 'glass_001.wav'],
  ['notification-pluck', '일반 — 짧은 현 소리', 'pluck_001.wav'],
  ['notification-confirmation', '일반 — 확인음', 'confirmation_001.wav'],
  ['notification-bong', '일반 — 낮은 종소리', 'bong_001.wav'],
];
await mkdir(directory, {recursive: true});
const files = await Promise.all(clips.map(async ([id, label, file]) => {
  const sourceUrl = `${base}addons/kenney_interface_sounds/${file}`;
  const response = await fetch(sourceUrl, {signal: AbortSignal.timeout(30000)});
  if (!response.ok) throw Error(`${file}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.subarray(0, 4).toString() !== 'RIFF') throw Error(`${file}: invalid WAV`);
  await writeFile(`${directory}/${file}`, bytes);
  console.log(`${id}: ${bytes.length} bytes`);
  return {id, label, file, sourceUrl, sha256: createHash('sha256').update(bytes).digest('hex')};
}));
const response = await fetch(`${base}LICENSE.txt`);
if (!response.ok) throw Error('License unavailable');
await mkdir('public/audio/chat-notification', {recursive:true});
const license = (await response.text()).replace(/\r/g, '').split('\n').map(line => line.trimEnd()).join('\n').trim() + '\n';
await writeFile('public/audio/chat-notification/KENNEY-LICENSE.txt', license);
await writeFile(`${directory}/sources.json`, JSON.stringify({author:'Kenney', license:'CC0-1.0',
  sourcePage:'https://kenney.nl/assets/interface-sounds', files}, null, 2) + '\n');
