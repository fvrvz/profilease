-- =============================================================================
-- Profilease Cloudflare D1 Migration 0002
-- Persist full practitioner profile details, service mode, testimonials,
-- Google Reviews URL, service metadata, and slot duration.
-- =============================================================================

ALTER TABLE profiles ADD COLUMN location TEXT;
ALTER TABLE profiles ADD COLUMN clinic_or_school_name TEXT;
ALTER TABLE profiles ADD COLUMN about_detailed TEXT;
ALTER TABLE profiles ADD COLUMN timings_note TEXT;
ALTER TABLE profiles ADD COLUMN emergency_notice TEXT;
ALTER TABLE profiles ADD COLUMN service_mode TEXT NOT NULL DEFAULT 'clinic';
ALTER TABLE profiles ADD COLUMN testimonials_json TEXT;
ALTER TABLE profiles ADD COLUMN google_reviews_url TEXT;

ALTER TABLE services ADD COLUMN category TEXT NOT NULL DEFAULT 'Consultation';
ALTER TABLE services ADD COLUMN tags_json TEXT;

ALTER TABLE availabilities ADD COLUMN slot_duration_minutes INTEGER NOT NULL DEFAULT 30;
