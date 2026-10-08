import {MAP_PREVIEWS} from './mapPreviews.js';
import {bondIconUrl,bandIconUrl,enemyIconUrl} from './assetUrls.js';
import {loadExtensionPresets,saveExtensionPresets,copyExtensionSelection,resolveExtensionPreset} from './customExtensionPresets.js';
import {data} from '../data.js';
import { useEffect, useState } from '../../vendor/hooks.module.js';
import { html, Button, Modal, Fragment, Icon } from './components.js';
import { EXTENSION_CATEGORIES,validateExtensionMinimums } from '../../../shared/customExtensions.js';


export function stageDifficultyLabels(stage) {
 const modes=stage?.modes||[];
 const labels=[['funny','표준'],['normal','험지'],['hard','극한'],['abyss','초월'],['training','훈련']];
 return labels.filter(([key])=>modes.some(mode=>mode.includes(key))).map(([,label])=>label);
}
const CATEGORY_ICONS={bonds:'shield',stages:'map',disabledBonds:'shield',disabledStages:'map',disabledBosses:'sword',disabledBands:'crown'};
function ExtensionArt({tab,entry,tables}) {
  const manifest=tables?.assets;
  const url=tab==='bonds'||tab==='disabledBonds'?bondIconUrl(manifest,entry.id==='ursus'?'ursusShip':entry.id):tab==='disabledBands'?bandIconUrl(manifest,entry.id):tab==='disabledBosses'?enemyIconUrl(manifest,tables?.bosses?.[entry.id]?.enemyKey):null;
  if(tab==='stages'||tab==='disabledStages')return html`<span class="extension-art extension-art--map" aria-hidden="true">${MAP_PREVIEWS[entry.id]?html`<img src=${MAP_PREVIEWS[entry.id]} alt="" loading="lazy" onError=${e=>{e.currentTarget.hidden=true;}}/>`:html`<${Icon} name="map" />`}</span>`;
  return html`<span class=${`extension-art extension-art--${tab}`} aria-hidden="true">${url?html`<img src=${url} alt="" onError=${e=>{e.currentTarget.hidden=true;}}/>`:html`<${Icon} name=${CATEGORY_ICONS[tab]} />`}</span>`;
}

export function CustomExtensionsDialog({ open, room, isHost, disabled, onClose, onSave }) {
  const [tab,setTab] = useState('bonds');
  const [query,setQuery]=useState('');
  const [presets,setPresets]=useState(loadExtensionPresets),[presetId,setPresetId]=useState(''),[presetName,setPresetName]=useState('');
  useEffect(()=>{if(open)setPresets(loadExtensionPresets());},[open]);
  const [tables,setTables]=useState(null),[loadError,setLoadError]=useState('');
  useEffect(()=>{if(!open)return;let live=true;setTables(null);setLoadError('');const names=['chess','bonds','items','bands','bosses','stages','config','enemies','assets'];Promise.all(names.map(k=>data.load(k))).then(()=>{if(live)setTables(Object.fromEntries(names.map(k=>[k,data.get(k)])));}).catch(()=>{if(live)setLoadError('목록을 불러오지 못했습니다. 창을 다시 열어주세요.');});return()=>{live=false;};},[open]);
  const [draft,setDraft] = useState({ bonds: [], stages: [] });
  const errors=tables?validateExtensionMinimums(tables,draft,{mode:room.mode,difficulty:room.difficulty}):[];
  useEffect(() => {
    if (open) setDraft(room.customExtensions || { bonds: room.customFactions ? ['ursus'] : [], stages: [] });
  }, [open,room.code,isHost]);
  useEffect(() => {
    if (open && !isHost) setDraft(room.customExtensions || {bonds:room.customFactions ? ['ursus'] : [],stages:[]});
  }, [open,isHost,room.customExtensions,room.customFactions]);
  const catalog = room.customExtensionCatalog || { bonds: [{ id:'ursus',name:'우르수스',description:'우르수스 맹약과 오퍼레이터, 전용 장비, 카셰이 전략을 추가합니다.' }], stages: [] };
  const selectedPreset=presets.find(p=>p.id===presetId);
  const savePreset=()=>{const id=selectedPreset?.id||`extension-${Date.now()}`;setPresets(saveExtensionPresets([...presets.filter(p=>p.id!==id),{id,name:presetName.trim(),selection:copyExtensionSelection(draft)}]));setPresetId(id);};
  const toggle = id => setDraft(old => ({ ...old, [tab]: (old[tab] || []).includes(id) ? old[tab].filter(x => x !== id) : [...(old[tab] || []),id] }));
  return html`<${Modal} open=${open} title="커스텀 확장 설정" micro="CUSTOM EXTENSIONS" class="custom-ext ui-editor" width="min(15rem,96vw)" onClose=${onClose}
    actions=${html`<span class="editor-status">${errors.length?errors.join(' '):loadError||(!tables?'목록 불러오는 중…':'최소 구성 조건 충족')}</span><${Button} variant="secondary" onClick=${onClose} disabled=${disabled}>${isHost ? '취소' : '닫기'}<//>
      ${isHost ? html`<${Button} variant="primary" disabled=${disabled || !tables || errors.length>0} onClick=${()=>onSave(draft)}>적용<//>` : null}`}>
    <p class="lo-note">${isHost?'추가하거나 금지할 요소를 선택하세요. 방 전체에 적용됩니다.':'방장이 선택한 구성이 방 전체에 적용됩니다.'}</p>
    <div class="extensions-layout"><nav class="extensions-nav" aria-label="설정 분류"><h3>추가 확장</h3>
      ${EXTENSION_CATEGORIES.map((c,i)=>html`<${Fragment}>${i===2?html`<h3>기본 콘텐츠 금지</h3>`:null}<button type="button" id=${'ext-tab-'+c.id} aria-controls=${'ext-panel-'+c.id} aria-pressed=${tab===c.id} class=${tab===c.id?'is-on':''} onClick=${()=>{setTab(c.id);setQuery('');}}><${Icon} name=${CATEGORY_ICONS[c.id]} /><span class="extensions-nav__label">${c.name}</span><span class="num">${(draft[c.id]||[]).length}</span></button><//>`)}
      ${isHost?html`<div class="extension-presets"><h3>프리셋</h3><select aria-label="확장 프리셋" value=${presetId} onChange=${e=>{const id=e.target.value;setPresetId(id);setPresetName(presets.find(p=>p.id===id)?.name||'');}}><option value="">새 프리셋</option>${presets.map(p=>html`<option value=${p.id}>${p.name}</option>`)}</select><input aria-label="확장 프리셋 이름" placeholder="프리셋 이름" maxlength="40" value=${presetName} onInput=${e=>setPresetName(e.target.value)}/><div class="extension-presets__actions"><${Button} variant="secondary" disabled=${disabled||!presetName.trim()||(!selectedPreset&&presets.length>=30)} onClick=${savePreset}>저장<//><${Button} variant="secondary" disabled=${disabled||!selectedPreset||!tables} onClick=${()=>setDraft(resolveExtensionPreset(selectedPreset,catalog))}>불러오기<//><${Button} variant="ghost" disabled=${disabled||!selectedPreset} onClick=${()=>{setPresets(saveExtensionPresets(presets.filter(p=>p.id!==presetId)));setPresetId('');setPresetName('');}}>삭제<//></div></div>`:null}
    </nav><section class="extensions-editor" id=${'ext-panel-'+tab} aria-labelledby=${'ext-tab-'+tab}>
      <div class="editor-toolbar"><h3>${EXTENSION_CATEGORIES.find(c=>c.id===tab)?.name}</h3><input class="editor-search" aria-label="금지 목록 검색" placeholder="이름 검색" value=${query} onInput=${e=>setQuery(e.target.value)}/><span class="lo-count">선택 <b>${(draft[tab]||[]).length}</b></span></div>
      <p class="editor-help">${tab==='disabledBonds'?'금지한 핵심 맹약의 오퍼레이터를 제외합니다. 핵심 맹약이 둘이면 금지한 맹약만 제거합니다.':tab.startsWith('disabled')?'체크한 요소는 게임에 등장하지 않습니다.':'체크한 확장을 이번 게임에 추가합니다.'}</p>
      <div class=${`extension-grid extension-grid--${tab}`}>${(catalog[tab]||[]).filter(e=>!query||e.name.includes(query)||e.id.includes(query)).map(e=>html`<label key=${e.id} class=${`custom-ext__card${(draft[tab]||[]).includes(e.id)?(tab.startsWith('disabled')?' is-selected is-excluded':' is-selected'):''}`}><input type="checkbox" checked=${(draft[tab]||[]).includes(e.id)} disabled=${disabled||!isHost} onChange=${()=>toggle(e.id)}/><${ExtensionArt} tab=${tab} entry=${e} tables=${tables}/><span class="extension-card__text"><strong>${e.name}</strong><small>${tab==='disabledBands'?(tables?.bands?.[e.id]?.effectName||''):tab==='disabledBosses'?(tables?.bosses?.[e.id]?.hidden?'히든 보스':'일반 보스'):tab==='bonds'?e.description:(tab==='stages'||tab==='disabledStages')?stageDifficultyLabels(tables?.stages?.[e.id]).join(' · '):''}</small></span></label>`)}${!(catalog[tab]||[]).length?html`<p class="lo-empty">등록된 요소가 없습니다.</p>`:null}</div>
      <div class="editor-minimums"><span>최소 구성</span><b>핵심 맹약 5</b><b>맵 1</b><b>일반·히든 보스 각 1</b><b>전략 ${room.mode==='solo'?1:4}</b></div>
    </section></div>
  <//>`;
}
