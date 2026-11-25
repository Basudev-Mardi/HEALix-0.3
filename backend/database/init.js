import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { hashPassword } from '../src/utils/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Missing DATABASE_URL_UNPOOLED or DATABASE_URL in backend/.env');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function seedDemoPatient(db) {
  await db.query(`
    TRUNCATE TABLE
      user_sessions,
      password_resets,
      email_verifications,
      patient_contacts,
      patient_addresses,
      patients,
      users,
      portal_notifications,
      patient_billing_records,
      patient_radiology_reports,
      patient_lab_reports,
      patient_prescriptions,
      patient_medical_history,
      password_reset_tokens,
      patient_sessions,
      patient_accounts
    RESTART IDENTITY CASCADE;
  `);

  const demoPasswordHash = hashPassword('Healix2026!');

  // Seed Section 8.A Normalized User & Patient
  const userRes = await db.query(
    `INSERT INTO users (email, phone, password_hash, status)
     VALUES ('clara.vance@example.com', '+1 (617) 555-0148', $1, 'active')
     RETURNING id`,
    [demoPasswordHash]
  );
  const userId = userRes.rows[0].id;

  const normalizedPatientRes = await db.query(
    `INSERT INTO patients (id, user_id, patient_number, first_name, last_name, full_name, dob, gender, blood_group, insurance_provider, insurance_policy_no)
     VALUES ('HX-PT-402819', $1, 'HX-MRN-402819', 'Clara', 'Vance', 'Clara Vance', '1984-06-14', 'Female', 'O+', 'Blue Cross Blue Shield', 'BCBS-MA-8849201')
     ON CONFLICT (id) DO UPDATE SET
       user_id = EXCLUDED.user_id,
       patient_number = EXCLUDED.patient_number,
       first_name = EXCLUDED.first_name,
       last_name = EXCLUDED.last_name,
       full_name = EXCLUDED.full_name
     RETURNING id`,
    [userId]
  );
  const normalizedPatientId = normalizedPatientRes.rows[0].id;

  await db.query(
    `INSERT INTO patient_addresses (patient_id, address, city, state, postal_code, is_primary)
     VALUES ($1, '214 Commonwealth Ave, Apt 4B', 'Boston', 'MA', '02116', TRUE)`,
    [normalizedPatientId]
  );

  await db.query(
    `INSERT INTO patient_contacts (patient_id, contact_name, relationship, phone, is_emergency)
     VALUES ($1, 'Arthur Vance', 'Spouse', '+1 (617) 555-0190', TRUE)`,
    [normalizedPatientId]
  );

  const patientRes = await db.query(
    `INSERT INTO patient_accounts (
      mrn, full_name, email, password_hash, phone, date_of_birth, gender, blood_group,
      address, emergency_contact_name, emergency_contact_phone,
      insurance_provider, insurance_policy_no, allergies
    ) VALUES (
      'HX-MRN-402819', 'Clara Vance', 'clara.vance@example.com', $1,
      '+1 (617) 555-0148', '1984-06-14', 'Female', 'O+',
      '214 Commonwealth Ave, Apt 4B, Boston, MA 02116',
      'Arthur Vance (Spouse)', '+1 (617) 555-0190',
      'Blue Cross Blue Shield', 'BCBS-MA-8849201',
      ARRAY['Penicillin (Mild Rash)', 'Seasonal Ragweed Pollen']
    ) RETURNING id`,
    [demoPasswordHash]
  );

  const patientId = patientRes.rows[0].id;

  await db.query(
    `INSERT INTO patient_medical_history (patient_id, record_type, title, recorded_date, doctor_name, department_name, status, summary) VALUES
    ($1, 'Diagnosis', 'Mild Essential Hypertension', '2024-03-18', 'Dr. Aris Thorne', 'Cardiology & Heart Institute', 'Managed', 'Well-controlled on low-dose morning ACE inhibitor and Mediterranean dietary protocol. Home BP averages 118/74 mmHg.'),
    ($1, 'Procedure', 'Preventive Coronary Calcium Scoring', '2025-09-12', 'Dr. Aris Thorne', 'Cardiology & Heart Institute', 'Completed', 'Agatston score 0. No calcified atherosclerotic plaque detected across major coronary vessels.'),
    ($1, 'Immunization', 'Seasonal Quadrivalent Influenza Vaccine', '2025-10-22', 'Healix Preventive Clinic', 'Outpatient Services', 'Up to Date', 'Administered left deltoid; no adverse reaction observed.'),
    ($1, 'Allergy', 'Penicillin Sensitivity', '2018-07-04', 'Dr. Priya Natarajan', 'Internal Medicine', 'Active Alert', 'Documented mild maculopapular rash; cephalosporins and macrolides tolerated safely.')`,
    [patientId]
  );

  await db.query(
    `INSERT INTO patient_prescriptions (patient_id, medication_name, dosage, frequency, duration, prescribed_by, prescribed_date, status, refills_remaining, instructions) VALUES
    ($1, 'Lisinopril', '10 mg Tablet', 'Once daily (morning)', 'Ongoing Maintenance', 'Dr. Aris Thorne', '2026-09-01', 'Active', 3, 'Take with water at the same time each morning. Monitor blood pressure twice weekly.'),
    ($1, 'Rosuvastatin', '5 mg Tablet', 'Once daily (evening)', 'Ongoing Maintenance', 'Dr. Aris Thorne', '2026-09-01', 'Active', 2, 'Take in the evening with or without food. Follow-up lipid panel in 6 months.'),
    ($1, 'Vitamin D3 (Cholecalciferol)', '2000 IU Softgel', 'Once daily with meal', '90 Days', 'Dr. Claire Beaumont', '2026-10-10', 'Active', 1, 'Take alongside your largest meal for optimal absorption.'),
    ($1, 'Sumatriptan', '50 mg Tablet', 'As needed for acute migraine', 'Completed', 'Dr. Mei-Ling Chen', '2026-04-15', 'Completed', 0, 'Take at onset of migraine aura. Do not exceed 200 mg in 24 hours.')`,
    [patientId]
  );

  await db.query(
    `INSERT INTO patient_lab_reports (patient_id, report_code, test_name, category, collected_date, ordered_by, status, summary, results_json) VALUES
    (
      $1, 'LAB-2026-8821', 'Comprehensive Lipid & ApoB Panel', 'Cardiology Diagnostics', '2026-11-04', 'Dr. Aris Thorne', 'Finalized',
      'All lipid parameters are within optimal cardiovascular risk thresholds.',
      '[
        {"parameter": "Total Cholesterol", "value": "172", "unit": "mg/dL", "reference": "< 200", "flag": "Normal"},
        {"parameter": "LDL Cholesterol", "value": "84", "unit": "mg/dL", "reference": "< 100", "flag": "Normal"},
        {"parameter": "HDL Cholesterol", "value": "68", "unit": "mg/dL", "reference": "> 50", "flag": "Optimal"},
        {"parameter": "Triglycerides", "value": "96", "unit": "mg/dL", "reference": "< 150", "flag": "Normal"},
        {"parameter": "Apolipoprotein B (ApoB)", "value": "74", "unit": "mg/dL", "reference": "< 90", "flag": "Optimal"}
      ]'::jsonb
    ),
    (
      $1, 'LAB-2026-7940', 'Complete Blood Count (CBC) & Metabolic Panel', 'Routine Pathology', '2026-10-12', 'Dr. Aris Thorne', 'Finalized',
      'Hemoglobin, white cell differential, renal function, and fasting glucose are completely normal.',
      '[
        {"parameter": "Hemoglobin", "value": "13.6", "unit": "g/dL", "reference": "12.0 – 15.5", "flag": "Normal"},
        {"parameter": "WBC Count", "value": "6.1", "unit": "K/uL", "reference": "4.5 – 11.0", "flag": "Normal"},
        {"parameter": "Fasting Glucose", "value": "88", "unit": "mg/dL", "reference": "70 – 99", "flag": "Normal"},
        {"parameter": "HbA1c", "value": "5.2", "unit": "%", "reference": "< 5.7", "flag": "Normal"},
        {"parameter": "eGFR (Kidney)", "value": ">90", "unit": "mL/min", "reference": "> 60", "flag": "Normal"}
      ]'::jsonb
    ),
    (
      $1, 'LAB-2026-6512', 'Thyroid Function Panel (TSH & Free T4)', 'Endocrinology', '2026-08-19', 'Dr. Claire Beaumont', 'Finalized',
      'Euthyroid profile with normal pituitary-thyroid axis.',
      '[
        {"parameter": "TSH", "value": "1.85", "unit": "mIU/L", "reference": "0.40 – 4.00", "flag": "Normal"},
        {"parameter": "Free T4", "value": "1.24", "unit": "ng/dL", "reference": "0.80 – 1.80", "flag": "Normal"}
      ]'::jsonb
    )`,
    [patientId]
  );

  await db.query(
    `INSERT INTO patient_radiology_reports (patient_id, study_code, modality, study_name, study_date, radiologist_name, status, findings, impression) VALUES
    (
      $1, 'RAD-2026-3410', '256-Slice CT', 'Coronary Artery Calcium (CAC) Score', '2026-09-12', 'Dr. Elena Rostova, MD', 'Finalized',
      'Non-contrast ECG-gated cardiac CT demonstrates zero calcified plaque in the left main, LAD, circumflex, and right coronary arteries. Pericardium and visualized thoracic aorta are unremarkable.',
      'Total Agatston Score: 0 (No identifiable atherosclerotic plaque; very low 10-year coronary event risk).'
    ),
    (
      $1, 'RAD-2026-2904', 'Echocardiogram', 'Transthoracic Echocardiogram (TTE)', '2026-07-28', 'Dr. Aris Thorne, MD', 'Finalized',
      'Normal left ventricular cavity size and wall thickness. Preserved systolic function with LVEF 64%. Normal valvular morphology without significant stenosis or regurgitation.',
      'Normal resting transthoracic echocardiogram with LVEF 64%.'
    )`,
    [patientId]
  );

  await db.query(
    `INSERT INTO patient_billing_records (patient_id, invoice_number, service_description, department_name, billing_date, due_date, amount_total, insurance_covered, patient_responsibility, status, payment_method) VALUES
    ($1, 'INV-2026-4410', 'Comprehensive Lipid & ApoB Panel', 'Automated Pathology Lab', '2026-11-05', '2026-12-05', 320.00, 275.00, 45.00, 'Unpaid', ''),
    ($1, 'INV-2026-3982', 'Outpatient Cardiology Follow-Up (Dr. Aris Thorne)', 'Cardiology & Heart Institute', '2026-10-12', '2026-11-12', 220.00, 180.00, 40.00, 'Paid', 'Visa •••• 4242'),
    ($1, 'INV-2026-3214', '256-Slice Coronary Calcium CT Scan', 'Radiology & Imaging Core', '2026-09-14', '2026-10-14', 650.00, 550.00, 100.00, 'Paid', 'HSA Card •••• 1890')`,
    [patientId]
  );

  await db.query(
    `INSERT INTO portal_notifications (patient_id, category, title, message, action_href, is_read) VALUES
    ($1, 'Lab Report', 'Lipid & ApoB Panel Finalized', 'Your November 4 laboratory results have been reviewed and signed off by Dr. Aris Thorne.', '/patient/lab-reports', FALSE),
    ($1, 'Appointment', 'Upcoming Cardiology Consultation', 'Reminder: You have a confirmed in-person visit with Dr. Aris Thorne (Ref: HX-2026-1042).', '/patient/appointments', FALSE),
    ($1, 'Billing', 'New Statement Ready ($45.00)', 'Invoice INV-2026-4410 for your pathology panel is available for review.', '/patient/billing', FALSE),
    ($1, 'Prescription', 'Refill Available — Lisinopril 10 mg', 'You have 3 refills remaining at the Healix 24/7 Clinical Pharmacy.', '/patient/prescriptions', TRUE)`,
    [patientId]
  );
}

async function run() {
  try {
    await client.connect();
    console.log('Connected to Neon PostgreSQL (direct).');

    const schemaSql = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schemaSql);
    console.log('Schema applied successfully.');

    const seedSql = await fs.readFile(path.join(__dirname, 'seed.sql'), 'utf8');
    await client.query(seedSql);
    console.log('Public & appointment seed data applied successfully.');

    await seedDemoPatient(client);
    console.log('Demo patient account & clinical records seeded (clara.vance@example.com / Healix2026!).');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
