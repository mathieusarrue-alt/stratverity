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
    assert.match(html, /StratVerity/i);
    assert.match(html, /Illustrative example/i);
    assert.match(html, /Essential audit/i);
    assert.match(html, /€14\.99/i);
    assert.match(html, /href="\/configure"/);
    assert.doesNotMatch(html, /Your site is taking shape|codex-preview/i);
  });

test("every frontend response receives the shared security policy", async () => {
  for (const path of ["/", "/configure", "/login", "/legal/privacy", "/cert/demo-audit"]) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    const csp = response.headers.get("content-security-policy") ?? "";
    assert.match(csp, /default-src 'self'/, path);
    assert.match(csp, /object-src 'none'/, path);
    assert.match(csp, /frame-ancestors 'none'/, path);
    assert.match(csp, /connect-src 'self' https:\/\/api\.stratverity\.com https:\/\/qxeylhrjelywtjoswyni\.supabase\.co/, path);
    assert.equal(
      response.headers.get("strict-transport-security"),
      "max-age=31536000; includeSubDomains",
      path,
    );
    assert.equal(response.headers.get("x-content-type-options"), "nosniff", path);
    assert.equal(response.headers.get("x-frame-options"), "DENY", path);
    assert.equal(
      response.headers.get("referrer-policy"),
      "strict-origin-when-cross-origin",
      path,
    );
    assert.equal(
      response.headers.get("cross-origin-opener-policy"),
      "same-origin-allow-popups",
      path,
    );
    assert.match(response.headers.get("permissions-policy") ?? "", /camera=\(\)/, path);
    assert.equal(response.headers.get("x-xss-protection"), "0", path);
  }
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
  assert.match(html, /Essential/i);
  assert.match(html, /€14\.99|€14,99/i);
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
  assert.match(header, /StratVerityLogo/);
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

test("public login offers verified email and real Supabase OAuth actions", async () => {
  const response = await render("/login?return_to=/account");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /SIGN IN OR CREATE ACCOUNT/i);
  assert.match(html, /Send my sign-in link/i);
  assert.match(html, /Email address/i);
  assert.doesNotMatch(html, /via ChatGPT|Continue with ChatGPT/i);
  assert.match(html, /Disabled buttons activate automatically/i);
  assert.match(html, /No access to your conversations/i);

  const source = await readFile(
    new URL("../app/login/LoginContent.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /signInWithOAuth/);
  assert.match(source, /signInWithOtp/);
  assert.match(source, /shouldCreateUser:\s*true/);
  assert.match(source, /\/auth\/callback/);
  // Les providers sont déclarés et filtrés par activation (pas grisés au SSR) :
  // ils n'apparaissent dans le HTML que si Supabase les active.
  assert.match(source, /"google"/);
  assert.match(source, /"github"/);
  assert.match(source, /\.filter\(\(\{ value \}\) => enabled\.has\(value\)\)/);
});
test("contact details are public and pricing Contact Us opens them", async () => {
  const [contact, landing] = await Promise.all([render("/contact"), render("/")]);
  assert.equal(contact.status, 200);
  const contactHtml = await contact.text();
  assert.match(contactHtml, /contact@stratverity\.com/i);
  assert.match(contactHtml, /Prism Works/i);
  assert.doesNotMatch(contactHtml, /Mathieu Sarrue|903 756 575 00028|11 avenue du Huit Mai/i);
  const landingHtml = await landing.text();
  assert.match(landingHtml, /href="\/contact"[^>]*data-i18n="pr\.contact"/i);
});

test("every public route receives the shared interactive art direction", async () => {
  for (const path of ["/", "/configure", "/configure/success", "/login", "/contact", "/legal/terms"]) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, /class="ambient-experience"/, path);
    assert.match(html, /<canvas[^>]+id="fx"/, path);
  }
});

test("mobile theme follows the real document state and survives restricted storage", async () => {
  const [layout, header, css] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/SiteHeader.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /localStorage\.getItem\("sv-theme"\)/);
  assert.match(layout, /prefers-color-scheme: dark/);
  assert.match(layout, /dataset\.stratverityTheme/);
  assert.match(header, /document\.documentElement\.dataset\.theme === "dark"/);
  assert.match(header, /document\.documentElement\.style\.colorScheme = nextTheme/);
  assert.match(header, /catch \{[\s\S]*Safari bloque le stockage local/);
  assert.match(css, /html\[data-theme="light"\]\{color-scheme:light\}/);
  assert.match(css, /\[data-theme="dark"\]\{\s*color-scheme:dark;/);
});

test("customer account stays protected by server-side Supabase identity", async () => {
  const response = await render("/account");
  assert.ok([302, 303, 307, 308].includes(response.status));
  assert.match(
    response.headers.get("location") ?? "",
    /^(?:http:\/\/localhost)?\/login\?return_to=%2Faccount/,
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
  assert.match(page, /"launch-v0\.2"/);
  assert.match(page, /"ESSENTIAL"/);
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
  assert.match(page, /requireSupabaseUser\("\/admin"\)/);
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

  assert.match(pricing, /version:\s*"launch-v0\.2"/);
  assert.match(pricing, /auditDepth === "ESSENTIAL"/);
  assert.match(pricing, /1_499/);
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

test("public certification page renders a status shell for any audit id", async () => {
  const response = await render("/cert/demo-audit-1234");
  assert.equal(response.status, 200);
  const html = await response.text();
  // La page est rendue côté serveur (RSC) : elle affiche au minimum le cadre
  // de certification publique — jamais une assertion de verdict inventée.
  assert.match(html, /StratVerity certification/i);
  assert.doesNotMatch(html, /sk_test_|whsec_|STRIPE_SECRET_KEY/i);
});

test("certification SEO indexes only genuinely sealed certificates", async () => {
  const [page, layout, sitemap, state, view] = await Promise.all([
    readFile(new URL("../app/cert/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/cert/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/cert/certification-state.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/cert/CertificationView.tsx", import.meta.url), "utf8"),
  ]);

  // Métadonnées dynamiques (OpenGraph + Twitter Cards) dans la page serveur.
  assert.match(page, /export async function generateMetadata/);
  assert.match(page, /openGraph:/);
  assert.match(page, /twitter:/);
  assert.match(page, /canonical:/);
  assert.match(page, /const indexable\s*=/);
  assert.match(page, /data\?\.status === "CERTIFIED"/);
  assert.match(page, /data\.certified === true/);
  assert.match(page, /index:\s*indexable/);
  assert.match(page, /follow:\s*indexable/);
  assert.match(page, /\/v1\/certifications\//);

  // Schema.org de certification (EducationalOccupationalCredential) + fil d'Ariane.
  assert.match(page, /application\/ld\+json/);
  assert.match(page, /EducationalOccupationalCredential/);
  assert.match(page, /BreadcrumbList/);
  assert.match(page, /issuedBy/);

  // La section ne force plus noindex : la page dynamique décide à partir
  // du statut CERTIFIED et de l'empreinte SHA-256 scellée.
  assert.match(layout, /export const metadata: Metadata/);
  assert.doesNotMatch(layout, /robots:/);
  assert.doesNotMatch(sitemap, /\/v1\/certifications\?limit=500/);
  assert.doesNotMatch(sitemap, /\/cert\/\$\{encodeURIComponent/);

  // Aucun secret n'est embarqué côté public.
  assert.doesNotMatch(page + layout + sitemap + state + view, /sk_test_|whsec_|STRIPE_SECRET_KEY|sk_live_/);
});

test("certification UI derives the three trust states from the engine", async () => {
  const [state, view, page] = await Promise.all([
    readFile(new URL("../app/cert/certification-state.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/cert/CertificationView.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/cert/[id]/page.tsx", import.meta.url), "utf8"),
  ]);

  // Trois états exigés : Certifié (vert), Révision obsolète (orange),
  // Rejeté / Non vérifié (rouge / gris).
  assert.match(state, /statusKey: "CERTIFIED"/);
  assert.match(state, /"REVISION_STALE"/);
  assert.match(state, /"FAILED"/);
  assert.match(state, /toneForScore/);
  assert.match(state, /score >= 70/);
  assert.match(state, /score >= 50/);
  // Couleur cohérente avec le badge SVG backend (#22c55e vert
  // institutionnalisé côté UI via les variables de ton).
  assert.match(state, /"Audit certified"/);
  assert.match(state, /"Revision stale — not verified"/);
  assert.match(state, /"Audit failed"/);

  // Vérification d'intégrité du code : SHA-256 local, aucune exfiltration.
  assert.match(view, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(view, /navigator\.clipboard\.writeText/);

  // Boutons d'intégration du badge (HTML / Markdown).
  assert.match(view, /Copy Markdown/);
  assert.match(view, /Copy HTML/);
  assert.match(state, /buildBadgeEmbed/);

  // La page interroge l'endpoint public de certification côté serveur.
  assert.match(page, /\/v1\/certifications\//);
  assert.match(page, /NEXT_PUBLIC_BACKTESTPROOF_API_URL/);
  assert.match(page, /generateMetadata/);
  assert.doesNotMatch(state + view + page, /sk_test_|whsec_|STRIPE_SECRET_KEY/);
});

test("disabled product surfaces stay out of indexing and submission", async () => {
  const [crashPage, sitemap, crashLayout, marketplaceLayout, galleryLayout] =
    await Promise.all([
      readFile(new URL("../app/crash-test/page.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/crash-test/layout.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/marketplace/layout.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/gallery/layout.tsx", import.meta.url), "utf8"),
    ]);

  assert.match(crashPage, /NEXT_PUBLIC_CRASH_TEST_ENABLED === "true"/);
  assert.match(crashPage, /crash-test-terms-2026-08-21-v1/);
  assert.match(crashPage, /terms_accepted: termsAccepted/);
  assert.match(crashPage, /public_report_consent: publicConsent/);
  assert.match(crashPage, /result\.price_cents !== CRASH_TEST_PRICE_CENTS/);
  assert.match(crashPage, /id="crash-test-form"/);
  assert.match(crashPage, /form="crash-test-form"/);
  assert.match(crashPage, /disabled=\{!CRASH_TEST_AVAILABLE/);
  assert.doesNotMatch(sitemap, /path:\s*"\/(?:crash-test|gallery|marketplace)"/);
  assert.doesNotMatch(sitemap, /\/v1\/certifications|\/cert\/\$\{/);

  for (const layout of [crashLayout, marketplaceLayout, galleryLayout]) {
    assert.match(layout, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
  }
});

test("free tools are public, localized and linked from research", async () => {
  const response = await render("/free-tools");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Test before you pay/i);
  assert.match(html, /Code Health Check/i);
  assert.match(html, /Robustness Score/i);
  assert.match(html, /Fee Calculator/i);
  assert.match(html, /href="\/health-check"/);
  assert.match(html, /href="\/score"/);
  assert.match(html, /href="\/fees"/);

  const [header, messages, sitemap, article, health] = await Promise.all([
    readFile(new URL("../app/components/SiteHeader.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/i18n/messages.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/learn/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/health-check/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(header, /"nav\.freeTools", "\/free-tools"/);
  assert.match(messages, /"nav\.freeTools"/);
  assert.match(sitemap, /path: "\/free-tools"/);
  assert.match(article, /href="\/health-check"/);
  assert.match(health, /useI18n/);
  assert.match(health, /href="\/configure"/);
  assert.doesNotMatch(health, /href="\/crash-test"/);
});

test("eligibility proxy is same-site, bounded and fail-closed", async () => {
  const [proxy, session, requestRoute, confirm, evaluate] = await Promise.all([
    readFile(new URL("../app/api/eligibility/proxy.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/eligibility/session/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/eligibility/email/request/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/eligibility/email/confirm/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/eligibility/evaluate/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(proxy, /MAX_BODY_BYTES = 2 \* 1024 \* 1024/);
  assert.match(proxy, /incomingOrigin !== siteOrigin/);
  assert.match(proxy, /redirect: "manual"/);
  assert.match(proxy, /AbortController/);
  assert.match(proxy, /ELIGIBILITY_UPSTREAM_UNAVAILABLE/);
  assert.doesNotMatch(proxy, /authorization|x-forwarded-for|x-bot-risk/i);
  assert.match(session, /\/v1\/eligibility\/session/);
  assert.match(requestRoute, /\/v1\/eligibility\/email\/request/);
  assert.match(confirm, /\/v1\/eligibility\/email\/confirm/);
  assert.match(evaluate, /\/v1\/eligibility\/evaluate/);
});
test("marketplace remains fail-closed and proxies verified identity server-side", async () => {
  const [page, client, seller, purchase, proxy, env] = await Promise.all([
    readFile(new URL("../app/marketplace/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/marketplace/MarketplaceClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/marketplace/seller/SellerConsole.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/marketplace/purchase/PurchaseClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/marketplace/proxy.ts", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
  ]);
  assert.match(page, /NEXT_PUBLIC_MARKETPLACE_ENABLED === "true"/);
  assert.match(env, /NEXT_PUBLIC_MARKETPLACE_ENABLED=false/);
  assert.match(client, /hostname\.endsWith\("stripe\.com"\)/);
  assert.match(client, /No illustrative strategy is presented as a real product/);
  assert.match(seller, /marketplace-seller-2026-08-21-v1/);
  assert.match(seller, /commission_bps: 1500/);
  assert.match(seller, /rights_confirmed/);
  assert.match(proxy, /getSupabaseServerClient/);
  assert.match(proxy, /data\.session\?\.access_token/);
  assert.match(proxy, /Authorization.*Bearer/);
  assert.match(proxy, /incomingOrigin|request\.headers\.get\("origin"\)/);
  assert.match(purchase, /\/api\/marketplace\/download-links/);
  assert.match(purchase, /target\.origin !== expected\.origin/);
  assert.match(purchase, /expires in 10 minutes and works once/);
  assert.doesNotMatch(proxy + client + seller + purchase, /service_role|STRIPE_SECRET_KEY|whsec_/i);
});