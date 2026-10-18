-- ====================================================================
-- GATO NET - MIGRATION 005: PLAYBACK SESSIONS ENHANCEMENT & CONCURRENCY
-- VPS Virtarix - Ubuntu 24.04 LTS
-- ====================================================================

-- 1. Add extra columns for device identification, playback token and termination reason
ALTER TABLE playback_sessions ADD COLUMN IF NOT EXISTS device_info VARCHAR(150) NOT NULL DEFAULT 'Dispositivo Web';
ALTER TABLE playback_sessions ADD COLUMN IF NOT EXISTS channel_name VARCHAR(150) NULL;
ALTER TABLE playback_sessions ADD COLUMN IF NOT EXISTS playback_token VARCHAR(128) NULL;
ALTER TABLE playback_sessions ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE playback_sessions ADD COLUMN IF NOT EXISTS ended_reason VARCHAR(100) NULL;

-- 2. Performance indexes for concurrent session limit checking and heartbeats
CREATE INDEX IF NOT EXISTS idx_playback_sub_active ON playback_sessions(subscriber_id, is_active);
CREATE INDEX IF NOT EXISTS idx_playback_heartbeat ON playback_sessions(last_heartbeat, is_active);
