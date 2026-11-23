import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const strict="default-src 'none'; sandbox; base-uri 'none'; frame-ancestors 'none'";
// Actual Worker source and fetch wrapper, not a separately copied header helper.
function worker(response){
  const source=readFileSync(new URL('../worker/index.ts',import.meta.url),'utf8');
  const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};
  const require=name=>name==='vinext/server/app-router-entry'?{default:{fetch:async()=>response}}
    :{DEFAULT_DEVICE_SIZES:[],DEFAULT_IMAGE_SIZES:[],handleImageOptimization:async()=>response};
  new Function('require','module','exports',output)(require,module,module.exports);
  return module.exports.default;
}
async function wrap(response,path='/api/private-audit/fixture/report'){
  return worker(response).fetch(new Request('https://fixture.invalid'+path),{},{});
}
function common(response){
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.equal(response.headers.get('x-frame-options'),'DENY');
  assert.equal(response.headers.get('strict-transport-security'),'max-age=31536000; includeSubDomains');
  assert.equal(response.headers.get('permissions-policy'),'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  assert.equal(response.headers.get('cross-origin-opener-policy'),'same-origin-allow-popups');
  assert.equal(response.headers.get('x-permitted-cross-domain-policies'),'none');assert.equal(response.headers.get('x-xss-protection'),'0');
}
test('Worker preserves exact strict report security without changing attachment bytes or status',async()=>{
  const bytes=new TextEncoder().encode('<html>é opaque attachment</html>');
  const response=await wrap(new Response(bytes,{headers:{'Content-Security-Policy':strict,'Referrer-Policy':'no-referrer',
    'Content-Type':'application/octet-stream','Content-Disposition':'attachment; filename="stratverity-audit.html"',
    'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}}));
  assert.equal(response.status,200);assert.equal(response.headers.get('content-security-policy'),strict);
  assert.equal(response.headers.get('referrer-policy'),'no-referrer');common(response);
  assert.equal(response.headers.get('content-type'),'application/octet-stream');
  assert.equal(response.headers.get('content-disposition'),'attachment; filename="stratverity-audit.html"');
  assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow');
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()),bytes);
});
test('Worker baseline remains identical for ordinary responses and refuses arbitrary weaker CSP/referrer',async()=>{
  const ordinary=await wrap(new Response('page',{status:202}),'/');const baseline=ordinary.headers.get('content-security-policy');
  assert.match(baseline,/default-src 'self'/);assert.match(baseline,/script-src 'self' 'unsafe-inline'/);common(ordinary);
  assert.equal(ordinary.headers.get('referrer-policy'),'strict-origin-when-cross-origin');assert.equal(ordinary.status,202);
  for(const policy of ["default-src *",strict+"; script-src *","sandbox",""]){
    const result=await wrap(new Response('page',{headers:{'Content-Security-Policy':policy,'Referrer-Policy':'unsafe-url'}}));
    assert.equal(result.headers.get('content-security-policy'),baseline);assert.equal(result.headers.get('referrer-policy'),'strict-origin-when-cross-origin');common(result);
  }
});
test('Worker preserves only stronger exact no-referrer on errors and applies the same rule to image wrapper',async()=>{
  for(const path of ['/api/private-audit/fixture/report','/_vinext/image']){
    const result=await wrap(new Response('refused',{status:404,headers:{'Referrer-Policy':'no-referrer'}}),path);
    assert.equal(result.status,404);assert.equal(result.headers.get('referrer-policy'),'no-referrer');
    assert.match(result.headers.get('content-security-policy'),/default-src 'self'/);common(result);
  }
});
