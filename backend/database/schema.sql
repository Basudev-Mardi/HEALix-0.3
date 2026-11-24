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

CREATE INDEX IF NOT EXISTS idx_doctors_department ON doctors(department_slug);
CREATE INDEX IF NOT EXISTS idx_services_department ON services(department_slug);
CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery_items(category);
CREATE INDEX IF NOT EXISTS idx_appointments_reference ON appointments(booking_reference);
CREATE INDEX IF NOT EXISTS idx_appointments_email ON appointments(LOWER(patient_email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_slot
  ON appointments(doctor_slug, appointment_date, time_slot)
  WHERE status <> 'Cancelled';
