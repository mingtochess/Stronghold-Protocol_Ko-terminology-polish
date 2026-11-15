// 선발 선택 — RECRUIT_PICK (맹약, shared/recruitPick.js), the same as 규정 선택자편 (screens/diyCheck.js): the player's
// candidates (up to 6 per tier, set in 선발 설정) by tier, opening on the server's timeout default (the first legal
// candidates of each tier, up to 2). A banned candidate is grey. 선택 완료 confirms once (g.recruitPick { picks,
// ready: true }); confirming none brings none. Only the picked operators appear in the player's recruits and rewards.

import { useState } from '../../vendor/hooks.module.js';
import { html, Button, Icon, MicroLabel } from '../ui/components.js';
import { useGameData, UnitThumb, PlayerAvatar } from '../ui/gameComponents.js';
import { StepHeader, ExitModal } from '../ui/matchChrome.js';
import { ChatPanel } from '../ui/chat.js';
import { sortedPlayers, phaseTotalSeconds } from '../ui/gameLogic.js';
import { actions } from '../ui/gameActions.js';
import { useStore } from '../store.js';
import { RECRUIT_PICKS, RECRUIT_TIERS, checkRecruitPicks, defaultRecruitPicks } from '../../../shared/recruitPick.js';
import { t } from '../../../shared/i18n.js';

const cx = (...p) => p.flat().filter(Boolean).join(' ');

/** Toggle `id` in `picks` when the result is still a valid pick list (else the list unchanged). */
export function togglePick(picks, id, candidates, getChess) {
  const next = picks.includes(id) ? picks.filter((x) => x !== id) : [...picks, id];
  return checkRecruitPicks(next, candidates, getChess).ok ? next : picks;
}

export function RecruitPickScreen() {
  const pub = useStore((s) => s.match.public);
  const priv = useStore((s) => s.match.private);
  const myId = useStore((s) => s.me.playerId);
  const solo = useStore((s) => s.room?.mode === 'solo');
  const gd = useGameData();
  const [exit, setExit] = useState(false);
  const [busy, setBusy] = useState(false);
  // null: untouched, so the shown selection is the server's timeout default
  const [picked, setPicked] = useState(null);
  if (!pub) return null;
  const candidates = Array.isArray(priv?.recruit?.candidates) ? priv.recruit.candidates : [];
  const banned = new Set(Array.isArray(priv?.recruit?.banned) ? priv.recruit.banned : []);
  const allowed = candidates.filter((id) => !banned.has(id));
  const getChess = (id) => gd.chess(id);
  const confirmed = priv?.recruit?.ready ? (Array.isArray(priv?.selectedRecruits) ? priv.selectedRecruits : []) : null;
  const shown = confirmed ?? picked ?? defaultRecruitPicks(candidates, getChess, banned);
  const canEdit = confirmed == null && !busy;
  const tap = (id) => {
    if (!canEdit || banned.has(id)) return;
    const next = togglePick(shown, id, allowed, getChess);
    if (next !== shown) setPicked(next);
  };
  const confirm = async () => {
    setBusy(true);
    await actions.recruitPick(shown, true);
    setBusy(false);
  };
  const players = sortedPlayers(pub);
  return html`<div class="screen rsel">
    <div class="brief__bg" aria-hidden="true"></div>
    <${StepHeader} step=${3} of=${3} title=${t('선발 설정')} micro="CUSTOM // CHECK" pub=${pub}
      total=${phaseTotalSeconds(pub, gd.config) ?? 30} onExit=${() => setExit(true)} />
    <main class="rsel__main">
      <aside class="rsel__players" aria-label=${t('참가자')}>
        ${players.map((p) => html`<div key=${p.playerId} class=${cx('rsel__player', p.playerId === myId && 'is-self')}>
          <${PlayerAvatar} player=${p} self=${p.playerId === myId} size="sm" />
          <span class="rsel__pname">${p.name || t('박사')}</span>
          ${p.status === 'ready' ? html`<span class="rsel__state is-done"><${Icon} name="check" />${t('완료')}</span>` : html`<span class="rsel__state">${t('선택 중…')}</span>`}
        </div>`)}
      </aside>
      <section class="rsel__body">
        <p class="rsel__hint"><${Icon} name="info" /><span>${t('선발한 오퍼레이터 중 이번 시뮬레이션에 데려갈 오퍼레이터를 티어별로 고릅니다. 아무도 고르지 않으면 선발 오퍼레이터 없이 진행합니다.')}</span></p>
        ${!candidates.length ? html`<p class="t-dim">${t('선발한 오퍼레이터가 없습니다. 확인을 누르면 진행합니다.')}</p>` : RECRUIT_TIERS.map((tier) => {
          const list = candidates.filter((id) => getChess(id)?.tier === tier);
          if (!list.length) return null;
          const n = shown.filter((id) => getChess(id)?.tier === tier).length;
          return html`<div key=${tier} class="rsel__tier">
            <h2 class="brief-h"><span>${t('티어')} ${tier}</span><b class="num rsel__count">${n}/${RECRUIT_PICKS}</b><${MicroLabel}>TIER ${tier}<//></h2>
            <div class="rsel__grid" role="listbox" aria-multiselectable="true">
              ${list.map((id) => {
                const on = shown.includes(id);
                const grey = banned.has(id);
                const full = !on && togglePick(shown, id, allowed, getChess) === shown;
                return html`<button key=${id} type="button" role="option" aria-selected=${on} disabled=${!canEdit || grey || full}
                    class=${cx('rsel__card', on && 'is-on', (grey || full) && 'is-full')} onClick=${() => tap(id)}
                    title=${grey ? t('금지된 맹약의 오퍼레이터입니다') : null}>
                  <${UnitThumb} kind="chess" id=${id} size="lg" />
                  <span class="rsel__name">${getChess(id)?.name || id}</span>
                  ${on ? html`<span class="rsel__mark"><${Icon} name="check" /></span>` : null}
                </button>`;
              })}
            </div>
          </div>`;
        })}
      </section>
    </main>
    <footer class="rsel__foot">
      ${confirmed ? html`<span class="rsel__state is-done"><${Icon} name="check" />${t('완료')}</span>`
        : html`<${Button} variant="primary" size="lg" icon="check" disabled=${busy} onClick=${confirm}>${t('선택 완료')}<//>`}
    </footer>
    ${solo ? null : html`<${ChatPanel} />`}
    <${ExitModal} open=${exit} onClose=${() => setExit(false)} solo=${solo} />
  </div>`;
}
