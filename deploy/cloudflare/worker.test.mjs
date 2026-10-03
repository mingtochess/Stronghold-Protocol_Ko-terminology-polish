import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gameStub, isGameRequest } from './routing.mjs';

test('all players and health checks address the same game process with a Northeast Asia hint', () => {
  const calls = [];
  const stub = { fetch() {} };
  const namespace = {
    idFromName(name) { calls.push(name); return name; },
    get(id, options) { calls.push({ id, ...options }); return stub; },
  };
  assert.equal(gameStub(namespace), stub);
  assert.equal(gameStub(namespace), stub);
  assert.equal(calls[0], calls[2]);
  assert.equal(calls[1].locationHint, 'apac-ne');
});

test('WebSocket, simulation, shared modules and game data reach the Node server; art stays off it', () => {
  for (const path of ['/ws', '/healthz', '/data.js', '/sim/Battle.js', '/data/config.json', '/shared/constants.js']) assert.ok(isGameRequest(path), path);
  for (const path of ['/', '/resource-worker.js', '/assets/char/a.png', '/vendor/browser-resources.json', '/js/main.js']) assert.equal(isGameRequest(path), false, path);
});
