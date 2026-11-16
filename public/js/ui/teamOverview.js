// 팀 전체 보기: one row per player — name, the active bonds (the battle bond list's item: bondStrip.js HudBond + count) and the operators on the board
// (m.public players[].bonds / lineup). Opened from the search button above the team panel in multiplayer.

import { html, Icon, Modal, Button } from './components.js';
import { useGameData, UnitThumb, PlayerAvatar } from './gameComponents.js';
import { sortedPlayers, nextThreshold } from './gameLogic.js';
import { HudBond, bondBoardProgress } from './bondStrip.js';
import { bondIconUrl } from './assetUrls.js';
import { matchData as data } from '../data.js';

const cx = (...p) => p.flat().filter(Boolean).join(' ');

/** The bonds a row shows: the active ones only, most layers first. */
export function overviewBonds(bonds) {
  return (Array.isArray(bonds) ? bonds : []).filter((b) => b && !b.off && b.active)
    .sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0) || (b.layers || 0) - (a.layers || 0));
}

export function TeamOverviewButton({ onOpen }) {
  return html`<button type="button" class="team__overview-btn" onClick=${onOpen} title="팀 전체 보기" aria-label="팀 전체 보기"><${Icon} name="search" /></button>`;
}

export function TeamOverview({ open, onClose, pub, myId }) {
  const gd = useGameData();
  if (!open) return null;
  const players = sortedPlayers(pub);
  return html`<${Modal} open=${open} title="팀 전체 보기" micro="TEAM OVERVIEW" onClose=${onClose} width="min(96vw, 13.6rem)" class="team-overview"
    actions=${html`<${Button} variant="secondary" icon="close" onClick=${onClose}>닫기<//>`}>
    <div class="tov">
      ${players.map((p) => {
        const bonds = overviewBonds(p.bonds);
        const lineup = Array.isArray(p.lineup) ? p.lineup : [];
        return html`<div key=${p.playerId} class=${cx('tov__row', p.playerId === myId && 'is-self', p.alive === false && 'is-dead')}>
          <div class="tov__who">
            <${PlayerAvatar} player=${p} self=${p.playerId === myId} size="sm" />
            <span class="tov__name">${p.name || '박사'}</span>
          </div>
          <div class="tov__bonds">
            ${bonds.length ? bonds.map((b) => {
              const rec = gd.bond(b.bondId);
              const th = Array.isArray(b.thresholds) && b.thresholds.length ? b.thresholds : rec?.thresholds || [];
              const prog = bondBoardProgress(th, b.count ?? 0, true);
              const next = nextThreshold(b.count ?? 0, th);
              return html`<div key=${b.bondId} class="bslot is-active tov__bond" data-bond=${b.bondId}>
                <${HudBond} name=${rec?.name || b.bondId} icon=${bondIconUrl(data.get('assets'), b.bondId)} layers=${rec?.noStack ? undefined : b.layers ?? 0}
                  thresholds=${prog.n} tier=${prog.t} active=${true} title=${`${rec?.name || b.bondId} ${b.count ?? 0}/${next ?? th[th.length - 1] ?? '-'}`} />
                <span class=${cx('bslot__count', 'num', next == null && 'is-max')}>${b.count ?? 0}<small>/${next ?? th[th.length - 1] ?? '-'}</small></span>
              </div>`;
            })
              : html`<span class="tov__none">—</span>`}
          </div>
          <div class="tov__lineup">
            ${lineup.length ? lineup.map((u, i) => html`<${UnitThumb} key=${i} kind="chess" id=${u.id} size="sm" badge=${u.items > 0 ? html`<span class="tov__items">${u.items}</span>` : null} />`)
              : html`<span class="tov__none">${p.alive === false ? '탈락' : '배치 없음'}</span>`}
          </div>
        </div>`;
      })}
    </div>
  <//>`;
}
