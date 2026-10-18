-- ====================================================================
-- GATO NET - MIGRATION 006: MANUAL PAYMENTS & ENHANCED CHANNEL CRUD
-- VPS Virtarix - Ubuntu 24.04 LTS
-- ====================================================================

-- 1. Upgrade manual_orders table with full order details, receipt info, and admin audit
ALTER TABLE manual_orders ADD COLUMN IF NOT EXISTS order_code VARCHAR(32) NULL;
ALTER TABLE manual_orders ADD COLUMN IF NOT EXISTS subscriber_name VARCHAR(150) NULL;
ALTER TABLE manual_orders ADD COLUMN IF NOT EXISTS subscriber_email VARCHAR(190) NULL;
ALTER TABLE manual_orders ADD COLUMN IF NOT EXISTS subscriber_whatsapp VARCHAR(32) NULL;
ALTER TABLE manual_orders ADD COLUMN IF NOT EXISTS plan_name VARCHAR(100) NULL;
ALTER TABLE manual_orders ADD COLUMN IF NOT EXISTS plan_duration_days INTEGER NOT NULL DEFAULT 30;
ALTER TABLE manual_orders ADD COLUMN IF NOT EXISTS receipt_url TEXT NULL;
ALTER TABLE manual_orders ADD COLUMN IF NOT EXISTS receipt_code VARCHAR(190) NULL;
ALTER TABLE manual_orders ADD COLUMN IF NOT EXISTS pix_copy_paste TEXT NULL;
ALTER TABLE manual_orders ADD COLUMN IF NOT EXISTS reviewed_by_admin_email VARCHAR(190) NULL;
ALTER TABLE manual_orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_manual_orders_status ON manual_orders(status);
CREATE INDEX IF NOT EXISTS idx_manual_orders_code ON manual_orders(order_code);
CREATE INDEX IF NOT EXISTS idx_manual_orders_subscriber ON manual_orders(subscriber_id);

-- 2. Upgrade channels table with status ('active', 'inactive', 'maintenance') and access permission
ALTER TABLE channels ADD COLUMN IF NOT EXISTS status VARCHAR(24) NOT NULL DEFAULT 'active';
ALTER TABLE channels ADD COLUMN IF NOT EXISTS access_permission VARCHAR(24) NOT NULL DEFAULT 'free';
