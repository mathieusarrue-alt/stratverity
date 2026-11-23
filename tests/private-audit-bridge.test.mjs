import assert from "node:assert/strict";
import test from "node:test";
import { proxyPrivateAudit } from "../app/api/private-audit/bridge.ts";

const site = "http://127.0.0.1:3100";
const upstream = "http://127.0.0.1:8100";
const request = (options = {}) => new Request(site + "/api/private-audit/a.b/quote", {
  method: "POST", headers: { Origin: site, "Content-Type": "application/json" }, body: "{}", ...options,
});
const config = (extra = {}) => ({ development:true, enabled:true, site, upstream,
  readToken: async () => "cookie-token", ...extra });

const binaryHeaders={"Content-Type":"application/octet-stream"};
const binaryConfig=extra=>config({checkoutEnabled:true,reportEnabled:true,...extra});
test("report needs its own strict opt-in and checkout before identity/body",async()=>{
  for(const extra of [{reportEnabled:false},{reportEnabled:undefined},{reportEnabled:1},{checkoutEnabled:false}]){
    assert.equal((await proxyPrivateAudit(request(),"a","report",binaryConfig({readToken:()=>assert.fail("auth"),...extra}))).status,404);
  }
  assert.equal((await proxyPrivateAudit(request(),"a","report",binaryConfig({readToken:async()=>undefined,send:()=>assert.fail("upstream")}))).status,401);
});
test("report is an exact attachment with only cookie auth and safe constant headers",async()=>{
  const bytes=new TextEncoder().encode("<html>é fixture</html>");
  const response=await proxyPrivateAudit(request({headers:{Origin:site,"Content-Type":"application/json",Authorization:"Bearer evil","Idempotency-Key":"untrusted"}}),"a","report",binaryConfig({send:async(url,init)=>{
    assert.equal(url,upstream+"/v1/private-audit/intakes/a/report");assert.equal(init.redirect,"manual");assert.equal(init.cache,"no-store");
    assert.deepEqual(init.headers,{Authorization:"Bearer cookie-token",Origin:site,"Content-Type":"application/json"});
    return new Response(bytes,{headers:{...binaryHeaders,"Set-Cookie":"bad=1","Location":"https://evil.test","Content-Disposition":"inline; filename=unsafe.html","X-Private":"secret"}});
  }}));
  assert.equal(response.status,200);assert.deepEqual(new Uint8Array(await response.arrayBuffer()),bytes);
  assert.equal(response.headers.get("content-disposition"),'attachment; filename="stratverity-audit.html"');
  for(const name of ["set-cookie","location","x-private"])assert.equal(response.headers.get(name),null);
  assert.equal(response.headers.get("cache-control"),"no-store");assert.equal(response.headers.get("x-content-type-options"),"nosniff");
  assert.equal(response.headers.get("referrer-policy"),"no-referrer");assert.equal(response.headers.get("x-robots-tag"),"noindex, nofollow");
  assert.match(response.headers.get("content-security-policy"),/frame-ancestors 'none'/);
});
test("report actual byte bound includes chunked replies and rejects empty/compressed/redirect/MIME",async()=>{
  const max=8*1024*1024;
  const accepted=await proxyPrivateAudit(request(),"a","report",binaryConfig({send:async()=>new Response(new Uint8Array(max),{headers:binaryHeaders})}));
  assert.equal(accepted.status,200);assert.equal((await accepted.arrayBuffer()).byteLength,max);
  let cancelled=false;
  const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(max));c.enqueue(new Uint8Array(1));},cancel(){cancelled=true;}});
  assert.equal((await proxyPrivateAudit(request(),"a","report",binaryConfig({send:async()=>new Response(stream,{headers:binaryHeaders})}))).status,503);assert.equal(cancelled,true);
  for(const value of [new Response(null,{headers:binaryHeaders}),new Response("x",{headers:{"Content-Type":"text/html"}}),
    new Response("x",{headers:{...binaryHeaders,"Content-Encoding":"gzip"}}),new Response("x",{headers:{...binaryHeaders,"Content-Length":"2"}}),
    new Response(null,{status:302,headers:{Location:"https://evil.test"}})]){
    assert.equal((await proxyPrivateAudit(request(),"a","report",binaryConfig({send:async()=>value}))).status,503);
  }
});
test("report header oversize and mismatched length both cancel upstream bodies",async()=>{
  for(const declared of [String(8*1024*1024+1),"2"]){
    const response=new Response("x",{headers:{...binaryHeaders,"Content-Length":declared}});
    let cancelled=0;const original=response.body.cancel.bind(response.body);response.body.cancel=(...args)=>{cancelled++;return original(...args);};
    assert.equal((await proxyPrivateAudit(request(),"a","report",binaryConfig({send:async()=>response}))).status,503);
    assert.equal(cancelled,1);
  }
});

test("disabled, invalid targets and non-allowlisted actions cannot read a session", async () => {
  const readToken = () => assert.fail("session read");
  for (const extra of [{development:false}, {enabled:false}, {upstream:"https://example.test"},
    {upstream:"http://localhost:8100"}, {upstream:site}, {upstream:upstream+"/"}]) {
    assert.equal((await proxyPrivateAudit(request(), "a.b", "quote", config({readToken,...extra}))).status,404);
  }
  assert.equal((await proxyPrivateAudit(request(), "a.b", "checkout", config({readToken}))).status,404);
  assert.equal((await proxyPrivateAudit(request(), "../a", "quote", config({readToken}))).status,404);
  assert.equal((await proxyPrivateAudit(request({headers:{Origin:"https://example.test"}}),
    "a.b", "quote", config({readToken}))).status,403);
});

test("only cookie-derived token and exact allowed destination are forwarded", async () => {
  const req = request({headers:{Origin:site,"Content-Type":"application/json",
    Authorization:"Bearer browser-controlled",Cookie:"arbitrary=1","X-Forwarded-Host":"external.test"}});
  const response = await proxyPrivateAudit(req, "a.b", "quote", config({send: async (url, init) => {
    assert.equal(url, upstream+"/v1/private-audit/intakes/a.b/quote");
    assert.equal(init.redirect, "manual");
    assert.deepEqual(init.headers, {Authorization:"Bearer cookie-token",Origin:site,"Content-Type":"application/json"});
    assert.equal(new TextDecoder().decode(init.body), "{}");
    return Response.json({quote_sha256:"proof", authorization:false, internal:"private"}, {headers:{"Set-Cookie":"private=1"}});
  }}));
  assert.equal(response.status,200);
  assert.equal(response.headers.get("set-cookie"),null);
  assert.equal(response.headers.get("cache-control"),"no-store");
  assert.deepEqual(await response.json(), {quote_sha256:"proof",authorization:false});
});

test("unverified session does not read body; bounds work without declared length", async () => {
  const denied = request();
  assert.equal((await proxyPrivateAudit(denied,"a","freeze",config({readToken:async()=>undefined}))).status,401);
  assert.equal(denied.bodyUsed,false);
  assert.equal((await proxyPrivateAudit(request({body:"a".repeat(65537)}),
    "a","freeze",config({send:async()=>assert.fail("upstream called")}))).status,413);
});

test("oversized, redirect and authorization-bearing upstream replies fail closed", async () => {
  for (const makeResponse of [
    () => Response.redirect("https://example.test",302),
    () => Response.json({authorization:false,pad:"a".repeat(131073)}),
    () => Response.json({authorization:true}),
    () => new Response("<html>bad</html>"),
  ]) {
    const response = await proxyPrivateAudit(request(),"a","quote",config({send:async()=>makeResponse()}));
    assert.equal(response.status,503);
    assert.equal(response.headers.get("location"),null);
  }
});

const checkout = {authorization:false,checkout_attempt_id:"checkout-"+"a".repeat(32),checkout_session_id:"cs_test_fixture001",
  checkout_url:"https://checkout.stripe.com/c/pay/cs_test_fixture001#fidkd%2Fopaque",scope_fingerprint:"a".repeat(64),
  quote_sha256:"b".repeat(64),status:"CHECKOUT_CREATED",pricing:{currency:"eur",cadence:"ONE_TIME",
    subtotal_ex_vat_cents:4900,activation_ex_vat_cents:0,due_today_ex_vat_cents:4900,
    tax_calculation:"STRIPE_AUTOMATIC_TAX_AT_CHECKOUT"}};
const key="fixture-checkout-key-0001";
const checkoutRequest = (extra={}) => request({headers:{Origin:site,"Content-Type":"application/json",
  "Idempotency-Key":key,Authorization:"Bearer browser-controlled"},...extra});

test("checkout and status need a strict separate opt-in before reading the session", async () => {
  for (const checkoutEnabled of [undefined,false,1,"true",null]) {
    const readToken=()=>assert.fail("session read");
    for (const operation of ["checkout","status"]) {
      assert.equal((await proxyPrivateAudit(checkoutRequest(),"a",operation,config({checkoutEnabled,readToken}))).status,404);
    }
  }
  const disabled=await proxyPrivateAudit(checkoutRequest(),"a","checkout",config({development:false,checkoutEnabled:true,
    readToken:()=>assert.fail("session read")}));
  assert.equal(disabled.status,404);
});

test("checkout forwards only cookie bearer plus exact key and projects 201 without redirect", async () => {
  const result=await proxyPrivateAudit(checkoutRequest(),"a","checkout",config({checkoutEnabled:true,send:async(url,init)=>{
    assert.equal(url,upstream+"/v1/private-audit/intakes/a/checkout");
    assert.deepEqual(init.headers,{Authorization:"Bearer cookie-token",Origin:site,"Content-Type":"application/json","Idempotency-Key":key});
    assert.equal(init.redirect,"manual");
    return Response.json({...checkout,owner_token:"hidden",pricing:{...checkout.pricing,internal:"hidden"}},
      {status:201,headers:{"Set-Cookie":"private=1",Location:"https://evil.test"}});
  }}));
  assert.equal(result.status,201);assert.equal(result.headers.get("cache-control"),"no-store");
  assert.equal(result.headers.get("location"),null);assert.equal(result.headers.get("set-cookie"),null);
  assert.deepEqual(await result.json(),checkout);
});

test("duplicate or malformed checkout key fails before session or upstream", async () => {
  for (const value of [undefined,"short","a".repeat(256),"invalid key has spaces",key+", "+key]) {
    const h={Origin:site,"Content-Type":"application/json",...(value ? {"Idempotency-Key":value} : {})};
    const result=await proxyPrivateAudit(request({headers:h}),"a","checkout",config({checkoutEnabled:true,
      readToken:()=>assert.fail("session read"),send:async()=>assert.fail("upstream called")}));
    assert.equal(result.status,400);assert.equal(result.headers.get("cache-control"),"no-store");
  }
});

test("status uses 200 and strips key, private identities and report fields", async () => {
  const status={checkout_status:"PAID_PENDING_PROVISIONING",job_status:"SUCCEEDED",delivery_status:"DELIVERED",
    report_ready:true,authorization:false};
  const result=await proxyPrivateAudit(checkoutRequest(),"a","status",config({checkoutEnabled:true,send:async(_url,init)=>{
    assert.deepEqual(init.headers,{Authorization:"Bearer cookie-token",Origin:site,"Content-Type":"application/json"});
    return Response.json({...status,source:"hidden",email:"hidden",report_id:"hidden",report_url:"hidden"});
  }}));
  assert.equal(result.status,200);assert.deepEqual(await result.json(),status);
  for (const bad of [{...status,report_ready:"true"},{...status,job_status:"unknown"},
    {...status,checkout_status:"CHECKOUT_CREATED"},{...status,delivery_status:null},{...status,job_status:"RUNNING"},{...status,job_status:null}]) {
    assert.equal((await proxyPrivateAudit(request(),"a","status",config({checkoutEnabled:true,
      send:async()=>Response.json(bad)}))).status,503);
  }
});

test("bad checkout upstream states, costs and origins remain closed", async () => {
  for (const bad of [{...checkout,checkout_url:"https://evilstripe.com/pay"},
    {...checkout,checkout_url:"https://checkout.stripe.com:444/pay"},
    {...checkout,checkout_url:"https://checkout.stripe.com:/pay"},
    {...checkout,checkout_url:"https://.stripe.com/pay"},
    {...checkout,checkout_url:"https://-bad.stripe.com/pay"},
    {...checkout,checkout_url:"https://bad-.stripe.com/pay"},
    {...checkout,checkout_url:"https://check..stripe.com/pay"},
    {...checkout,checkout_url:"https://ｓｔｒｉｐｅ.com/pay"},
    {...checkout,checkout_url:"https://%73tripe.com/pay"},
    {...checkout,checkout_url:"https://%EF%BD%93tripe.com/pay"},
    {...checkout,checkout_url:"https://user:pw@checkout.stripe.com/pay"},
    {...checkout,quote_sha256:"bad"},{...checkout,scope_fingerprint:"bad"},
    {...checkout,pricing:{...checkout.pricing,due_today_ex_vat_cents:1}},
    {...checkout,status:"DELIVERED"},{...checkout,authorization:true}]) {
    const result=await proxyPrivateAudit(checkoutRequest(),"a","checkout",config({checkoutEnabled:true,
      send:async()=>Response.json(bad,{status:201})}));
    assert.equal(result.status,503);assert.equal(result.headers.get("cache-control"),"no-store");
  }
  for (const status of [200,202,302]) {
    assert.equal((await proxyPrivateAudit(checkoutRequest(),"a","checkout",config({checkoutEnabled:true,
      send:async()=>Response.json(checkout,{status})}))).status,503);
  }
  for (const status of [400,401,403,404,409,413,415,429,503]) {
    const result=await proxyPrivateAudit(checkoutRequest(),"a","checkout",config({checkoutEnabled:true,
      send:async()=>Response.json({private:"ignored"},{status})}));
    assert.equal(result.status,status);assert.equal((await result.json()).private,undefined);
  }
  const explicit443={...checkout,checkout_url:"https://checkout.stripe.com:443/c/pay/a?opaque=%2F#fidkd%2Fopaque"};
  const positive=await proxyPrivateAudit(checkoutRequest(),"a","checkout",config({checkoutEnabled:true,
    send:async()=>Response.json(explicit443,{status:201})}));
  assert.equal(positive.status,201);assert.equal((await positive.json()).checkout_url,explicit443.checkout_url);
});
