import assert from "node:assert/strict";
import test from "node:test";
import { freezePrivateAudit, localAuditScope, reserveLocalAudit, checkoutPrivateAudit,
  statusPrivateAudit, privateAuditCheckoutUrl, privateAuditPost,downloadPrivateAudit } from "../app/configure/private-audit-client.ts";

const hash = "a".repeat(64);
const scope = {contexts:[{asset_id:"BTCUSDT",timeframe:"15m",strategy_version_id:"wolf.v1"}]};
const expiresAt = Date.parse("2026-11-10T07:13:30.679288+00:00");
const expected = {scopeHash:hash,expiresAt,cents:4900,receipt:"b".repeat(64)};
const quote = {authorization:false,scope_fingerprint:hash,quote_sha256:hash,
  pricing_version:"launch-v0.3",expires_at:"2026-11-10T07:13:30.679288+00:00",
  price:{currency:"eur",cadence:"ONE_TIME",due_today_ex_vat_cents:4900}};

const attachment={"Content-Type":"application/octet-stream","Content-Disposition":'attachment; filename="stratverity-audit.html"'};
test("report helper sends only scope/session and returns original attachment bytes",async()=>{
  const bytes=new TextEncoder().encode("<html>é opaque attachment</html>");
  const result=await downloadPrivateAudit("fixture",scope,"cs_fixture",async(url,init)=>{
    assert.equal(url,"/api/private-audit/fixture/report");assert.deepEqual(JSON.parse(init.body),{scope,checkout_session_id:"cs_fixture"});
    assert.deepEqual(init.headers,{"Content-Type":"application/json"});assert.equal(init.credentials,"same-origin");assert.equal(init.cache,"no-store");assert.equal(init.redirect,"error");assert.ok(init.signal);
    return new Response(bytes,{headers:attachment});
  });assert.deepEqual(result,bytes);
  await assert.rejects(downloadPrivateAudit("../bad",scope,"cs_fixture",()=>assert.fail("fetch")));
  await assert.rejects(downloadPrivateAudit("fixture",scope,"not-session",()=>assert.fail("fetch")));
});
test("report helper enforces binary byte bounds independently of declared length",async()=>{
  const max=8*1024*1024;
  assert.equal((await downloadPrivateAudit("a",scope,"cs_fixture",async()=>new Response(new Uint8Array(max),{headers:attachment}))).byteLength,max);
  for(const response of [new Response(new Uint8Array(max+1),{headers:attachment}),new Response(null,{headers:attachment}),
    new Response("x",{headers:{...attachment,"Content-Length":"2"}}),new Response("x",{headers:{...attachment,"Content-Encoding":"gzip"}}),
    new Response("x",{headers:{...attachment,"Content-Disposition":"inline"}}),new Response("x",{headers:{...attachment,"Content-Type":"text/html"}}),
    Response.json({authorization:false}),new Response(null,{status:404})]){
    await assert.rejects(downloadPrivateAudit("a",scope,"cs_fixture",async()=>response));
  }
});
test("report cancellation interrupts a stalled response stream without returning partial bytes",async()=>{
  const abort=new AbortController();let cancelled=false;
  const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array([1]));},cancel(){cancelled=true;}});
  const pending=downloadPrivateAudit("a",scope,"cs_fixture",async()=>new Response(stream,{headers:attachment}),abort.signal);
  setTimeout(()=>abort.abort(),0);await assert.rejects(pending);assert.equal(cancelled,true);
});

test("local mapping is exact and does not reuse a traditional symbol", () => {
  assert.equal(localAuditScope(scope).contexts[0].asset_id,"BINANCE:BTCUSDT");
  assert.equal(localAuditScope(localAuditScope(scope)).contexts[0].asset_id,"BINANCE:BTCUSDT");
  assert.throws(()=>localAuditScope({contexts:[{asset_id:"BINANCE:SOLUSDT",timeframe:"15m"}]}));
  assert.equal(scope.contexts[0].asset_id,"BTCUSDT");
  assert.throws(()=>localAuditScope({contexts:[{asset_id:"XAUUSD",timeframe:"15m"}]}));
  assert.throws(()=>localAuditScope({contexts:[{asset_id:"BTCUSDT",timeframe:"1m"}]}));
});

test("file bytes including BOM survive and incorrect deposit prevents freeze", async () => {
  const source = new Blob(["\ufeffdef run(bars):\r\n    return []\r\n"]);
  const calls = [];
  const send = async (url, init) => {
    calls.push([url,JSON.parse(init.body)]);
    return Response.json({authorization:false, source_sha256:hash});
  };
  await freezePrivateAudit("a",scope,source,hash,send);
  assert.equal(calls[0][1].source,"\ufeffdef run(bars):\r\n    return []\r\n");
  assert.deepEqual(calls.map(([url])=>url),["/api/private-audit/a/source","/api/private-audit/a/freeze"]);
  let tries = 0;
  await assert.rejects(freezePrivateAudit("a",scope,source,hash,async () => {
    tries++; return Response.json({authorization:false,source_sha256:"bad"});
  }));
  assert.equal(tries,1);
});

test("explicit reduced consent, exact amount, and a still-current window are required", async () => {
  await reserveLocalAudit("a",scope,expected,async (url,init)=>{
    assert.equal(url,"/api/private-audit/a/quote");
    assert.equal(JSON.parse(init.body).accepted_reduced_receipt_sha256,expected.receipt);
    return Response.json(quote);
  },()=>expiresAt-1);
  for (const altered of [{...quote,scope_fingerprint:"wrong"},{...quote,price:{...quote.price,due_today_ex_vat_cents:19}},
    {...quote,authorization:true}]) {
    await assert.rejects(reserveLocalAudit("a",scope,expected,async()=>Response.json(altered),()=>expiresAt-1));
  }
  let reads = 0;
  await assert.rejects(reserveLocalAudit("a",scope,expected,async()=>Response.json(quote),()=>expiresAt-1+reads++));
});

const checkout = {authorization:false,checkout_attempt_id:"checkout-"+"a".repeat(32),
  checkout_session_id:"cs_test_fixture001",checkout_url:"https://checkout.stripe.com/c/pay/cs_test_fixture001#fidkd%2Fopaque",
  scope_fingerprint:hash,quote_sha256:hash,status:"CHECKOUT_CREATED",pricing:{currency:"eur",cadence:"ONE_TIME",
    subtotal_ex_vat_cents:4900,activation_ex_vat_cents:0,due_today_ex_vat_cents:4900,
    tax_calculation:"STRIPE_AUTOMATIC_TAX_AT_CHECKOUT"}};
const contract = {contract_version:"fixture",accepted:true};
const key = "fixture-checkout-key-0001";
const validQuote = () => reserveLocalAudit("a",scope,expected,async()=>Response.json(quote),()=>expiresAt-1);

test("reserved quote is immutable, projected and returned for the next step", async () => {
  const returned = await reserveLocalAudit("a",scope,expected,
    async()=>Response.json({...quote,owner_ref:"not-retained",price:{...quote.price,internal:"not-retained"}}),()=>expiresAt-1);
  assert.deepEqual(returned,quote);
  assert.equal(Object.isFrozen(returned),true);
  assert.equal(Object.isFrozen(returned.price),true);
  assert.throws(()=>{returned.quote_sha256="b".repeat(64);});
  assert.throws(()=>{returned.price.due_today_ex_vat_cents=1;});
});

test("checkout sends only exact request and key, validates reply and never redirects", async () => {
  const frozen = await validQuote();let calls=0;
  const response=await checkoutPrivateAudit("a",scope,frozen,contract,key,async (url,init)=>{
    calls++;assert.equal(url,"/api/private-audit/a/checkout");
    assert.deepEqual(init.headers,{"Content-Type":"application/json","Idempotency-Key":key});
    assert.deepEqual(JSON.parse(init.body),{scope,quote_sha256:hash,pricing_version:"launch-v0.3",contract_acceptance:contract});
    assert.equal(init.redirect,"error");assert.equal(init.cache,"no-store");assert.equal(init.credentials,"same-origin");
    return Response.json({...checkout,owner_token:"hidden",pricing:{...checkout.pricing,internal:"hidden"}},{status:201});
  },()=>expiresAt-1);
  assert.deepEqual(response,checkout);
  assert.equal(Object.isFrozen(response),true);assert.equal(Object.isFrozen(response.pricing),true);assert.equal(calls,1);
});

test("expired retry is explicit and keeps exact quote and idempotency key", async () => {
  const frozen=await validQuote();let calls=0;
  const send=async (_url,init)=>{calls++;assert.equal(init.headers["Idempotency-Key"],key);
    assert.equal(JSON.parse(init.body).quote_sha256,hash);return Response.json(checkout,{status:201});};
  await assert.rejects(checkoutPrivateAudit("a",scope,frozen,contract,key,send,()=>expiresAt+1));
  assert.equal(calls,0);
  assert.deepEqual(await checkoutPrivateAudit("a",scope,frozen,contract,key,send,()=>expiresAt+1,
    {allowExpiredRetry:true}),checkout);
  await assert.rejects(checkoutPrivateAudit("a",scope,frozen,contract,key,send,()=>expiresAt+1,
    {allowExpiredRetry:1}));
  assert.equal(calls,1);
});

test("Stripe URL boundary allows official opaque fragment but never a different origin", () => {
  for (const url of ["https://checkout.stripe.com/c/pay/cs_test_a#fidkd%2Fopaque","https://stripe.com:443/c/pay/a",
    "https://checkout.stripe.com:443/c/pay/a?opaque=%2F#fidkd%2Fopaque"]) {
    assert.equal(privateAuditCheckoutUrl(url),true,url);
  }
  for (const url of ["https://evilstripe.com/pay","https://stripe.com.evil.test/pay","http://checkout.stripe.com/pay",
    "https://user:pw@checkout.stripe.com/pay","https://checkout.stripe.com:444/pay","http://127.0.0.1:3000/pay",
    "https://checkout.stripe.com./pay","https://checkout.stripe.com/\npath","https://[broken",null,
    "https://checkout.stripe.com:/pay","https://.stripe.com/pay","https://-bad.stripe.com/pay",
    "https://bad-.stripe.com/pay","https://check..stripe.com/pay","https://ｓｔｒｉｐｅ.com/pay",
    "https://%73tripe.com/pay","https://%EF%BD%93tripe.com/pay",
    "https://checkout.stripe.com\\@evil.test/pay","https://checkout.stripe.com/"+"a".repeat(4096)]) {
    assert.equal(privateAuditCheckoutUrl(url),false,String(url));
  }
});

test("checkout rejects mismatched identity, price, status, URL and response code", async () => {
  const frozen=await validQuote();
  for (const altered of [{...checkout,checkout_attempt_id:"bad"},{...checkout,checkout_session_id:"bad"},
    {...checkout,scope_fingerprint:"b".repeat(64)},{...checkout,quote_sha256:"b".repeat(64)},
    {...checkout,pricing:{...checkout.pricing,due_today_ex_vat_cents:1}},
    {...checkout,pricing:{...checkout.pricing,tax_calculation:"PERSONAL_FLAT_TAX"}},
    {...checkout,pricing:{...checkout.pricing,activation_ex_vat_cents:1}},
    {...checkout,status:"DELIVERED"},{...checkout,checkout_url:"https://evilstripe.com/pay"},
    {...checkout,authorization:true}]) {
    await assert.rejects(checkoutPrivateAudit("a",scope,frozen,contract,key,
      async()=>Response.json(altered,{status:201}),()=>expiresAt-1));
  }
  for (const status of [200,202,302,409,503]) {
    await assert.rejects(checkoutPrivateAudit("a",scope,frozen,contract,key,
      async()=>Response.json(checkout,{status}),()=>expiresAt-1));
  }
});

test("private status projection contains no legacy owner or report authority", async () => {
  const status={authorization:false,checkout_status:"PAID_PENDING_PROVISIONING",job_status:"SUCCEEDED",
    delivery_status:"DELIVERED",report_ready:true};
  const returned=await statusPrivateAudit("a",scope,"cs_test_fixture001",async (url,init)=>{
    assert.equal(url,"/api/private-audit/a/status");assert.deepEqual(init.headers,{"Content-Type":"application/json"});
    assert.deepEqual(JSON.parse(init.body),{scope,checkout_session_id:"cs_test_fixture001"});
    return Response.json({...status,email:"not-retained",report_id:"not-retained"});
  });
  assert.deepEqual(returned,status);assert.equal(Object.isFrozen(returned),true);
  for (const altered of [{...status,checkout_status:"unknown"},{...status,job_status:"unknown"},
    {...status,delivery_status:"unknown"},{...status,report_ready:"true"},
    {...status,checkout_status:"CHECKOUT_CREATED"},{...status,delivery_status:null},{...status,job_status:"RUNNING"},{...status,job_status:null}]) {
    await assert.rejects(statusPrivateAudit("a",scope,"cs_test_fixture001",async()=>Response.json(altered)));
  }
});

test("invalid operation, attempt or key cannot dispatch; strict response code applies", async () => {
  const forbidden=async()=>assert.fail("fetch called");
  for (const args of [["../escape","status",{},forbidden],["a","unknown",{},forbidden],
    ["a","checkout",{},forbidden,"short"],["a","checkout",{},forbidden,"has spaces in its key"],
    ["a","status",{},forbidden,key]]) await assert.rejects(privateAuditPost(...args));
  await assert.rejects(privateAuditPost("a","quote",{},async()=>Response.json(quote,{status:201})));
});
