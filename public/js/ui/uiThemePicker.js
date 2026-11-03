// ui/uiThemePicker.js — the title screen's UI 테마 row (ui/uiThemes.js): a swatch button per theme. A theme with images
// asks first (their size) and downloads them; refused or failed, it stays on its CSS-only look.
import { t } from '../../../shared/i18n.js';
import { html, confirmDialog, MicroLabel } from './components.js';
import { settingsStore, updateSettings } from './settings.js';
import { useStore } from '../store.js';
import { UI_THEME_LIST, themeAssetsReady, themeDownloadBytes, downloadThemeAssets, applyUiTheme } from './uiThemes.js';
import { toast } from './toasts.js';
import { useState } from '../../vendor/hooks.module.js';

const mb = (b) => (b / 1048576).toFixed(b >= 10485760 ? 0 : 1);

export function UiThemePicker() {
  const current = useStore((s) => s.uiTheme, Object.is, settingsStore);
  const [busy, setBusy] = useState(null);
  const pick = async (id) => {
    if (busy) return;
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
    } catch (e) {
      toast(t('테마 리소스를 내려받지 못했습니다. 이미지 없이 표시합니다.'), 'error');
    } finally { setBusy(null); }
  };
  return html`<div class="ui-theme-picker" role="radiogroup" aria-label=${t('UI 테마')}>
    <span class="ui-theme-picker__label">${t('UI 테마')}<${MicroLabel}>UI THEME<//></span>
    <div class="ui-theme-picker__list">
      ${UI_THEME_LIST.map((th) => html`<button key=${th.id} type="button" role="radio" aria-checked=${current === th.id}
        class=${`ui-theme-chip${current === th.id ? ' is-on' : ''}${busy === th.id ? ' is-busy' : ''}`} data-theme-id=${th.id}
        onClick=${() => pick(th.id)} title=${t(th.name)}>
        <span class="ui-theme-chip__swatch" style=${`--sw-a:${th.swatch[0]};--sw-b:${th.swatch[1]}`}></span>
        <span class="ui-theme-chip__name">${t(th.name)}</span>
      </button>`)}
    </div>
  </div>`;
}
