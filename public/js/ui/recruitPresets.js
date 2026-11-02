import {normalizePresetStrategies,completedStrategy} from '../../../shared/recruitPresetLinks.js';
import {PresetLinks} from './presetLinks.js';
import { PresetManager, PresetNameField, PresetLinkChips } from './settingsFrame.js';
import { html, Modal, Button, Icon, TextField, confirmDialog } from './components.js';
import { createStore, loadPref, savePref, useStore, store } from '../store.js';
import { data } from '../data.js';
import { useEffect, useState } from '../../vendor/hooks.module.js';
import { loadoutStore, setEntries, flushPendingLoadout } from './loadoutSync.js';
import { checkLoadout } from '../../../shared/protocol.js';
import { normalizePresetFactions, canApplyRecruitPreset, replaceRecruitEntries, withDefaultPreset } from './factionPresetModel.js';
import { toast } from './toasts.js';
import { Img } from './gameComponents.js';
import { chessPortraitUrl } from './assetUrls.js';
import {chessOptions,effectiveChoice,setRecruitChoice,moduleBadge,MODULE_NONE} from './loadoutModel.js';
import {recruitPresetCandidates,selectedRecruits,editRecruitPreset,sameRecruitSelection} from './recruitPresetModel.js';
import {matchesKoreanSearch} from '../../../shared/search.js';
import {tr} from '../i18n/i18n.js';
const KEY='recruitPresets';
export function normalizeRecruitPresets(raw){
 const presets=withDefaultPreset(normalizePresetStrategies(normalizePresetFactions((Array.isArray(raw?.presets)?raw.presets:[]).filter(p=>typeof p?.id==='string'&&!p.builtin&&p.id!=='default').slice(0,30).map(p=>({id:p.id,name:String(p.name||'선발 프리셋').slice(0,40),faction:p.faction,strategy:p.strategy,entries:Object.fromEntries(Object.entries(p.entries||{}).filter(([id,e])=>typeof id==='string'&&e&&typeof e==='object'&&!Array.isArray(e)&&e.selected===true))})))),{entries:{}});
 return {presets,active:presets.some(p=>p.id===raw?.active)?raw.active:presets[0]?.id||null};
}
export const recruitPresetStore=createStore({...normalizeRecruitPresets(loadPref(KEY,{})),open:false});
export function saveRecruitPresets(next){const clean=normalizeRecruitPresets(next),faction=store.get().chatFaction,linked=clean.presets.find(p=>p.faction===faction),old=recruitPresetStore.get().presets.find(p=>p.faction===faction);savePref(KEY,clean);recruitPresetStore.set(clean);syncStrategyPresets(clean);if(faction&&linked&&linked.id!==old?.id)applyRecruitFaction(faction,{guardFaction:true}).catch(error=>toast(error.message,'warn'));}
function syncStrategyPresets(state){const next=Object.fromEntries(state.presets.filter(p=>p.strategy).map(p=>[p.strategy,p.entries]));if(JSON.stringify(loadoutStore.get().strategyPresets)!==JSON.stringify(next))loadoutStore.set({strategyPresets:next});}
syncStrategyPresets(recruitPresetStore.get());
let lastStrategy=null;
store.subscribe(state=>{const done=completedStrategy(state);if(!done){if(!state.room?.inMatch||['LOBBY','INFO_CHECK','BAND_DRAFT'].includes(state.match?.public?.phase))lastStrategy=null;return;}
 if(state.match?.private?.strategyPresetApplied!==done.strategy||lastStrategy===done.key)return;
 const preset=recruitPresetStore.get().presets.find(p=>p.strategy===done.strategy);if(!preset)return;
 lastStrategy=done.key;applyRecruitPreset(preset.id,{}, {strategyMirror:true});
});
const save=saveRecruitPresets;
let factionSyncSeq=0,factionRequest=null;
if(typeof window!=='undefined'){let previousFaction=store.get().chatFaction,previousAllowed=canApplyRecruitPreset(store.get());store.subscribe(state=>{const faction=state.chatFaction,allowed=canApplyRecruitPreset(state);if(faction===previousFaction&&allowed===previousAllowed)return;previousFaction=faction;previousAllowed=allowed;if(!faction||!allowed){factionSyncSeq++;return;}applyRecruitFaction(faction,{guardFaction:true}).catch(error=>toast(error.message,'warn'));});}
function capture(){return Object.fromEntries(Object.entries(loadoutStore.get().entries).filter(([id,e])=>data.lookup('chess',id)?.optionalRecruit&&e.selected).map(([id,e])=>[id,{...e}]));}
export function applyRecruitPreset(id,state=store.get(),options={}) {
 if(!canApplyRecruitPreset(state))return {ok:false,locked:true};
 const s=recruitPresetStore.get(),p=s.presets.find(p=>p.id===id);
 if(!p)return {ok:false};
 const next=replaceRecruitEntries(loadoutStore.get().entries,p.entries,id=>data.lookup('chess',id));
 if(Object.keys(p.entries).length&&!Object.entries(next).some(([id,e])=>data.lookup('chess',id)?.optionalRecruit&&e.selected))return {ok:false,detail:'선발 가능한 오퍼레이터가 없습니다.'};
 const check=checkLoadout(next,id=>data.lookup('chess',id));
 if(!check.ok)return {ok:false,detail:check.detail};
 setEntries(next,options);save({...s,active:id});return {ok:true,name:p.name};
}
export function applyRecruitFaction(faction,{guardFaction=false}={}){
 const linked=recruitPresetStore.get().presets.find(p=>p.faction===faction);
 if(factionRequest?.faction===faction&&factionRequest?.id===linked?.id&&factionRequest.seq===factionSyncSeq)return factionRequest.promise;
 const seq=++factionSyncSeq;
 const promise=(async()=>{
 if(!faction||!canApplyRecruitPreset(store.get()))return null;
 const p=recruitPresetStore.get().presets.find(p=>p.faction===faction);if(!p)return null;
 await data.load('chess');
 if(seq!==factionSyncSeq||(guardFaction&&(store.get().chatFaction!==faction||recruitPresetStore.get().presets.find(p=>p.faction===faction)?.id!==p.id)))return null;
 const result=applyRecruitPreset(p.id);
 if(!result.ok){if(!result.locked)toast('연결된 선발 프리셋을 적용하지 못했습니다. 단계별 선발 인원과 오퍼레이터 설정을 확인해주세요.','warn');return null;}
 await flushPendingLoadout();
 return result.name;
})();
 const request={faction,id:linked?.id,seq,promise:null};request.promise=promise.finally(()=>{if(factionRequest===request)factionRequest=null;});factionRequest=request;return request.promise;
}
export function RecruitPresetButton({size='sm',class:cls=''}={}){const s=useStore(x=>x,Object.is,recruitPresetStore),p=s.presets.find(x=>x.id===s.active);return html`<${Button} variant="secondary" size=${size} class=${`lo-preset-button ${cls}`} icon="users" onClick=${()=>recruitPresetStore.set({open:true})}><span class="lo-preset-button__k">선발 프리셋</span>${p?html`<span class="lo-preset-button__v">${p.name}</span><${PresetLinkChips} preset=${p} manifest=${data.get('assets')}/>`:null}<//>`;}
export function RecruitPresetsHost(){
 const s=useStore(x=>x,Object.is,recruitPresetStore),app=useStore(x=>x),live=useStore(x=>x,Object.is,loadoutStore),[ready,setReady]=useState(false),[picker,setPicker]=useState(null),[query,setQuery]=useState('');
 useEffect(()=>{setPicker(null);setQuery('');},[s.open,s.active]);
 useEffect(()=>{if(!s.open)return;let live=true;Promise.all(['chess','assets','bands'].map(k=>data.load(k))).then(()=>{if(live)setReady(true);}).catch(()=>{if(live)toast('선발 목록을 불러오지 못했습니다. 다시 열어주세요.','warn');});return()=>{live=false;};},[s.open]);
 if(!s.open)return null;
 const p=s.presets.find(p=>p.id===s.active),locked=!canApplyRecruitPreset(app);
 const update=patch=>{if(p?.builtin)return;save({...s,presets:s.presets.map(x=>x.id===p.id?{...x,...patch}:x)});};
 const create=()=>{const id=`recruit-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;save({...s,active:id,presets:[...s.presets,{id,name:`선발 프리셋 ${s.presets.length}`,entries:capture()}]});};
 const getChess=id=>data.lookup('chess',id),same=p&&sameRecruitSelection(p.entries,live.entries);
 const edit=(chess,tier,replacing)=>{
  const result=editRecruitPreset(p.entries,chess,tier,replacing,getChess);
  if(!result.ok){toast(result.detail||'각 단계는 최대 2명까지 선발할 수 있습니다.','warn');return false;}
  update({entries:result.entries});return true;
 };
 const configure=(c,patch)=>setEntries(setRecruitChoice(loadoutStore.get().entries,c,patch,getChess));
 return html`<${Modal} class="favorites-modal recruit-presets-modal ui-editor" width="min(12rem,96vw)" open=${true} title="선발 오퍼레이터 프리셋" micro="RECRUIT PRESETS" onClose=${()=>recruitPresetStore.set({open:false})} actions=${html`<${Button} onClick=${()=>recruitPresetStore.set({open:false})}>닫기<//>`}>
 <div class="favorites-layout"><${PresetManager} kind="stronghold.recruit-presets" state=${s} presets=${s.presets} active=${s.active} manifest=${data.get('assets')} disabled=${!ready} createLabel="새 프리셋" onSelect=${id=>save({...s,active:id})} onCreate=${create} onDuplicate=${x=>{const id=`recruit-${Date.now()}`;save({...s,active:id,presets:[...s.presets,{...x,id,builtin:false,faction:null,strategy:null,entries:{...x.entries},name:(x.name+' 복사').slice(0,40)}]});}} onDelete=${x=>{if(!x.builtin)save({...s,presets:s.presets.filter(y=>y.id!==x.id)});}} onImport=${value=>save(normalizeRecruitPresets(value))}/>
 <section class="favorites-editor">${p?.builtin?html`<div class="favorites-toolbar favorites-titlebar"><strong class="preset-builtin-name">${p.name}</strong></div><p class="recruit-preset-help">기본 프리셋은 선발한 오퍼레이터가 없으며 수정하거나 진영·전략에 연동할 수 없습니다. ‘게임에 적용’을 누르면 선발을 모두 해제합니다.</p><div class="recruit-preset-actions"><${Button} variant="primary" icon="check" disabled=${locked||!ready} onClick=${()=>{const r=applyRecruitPreset(p.id);toast(r.ok?'선발 프리셋을 적용했습니다.':r.detail||'선발 프리셋을 적용하지 못했습니다.',r.ok?'info':'warn');}}>게임에 적용<//></div>`:p?html`<div class="favorites-toolbar favorites-titlebar"><${PresetNameField} preset=${p} label="선발 프리셋 이름" onRename=${name=>update({name})}/><span class=${`recruit-preset-status ${same?'is-applied':''}`} role="status">${same?'현재 선발과 같음':'미적용'}</span></div>
 <p class="recruit-preset-help">선발 편집은 자동 저장됩니다. 게임에 반영하려면 ‘게임에 적용’을 누르세요.</p>
 <div class="recruit-preset-actions"><${Button} variant="primary" icon="check" disabled=${locked||!ready} onClick=${()=>{const r=applyRecruitPreset(p.id);toast(r.ok?'선발 프리셋을 적용했습니다.':r.detail||'선발 프리셋을 적용하지 못했습니다.',r.ok?'info':'warn');}}>게임에 적용<//><${Button} variant="secondary" icon="copy" disabled=${!ready} onClick=${async()=>{if(Object.keys(p.entries).length&&!same&&!await confirmDialog({title:'현재 선발 가져오기',text:'이 프리셋을 현재 선발 구성으로 바꿀까요?',okText:'가져오기'}))return;update({entries:capture()});toast('현재 선발 구성을 저장했습니다.');}}>현재 선발 가져오기<//></div>
 ${locked?html`<p class="lo-locknote">이번 판의 선발은 확정되었습니다. 프리셋 편집은 다음 판에 사용할 수 있습니다.</p>`:null}
 <div class="recruit-preset-slots">${[5,6].map(t=>{
  const rows=Object.keys(selectedRecruits(p.entries)).map(getChess).filter(c=>c?.tier===t);
  return html`<section class=${`recruit-preset-tier recruit-preset-tier--${t}`}><h3>${t}단계 <span>${rows.length}/2</span></h3>${[0,1].map(i=>{
   const c=rows[i],open=()=>{setQuery('');setPicker({tier:t,replacing:c?.chessId||null});};
   if(!c)return html`<button type="button" class="recruit-preset-empty" disabled=${!ready} aria-label=${t+'단계 선발 '+(i+1)+' 선택'} onClick=${open}><${Icon} name="plus"/><span>오퍼레이터 선택</span></button>`;
   const golden=c.goldenId?getChess(c.goldenId):null,choice=effectiveChoice(live.entries,c,golden),opt=chessOptions(c,golden);
   return html`<div class="recruit-preset-slot" data-chess=${c.chessId}><div class="recruit-preset-slot__head"><button class="recruit-preset-slot__pick" type="button" title="오퍼레이터 변경" onClick=${open}><${Img} src=${chessPortraitUrl(data.get('assets'),c)}/><strong>${tr(c.name)}</strong><${Icon} name="edit"/></button><button class="recruit-preset-slot__remove" type="button" title="선발 해제" aria-label=${tr(c.name)+' 선발 해제'} onClick=${()=>edit(null,t,c.chessId)}><${Icon} name="close"/></button></div>
    <div class="recruit-preset-slot__options"><label>스킬<select aria-label=${tr(c.name)+' 스킬'} disabled=${locked||!ready} value=${choice.skill} onChange=${e=>configure(c,{skill:Number(e.currentTarget.value)})}>${opt.skillOptions.map(o=>html`<option value=${o.index}>${'S'+(o.index+1)+' · '+tr((o.elite||o.normal)?.name||'')}</option>`)}</select></label><label>모듈<select aria-label=${tr(c.name)+' 모듈'} disabled=${locked||!ready||!golden} value=${choice.module} onChange=${e=>configure(c,{module:e.currentTarget.value})}>${opt.moduleOptions.map(o=>html`<option value=${o.id}>${o.id===MODULE_NONE?'미장착':moduleBadge(o.rec)+' · '+tr(o.rec?.name||o.id)}</option>`)}</select></label></div>
   </div>`;
  })}</section>`;
 })}</div>
 <p class="recruit-preset-help">스킬·모듈은 오퍼레이터 설정과 공유됩니다.</p>
 <${PresetLinks} preset=${p} presets=${s.presets} onChange=${presets=>save({...s,presets})}/>
 `:html`<div class="recruit-preset-welcome"><${Icon} name="users"/><h3>선발 프리셋 만들기</h3><p>5·6단계에 선발할 오퍼레이터를 각각 2명까지 고르세요.</p><${Button} variant="primary" icon="plus" disabled=${!ready} onClick=${create}>새 프리셋<//></div>`}</section></div>
 ${picker&&p?html`<${Modal} class="recruit-preset-picker" open=${true} title=${picker.tier+'단계 선발 선택'} micro="RECRUIT SELECTION" onClose=${()=>setPicker(null)}><${TextField} icon="search" value=${query} placeholder="오퍼레이터 검색" onInput=${v=>setQuery(String(v).slice(0,40))}/><div class="recruit-preset-picker__list">${recruitPresetCandidates(data.list('chess'),picker.tier).filter(c=>!p.entries[c.chessId]?.selected&&(matchesKoreanSearch(tr(c.name),query)||matchesKoreanSearch(c.name,query))).map(c=>html`<button type="button" data-chess=${c.chessId} class="recruit-preset-picker__op" onClick=${()=>{if(edit(c,picker.tier,picker.replacing))setPicker(null);}}><${Img} src=${chessPortraitUrl(data.get('assets'),c)}/><span>${tr(c.name)}</span></button>`)}</div></${Modal}>`:null}
 <//>`;
}
