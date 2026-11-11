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
