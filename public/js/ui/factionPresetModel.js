import { chatFaction } from '../../../shared/chat.js';

/** The fixed first preset of the favorite and recruit lists: empty, never edited, renamed, linked or deleted. */
export const DEFAULT_PRESET_ID='default';
export function withDefaultPreset(presets, empty) {
 return [{ id: DEFAULT_PRESET_ID, name: '기본', builtin: true, faction: null, strategy: null, ...empty }, ...presets.filter(p=>p.id!==DEFAULT_PRESET_ID)];
}

// One owner per faction. Assigning a new owner removes the old link.
export function bindPresetFaction(presets, id, faction) {
 if(!presets.some(p=>p.id===id&&!p.builtin))return presets;
 const selected=chatFaction(faction);const value=selected&&selected.presetLink!==false?selected.name:null;
 return presets.map(p=>p.id===id?{...p,faction:value}:value&&p.faction===value?{...p,faction:null}:p);
}
export function normalizePresetFactions(presets) {
 // A pasted/old collection can contain duplicate IDs. Keep every list, but give
 // each a distinct identity before applying faction links or selecting by ID.
 // Reserve later IDs too, so a repaired ID cannot steal another preset's identity.
 const reserved=new Set(presets.map(p=>p.id)),seen=new Set();
 const distinct=presets.map(p=>{
  let id=p.id;
  if(seen.has(id)){let n=2;do{id=`${p.id}~${n++}`;}while(seen.has(id)||reserved.has(id));}
  seen.add(id);return {...p,id};
 });
 let out=distinct.map(p=>({...p,faction:null}));
 for(const p of distinct)if(chatFaction(p.faction))out=bindPresetFaction(out,p.id,p.faction);
 return out;
}
export function canApplyRecruitPreset(state) {
 return !state.room?.inMatch || ['LOBBY','INFO_CHECK','BAND_DRAFT'].includes(state.match?.public?.phase);
}
export {replaceRecruitEntries} from '../../../shared/recruitPresetLinks.js';
