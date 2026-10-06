import { useEffect, useState } from '../../vendor/hooks.module.js';
import { html, Button, Modal, MicroLabel } from './components.js';
import { EXTENSION_CATEGORIES } from '../../../shared/customExtensions.js';

export function CustomExtensionsDialog({ open, room, isHost, disabled, onClose, onSave }) {
  const [tab,setTab] = useState('bonds');
  const [draft,setDraft] = useState({ bonds: [], stages: [] });
  useEffect(() => {
    if (open) setDraft(room.customExtensions || { bonds: room.customFactions ? ['ursus'] : [], stages: [] });
  }, [open,room.code,isHost]);
  useEffect(() => {
    if (open && !isHost) setDraft(room.customExtensions || {bonds:room.customFactions ? ['ursus'] : [],stages:[]});
  }, [open,isHost,room.customExtensions,room.customFactions]);
  const catalog = room.customExtensionCatalog || { bonds: [{ id:'ursus',name:'우르수스',description:'우르수스 맹약과 오퍼레이터, 전용 장비, 카셰이 전략을 추가합니다.' }], stages: [] };
  const toggle = id => setDraft(old => ({ ...old, [tab]: (old[tab] || []).includes(id) ? old[tab].filter(x => x !== id) : [...(old[tab] || []),id] }));
  return html`<${Modal} open=${open} title="커스텀 확장 설정" micro="CUSTOM EXTENSIONS" class="custom-ext" width="min(7rem,94vw)" onClose=${onClose}
    actions=${html`<${Button} variant="secondary" onClick=${onClose} disabled=${disabled}>${isHost ? '취소' : '닫기'}<//>
      ${isHost ? html`<${Button} variant="primary" disabled=${disabled} onClick=${()=>onSave(draft)}>적용<//>` : null}`}>
    <p class="custom-ext__hint">${isHost ? '이번 게임에 추가할 확장을 선택하세요. 기본 콘텐츠는 유지됩니다.' : '방장이 선택한 확장이 모든 참가자에게 동일하게 적용됩니다.'}</p>
    <div class="custom-ext__tabs" role="tablist" aria-label="확장 분류">
      ${EXTENSION_CATEGORIES.map(c => html`<button type="button" role="tab" id=${'ext-tab-'+c.id} aria-controls=${'ext-panel-'+c.id} aria-selected=${tab===c.id} class=${tab===c.id?'is-active':''} onClick=${()=>setTab(c.id)}>
        ${c.name}<span class="num">${(draft[c.id] || []).length}</span></button>`)}
    </div>
    <section class="custom-ext__panel" role="tabpanel" id=${'ext-panel-'+tab} aria-labelledby=${'ext-tab-'+tab}>
      <${MicroLabel}>${tab==='bonds'?'CUSTOM BONDS':'CUSTOM BATTLEFIELDS'}<//>
      ${(catalog[tab] || []).length ? (catalog[tab] || []).map(e => html`<label key=${e.id} class=${`custom-ext__card${(draft[tab] || []).includes(e.id)?' is-selected':''}`}>
        <input type="checkbox" checked=${(draft[tab] || []).includes(e.id)} disabled=${disabled || !isHost} onChange=${()=>toggle(e.id)} />
        <span><strong>${e.name}</strong><small>${e.description}</small></span>
      </label>`) : html`<p class="custom-ext__empty">등록된 커스텀 전장이 없습니다.</p>`}
    </section>
  <//>`;
}
