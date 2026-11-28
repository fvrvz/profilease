-- =============================================================================
-- Profilease Cloudflare D1 Migration 0004
-- Plan-based themes, layouts, views, custom CSS, add-ons, and auth reset tokens.
-- =============================================================================

ALTER TABLE profiles ADD COLUMN layout_variant TEXT NOT NULL DEFAULT 'classic';
ALTER TABLE profiles ADD COLUMN view_mode TEXT NOT NULL DEFAULT 'portfolio';
ALTER TABLE profiles ADD COLUMN border_style TEXT NOT NULL DEFAULT 'sharp';
ALTER TABLE profiles ADD COLUMN theme_overrides_json TEXT;
ALTER TABLE profiles ADD COLUMN custom_css TEXT;
ALTER TABLE profiles ADD COLUMN hide_platform_branding INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN custom_domain_addon INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN extra_service_slots INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN password_reset_token TEXT;
ALTER TABLE profiles ADD COLUMN password_reset_expires_at TEXT;

UPDATE profiles SET subscription_plan = 'basic' WHERE subscription_plan IS NULL OR subscription_plan = 'headless';
