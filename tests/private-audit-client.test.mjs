import assert from "node:assert/strict";
import test from "node:test";
import { freezePrivateAudit, localAuditScope, reserveLocalAudit } from "../app/configure/private-audit-client.ts";

const hash = "a".repeat(64);
const scope = {contexts:[{asset_id:"BTCUSDT",timeframe:"15m",strategy_version_id:"wolf.v1"}]};
const expiresAt = Date.parse("2026-11-10T07:13:30.679288+00:00");
const expected = {scopeHash:hash,expiresAt,cents:4900,receipt:"b".repeat(64)};
const quote = {authorization:false,scope_fingerprint:hash,quote_sha256:hash,
  pricing_version:"launch-v0.3",expires_at:"2026-11-10T07:13:30.679288+00:00",
  price:{currency:"eur",cadence:"ONE_TIME",due_today_ex_vat_cents:4900}};

test("local mapping is exact and does not reuse a traditional symbol", () => {
  assert.equal(localAuditScope(scope).contexts[0].asset_id,"BINANCE:BTCUSDT");
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
