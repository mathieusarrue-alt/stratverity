-- =============================================================================
-- Network Control Plane — schéma PostgreSQL (outbound_jobs + content_assets)
-- =============================================================================
-- Remplace l'automation navigateur (CDP/Studio) par un plan de contrôle
-- déterministe : jobs sortants traçables + assets de contenu versionnés.
-- Toute publication passe par une file bornée, rejouable et auditée.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- outbound_jobs : file bornée des tâches de publication sortante (YouTube,
-- Telegram, WhatsApp, X, etc.). Append-only, rejouable, jamais de doublon.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outbound_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type        TEXT NOT NULL,              -- ex. 'youtube_upload', 'telegram_post', 'whatsapp_dm'
    channel         TEXT NOT NULL,              -- ex. 'youtube', 'telegram', 'whatsapp'
    payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','in_progress','succeeded','failed','cancelled')),
    priority        INT NOT NULL DEFAULT 5,
    attempts        INT NOT NULL DEFAULT 0,
    max_attempts    INT NOT NULL DEFAULT 3,
    scheduled_at    TIMESTAMPTZ,
    locked_at       TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    last_error      TEXT,
    idempotency_key TEXT NOT NULL UNIQUE,       -- anti-doublon (hash du payload + channel)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS outbound_jobs_status_idx ON outbound_jobs (status);
CREATE INDEX IF NOT EXISTS outbound_jobs_channel_idx ON outbound_jobs (channel, status);
CREATE INDEX IF NOT EXISTS outbound_jobs_scheduled_idx
    ON outbound_jobs (scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS outbound_jobs_status_scheduled_idx
    ON outbound_jobs (status, scheduled_at);

-- ---------------------------------------------------------------------------
-- content_assets : assets média (vidéos/audio/images) liés aux jobs.
-- Chaque asset est versionné et vérifiable par hash SHA-256.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID REFERENCES outbound_jobs(id) ON DELETE SET NULL,
    asset_type      TEXT NOT NULL CHECK (asset_type IN ('video','audio','image','thumbnail','caption')),
    storage_key     TEXT NOT NULL,               -- clé d'objet (S3/R2/Supabase Storage)
    mime_type       TEXT NOT NULL,
    size_bytes      BIGINT NOT NULL DEFAULT 0,
    sha256_hash     TEXT NOT NULL,
    width           INT,
    height          INT,
    duration_ms     INT,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (job_id, asset_type, storage_key)
);

CREATE INDEX IF NOT EXISTS content_assets_job_idx ON content_assets (job_id);
CREATE INDEX IF NOT EXISTS content_assets_sha_idx ON content_assets (sha256_hash);

-- Append-only : le plan de contrôle est un registre immuable (auditable).
CREATE OR REPLACE FUNCTION outbound_jobs_no_update() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'outbound_jobs is append-only (use a new job instead of mutating)';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS outbound_jobs_no_update_trg ON outbound_jobs;
CREATE TRIGGER outbound_jobs_no_update_trg
    BEFORE UPDATE ON outbound_jobs
    FOR EACH ROW EXECUTE FUNCTION outbound_jobs_no_update();