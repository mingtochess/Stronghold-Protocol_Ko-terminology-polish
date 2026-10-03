export const GAME_INSTANCE = 'stronghold-main';
export function gameStub(namespace) {
  return namespace.get(namespace.idFromName(GAME_INSTANCE), { locationHint: 'apac-ne' });
}
export function isGameRequest(path) {
  return path === '/ws' || path === '/healthz' || path === '/data.js' ||
    ['/data/', '/shared/', '/sim/'].some(prefix => path.startsWith(prefix));
}
