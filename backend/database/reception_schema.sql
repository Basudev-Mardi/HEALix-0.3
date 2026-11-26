-- ============================================================================
-- Healix Reception Portal - Relational Schema Foundation
-- ============================================================================

BEGIN;

-- 1. Entity: users (Existing authentication structure supporting receptionist and staff accounts)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'patient';
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Entity: patients (Demographics, clinical flags, emergency contacts, medical record number)
ALTER TABLE patients ALTER COLUMN email DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN blood_group DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN allergies DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN emergency_contact_name DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN emergency_contact_phone DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN date_of_birth DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN is_unknown DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN distinguishing_marks DROP NOT NULL;

ALTER TABLE patients ADD COLUMN IF NOT EXISTS patient_id TEXT;
UPDATE patients SET patient_id = id WHERE patient_id IS NULL;
ALTER TABLE patients ALTER COLUMN patient_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);

ALTER TABLE patients ADD COLUMN IF NOT EXISTS full_name TEXT;
UPDATE patients SET full_name = TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))
WHERE full_name IS NULL OR full_name = '';

ALTER TABLE patients ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT '';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS mobile TEXT DEFAULT '';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_group TEXT DEFAULT '';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT '{}';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact TEXT DEFAULT '';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS registration_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE patients ADD COLUMN IF NOT EXISTS photo TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_patients_mobile ON patients(mobile);
CREATE INDEX IF NOT EXISTS idx_patients_reg_date ON patients(registration_date DESC);

-- 3. Entity: departments (Department reference entity)
ALTER TABLE departments ADD COLUMN IF NOT EXISTS department_id INTEGER;
UPDATE departments SET department_id = id WHERE department_id IS NULL;

ALTER TABLE departments ADD COLUMN IF NOT EXISTS department_name TEXT;
UPDATE departments SET department_name = name WHERE department_name IS NULL OR department_name = '';

ALTER TABLE departments ADD COLUMN IF NOT EXISTS token_prefix TEXT DEFAULT 'G';
UPDATE departments SET token_prefix = 'C' WHERE id = 1 OR slug = 'cardiology';
UPDATE departments SET token_prefix = 'N' WHERE id = 2 OR slug = 'neurology';
UPDATE departments SET token_prefix = 'O' WHERE id = 3 OR slug = 'orthopedics';
UPDATE departments SET token_prefix = 'ON' WHERE id = 4 OR slug = 'oncology';
UPDATE departments SET token_prefix = 'P' WHERE id = 5 OR slug = 'pediatrics';
UPDATE departments SET token_prefix = 'E' WHERE id = 6 OR slug = 'emergency';

CREATE INDEX IF NOT EXISTS idx_departments_dept_id ON departments(department_id);

-- 4. Entity: doctors (Staff doctors with availability and department linkage)
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS doctor_id INTEGER;
UPDATE doctors SET doctor_id = id WHERE doctor_id IS NULL;

ALTER TABLE doctors ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'Available';

CREATE INDEX IF NOT EXISTS idx_doctors_doctor_id ON doctors(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_availability ON doctors(availability_status);

-- 5. Entity: doctor_schedules (Roster, schedules, timings, and breaks)
ALTER TABLE doctor_schedules ADD COLUMN IF NOT EXISTS schedule_date DATE;
ALTER TABLE doctor_schedules ADD COLUMN IF NOT EXISTS break_time TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doc_date ON doctor_schedules(doctor_id, schedule_date);

-- 6. Entity: appointments (Appointments linking patient, doctor, and department)
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_id TEXT;
UPDATE appointments SET appointment_id = booking_reference WHERE appointment_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_appt_id ON appointments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_dept ON appointments(department_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments(appointment_date, status);

-- 7. Entity: visits (Encounters - One patient can have multiple visits)
CREATE TABLE IF NOT EXISTS visits (
  visit_id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  visit_type TEXT NOT NULL DEFAULT 'OPD Consultation' CHECK (visit_type IN ('OPD Consultation', 'Follow-up', 'Emergency', 'Walk-in', 'Diagnostics', 'Specialist')),
  status TEXT NOT NULL DEFAULT 'Registered' CHECK (status IN ('Registered', 'In-Queue', 'Now Serving', 'Consulting', 'With Doctor', 'Completed', 'Cancelled', 'Admitted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_doctor_date ON visits(doctor_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_dept_date ON visits(department_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_date_status ON visits(visit_date, status);

-- 8. Entity: tokens (Queue Tokens - Each visit can have its own token)
CREATE TABLE IF NOT EXISTS tokens (
  token_id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL REFERENCES visits(visit_id) ON DELETE CASCADE,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  token_number INTEGER NOT NULL,
  queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Waiting' CHECK (status IN ('Waiting', 'Now Serving', 'Consulting', 'Completed', 'Cancelled', 'Called', 'In-Consultation', 'Skipped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tokens_doctor_queue_number UNIQUE (doctor_id, queue_date, token_number)
);

CREATE INDEX IF NOT EXISTS idx_tokens_visit ON tokens(visit_id);
CREATE INDEX IF NOT EXISTS idx_tokens_doctor_date_status ON tokens(doctor_id, queue_date, status);
CREATE INDEX IF NOT EXISTS idx_tokens_dept_date ON tokens(department_id, queue_date);

ALTER TABLE tokens ADD COLUMN IF NOT EXISTS token_display TEXT;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Standard';
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS called_at TIMESTAMPTZ;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS consultation_start_at TIMESTAMPTZ;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS consultation_end_at TIMESTAMPTZ;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

UPDATE tokens t
SET token_display = CONCAT(COALESCE(d.token_prefix, 'G'), '-', LPAD(t.token_number::text, 3, '0'))
FROM departments d
WHERE d.id = t.department_id AND (t.token_display IS NULL OR t.token_display = '');

CREATE INDEX IF NOT EXISTS idx_tokens_display ON tokens(token_display);
CREATE INDEX IF NOT EXISTS idx_tokens_patient ON tokens(patient_id);

-- 9. Entity: payments (Payments - Each visit can have its own payments)
CREATE TABLE IF NOT EXISTS payments (
  payment_id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL REFERENCES visits(visit_id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL DEFAULT 'Consultation Fee' CHECK (fee_type IN ('Consultation Fee', 'Registration Fee', 'Diagnostic Fee', 'Emergency Surcharge', 'Pharmacy Fee', 'Procedure Fee')),
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0),
  payment_method TEXT NOT NULL DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'Card', 'UPI', 'Insurance', 'NetBanking')),
  payment_status TEXT NOT NULL DEFAULT 'Completed' CHECK (payment_status IN ('Pending', 'Completed', 'Refunded', 'Failed')),
  transaction_reference TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_visit ON payments(visit_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_tx_ref ON payments(transaction_reference);

-- 10. Entity: audit_logs (Audit Trail - User, action, entity, entity_id, timestamp)
ALTER TABLE audit_logs ALTER COLUMN entity_type DROP NOT NULL;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity TEXT;
UPDATE audit_logs SET entity = entity_type WHERE entity IS NULL;
UPDATE audit_logs SET entity_type = entity WHERE entity_type IS NULL;

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();
UPDATE audit_logs SET timestamp = created_at WHERE timestamp IS NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_ts ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_lookup ON audit_logs(entity, entity_id);

COMMIT;
