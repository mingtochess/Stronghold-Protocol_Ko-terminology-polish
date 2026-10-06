// Collect unedited JP source lines; trimming and playback integration are separate steps.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { RAW } from './assets/sources.mjs';

const directory = 'public/assets/audio/chat-notification/originals';
const tableUrl = 'https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData_YoStar/main/ja_JP/gamedata/excel/charword_table.json';
const table = await readFile('.cache/chat-notification/charword-ja.json', 'utf8').then(JSON.parse).catch(async () => {
  const response = await fetch(tableUrl, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Voice table: HTTP ${response.status}`);
  return response.json();
});
const candidates = [
  ['kroos-kokodayo', '크루스 — 코코다요', 'char_124_kroos', 'CN_026', false],
  ['melantha-etto', '멜란사 — 에또', 'char_208_melan', 'CN_011', true],
  ['swire-gao', '스와이어 — 갸오', 'char_308_swire', 'CN_042', true],
  ['exusiai-apple-pie', '엑시아 — 애플파이', 'char_103_angel', 'CN_028', false],
  ['exusiai-alter-char-siu-apple-pie', '신시아 — 차슈 애플파이', 'char_1041_angel2', 'CN_028', false],
  ['ceobe-dadada', '케오베 — 다다다', 'char_2013_cerber', 'CN_027', false],
];
await mkdir(directory, { recursive: true });
const files = await Promise.all(candidates.map(async ([id, label, charId, voiceId, needsExcerpt]) => {
  const line = Object.values(table.charWords).find(e => e.charId === charId && e.wordKey === charId && e.voiceId === voiceId);
  if (!line) throw new Error(`Missing voice metadata: ${id}`);
  const sourceUrl = `${RAW.aa2voice}voice/${line.voiceAsset.toLowerCase()}.mp3`;
  const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const hasMp3Header = bytes.subarray(0, 3).toString() === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  if (bytes.length < 1000 || !hasMp3Header) throw new Error(`${id}: invalid MP3 response`);
  const path = `${directory}/${id}.mp3`;
  await writeFile(path, bytes);
  console.log(`${id}: ${bytes.length} bytes`);
  return { id, label, language: 'ja', charId, voiceId, title: line.voiceTitle, transcript: line.voiceText,
    sourceUrl, path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
    unedited: true, needsExcerpt };
}));
await writeFile(`${directory}/sources.json`, JSON.stringify({ collectedAt: new Date().toISOString(), tableUrl,
  note: 'Original game voice lines, unedited. Melantha and Swire require excerpts; Ceobe may be shortened. Copyright remains with the original rights holders.', files }, null, 2) + '\n');
