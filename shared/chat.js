export const CHAT_MAX_LENGTH = 200;
export const CHAT_HISTORY_LIMIT = 100;
export const CHAT_COOLDOWN_MS = 1000;
export const CHAT_FACTIONS = Object.freeze([
  { name: '염국', color: '#ff3b42' },
  { name: '사르곤', color: '#b87850' },
  { name: '빅토리아', color: '#ff782f' },
  { name: '쉐라그', color: '#43acec' },
  { name: '라테라노', color: '#ff4d91' },
  { name: '에기르', color: '#009fb2' },
  { name: '시라쿠사', color: '#4776df' },
  { name: '카시미어', color: '#d8b400' },
].map(Object.freeze));
export const chatFaction = (name) => CHAT_FACTIONS.find((f) => f.name === name) || null;

export function normalizeChatText(value) {
  if (typeof value !== 'string' || value.length > CHAT_MAX_LENGTH) return '';
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
}
