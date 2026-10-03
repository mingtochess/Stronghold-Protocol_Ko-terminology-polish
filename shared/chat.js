export const CHAT_MAX_LENGTH = 200;
export const CHAT_HISTORY_LIMIT = 100;
export const CHAT_COOLDOWN_MS = 1000;

export function normalizeChatText(value) {
  if (typeof value !== 'string' || value.length > CHAT_MAX_LENGTH) return '';
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
}
