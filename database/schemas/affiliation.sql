-- ============================================================================
--  StratVerity / Prism Works — Schéma d'affiliation (PostgreSQL)
--  Répond aux points de mise en prod : persistance de l'état + idempotence
--  des webhooks Stripe + traçabilité (ledger) + réserve glissante.
-- ============================================================================

-- 1) Influenceurs : porte l'ÉTAT que le calculateur lit (compteurs, jackpots payés…)
CREATE TABLE influencers (
  id                      TEXT PRIMARY KEY,
  tier                    TEXT NOT NULL DEFAULT 'TIER_NICHE'
                            CHECK (tier IN ('TIER_NICHE','TIER_PERFORMER','TIER_TOP_PARTNER')),
  paid_clients_count      INTEGER NOT NULL DEFAULT 0,
  ht_clients_count        INTEGER NOT NULL DEFAULT 0,
  jackpot_paid_cents      BIGINT  NOT NULL DEFAULT 0,   -- total jackpots déjà versés
  starter_granted         INTEGER NOT NULL DEFAULT 0,   -- 0..5
  reserve_balance_cents   BIGINT  NOT NULL DEFAULT 0,   -- réserve glissante retenue, non versée
  stripe_connect_id       TEXT,                          -- compte Connect pour les payouts
  status                  TEXT NOT NULL DEFAULT 'active' -- active | suspended | closed
                            CHECK (status IN ('active','suspended','closed')),
  signup_date             TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Attribution server-side : le click_id généré à l'arrivée, lié au client au checkout
CREATE TABLE affiliation_clicks (
  click_id        TEXT PRIMARY KEY,          -- généré côté serveur, first-party
  influencer_id   TEXT NOT NULL REFERENCES influencers(id),
  landing         TEXT,
  utm             JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE client_attribution (
  customer_id     TEXT PRIMARY KEY,          -- Stripe customer id
  influencer_id   TEXT NOT NULL REFERENCES influencers(id),
  click_id        TEXT REFERENCES affiliation_clicks(click_id),
  first_paid_at   TIMESTAMPTZ,               -- 1er paiement encaissé (>0)
  is_ht           BOOLEAN NOT NULL DEFAULT FALSE, -- devenu high-ticket ?
  ht_bonus_paid   BOOLEAN NOT NULL DEFAULT FALSE, -- prime HT déjà versée (idempotence)
  radar_bonus_paid BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) ⭐ Idempotence des webhooks : un event Stripe n'est traité qu'UNE fois.
CREATE TABLE processed_stripe_events (
  event_id     TEXT PRIMARY KEY,            -- Stripe event.id (evt_...)
  type         TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) Ledger : chaque calcul de commission/bonus est journalisé (traçabilité + reprises)
CREATE TABLE commission_ledger (
  id                 BIGSERIAL PRIMARY KEY,
  influencer_id      TEXT NOT NULL REFERENCES influencers(id),
  customer_id        TEXT,
  transaction_id     TEXT NOT NULL,          -- charge/invoice Stripe
  stripe_event_id    TEXT NOT NULL,          -- pour rapprocher l'idempotence
  product            TEXT NOT NULL,
  tier               TEXT NOT NULL,
  commission_cents   BIGINT NOT NULL DEFAULT 0,
  ht_bonus_cents     BIGINT NOT NULL DEFAULT 0,
  radar_bonus_cents  BIGINT NOT NULL DEFAULT 0,
  starter_bonus_cents BIGINT NOT NULL DEFAULT 0,
  jackpot_bonus_cents BIGINT NOT NULL DEFAULT 0,
  gross_cents        BIGINT NOT NULL DEFAULT 0,   -- peut être négatif (clawback)
  reserve_cents      BIGINT NOT NULL DEFAULT 0,
  net_cents          BIGINT NOT NULL DEFAULT 0,   -- ce qui alimente le prochain payout
  is_clawback        BOOLEAN NOT NULL DEFAULT FALSE,
  billing_cycle      INTEGER,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- ⭐ garde-fou idempotence fine : un même event ne crée pas deux lignes identiques
  UNIQUE (stripe_event_id, transaction_id, product)
);
CREATE INDEX idx_ledger_influencer ON commission_ledger(influencer_id, created_at);

-- 5) Payouts mensuels (Stripe Connect) : agrège net_cents >= seuil 50 €
CREATE TABLE payouts (
  id                BIGSERIAL PRIMARY KEY,
  influencer_id     TEXT NOT NULL REFERENCES influencers(id),
  period            TEXT NOT NULL,           -- 'YYYY-MM'
  amount_cents      BIGINT NOT NULL,
  stripe_transfer_id TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','paid','failed','deferred')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (influencer_id, period)
);

-- 6) ⭐ Consentements CGU v4.2 (Art. 4.2 Auto-Pilot) : preuve immuable, append-only.
--    Enregistre la validation explicite de l'Art. 4.2 au checkout (cf. autoPilotConsent.js).
CREATE TABLE consent_logs (
  id               BIGSERIAL PRIMARY KEY,
  user_id          TEXT NOT NULL,
  stripe_object_id TEXT,                      -- Checkout Session / Subscription / charge
  cgu_version      TEXT NOT NULL,             -- ex. 'v4.2'
  cgu_article      TEXT NOT NULL,             -- ex. '4.2'
  article_sha256   TEXT NOT NULL,             -- empreinte du texte contractuel exact
  consent_hash     TEXT NOT NULL,             -- empreinte chaînée (user+object+ts+article)
  session_id       TEXT,
  ip               TEXT,
  user_agent       TEXT,
  consented_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_consent_user   ON consent_logs(user_id, consented_at);
CREATE INDEX idx_consent_object ON consent_logs(stripe_object_id);

-- Append-only : interdit toute mutation/suppression de la preuve de consentement.
CREATE OR REPLACE FUNCTION consent_logs_no_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'consent_logs est append-only (UPDATE/DELETE interdits)';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER consent_logs_no_update BEFORE UPDATE ON consent_logs
  FOR EACH ROW EXECUTE FUNCTION consent_logs_no_mutation();
CREATE TRIGGER consent_logs_no_delete BEFORE DELETE ON consent_logs
  FOR EACH ROW EXECUTE FUNCTION consent_logs_no_mutation();

-- 7) ⭐ Bonus one-shot DIFFÉRÉS (fenêtre anti-remboursement `encashmentConfirmed`).
--    À l'encaissement initial, seuls la commission (immédiate) et le compte HT sont
--    journalisés. Les bonus one-shot (prime HT, jackpot) sont EN ATTENTE ici tant que
--    la fenêtre n'est pas confirmée :
--      - one-off (Audit, Crash-Test, Labo) : 14 jours après paiement
--      - abonnement (Radar, Auto-Pilot, Marketplace) : à partir du 2e mois payé (billingCycle >= 2)
--    Le job différé `encashmentJob.js` (cron) rebascule status pending -> granted une
--    fois la fenêtre passée, puis enregistre les bonus dans commission_ledger.
CREATE TABLE pending_bonuses (
  id               BIGSERIAL PRIMARY KEY,
  influencer_id    TEXT NOT NULL REFERENCES influencers(id),
  customer_id      TEXT NOT NULL,
  transaction_id   TEXT NOT NULL,            -- charge / invoice Stripe
  product          TEXT NOT NULL,
  tier             TEXT NOT NULL,
  -- Contexte nécessaire au RECALCUL du bonus au déblocage (état du moment) :
  is_ht            BOOLEAN NOT NULL DEFAULT FALSE,  -- cette tx qualifie high-ticket (panier >= 98 € HT)
  net_amount_cents BIGINT NOT NULL,          -- montant net encaissé (base commission)
  cart_total_ht_cents BIGINT NOT NULL,       -- total HT du panier (qualifie le HT)
  type             TEXT NOT NULL CHECK (type IN ('one_time','subscription')),
  billing_cycle    INTEGER,                  -- N° de mois (subs) ; requis pour >= 2
  -- Échéance de la fenêtre de rétention (one-off T+14 j ; subs 2e mois confirmé)
  window_end_at    TIMESTAMPTZ NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','granted','cancelled')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_at       TIMESTAMPTZ,
  -- Un même paiement ne produit qu'UN bonus différé par type de produit
  UNIQUE (transaction_id, product)
);
CREATE INDEX idx_pending_bonuses_due ON pending_bonuses(status, window_end_at);

-- ============================================================================
--  NOTES D'INTÉGRATION
--  · Idempotence : à la réception d'un webhook, INSERT dans processed_stripe_events ;
--    si conflit (event déjà présent) => IGNORER (déjà traité).
--  · Concurrence : SELECT ... FOR UPDATE sur la ligne `influencers` pendant le calcul,
--    pour sérialiser les incréments de compteurs (htClientsCount, jackpotPaidCents…).
--  · Clawback : refund/chargeback => ligne ledger négative ; si le client était HT,
--    décrémenter ht_clients_count et reprendre le jackpot trop-perçu (applyHtReversal),
--    en imputant d'abord sur reserve_balance_cents, puis sur les payouts futurs.
--  · Réserve : la part reserve_cents n'est PAS versée ; elle est cumulée dans
--    influencers.reserve_balance_cents et libérée après 6 mois d'ancienneté / délai de litige.
-- ============================================================================
