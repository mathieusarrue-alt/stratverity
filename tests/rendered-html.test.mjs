import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the StratVerity product page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /BacktestProof by StratVerity/i);
  assert.match(html, /STRATVERITY/);
  assert.match(html, /BACKTESTPROOF/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview/i);
});

test("server-renders the Audit and Scan scope configurator", async () => {
  const response = await render("/configure");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Composez votre audit/i);
  assert.match(html, /Ou votre scan/i);
  assert.match(html, /2 Mio/i);
  assert.match(html, /PRIX EN TEMPS RÉEL/i);
  assert.match(html, /sans devis/i);
  assert.match(html, /Aucun code de stratégie n’est envoyé/i);
});

test("connected audit form keeps the report metrics out of the browser response", async () => {
  const page = await readFile(
    new URL("../app/design-b/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(page, /\/v1\/audits\/tradingview/);
  assert.match(page, /\/v1\/qualifications\/python-bundle/);
  assert.match(page, /STATIC_ONLY_NO_EXECUTION/);
  assert.match(page, /Projet Python/);
  assert.match(page, /accept="\.pine,text\/plain"/);
  assert.match(page, /accept="\.csv,text\/csv"/);
  assert.match(page, /terms_accepted/);
  assert.match(page, /delivery_status:\s*"EMAIL_REQUIRED"/);
  assert.match(page, /setAuditTeaser/);
  assert.doesNotMatch(page, /payload\.metrics|payload\.checks/);
});

test("scope configurator targets the bounded preview endpoint", async () => {
  const page = await readFile(
    new URL("../app/configure/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(page, /\/v1\/service-scopes\/preview/);
  assert.match(page, /REQUEST_LIMIT_BYTES\s*=\s*2\s*\*\s*1024\s*\*\s*1024/);
  assert.match(page, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(page, /Aucun code de stratégie n’est envoyé/);
  assert.match(page, /calculatePrice/);
  assert.match(page, /\/v1\/billing\/checkout-sessions/);
  assert.match(page, /"Idempotency-Key"/);
  assert.match(page, /checkout\.stripe\.com/);
  assert.match(page, /beta-fr-2026-08-12-v1/);
  assert.match(page, /AUDIT_BETA_NO_MARKETPLACE_RESALE/);
  assert.match(page, /contract_acceptance/);
  assert.match(page, /Scan sur invitation/);
  assert.match(page, /Stripe test uniquement/i);
  assert.doesNotMatch(page, /payment_intent|STRIPE_SECRET_KEY/);
});

test("legal beta bundle is public and excludes client-code resale", async () => {
  for (const path of [
    "/legal/terms",
    "/legal/privacy",
    "/legal/content-license",
    "/legal/refunds",
    "/legal/risk",
  ]) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, /beta-fr-2026-08-12-v1/i, path);
    assert.match(html, /aucun paiement réel/i, path);
  }
  const license = await (await render("/legal/content-license")).text();
  assert.match(license, /propriétaire de votre stratégie/i);
  assert.match(license, /exclut expressément la publication/i);
  assert.match(license, /vente, la sous-licence/i);
});

test("checkout return never claims provisioning before the signed webhook", async () => {
  const response = await render("/configure/success");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Confirmation en cours/i);
  assert.match(html, /paiement signé/i);
  assert.match(html, /Aucun audit, scan ou worker n’est lancé/i);
  assert.doesNotMatch(html, /service activé|paiement confirmé/i);
});

test("checkout and return page bind uploads to one browser-held owner token", async () => {
  const configurator = await readFile(
    new URL("../app/configure/page.tsx", import.meta.url),
    "utf8",
  );
  const returnPage = await readFile(
    new URL("../app/configure/success/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(configurator, /owner_token:\s*ownerToken/);
  assert.match(configurator, /sessionStorage\.setItem/);
  assert.match(returnPage, /\/v1\/orders\/status/);
  assert.match(returnPage, /\/submissions/);
  assert.match(returnPage, /\/qualifications/);
  assert.match(returnPage, /Lancer la qualification statique/);
  assert.match(returnPage, /STATIC_QUALIFIED_AWAITING_APPROVAL/);
  assert.match(returnPage, /STRATEGY_SOURCE/);
  assert.match(returnPage, /BACKTEST_EVIDENCE/);
  assert.match(returnPage, /NOT_CREATED/);
  assert.match(returnPage, /NOT_DISPATCHED/);
  assert.match(returnPage, /\/audit-reports\/\$\{draft\.draft_id\}\/access/);
  assert.match(returnPage, /\/audit-reports\/status/);
  assert.match(returnPage, /\/v1\/paid-audit-reports\/\$\{draft\.draft_id\}/);
  assert.match(returnPage, /sandbox=""/);
  assert.doesNotMatch(returnPage, /localStorage/);
  assert.doesNotMatch(configurator + returnPage, /sk_test_|whsec_/);
});

test("private admin console keeps its bearer secret in volatile component state", async () => {
  const page = await readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8");
  const consoleSource = await readFile(
    new URL("../app/admin/review-console.tsx", import.meta.url),
    "utf8",
  );
  assert.match(page, /requireChatGPTUser\("\/admin"\)/);
  assert.match(consoleSource, /\/v1\/admin\/audit-drafts/);
  assert.match(consoleSource, /Authorization:\s*`Bearer \$\{adminSecret\}`/);
  assert.match(consoleSource, /useState\(""\)/);
  assert.doesNotMatch(consoleSource, /localStorage|sessionStorage|NEXT_PUBLIC_.*ADMIN/);
});

test("scope configurator publishes a deterministic launch price grid", async () => {
  const pricing = await readFile(
    new URL("../app/configure/pricing.ts", import.meta.url),
    "utf8",
  );

  assert.match(pricing, /version:\s*"launch-v0\.1"/);
  assert.match(pricing, /AUDIT_CONTEXT_BANDS/);
  assert.match(pricing, /SCAN_CONTEXT_BANDS/);
  assert.match(pricing, /const VAT_RATE = 0\.2/);
  assert.match(pricing, /activationExVatCents = 2_900 \* strategyCount/);
  assert.doesNotMatch(pricing, /quote|devis/i);
});

test("deployment metadata and worker output are present", async () => {
  const hosting = JSON.parse(
    await readFile(
      new URL("../.openai/hosting.json", import.meta.url),
      "utf8",
    ),
  );
  assert.match(hosting.project_id, /^appgprj_/);
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../public/og.png", import.meta.url));
});
