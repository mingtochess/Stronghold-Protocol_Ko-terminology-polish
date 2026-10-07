// Prefer confirmed files over language metadata, which may precede resource uploads.
export function voiceLanguageFor(requested,asset,{krFiles=null,metadataKR=false}={}){
 if(requested==='jp')return 'jp';
 const path=`${String(asset).toLowerCase()}.mp3`;
 return krFiles ? krFiles.has(path) ? 'kr':'jp' : metadataKR ? 'kr':'jp';
}
