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
  patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  slot_id INTEGER REFERENCES appointment_slots(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure Section 8.D fields exist if appointments table already existed
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS slot_id INTEGER REFERENCES appointment_slots(id) ON DELETE SET NULL;

-- ============================================================================
-- Section 8.D: Appointments Normalized Relational Blueprint
-- ============================================================================

-- 1. appointment_types: id, name, description
CREATE TABLE IF NOT EXISTS appointment_types (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  default_duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. appointment_status_history: id, appointment_id, old_status, new_status
CREATE TABLE IF NOT EXISTS appointment_status_history (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL DEFAULT 'Patient / System',
  reason TEXT DEFAULT '',
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appt_status_hist ON appointment_status_history(appointment_id, changed_at DESC);

-- 3. appointment_payments: id, appointment_id, amount, payment_status
CREATE TABLE IF NOT EXISTS appointment_payments (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'waived', 'failed')),
  currency TEXT NOT NULL DEFAULT 'USD',
  transaction_ref TEXT DEFAULT '',
  payment_method TEXT DEFAULT '',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appt_payments_appt ON appointment_payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appt_payments_status ON appointment_payments(payment_status);

-- 4. appointment_cancellations: id, appointment_id, reason, cancelled_at
CREATE TABLE IF NOT EXISTS appointment_cancellations (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  cancelled_by TEXT NOT NULL DEFAULT 'Patient',
  cancelled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  refund_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  refund_status TEXT DEFAULT 'not_applicable' CHECK (refund_status IN ('not_applicable', 'pending', 'processed', 'declined')),
  audit_logged BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_appt_cancellations_appt ON appointment_cancellations(appointment_id);

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

-- ============================================================================
-- Section 8.E: Patient Health Information Normalized Relational Blueprint
-- ============================================================================

-- 1. medical_records: id, patient_id, record_type, record_date
CREATE TABLE IF NOT EXISTS medical_records (
  id SERIAL PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL, -- 'Diagnosis', 'Surgery', 'Immunization', 'Allergy', 'Discharge Summary'
  record_date DATE NOT NULL,
  title TEXT NOT NULL,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
  doctor_name TEXT DEFAULT '',
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  department_name TEXT DEFAULT '',
  summary TEXT NOT NULL,
  clinical_notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Resolved', 'Historical', 'Inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id, record_date DESC);
CREATE INDEX IF NOT EXISTS idx_medical_records_type ON medical_records(record_type);

-- 2. prescriptions: id, patient_id, doctor_id, prescribed_at
CREATE TABLE IF NOT EXISTS prescriptions (
  id SERIAL PRIMARY KEY,
  prescription_number TEXT UNIQUE,
  patient_id INTEGER, -- Legacy / patient_accounts FK
  patient_uuid TEXT REFERENCES patients(id) ON DELETE SET NULL, -- Section 8.E normalized patient FK
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
  doctor_name TEXT DEFAULT '',
  prescribed_at TIMESTAMPTZ DEFAULT NOW(),
  diagnosis TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  refills_allowed INTEGER NOT NULL DEFAULT 0,
  refills_remaining INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all Section 8.E columns exist if prescriptions table already existed
ALTER TABLE prescriptions ALTER COLUMN medication_name DROP NOT NULL;
ALTER TABLE prescriptions ALTER COLUMN dosage DROP NOT NULL;
ALTER TABLE prescriptions ALTER COLUMN frequency DROP NOT NULL;
ALTER TABLE prescriptions ALTER COLUMN duration DROP NOT NULL;
ALTER TABLE prescriptions ALTER COLUMN prescribed_by DROP NOT NULL;
ALTER TABLE prescriptions ALTER COLUMN prescribed_date DROP NOT NULL;
ALTER TABLE prescriptions ALTER COLUMN instructions DROP NOT NULL;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS prescription_number TEXT UNIQUE;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS patient_uuid TEXT REFERENCES patients(id) ON DELETE SET NULL;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS doctor_name TEXT DEFAULT '';
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS prescribed_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS diagnosis TEXT DEFAULT '';
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS refills_allowed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);

-- 3. prescription_items: id, prescription_id, medicine_name, dosage
CREATE TABLE IF NOT EXISTS prescription_items (
  id SERIAL PRIMARY KEY,
  prescription_id INTEGER NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL, -- e.g., 'Once daily with morning meal'
  duration TEXT NOT NULL,  -- e.g., '90 days'
  instructions TEXT DEFAULT '',
  route TEXT DEFAULT 'Oral',
  is_substitution_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescription_items_rx ON prescription_items(prescription_id);

-- 4. lab_reports: id, patient_id, test_name, report_file
CREATE TABLE IF NOT EXISTS lab_reports (
  id SERIAL PRIMARY KEY,
  report_code TEXT UNIQUE,
  patient_id TEXT,
  test_name TEXT,
  category TEXT DEFAULT 'Clinical Pathology',
  report_file TEXT DEFAULT '', -- Path/URL to authorized laboratory PDF/document
  specimen_type TEXT DEFAULT 'Blood',
  collected_date DATE,
  released_date TIMESTAMPTZ,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
  ordered_by TEXT DEFAULT '',
  pathologist_name TEXT DEFAULT 'Dr. Eleanor Vance, MD (Laboratory Director)',
  status TEXT NOT NULL DEFAULT 'Finalized',
  results_summary TEXT DEFAULT '',
  results_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all Section 8.E columns exist if lab_reports table already existed
ALTER TABLE lab_reports ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE lab_reports ALTER COLUMN request_id DROP NOT NULL;
ALTER TABLE lab_reports ALTER COLUMN patient_name DROP NOT NULL;
ALTER TABLE lab_reports ALTER COLUMN referring_doctor DROP NOT NULL;
ALTER TABLE lab_reports ALTER COLUMN verified_by DROP NOT NULL;
ALTER TABLE lab_reports ALTER COLUMN generated_by DROP NOT NULL;
ALTER TABLE lab_reports ALTER COLUMN report_snapshot DROP NOT NULL;
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS report_code TEXT UNIQUE;
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS test_name TEXT DEFAULT 'Diagnostic Lab Test';
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Clinical Pathology';
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS report_file TEXT DEFAULT '';
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS specimen_type TEXT DEFAULT 'Blood';
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS collected_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS released_date TIMESTAMPTZ;
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL;
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS ordered_by TEXT DEFAULT '';
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS pathologist_name TEXT DEFAULT 'Dr. Eleanor Vance, MD (Laboratory Director)';
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Finalized';
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS results_summary TEXT DEFAULT '';
ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS results_json JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_lab_reports_patient ON lab_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_reports_status ON lab_reports(status);

-- 5. radiology_reports: id, patient_id, study_type, report_file
CREATE TABLE IF NOT EXISTS radiology_reports (
  id SERIAL PRIMARY KEY,
  study_code TEXT UNIQUE,
  patient_id TEXT,
  study_type TEXT, -- e.g., '3T MRI', '256-Slice CT', 'Ultrasound', 'Digital X-Ray'
  report_file TEXT DEFAULT '', -- Path/URL to authorized radiology report / DICOM preview
  study_name TEXT DEFAULT '',
  study_date DATE DEFAULT CURRENT_DATE,
  radiologist_name TEXT DEFAULT '',
  findings TEXT DEFAULT '',
  impression TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Finalized',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all Section 8.E columns exist if radiology_reports table already existed
ALTER TABLE radiology_reports ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE radiology_reports ALTER COLUMN request_id DROP NOT NULL;
ALTER TABLE radiology_reports ALTER COLUMN examination_id DROP NOT NULL;
ALTER TABLE radiology_reports ALTER COLUMN patient_name DROP NOT NULL;
ALTER TABLE radiology_reports ALTER COLUMN modality DROP NOT NULL;
ALTER TABLE radiology_reports ALTER COLUMN exam_type DROP NOT NULL;
ALTER TABLE radiology_reports ALTER COLUMN body_region DROP NOT NULL;
ALTER TABLE radiology_reports ALTER COLUMN referring_doctor DROP NOT NULL;
ALTER TABLE radiology_reports ALTER COLUMN image_ids DROP NOT NULL;
ALTER TABLE radiology_reports ALTER COLUMN findings DROP NOT NULL;
ALTER TABLE radiology_reports ALTER COLUMN observations DROP NOT NULL;
ALTER TABLE radiology_reports ALTER COLUMN impression DROP NOT NULL;
ALTER TABLE radiology_reports ALTER COLUMN conclusion DROP NOT NULL;
ALTER TABLE radiology_reports ALTER COLUMN radiologist_name DROP NOT NULL;
ALTER TABLE radiology_reports ALTER COLUMN status DROP NOT NULL;
ALTER TABLE radiology_reports ALTER COLUMN report_history DROP NOT NULL;
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS study_code TEXT UNIQUE;
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS study_type TEXT DEFAULT 'Diagnostic Radiology';
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS report_file TEXT DEFAULT '';
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS study_name TEXT DEFAULT '';
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS study_date DATE DEFAULT CURRENT_DATE;

CREATE INDEX IF NOT EXISTS idx_radiology_reports_patient ON radiology_reports(patient_id, study_date DESC);
CREATE INDEX IF NOT EXISTS idx_radiology_reports_study ON radiology_reports(study_type);

-- 6. patient_documents: id, patient_id, document_type, file_url
CREATE TABLE IF NOT EXISTS patient_documents (
  id SERIAL PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'Insurance Card', 'Government ID', 'Prior Hospital Summary', 'Consent Form'
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  mime_type TEXT DEFAULT 'application/pdf',
  file_size_bytes INTEGER DEFAULT 0,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_documents_patient ON patient_documents(patient_id);

-- 7. invoices: id, patient_id, invoice_number, amount, status
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  insurance_covered NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  patient_responsibility NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Unpaid' CHECK (status IN ('Unpaid', 'Paid', 'Partially_Paid', 'Claim_In_Process', 'Waived')),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL DEFAULT CURRENT_DATE + INTERVAL '30 days',
  payment_method TEXT DEFAULT '',
  payment_reference TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- 8. invoice_items: id, invoice_id, description, amount
CREATE TABLE IF NOT EXISTS invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  item_code TEXT DEFAULT '',
  department_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

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

-- ============================================================================
-- Section 8.F: Content and Support Normalized Blueprint
-- ============================================================================

-- 1. blog_categories: id, name, slug
CREATE TABLE IF NOT EXISTS blog_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);

-- 2. blog_articles: id, title, slug, content, author, status
CREATE TABLE IF NOT EXISTS blog_articles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  author_title TEXT DEFAULT '',
  author_doctor_slug TEXT REFERENCES doctors(slug) ON DELETE SET NULL,
  category_id INTEGER REFERENCES blog_categories(id) ON DELETE SET NULL,
  category_slug TEXT DEFAULT '',
  excerpt TEXT DEFAULT '',
  read_minutes INTEGER NOT NULL DEFAULT 5,
  tags TEXT[] NOT NULL DEFAULT '{}',
  key_takeaways TEXT[] NOT NULL DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_articles_slug ON blog_articles(slug);
CREATE INDEX IF NOT EXISTS idx_blog_articles_status ON blog_articles(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_articles_category ON blog_articles(category_id);

-- 3. health_packages: id, name, description, price, status
-- (Ensure health_packages has all required Section 8.F columns)
CREATE TABLE IF NOT EXISTS health_packages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT 'General Health',
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  original_price NUMERIC(10, 2),
  duration TEXT NOT NULL DEFAULT 'Half Day (3-4 hours)',
  fasting_required BOOLEAN NOT NULL DEFAULT TRUE,
  target_audience TEXT NOT NULL DEFAULT 'Adults 18+',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all Section 8.F columns exist if health_packages was already created
ALTER TABLE health_packages ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'));
ALTER TABLE health_packages ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE health_packages ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE health_packages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_health_packages_status ON health_packages(status);
CREATE INDEX IF NOT EXISTS idx_health_packages_slug ON health_packages(slug);

-- 4. health_package_tests: id, package_id, test_name
CREATE TABLE IF NOT EXISTS health_package_tests (
  id SERIAL PRIMARY KEY,
  package_id INTEGER NOT NULL REFERENCES health_packages(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  category TEXT DEFAULT 'Diagnostic Investigation',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_package_tests_package ON health_package_tests(package_id);

-- 5. insurance_providers: id, name, description, status
CREATE TABLE IF NOT EXISTS insurance_providers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  category TEXT NOT NULL DEFAULT 'Private Health Insurer',
  description TEXT NOT NULL DEFAULT '',
  network_tier TEXT NOT NULL DEFAULT 'Preferred In-Network Tier 1',
  cashless_available BOOLEAN NOT NULL DEFAULT TRUE,
  preauth_turnaround TEXT NOT NULL DEFAULT '2-4 hours',
  co_pay_percentage TEXT NOT NULL DEFAULT '0% - 10%',
  helpline TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending_renewal')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all Section 8.F columns exist if insurance_providers was already created
ALTER TABLE insurance_providers ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending_renewal'));
ALTER TABLE insurance_providers ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE insurance_providers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_insurance_providers_status ON insurance_providers(status);

-- 6. faqs: id, question, answer, category
CREATE TABLE IF NOT EXISTS faqs (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category, display_order);

-- 7. enquiries: id, name, email, subject, message, status
CREATE TABLE IF NOT EXISTS enquiries (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  department TEXT DEFAULT 'General Enquiries',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  assigned_to TEXT DEFAULT '',
  resolution_notes TEXT DEFAULT '',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_email ON enquiries(LOWER(email));

-- 8. feedback: id, patient_id, rating, message
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL,
  patient_account_id INTEGER REFERENCES patient_accounts(id) ON DELETE SET NULL,
  patient_name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  department_visited TEXT DEFAULT '',
  doctor_care_rating INTEGER DEFAULT 5,
  cleanliness_rating INTEGER DEFAULT 5,
  staff_courtesy_rating INTEGER DEFAULT 5,
  would_recommend BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'reviewed' CHECK (status IN ('submitted', 'reviewed', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_patient ON feedback(patient_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);

-- 9. notifications: id, user_id, title, message, read_at
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  patient_account_id INTEGER REFERENCES patient_accounts(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'System',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_href TEXT DEFAULT '',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_patient ON notifications(patient_id, read_at);

-- 10. audit_logs: id, user_id, action, entity_type, entity_id, created_at
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL,
  patient_account_id INTEGER REFERENCES patient_accounts(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all Section 8.F audit_logs columns exist
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_type TEXT NOT NULL DEFAULT 'clinical_record';
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_id TEXT NOT NULL DEFAULT 'system';

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_patient ON audit_logs(patient_id, created_at DESC);

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
