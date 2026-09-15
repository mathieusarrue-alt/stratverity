# ADR-006 — Blog SEO comme levier d'acquisition longue durée

- **Statut** : Accepté pour implémentation (2 articles initiaux, pilier Éducation audit)
- **Date** : 2026-09-15
- **Décision** : intégrer un blog dans le frontend StratVerity (Vinext/Vite) pour
  l'acquisition organique — premier pilier du calendrier éditorial M3-M6 (SEO
  top funnel, coût marginal ≈ 0).

## Contexte

La marketplace (Phase 6) apporte la conversion ; il manque le haut de tunnel.
Le contenu éducatif (backtests honnêtes, biais) cible des mots-clés à fort
intent (« vérifier backtest », « biais trading ») avec un coût d'acquisition
nul, contrairement aux canaux payants (Google Ads différé après PMF).

## Décisions techniques

1. **Markdown au build-time via import `?raw`** (Vite) — pas de `fs.readFile`
   au runtime : `fs` est indisponible côté navigateur/SSE Vinext et causait un
   crash du boundary d'erreur (`rendu interrompu`). `?raw` inline le contenu
   au build : plus performant, zéro erreur SSR/hydration.
2. **Composants réutilisables** `BlogPost.tsx` / `BlogList.tsx` dans
   `components/` (racine, alias `@/`), utilisant les variables CSS réelles du
   repo (`--accent`, `--bg`, `--muted`) — pas de couleurs hardcodées.
3. **Styles `.blog-prose`** ajoutés en **append pur** à `app/globals.css`
   (+28 lignes, 0 suppression) — le repo n'utilise pas tailwind/typography.
4. **Routing file-based Vinext** : `app/blog/page.tsx` (index) + une page par
   article sous `app/blog/<slug>/page.tsx`.
5. **Dépendances** : `react-markdown ^10.1.0` + `remark-gfm ^4.0.1` (GFM :
   tableaux/listes/links rendus).

## Leçon apprise

Un **build vert ne prouve pas le rendu** : le build passait avec `fs.readFile`
mais la page affichait le boundary d'erreur au runtime. Le test local
(navigateur + curl) a seul révélé le crash → toujours tester le rendu réel
avant de déclarer une page livrée (leçon alignée sur les incidents
"livraison fantôme" de la session 2/2).

## Preuves

- Build vinext vert (5 passes) après le fix `?raw`
- Rendu validé sur 3 routes (navigateur headless : H1, CTA, markdown, tableaux)
- SHA-256 des `.md` identiques aux originaux du workspace session
- `git diff app/globals.css` purement additif

## Références

- Calendrier éditorial M3-M6 (`07_gtm_outreach/03_calendrier_editorial.md`)
- ADR-005 (marketplace enrichment) — blog = levier d'acquisition, marketplace = conversion