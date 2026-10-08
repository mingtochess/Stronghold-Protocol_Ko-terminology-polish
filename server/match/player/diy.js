import {diyTokenOwner} from '../../../shared/diy.js';
const posIntOr=(v,d)=>Number.isInteger(v)&&v>0?v:d;
const isObj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
export function diyGameData(gd, records) {
  const view = Object.create(gd);
  const backups = isObj(gd.raw && gd.raw.backups) ? gd.raw.backups : null;
  const diyTokens = backups && isObj(backups.tokens) ? backups.tokens : {};
  const tokenOf = (id) => (typeof id === 'string' && Object.hasOwn(diyTokens, id) && isObj(diyTokens[id]) ? diyTokens[id] : null);
  Object.defineProperties(view, {
    /** the match's own GameData (the view is per player) */
    matchData: { value: gd },
    chess: { value: (id) => (typeof id === 'string' && records.has(id) ? records.get(id) : gd.chess(id)) },
    token: { value: (id) => gd.token(id) || tokenOf(id) },
    /**
     * GameData.placeableTokens for a slotted slot: the summons its record lists (the pick's skill and talents) that are
     * placeable, by the variant of the owner form (`bySkill[skillIndex]` sources) — the deploy limit as the count (PRTS
     * 卫戍协议/帮助 "根据召唤物部署数量上限（非初始持有量）"), the active module's own when its variant has one (`byModule`:
     * 望's TRP-X "可同时部署的陷阱数量提升", 6 → 7 棋子; SUM-Y stage 2+ 4 drones / summons). The data's deploy limit holds the
     * token's own talent additions (tools/build-data.mjs tokenTalentDeckBonus, 0.2.0): 麦哲伦 / 令 / 电弧 3, 白铁 2, 夜莺 3 幻影.
     */
    placeableTokens: {
      value: (chessId, loadout = null) => {
        const rec = typeof chessId === 'string' && records.has(chessId) ? records.get(chessId) : null;
        if (!rec) return gd.placeableTokens(chessId, loadout);
        const owner = diyTokenOwner(rec.charId, rec.status);
        const out = [];
        for (const tid of Array.isArray(rec.tokens) ? rec.tokens : []) {
          const t = tokenOf(tid);
          if (!t || t.kind !== 'summon' || t.placeable !== true) continue;
          const v = isObj(t.variants) ? t.variants[owner] ?? null : null;
          if (v) {
            const alt = loadout && Number.isInteger(loadout.skillIndex) && v.bySkill ? v.bySkill[loadout.skillIndex] : null;
            const src = Array.isArray(alt?.sources) ? alt.sources : Array.isArray(v.sources) ? v.sources : [];
            if (!src.includes('talent') && !src.includes('skill')) continue;
          }
          const mid = rec.module && rec.module.active ? rec.module.id : null;
          const vm = v && mid && isObj(v.byModule) ? v.byModule[mid] ?? null : null;
          out.push({ tokenId: tid, count: Math.min(posIntOr(vm?.stats?.deployLimit, posIntOr(v?.stats?.deployLimit, posIntOr(t.deployLimit, 1))), 9) });
        }
        return out;
      },
    },
  });
  return view;
}
