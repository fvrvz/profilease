-- =============================================================================
-- Profilease Migration 0002: Onboarding Temp Password & Billing Metadata
-- =============================================================================

ALTER TABLE profiles ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN subscription_plan TEXT;
ALTER TABLE profiles ADD COLUMN subscription_status TEXT;
