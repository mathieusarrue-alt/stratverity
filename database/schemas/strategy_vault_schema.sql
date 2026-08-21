-- =============================================================================
-- StratVerity Audit Engine v1.1.0 — Schéma PostgreSQL (Supabase)
-- Table strategy_vault : coffre-fort des stratégies, anonymisation + hash SHA-256,
-- métriques certifiées, Data Override Engine, RLS.
-- =============================================================================

-- Création de la table principale du coffre-fort de stratégies
CREATE TABLE IF NOT EXISTS public.strategy_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL,
    strategy_name VARCHAR(255) NOT NULL DEFAULT 'Unnamed Strategy',
    sha256_hash VARCHAR(64) NOT NULL UNIQUE,
    anonymized_script TEXT NOT NULL,
    health_score INT NOT NULL CHECK (health_score BETWEEN 0 AND 100),
    certified_sharpe NUMERIC(8, 3) NOT NULL,
    certified_max_drawdown NUMERIC(8, 4) NOT NULL,
    certified_win_rate NUMERIC(8, 4) NOT NULL,
    certified_profit_factor NUMERIC(8, 3) NULL,
    certified_net_return NUMERIC(10, 4) NULL,
    total_trades INT DEFAULT 0,
    data_overridden BOOLEAN DEFAULT FALSE,
    override_reason TEXT NULL,
    engine_version VARCHAR(20) DEFAULT '1.1.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activation du Row Level Security (RLS)
ALTER TABLE public.strategy_vault ENABLE ROW LEVEL SECURITY;

-- Politiques d'accès Supabase.
-- NOTE DE CORRECTION (Hermès Dev) : la politique fournie dans le brief
--   "Insertion restreinte au service d'audit ... WITH CHECK (true)"
--   n'était PAS restrictive (WITH CHECK (true) autorise tout le monde à insérer).
--   Le insert doit être réservé au rôle service (service_role / postgres), pas
--   exposé au client anonyme. On garde une lecture publique, mais l'écriture est
--   restreinte par défaut : en RLS, l'insertion n'est autorisée que pour le rôle
--   service_role (Supabase) ou un utilisateur authentifié explicite via auth.uid().
CREATE POLICY "Lecture publique des strategies certifiees"
ON public.strategy_vault FOR SELECT
USING (true);

-- Insertion réservée au rôle service (jamais au client anonyme).
CREATE POLICY "Insertion reservee au service d'audit"
ON public.strategy_vault FOR INSERT
TO service_role
WITH CHECK (true);

-- Mise à jour restreinte au rôle service (immuabilité hors service).
CREATE POLICY "Mise a jour reservee au service d'audit"
ON public.strategy_vault FOR UPDATE
TO service_role
USING (true);

-- Index de recherche par utilisateur (listing des stratégies d'un compte).
CREATE INDEX IF NOT EXISTS strategy_vault_user_id_idx ON public.strategy_vault (user_id);