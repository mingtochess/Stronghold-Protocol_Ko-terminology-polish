// Browser stand-in for ./llmGate.js (served at /match-upstream/llmGate.js by server/http/static.js and
// scripts/start-local.mjs): the browser-local 규정 laboratory / practice (public/js/laboratory.js) never runs the
// external AI, and the real gate imports node:fs / node:path / node:url, which no browser can load.
export function llmIntegrationEnabled() { return false; }
export const llmIntegrationEnabledNow = false;
export const LLM_IGNORED_LOG = '[llm] external AI is development-only and is not in this release; ignoring the external-AI configuration and using the built-in bot';
export function noteLlmIgnored() {}
export function releaseIgnoresExternalAi() { return false; }
export const EXTERNAL_BOT = null;
export function validateExternalConfig() { throw new Error('External AI is not in this build'); }
export function createExternalAI() { return null; }
