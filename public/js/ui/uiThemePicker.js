// ui/uiThemePicker.js — the title screen's UI 테마 button (ui/uiThemes.js): it names the current theme and opens a
// dialog of every theme by group (기본 · 스타일 · 통합전략 · 진영), each a swatch card. A pick applies at once; a theme
// with images asks first (their size) and downloads them; refused or failed, it stays on its CSS-only look.
import { t } from '../../../shared/i18n.js';
import { html, confirmDialog, MicroLabel, Modal, Button } from './components.js';
import { settingsStore, updateSettings } from './settings.js';
import { useStore } from '../store.js';
import { UI_THEME_LIST, UI_THEME_GROUPS, uiTheme, themeAssetsReady, themeDownloadBytes, downloadThemeAssets, applyUiTheme } from './uiThemes.js';
import { toast } from './toasts.js';
import { useState } from '../../vendor/hooks.module.js';

const mb = (b) => (b / 1048576).toFixed(b >= 10485760 ? 0 : 1);

async function pickTheme(id, setBusy) {
  updateSettings({ uiTheme: id }, { skipDownloadPrompt: true });
  const bytes = themeDownloadBytes(id);
  if (!bytes || themeAssetsReady(id)) return;
  const ok = await confirmDialog({
    title: t('테마 리소스 다운로드'), micro: 'THEME RESOURCES',
    text: t('이 테마는 배경 이미지를 사용합니다. 약 {mb} MB를 내려받을까요? 내려받지 않으면 이미지 없이 표시됩니다.', { mb: mb(bytes) }),
    okText: t('다운로드'), cancelText: t('나중에'),
  });
  if (!ok) return;
  setBusy(id);
  try {
    await downloadThemeAssets(id);
    applyUiTheme(settingsStore.get().uiTheme);
    toast(t('테마 리소스를 내려받았습니다.'), 'success');
  } catch {
    toast(t('테마 리소스를 내려받지 못했습니다. 이미지 없이 표시합니다.'), 'error');
  } finally { setBusy(null); }
}

export function UiThemePicker() {
  const current = useStore((s) => s.uiTheme, Object.is, settingsStore);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null);
  const cur = uiTheme(current);
  return html`<div class="ui-theme-picker">
    <button type="button" class="ui-theme-open" data-testid="ui-theme-open" onClick=${() => setOpen(true)}>
      <span class="ui-theme-chip__swatch" style=${`--sw-a:${cur.swatch[0]};--sw-b:${cur.swatch[1]}`}></span>
      <span class="ui-theme-open__label">${t('UI 테마')}<${MicroLabel}>UI THEME<//></span>
      <b class="ui-theme-open__name">${t(cur.name)}</b>
    </button>
    <${Modal} open=${open} title=${t('UI 테마')} micro="UI THEME" onClose=${() => setOpen(false)} width=${760}
      actions=${html`<${Button} variant="primary" onClick=${() => setOpen(false)}>${t('닫기')}<//>`}>
      <p class="ui-theme-note">${t('메뉴·HUD·상점·맹약 목록 등 화면 UI가 바뀝니다. 전장·유닛·이펙트·HP 바는 바뀌지 않습니다.')}</p>
      ${UI_THEME_GROUPS.map((g) => html`<section key=${g.id} class="ui-theme-group">
        <h4 class="ui-theme-group__name">${t(g.name)}</h4>
        <div class="ui-theme-picker__list" role="radiogroup" aria-label=${t(g.name)}>
          ${UI_THEME_LIST.filter((th) => th.group === g.id).map((th) => html`<button key=${th.id} type="button" role="radio" aria-checked=${current === th.id}
            class=${`ui-theme-chip${current === th.id ? ' is-on' : ''}${busy === th.id ? ' is-busy' : ''}`} data-theme-id=${th.id}
            onClick=${() => pickTheme(th.id, setBusy)} title=${t(th.name)}>
            <span class="ui-theme-chip__swatch" style=${`--sw-a:${th.swatch[0]};--sw-b:${th.swatch[1]}`}></span>
            <span class="ui-theme-chip__name">${t(th.name)}</span>
          </button>`)}
        </div>
      </section>`)}
    <//>
  </div>`;
}
