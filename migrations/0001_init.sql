-- =============================================================================
-- Profilease Cloudflare D1 Initial Migration
-- =============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  profession TEXT NOT NULL,
  title TEXT NOT NULL,
  bio TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  theme TEXT NOT NULL,
  custom_domain TEXT UNIQUE,
  client_access_key TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  currency TEXT NOT NULL,
  timezone TEXT NOT NULL,
  credentials TEXT, -- JSON array of strings
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_custom_domain ON profiles(custom_domain);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price REAL NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_services_profile_id ON services(profile_id);

CREATE TABLE IF NOT EXISTS availabilities (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_availabilities_profile_id ON availabilities(profile_id);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL,
  service_title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  appointment_date TEXT NOT NULL,
  appointment_time TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  action_token TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointments_profile_id ON appointments(profile_id);
CREATE INDEX IF NOT EXISTS idx_appointments_action_token ON appointments(action_token);

-- =============================================================================
-- Initial Seed Data: Dr. Elena Vance
-- =============================================================================
INSERT OR IGNORE INTO profiles (
  id, slug, name, profession, title, bio, avatar_url, theme,
  custom_domain, client_access_key, email, phone, country, currency, timezone, credentials
) VALUES (
  'prof-doc-1',
  'dr-elena-vance',
  'Dr. Elena Vance, MD',
  'doctor',
  'Consultant Neurologist & Spine Care Specialist',
  'With over 14 years of clinical experience across major teaching hospitals, Dr. Elena Vance provides patient-centered neurological diagnostics, spine treatment protocols, and headache clinic consultations. Every patient receives rigorous clinical analysis paired with sharp, actionable care plans.',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=600',
  'medical-teal',
  'drelenavance.com',
  'elena2026',
  'contact@drelenavance.com',
  '+1 (617) 555-0192',
  'United States',
  'USD',
  'America/New_York',
  '["MD, Harvard Medical School","Board Certified in Neurology (ABPN)","Fellow, American Academy of Neurology (FAAN)"]'
);

INSERT OR IGNORE INTO services (id, profile_id, name, description, duration_minutes, price, is_active)
VALUES
  ('srv-doc-1', 'prof-doc-1', 'Initial Neurological Consultation', 'Comprehensive neurological history, physical exam, and personalized diagnostic roadmap.', 45, 275.00, 1),
  ('srv-doc-2', 'prof-doc-1', 'Spine & Radiculopathy Evaluation', 'Focused clinical evaluation for cervical or lumbar nerve compression, sciatica, and disc herniation.', 30, 210.00, 1),
  ('srv-doc-3', 'prof-doc-1', 'Chronic Migraine & Headache Protocol', 'Evidence-based headache management including preventive medicine and peripheral nerve blocks.', 30, 195.00, 1);

INSERT OR IGNORE INTO availabilities (id, profile_id, day_of_week, enabled, start_time, end_time)
VALUES
  ('av-1-mon', 'prof-doc-1', 'monday', 1, '09:00', '16:00'),
  ('av-1-tue', 'prof-doc-1', 'tuesday', 1, '09:00', '16:00'),
  ('av-1-wed', 'prof-doc-1', 'wednesday', 1, '09:00', '16:00'),
  ('av-1-thu', 'prof-doc-1', 'thursday', 1, '09:00', '16:00'),
  ('av-1-fri', 'prof-doc-1', 'friday', 1, '09:00', '14:00'),
  ('av-1-sat', 'prof-doc-1', 'saturday', 0, '10:00', '13:00'),
  ('av-1-sun', 'prof-doc-1', 'sunday', 0, '10:00', '13:00');

-- =============================================================================
-- Initial Seed Data: Marcus Chen (Teacher / Educator)
-- =============================================================================
INSERT OR IGNORE INTO profiles (
  id, slug, name, profession, title, bio, avatar_url, theme,
  custom_domain, client_access_key, email, phone, country, currency, timezone, credentials
) VALUES (
  'prof-edu-1',
  'marcus-chen',
  'Marcus Chen, M.Sc.',
  'teacher',
  'AP Physics, Mechanics & Olympiad Master Instructor',
  'Passionate secondary STEM educator and national Olympiad coach. Marcus Chen transforms complex Newtonian physics and electromagnetism concepts into crisp, intuitive models with proven high-scoring contest results.',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
  'academic-indigo',
  'marcuschenphysics.edu',
  'marcus2026',
  'marcus@chenphysics.edu',
  '+1 (415) 555-0188',
  'United States',
  'USD',
  'America/Los_Angeles',
  '["M.Sc. Applied Physics, Stanford University","12+ Years Competitive Olympiad Coaching","Certified Master AP Educator"]'
);

INSERT OR IGNORE INTO services (id, profile_id, name, description, duration_minutes, price, is_active)
VALUES
  ('srv-edu-1', 'prof-edu-1', '1-on-1 AP Physics C Mechanics Drill', 'Deep dive into rotational dynamics, Lagrangian concepts, and past exam analysis.', 60, 110.00, 1),
  ('srv-edu-2', 'prof-edu-1', 'Physics Olympiad Semifinal Prep', 'Advanced problem solving techniques for USAPhO / IPhO shortlist challenges.', 90, 160.00, 1);

INSERT OR IGNORE INTO availabilities (id, profile_id, day_of_week, enabled, start_time, end_time)
VALUES
  ('av-2-mon', 'prof-edu-1', 'monday', 1, '15:00', '20:00'),
  ('av-2-tue', 'prof-edu-1', 'tuesday', 1, '15:00', '20:00'),
  ('av-2-wed', 'prof-edu-1', 'wednesday', 1, '15:00', '20:00'),
  ('av-2-thu', 'prof-edu-1', 'thursday', 1, '15:00', '20:00'),
  ('av-2-fri', 'prof-edu-1', 'friday', 1, '15:00', '19:00'),
  ('av-2-sat', 'prof-edu-1', 'saturday', 1, '10:00', '16:00'),
  ('av-2-sun', 'prof-edu-1', 'sunday', 0, '10:00', '14:00');
