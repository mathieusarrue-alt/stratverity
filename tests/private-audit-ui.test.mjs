import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
// Render the actual TSX with deterministic hooks. Browser qualification is separate.
function harness(path,mocks,props={}){
  let hooks=[],cursor=0,pending=[],tree,fn;
  const react={useState(initial){const i=cursor++;if(!(i in hooks))hooks[i]=typeof initial==='function'?initial():initial;
    return[hooks[i],value=>{hooks[i]=typeof value==='function'?value(hooks[i]):value;}];},
    useRef(initial){const i=cursor++;return hooks[i]??(hooks[i]={current:initial});},
    useEffect(effect,deps){const i=cursor++,old=hooks[i];if(!old||deps.some((x,j)=>!Object.is(x,old.deps[j])))
      pending.push(()=>{old?.cleanup?.();hooks[i]={deps,cleanup:effect()};});},Suspense:'suspense'};
  const mod={exports:{}};
  const source=readFileSync(new URL(path,import.meta.url),'utf8');
  const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',output)(name=>name==='react'?react:name.endsWith('.module.css')?{default:{}}:mocks[name]??require(name),mod,mod.exports);
  fn=mod.exports.default;
  function render(){cursor=0;tree=fn(props);if(tree.type==='suspense')tree=tree.props.children.type();
    const jobs=pending;pending=[];jobs.forEach(job=>job());return tree;}
  function all(node=tree){if(node==null||typeof node==='boolean')return[];if(Array.isArray(node))return node.flatMap(all);
    return[node,...(typeof node==='object'&&node.props?.children!==undefined?all(node.props.children):[])];}
  render();return{render,all,find:type=>all().find(n=>n?.type===type),text:()=>all().filter(x=>typeof x==='string'||typeof x==='number').join(' '),
    unmount(){hooks.forEach(h=>h?.cleanup?.());}};
}
const tx=(overrides={})=>({attempt:'attempt.fixture',revision:1,initiated:false,checkout_session_id:null,
  scope:{contexts:[{asset_id:'BINANCE:BTCUSDT',timeframe:'15m'}],strategies:[{strategy_version_id:'fixture-v1'}],audit_options:{depth:'PREMIUM'}},
  quote:{expires_at:new Date(Date.now()+60000).toISOString(),price:{due_today_ex_vat_cents:4900}},...overrides});
function panel(options={}){
  const transaction=options.transaction??tx();let stored=transaction,calls=0,navigations=[];
  const storage=()=>({getItem(){},setItem(){}});
  const send=options.send??(async()=>({checkout_url:'https://checkout.stripe.com/fixture'}));
  const h=harness('../app/configure/private-audit-checkout-panel.tsx',{'./private-audit-flow':{
    loadAuditTransaction:()=>stored,sendAuditTransaction:async(...args)=>{calls++;stored={...stored,initiated:true};return send(...args);}}},
    {transaction,locale:'fr',contract:{version:'fixture'},label:'Conditions existantes',current:options.current??(()=>true),navigate:url=>navigations.push(url),storage});
  return{...h,calls:()=>calls,navigations,accept(){h.find('input').props.onChange({target:{checked:true}});h.render();}};
}
test('private panel shows frozen readable context, price and explicit consent',()=>{
  const h=panel();assert.match(h.text(),/BINANCE:BTCUSDT.*15M.*PREMIUM.*fixture-v1/);assert.match(h.text(),/49/);
  assert.equal(h.find('button').props.disabled,true);h.accept();assert.equal(h.find('button').props.disabled,false);h.unmount();
});
test('immediate busy ref refuses double submit; navigation occurs only after response',async()=>{
  let resolve;const h=panel({send:()=>new Promise(r=>resolve=r)});h.accept();
  const click=h.find('button').props.onClick,a=click(),b=click();assert.equal(h.calls(),1);assert.deepEqual(h.navigations,[]);
  resolve({checkout_url:'https://checkout.stripe.com/fixture'});await Promise.all([a,b]);assert.equal(h.navigations.length,1);h.unmount();
});
test('selection staleness or unmount suppresses navigation without replacing original transaction',async()=>{
  for(const kind of ['selection','unmount']){let active=true,resolve;const h=panel({current:()=>active,send:()=>new Promise(r=>resolve=r)});
    h.accept();const click=h.find('button').props.onClick();if(kind==='selection')active=false;else h.unmount();
    resolve({checkout_url:'https://checkout.stripe.com/fixture'});await click;assert.equal(h.calls(),1);assert.deepEqual(h.navigations,[]);h.unmount();}
});
test('expired new quote disables first preparation; lost-response initiated retry remains available',async()=>{
  const h=panel({transaction:tx({quote:{expires_at:new Date(Date.now()-1).toISOString(),price:{due_today_ex_vat_cents:4900}}})});
  h.accept();await new Promise(r=>setTimeout(r,2));h.render();assert.equal(h.find('button').props.disabled,true);assert.match(h.text(),/expiré/);h.unmount();
  const lost=panel({transaction:tx({quote:{expires_at:new Date(Date.now()+15).toISOString(),price:{due_today_ex_vat_cents:4900}}}),send:async()=>{throw Error('lost');}});
  lost.accept();await lost.find('button').props.onClick();lost.render();await new Promise(r=>setTimeout(r,20));lost.render();
  assert.match(lost.text(),/Reprendre cette tentative/);assert.equal(lost.find('button').props.disabled,false);assert.doesNotMatch(lost.text(),/aucun débit|aucun paiement/);lost.unmount();
});
test('known session offers status without another checkout',()=>{
  const h=panel({transaction:tx({initiated:true,checkout_session_id:'cs_fixture'})});assert.match(h.find('a').props.href,/attempt=attempt.fixture&session_id=cs_fixture/);
  assert.equal(h.find('a').props.referrerPolicy,'no-referrer');assert.equal(h.calls(),0);h.unmount();
});
test('return shell is disabled off flag and never polls absent/ambiguous context',()=>{
  global.window={location:{hostname:'127.0.0.1',search:'?attempt=a&session_id=cs_x',hash:''},addEventListener(){},removeEventListener(){},sessionStorage:{}};
  let polls=0;const mocks={'next/navigation':{useSearchParams:()=>new URLSearchParams(window.location.search)},'../../i18n/I18nProvider':{useI18n:()=>({locale:'en'})},
    '../private-audit-flow':{privateAuditCheckoutUiMode:()=>false,privateReturnContext:()=>assert.fail('context'),pollPrivateAudit:()=>{polls++;}}};
  const h=harness('../app/configure/private-success/page.tsx',mocks);h.render();assert.match(h.text(),/disabled/);assert.equal(polls,0);h.unmount();
  mocks['../private-audit-flow'].privateAuditCheckoutUiMode=()=>true;mocks['../private-audit-flow'].privateReturnContext=()=>{throw Error('invalid');};
  const missing=harness('../app/configure/private-success/page.tsx',mocks);missing.render();assert.match(missing.text(),/missing or invalid/);assert.equal(polls,0);missing.unmount();delete global.window;
});
test('SPA query change cancels old status and cannot display its late ready result',async()=>{
  global.window={location:{hostname:'127.0.0.1',search:'?attempt=a&session_id=cs_a',hash:''},addEventListener(){},removeEventListener(){},sessionStorage:{}};
  const polls=[];const h=harness('../app/configure/private-success/page.tsx',{'next/navigation':{useSearchParams:()=>new URLSearchParams(window.location.search)},
    '../../i18n/I18nProvider':{useI18n:()=>({locale:'en'})},'../private-audit-flow':{privateAuditCheckoutUiMode:()=>true,
      privateReturnContext:q=>({transaction:{q},session:'cs_fixture'}),pollPrivateAudit:(_t,_s,_update,options)=>{
        let resolve;const p={options,stopped:false,resolve:null};const finished=new Promise(r=>resolve=r);p.resolve=resolve;polls.push(p);return{finished,stop:()=>p.stopped=true};}}});
  h.render();window.location.search='?attempt=b&session_id=cs_b';h.render();assert.equal(polls[0].stopped,true);assert.equal(polls[0].options.current(),false);
  polls[0].resolve('ready');await Promise.resolve();h.render();assert.doesNotMatch(h.text(),/report is ready/);
  polls[1].resolve('ready');await Promise.resolve();h.render();assert.match(h.text(),/Email receipt has not been verified/);h.unmount();delete global.window;
});
test('config private ABA epoch and exact payload guards precede source and quote; legacy isolated',()=>{
  const source=readFileSync(new URL('../app/configure/page.tsx',import.meta.url),'utf8');
  assert.match(source,/currentPayloadRef.current!==currentPayload\)previewRevision.current\+\+/);
  assert.match(source,/if\(privateAuditLocalMode\(\)\)\{setPreview\(null\);setPreviewRequest\(null\);setState\("idle"\);\}/);
  assert.ok(source.indexOf('preflightNewAuditTransaction(window.sessionStorage)')<source.indexOf('await freezePrivateAudit('));
  assert.match(source,/revision !== previewRevision.current \|\| serialized!==currentPayloadRef.current/);
  assert.match(source,/previewRevision.current!==capturedRevision\|\|currentPayloadRef.current!==capturedPayload/);
  assert.match(source,/const startCheckout = async \(\) => \{\s*if \(privateAuditLocalMode\(\)\) return;/);
});
