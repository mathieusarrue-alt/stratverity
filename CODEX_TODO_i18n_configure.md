# À faire (Codex) — i18n de /configure + défaut anglais

Contexte : QA live de `/configure` + passage du **défaut de langue à l'anglais**. Ce qui suit
distingue **ce qui est déjà fait** (ne pas revenir dessus) de **ce qui te revient**.

## ✅ Déjà fait (ne pas annuler)
Défaut de langue passé de FR → **EN** :
- `app/i18n/I18nProvider.tsx` : `useState<Locale>("en")` (au lieu de `"fr"`) et repli du `t()`
  = `messages.en[key] ?? messages.fr[key]`.
- `app/layout.tsx` : `<html lang="en">` + `title` / `description` / `openGraph` (`locale:"en_US"`)
  / `twitter` réécrits en anglais.
- Vérifié en live : header + landing chargent en **anglais par défaut** (préférence
  `localStorage["sv-lang"]` toujours respectée si présente).

## ✅ QA /configure — RAS côté visuel & interactivité
Vérifié en live (clair + sombre, sans erreur console) : sélection service / actifs / unités de
temps / profondeur, mise à jour en direct du périmètre, du **badge de palier** (BASE→PRO) et du
**prix** (39 € → 47 € → 110,25 €), menu 12 langues, bascule de thème. Le panneau « Périmètre
actuel » **volontairement sombre** en mode clair (`.summary { background: var(--forest-900) }`)
est un accent voulu, pas un bug.

## ⛔ Le vrai reste-à-faire : `/configure` n'est PAS internationalisé
`app/configure/page.tsx` **n'utilise pas `useI18n`** — toutes ses chaînes sont **codées en dur en
français**. Quand on change de langue, seul le header/landing se traduit ; le corps du
configurateur reste en FR. Idem à vérifier pour `/configure/success`, `/admin`, `/legal/*`
(le `DESIGN_SYSTEM.md` prévoit qu'ils réutilisent le même vocabulaire i18n).

### Ce qu'il faut faire
1. **Extraire** les ~40–60 chaînes visibles de `app/configure/page.tsx` (titres d'étapes,
   labels, aides, boutons « Confirmer ce tarif », « Voir le calcul du prix », « Ajouter »,
   « Périmètre actuel / contextes », mentions TVA/disclaimer, etc.) en **clés i18n**.
2. **Ajouter ces clés** au dictionnaire des **12 langues** (fr, en, es, pt, de, it, ru, zh, ko,
   hi, ar, bn) via ta pipeline `messages.ts` / `scripts/port-design-refonte.mjs`. Décide si ces
   clés « app » vivent dans le même espace que les 145 clés de la landing ou dans un namespace
   `configure.*` séparé — mais garde **une seule source de vérité** générée.
3. **Câbler** la page : `const { t } = useI18n();` puis remplacer les littéraux par `t("…")`.
   Attention au **RTL arabe** (déjà géré par le provider via `dir`) et aux **nombres/prix**
   (garder `toLocaleString(locale)` cohérent avec la locale active).
4. Reproduire pour `/configure/success`, `/admin`, `/legal/*` et les états (paiement, attente,
   erreur, vide).

### À ne pas casser (rappel)
Routes · `app/configure/pricing.ts` (`launch-v0.1`) · Stripe · order/owner tokens · secret admin
en mémoire du composant · validation humaine · accès temporaire au rapport · pages légales ·
aucun secret côté frontend. **Ne touche pas** aux fichiers générés (`globals.css`, landing,
`messages.ts`) autrement que via la pipeline de port.

### Astuce anti-flash (optionnel)
Le provider est client mais rend en SSR avec l'état initial `"en"` → le landing/​header
SSR sont déjà en anglais (pas de flash FR→EN). Si un flash apparaît, vérifie qu'aucun texte
n'est écrit en dur en FR dans le markup généré.
