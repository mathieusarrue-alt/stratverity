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

const { hasPrivateAuditCoverage, readAuditCoverage } = load("audit-coverage.ts");
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
const preview = value => ({ scope_fingerprint, audit_pre_admission:value });
const parse = (value, contexts=[context], clock=now) => readAuditCoverage(preview(value),contexts,clock);

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
  const state = readAuditCoverage({scope_fingerprint:item.scope_fingerprint,audit_pre_admission:item},
    item.contexts, Date.parse(fixture.captured_at));
  assert.equal(state.status,"CONFIRM_EXACT_REDUCED_WINDOW");
  assert.equal(state.window.bars,99840);
  const html = renderToStaticMarkup(createElement(Panel,{coverage:state,locale:"fr"}));
  assert.match(html,/2024-01-05 06:45:00/);
  assert.match(html,/2026-11-10 06:45:00/);
  assert.match(html,/Cet aperçu ne permet pas de payer/);
  assert.doesNotMatch(html,/historique maximum|Stripe|<button/i);
});
