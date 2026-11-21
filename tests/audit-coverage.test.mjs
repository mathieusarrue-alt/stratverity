import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
function load(name) {
  const filename = new URL(`../app/configure/${name}`, import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(filename,"utf8"), {
    fileName: name, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022 },
  });
  const mod = { exports: {} };
  new Function("require", "module", "exports", outputText)(require,mod,mod.exports);
  return mod.exports;
}

const { hasPrivateAuditCoverage, readAuditCoverage, auditAssetId, readAuditCapacity, auditCapacityMessage } = load("audit-coverage.ts");
const Panel = load("audit-coverage-panel.tsx").default;
const context = { asset_id:"BINANCE:BTCUSDT", strategy_version_id:"wolf.v1", timeframe:"15m" };
const now = Date.parse("2026-11-10T07:00:00Z");
const scope_fingerprint = "a".repeat(64);
const view = {
  schema:"stratverity.audit-private-pre-admission@1", authorization:false, scope_fingerprint,
  status:"CONFIRM_EXACT_REDUCED_WINDOW", profile:"L1", receipt_sha256:"b".repeat(64),
  expires_at:"2026-11-10T07:15:00.123456+00:00", requires_confirmation:true,
  contexts:[{...context, first_open:"2026-11-10T06:15:00+00:00", last_close:"2026-11-10T07:00:00+00:00",
    bars:3,target_years:8,reduced:true}],
};
const preview = value => ({ scope_fingerprint, audit_pre_admission:value,
  technical_estimate:{cost_drivers:{depth:"PREMIUM"}} });
const parse = (value, contexts=[context], clock=now) => readAuditCoverage(preview(value),contexts,clock);

test("static capacity matrix uses all catalogue depths and five timeframes without data claims", () => {
  const catalogue=JSON.parse(readFileSync(new URL('./fixtures/audit_history_catalogue.json',import.meta.url),'utf8'));
  // Same fixture already checked against the backend pricing catalogue below.
  const depths={ESSENTIAL:2,PREMIUM:8,STANDARD:8,ROBUSTNESS:8,CUSTOM:10};
  assert.ok(catalogue);
  for (const [depth,years] of Object.entries(depths)) for (const timeframe of ['15m','1h','4h','1d','1w']) {
    const result=readAuditCapacity(depth,[{...context,timeframe}]);
    assert.equal(result.status,timeframe==='15m' && years>2 ? 'HISTORY_EXCEEDS_L1_CAPACITY' : 'FITS_STATIC_COUNT_ONLY');
    assert.equal(result.years,years);
    assert.ok(Number.isSafeInteger(result.minBars) && result.minBars<=result.maxBars);
    assert.equal(Object.hasOwn(result,'authorization'),false);
    assert.equal(Object.hasOwn(result,'data_available'),false);
  }
});

test("unknown calendars, unsupported timeframes, multiple contexts and malformed depth stay blocked", () => {
  for (const depth of [null,undefined,true,2,'__proto__','UNKNOWN']) assert.equal(readAuditCapacity(depth,[context]).status,'CAPACITY_UNVERIFIED');
  for (const asset_id of ['BTCUSDT','EURUSD','MT5:EURUSD','YAHOO:SPY','BINANCE:BTC/USD']) {
    assert.equal(readAuditCapacity('ESSENTIAL',[{...context,asset_id}]).status,'CAPACITY_UNVERIFIED');
  }
  assert.equal(readAuditCapacity('ESSENTIAL',[{...context,timeframe:'5m'}]).status,'CAPACITY_UNVERIFIED');
  assert.equal(readAuditCapacity('ESSENTIAL',[]).status,'CAPACITY_UNVERIFIED');
  assert.equal(readAuditCapacity('ESSENTIAL',[context],0).status,'CAPACITY_UNVERIFIED');
  assert.equal(readAuditCapacity('ESSENTIAL',[context],true).status,'CAPACITY_UNVERIFIED');
  assert.equal(readAuditCapacity('ESSENTIAL',[context],2).status,'MULTI_CONTEXT_REVIEW_REQUIRED');
  assert.equal(readAuditCapacity('ESSENTIAL',[context,context]).status,'MULTI_CONTEXT_REVIEW_REQUIRED');
});

test("provider identities are explicit for the ten audit crypto selections only", () => {
  const {MARKET_CATALOG}=load('../config/market-catalog.ts');
  const crypto=MARKET_CATALOG.filter(asset=>asset.class==='crypto');
  assert.equal(crypto.length,10);
  for (const asset of MARKET_CATALOG) {
    assert.equal(auditAssetId('AUDIT',asset.id),asset.class==='crypto' ? 'BINANCE:'+asset.id : asset.id);
    assert.equal(auditAssetId('OPTIMIZER',asset.id),asset.id);
    assert.equal(auditAssetId('SCAN',asset.id),asset.id);
  }
  for (const asset of ['FAKEUSDT','__proto__','toString','btcUSDT','BINANCE:BTCUSDT']) assert.equal(auditAssetId('AUDIT',asset),asset);
});

test("selection changes immediately and messages separate capacity from price and data", () => {
  assert.equal(readAuditCapacity('PREMIUM',[context]).status,'HISTORY_EXCEEDS_L1_CAPACITY');
  assert.equal(readAuditCapacity('PREMIUM',[{...context,timeframe:'1h'}]).status,'FITS_STATIC_COUNT_ONLY');
  for (const locale of ['fr','en']) {
    assert.match(auditCapacityMessage(readAuditCapacity('PREMIUM',[context]),locale),locale==='fr' ? /pas réduite automatiquement/ : /not be silently reduced/);
    assert.match(auditCapacityMessage(readAuditCapacity('ESSENTIAL',[{...context,asset_id:'EURUSD'}]),locale),locale==='fr' ? /Aucun paiement/ : /No payment/);
    assert.equal(auditCapacityMessage(readAuditCapacity('ESSENTIAL',[context]),locale),'');
  }
});

test("checkout guard uses canonical captured payload before email, upload and payment calls", () => {
  const page=readFileSync(new URL('../app/configure/page.tsx',import.meta.url),'utf8');
  assert.match(page,/asset_id: auditAssetId\(product,asset\)/);
  const handler=page.slice(page.indexOf('const startCheckout = async () =>'),page.indexOf('const startCheckout = async () =>')+2200);
  assert.ok(handler.indexOf('privateAuditLocalMode()')<handler.indexOf('readAuditCapacity'));
  assert.ok(handler.indexOf('const actualScope=buildPayload()')<handler.indexOf('readAuditCapacity'));
  assert.ok(handler.indexOf('readAuditCapacity')<handler.indexOf('await sessionEmail()'));
  assert.match(page,/disabled=\{state === "checkout" \|\| !contractAccepted \|\| auditCapacityBlocked\}/);
  assert.match(page,/auditCapacityBlocked && <p role="status"/);
});

test("absent differs from null and no private preview grants payment", () => {
  assert.equal(hasPrivateAuditCoverage({ scope_fingerprint }),false);
  assert.equal(readAuditCoverage({scope_fingerprint},[context],now).status,"ABSENT");
  for (const value of [undefined,null,false,"",{},view,{...view,authorization:true}]) {
    assert.equal(hasPrivateAuditCoverage(preview(value)),true);
  }
  for (const value of [undefined,null,false,"",{}, {...view,authorization:true}]) assert.equal(parse(value).status,"INVALID");
});

test("exact window, malformed clock, expiry and changed context", () => {
  assert.equal(parse(view).status,"CONFIRM_EXACT_REDUCED_WINDOW");
  assert.equal(parse(view,[{...context,timeframe:"1h"}]).status,"INVALID");
  assert.equal(parse({...view,scope_fingerprint:"c".repeat(64)}).status,"INVALID");
  assert.equal(parse(view,[context],Date.parse(view.expires_at)).status,"EXPIRED");
  for (const change of [{bars:4},{target_years:21},{last_close:"2026-11-10T07:00:00"},
    {first_open:"2026-02-30T06:15:00Z"},{reduced:false}]) {
    assert.equal(parse({...view,contexts:[{...view.contexts[0],...change}]}).status,"INVALID");
  }
});

test("render verified window in French and English without a payment CTA", () => {
  for (const locale of ["fr","en"]) {
    const html = renderToStaticMarkup(createElement(Panel,{coverage:parse(view),locale}));
    assert.match(html,/BINANCE:BTCUSDT/);
    assert.match(html,/2026-11-10 06:15:00\+00:00/);
    assert.match(html,/2026-11-10 07:00:00\+00:00/);
    assert.match(html,/type="checkbox"/);
    assert.match(html,locale==="fr"?/Historique plus court que demandé/:/Less history than requested/);
    assert.doesNotMatch(html,/<button|<a |Stripe|checkout|checked=""/i);
    assert.doesNotMatch(html,new RegExp(view.receipt_sha256));
  }
});

test("unavailable, invalid, expired do not display a checkbox or dates", () => {
  const missing = {...view,status:"DATA_NOT_VERIFIED",contexts:[]};
  const long = {...view,status:"PROFILE_NOT_OFFERED",profile:"LONG",contexts:[]};
  for (const coverage of [parse(missing),parse(long),parse(null),parse(view,[context],Date.parse(view.expires_at))]) {
    const html = renderToStaticMarkup(createElement(Panel,{coverage,locale:"fr"}));
    assert.doesNotMatch(html,/checkbox|2026-11-10|<button/i);
  }
});

const p = new URL("./fixtures/audit-coverage-replay.json", import.meta.url);
test("rendered API fixture uses real frozen coverage without claiming max history", () => {
  const fixture = JSON.parse(readFileSync(p,"utf8"));
  const item = fixture.preview;
  const state = readAuditCoverage({scope_fingerprint:item.scope_fingerprint,audit_pre_admission:item,
    technical_estimate:{cost_drivers:{depth:"PREMIUM"}}},
    item.contexts, Date.parse(fixture.captured_at));
  assert.equal(state.status,"CONFIRM_EXACT_REDUCED_WINDOW");
  assert.equal(state.window.bars,99840);
  const html = renderToStaticMarkup(createElement(Panel,{coverage:state,locale:"fr"}));
  assert.match(html,/2024-01-05 06:45:00/);
  assert.match(html,/2026-11-10 06:45:00/);
  assert.match(html,/Cet aperçu ne permet pas de payer/);
  assert.doesNotMatch(html,/historique maximum|Stripe|<button/i);
});

test("calendar projection rejects false full history, off-grid H4, Sunday weekly and over-cap data", () => {
  const cases = [
    { status:"PRIVATE_QUOTE_POSSIBLE",requires_confirmation:false,window:{reduced:false} },
    { window:{timeframe:"4h",first_open:"2026-11-09T18:15:00Z",last_close:"2026-11-10T06:15:00Z"} },
    { window:{timeframe:"1w",first_open:"2026-10-18T00:00:00Z",last_close:"2026-11-08T00:00:00Z"} },
    { window:{first_open:"2026-11-10T06:00:00.000001Z",last_close:"2026-11-10T06:45:00.000001Z"} },
    { status:"PRIVATE_QUOTE_POSSIBLE",requires_confirmation:false,window:{timeframe:"1d",first_open:"2006-11-09T00:00:00Z",last_close:"2026-11-10T00:00:00Z",bars:7306,reduced:false} },
    { window:{asset_id:"PEPPERSTONE:BTCUSDT"} },
    { window:{target_years:2} },
  ];
  for (const {window,...change} of cases) {
    const w={...view.contexts[0],...window};
    const result=parse({...view,...change,contexts:[w]},[{...context,asset_id:w.asset_id,timeframe:w.timeframe}]);
    assert.equal(result.status,"INVALID",JSON.stringify(window));
  }
});

test("calendar projection retains H4, Monday weekly and leap-day calendar-year windows", () => {
  for (const [timeframe,first_open,last_close,bars,depth,target_years,reduced] of [
    ["4h","2026-11-09T16:00:00Z","2026-11-10T04:00:00Z",3,"PREMIUM",8,true],
    ["1w","2026-10-19T00:00:00Z","2026-11-09T00:00:00Z",3,"PREMIUM",8,true],
    ["1d","2022-02-28T00:00:00Z","2024-02-29T00:00:00Z",731,"ESSENTIAL",2,false],
    ["1d","2006-11-10T00:00:00Z","2026-11-10T00:00:00Z",7305,"PREMIUM",8,false],
  ]) {
    const w={...view.contexts[0],timeframe,first_open,last_close,bars,target_years,reduced};
    const state=readAuditCoverage({scope_fingerprint,audit_pre_admission:{...view,
      requires_confirmation:reduced,status:reduced?"CONFIRM_EXACT_REDUCED_WINDOW":"PRIVATE_QUOTE_POSSIBLE",contexts:[w]},
      technical_estimate:{cost_drivers:{depth}}},[{...context,timeframe}],Date.parse(last_close));
    assert.equal(state.status,reduced?"CONFIRM_EXACT_REDUCED_WINDOW":"PRIVATE_QUOTE_POSSIBLE");
    const html=renderToStaticMarkup(createElement(Panel,{coverage:state,locale:"fr"}));
    assert.match(html,/Période vérifiée|Historique plus court/);
    assert.doesNotMatch(html,/<button|Stripe|checkout/);
  }
});

test("verified window requires the scope history target, but blocked states stay blocked", () => {
  assert.equal(readAuditCoverage({scope_fingerprint,audit_pre_admission:view},[context],now).status,"INVALID");
  assert.equal(readAuditCoverage({...preview(view),technical_estimate:{cost_drivers:{depth:"UNKNOWN"}}},[context],now).status,"INVALID");
  const state=readAuditCoverage({scope_fingerprint,audit_pre_admission:{...view,status:"DATA_NOT_VERIFIED",contexts:[]}},[context],now);
  assert.equal(state.status,"DATA_NOT_VERIFIED");
});

test("history projection catalogue matches backend release fixture for all depths", () => {
  const catalogue=JSON.parse(readFileSync(new URL('./fixtures/audit_history_catalogue.json',import.meta.url),'utf8'));
  assert.equal(catalogue.pricing_version,'launch-v0.3');
  for (const [depth,target_years] of Object.entries(catalogue.history_years_by_depth)) {
    const state=readAuditCoverage({...preview({...view,contexts:[{...view.contexts[0],target_years}]}),
      technical_estimate:{cost_drivers:{depth}}},[context],now);
    assert.equal(state.status,'CONFIRM_EXACT_REDUCED_WINDOW');
    const wrong=target_years===2 ? 8 : 2;
    const bad=readAuditCoverage({...preview({...view,contexts:[{...view.contexts[0],target_years:wrong}]}),
      technical_estimate:{cost_drivers:{depth}}},[context],now);
    assert.equal(bad.status,'INVALID');
  }
});
