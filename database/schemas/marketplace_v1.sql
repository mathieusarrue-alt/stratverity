-- StratVerity Marketplace v1 — schéma accès-protégé (Whop-model).
-- Coexiste avec le legacy marketplace (Connect + download). Persistance SQLite
-- côté backend FastAPI. On vend l'ACCÈS, jamais le code source.
--
-- Feature flag métier séparé : MARKETPLACE_COMMERCE_ENABLED (jamais ENGINE_*).

-- Listings vendeurs (invite_protected obligatoire v1).
CREATE TABLE IF NOT EXISTS mp_listings (
    listing_id   TEXT PRIMARY KEY,
    slug         TEXT NOT NULL UNIQUE,
    owner_key    TEXT NOT NULL,             -- seller Supabase user id
    kind         TEXT NOT NULL CHECK (kind IN ('indicator','strategy','toolkit')),
    platform     TEXT NOT NULL,              -- JSON array: ["tradingview","mt5",...]
    title        TEXT NOT NULL,
    description  TEXT NOT NULL DEFAULT '',
    short_description TEXT,
    asset_class  TEXT NOT NULL DEFAULT '["multi"]',
    delivery_mode TEXT NOT NULL CHECK (delivery_mode IN ('invite_protected','source_escrow')),
    seller_handle TEXT NOT NULL DEFAULT '',
    source_sha256 TEXT,
    source_filename TEXT,
    state        TEXT NOT NULL DEFAULT 'DRAFT' CHECK (state IN (
        'DRAFT','SUBMITTED','QUEUE_AUDIT','NEEDS_INFO','AUDIT_SEALED',
        'LISTED','OPERATOR_LISTED','REJECTED','SUSPENDED','DELISTED'
    )),
    badge        TEXT,                       -- 'OPERATOR' | 'SEALED'
    consent_cgu15   INTEGER NOT NULL DEFAULT 0,
    consent_no_gain INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
);

-- Offres (jusqu'à 4 par listing : one_shot / rent_monthly / rent_quarterly / rent_yearly).
CREATE TABLE IF NOT EXISTS mp_offers (
    offer_id    TEXT PRIMARY KEY,
    listing_id  TEXT NOT NULL REFERENCES mp_listings(listing_id),
    mode        TEXT NOT NULL CHECK (mode IN ('one_shot','rent_monthly','rent_quarterly','rent_yearly')),
    price_cents INTEGER NOT NULL CHECK (price_cents > 0),
    stripe_price_id TEXT,
    UNIQUE(listing_id, mode)
);

-- Commandes / tentatives de paiement.
CREATE TABLE IF NOT EXISTS mp_orders (
    order_id      TEXT PRIMARY KEY,
    listing_id    TEXT NOT NULL REFERENCES mp_listings(listing_id),
    buyer_key     TEXT NOT NULL,
    mode          TEXT NOT NULL CHECK (mode IN ('one_shot','rent_monthly','rent_quarterly','rent_yearly')),
    handle        TEXT NOT NULL,             -- tradingview_username / mt handle
    amount_cents  INTEGER NOT NULL,
    commission_cents INTEGER NOT NULL,
    currency      TEXT NOT NULL DEFAULT 'eur',
    stripe_session_id TEXT,
    stripe_subscription_id TEXT,
    status        TEXT NOT NULL DEFAULT 'CREATING' CHECK (status IN ('CREATING','PENDING','PAID','FAILED','CANCELED','PAST_DUE')),
    created_at    TEXT NOT NULL,
    paid_at       TEXT
);

-- Licences (résultat d'un paiement réussi).
CREATE TABLE IF NOT EXISTS mp_licenses (
    license_id  TEXT PRIMARY KEY,
    order_id    TEXT NOT NULL REFERENCES mp_orders(order_id),
    listing_id  TEXT NOT NULL REFERENCES mp_listings(listing_id),
    buyer_key   TEXT NOT NULL,
    handle      TEXT NOT NULL,
    mode        TEXT NOT NULL CHECK (mode IN ('one_shot','rent_monthly','rent_quarterly','rent_yearly')),
    state       TEXT NOT NULL DEFAULT 'pending_grant' CHECK (state IN ('active','pending_grant','revoked','past_due')),
    message     TEXT NOT NULL DEFAULT '',
    granted_at  TEXT,
    created_at  TEXT NOT NULL,
    UNIQUE(order_id)
);

-- File d'invitation (grant manuel opérateur/vendeur).
CREATE TABLE IF NOT EXISTS mp_grants (
    grant_id    TEXT PRIMARY KEY,
    license_id  TEXT NOT NULL REFERENCES mp_licenses(license_id),
    action      TEXT NOT NULL CHECK (action IN ('grant','revoke')),
    note        TEXT NOT NULL DEFAULT '',
    operator_key TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL
);

-- Solde vendeur (StratVerity encaisse, payout manuel 85 %).
CREATE TABLE IF NOT EXISTS mp_seller_balances (
    owner_key   TEXT PRIMARY KEY,
    balance_cents INTEGER NOT NULL DEFAULT 0,
    lifetime_cents INTEGER NOT NULL DEFAULT 0,
    updated_at  TEXT NOT NULL
);

-- Événements de stats (logger dès v1 : vues/favoris/checkouts/ventes).
CREATE TABLE IF NOT EXISTS mp_events (
    event_id    TEXT PRIMARY KEY,
    listing_id  TEXT NOT NULL REFERENCES mp_listings(listing_id),
    kind        TEXT NOT NULL CHECK (kind IN ('view','unique_view','favorite','checkout','sale','rent_paid','churn')),
    buyer_key   TEXT,
    created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS mp_listings_state_idx ON mp_listings(state);
CREATE INDEX IF NOT EXISTS mp_licenses_buyer_idx ON mp_licenses(buyer_key);
CREATE INDEX IF NOT EXISTS mp_orders_buyer_idx ON mp_orders(buyer_key);
CREATE INDEX IF NOT EXISTS mp_events_listing_idx ON mp_events(listing_id);
