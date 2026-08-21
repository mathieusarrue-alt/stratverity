-- =============================================================================
-- Strategy Vault — migration PostgreSQL (StratVerity pipeline R&D)
-- Conformité Art. 3.3 CGU : traitement technique anonymisé, aucune cession de
-- propriété intellectuelle. Seules les stratégies à score élevé (base saine)
-- sont tagguées R&D.
--
-- Contrat : 00_GOVERNANCE/RND_STRATEGY_VAULT_CONTRACT.md
-- Idempotent : chaque CREATE est préfixé IF NOT EXISTS.
-- =============================================================================

-- Extension UUID (clés primaires) — standard Postgres.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Table strategy_vault : le code utilisateur, nettoyé + anonymisé, scellé.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS strategy_vault (
    vault_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id            UUID NOT NULL,              -- lien vers l'audit source
    language            TEXT NOT NULL CHECK (language IN ('pinescript', 'python', 'mql4', 'mql5')),
    sha256_hash         TEXT NOT NULL UNIQUE,       -- hash SHA-256 du code source d'origine
    anonymized_script   TEXT NOT NULL,              -- code nettoyé + anonymisé (aucun identifiant)
    health_score        INTEGER NOT NULL CHECK (health_score BETWEEN 0 AND 100),
    rnd_eligible        BOOLEAN NOT NULL DEFAULT FALSE, -- tag R&D si health_score >= 70
    martingale_flag     BOOLEAN NOT NULL DEFAULT FALSE, -- rédhibitoire anti-scam (jamais taggé R&D)
    ingested_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index de recherche : par hash (unicité déjà couverte) et par éligibilité R&D.
CREATE INDEX IF NOT EXISTS strategy_vault_rnd_eligible_idx
    ON strategy_vault (rnd_eligible)
    WHERE rnd_eligible = TRUE;

CREATE INDEX IF NOT EXISTS strategy_vault_audit_idx
    ON strategy_vault (audit_id);

-- Append-only : le vault est un registre immuable (cohérent avec l'evidence store).
CREATE OR REPLACE FUNCTION strategy_vault_no_update() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'strategy_vault is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS strategy_vault_no_update_trg ON strategy_vault;
CREATE TRIGGER strategy_vault_no_update_trg
    BEFORE UPDATE OR DELETE ON strategy_vault
    FOR EACH ROW EXECUTE FUNCTION strategy_vault_no_update();