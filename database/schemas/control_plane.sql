-- ============================================================================
--  StratVerity — NETWORK CONTROL PLANE (schema.sql)
--  Point d'entrée UNIQUE pour toute action réseau. L'agent conversationnel ne
--  fait que créer des Campaigns/Jobs via l'API d'administration REST.
--  Rupture avec l'ops manuel (SSH/browser/CDP) : tout passe par ces tables +
--  des workers isolés qui consomment des APIs officielles.
-- ============================================================================

-- Identifiants et canaux réseau
DO $$ BEGIN
  CREATE TYPE network_platform AS ENUM ('youtube', 'whatsapp', 'telegram', 'postiz', 'twitter', 'tiktok');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('pending', 'processing', 'published', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE lang_policy AS ENUM ('EN_ONLY', 'FR_ONLY', 'AUTO_ENGAGEMENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS network_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform network_platform NOT NULL,
    account_handle VARCHAR(100) NOT NULL,
    credentials_vault_ref VARCHAR(255) NOT NULL, -- Référence vers les clés d'API (Vault/Env)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pipeline de contenu versionné
CREATE TABLE IF NOT EXISTS content_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    media_url VARCHAR(512), -- Lien S3/R2 du fichier vidéo ou image QC
    language lang_policy DEFAULT 'EN_ONLY',
    metadata JSONB DEFAULT '{}'::jsonb, -- Tags, hashtags, UTM parameters
    checksum VARCHAR(64) UNIQUE NOT NULL, -- Anti-doublon / Idempotence
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files d'attente d'actions idempotentes
CREATE TABLE IF NOT EXISTS outbound_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES network_channels(id),
    asset_id UUID REFERENCES content_assets(id),
    idempotency_key VARCHAR(255) UNIQUE NOT NULL, -- asset_id + channel_id + target_slot
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status job_status DEFAULT 'pending',
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    last_error TEXT,
    external_post_id VARCHAR(255), -- ID de publication retourné par l'API cible (YT ID, Postiz ID)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transduction des événements SaaS vers le Réseau
CREATE TABLE IF NOT EXISTS event_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL, -- 'audit.certified', 'badge.issued'
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- --- Index métier ---
CREATE INDEX IF NOT EXISTS idx_jobs_status_sched ON outbound_jobs(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_jobs_idempotency ON outbound_jobs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_outbox_processed ON event_outbox(processed);