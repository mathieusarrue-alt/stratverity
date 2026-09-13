# ADR-005 — Marketplace Enrichment (Phase 6) : médias, multi-offres, reviews vérifiées

- **Statut** : Accepté pour implémentation — backend 23/23 + 687/5, frontend 26/26, build vert
- **Date** : 2026-09-13
- **Décision** : enrichir la marketplace v1 (Whop-model, invite_protected, accès jamais le code source)
  avec : contenu riche (médias/description/versions), pricing dégressif multi-durée + lifetime,
  reviews vérifiées (preuve d'achat), et traçabilité de livraison.

## Contexte

Le flux v1 ne permettait qu'`one_shot / rent_monthly / rent_quarterly / rent_yearly`, pas de
galerie multi-médias ni de reviews. Les stratégies réelles ont besoin de preuves visuelles,
de durées d'abonnement dégressives et de confiance sociale vérifiable — aligné sur le
positionnement « Proof Engine » (jamais de reviews non vérifiées).

## Changements

### Backend (`stratverity-audit-backend`, worktree `feat/phase6-marketplace-enrichment`)

1. **Migration additive** `audit_app/marketplace/migrations/001_marketplace_enrichment.sql`
   (SHA-256 `c52654a8…`) — zéro modification des tables v1 :
   - `mp_listing_media` (image/screenshot/video, sha256, sort_order)
   - `mp_offers_v2` (kind subscription/one_shot/lifetime_access/lifetime_source,
     duration_months 1/3/6/12, UNIQUE(listing_id, kind, duration_months))
   - `mp_reviews` (UNIQUE(order_id) — 1 review par commande, rating 1-5, FK order)
   - `mp_listing_versions` (changelog + file_sha256)
   - 5 colonnes delivery sur `mp_orders` (delivery_channel, delivery_metadata,
     delivery_status pending/delivered/confirmed/disputed, delivery_proof_sha, onchain_proof_tx)
2. **Garde d'idempotence** : SQLite n'a pas d'`ALTER TABLE IF NOT EXISTS` → le garde vit dans
   `SQLiteMarketplaceV1._needs_enrichment_migration` (appliqué une fois, re-testé idempotent).
3. **Store v2** : `add_media / add_offer_v2 / add_review / listing_enriched` (+ `_avg_rating`).
   `add_review` fail-closed : order inexistant ou doublon → `REVIEW_REJECTED` (409).
4. **API** `marketplace_enrichment_http.py` : POST media/offers-v2/reviews, GET listings/{id}/enriched.
   Mêmes contrôles que v1 (flag 503, origin 403). **Leçon** : l'endpoint `add_media` devait
   traduire `MarketplaceV1Error` (bug prod découvert aux tests : 500 au lieu de 400) → try/except.

### Frontend (`stratverity`, worktree `feat/phase6-marketplace-enrichment`)

- `commerce.ts` : types `EnrichedListing / OfferV2 / ListingMedia / VerifiedReview` +
  helpers `offerDiscountPct / offerLabel / formatCentsV2`.
- `app/marketplace/[slug]/page.tsx` : enrichi — fetch `/enriched` **optionnel** (fallback v1 si
  indisponible), offres v2 avec badges `-10% / -20% / -30%` + LIFETIME, galerie médias v2
  (fallback screenshots v1), section **reviews vérifiées** (« ✓ Achat vérifié »).
- Proxy : `/v1/marketplace/listings/{id}/enriched` routé (matching dynamique suffixé).
- **Branding** : `NEXT_PUBLIC_BACKTESTPROOF_API_URL` → `NEXT_PUBLIC_STRATVERITY_API_URL`
  (12 fichiers + .env.example + test — 0 résidu vérifié par grep).

## Les 6 arbitrages (validés fondateur)

| # | Décision | Arbitrage |
|---|---|---|
| 1 | Commission | 15 % au lancement (marge nette ≈ 11 % après Stripe 2,9 %+30ct + payout 0,25 %+25ct) — acquisition vendeurs assumée |
| 2 | Lifetime avec code source | **NON au MVP** (`lifetime_access` oui ; `lifetime_source` dans le CHECK du schéma, aucun seed) |
| 3 | Reviews | Vérifiées uniquement — UNIQUE(order_id), 1/order, fail-closed |
| 4 | MetaTrader | Livraison **manuelle MVP** (vendeur compile/envoie) ; `delivery_proof_sha` + statuts dès le schéma |
| 5 | Audit listing | **OBLIGATOIRE** (moteur Phases 2-4 existant, coût marginal ≈ 0) — moat produit |
| 6 | Vidéo démo | **Remotion auto** uniquement, pas d'upload manuel au MVP |

## Découverte produit (contrainte existante vs PoC)

`ONE_SHOT_MIN_CENTS = 30_000` (300 €, décision fondateur 2026-08-30, miroir front
`MIN_ONE_SHOT_CENTS`) — le PoC illustrait one-shot à 99 € : **écart corrigé**, le composant
front affiche les planchers réels et le wireframe a été mis à jour (one-shot ≥ 300 €,
recommandé 349 €). Ladder réel : 1mo 49 € · 3mo 132,30 € (−10 %) · 6mo 235,20 € (−20 %) ·
12mo 411,60 € (−30 %) · one_shot ≥ 300 € · lifetime 24× mensuel.

## Preuves

```
Backend  : 23/23 Phase 6 (10 migration + 13 API) ; suite complète 687/5
           (664 baseline + 23, mêmes 5 échecs préexistants GoldenEvidence×3/ReportPipeline/TBO)
Frontend : build vinext ✓ ; tests 26/26 pass ; lint 14 problems = 1 error+13 warnings
           TOUS préexistants (identiques avec/sans mes changements, prouvé par git stash)
Branding : grep -rn BACKTESTPROOF hors node_modules/.next = 0 résidu
```

## Références

- `migrations/001_marketplace_enrichment.sql` (SHA c52654a8 — bit-à-bit du PoC validé)
- `STATE_LOCATION_PROOF.md` (state = backend sqlite3, frontend = proxy)
- Tests : `test_phase6_marketplace_migration.py`, `test_phase6_marketplace_enrichment_api.py`
- Patterns à venir : #11 pyramiding, #12 ordres limites, frontend MQL5 (gate P2a), clique Stripe test