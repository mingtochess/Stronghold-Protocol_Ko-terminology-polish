import{readFile,writeFile,mkdir,copyFile}from'node:fs/promises';
import{resolve,dirname,relative,isAbsolute}from'node:path';
import{createHash}from'node:crypto';
import{isDeepStrictEqual}from'node:util';
export function preservesIndex(before,after){return Object.entries(before).every(([group,entries])=>!entries||typeof entries!=='object'||Array.isArray(entries)||Object.entries(entries).every(([k,v])=>isDeepStrictEqual(v,after[group]?.[k])));}
const sha=b=>createHash('sha256').update(b).digest('hex');
export const managedIndexes=new Set(['/assets/local/fx/index.json','/assets/local/fx/textures.json']);
export function resourcePath(root,path){const p=resolve(root,path.replace(/^\//,'')),rel=relative(resolve(root,'assets'),p);if(!path.startsWith('/assets/')||rel.startsWith('..')||isAbsolute(rel))throw Error('Unsafe asset path: '+path);return p;}
export function packBases(pack){if(!/^[\w.-]+\/[\w.-]+$/.test(pack.repository)||!/^[a-f0-9]{40}$/.test(pack.commit))throw Error('Resource pack requires a repository and immutable commit');return[`https://raw.githubusercontent.com/${pack.repository}/${pack.commit}/public`,`https://cdn.jsdelivr.net/gh/${pack.repository}@${pack.commit}/public`];}
export async function resolveResourcePacks(root,config){
 const packs=[];for(const p of config.packs||[]){const bases=packBases(p),manifest=resolve(root,p.manifest),rel=relative(root,manifest);if(rel.startsWith('..')||isAbsolute(rel))throw Error('Unsafe pack manifest');const d=JSON.parse(await readFile(manifest,'utf8')),files=d.files||d.inventory;if(!Array.isArray(files)||!files.length)throw Error('Empty resource pack: '+p.name);for(const f of files){resourcePath(root,f.path);if(!/^[a-f0-9]{64}$/.test(f.sha256)||!Number.isInteger(f.bytes)||f.bytes<0)throw Error('Unverified pack payload: '+f.path);}packs.push({...p,bases,files});}return packs;
}
export function packedSources(pack,path){return pack.bases.map(b=>b+'/'+path.split('/').filter(Boolean).map(encodeURIComponent).join('/'));}
export async function installResourcePacks(root,packs,{sourceRoot=null,fetcher=fetch}={}){
 const changes=[];
 for(const pack of packs){
  const staged=[];let cursor=0;
  const load=async()=>{for(;;){const f=pack.files[cursor++];if(!f)return;const dest=resourcePath(resolve(root,'public'),f.path);let bytes;try{const b=await readFile(dest);if(b.length===f.bytes&&sha(b)===f.sha256)continue;}catch(e){if(e.code!=='ENOENT')throw e;}
   const cache=resourcePath(resolve(root,'.cache/hosted-pack-payloads/public'),f.path);
   if(sourceRoot)bytes=await readFile(resourcePath(sourceRoot,f.path));else{try{const b=await readFile(cache);if(sha(b)===f.sha256)bytes=b;}catch(e){if(e.code!=='ENOENT')throw e;}if(!bytes){let failure;for(const url of packedSources(pack,f.path))try{const r=await fetcher(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('HTTP '+r.status);const b=Buffer.from(await r.arrayBuffer());if(b.length!==f.bytes||sha(b)!==f.sha256)throw Error('Checksum mismatch');bytes=b;break;}catch(e){failure=e;}if(!bytes)throw Error(`Pack download failed: ${f.path}: ${failure?.message}`);}}
   if(bytes.length!==f.bytes||sha(bytes)!==f.sha256)throw Error('Pack checksum mismatch: '+f.path);
   await mkdir(dirname(cache),{recursive:true});await writeFile(cache,bytes);staged.push({f,dest,cache,bytes});
  }};const results=await Promise.allSettled(Array.from({length:6},load));const failed=results.find(r=>r.status==='rejected');if(failed)throw failed.reason;
  // Validate every conflict before changing the installed tree. Index formatting may differ,
  // but published canonical indexes must preserve the entire merged installed content.
  for(const s of staged){try{const old=await readFile(s.dest);if(managedIndexes.has(s.f.path)){if(!preservesIndex(JSON.parse(old),JSON.parse(s.bytes)))throw Error('Publish the complete merged index: '+s.f.path);}else if(sha(old)!==s.f.sha256)throw Error('Existing resource differs: '+s.f.path);}catch(e){if(e.code!=='ENOENT')throw e;}}
  for(const s of staged){await mkdir(dirname(s.dest),{recursive:true});await copyFile(s.cache,s.dest);changes.push(s.f.path);}
 }
 return changes;
}
