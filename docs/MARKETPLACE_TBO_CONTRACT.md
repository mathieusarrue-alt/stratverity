# Marketplace SKU #1 — Top/Bottom Oscillator (TBO) — Contrat backend

**Date** : 2026-08-30 · **tv_script_id** : `qSG1KNKk` · **fulfillment** : `TV_INVITE_ONLY`
**Périmètre** : backend FastAPI (SAAS_AUDIT_BACKTEST, déploiement tarball SSM séparé).
**Règle** : jamais de `.pine` en pièce jointe ; livraison = accès TradingView du script.

Les tables `marketplace_products` / `marketplace_skus` / `marketplace_licenses`
définiès ci-dessous **n'existent pas encore** : ce document est le contrat à
implémenter côté backend (hors PR front, déployé par tarball). Le front proxy
déjà `/v1/marketplace/checkout-sessions` et `/v1/marketplace/license-for-session`.

## 1. Tables SQL (additive, CREATE TABLE IF NOT EXISTS — même DB SQLite)

```sql
CREATE TABLE IF NOT EXISTS marketplace_products (
    product_id   TEXT PRIMARY KEY,            -- 'top-bottom-oscillator'
    title        TEXT NOT NULL,
    tv_script_id TEXT NOT NULL,               -- 'qSG1KNKk'
    fulfillment  TEXT NOT NULL CHECK (fulfillment IN ('TV_INVITE_ONLY','SOURCE_ESCROW')),
    is_public    INTEGER NOT NULL DEFAULT 0,  -- RESTE 0 tant qu'aucun test Stripe + grant cobaye
    created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS marketplace_skus (
    sku_code    TEXT PRIMARY KEY,             -- 'tbo_1m'|'tbo_3m'|'tbo_12m'|'tbo_lifetime'
    product_id  TEXT NOT NULL REFERENCES marketplace_products(product_id),
    label       TEXT NOT NULL,
    mode        TEXT NOT NULL CHECK (mode IN ('rent_monthly','rent_quarterly','rent_yearly','lifetime')),
    price_ht_cents INTEGER NOT NULL CHECK (price_ht_cents > 0),
    is_listed   INTEGER NOT NULL DEFAULT 1,   -- 0 pour le SKU 'source 2500 €' (jamais affiché)
    stripe_price_id TEXT,                     -- product/price Stripe
    created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS marketplace_licenses (
    license_id   TEXT PRIMARY KEY,
    sku_code     TEXT NOT NULL REFERENCES marketplace_skus(sku_code),
    product_id   TEXT NOT NULL REFERENCES marketplace_products(product_id),
    buyer_key    TEXT NOT NULL,               -- Supabase user id
    buyer_email  TEXT,
    tv_username  TEXT NOT NULL,               -- validé ^[A-Za-z0-9_]{3,32}$
    status       TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN
                 ('pending_payment','pending_grant','active','past_due','revoke_pending','revoked')),
    starts_at    TEXT,
    ends_at      TEXT,                        -- prologation sur invoice.paid
    stripe_checkout_session_id TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL,
    UNIQUE(stripe_checkout_session_id)
);
CREATE INDEX IF NOT EXISTS mp_licenses_buyer_key_idx ON marketplace_licenses(buyer_key);
CREATE INDEX IF NOT EXISTS mp_licenses_status_idx   ON marketplace_licenses(status);
```

## 2. Machine d'état

```
pending_payment --checkout.session.completed--> pending_grant
pending_grant   --grant manuel TV (ops) clic Livré--> active
active          --invoice.paid--> ends_at prolongé, active
active/pending_grant --invoice.payment_failed--> past_due  (grâce 3 j)
past_due        --3 jours sans paiement--> revoke_pending
active|revoke_pending --customer.subscription.deleted|charge.refunded--> revoke_pending
revoke_pending  --ops clique Révoquer--> revoked
```

## 3. Endpoints backend requis (proxy front déjà en place)

| Méthode & path | Auth | Comportement |
|---|---|---|
| `POST /v1/marketplace/checkout-sessions` (étendu) | buyer | Body TBO `{sku_code, tv_username, product_slug, fulfillment, tv_script_id}`. Valide le username (regex `^[A-Za-z0-9_]{3,32}$`), crée la licence `pending_payment`, crée la session Stripe avec `metadata={license_id, sku_code, tv_username, product_slug, fulfillment}`, `success_url=https://www.stratverity.com/marketplace/top-bottom-oscillator/success?session_id={CHECKOUT_SESSION_ID}&tv_username={tv_username}`, `cancel_url=.../top-bottom-oscillator`. Renvoie `{checkout_url}`. |
| `GET /v1/marketplace/license-for-session?session_id=` | buyer | → `{status, tv_username}` depuis la licence liée à la session. |
| `GET /v1/marketplace/grants` | ops | File TBO : `date, sku, tv_username, buyer_email, status`. |
| `POST /v1/marketplace/grants/{licenses}:mark-delivered` | ops | `pending_grant → active` (+ email). |
| `POST /v1/marketplace/grants/{license}:revoke` | ops | → `revoked` (+ email). |

## 4. Webhooks Stripe (signature `whsec_` obligatoire, pattern `/api/webhooks/stripe`)

| Événement | Action |
|---|---|
| `checkout.session.completed` | licence `pending_payment → pending_grant` + **email de confirmation** (sans pièce jointe, sans « répondez avec votre pseudo ») |
| `invoice.paid` (renouvellement) | `ends_at` prolongé de la durée du SKU, reste `active` |
| `invoice.payment_failed` | `→ past_due` (grâce 3 jours, puis `revoke_pending`) |
| `customer.subscription.deleted` / `charge.refunded` | `→ revoke_pending` |

## 5. Email de confirmation (SES, sans pièce jointe)

> Merci pour votre achat — **Top/Bottom Oscillator v2.6.9**.
> Votre accès est en cours pour **@tv_username** : il sera visible d'ici 24 h
> sous **Indicateurs → Scripts sur invitation seulement**.
> Vous n'avez rien à répondre. En cas d'erreur de username, contactez-nous
> (support@stratverity.com) — ne renvoyez jamais votre pseudo par e-mail.

## 6. Seed produit (idempotent, executé au démarrage quand is_public=false OK)

- product `top-bottom-oscillator` (tv_script_id `qSG1KNKk`, fulfillment `TV_INVITE_ONLY`, is_public=0).
- SKUs listés : `tbo_1m` 50€, `tbo_3m` 130€, `tbo_12m` 480€, `tbo_lifetime` 1400€.
- SKU non listé (source, is_listed=0) : 2500 € — `listed=false`, jamais affiché.
- is_public **ne passe à 1** qu'après paiement test (Stripe test) + grant cobaye validé.

## 7. Conformité copy (interdits sur la fiche et les emails)

- Téléchargement `.pine` ; mention de QQE, Crash-Test, Auto-Pilot, Scan ;
- demander le username par e-mail après paiement ; traiter ce SKU hors catalogue
  (commission 15 %, Stripe entreprise = première règle, pas de règle first-party spéciale).

## 8. Front (cette PR / dossier)

- `app/marketplace/top-bottom-oscillator/page.tsx` : fiche, 4 CTA, double username
  + regex + match, checkout Stripe (proxy).
- `app/marketplace/top-bottom-oscillator/success/page.tsx` : message
  « sous 24 h dans Indicateurs → Scripts sur invitation seulement » + lien
  corriger le username si `pending_grant`.
- `app/api/marketplace/proxy.ts` : path `license-for-session` ajouté.