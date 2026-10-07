// Player settings (BGM/SFX/voice volume, mute, damage numbers, render quality): a tiny observable store
// persisted in localStorage (`sp.pref.settings`), applied to the audio manager on every change, plus
// the settings modal.

import { GIcon } from './gameComponents.js';
import { useLayoutEffect, useState } from '../../vendor/hooks.module.js';
import { html, Modal, Button, Icon, MicroLabel } from './components.js';
import { createStore, useStore, loadPref, savePref } from '../store.js';
import { sanitizeSettings, migrateSavedSettings } from './gameLogic.js';
import { audio } from '../audio.js';
import { CHAT_NOTIFICATION_SOUNDS, defaultChatCooldown } from '../chatNotificationSounds.js';
import { openGuide } from './guide.js';
import { detectFeatures } from './device.js';
import { lang, setLang } from '../i18n/i18n.js';

/** Settings store: { bgm, sfx, voice, muted, damageNumbers, quality }. */
export const settingsStore = createStore(migrateSavedSettings(loadPref('settings', null)));

settingsStore.subscribe((s) => {
  savePref('settings', sanitizeSettings(s));
  audio.setVolumes(s);
});
savePref('settings', settingsStore.get());
audio.setVolumes(settingsStore.get());

/** @param {Partial<ReturnType<typeof sanitizeSettings>>} patch */
export function updateSettings(patch) {
  const current = settingsStore.get();
  if (patch.chatSound !== undefined) patch = {...patch, chatSoundCustomized: true};
  if (typeof patch.damageNumbers === 'boolean' && patch.damageNumberMode === undefined) patch = {...patch,damageNumberMode:patch.damageNumbers?'sum':'none'};
  const soundChanged = patch.chatSound !== undefined && patch.chatSound !== current.chatSound && patch.chatSound !== 'off';
  settingsStore.set(sanitizeSettings({ ...current, ...patch,
    ...(soundChanged ? {chatCooldown: defaultChatCooldown(patch.chatSound)} : {}) }));
}

/** Preact hook: current settings. */
export const useSettings = () => useStore((s) => s, Object.is, settingsStore);

function Slider({ label, micro, value, onInput, icon }) {
  const pct = Math.round(value * 100);
  return html`<label class="set-row">
    <span class="set-row__label"><${Icon} name=${icon} />${label}<${MicroLabel}>${micro}<//></span>
    <input class="set-range" type="range" min="0" max="100" step="5" value=${pct} style=${`--pct:${pct}%`}
      onInput=${(e) => onInput(Number(e.currentTarget.value) / 100)} />
    <span class="set-row__val num">${pct}</span>
  </label>`;
}

function Toggle({ label, micro, value, onChange, id }) {
  return html`<div class="set-row">
    <span class="set-row__label">${label}<${MicroLabel}>${micro}<//></span>
    <button id=${id} type="button" aria-label=${label} class=${`set-toggle${value ? ' is-on' : ''}`} role="switch" aria-checked=${value ? 'true' : 'false'}
      onClick=${() => onChange(!value)}><i></i><span data-i18n-ctx="toggle">${value ? '开启' : '关闭'}</span></button>
  </div>`;
}

const QUALITY = [['high', '高'], ['medium', '中'], ['low', '低']];

/**
 * Settings modal.
 * @param {{ open: boolean, onClose: Function }} props
 */
export function SettingsModal({ open, onClose }) {
  const s = useSettings();
  const [candidateSound, setCandidateSound] = useState(s.chatSound);
  useLayoutEffect(() => { setCandidateSound(s.chatSound); if (!open) audio.stopChatNotification(); }, [open, s.chatSound]);
  const [tested, setTested] = useState(false);
  const [touchUi] = useState(() => detectFeatures().coarse && !detectFeatures().fine);
  return html`<${Modal} open=${open} onClose=${onClose} title="设置" micro="SETTINGS" width="7.4rem"
    actions=${html`<${Button} variant="secondary" icon="book" class="set-guide" onClick=${() => openGuide(0)}>玩法说明<//>
      <${Button} variant="primary" icon="check" onClick=${onClose}>完成<//>`}>
    <div class="set-list">
      <${Slider} label="背景音乐" micro="BGM" icon="play" value=${s.bgm} onInput=${(v) => updateSettings({ bgm: v })} />
      <${Slider} label="오퍼레이터 음성" micro="VOICE" icon="signal" value=${s.voice} onInput=${v=>updateSettings({voice:v})} />
      <div class="set-row" data-i18n-skip><span class="set-row__label">음성 언어<${MicroLabel}>VOICE LANGUAGE<//></span><div class="set-seg" role="radiogroup">${[['kr','한국어'],['jp','日本語']].map(([id,label])=>html`<button type="button" role="radio" aria-checked=${s.voiceLanguage===id} class=${s.voiceLanguage===id?'is-on':''} onClick=${()=>updateSettings({voiceLanguage:id})}>${label}</button>`)}</div></div>
      <${Slider} label="音效" micro="SFX" icon="signal" value=${s.sfx}
        onInput=${(v) => { updateSettings({ sfx: v }); if (!tested) { setTested(true); setTimeout(() => setTested(false), 400); audio.sfx('click'); } }} />
      <${Toggle} label="静音" micro="MUTE" value=${s.muted} onChange=${(v) => updateSettings({ muted: v })} />
      <div class="set-row set-row--chat-sound" data-i18n-skip>
        <label class="set-row__label" for="chat-notification-sound">채팅 알림음<${MicroLabel}>CHAT SOUND<//></label>
        <select id="chat-notification-sound" value=${candidateSound} onChange=${e => { audio.stopChatNotification(); setCandidateSound(e.currentTarget.value); }}>
          <option value="off">끄기</option>
          ${CHAT_NOTIFICATION_SOUNDS.map(sound => html`<option key=${sound.id} value=${sound.id}>${sound.label}</option>`)}
        </select>
        <div class="set-chat-actions">
          <${Button} variant="secondary" size="sm" class="set-chat-preview" disabled=${candidateSound === 'off' || s.muted || s.chatVolume === 0}
            onClick=${() => { audio._unlock(); audio.chatNotification(candidateSound, {preview: true}); }}>미리 듣기<//>
          <${Button} variant="primary" size="sm" class="set-chat-apply" disabled=${candidateSound === s.chatSound}
            onClick=${() => { audio.stopChatNotification(); updateSettings({chatSound: candidateSound}); }}>적용<//>
        </div>
      </div>
      <div class="set-row" data-i18n-skip>
        <label class="set-row__label" for="chat-notification-cooldown">알림 대기시간<${MicroLabel}>COOLDOWN<//></label>
        <input id="chat-notification-cooldown" class="set-range" type="range" min="1" max="5" step="1" value=${s.chatCooldown}
          style=${`--pct:${(s.chatCooldown-1)/4*100}%`} onInput=${e => updateSettings({chatCooldown: Number(e.currentTarget.value)})} />
        <span class="set-row__val num">${s.chatCooldown}초</span>
      </div>
      <${Slider} label="채팅 알림음 크기" micro="CHAT VOLUME" icon="signal" value=${s.chatVolume} onInput=${v => updateSettings({chatVolume: v})} />
      <${Toggle} id="chat-faction-notifications" label="진영 선택·취소 알림" micro="FACTION NOTIFICATIONS" value=${s.chatFactionNotifications} onChange=${v => updateSettings({chatFactionNotifications: v})} />
      <p class="set-hint" data-i18n-skip>대기실과 게임에서 다른 참가자의 새 메시지를 알립니다. 후보를 미리 듣고 적용하세요. 알림음을 변경하면 대기시간이 권장값으로 초기화됩니다. 재생 중에는 알림이 겹치지 않습니다.</p>
      <div class="set-row" data-i18n-skip>
        <span class="set-row__label">대미지 표시<${MicroLabel}>DAMAGE NUMBERS<//></span>
        <div id="damage-number-mode" class="set-seg" role="radiogroup" aria-label="대미지 표시">
          ${[['none','표시 안함'],['sum','합산'],['all','모두'],['basic','기본']].map(([id,label])=>html`<button type="button" role="radio" aria-checked=${s.damageNumberMode===id?'true':'false'} class=${s.damageNumberMode===id?'is-on':''} onClick=${()=>updateSettings({damageNumberMode:id})}>${label}</button>`)}
        </div>
      </div>
      <p class="set-hint" data-i18n-skip>합산: 연속 피해를 묶어 표시 · 모두: 타격마다 표시 · 기본: 명일방주의 붉은 대미지 표시 판정(예상 피해의 1.5배 이상)을 적용합니다.</p>
      <div class="set-row">
        <span class="set-row__label">画面质量<${MicroLabel}>QUALITY<//></span>
        <div class="set-seg" role="radiogroup">
          ${QUALITY.map(([id, label]) => html`<button key=${id} type="button" role="radio" aria-checked=${s.quality === id ? 'true' : 'false'}
            class=${s.quality === id ? 'is-on' : ''} onClick=${() => updateSettings({ quality: id })}>${label}</button>`)}
        </div>
      </div>
      <div class="set-row" data-i18n-skip>
        <span class="set-row__label">${lang === 'ko' ? '언어' : '语言'}<${MicroLabel}>LANGUAGE<//></span>
        <div class="set-seg" role="radiogroup">
          ${[['ko', '한국어'], ['zh', '中文']].map(([id, label]) => html`<button key=${id} type="button" role="radio" aria-checked=${lang === id ? 'true' : 'false'}
            class=${lang === id ? 'is-on' : ''} onClick=${() => { if (lang !== id) setLang(id); }}>${label}</button>`)}
        </div>
      </div>
      ${touchUi
        ? html`<p class="set-hint">触屏操作：点击单位选中（撤退 / 出售）· 长按单位或卡牌查看详情 · 拖动部署后滑动选择朝向</p>`
        : html`<p class="set-hint">快捷键：<kbd>R</kbd> 刷新 · <kbd>F</kbd> 冻结 · <kbd>D</kbd> 升级 · <kbd>Q</kbd> 撤退选中干员 · <kbd>X</kbd> 出售选中干员 · <kbd>Space</kbd> 准备就绪 · <kbd>Esc</kbd> 关闭弹窗 · 右键查看详情</p>`}
    </div>
  <//>`;
}

/** The same settings entry for title, lobby and waiting room. */
export function SettingsButton({class: cls = ''}) {
  const [open, setOpen] = useState(false);
  return html`<span class=${`settings-entry ${cls}`}><${Button} variant="secondary" size="sm" square=${true} aria-label="设置" title="设置" onClick=${() => setOpen(true)}><${GIcon} name="gear" /><//><${SettingsModal} open=${open} onClose=${() => setOpen(false)} /></span>`;
}
