import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadCustomExtensionPrefs,saveCustomExtensionPrefs} from '../../public/js/ui/customExtensionPrefs.js';

test('extension preferences persist including an explicit empty selection and leave loadouts untouched',()=>{
 const previous=globalThis.localStorage;
 const storage=new Map([['sp.pref.loadout','{"skill":2,"skin":"chosen"}']]);
 globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};
 try{
  assert.deepEqual(loadCustomExtensionPrefs(),{bonds:[],stages:[]});
  saveCustomExtensionPrefs({bonds:['ursus'],stages:['custom_a','custom_b']});
  assert.deepEqual(loadCustomExtensionPrefs(),{bonds:['ursus'],stages:['custom_a','custom_b']});
  loadCustomExtensionPrefs().bonds.length=0;assert.deepEqual(loadCustomExtensionPrefs().bonds,['ursus']);
  saveCustomExtensionPrefs({bonds:[],stages:[]});assert.deepEqual(loadCustomExtensionPrefs(),{bonds:[],stages:[]});
  assert.equal(storage.get('sp.pref.loadout'),'{"skill":2,"skin":"chosen"}');
  storage.set('sp.pref.customExtensions','broken');assert.deepEqual(loadCustomExtensionPrefs(),{bonds:[],stages:[]});
  storage.set('sp.pref.customExtensions','{"bonds":"ursus"}');assert.deepEqual(loadCustomExtensionPrefs(),{bonds:[],stages:[]});
 }finally{if(previous===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous;}
});
test('content exclusions persist with extension selections',()=>{
 const previous=globalThis.localStorage,storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};
 try{const value={bonds:['ursus'],stages:[],disabledBonds:['yanShip'],disabledStages:['act1autochess_m01'],disabledBosses:['boss_1'],disabledBands:['band_bldsk']};saveCustomExtensionPrefs(value);assert.deepEqual(loadCustomExtensionPrefs(),value);}finally{if(previous===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous;}
});
