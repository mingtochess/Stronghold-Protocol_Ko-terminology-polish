import { customFactionData } from './customFactions.js';

export const EXTENSION_CATEGORIES = Object.freeze([
  { id: 'bonds', name: '맹약' }, { id: 'stages', name: '전장' },
]);
export function isCustomStage(id, stage) {
  return id.startsWith('custom_') || stage?.customExtension === true || stage?.customExtension?.category === 'stages';
}
export function customExtensionCatalog(raw = {}) {
  return {
    bonds: [{ id: 'ursus', name: '우르수스', description: '우르수스 맹약과 오퍼레이터, 전용 장비, 카셰이 전략을 추가합니다.' }],
    stages: Object.entries(raw.stages || {}).filter(([id,s]) => isCustomStage(id,s)).map(([id,s]) => ({
      id, name: s.name || id, description: s.customExtension?.description || '선택하면 이번 게임의 전장 추첨 목록에 추가됩니다.',
    })),
  };
}
export function extensionSelectionShape(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).every(k => EXTENSION_CATEGORIES.some(c => c.id === k))
    && EXTENSION_CATEGORIES.every(c => value[c.id] === undefined || (Array.isArray(value[c.id]) && value[c.id].length <= 64
      && value[c.id].every(id => typeof id === 'string' && id.length > 0 && id.length <= 128)
      && new Set(value[c.id]).size === value[c.id].length));
}
export function normalizeCustomExtensions(value, raw, legacy = false) {
  const catalog = customExtensionCatalog(raw);
  const input = value === undefined ? { bonds: legacy ? ['ursus'] : [] } : value || {};
  return Object.fromEntries(EXTENSION_CATEGORIES.map(c => [c.id, catalog[c.id].map(e => e.id).filter(id => input[c.id]?.includes(id))]));
}
/** Isolated per-match tables: original maps remain; only selected custom maps enter the draw pool. */
export function applyCustomExtensions(raw, selection) {
  const enabled = selection.bonds.includes('ursus');
  const data = customFactionData(raw, enabled);
  const chosen = new Set(selection.stages);
  const stages = Object.fromEntries(Object.entries(raw.stages || {}).filter(([id,s]) => !isCustomStage(id,s) || chosen.has(id)));
  const modes = Object.fromEntries(Object.entries(raw.config?.modes || {}).map(([id,m]) => [id, {
    ...m, stages: [...new Set([...(m.stages || []).filter(k => stages[k]), ...selection.stages.filter(k => stages[k]
      && (!Array.isArray(stages[k].customExtension?.modeIds) || stages[k].customExtension.modeIds.includes(id)))])],
  }]));
  return { ...data, stages, config: { ...raw.config, modes } };
}
