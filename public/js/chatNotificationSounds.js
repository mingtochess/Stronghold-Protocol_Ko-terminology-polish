// Per-sound recommendations initialize the single user-controlled cooldown setting.
export const CHAT_NOTIFICATION_SOUNDS = Object.freeze([
  { id: 'emote', label: '일반 — 이모티콘 효과음', durationMs: 527 },
  { id: 'notification-glass', label: '일반 — 맑은 유리음', durationMs: 292 },
  { id: 'notification-pluck', label: '일반 — 짧은 현 소리', durationMs: 112 },
  { id: 'notification-confirmation', label: '일반 — 확인음', durationMs: 295 },
  { id: 'notification-bong', label: '일반 — 낮은 종소리', durationMs: 132 },
  { id: 'kroos-kokodayo', label: '크루스 — 코코다요', durationMs: 2900 },
  { id: 'melantha-etto', label: '멜란사 — 에또', durationMs: 800 },
  { id: 'swire-gao', label: '스와이어 — 갸오', durationMs: 1550 },
  { id: 'exusiai-apple-pie', label: '엑시아 — 애플파이', durationMs: 950 },
  { id: 'exusiai-alter-char-siu-apple-pie', label: '신시아 — 차슈 애플파이', durationMs: 2160 },
  { id: 'ceobe-dadada', label: '케오베 — 다다다', durationMs: 920 },
]);
export const chatNotificationSound = id => CHAT_NOTIFICATION_SOUNDS.find(sound => sound.id === id);
export const defaultChatCooldown = id => Math.round((chatNotificationSound(id)?.durationMs ?? 292) / 1000) + 1;
