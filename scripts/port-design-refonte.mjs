import { mkdir, readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";
import { appMessages } from "./app-messages.mjs";

const source = new URL("../design-refonte/landing.html", import.meta.url);
const html = await readFile(source, "utf8");

const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
const bodyMatch = html.match(/<body>([\s\S]*?)<script>/);
const languageMatch = html.match(/const LANGS=(\[[\s\S]*?\]);\s*const I18N=/);
const translationsMatch = html.match(
  /(const I18N=[\s\S]*?Object\.assign\(I18N,[\s\S]*?\);)\s*let LANG=/,
);

if (!cssMatch || !bodyMatch || !languageMatch || !translationsMatch) {
  throw new Error("La maquette ne respecte plus le contrat de passation attendu.");
}

const french = {};
const frenchPattern = /<([a-z0-9]+)\b[^>]*data-i18n="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/gi;
for (const match of html.matchAll(frenchPattern)) {
  french[match[2]] ??= match[3].trim();
}

const context = vm.createContext({ Object });
const languages = vm.runInContext(languageMatch[1], context);
const translated = vm.runInContext(
  `(() => { ${translationsMatch[1]}; return I18N; })()`,
  context,
);
const messages = { ...translated, fr: french };

for (const language of languages) {
  const additionsForLocale = appMessages[language.code];
  if (!additionsForLocale) {
    throw new Error(`Catalogue application manquant : ${language.code}`);
  }
  Object.assign(messages[language.code], additionsForLocale);
}

const appKeys = Object.keys(appMessages.en);
for (const language of languages) {
  const missingAppKeys = appKeys.filter(
    (key) => !(key in appMessages[language.code]),
  );
  if (missingAppKeys.length) {
    throw new Error(
      `Traduction application ${language.code} incomplète : ${missingAppKeys.join(", ")}`,
    );
  }
}

// Les cartes restent indicatives, mais leurs montants doivent refléter la
// grille launch-v0.3 déjà en vigueur dans pricing.ts.
for (const language of Object.keys(messages)) {
  messages[language]["pr.a.n"] = "Essential audit";
  messages[language]["pr.a.amt"] = "€19<small> / strategy</small>";
  messages[language]["pr.b.n"] = "Premium audit";
  messages[language]["pr.b.amt"] = "€49<small> / strategy</small>";
  messages[language]["pr.b.1"] = "Multiple explicit contexts";
  messages[language]["pr.b.2"] = "Deeper evidence comparison";
  messages[language]["pr.b.3"] = "Robustness + divergence leads";
  messages[language]["pr.c.n"] = "Custom audit";
  messages[language]["pr.c.amt"] = "from €79<small> / strategy</small>";
  messages[language]["foot.build"] = "launch-v0.3 · design preview";
}

Object.assign(messages.fr, {
  "pr.a.n": "Audit essentiel",
  "pr.a.amt": "19€<small> / stratégie</small>",
  "pr.b.n": "Audit Premium",
  "pr.b.amt": "49€<small> / stratégie</small>",
  "pr.b.1": "Plusieurs contextes explicites",
  "pr.b.2": "Comparaison de preuves approfondie",
  "pr.b.3": "Score de robustesse + pistes",
  "pr.c.n": "Custom",
  "pr.c.amt": "dès 79€<small> / stratégie</small>",
  "foot.build": "launch-v0.3 · aperçu design",
});
Object.assign(messages.en, {
  "pr.c.amt": "from €79<small> / strategy</small>",
});
Object.assign(messages.es, { "pr.c.amt": "desde 79€<small> / estrategia</small>" });
Object.assign(messages.pt, { "pr.c.amt": "desde 79€<small> / estratégia</small>" });
Object.assign(messages.de, { "pr.c.amt": "ab 79€<small> / Strategie</small>" });
Object.assign(messages.it, { "pr.c.amt": "da 79€<small> / strategia</small>" });
Object.assign(messages.ru, { "pr.c.amt": "от 79€<small> / стратегию</small>" });
Object.assign(messages.zh, { "pr.c.amt": "€79 起<small> / 每策略</small>" });
Object.assign(messages.ko, { "pr.c.amt": "€79부터<small> / 전략</small>" });
Object.assign(messages.hi, { "pr.c.amt": "€79 से<small> / रणनीति</small>" });
Object.assign(messages.ar, { "pr.c.amt": "من €79<small> / استراتيجية</small>" });
Object.assign(messages.bn, { "pr.c.amt": "€79 থেকে<small> / কৌশল</small>" });

// Tableau comparatif pricing : chaque langue hérite de l'anglais pour toute clé
// non traduite (en), et `fr` reçoit ses libellés depuis le HTML inline (déjà
// injecté via `french`). Pattern « recopier l'anglais » pour les locales.
const compare_keys = [
  "pr.c.cta", "pr.compare.h", "pr.compare.col0", "pr.compare.col1",
  "pr.compare.col2", "pr.compare.col3", "pr.compare.col4", "pr.compare.yes",
  "pr.compare.r0c0", "pr.compare.r1c0", "pr.compare.r2c0", "pr.compare.r3c0",
  "pr.compare.r3c2", "pr.compare.r3c3", "pr.compare.r3c4", "pr.compare.r4c0",
  "pr.compare.r4c2", "pr.compare.r4c3", "pr.compare.r4c4", "pr.compare.r5c0",
  "pr.compare.r5c2", "pr.compare.r5c3", "pr.compare.r5c4", "pr.compare.r6c0",
  "pr.compare.r6c2", "pr.compare.r6c3", "pr.compare.r6c4", "pr.compare.r7c0",
  "pr.compare.r7c2", "pr.compare.r7c3", "pr.compare.r7c4", "pr.compare.r8c0",
  "pr.compare.r8c2", "pr.compare.r8c4", "pr.compare.r9c0", "pr.compare.r10c0",
  "pr.compare.r10c3", "pr.compare.r10c4", "pr.compare.r11c0",
];
// Bullets de cartes : purge des contenus anciens (Radar/Auto-Pilot/Crash-Test)
// dans toutes les locales — on force l'anglais (catégorie SKU), `fr` reste
// servi depuis le HTML inline.
const pricing_bullet_keys = [
  "pr.a.1", "pr.a.2", "pr.a.3",
  "pr.b.1", "pr.b.2", "pr.b.3",
  "pr.c.1", "pr.c.2", "pr.c.3",
];
const pricing_bullets_en = {
  "pr.a.1": "Independent net-of-fees recompute",
  "pr.a.2": "2-year history · 1 asset · 1 timeframe",
  "pr.a.3": "Divergence report",
  "pr.b.1": "8-year history · single context",
  "pr.b.2": "Multiple windows and stress scenarios",
  "pr.b.3": "Walk-forward + score and pointers",
  "pr.c.1": "10-year history · multi-context",
  "pr.c.2": "Monte-Carlo · PBO / DSR",
  "pr.c.3": "Extended robustness matrix",
};
for (const language of languages) {
  for (const key of compare_keys) {
    if (!(key in messages[language.code])) {
      messages[language.code][key] = messages.en[key];
    }
  }
  for (const key of pricing_bullet_keys) {
    messages[language.code][key] = pricing_bullets_en[key];
  }
}
// FR : restaurer les libellés français des bullets (servis depuis le HTML inline).
Object.assign(messages.fr, {
  "pr.a.1": "Recalcul indépendant net de frais",
  "pr.a.2": "2 ans d'historique · 1 actif · 1 unité de temps",
  "pr.a.3": "Rapport des divergences",
  "pr.b.1": "8 ans d'historique · 1 seul contexte",
  "pr.b.2": "Plusieurs fenêtres et scénarios de stress",
  "pr.b.3": "Walk-forward + score et pistes",
  "pr.c.1": "10 ans d'historique · multi-contextes",
  "pr.c.2": "Monte-Carlo · PBO / DSR",
  "pr.c.3": "Matrice de robustesse étendue",
  "pr.c.cta": "Configurer",
  "pr.a.n": "Audit essentiel",
  "pr.b.n": "Audit Premium",
  "pr.c.n": "Audit Custom",
});

const frenchKeys = Object.keys(french);
for (const language of languages) {
  const missingKeys = frenchKeys.filter((key) => !(key in messages[language.code]));
  if (missingKeys.length) {
    throw new Error(
      `Traduction ${language.code} incomplète : ${missingKeys.join(", ")}`,
    );
  }
}

let markup = bodyMatch[1]
  .replace(/<header class="site-head"[\s\S]*?<\/header>\s*/i, "")
  .replace(/<div class="aura a1"><\/div><div class="aura a2"><\/div><div class="aura a3"><\/div>\s*/i, "")
  .replace(/<div class="cursor-glow" id="cursorGlow"><\/div>\s*/i, "")
  .replace(/<canvas id="fx" aria-hidden="true"><\/canvas>\s*/i, "")
  .replaceAll('href="#audit"', 'href="/configure"')
  .replaceAll('href="#login"', 'href="/login?return_to=/account"')
  .replace(
    /href="#" data-i18n="foot\.terms"/g,
    'href="/legal/terms" data-i18n="foot.terms"',
  )
  .replace(
    /href="#" data-i18n="foot\.privacy"/g,
    'href="/legal/privacy" data-i18n="foot.privacy"',
  )
  .replace(
    /href="#" data-i18n="foot\.risk"/g,
    'href="/legal/risk" data-i18n="foot.risk"',
  )
  .replace(
    /href="#" data-i18n="foot\.refund"/g,
    'href="/legal/refunds" data-i18n="foot.refund"',
  )
  .trim();

// English is the server-rendered default. Client-side locale changes still
// replace these values through the same data-i18n keys after hydration.
markup = markup.replace(
  /<([a-z0-9]+)\b([^>]*data-i18n="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/gi,
  (full, tag, attributes, key) => {
    const english = messages.en[key];
    return typeof english === "string"
      ? `<${tag}${attributes}>${english}</${tag}>`
      : full;
  },
);

markup = markup.replaceAll("`", "\\`").replaceAll("${", "\\${");

const additions = `

/* =========================================================================
   Application surfaces — shared with configurator, reports, admin and legal
   ========================================================================= */
:root {
  --font: var(--font-inter), system-ui, sans-serif;
  --mono: var(--font-mono-loaded), ui-monospace, monospace;
  --display: var(--font-display-loaded), var(--font-inter), serif;
  --success-500: var(--emerald-500);
  --warning-500: var(--amber-500);
  --danger-500: var(--risk-500);
  --line-strong: color-mix(in oklab, var(--ink) 22%, transparent);
  --focus-ring: 0 0 0 3px color-mix(in oklab, var(--accent) 28%, transparent);
}

html[data-theme="light"]{color-scheme:light}
[data-theme="dark"]{
  color-scheme:dark;
}

body {
  font-family: var(--font-inter), var(--font-noto), system-ui, sans-serif;
}

html[lang="ar"] body { font-family: var(--font-noto-arabic), var(--font-inter), sans-serif; }
html[lang="bn"] body { font-family: var(--font-noto-bengali), var(--font-inter), sans-serif; }
html[lang="hi"] body { font-family: var(--font-noto-devanagari), var(--font-inter), sans-serif; }
html[lang="zh"] body { font-family: var(--font-noto-sc), var(--font-inter), sans-serif; }
html[lang="ko"] body { font-family: var(--font-noto-kr), var(--font-inter), sans-serif; }

button,
input,
select,
textarea { font: inherit; }

button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
summary:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  box-shadow: var(--focus-ring);
}

.ambient-experience { inset: 0; pointer-events: none; position: fixed; z-index: 0; }
.app-content { min-height: calc(100vh - 84px); position: relative; z-index: 1; }
.site-head { isolation: isolate; }
[data-premium-surface] {
  --surface-x: 50%; --surface-y: 50%; isolation: isolate; position: relative;
  transition: border-color .22s var(--ease), box-shadow .22s var(--ease), transform .22s var(--ease);
}
[data-premium-surface]::after {
  background: radial-gradient(circle at var(--surface-x) var(--surface-y), color-mix(in oklab, var(--accent) 13%, transparent), transparent 34%);
  border-radius: inherit; content: ""; inset: 0; opacity: 0; pointer-events: none; position: absolute; transition: opacity .25s var(--ease); z-index: -1;
}
[data-premium-surface]:hover { border-color: color-mix(in oklab, var(--accent) 40%, var(--line)); box-shadow: var(--shadow-md); transform: translateY(-2px); }
[data-premium-surface]:hover::after { opacity: 1; }
.page-backdrop { min-height: inherit; position: relative; }
.sr-only {
  height: 1px; margin: -1px; overflow: hidden; padding: 0; position: absolute;
  width: 1px; clip: rect(0, 0, 0, 0); white-space: nowrap;
}

[dir="rtl"] .head-tools { margin-left: 0; margin-right: auto; }
[dir="rtl"] .nav { margin-left: 0; margin-right: 8px; }
[dir="rtl"] .lang-menu { left: 0; right: auto; }
[dir="rtl"] .lang-menu button { text-align: right; }
[dir="rtl"] .lang-menu button .tag { margin-left: 0; margin-right: auto; }
[dir="rtl"] .price ul,
[dir="rtl"] .foot-links { padding-right: 0; }

@media (max-width: 1120px) {
  .desk-cta { display: none; }
}

@media (max-width: 680px) {
  .app-content { min-height: calc(100vh - 60px); }
}

@media (prefers-reduced-motion: reduce) {
  [data-premium-surface] { transition: none; }
  [data-premium-surface]:hover { transform: none; }
}
`;

await mkdir(new URL("../app/home/", import.meta.url), { recursive: true });
await mkdir(new URL("../app/i18n/", import.meta.url), { recursive: true });

await writeFile(
  new URL("../app/globals.css", import.meta.url),
  `${cssMatch[1].trim()}${additions.trimEnd()}\n`,
);
await writeFile(
  new URL("../app/home/landing-markup.ts", import.meta.url),
  `// Generated from design-refonte/landing.html by scripts/port-design-refonte.mjs.\n` +
    `// Do not edit this file directly; update the design source or generator.\n` +
    `export const landingMarkup = \`${markup}\`;\n`,
);
await writeFile(
  new URL("../app/i18n/messages.ts", import.meta.url),
  `// Generated from design-refonte/landing.html by scripts/port-design-refonte.mjs.\n` +
    `export const languages = ${JSON.stringify(languages, null, 2)} as const;\n\n` +
    `export const messages = ${JSON.stringify(messages, null, 2)} as const;\n\n` +
    `export type Locale = keyof typeof messages;\n` +
    `export type MessageKey = keyof typeof messages.fr;\n`,
);

console.log(
  `Refonte portée : ${Object.keys(french).length} chaînes françaises, ${Object.keys(messages).length} langues.`,
);
