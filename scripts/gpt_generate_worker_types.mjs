// Local type generation only. No deploy, credentials, bindings or account access.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=resolve(root,'types/cloudflare-runtime.d.ts');
if (existsSync(output)) throw new Error('Refuse to overwrite generated runtime types');
const config=JSON.parse(readFileSync(resolve(root,'types/wrangler.types.json'),'utf8'));
if (Object.keys(config).some(key=>!['$schema','name','compatibility_date','compatibility_flags'].includes(key))) {
  throw new Error('Type-only config must not contain account, secrets, routes or bindings');
}
const privateRoot=resolve(root,'evidence/TYPEGEN_LOCAL_20261121');
mkdirSync(privateRoot,{recursive:false});
const env=Object.fromEntries(['SystemRoot','WINDIR','COMSPEC','PATHEXT','OS'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
Object.assign(env,{
  PATH:dirname(process.execPath), HOME:privateRoot, USERPROFILE:privateRoot,
  APPDATA:privateRoot, LOCALAPPDATA:privateRoot, TEMP:privateRoot, TMP:privateRoot,
  CLOUDFLARE_SEND_METRICS:'false', WRANGLER_LOG_PATH:resolve(privateRoot,'wrangler.log'),
  CI:'true', NO_COLOR:'1',
});
const result=spawnSync(process.execPath,[resolve(root,'node_modules/wrangler/bin/wrangler.js'),
  'types',output,'--config',resolve(root,'types/wrangler.types.json'),
  '--include-env=false','--include-runtime=true'],{
  cwd:privateRoot,env,encoding:'utf8',timeout:60000,maxBuffer:1024*1024,windowsHide:true,
});
process.stdout.write(result.stdout||''); process.stderr.write(result.stderr||'');
if (result.error) throw result.error;
if (result.status!==0 || !existsSync(output)) process.exitCode=result.status||1;
