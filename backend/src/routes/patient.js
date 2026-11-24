import { Router } from 'express';
import { pool, query } from '../db.js';
import {
  hashPassword,
  requirePatientAuth,
  sanitizePatient,
  verifyPassword,
} from '../utils/auth.js';

const router = Router();
router.use(requirePatientAuth);

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 25. Patient Dashboard
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const { id: patientId, email } = req.patient;

    const [
      upcomingRes,
      pastApptRes,
      rxRes,
      activeRxRes,
      labRes,
      labCountRes,
      radioRes,
      radioCountRes,
      billRes,
      pendingBillsRes,
      notifRes,
    ] = await Promise.all([
      // 1. Upcoming Appointments
      query(
        `SELECT a.id, a.booking_reference, TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
                a.time_slot, a.visit_type, a.status, a.reason_for_visit,
                d.name AS doctor_name, d.specialty AS doctor_specialty, d.avatar_initials, d.accent_tone,
                dep.name AS department_name, dep.floor_location
         FROM appointments a
         JOIN doctors d ON d.slug = a.doctor_slug
         JOIN departments dep ON dep.slug = a.department_slug
         WHERE LOWER(a.patient_email) = LOWER($1) AND a.status = 'Confirmed' AND a.appointment_date >= CURRENT_DATE
         ORDER BY a.appointment_date ASC, a.time_slot ASC
         LIMIT 3`,
        [email]
      ),
      // 2. Recent Appointment History (Past or Completed)
      query(
        `SELECT a.id, a.booking_reference, TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
                a.time_slot, a.visit_type, a.status,
                d.name AS doctor_name, d.specialty AS doctor_specialty, d.avatar_initials, d.accent_tone,
                dep.name AS department_name, dep.floor_location
         FROM appointments a
         JOIN doctors d ON d.slug = a.doctor_slug
         JOIN departments dep ON dep.slug = a.department_slug
         WHERE LOWER(a.patient_email) = LOWER($1) AND (a.appointment_date < CURRENT_DATE OR a.status IN ('Completed', 'Cancelled'))
         ORDER BY a.appointment_date DESC, a.created_at DESC
         LIMIT 3`,
        [email]
      ),
      // 3. Active Prescriptions Count
      query(
        "SELECT COUNT(*)::int AS count FROM patient_prescriptions WHERE patient_id = $1 AND status = 'Active'",
        [patientId]
      ),
      // 4. Recent Active Prescriptions
      query(
        `SELECT id, medication_name, dosage, frequency, duration, prescribed_by,
                TO_CHAR(prescribed_date, 'YYYY-MM-DD') AS prescribed_date, status, refills_remaining, instructions
         FROM patient_prescriptions
         WHERE patient_id = $1 AND status = 'Active'
         ORDER BY prescribed_date DESC
         LIMIT 3`,
        [patientId]
      ),
      // 5. Released Lab Reports (Recent 3)
      query(
        `SELECT id, report_code, test_name, category, TO_CHAR(collected_date, 'YYYY-MM-DD') AS collected_date, ordered_by, status, summary
         FROM patient_lab_reports
         WHERE patient_id = $1 AND status IN ('Finalized', 'Released')
         ORDER BY collected_date DESC
         LIMIT 3`,
        [patientId]
      ),
      // 6. Total Released Lab Reports Count
      query(
        "SELECT COUNT(*)::int AS count FROM patient_lab_reports WHERE patient_id = $1 AND status IN ('Finalized', 'Released')",
        [patientId]
      ),
      // 7. Released Radiology Reports (Recent 3)
      query(
        `SELECT id, study_code, modality, study_name, TO_CHAR(study_date, 'YYYY-MM-DD') AS study_date, radiologist_name, status, impression
         FROM patient_radiology_reports
         WHERE patient_id = $1 AND status IN ('Finalized', 'Released')
         ORDER BY study_date DESC
         LIMIT 3`,
        [patientId]
      ),
      // 8. Total Released Radiology Reports Count
      query(
        "SELECT COUNT(*)::int AS count FROM patient_radiology_reports WHERE patient_id = $1 AND status IN ('Finalized', 'Released')",
        [patientId]
      ),
      // 9. Total Balance Due
      query(
        `SELECT COALESCE(SUM(patient_responsibility), 0)::numeric(10,2) AS balance_due
         FROM patient_billing_records
         WHERE patient_id = $1 AND status <> 'Paid'`,
        [patientId]
      ),
      // 10. Pending Bills List (Unpaid)
      query(
        `SELECT id, invoice_number, service_description, department_name,
                TO_CHAR(billing_date, 'YYYY-MM-DD') AS billing_date,
                TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date,
                amount_total, patient_responsibility, status
         FROM patient_billing_records
         WHERE patient_id = $1 AND status <> 'Paid'
         ORDER BY due_date ASC
         LIMIT 3`,
        [patientId]
      ),
      // 11. Recent Notifications
      query(
        `SELECT id, category, title, message, action_href, is_read, created_at
         FROM portal_notifications
         WHERE patient_id = $1
         ORDER BY created_at DESC
         LIMIT 4`,
        [patientId]
      ),
    ]);

    res.json({
      data: {
        patient: req.patient,
        stats: {
          upcoming_appointments: upcomingRes.rows.length,
          active_prescriptions: rxRes.rows[0].count,
          lab_reports_count: labCountRes.rows[0].count,
          radiology_reports_count: radioCountRes.rows[0].count,
          balance_due: Number(billRes.rows[0].balance_due),
          unread_notifications: notifRes.rows.filter((n) => !n.is_read).length,
        },
        upcomingAppointments: upcomingRes.rows,
        recentAppointmentHistory: pastApptRes.rows,
        recentPrescriptions: activeRxRes.rows,
        recentLabReports: labRes.rows,
        recentRadiologyReports: radioRes.rows,
        pendingBills: pendingBillsRes.rows,
        recentNotifications: notifRes.rows,
      },
    });
  })
);

// 26. My Profile (GET & PATCH)
router.get('/profile', (req, res) => {
  res.json({ data: req.patient });
});

router.patch(
  '/profile',
  asyncHandler(async (req, res) => {
    const {
      full_name,
      phone,
      date_of_birth,
      gender,
      blood_group,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      insurance_provider,
      insurance_policy_no,
      allergies,
    } = req.body || {};

    const allergyArray = Array.isArray(allergies)
      ? allergies.map((a) => String(a).trim()).filter(Boolean)
      : req.patient.allergies;

    const updated = await query(
      `UPDATE patient_accounts
       SET full_name = COALESCE(NULLIF($1, ''), full_name),
           phone = COALESCE($2, phone),
           date_of_birth = COALESCE($3::date, date_of_birth),
           gender = COALESCE($4, gender),
           blood_group = COALESCE($5, blood_group),
           address = COALESCE($6, address),
           emergency_contact_name = COALESCE($7, emergency_contact_name),
           emergency_contact_phone = COALESCE($8, emergency_contact_phone),
           insurance_provider = COALESCE($9, insurance_provider),
           insurance_policy_no = COALESCE($10, insurance_policy_no),
           allergies = $11,
           updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [
        full_name?.trim() || '',
        phone ?? req.patient.phone,
        date_of_birth || null,
        gender ?? req.patient.gender,
        blood_group ?? req.patient.blood_group,
        address ?? req.patient.address,
        emergency_contact_name ?? req.patient.emergency_contact_name,
        emergency_contact_phone ?? req.patient.emergency_contact_phone,
        insurance_provider ?? req.patient.insurance_provider,
        insurance_policy_no ?? req.patient.insurance_policy_no,
        allergyArray,
        req.patient.id,
      ]
    );

    res.json({ data: sanitizePatient(updated.rows[0]) });
  })
);

// 27. My Appointments
router.get(
  '/appointments',
  asyncHandler(async (req, res) => {
    const result = await query(
      `SELECT a.id, a.booking_reference, a.doctor_slug, a.department_slug,
              TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
              a.time_slot, a.visit_type, a.reason_for_visit, a.status, a.created_at,
              d.name AS doctor_name, d.specialty AS doctor_specialty, d.qualification AS doctor_qualification,
              d.consultation_fee, d.avatar_initials, d.accent_tone,
              dep.name AS department_name, dep.floor_location, dep.phone_ext
       FROM appointments a
       JOIN doctors d ON d.slug = a.doctor_slug
       JOIN departments dep ON dep.slug = a.department_slug
       WHERE LOWER(a.patient_email) = LOWER($1)
       ORDER BY a.appointment_date DESC, a.created_at DESC`,
      [req.patient.email]
    );
    res.json({ data: result.rows });
  })
);

// Ensure audit log table exists
async function ensureAuditLogTable(client) {
  await client.query(`
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
  `);
}

// 28. Appointment Details by ID or Booking Reference (with Audit Trail)
router.get(
  '/appointments/:id',
  asyncHandler(async (req, res) => {
    const param = String(req.params.id || '').trim();
    const isNumeric = /^\d+$/.test(param);

    const result = await query(
      `SELECT a.id, a.booking_reference, a.doctor_slug, a.department_slug,
              TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
              a.time_slot, a.visit_type, a.patient_name, a.patient_email, a.patient_phone,
              a.reason_for_visit, a.insurance_provider, a.status, a.created_at,
              d.name AS doctor_name, d.title AS doctor_title, d.specialty AS doctor_specialty,
              d.qualification AS doctor_qualification, d.consultation_fee, d.avatar_initials, d.accent_tone,
              dep.name AS department_name, dep.floor_location, dep.phone_ext
       FROM appointments a
       JOIN doctors d ON d.slug = a.doctor_slug
       JOIN departments dep ON dep.slug = a.department_slug
       WHERE LOWER(a.patient_email) = LOWER($1)
         AND (${isNumeric ? 'a.id = $2::int' : 'UPPER(a.booking_reference) = UPPER($2)'})`,
      [req.patient.email, param]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const appt = result.rows[0];

    // Fetch audit history if available
    let auditLogs = [];
    try {
      const logsRes = await query(
        `SELECT previous_status, new_status, changed_by, reason,
                TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS timestamp
         FROM appointment_audit_logs
         WHERE appointment_id = $1 OR UPPER(booking_reference) = UPPER($2)
         ORDER BY created_at DESC`,
        [appt.id, appt.booking_reference]
      );
      auditLogs = logsRes.rows;
    } catch {
      auditLogs = [];
    }

    res.json({ data: { ...appt, audit_logs: auditLogs } });
  })
);

// Workflow D: Appointment Cancellation with Ownership & Eligibility Checks, Audit Logging, and Notifications
router.patch(
  '/appointments/:id/cancel',
  asyncHandler(async (req, res) => {
    const param = String(req.params.id || '').trim();
    const isNumeric = /^\d+$/.test(param);
    const { reason = 'Cancelled by patient via portal' } = req.body || {};

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await ensureAuditLogTable(client);

      // 1. Fetch appointment with row lock and ownership verification
      const findRes = await client.query(
        `SELECT a.*,
                TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS formatted_date,
                d.name AS doctor_name, d.specialty AS doctor_specialty
         FROM appointments a
         JOIN doctors d ON d.slug = a.doctor_slug
         WHERE LOWER(a.patient_email) = LOWER($1)
           AND (${isNumeric ? 'a.id = $2::int' : 'UPPER(a.booking_reference) = UPPER($2)'})
         FOR UPDATE`,
        [req.patient.email, param]
      );

      if (findRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          error: 'Appointment not found or does not belong to your patient account.',
        });
      }

      const appt = findRes.rows[0];

      // 2. Cancellation eligibility validation
      if (appt.status === 'Cancelled') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'This appointment has already been cancelled.' });
      }

      if (appt.status === 'Completed') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Completed consultations cannot be cancelled.' });
      }

      const todayIso = new Date().toISOString().slice(0, 10);
      if (appt.formatted_date < todayIso) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Past appointments cannot be cancelled online. Please contact patient services.',
        });
      }

      // 3. Update appointment status to Cancelled (releases slot automatically)
      const updateRes = await client.query(
        `UPDATE appointments
         SET status = 'Cancelled', updated_at = NOW()
         WHERE id = $1
         RETURNING *, TO_CHAR(appointment_date, 'YYYY-MM-DD') AS formatted_date`,
        [appt.id]
      );

      // 4. Record action in audit log (Workflow D - Step 10)
      const actorLabel = `${req.patient.full_name} (Patient MRN: ${req.patient.mrn || 'N/A'})`;
      await client.query(
        `INSERT INTO appointment_audit_logs (
          appointment_id, booking_reference, previous_status, new_status, changed_by, reason
        ) VALUES ($1, $2, $3, 'Cancelled', $4, $5)`,
        [appt.id, appt.booking_reference, appt.status, actorLabel, String(reason)]
      );

      // 5. Create portal notification for patient (Workflow D - Step 9)
      await client.query(
        `INSERT INTO portal_notifications (
          patient_id, category, title, message, action_href, is_read
        ) VALUES ($1, 'Appointment', $2, $3, $4, FALSE)`,
        [
          req.patient.id,
          `Appointment Cancelled — ${appt.booking_reference}`,
          `Your appointment with Dr. ${appt.doctor_name} scheduled for ${appt.formatted_date} at ${appt.time_slot} was cancelled. Reason: ${reason}.`,
          '/patient/appointments',
        ]
      );

      await client.query('COMMIT');

      const updatedRow = updateRes.rows[0];
      res.json({
        data: {
          ...updatedRow,
          appointment_date: updatedRow.formatted_date,
          doctor_name: appt.doctor_name,
          doctor_specialty: appt.doctor_specialty,
          slot_released: true,
          audit_recorded: true,
        },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

// 29. Medical History
router.get(
  '/medical-history',
  asyncHandler(async (req, res) => {
    const result = await query(
      `SELECT id, record_type, title, TO_CHAR(recorded_date, 'YYYY-MM-DD') AS recorded_date,
              doctor_name, department_name, status, summary
       FROM patient_medical_history
       WHERE patient_id = $1
       ORDER BY recorded_date DESC`,
      [req.patient.id]
    );
    res.json({ data: result.rows });
  })
);

// 30. Prescriptions
router.get(
  '/prescriptions',
  asyncHandler(async (req, res) => {
    const result = await query(
      `SELECT id, medication_name, dosage, frequency, duration, prescribed_by,
              TO_CHAR(prescribed_date, 'YYYY-MM-DD') AS prescribed_date,
              status, refills_remaining, instructions
       FROM patient_prescriptions
       WHERE patient_id = $1
       ORDER BY prescribed_date DESC`,
      [req.patient.id]
    );
    res.json({ data: result.rows });
  })
);

// 31. Laboratory Reports (Strictly Gated to Authorized Finalized / Released Reports)
router.get(
  '/lab-reports',
  asyncHandler(async (req, res) => {
    const result = await query(
      `SELECT id, report_code, test_name, category,
              TO_CHAR(collected_date, 'YYYY-MM-DD') AS collected_date,
              ordered_by, status, summary, results_json
       FROM patient_lab_reports
       WHERE patient_id = $1 AND status IN ('Finalized', 'Released')
       ORDER BY collected_date DESC`,
      [req.patient.id]
    );
    res.json({ data: result.rows });
  })
);

// Single Laboratory Report Details (with Release Verification)
router.get(
  '/lab-reports/:id',
  asyncHandler(async (req, res) => {
    const param = String(req.params.id || '').trim();
    const isNumeric = /^\d+$/.test(param);

    const result = await query(
      `SELECT id, report_code, test_name, category,
              TO_CHAR(collected_date, 'YYYY-MM-DD') AS collected_date,
              ordered_by, status, summary, results_json
       FROM patient_lab_reports
       WHERE patient_id = $1
         AND status IN ('Finalized', 'Released')
         AND (${isNumeric ? 'id = $2::int' : 'UPPER(report_code) = UPPER($2)'})`,
      [req.patient.id, param]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Laboratory report not found or not yet approved/released for patient access.',
      });
    }

    res.json({ data: result.rows[0] });
  })
);

// 32. Radiology Reports (Strictly Gated to Authorized Finalized / Released Reports)
router.get(
  '/radiology-reports',
  asyncHandler(async (req, res) => {
    const result = await query(
      `SELECT id, study_code, modality, study_name,
              TO_CHAR(study_date, 'YYYY-MM-DD') AS study_date,
              radiologist_name, status, findings, impression
       FROM patient_radiology_reports
       WHERE patient_id = $1 AND status IN ('Finalized', 'Released')
       ORDER BY study_date DESC`,
      [req.patient.id]
    );
    res.json({ data: result.rows });
  })
);

// Single Radiology Report Details (with Release Verification)
router.get(
  '/radiology-reports/:id',
  asyncHandler(async (req, res) => {
    const param = String(req.params.id || '').trim();
    const isNumeric = /^\d+$/.test(param);

    const result = await query(
      `SELECT id, study_code, modality, study_name,
              TO_CHAR(study_date, 'YYYY-MM-DD') AS study_date,
              radiologist_name, status, findings, impression
       FROM patient_radiology_reports
       WHERE patient_id = $1
         AND status IN ('Finalized', 'Released')
         AND (${isNumeric ? 'id = $2::int' : 'UPPER(study_code) = UPPER($2)'})`,
      [req.patient.id, param]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Radiology report not found or not yet approved/released for patient access.',
      });
    }

    res.json({ data: result.rows[0] });
  })
);

// Workflow E: Hospital Staff Medical Report Release Simulation
// Simulates staff recording, clinical verification by authorized clinician, patient release, and notification dispatch
router.post(
  '/clinical/simulate-release',
  asyncHandler(async (req, res) => {
    const { report_type = 'lab', test_name, category, summary, ordered_by } = req.body || {};
    const patientId = req.patient.id;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      if (report_type === 'lab') {
        const reportCode = `LAB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const testTitle = test_name || 'High-Sensitivity Cardiac Troponin I & hs-CRP';
        const docName = ordered_by || 'Dr. Aris Thorne, MD';
        const sampleResults = [
          { parameter: 'hs-Troponin I', value: '< 2.5', unit: 'ng/L', reference: '< 14.0', flag: 'Normal' },
          { parameter: 'hs-CRP (Inflammation)', value: '0.8', unit: 'mg/L', reference: '< 1.0', flag: 'Optimal' },
          { parameter: 'BNP (Cardiac Neurohormone)', value: '38', unit: 'pg/mL', reference: '< 100', flag: 'Normal' },
        ];

        // Step 1, 2, 3: Staff records, verifies, and marks eligible for patient release
        const insertRes = await client.query(
          `INSERT INTO patient_lab_reports (
            patient_id, report_code, test_name, category, collected_date, ordered_by, status, summary, results_json
          ) VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, 'Released', $6, $7)
          RETURNING *`,
          [
            patientId,
            reportCode,
            testTitle,
            category || 'Cardiology Biomarkers',
            docName,
            summary || 'Cardiac biomarkers demonstrate zero acute myocardial ischemia or systemic vascular inflammation.',
            JSON.stringify(sampleResults),
          ]
        );

        // Step 4: Patient receives notification
        await client.query(
          `INSERT INTO portal_notifications (patient_id, category, title, message, action_href, is_read)
           VALUES ($1, 'Lab Report', $2, $3, $4, FALSE)`,
          [
            patientId,
            `Lab Report Released — ${reportCode}`,
            `Your ${testTitle} has been verified by ${docName} and released for your access.`,
            '/patient/lab-reports',
          ]
        );

        await client.query('COMMIT');
        return res.status(201).json({
          data: insertRes.rows[0],
          message: 'Report verified and released. Patient notification dispatched.',
        });
      } else {
        const studyCode = `RAD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const studyTitle = test_name || 'High-Resolution Chest CT (HRCT)';
        const radName = ordered_by || 'Dr. Elena Rostova, MD';

        const insertRes = await client.query(
          `INSERT INTO patient_radiology_reports (
            patient_id, study_code, modality, study_name, study_date, radiologist_name, status, findings, impression
          ) VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, 'Released', $6, $7)
          RETURNING *`,
          [
            patientId,
            studyCode,
            'High-Resolution CT',
            studyTitle,
            radName,
            'Clear lung parenchymal architecture without interstitial fibrosis, ground-glass opacities, or pleural effusion. Tracheobronchial tree is patent.',
            'Normal high-resolution chest computed tomography. Zero active pulmonary pathology identified.',
          ]
        );

        await client.query(
          `INSERT INTO portal_notifications (patient_id, category, title, message, action_href, is_read)
           VALUES ($1, 'Radiology', $2, $3, $4, FALSE)`,
          [
            patientId,
            `Radiology Study Released — ${studyCode}`,
            `Your ${studyTitle} has been reviewed by ${radName} and released to your patient records.`,
            '/patient/radiology-reports',
          ]
        );

        await client.query('COMMIT');
        return res.status(201).json({
          data: insertRes.rows[0],
          message: 'Radiology study verified and released. Patient notification dispatched.',
        });
      }
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

// 33. Billing History & Pay Invoice
router.get(
  '/billing',
  asyncHandler(async (req, res) => {
    const result = await query(
      `SELECT id, invoice_number, service_description, department_name,
              TO_CHAR(billing_date, 'YYYY-MM-DD') AS billing_date,
              TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date,
              amount_total::float, insurance_covered::float, patient_responsibility::float,
              status, payment_method
       FROM patient_billing_records
       WHERE patient_id = $1
       ORDER BY billing_date DESC`,
      [req.patient.id]
    );
    res.json({ data: result.rows });
  })
);

router.patch(
  '/billing/:id/pay',
  asyncHandler(async (req, res) => {
    const invoiceId = Number(req.params.id);
    const updated = await query(
      `UPDATE patient_billing_records
       SET status = 'Paid', payment_method = 'Online Portal Card •••• 4242'
       WHERE id = $1 AND patient_id = $2
       RETURNING id, invoice_number, status, payment_method`,
      [invoiceId, req.patient.id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }
    res.json({ data: updated.rows[0] });
  })
);

// 34. Notifications
router.get(
  '/notifications',
  asyncHandler(async (req, res) => {
    const result = await query(
      `SELECT id, category, title, message, action_href, is_read, created_at
       FROM portal_notifications
       WHERE patient_id = $1
       ORDER BY created_at DESC`,
      [req.patient.id]
    );
    res.json({ data: result.rows });
  })
);

router.patch(
  '/notifications/read-all',
  asyncHandler(async (req, res) => {
    await query('UPDATE portal_notifications SET is_read = TRUE WHERE patient_id = $1', [
      req.patient.id,
    ]);
    res.json({ data: { updated: true } });
  })
);

router.patch(
  '/notifications/:id/read',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const updated = await query(
      `UPDATE portal_notifications
       SET is_read = TRUE
       WHERE id = $1 AND patient_id = $2
       RETURNING id, is_read`,
      [id, req.patient.id]
    );
    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found.' });
    }
    res.json({ data: updated.rows[0] });
  })
);

// 35. Account Settings
router.get('/settings', (req, res) => {
  res.json({
    data: {
      notify_email: req.patient.notify_email,
      notify_sms: req.patient.notify_sms,
      notify_lab_results: req.patient.notify_lab_results,
      notify_reminders: req.patient.notify_reminders,
      two_factor_enabled: req.patient.two_factor_enabled,
    },
  });
});

router.patch(
  '/settings',
  asyncHandler(async (req, res) => {
    const {
      notify_email,
      notify_sms,
      notify_lab_results,
      notify_reminders,
      two_factor_enabled,
    } = req.body || {};

    const updated = await query(
      `UPDATE patient_accounts
       SET notify_email = COALESCE($1, notify_email),
           notify_sms = COALESCE($2, notify_sms),
           notify_lab_results = COALESCE($3, notify_lab_results),
           notify_reminders = COALESCE($4, notify_reminders),
           two_factor_enabled = COALESCE($5, two_factor_enabled),
           updated_at = NOW()
       WHERE id = $6
       RETURNING notify_email, notify_sms, notify_lab_results, notify_reminders, two_factor_enabled`,
      [
        typeof notify_email === 'boolean' ? notify_email : null,
        typeof notify_sms === 'boolean' ? notify_sms : null,
        typeof notify_lab_results === 'boolean' ? notify_lab_results : null,
        typeof notify_reminders === 'boolean' ? notify_reminders : null,
        typeof two_factor_enabled === 'boolean' ? two_factor_enabled : null,
        req.patient.id,
      ]
    );

    res.json({ data: updated.rows[0] });
  })
);

router.post(
  '/settings/password',
  asyncHandler(async (req, res) => {
    const { current_password, new_password } = req.body || {};
    if (!current_password || !new_password || new_password.length < 8) {
      return res.status(400).json({
        error: 'Current password and a new password of at least 8 characters are required.',
      });
    }

    const userRes = await query('SELECT password_hash FROM patient_accounts WHERE id = $1', [
      req.patient.id,
    ]);
    if (!verifyPassword(current_password, userRes.rows[0].password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const newHash = hashPassword(new_password);
    await query('UPDATE patient_accounts SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
      newHash,
      req.patient.id,
    ]);

    res.json({ data: { message: 'Password updated successfully.' } });
  })
);

export default router;
