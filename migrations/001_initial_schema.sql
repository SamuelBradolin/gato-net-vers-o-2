-- ====================================================================
-- GATO NET - MIGRATION 001: INITIAL POSTGRESQL 16 SCHEMA
-- VPS Virtarix - Ubuntu 24.04 LTS
-- ====================================================================

-- Enable UUID extension if supported
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: admins
CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(190) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'admin', -- 'superadmin', 'admin', 'editor'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE NULL,
    last_login_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- 2. Table: admin_sessions
CREATE TABLE IF NOT EXISTS admin_sessions (
    id VARCHAR(64) PRIMARY KEY,
    admin_id VARCHAR(64) NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    token_hash VARCHAR(128) UNIQUE NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- 3. Table: admin_audit_logs
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    admin_id VARCHAR(64) NULL REFERENCES admins(id) ON DELETE SET NULL,
    admin_email VARCHAR(190) NOT NULL,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NULL,
    details JSONB NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action);

-- 4. Table: categories
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    icon_name VARCHAR(64) NOT NULL DEFAULT 'Layers',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(display_order ASC);

-- 5. Table: channels
CREATE TABLE IF NOT EXISTS channels (
    id VARCHAR(64) PRIMARY KEY,
    number INTEGER NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    category_id VARCHAR(64) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    logo_url TEXT NOT NULL,
    backup_image_url TEXT NULL,
    stream_url TEXT NOT NULL,
    alternative_streams JSONB NOT NULL DEFAULT '[]'::jsonb,
    resolution VARCHAR(16) NOT NULL DEFAULT '1080p',
    aspect_ratio VARCHAR(8) NOT NULL DEFAULT '16:9',
    current_program VARCHAR(200) NOT NULL DEFAULT 'Transmissão Ao Vivo',
    current_program_time VARCHAR(64) NOT NULL DEFAULT '20:00 - 22:00',
    next_program VARCHAR(200) NULL,
    is_live BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_channels_category ON channels(category_id);
CREATE INDEX IF NOT EXISTS idx_channels_number ON channels(number);

-- 6. Table: stream_sources
CREATE TABLE IF NOT EXISTS stream_sources (
    id VARCHAR(64) PRIMARY KEY,
    channel_id VARCHAR(64) NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    protocol VARCHAR(16) NOT NULL DEFAULT 'HLS', -- 'HLS', 'RTMP', 'MP4', 'DASH'
    url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'online', -- 'online', 'degraded', 'offline'
    latency_ms INTEGER NOT NULL DEFAULT 1200,
    bitrate_kbps INTEGER NOT NULL DEFAULT 4500,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stream_sources_channel ON stream_sources(channel_id);

-- 7. Table: subscribers
CREATE TABLE IF NOT EXISTS subscribers (
    id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    whatsapp VARCHAR(32) NOT NULL,
    email VARCHAR(190) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'active', -- 'active', 'pending', 'expired', 'blocked'
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_whatsapp ON subscribers(whatsapp);

-- 8. Table: subscription_plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    badge VARCHAR(64) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    period_label VARCHAR(100) NOT NULL,
    duration_months INTEGER NOT NULL DEFAULT 1,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Table: user_subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id VARCHAR(64) PRIMARY KEY,
    subscriber_id VARCHAR(64) NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    plan_id VARCHAR(64) NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    status VARCHAR(24) NOT NULL DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_sub ON user_subscriptions(subscriber_id);

-- 10. Table: manual_orders
CREATE TABLE IF NOT EXISTS manual_orders (
    id VARCHAR(64) PRIMARY KEY,
    subscriber_id VARCHAR(64) NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    plan_id VARCHAR(64) NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    payment_method VARCHAR(16) NOT NULL, -- 'pix', 'paypal'
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    notes TEXT NULL,
    reviewed_by_admin_id VARCHAR(64) NULL REFERENCES admins(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. Table: payment_configs
CREATE TABLE IF NOT EXISTS payment_configs (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'primary',
    pix_key VARCHAR(190) NOT NULL DEFAULT 'financeiro@gatonet.tv.br',
    pix_key_type VARCHAR(32) NOT NULL DEFAULT 'Email',
    pix_recipient_name VARCHAR(150) NOT NULL DEFAULT 'Gato Net Streaming e Mídia Ltda',
    pix_city VARCHAR(100) NOT NULL DEFAULT 'São Paulo',
    pix_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    paypal_payment_link TEXT NOT NULL DEFAULT 'https://paypal.me/gatonettv',
    paypal_business_email VARCHAR(190) NOT NULL DEFAULT 'payments@gatonet.tv',
    paypal_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 12. Table: appearance_configs
CREATE TABLE IF NOT EXISTS appearance_configs (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'primary',
    site_name VARCHAR(100) NOT NULL DEFAULT 'Gato Net',
    tagline VARCHAR(200) NOT NULL DEFAULT 'Plataforma Profissional de Televisão Ao Vivo',
    logo_url TEXT NULL,
    favicon_url TEXT NULL,
    primary_color VARCHAR(16) NOT NULL DEFAULT '#060911',
    dark_navy_color VARCHAR(16) NOT NULL DEFAULT '#0b1329',
    electric_blue_color VARCHAR(16) NOT NULL DEFAULT '#2563eb',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 13. Table: ad_slots
CREATE TABLE IF NOT EXISTS ad_slots (
    id VARCHAR(64) PRIMARY KEY,
    slot_type VARCHAR(32) NOT NULL, -- 'header', 'player_side', 'player_bottom', 'inter_categories', 'footer'
    title VARCHAR(150) NOT NULL,
    subtitle TEXT NULL,
    image_url TEXT NULL,
    target_url TEXT NOT NULL DEFAULT '#',
    dimensions VARCHAR(64) NOT NULL,
    code_snippet TEXT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 14. Table: access_modes
CREATE TABLE IF NOT EXISTS access_modes (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'primary',
    current_mode VARCHAR(24) NOT NULL DEFAULT 'free', -- 'free', 'free_registered', 'subscription'
    allow_public_browse BOOLEAN NOT NULL DEFAULT TRUE,
    max_simultaneous_streams INTEGER NOT NULL DEFAULT 2,
    stream_relay_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 15. Table: playback_sessions
CREATE TABLE IF NOT EXISTS playback_sessions (
    id VARCHAR(64) PRIMARY KEY,
    subscriber_id VARCHAR(64) NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    channel_id VARCHAR(64) NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_playback_active ON playback_sessions(is_active, last_heartbeat);
