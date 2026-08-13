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
// grille launch-v0.1 déjà en vigueur dans pricing.ts.
for (const language of Object.keys(messages)) {
  if (messages[language]["pr.a.amt"]) {
    messages[language]["pr.a.amt"] = messages[language]["pr.a.amt"].replace(
      /49/g,
      "39",
    );
  }
  if (messages[language]["pr.b.amt"]) {
    messages[language]["pr.b.amt"] = messages[language]["pr.b.amt"].replace(
      /149/g,
      "68.25",
    );
  }
  messages[language]["pr.c.n"] = "Radar";
  messages[language]["pr.c.amt"] = "€19<small> / month</small>";
}

Object.assign(messages.fr, {
  "pr.b.n": "Audit robustesse",
  "pr.b.amt": "dès 68,25€<small> / stratégie</small>",
  "pr.c.amt": "dès 19€<small> / mois</small>",
});
Object.assign(messages.en, {
  "pr.b.n": "Robustness audit",
  "pr.c.amt": "from €19<small> / month</small>",
});
Object.assign(messages.es, { "pr.c.amt": "desde 19€<small> / mes</small>" });
Object.assign(messages.pt, { "pr.c.amt": "desde 19€<small> / mês</small>" });
Object.assign(messages.de, { "pr.c.amt": "ab 19€<small> / Monat</small>" });
Object.assign(messages.it, { "pr.c.amt": "da 19€<small> / mese</small>" });
Object.assign(messages.ru, { "pr.c.amt": "от 19€<small> / месяц</small>" });
Object.assign(messages.zh, { "pr.c.amt": "€19 起<small> / 月</small>" });
Object.assign(messages.ko, { "pr.c.amt": "€19부터<small> / 월</small>" });
Object.assign(messages.hi, { "pr.c.amt": "€19 से<small> / माह</small>" });
Object.assign(messages.ar, { "pr.c.amt": "من €19<small> / شهر</small>" });
Object.assign(messages.bn, { "pr.c.amt": "€19 থেকে<small> / মাস</small>" });

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
