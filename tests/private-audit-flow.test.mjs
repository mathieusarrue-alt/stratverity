import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import ts from "typescript";
// As with the existing TSX tests, transpile the actual source, not a copied port.
const moduleSource=readFileSync(new URL("../app/configure/private-audit-flow.ts",import.meta.url),"utf8")
  .replaceAll('"./private-audit-client"',JSON.stringify(new URL("../app/configure/private-audit-client.ts",import.meta.url).href));
const emitted=ts.transpileModule(moduleSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {createAuditTransaction,loadAuditTransaction,saveAuditTransaction,sendAuditTransaction,
  privateReturnContext,pollPrivateAudit,listAuditTransactions,preflightNewAuditTransaction}=await import("data:text/javascript;base64,"+Buffer.from(emitted).toString("base64"));

const hash="a".repeat(64),expires=Date.parse("2026-11-22T12:00:00Z");
const scope={schema_version:"0.1.0",scope_id:"scope-preview",product:"AUDIT",offer_family:"BASE",
  commercial_unit:"STRATEGY_ASSET_TIMEFRAME_CONTEXT",strategies:[{strategy_version_id:"fixture",sha256:hash}],
  contexts:[{strategy_version_id:"fixture",asset_id:"BINANCE:BTCUSDT",timeframe:"15m"}],
  audit_options:{depth:"PREMIUM",historical_windows:1,stress_scenarios:1,parameter_variants:1,human_review:false},
  scan_options:null,optimizer_options:null,pricing_status:"TO_BE_DEFINED"};
const quote={scope_fingerprint:hash,quote_sha256:"b".repeat(64),pricing_version:"launch-v0.3",
  expires_at:"2026-11-22T12:00:00Z",price:{currency:"eur",cadence:"ONE_TIME",due_today_ex_vat_cents:4900},authorization:false};
const key="fixture-checkout-key-0001",session="cs_test_fixture001";
const transaction=(attempt="fixture.attempt")=>createAuditTransaction(attempt,scope,quote,1,key);
const storage=()=>{let saved=null;return{getItem:()=>saved,setItem:(_k,v)=>{saved=v;},raw:()=>saved};};
const reply={authorization:false,checkout_attempt_id:"checkout-"+"c".repeat(32),checkout_session_id:session,
  checkout_url:"https://checkout.stripe.com/c/pay/fixture#fidkd%2Fopaque",scope_fingerprint:hash,
  quote_sha256:quote.quote_sha256,status:"CHECKOUT_CREATED",pricing:{currency:"eur",cadence:"ONE_TIME",
    subtotal_ex_vat_cents:4900,activation_ex_vat_cents:0,due_today_ex_vat_cents:4900,
    tax_calculation:"STRIPE_AUTOMATIC_TAX_AT_CHECKOUT"}};
const pending={authorization:false,checkout_status:"CHECKOUT_CREATED",job_status:null,delivery_status:null,report_ready:false};

test("new preview preflight refuses corrupt, full, blocked or silently unwritable storage without eviction",()=>{
  const s=storage();preflightNewAuditTransaction(s);assert.equal(s.raw(),"[]");
  for(let i=0;i<8;i++)saveAuditTransaction(s,{...transaction("attempt"+i),initiated:true});
  const before=s.raw();assert.throws(()=>preflightNewAuditTransaction(s));assert.equal(s.raw(),before);
  const listed=listAuditTransactions(s);assert.equal(Object.isFrozen(listed),true);assert.equal(listed.length,8);
  for(const blocked of [{getItem:()=>{throw Error("read");},setItem:()=>assert.fail()},
    {getItem:()=>"[]",setItem:()=>{throw Error("write");}},
    {getItem:()=>null,setItem:()=>{}},{getItem:()=>"corrupt",setItem:()=>assert.fail()}])assert.throws(()=>preflightNewAuditTransaction(blocked));
});

test("context is deep frozen and only exact scope metadata is accepted",()=>{
  const t=transaction();assert.equal(Object.isFrozen(t.scope.contexts[0]),true);
  assert.throws(()=>{t.scope.contexts[0].asset_id="BINANCE:ETHUSDT";});
  for(const extra of [{source:"private"},{email:"private"},{filename:"private"},{owner_token:"private"}]){
    assert.throws(()=>createAuditTransaction("fixture",{...scope,...extra},quote,1,key));
  }
  assert.throws(()=>createAuditTransaction("fixture",{...scope,contexts:[...scope.contexts,...scope.contexts]},quote,1,key));
  assert.throws(()=>createAuditTransaction("fixture",scope,{...quote,source:"private"},1,key));
  assert.throws(()=>createAuditTransaction("fixture",{...scope,offer_family:["BASE"]},quote,1,key));
  assert.throws(()=>createAuditTransaction("fixture",{...scope,contexts:[{...scope.contexts[0],asset_id:["BINANCE:BTCUSDT"]}]},quote,1,key));
});

test("global namespace retains at most eight attempts without evicting any",()=>{
  const s=storage();
  for(let i=0;i<8;i++)saveAuditTransaction(s,{...transaction("attempt"+i),initiated:true});
  const before=s.raw();assert.throws(()=>saveAuditTransaction(s,transaction("ninth")));
  assert.equal(s.raw(),before);assert.equal(loadAuditTransaction(s,"attempt0").initiated,true);
  assert.ok(!/source|email|owner_token|filename/.test(s.raw()));
});

test("64 KiB UTF8 bound and corrupt/duplicate contexts refuse without clearing storage",()=>{
  for(const raw of ["x".repeat(65537),"é".repeat(32769),"{}","not-json",JSON.stringify([transaction(),transaction()])]){
    const s={getItem:()=>raw,setItem:()=>assert.fail("invalid storage rewritten")};
    assert.throws(()=>loadAuditTransaction(s,"fixture.attempt"));
  }
});

test("same-attempt identity, quote, key and initiated state cannot be reassigned",()=>{
  const s=storage(),t=saveAuditTransaction(s,{...transaction(),initiated:true,checkout_session_id:session});
  for(const changes of [{initiated:false,checkout_session_id:null},{idempotency_key:"different-fixture-key-0001"},
    {revision:2},{quote:{...quote,quote_sha256:"c".repeat(64)}},{checkout_session_id:"cs_test_other"}]){
    assert.throws(()=>saveAuditTransaction(s,{...t,...changes}));
  }
  assert.deepEqual(loadAuditTransaction(s,t.attempt),t);
});

test("marker persists before dispatch; response loss reuses the original key and quote",async()=>{
  const s=storage(),t=saveAuditTransaction(s,transaction());let calls=0;
  const first=async(_url,init)=>{calls++;assert.equal(loadAuditTransaction(s,t.attempt).initiated,true);
    assert.equal(init.headers["Idempotency-Key"],key);throw new Error("fixture response lost");};
  await assert.rejects(sendAuditTransaction(s,t,{},first,()=>expires-1));
  assert.equal(loadAuditTransaction(s,t.attempt).initiated,true);
  const result=await sendAuditTransaction(s,t,{},async(_url,init)=>{calls++;
    assert.equal(init.headers["Idempotency-Key"],key);assert.equal(JSON.parse(init.body).quote_sha256,quote.quote_sha256);
    return Response.json(reply,{status:201});},()=>expires+86400000);
  assert.equal(result.checkout_session_id,session);assert.equal(calls,2);
  assert.equal(loadAuditTransaction(s,t.attempt).checkout_session_id,session);
});

test("uninitiated expiry or marker-write failure cannot dispatch",async()=>{
  const s=storage(),t=saveAuditTransaction(s,transaction());
  await assert.rejects(sendAuditTransaction(s,t,{},async()=>assert.fail("fetch"),()=>expires));
  assert.equal(loadAuditTransaction(s,t.attempt).initiated,false);
  const blocked={getItem:()=>s.raw(),setItem:()=>{throw new Error("storage blocked");}};
  await assert.rejects(sendAuditTransaction(blocked,t,{},async()=>assert.fail("fetch"),()=>expires-1));
});

test("return query is unique, bounded and tied to initiated local metadata",()=>{
  const s=storage();saveAuditTransaction(s,{...transaction(),initiated:true,checkout_session_id:session});
  const search="?attempt=fixture.attempt&session_id="+session;
  assert.equal(privateReturnContext(search,s).session,session);
  for(const bad of [search+"&attempt=fixture.attempt",search+"&session_id="+session,search+"&owner_token=x",
    "?attempt=unknown&session_id="+session,"?attempt=fixture.attempt&session_id=cs_test_other",""]){
    assert.throws(()=>privateReturnContext(bad,s));
  }
  const fresh=storage();saveAuditTransaction(fresh,transaction());assert.throws(()=>privateReturnContext(search,fresh));
});

test("status polling is bounded and never initiates payment or delivery",async()=>{
  let calls=0,updates=0;
  const poll=pollPrivateAudit(transaction(),session,()=>updates++,{intervalMs:0,send:async(url,init)=>{
    calls++;assert.match(url,/\/status$/);assert.equal(init.headers["Idempotency-Key"],undefined);
    assert.equal(init.signal.aborted,false);return Response.json(pending);}});
  assert.equal(await poll.finished,"limit");assert.equal(calls,24);assert.equal(updates,24);
});

test("stale response and cleanup abort cannot update the view",async()=>{
  let active=true,updates=0;
  const stale=pollPrivateAudit(transaction(),session,()=>updates++,{current:()=>active,send:async()=>{
    active=false;return Response.json(pending);}});
  assert.equal(await stale.finished,"stopped");assert.equal(updates,0);
  const aborted=pollPrivateAudit(transaction(),session,()=>updates++,{send:async(_url,init)=>new Promise((_r,reject)=>{
    init.signal.addEventListener("abort",()=>reject(new Error("aborted")),{once:true});})});
  aborted.stop();assert.equal(await aborted.finished,"stopped");assert.equal(updates,0);
});

test("request timeout stops polling and a ready status is not an email claim",async()=>{
  const timeout=pollPrivateAudit(transaction(),session,()=>assert.fail("update"),{timeoutMs:1,
    send:async(_url,init)=>new Promise((_r,reject)=>init.signal.addEventListener("abort",()=>reject(new Error("timeout")),{once:true}))});
  assert.equal(await timeout.finished,"unavailable");
  const ready={...pending,checkout_status:"PAID_PENDING_PROVISIONING",delivery_status:"DELIVERED",job_status:"SUCCEEDED",report_ready:true};
  let calls=0;const completed=pollPrivateAudit(transaction(),session,s=>{assert.equal(s.report_ready,true);
    assert.equal(s.email_received,undefined);},{send:async()=>{calls++;return Response.json(ready);}});
  assert.equal(await completed.finished,"ready");assert.equal(calls,1);
});

test("stopping inside a status update finishes before scheduling the next interval",async()=>{
  let poll;poll=pollPrivateAudit(transaction(),session,()=>poll.stop(),{intervalMs:10000,
    send:async()=>Response.json(pending)});
  assert.equal(await poll.finished,"stopped");
});
