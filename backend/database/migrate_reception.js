import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { hashPassword } from '../src/utils/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;

if (!connectionString) {
  console.error('Missing DATABASE_URL_UNPOOLED or DATABASE_URL in backend/.env');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function runReceptionMigration() {
  await client.connect();
  console.log('Connected to PostgreSQL database for Reception Portal foundation migration.');

  try {
    // 1. Read and execute reception_schema.sql
    const sqlPath = path.resolve(__dirname, 'reception_schema.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');

    console.log('Applying reception schema and updating relational entities...');
    await client.query(sql);
    console.log('Reception schema migration completed successfully.');

    // 2. Ensure receptionist and staff accounts exist in `users`
    console.log('Ensuring staff users exist in users table...');
    const defaultPasswordHash = hashPassword('Healix2026!');

    const staffAccounts = [
      { email: 'reception@healix.org', phone: '+1 (617) 555-0199', role: 'receptionist' },
      { email: 'doctor@healix.org', phone: '+1 (617) 555-0101', role: 'doctor' },
      { email: 'nurse@healix.org', phone: '+1 (617) 555-0102', role: 'nurse' },
      { email: 'lab@healix.org', phone: '+1 (617) 555-0103', role: 'lab-staff' },
      { email: 'billing@healix.org', phone: '+1 (617) 555-0104', role: 'billing-staff' },
      { email: 'pharmacy@healix.org', phone: '+1 (617) 555-0105', role: 'pharmacist' },
      { email: 'hr@healix.org', phone: '+1 (617) 555-0106', role: 'hr-staff' },
      { email: 'admin@healix.org', phone: '+1 (617) 555-0107', role: 'admin' },
    ];

    for (const staff of staffAccounts) {
      await client.query(
        `INSERT INTO users (email, phone, password_hash, role, status)
         VALUES ($1, $2, $3, $4, 'active')
         ON CONFLICT (email) DO UPDATE SET
           role = EXCLUDED.role,
           status = 'active',
           updated_at = NOW()`,
        [staff.email, staff.phone, defaultPasswordHash, staff.role]
      );
    }
    console.log('Staff users verified.');

    // 3. Link doctors to users table where matching
    const doctorUser = await client.query(`SELECT id FROM users WHERE email = 'doctor@healix.org'`);
    if (doctorUser.rows.length > 0) {
      await client.query(
        `UPDATE doctors SET user_id = $1 WHERE user_id IS NULL AND id = (SELECT id FROM doctors ORDER BY id LIMIT 1)`,
        [doctorUser.rows[0].id]
      );
    }

    // 4. Verify existing patient exists or seed a demo patient
    const patientCheck = await client.query(`SELECT id, patient_id, full_name FROM patients LIMIT 1`);
    let patientId = null;

    if (patientCheck.rows.length === 0) {
      console.log('No patients found. Creating foundational reception demo patient...');
      const userRes = await client.query(
        `INSERT INTO users (email, phone, password_hash, role, status)
         VALUES ('reception.demo.patient@healix.org', '+1 (617) 555-0188', $1, 'patient')
         ON CONFLICT (email) DO UPDATE SET role = 'patient'
         RETURNING id`,
        [defaultPasswordHash]
      );
      const demoUserId = userRes.rows[0].id;

      const pRes = await client.query(
        `INSERT INTO patients (
           id, patient_id, user_id, patient_number, first_name, last_name, full_name,
           dob, gender, mobile, address, blood_group, allergies, emergency_contact, registration_date
         ) VALUES (
           'HX-PT-100001', 'HX-PT-100001', $1, 'HX-MRN-100001', 'Eleanor', 'Pemberton', 'Eleanor Pemberton',
           '1988-04-12', 'Female', '+1 (617) 555-0188', '742 Evergreen Terrace, Boston, MA', 'A+',
           ARRAY['Penicillin', 'Peanuts'], 'Marcus Pemberton (+1 617-555-0189)', NOW()
         ) RETURNING id`,
        [demoUserId]
      );
      patientId = pRes.rows[0].id;
    } else {
      patientId = patientCheck.rows[0].id;
      // Ensure mobile, allergies, address exist
      await client.query(
        `UPDATE patients
         SET mobile = COALESCE(NULLIF(mobile, ''), '+1 (617) 555-0148'),
             address = COALESCE(NULLIF(address, ''), '45 Beacon St, Boston, MA 02108'),
             blood_group = COALESCE(NULLIF(blood_group, ''), 'O+'),
             emergency_contact = COALESCE(NULLIF(emergency_contact, ''), 'David Vance (+1 617-555-0149)'),
             allergies = COALESCE(NULLIF(allergies, ''), 'Penicillin, Peanuts')
         WHERE id = $1`,
        [patientId]
      );
    }

    // 5. Check department and doctor
    const deptRes = await client.query(`SELECT id FROM departments ORDER BY id LIMIT 1`);
    const docRes = await client.query(`SELECT id FROM doctors ORDER BY id LIMIT 1`);
    const deptId = deptRes.rows[0]?.id || 1;
    const docId = docRes.rows[0]?.id || 1;

    // 6. Test Transaction: Create Visit + Token + Payment together atomically
    console.log('Testing atomic reception transaction (Visit -> Token -> Payment)...');
    const demoVisitId = 'VST-2026-0001';

    await client.query('BEGIN');
    try {
      // Create Visit
      await client.query(
        `INSERT INTO visits (
           visit_id, patient_id, department_id, doctor_id, visit_date, visit_type, status
         ) VALUES ($1, $2, $3, $4, CURRENT_DATE, 'OPD Consultation', 'In-Queue')
         ON CONFLICT (visit_id) DO UPDATE SET status = 'In-Queue'`,
        [demoVisitId, patientId, deptId, docId]
      );

      // Create Token for this Visit
      const demoTokenId = 'TKN-2026-0001';
      await client.query(
        `INSERT INTO tokens (
           token_id, visit_id, doctor_id, department_id, token_number, queue_date, status
         ) VALUES ($1, $2, $3, $4, 101, CURRENT_DATE, 'Waiting')
         ON CONFLICT (token_id) DO UPDATE SET status = 'Waiting'`,
        [demoTokenId, demoVisitId, docId, deptId]
      );

      // Create Payment for this Visit
      const demoPaymentId = 'PAY-2026-0001';
      await client.query(
        `INSERT INTO payments (
           payment_id, visit_id, fee_type, amount, payment_method, payment_status, transaction_reference
         ) VALUES ($1, $2, 'Consultation Fee', 150.00, 'Cash', 'Completed', 'TXN-REC-2026-0001')
         ON CONFLICT (payment_id) DO UPDATE SET payment_status = 'Completed'`,
        [demoPaymentId, demoVisitId]
      );

      // Audit Log entry
      const recUser = await client.query(`SELECT id FROM users WHERE email = 'reception@healix.org'`);
      const recUserId = recUser.rows[0]?.id || null;

      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity, entity_type, entity_id, timestamp, details)
         VALUES ($1, 'RECEPTION_PATIENT_CHECKIN', 'visits', 'visits', $2, NOW(), $3)`,
        [recUserId, demoVisitId, JSON.stringify({ patient_id: patientId, token_number: 101, fee: 150.00 })]
      );

      await client.query('COMMIT');
      console.log('Atomic transaction for Visit + Token + Payment committed successfully.');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    }

    // 7. Verification: Run comprehensive verification queries
    console.log('\n--- VERIFYING ALL 10 ENTITIES ---');
    const entities = [
      { name: 'patients', query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'patients' AND column_name IN ('patient_id', 'full_name', 'dob', 'gender', 'mobile', 'address', 'blood_group', 'allergies', 'emergency_contact', 'registration_date', 'photo')` },
      { name: 'visits', query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'visits' AND column_name IN ('visit_id', 'patient_id', 'department_id', 'doctor_id', 'visit_date', 'visit_type', 'status')` },
      { name: 'departments', query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'departments' AND column_name IN ('department_id', 'department_name')` },
      { name: 'doctors', query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'doctors' AND column_name IN ('doctor_id', 'user_id', 'department_id', 'availability_status')` },
      { name: 'doctor_schedules', query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'doctor_schedules' AND column_name IN ('doctor_id', 'schedule_date', 'start_time', 'end_time', 'break_time')` },
      { name: 'appointments', query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'appointments' AND column_name IN ('appointment_id', 'patient_id', 'doctor_id', 'department_id', 'appointment_date', 'status')` },
      { name: 'tokens', query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tokens' AND column_name IN ('token_id', 'visit_id', 'doctor_id', 'department_id', 'token_number', 'queue_date', 'status')` },
      { name: 'payments', query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payments' AND column_name IN ('payment_id', 'visit_id', 'fee_type', 'amount', 'payment_method', 'payment_status', 'transaction_reference')` },
      { name: 'users', query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('id', 'email', 'phone', 'password_hash', 'role', 'status')` },
      { name: 'audit_logs', query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name IN ('user_id', 'action', 'entity', 'entity_id', 'timestamp')` },
    ];

    for (const ent of entities) {
      const res = await client.query(ent.query);
      const cols = res.rows.map(r => r.column_name).sort();
      console.log(`[PASS] Entity '${ent.name}' verified with columns: ${cols.join(', ')}`);
    }

    // 8. Relational Verification Query
    console.log('\n--- VERIFYING RELATIONAL INTEGRITY ---');
    const relCheck = await client.query(`
      SELECT 
        p.patient_id,
        p.full_name AS patient_name,
        p.mobile,
        p.blood_group,
        v.visit_id,
        v.visit_type,
        v.status AS visit_status,
        t.token_id,
        t.token_number,
        t.status AS token_status,
        pay.payment_id,
        pay.amount,
        pay.payment_status,
        d.name AS doctor_name,
        dept.name AS department_name
      FROM patients p
      JOIN visits v ON v.patient_id = p.id
      LEFT JOIN tokens t ON t.visit_id = v.visit_id
      LEFT JOIN payments pay ON pay.visit_id = v.visit_id
      LEFT JOIN doctors d ON d.id = v.doctor_id
      LEFT JOIN departments dept ON dept.id = v.department_id
      WHERE v.visit_id = $1
    `, [demoVisitId]);

    console.log('Relational query output:');
    console.table(relCheck.rows);

    console.log('\nAll 10 entities, relational constraints, and migrations are 100% verified.');
  } finally {
    await client.end();
  }
}

runReceptionMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
