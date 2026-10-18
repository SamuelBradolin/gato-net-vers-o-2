-- ====================================================================
-- GATO NET - MIGRATION 004: ENHANCED SUBSCRIPTION PLANS & ACCESS CONTROL
-- VPS Virtarix - Ubuntu 24.04 LTS
-- ====================================================================

-- 1. Add fields to subscription_plans for dynamic administration
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS duration_days INTEGER NOT NULL DEFAULT 30;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_screens INTEGER NOT NULL DEFAULT 1;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS allowed_scope VARCHAR(20) NOT NULL DEFAULT 'all';
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS allowed_category_ids JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS allowed_channel_ids JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Update default plans duration in days and max screens
UPDATE subscription_plans SET duration_days = 30, max_screens = 1, description = 'Acesso mensal flexível com suporte aos principais dispositivos.' WHERE id = 'plan_mensal';
UPDATE subscription_plans SET duration_days = 90, max_screens = 2, description = 'Economia trimestral com até 2 telas simultâneas.' WHERE id = 'plan_trimestral';
UPDATE subscription_plans SET duration_days = 365, max_screens = 4, description = 'Acesso anual completo para toda a família em até 4 telas.' WHERE id = 'plan_anual';
