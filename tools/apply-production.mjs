// Docker build only: apply a prepared, self-contained local catalogue without fetching source tables.
import {readFile,cp,access,mkdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname,join} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const prepared=join(root,'content/production');
try{await access(join(prepared,'resources.json'))}catch{console.log('No prepared production catalogue; using standard data.');process.exit(0)}
const index=JSON.parse(await readFile(join(prepared,'resources.json'),'utf8'));
if(!index.version||!index.files?.length)throw Error('Incomplete production resource index');
await cp(join(prepared,'data'),join(root,'data'),{recursive:true});
await cp(join(prepared,'assets'),join(root,'public/assets'),{recursive:true});
await mkdir(join(root,'public/vendor'),{recursive:true});
await copyFile(join(prepared,'resources.json'),join(root,'public/vendor/browser-resources.json'));
await copyFile(join(root,'tools/assets/atlas.mjs'),join(root,'public/vendor/resource-atlas.mjs'));
console.log(`Prepared production catalogue applied: ${index.files.length} resources, ${index.version}`);
