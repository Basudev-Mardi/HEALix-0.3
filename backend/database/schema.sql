-- Healix Hospital Management System — Public Portal Schema (Neon PostgreSQL)

-- ============================================================================
-- Section 8.B: Hospital Information Schema Blueprint
-- ============================================================================

-- 1. hospital_settings: name, address, contact, timings
CREATE TABLE IF NOT EXISTS hospital_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  contact JSONB NOT NULL DEFAULT '{"phone": "+1 (800) 432-5490", "emergency": "+1 (800) 911-4325", "email": "concierge@healixhospital.org"}'::jsonb,
  timings JSONB NOT NULL DEFAULT '{"opd": "Mon - Sat: 08:00 AM - 08:00 PM", "emergency": "24/7 Level I Trauma", "visiting_hours": "10:00 AM - 08:00 PM"}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. hospital_branches: id, name, address, contact
CREATE TABLE IF NOT EXISTS hospital_branches (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  contact JSONB NOT NULL DEFAULT '{"phone": "", "emergency": "", "email": ""}'::jsonb,
  is_main_campus BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'under_expansion')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hospital_branches_status ON hospital_branches(status);

-- 3. Ensure status and description fields on departments, services, facilities
ALTER TABLE departments ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE departments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

ALTER TABLE services ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE services ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS slug TEXT DEFAULT '';
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- 4. hospital_gallery: id, image_url, caption, category
CREATE TABLE IF NOT EXISTS hospital_gallery (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL,
  category TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hospital_gallery_category ON hospital_gallery(category);

-- 5. hospital_statistics: id, metric_name, metric_value
CREATE TABLE IF NOT EXISTS hospital_statistics (
  id SERIAL PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value TEXT NOT NULL,
  sublabel TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backward-compatible Hospital Profile Table
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
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  profile_image TEXT DEFAULT '',
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

-- Ensure Section 8.C columns exist on doctors
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS profile_image TEXT DEFAULT '';

-- ============================================================================
-- Section 8.C: Doctors and Schedules Normalized Blueprint
-- ============================================================================

-- 1. doctor_qualifications: id, doctor_id, qualification
CREATE TABLE IF NOT EXISTS doctor_qualifications (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  qualification TEXT NOT NULL,
  institution TEXT DEFAULT '',
  year_obtained INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_qual_doctor ON doctor_qualifications(doctor_id);

-- 2. doctor_specializations: id, doctor_id, specialization
CREATE TABLE IF NOT EXISTS doctor_specializations (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  specialization TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_spec_doctor ON doctor_specializations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doc_spec_name ON doctor_specializations(LOWER(specialization));

-- 3. doctor_schedules: id, doctor_id, day, start_time, end_time
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day TEXT NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_or_cabin TEXT DEFAULT '',
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_schedules_doc_day ON doctor_schedules(doctor_id, day);

-- 4. doctor_leaves: id, doctor_id, start_date, end_date, reason
CREATE TABLE IF NOT EXISTS doctor_leaves (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  approved_by TEXT DEFAULT 'Medical Director Office',
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('requested', 'approved', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_leave_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_doc_leaves_doctor ON doctor_leaves(doctor_id, start_date, end_date);

-- 5. appointment_slots: id, doctor_id, date, start_time, end_time, capacity
CREATE TABLE IF NOT EXISTS appointment_slots (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  booked_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_slot_capacity CHECK (booked_count <= capacity),
  CONSTRAINT unique_doctor_slot UNIQUE (doctor_id, date, start_time)
);

CREATE INDEX IF NOT EXISTS idx_appt_slots_lookup ON appointment_slots(doctor_id, date, status);

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

CREATE TABLE IF NOT EXISTS appointment_audit_logs (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
  booking_reference TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL DEFAULT 'patient',
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointment_audit_ref ON appointment_audit_logs(booking_reference);

CREATE TABLE IF NOT EXISTS appointment_faqs (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- ============================================================================
-- Section 8.A: User and Patient Management Normalized Schema Blueprint
-- ============================================================================

-- 1. users: id, email, phone, password_hash, status
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_verification', 'suspended', 'deactivated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 2. patients: id, user_id, patient_number, first_name, last_name, dob
-- (Note: patients.id is text/UUID/MRN compatible to support hospital EMR systems)
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  patient_number TEXT UNIQUE, -- Unique MRN (e.g., MRN-2026-XXXX)
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  dob DATE,
  gender TEXT DEFAULT '',
  blood_group TEXT DEFAULT '',
  insurance_provider TEXT DEFAULT '',
  insurance_policy_no TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all Section 8.A fields exist if table was previously created
ALTER TABLE patients ALTER COLUMN full_name DROP NOT NULL;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS patient_number TEXT UNIQUE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS first_name TEXT DEFAULT '';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_name TEXT DEFAULT '';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS insurance_provider TEXT DEFAULT '';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS insurance_policy_no TEXT DEFAULT '';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_number ON patients(patient_number);
CREATE INDEX IF NOT EXISTS idx_patients_names ON patients(LOWER(last_name), LOWER(first_name));

-- 3. patient_addresses: id, patient_id, address, city, state, postal_code
CREATE TABLE IF NOT EXISTS patient_addresses (
  id SERIAL PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_addresses_patient ON patient_addresses(patient_id);

-- 4. patient_contacts: id, patient_id, contact_name, relationship, phone
CREATE TABLE IF NOT EXISTS patient_contacts (
  id SERIAL PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_emergency BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_contacts_patient ON patient_contacts(patient_id);

-- 5. email_verifications: id, user_id, token_hash, expires_at
CREATE TABLE IF NOT EXISTS email_verifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verif_user ON email_verifications(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verif_token ON email_verifications(token_hash);

-- 6. password_resets: id, user_id, token_hash, expires_at
CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pwd_resets_user ON password_resets(user_id, used, expires_at);
CREATE INDEX IF NOT EXISTS idx_pwd_resets_hash ON password_resets(token_hash);

-- 7. user_sessions: id, user_id, expires_at
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash);

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

CREATE TABLE IF NOT EXISTS patient_otp_verifications (
  id SERIAL PRIMARY KEY,
  identifier TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_otp_ident ON patient_otp_verifications(identifier, used, expires_at);

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
