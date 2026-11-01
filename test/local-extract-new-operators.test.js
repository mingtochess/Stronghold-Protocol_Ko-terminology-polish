import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const python=['python3','python'].find(bin=>spawnSync(bin,['--version']).status===0);
test('client-only operator extraction, Unicode selection, dependency closure and standalone kit',{skip:!python&&'Python is not installed'},()=>{
 const r=spawnSync(python,['-B','test/local-extract-new-operators.test.py'],{cwd:root,encoding:'utf8',timeout:60000,env:{...process.env,PYTHONIOENCODING:'utf-8'}});
 assert.equal(r.status,0,(r.stdout||'')+(r.stderr||'')+(r.error?.message||''));
});
