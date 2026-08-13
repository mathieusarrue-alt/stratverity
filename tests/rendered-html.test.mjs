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
  assert.match(html, /StratVerity/i);
  assert.match(html, /BACKTESTPROOF/);
  assert.match(html, /Exemple illustratif/i);
  assert.match(html, /href="\/configure"/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview/i);
});

test("server-renders the Audit and Scan scope configurator", async () => {
  const response = await render("/configure");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Build your audit/i);
  assert.match(html, /Or your scan/i);
  assert.match(html, /2 MiB/i);
  assert.match(html, /LAUNCH PRICING/i);
  assert.match(html, /no quote/i);
  assert.match(html, /No strategy code is sent/i);
});

test("landing uses the centralized 12-language design source", async () => {
  const landing = await readFile(
    new URL("../app/home/LandingPage.tsx", import.meta.url),
    "utf8",
  );
  const messages = await readFile(
    new URL("../app/i18n/messages.ts", import.meta.url),
    "utf8",
  );
  const header = await readFile(
    new URL("../app/components/SiteHeader.tsx", import.meta.url),
    "utf8",
  );
  const layout = await readFile(
    new URL("../app/layout.tsx", import.meta.url),
    "utf8",
  );
  const ambient = await readFile(
    new URL("../app/components/AmbientExperience.tsx", import.meta.url),
    "utf8",
  );

  for (const locale of ["fr", "en", "es", "pt", "de", "it", "ru", "zh", "ko", "hi", "ar", "bn"]) {
    assert.match(messages, new RegExp(`"${locale}"\\s*:`), locale);
  }
  assert.match(landing, /landingMarkup/);
  assert.match(landing, /prefers-reduced-motion/);
  assert.match(header, /brand-light\.svg/);
  assert.match(header, /brand-dark\.svg/);
  assert.match(header, /\/configure/);
  assert.match(header, /\/login\?return_to=\/account/);
  assert.match(layout, /<AmbientExperience \/>/);
  assert.match(ambient, /id="fx"/);
  assert.match(ambient, /data-premium-surface/);
  assert.doesNotMatch(landing, /querySelector<HTMLCanvasElement>\("#fx"\)/);
  assert.doesNotMatch(landing + header, /sk_test_|whsec_|STRIPE_SECRET_KEY/);
});

test("application routes use the generated 12-locale catalogue with English default", async () => {
  const provider = await readFile(
    new URL("../app/i18n/I18nProvider.tsx", import.meta.url),
    "utf8",
  );
  const catalogue = await import(
    new URL(`../scripts/app-messages.mjs?test=${Date.now()}`, import.meta.url)
  );
  const sources = await Promise.all([
    "../app/configure/page.tsx",
    "../app/configure/success/page.tsx",
    "../app/admin/review-console.tsx",
    "../app/legal/LegalPage.tsx",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));

  assert.match(provider, /useState<Locale>\("en"\)/);
  const expectedKeys = Object.keys(catalogue.appMessages.en).sort();
  assert.ok(expectedKeys.length >= 230);
  for (const locale of ["fr", "en", "es", "pt", "de", "it", "ru", "zh", "ko", "hi", "ar", "bn"]) {
    assert.deepEqual(Object.keys(catalogue.appMessages[locale]).sort(), expectedKeys, locale);
    assert.ok(expectedKeys.every((key) => typeof catalogue.appMessages[locale][key] === "string"), locale);
  }
  assert.match(sources.join("\n"), /useI18n/);
  assert.match(sources[0], /toLocaleString\(locale\)/);
  assert.match(sources[0], /Intl\.NumberFormat\(locale/);
});

test("public login offers the low-friction verified identity path", async () => {
  const response = await render("/login?return_to=/account");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /CONNEXION OU INSCRIPTION/i);
  assert.match(html, />Continuer<\/span>/i);
  assert.doesNotMatch(html, /Continuer avec ChatGPT/i);
  assert.match(html, /Google/i);
  assert.match(html, /Microsoft/i);
  assert.match(html, /Email/i);
  assert.doesNotMatch(html, /via ChatGPT/i);
  assert.match(html, /aria-label="Ouvrir l’écran sécurisé et continuer avec Google/i);
  assert.match(html, /aria-label="Ouvrir l’écran sécurisé et continuer avec Microsoft/i);
  assert.match(html, /GitHub direct sera propos/i);
  assert.match(html, /Aucun accès à vos conversations/i);
});

test("every public route receives the shared interactive art direction", async () => {
  for (const path of ["/", "/configure", "/configure/success", "/login", "/legal/terms"]) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, /class="ambient-experience"/, path);
    assert.match(html, /<canvas[^>]+id="fx"/, path);
  }
});

test("customer account stays protected by server-side identity", async () => {
  const response = await render("/account");
  assert.ok([302, 303, 307, 308].includes(response.status));
  assert.match(
    response.headers.get("location") ?? "",
    /^(?:http:\/\/localhost)?\/signin-with-chatgpt\?/,
  );
});

test("scope configurator targets the bounded preview endpoint", async () => {
  const page = await readFile(
    new URL("../app/configure/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(page, /\/v1\/service-scopes\/preview/);
  assert.match(page, /REQUEST_LIMIT_BYTES\s*=\s*2\s*\*\s*1024\s*\*\s*1024/);
  assert.match(page, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(page, /configure\.localFilesBody/);
  assert.match(page, /calculatePrice/);
  assert.match(page, /\/v1\/billing\/checkout-sessions/);
  assert.match(page, /"Idempotency-Key"/);
  assert.match(page, /checkout\.stripe\.com/);
  assert.match(page, /beta-fr-2026-08-12-v1/);
  assert.match(page, /AUDIT_BETA_NO_MARKETPLACE_RESALE/);
  assert.match(page, /contract_acceptance/);
  assert.match(page, /configure\.scanInvitation/);
  assert.match(page, /configure\.betaBanner/);
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
    assert.match(html, /no real payment/i, path);
  }
  const license = await (await render("/legal/content-license")).text();
  assert.match(license, /remain the owner of your strategy/i);
  assert.match(license, /expressly excludes publishing/i);
  assert.match(license, /selling, sublicensing/i);
});

test("checkout return never claims provisioning before the signed webhook", async () => {
  const response = await render("/configure/success");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Confirmation in progress/i);
  assert.match(html, /Stripe-signed payment/i);
  assert.match(html, /No audit, scan or worker is started/i);
  assert.doesNotMatch(html, /service activated|payment confirmed/i);
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
  assert.match(returnPage, /success\.qualifyAction/);
  assert.match(returnPage, /STATIC_QUALIFIED_AWAITING_APPROVAL/);
  assert.match(returnPage, /STRATEGY_SOURCE/);
  assert.match(returnPage, /BACKTEST_EVIDENCE/);
  assert.match(returnPage, /NOT_CREATED/);
  assert.match(returnPage, /NOT_DISPATCHED/);
  assert.match(returnPage, /\/audit-reports\/\$\{draft\.draft_id\}\/access/);
  assert.match(returnPage, /approvedReportHtml\s*\?\s*t\("success\.title\.approved"\)/);
  assert.match(returnPage, /approvedReportHtml\s*\?\s*"REPORT_APPROVED"/);
  assert.match(returnPage, /success\.deliveredTitle/);
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
  assert.match(pricing, /const VAT_RATE = 0/);
  assert.match(pricing, /franchise en base de TVA/i);
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
