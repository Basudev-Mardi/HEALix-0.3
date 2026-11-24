-- Healix Hospital Management System — Public Portal Schema (Neon PostgreSQL)

CREATE TABLE IF NOT EXISTS hospital_info (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  founded_year INTEGER NOT NULL,
  beds_count INTEGER NOT NULL,
  doctors_count INTEGER NOT NULL,
  specialties_count INTEGER NOT NULL,
  patients_served TEXT NOT NULL,
  accreditation TEXT NOT NULL,
  phone TEXT NOT NULL,
  emergency_phone TEXT NOT NULL,
  ambulance_phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  about_summary TEXT NOT NULL,
  about_story TEXT NOT NULL,
  mission TEXT NOT NULL,
  vision TEXT NOT NULL,
  values_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  leadership_quote TEXT NOT NULL,
  leadership_name TEXT NOT NULL,
  leadership_title TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  overview TEXT NOT NULL,
  icon TEXT NOT NULL,
  floor_location TEXT NOT NULL,
  head_doctor_name TEXT NOT NULL,
  beds_allocated INTEGER NOT NULL DEFAULT 0,
  phone_ext TEXT NOT NULL,
  highlights TEXT[] NOT NULL DEFAULT '{}',
  conditions_treated TEXT[] NOT NULL DEFAULT '{}',
  equipment TEXT[] NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS doctors (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  specialty TEXT NOT NULL,
  department_slug TEXT NOT NULL REFERENCES departments(slug) ON DELETE RESTRICT,
  qualification TEXT NOT NULL,
  experience_years INTEGER NOT NULL,
  languages TEXT[] NOT NULL DEFAULT '{}',
  bio TEXT NOT NULL,
  education TEXT[] NOT NULL DEFAULT '{}',
  awards TEXT[] NOT NULL DEFAULT '{}',
  consultation_days TEXT NOT NULL,
  consultation_hours TEXT NOT NULL,
  consultation_fee TEXT NOT NULL,
  avatar_initials TEXT NOT NULL,
  accent_tone TEXT NOT NULL DEFAULT 'slate',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  department_slug TEXT NOT NULL REFERENCES departments(slug) ON DELETE RESTRICT,
  short_description TEXT NOT NULL,
  overview TEXT NOT NULL,
  preparation_notes TEXT NOT NULL,
  duration_estimate TEXT NOT NULL,
  availability TEXT NOT NULL,
  key_features TEXT[] NOT NULL DEFAULT '{}',
  procedures TEXT[] NOT NULL DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS facilities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  floor_location TEXT NOT NULL,
  availability TEXT NOT NULL,
  description TEXT NOT NULL,
  highlights TEXT[] NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS infrastructure_items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  metric_value TEXT NOT NULL,
  metric_label TEXT NOT NULL,
  description TEXT NOT NULL,
  specs TEXT[] NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gallery_items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  aspect_ratio TEXT NOT NULL DEFAULT 'landscape',
  accent_palette TEXT NOT NULL DEFAULT 'stone',
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS visiting_hours (
  id SERIAL PRIMARY KEY,
  unit_name TEXT NOT NULL,
  category TEXT NOT NULL,
  days TEXT NOT NULL,
  hours TEXT NOT NULL,
  max_visitors TEXT NOT NULL,
  guidelines TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS emergency_protocols (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  triage_level TEXT NOT NULL,
  response_time TEXT NOT NULL,
  phone TEXT NOT NULL,
  description TEXT NOT NULL,
  steps TEXT[] NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  booking_reference TEXT UNIQUE NOT NULL,
  doctor_slug TEXT NOT NULL REFERENCES doctors(slug) ON DELETE RESTRICT,
  department_slug TEXT NOT NULL REFERENCES departments(slug) ON DELETE RESTRICT,
  appointment_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  visit_type TEXT NOT NULL DEFAULT 'In-Person Consultation',
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_dob DATE,
  patient_gender TEXT,
  reason_for_visit TEXT,
  insurance_provider TEXT,
  status TEXT NOT NULL DEFAULT 'Confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointment_faqs (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- Patient Account & Portal Tables
CREATE TABLE IF NOT EXISTS patient_accounts (
  id SERIAL PRIMARY KEY,
  mrn TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  date_of_birth DATE,
  gender TEXT DEFAULT '',
  blood_group TEXT DEFAULT '',
  address TEXT DEFAULT '',
  emergency_contact_name TEXT DEFAULT '',
  emergency_contact_phone TEXT DEFAULT '',
  insurance_provider TEXT DEFAULT '',
  insurance_policy_no TEXT DEFAULT '',
  allergies TEXT[] NOT NULL DEFAULT '{}',
  notify_email BOOLEAN NOT NULL DEFAULT TRUE,
  notify_sms BOOLEAN NOT NULL DEFAULT TRUE,
  notify_lab_results BOOLEAN NOT NULL DEFAULT TRUE,
  notify_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_sessions (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patient_accounts(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patient_accounts(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_medical_history (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patient_accounts(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL,
  title TEXT NOT NULL,
  recorded_date DATE NOT NULL,
  doctor_name TEXT NOT NULL,
  department_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  summary TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patient_prescriptions (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patient_accounts(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  prescribed_by TEXT NOT NULL,
  prescribed_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  refills_remaining INTEGER NOT NULL DEFAULT 0,
  instructions TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patient_lab_reports (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patient_accounts(id) ON DELETE CASCADE,
  report_code TEXT UNIQUE NOT NULL,
  test_name TEXT NOT NULL,
  category TEXT NOT NULL,
  collected_date DATE NOT NULL,
  ordered_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Finalized',
  summary TEXT NOT NULL,
  results_json JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS patient_radiology_reports (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patient_accounts(id) ON DELETE CASCADE,
  study_code TEXT UNIQUE NOT NULL,
  modality TEXT NOT NULL,
  study_name TEXT NOT NULL,
  study_date DATE NOT NULL,
  radiologist_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Finalized',
  findings TEXT NOT NULL,
  impression TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patient_billing_records (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patient_accounts(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  service_description TEXT NOT NULL,
  department_name TEXT NOT NULL,
  billing_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount_total NUMERIC(10, 2) NOT NULL,
  insurance_covered NUMERIC(10, 2) NOT NULL DEFAULT 0,
  patient_responsibility NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Unpaid',
  payment_method TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS portal_notifications (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patient_accounts(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_href TEXT DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_inquiries (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  department TEXT DEFAULT '',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_feedbacks (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  department_visited TEXT DEFAULT '',
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  doctor_care_rating INTEGER DEFAULT 5,
  cleanliness_rating INTEGER DEFAULT 5,
  staff_courtesy_rating INTEGER DEFAULT 5,
  comments TEXT NOT NULL,
  would_recommend BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctors_department ON doctors(department_slug);
CREATE INDEX IF NOT EXISTS idx_services_department ON services(department_slug);
CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery_items(category);
CREATE INDEX IF NOT EXISTS idx_appointments_reference ON appointments(booking_reference);
CREATE INDEX IF NOT EXISTS idx_appointments_email ON appointments(LOWER(patient_email));
CREATE INDEX IF NOT EXISTS idx_patient_sessions_token ON patient_sessions(token);
CREATE INDEX IF NOT EXISTS idx_portal_notifications_patient ON portal_notifications(patient_id, is_read);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_slot
  ON appointments(doctor_slug, appointment_date, time_slot)
  WHERE status <> 'Cancelled';
