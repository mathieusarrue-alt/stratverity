# Marketplace v1 — contrat backend (déploiement séparé)

**Date** : 2026-08-27 · **PR front** : `feat/marketplace-v1-sell`
**Doctrine** : on vend l'**ACCÈS** (Whop-model), jamais le code source.

Le front Next.js (`app/api/marketplace/*`) **proxie** vers le backend FastAPI
(`SAAS_AUDIT_BACKTEST`, déployé par tarball SSM — PAS un repo git). Ce document
est le contrat que le backend doit implémenter pour que le front fonctionne.

## Feature flag

- `NEXT_PUBLIC_MARKETPLACE_COMMERCE=true` active le commerce côté front.
- Le flag backend équivalent (`MARKETPLACE_COMMERCE_ENABLED`) doit être
  **séparé** des flags ENGINE_* et du flag des 3 goldens labo.

## Endpoints à implémenter (mêmes chemins que le proxy)

Tous sous `/v1/marketplace/`, auth Bearer Supabase (sauf GET public).

| Méthode & path | Auth | Body → réponse |
|---|---|---|
| `POST /v1/marketplace/sell` | vendeur | `{kind, platform[], title, description, asset_class[], delivery_mode:"invite_protected", offers:[{mode:"one_shot"\|"rent_monthly", price_cents}], seller_handle, source_filename, consent:{cgu15,no_gain}}` → `{listing_id, state:"QUEUE_AUDIT"}` + **email x2** (vendeur + stratverity@gmail.com : fiche + SHA + prix) |
| `GET /v1/marketplace/sell/listings` | vendeur | → `{listings:[{id,slug,title,kind,state,...}]}` |
| `GET /v1/marketplace/sell/dashboard` | vendeur | → `{listings, stats:{views,unique_views,favorites,checkouts,sales,total_revenue_cents,rent_mrr_cents,churn}, balance_cents, granted:[{license_id,handle,state}]}` |
| `POST /v1/marketplace/sell/dashboard/grant` | vendeur | `{license_id, action:"grant"\|"revoke"}` → `{license_id, state}` + email opérateur |
| `GET /v1/marketplace/listings` | public | → `{listings:[...]}` (front filtre `LISTED`/`OPERATOR_LISTED`) |
| `GET /v1/marketplace/licenses` | buyer | → `{licenses:[{listing_id,title,slug,handle,kind,mode,state:"active"\|"pending_grant"\|"revoked"\|"past_due",message}]}` |
| `GET/POST /v1/marketplace/favorites` | buyer | GET → `{favorites:[{slug,title}]}` ; POST `{listing_id, action:"toggle"}` → `{favorite:boolean}` |
| `POST /v1/marketplace/checkout-sessions` | buyer | `{listing_id, mode:"one_shot"\|"rent_monthly", handle}` → `{checkout_url}` |
| `POST /v1/marketplace/operator-listings` | **admin** | marque un listing `OPERATOR_LISTED` (badge « Operator ») — réservé aux 2 seeds |
| `GET /v1/marketplace/grants` | admin | → file d'invitations en attente (> 12 h = alerte) |

## Machine d'état listing

```
DRAFT → SUBMITTED → QUEUE_AUDIT → (NEEDS_INFO) → AUDIT_SEALED → LISTED
                                      ↘ REJECTED
OPERATOR_LISTED  (bypass opérateur, badge distinct — jamais de score inventé)
SUSPENDED / DELISTED
```

Achat possible **uniquement** `LISTED` ou `OPERATOR_LISTED`.

## Modèle de vente (Whop-model)

- `invite_protected` **obligatoire** v1 : l'acheteur reçoit l'accès plateforme
  (invite TradingView / fichier MT), **jamais** le `.pine` / `.mq5` / `.py`.
- `one_shot` → license **permanente** ; `rent_monthly` → Stripe **Subscription**,
  révocation de l'invite ≤ 48 h si `past_due`/cancel.
- Commission StratVerity **15 %** sur chaque encaissement ; vendeur reçoit
  85 % (`seller_balance`, payout manuel v1, Connect = v1.1).
- Handle plateforme (`tradingview_username` ou handle MT) **obligatoire avant
  paiement** — c'est la clé de livraison.

## Tables (SQLite backend)

`mp_listings`, `mp_offers`, `mp_orders`, `mp_licenses`, `mp_grants`,
`mp_seller_balances`, `mp_events` (stats : vues/uniques/favoris/checkouts/
ventes/MRR/churn — logger dès v1).

## Conformité copy (interdits)

- Score 0–100 inventé, « audited 78 » sans seal, « code source inclus »,
  « MQL livré en clair ».
- Obligatoires : backtest ≠ perf future · 15 % visible · « source non transmise ».

## 2 seeds opérateur

2 indicateurs Pine en `OPERATOR_LISTED` (loyer) : titre, username TV,
prix €/mois, description, captures, marchés/TF. Badge **Operator** — pas un
score. Champ « invite-only déjà actif ? oui/non » au dépôt.
