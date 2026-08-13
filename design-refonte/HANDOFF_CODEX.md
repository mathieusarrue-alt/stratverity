# Passation → Codex/GPT : refonte visuelle StratVerity (design/refonte)

Une refonte visuelle complète a été préparée par un autre assistant. **Elle est isolée dans ce
dossier `design-refonte/` et ne modifie AUCUN fichier de l'app (`app/…`).** Ton job : l'intégrer
proprement dans le Next.js/vinext, sans casser les parcours existants.

## 1. Où voir le résultat (aucun build nécessaire)
Ouvre **`design-refonte/landing.html`** dans un navigateur (double-clic). C'est un aperçu HTML
autonome = **la source de vérité du design**. Teste : icône thème (clair/sombre), icône langue
(12 langues, l'arabe passe en RTL), et réduis la fenêtre / devtools mobile pour le responsive.

## 2. Ce qui a été fait (dans landing.html)
- **Direction** : « Verified Studio × Swiss/Stripe » — papier chaud + vert institutionnel,
  surfaces nettes, typo Inter + JetBrains Mono, clair/sombre réels, `prefers-reduced-motion` géré.
- **Logo officiel** câblé : `logos/brand-light.svg`, `logos/brand-dark.svg` (bascule auto selon
  le thème) + `logos/icon.svg` (favicon). Les autres SVG du dossier sont d'anciens concepts.
- **Fond animé global** : canvas de particules « réseau » en `position:fixed` sur tout le site,
  réactif à la souris (coupé sur tactile / reduced-motion), bandes de sections translucides.
- **i18n 12 langues** (aperçu via dictionnaire JS) : fr, en, es, pt, de, it, ru, zh, ko, hi,
  **ar (RTL)**, bn — les 145 chaînes sont traduites. `dir=rtl` géré pour l'arabe.
- **Sections** : nav, hero (carte de preuve + courbe qui monte + badge « +41% net »), bande KPI
  animée, méthode (4 étapes icônes), déclaré vs vérifié, matrice actifs×UT + score robustesse +
  stress tests, recherche/biais, rapport flouté à débloquer, tarifs, FAQ, CTA, footer.
- **Mobile durci** : header sans débordement (CTA passe dans le drawer), anti-scroll horizontal,
  matrice/KPI resserrés ≤480px.
- **Données 100 % illustratives** (labellisées « exemple illustratif ») — aucun résultat client réel.

## 3. Ce qu'il te reste à faire (intégration React/Next)
1. **Porter `landing.html` dans `app/`** (nouveau composant) et **centraliser les tokens** dans
   `globals.css` ; **purger les systèmes morts** (`app/design-a`, `app/design-b`, `app/concepts`,
   les ~6 systèmes CSS empilés du globals.css actuel).
2. **i18n propre** pour les 12 langues (remplacer le dict JS de l'aperçu par l'archi i18n du repo),
   support **RTL** (arabe) + **polices Noto** pour CJK/arabe/bengali (Inter n'a pas ces glyphes).
3. **Favicon** : brancher `logos/icon.svg` dans `public/` + `metadata`.
4. **Uniformiser les autres pages** au nouveau système : `/configure`, `/configure/success`,
   `/admin`, `/legal/*`, et les états (paiement, attente de revue, erreur, chargement, vide).

## 4. À NE PAS casser (contraintes dures — rappel)
routes existantes · `app/configure/pricing.ts` (grille `launch-v0.1`) · Stripe Checkout ·
order id / owner tokens · **secret admin en mémoire du composant uniquement** (jamais
localStorage/sessionStorage) · qualification statique · génération du brouillon · **validation
humaine** avant rapport · accès temporaire au rapport (lien, non persisté) · pages + acceptations
légales · protections CORS/auth · limites de taille des requêtes · **aucun secret côté frontend**,
aucune variable secrète transformée en `NEXT_PUBLIC_*`.

## 5. Git
Tout est commité sur la branche **`design/refonte`** (non poussée) :
`5fa3185` (durcissement mobile + i18n 12 langues) → `1a82f25` (logo + fond global) →
`ed0093b` (refonte initiale). **0 fichier de `app/` touché.** Pour pousser :
`git push sites design/refonte`.
