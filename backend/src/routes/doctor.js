import { Router } from 'express';
import { query, pool } from '../db.js';

const router = Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Resolve doctor identity helper
 */
async function resolveDoctor(doctorIdOrEmail) {
  let docRes;
  if (!isNaN(Number(doctorIdOrEmail))) {
    docRes = await query(
      `SELECT d.*, dept.name AS department_name, dept.token_prefix
       FROM doctors d
       JOIN departments dept ON dept.id = d.department_id
       WHERE d.id = $1 LIMIT 1`,
      [Number(doctorIdOrEmail)]
    );
  } else if (typeof doctorIdOrEmail === 'string' && doctorIdOrEmail.includes('@')) {
    docRes = await query(
      `SELECT d.*, dept.name AS department_name, dept.token_prefix
       FROM doctors d
       JOIN departments dept ON dept.id = d.department_id
       WHERE LOWER(d.slug) = LOWER($1) OR d.id = 1 LIMIT 1`,
      [doctorIdOrEmail]
    );
  }

  if (docRes && docRes.rows.length > 0) {
    return docRes.rows[0];
  }

  // Default to Dr. Aris Thorne (Doctor #1)
  const defaultDoc = await query(
    `SELECT d.*, dept.name AS department_name, dept.token_prefix
     FROM doctors d
     JOIN departments dept ON dept.id = d.department_id
     WHERE d.id = 1 LIMIT 1`
  );
  return defaultDoc.rows[0];
}

/**
 * GET /api/v1/doctor/dashboard
 * Complete real-time clinical telemetry, active serving patient, and queue metrics for doctor.
 */
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const { doctor_id = 1 } = req.query;
    const doctor = await resolveDoctor(doctor_id);

    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found.' });
    }

    const docId = doctor.id;
    const deptId = doctor.department_id;

    // 1. Current Active Token in Cabin (Now Serving or Consulting)
    const activeTokenRes = await query(
      `SELECT 
         t.token_id,
         COALESCE(t.token_display, CONCAT(COALESCE(dept.token_prefix, 'GEN'), '-', LPAD(t.token_number::text, 3, '0'))) AS token_display,
         t.token_number,
         t.status,
         t.priority,
         t.called_at,
         t.consultation_start_at,
         t.queue_date,
         v.visit_id,
         v.visit_type,
         COALESCE(v.triage_level, 'Standard') AS triage_level,
         p.id AS patient_id,
         COALESCE(p.patient_id, p.id) AS patient_code,
         COALESCE(p.full_name, CONCAT(p.first_name, ' ', p.last_name), 'Patient') AS patient_name,
         p.mobile,
         p.gender,
         p.dob,
         p.blood_group,
         p.allergies,
         dept.name AS department_name,
         CONCAT('Cabin ', doc.id) AS doctor_cabin,
         ROUND(EXTRACT(EPOCH FROM (NOW() - COALESCE(t.consultation_start_at, t.called_at, t.created_at)))::numeric) AS elapsed_seconds
       FROM tokens t
       JOIN visits v ON v.visit_id = t.visit_id
       JOIN patients p ON p.id = v.patient_id
       LEFT JOIN doctors doc ON doc.id = t.doctor_id
       LEFT JOIN departments dept ON dept.id = t.department_id
       WHERE t.queue_date = CURRENT_DATE
         AND t.doctor_id = $1
         AND t.status IN ('Now Serving', 'Consulting')
       ORDER BY CASE WHEN t.status = 'Consulting' THEN 0 ELSE 1 END, t.called_at DESC
       LIMIT 1`,
      [docId]
    );

    const activeToken = activeTokenRes.rows[0] || null;

    // 2. Queue Telemetry Statistics for this Doctor Today
    const statsRes = await query(
      `SELECT
         COUNT(*) FILTER (WHERE t.status = 'Waiting')::int AS waiting_count,
         COUNT(*) FILTER (WHERE t.status IN ('Now Serving', 'Consulting'))::int AS consulting_count,
         COUNT(*) FILTER (WHERE t.status = 'Completed')::int AS completed_count,
         COUNT(*)::int AS total_assigned_today,
         COUNT(*) FILTER (WHERE t.status = 'Waiting' AND t.priority = 'Emergency')::int AS emergency_waiting_count,
         COALESCE(
           ROUND(AVG(EXTRACT(EPOCH FROM (t.consultation_end_at - t.consultation_start_at)) / 60) FILTER (WHERE t.status = 'Completed' AND t.consultation_start_at IS NOT NULL AND t.consultation_end_at IS NOT NULL)::numeric, 1),
           10.0
         ) AS avg_consultation_mins
       FROM tokens t
       WHERE t.queue_date = CURRENT_DATE
         AND (t.doctor_id = $1 OR (t.department_id = $2 AND t.status = 'Waiting'))`,
      [docId, deptId]
    );

    const stats = statsRes.rows[0] || {};

    // 3. Appointments Count Today
    const apptCountRes = await query(
      `SELECT COUNT(*)::int AS today_appointments_count
       FROM appointments
       WHERE (doctor_id = $1 OR doctor_slug = $2)
         AND appointment_date = CURRENT_DATE
         AND status NOT IN ('Cancelled')`,
      [docId, doctor.slug]
    );
    const todayAppointments = apptCountRes.rows[0]?.today_appointments_count || 0;

    // 4. Next 5 Upcoming Waiting Patients
    const upcomingRes = await query(
      `SELECT 
         t.token_id,
         COALESCE(t.token_display, CONCAT(COALESCE(dept.token_prefix, 'GEN'), '-', LPAD(t.token_number::text, 3, '0'))) AS token_display,
         t.token_number,
         t.status,
         t.priority,
         t.created_at,
         v.visit_id,
         v.visit_type,
         p.id AS patient_id,
         COALESCE(p.patient_id, p.id) AS patient_code,
         COALESCE(p.full_name, 'Patient') AS patient_name,
         p.gender,
         p.dob,
         p.blood_group,
         p.allergies,
         ROW_NUMBER() OVER (ORDER BY CASE WHEN t.priority = 'Emergency' THEN 0 ELSE 1 END, t.token_number ASC) AS queue_pos
       FROM tokens t
       JOIN visits v ON v.visit_id = t.visit_id
       JOIN patients p ON p.id = v.patient_id
       LEFT JOIN departments dept ON dept.id = t.department_id
       WHERE t.queue_date = CURRENT_DATE
         AND t.status = 'Waiting'
         AND (t.doctor_id = $1 OR t.department_id = $2)
       ORDER BY CASE WHEN t.priority = 'Emergency' THEN 0 ELSE 1 END, t.token_number ASC
       LIMIT 6`,
      [docId, deptId]
    );

    const upcomingQueue = upcomingRes.rows.map((r) => ({
      ...r,
      estimated_wait_mins: Math.max(5, (Number(r.queue_pos) - 1) * 10),
    }));

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      doctor: {
        id: doctor.id,
        name: doctor.name,
        title: doctor.title || 'Attending Physician',
        specialty: doctor.specialty,
        department_id: doctor.department_id,
        department_name: doctor.department_name,
        room_or_cabin: `Cabin ${doctor.id}`,
        availability_status: doctor.availability_status || 'Available',
        consultation_fee: doctor.consultation_fee || '₹500',
        consultation_hours: doctor.consultation_hours || '08:30 - 16:30',
      },
      active_token: activeToken,
      stats: {
        waiting_count: Number(stats.waiting_count) || 0,
        consulting_count: Number(stats.consulting_count) || 0,
        completed_count: Number(stats.completed_count) || 0,
        total_assigned_today: Number(stats.total_assigned_today) || 0,
        emergency_waiting_count: Number(stats.emergency_waiting_count) || 0,
        avg_consultation_mins: Number(stats.avg_consultation_mins) || 10.0,
        today_appointments: todayAppointments,
      },
      upcoming_queue: upcomingQueue,
    });
  })
);

/**
 * GET /api/v1/doctor/queue
 * Full waiting and completed queue for doctor.
 */
router.get(
  '/queue',
  asyncHandler(async (req, res) => {
    const { doctor_id = 1, status = 'all' } = req.query;
    const doctor = await resolveDoctor(doctor_id);
    const docId = doctor.id;
    const deptId = doctor.department_id;

    let sql = `
      SELECT 
        t.token_id,
        COALESCE(t.token_display, CONCAT(COALESCE(dept.token_prefix, 'GEN'), '-', LPAD(t.token_number::text, 3, '0'))) AS token_display,
        t.token_number,
        t.status,
        t.priority,
        t.called_at,
        t.consultation_start_at,
        t.consultation_end_at,
        t.queue_date,
        v.visit_id,
        v.visit_type,
        COALESCE(v.triage_level, 'Standard') AS triage_level,
        p.id AS patient_id,
        COALESCE(p.patient_id, p.id) AS patient_code,
        COALESCE(p.full_name, 'Patient') AS patient_name,
        p.mobile,
        p.gender,
        p.dob,
        p.blood_group,
        p.allergies,
        dept.name AS department_name
      FROM tokens t
      JOIN visits v ON v.visit_id = t.visit_id
      JOIN patients p ON p.id = v.patient_id
      LEFT JOIN departments dept ON dept.id = t.department_id
      WHERE t.queue_date = CURRENT_DATE
        AND (t.doctor_id = $1 OR t.department_id = $2)
    `;
    const params = [docId, deptId];

    if (status === 'waiting') {
      sql += ` AND t.status = 'Waiting'`;
    } else if (status === 'serving') {
      sql += ` AND t.status IN ('Now Serving', 'Consulting')`;
    } else if (status === 'completed') {
      sql += ` AND t.status = 'Completed'`;
    }

    sql += ` ORDER BY 
      CASE 
        WHEN t.status = 'Consulting' THEN 0 
        WHEN t.status = 'Now Serving' THEN 1 
        WHEN t.status = 'Waiting' AND t.priority = 'Emergency' THEN 2 
        WHEN t.status = 'Waiting' THEN 3 
        ELSE 4 
      END,
      t.token_number ASC`;

    const result = await query(sql, params);

    res.json({
      success: true,
      doctor_id: docId,
      doctor_name: doctor.name,
      count: result.rows.length,
      queue: result.rows,
    });
  })
);

/**
 * POST /api/v1/doctor/call-next
 * Calls the next waiting patient into doctor's cabin with row-level locks and auto-advancement.
 */
router.post(
  '/call-next',
  asyncHandler(async (req, res) => {
    const { doctor_id = 1, token_id } = req.body || {};
    const doctor = await resolveDoctor(doctor_id);
    const docId = doctor.id;
    const deptId = doctor.department_id;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let targetToken = null;

      if (token_id) {
        const tokenRes = await client.query(
          `SELECT t.*, v.visit_id, p.id AS patient_db_id, COALESCE(p.full_name, 'Patient') AS patient_name
           FROM tokens t
           JOIN visits v ON v.visit_id = t.visit_id
           JOIN patients p ON p.id = v.patient_id
           WHERE t.token_id = $1 AND t.queue_date = CURRENT_DATE
           FOR UPDATE OF t`,
          [token_id]
        );
        if (tokenRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ success: false, error: 'Target token not found for today.' });
        }
        targetToken = tokenRes.rows[0];
      } else {
        // Auto-pick next: Emergency priority first, then lowest token number
        const nextRes = await client.query(
          `SELECT t.*, v.visit_id, p.id AS patient_db_id, COALESCE(p.full_name, 'Patient') AS patient_name
           FROM tokens t
           JOIN visits v ON v.visit_id = t.visit_id
           JOIN patients p ON p.id = v.patient_id
           WHERE t.queue_date = CURRENT_DATE
             AND t.status = 'Waiting'
             AND (t.doctor_id = $1 OR t.department_id = $2)
           ORDER BY 
             CASE WHEN t.priority = 'Emergency' THEN 0 ELSE 1 END,
             t.token_number ASC
           LIMIT 1
           FOR UPDATE OF t`,
          [docId, deptId]
        );

        if (nextRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ success: false, error: 'No waiting patients in queue for your cabin.' });
        }
        targetToken = nextRes.rows[0];
      }

      // Conflict prevention: Auto-advance any previous token in 'Now Serving' to 'Consulting'
      await client.query(
        `UPDATE tokens
         SET status = 'Consulting',
             consultation_start_at = COALESCE(consultation_start_at, NOW()),
             updated_at = NOW()
         WHERE doctor_id = $1
           AND queue_date = CURRENT_DATE
           AND status IN ('Now Serving', 'Called')
           AND token_id != $2`,
        [docId, targetToken.token_id]
      );

      // Advance Target Token to 'Now Serving' and assign this doctor
      const updatedTokenRes = await client.query(
        `UPDATE tokens
         SET status = 'Now Serving',
             doctor_id = $1,
             called_at = NOW(),
             updated_at = NOW()
         WHERE token_id = $2
         RETURNING *`,
        [docId, targetToken.token_id]
      );

      const calledToken = updatedTokenRes.rows[0];

      // Sync Visit
      await client.query(
        `UPDATE visits
         SET status = 'Now Serving',
             doctor_id = $1,
             updated_at = NOW()
         WHERE visit_id = $2`,
        [docId, targetToken.visit_id]
      );

      // Audit Log
      await client.query(
        `INSERT INTO audit_logs (action, entity, entity_type, entity_id, timestamp, details)
         VALUES ('DOCTOR_CALLED_TOKEN', 'tokens', 'tokens', $1, NOW(), $2)`,
        [
          calledToken.token_id,
          JSON.stringify({
            token_display: calledToken.token_display,
            doctor_name: doctor.name,
            doctor_id: docId,
            patient_name: targetToken.patient_name,
            cabin: `Cabin ${docId}`,
          }),
        ]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Token ${calledToken.token_display || calledToken.token_number} called to Cabin ${docId}.`,
        token: calledToken,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Doctor call next error:', err);
      res.status(500).json({ success: false, error: 'Failed to call patient.', details: err.message });
    } finally {
      client.release();
    }
  })
);

/**
 * POST /api/v1/doctor/tokens/:tokenId/status
 * Transitions token consultation status (Consulting, Completed, Cancelled).
 */
router.post(
  '/tokens/:tokenId/status',
  asyncHandler(async (req, res) => {
    const { tokenId } = req.params;
    const { status, doctor_id = 1, cancellation_reason = '' } = req.body || {};

    const validStatuses = ['Waiting', 'Now Serving', 'Consulting', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const doctor = await resolveDoctor(doctor_id);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const tokenRes = await client.query(
        `SELECT t.*, v.visit_id 
         FROM tokens t
         JOIN visits v ON v.visit_id = t.visit_id
         WHERE t.token_id = $1 AND t.queue_date = CURRENT_DATE
         FOR UPDATE OF t`,
        [tokenId]
      );

      if (tokenRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Token not found for today.' });
      }

      const currentToken = tokenRes.rows[0];

      let updateSql = `UPDATE tokens SET status = $1, updated_at = NOW()`;
      const params = [status, tokenId];

      if (status === 'Now Serving') {
        updateSql += `, called_at = NOW()`;
      } else if (status === 'Consulting') {
        updateSql += `, consultation_start_at = COALESCE(consultation_start_at, NOW())`;
      } else if (status === 'Completed') {
        updateSql += `, consultation_end_at = NOW()`;
      } else if (status === 'Cancelled') {
        params.push(cancellation_reason.trim());
        updateSql += `, cancellation_reason = $${params.length}`;
      } else if (status === 'Waiting') {
        updateSql += `, called_at = NULL, consultation_start_at = NULL`;
      }

      updateSql += ` WHERE token_id = $2 RETURNING *;`;

      const updatedRes = await client.query(updateSql, params);
      const updatedToken = updatedRes.rows[0];

      // Sync Visit Status
      const visitStatusMap = {
        'Waiting': 'In-Queue',
        'Now Serving': 'Now Serving',
        'Consulting': 'Consulting',
        'Completed': 'Completed',
        'Cancelled': 'Cancelled',
      };
      await client.query(
        `UPDATE visits SET status = $1, updated_at = NOW() WHERE visit_id = $2`,
        [visitStatusMap[status] || 'In-Queue', currentToken.visit_id]
      );

      // Audit Log
      await client.query(
        `INSERT INTO audit_logs (action, entity, entity_type, entity_id, timestamp, details)
         VALUES ('DOCTOR_STATUS_UPDATE', 'tokens', 'tokens', $1, NOW(), $2)`,
        [
          tokenId,
          JSON.stringify({
            token_display: updatedToken.token_display,
            from: currentToken.status,
            to: status,
            doctor_name: doctor.name,
            cancellation_reason,
          }),
        ]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Token ${updatedToken.token_display || updatedToken.token_number} transitioned to '${status}'.`,
        token: updatedToken,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Doctor status update error:', err);
      res.status(500).json({ success: false, error: 'Failed to update status.', details: err.message });
    } finally {
      client.release();
    }
  })
);

/**
 * PATCH /api/v1/doctor/availability
 * Toggles doctor availability status.
 */
router.patch(
  '/availability',
  asyncHandler(async (req, res) => {
    const { doctor_id = 1, availability_status } = req.body || {};

    const validStatuses = ['Available', 'Busy', 'On Break', 'Unavailable'];
    if (!validStatuses.includes(availability_status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status '${availability_status}'. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const doctor = await resolveDoctor(doctor_id);

    await query(
      `UPDATE doctors SET availability_status = $1 WHERE id = $2`,
      [availability_status, doctor.id]
    );

    await query(
      `INSERT INTO audit_logs (action, entity, entity_type, entity_id, timestamp, details)
       VALUES ('DOCTOR_AVAILABILITY_CHANGED', 'doctors', 'doctors', $1, NOW(), $2)`,
      [
        String(doctor.id),
        JSON.stringify({
          doctor_name: doctor.name,
          new_status: availability_status,
        }),
      ]
    );

    res.json({
      success: true,
      message: `Doctor availability set to '${availability_status}'.`,
      availability_status,
    });
  })
);

/**
 * GET /api/v1/doctor/patients/:patientId/clinical-summary
 * Comprehensive EHR profile: demographics, vitals, medical history, active prescriptions, labs & imaging.
 */
router.get(
  '/patients/:patientId/clinical-summary',
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;

    // Fetch Patient Record
    const patientRes = await query(
      `SELECT id, patient_id, patient_number, full_name, dob, gender, blood_group, allergies, mobile, address, emergency_contact, created_at
       FROM patients
       WHERE id = $1 OR patient_id = $1 LIMIT 1`,
      [patientId]
    );

    if (patientRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Patient not found.' });
    }

    const patient = patientRes.rows[0];

    // Fetch Clinical History
    const [historyRes, rxRes, labRes, radRes, visitsRes, pastConsultsRes] = await Promise.all([
      query(
        `SELECT id, record_type, title, recorded_date, doctor_name, department_name, status, summary
         FROM patient_medical_history
         WHERE patient_id::text = $1 OR patient_id::text = (SELECT id FROM patients WHERE id = $1 LIMIT 1)
         ORDER BY recorded_date DESC`,
        [patient.id]
      ).catch(() => ({ rows: [] })),

      query(
        `SELECT id, medication_name, dosage, frequency, duration, prescribed_by, prescribed_date, status, refills_remaining, instructions
         FROM patient_prescriptions
         WHERE patient_id::text = $1 OR patient_id::text = (SELECT id FROM patients WHERE id = $1 LIMIT 1)
         ORDER BY prescribed_date DESC`,
        [patient.id]
      ).catch(() => ({ rows: [] })),

      query(
        `SELECT id, report_code, test_name, category, collected_date, ordered_by, status, summary, results_json
         FROM patient_lab_reports
         WHERE patient_id::text = $1 OR patient_id::text = (SELECT id FROM patients WHERE id = $1 LIMIT 1)
         ORDER BY collected_date DESC`,
        [patient.id]
      ).catch(() => ({ rows: [] })),

      query(
        `SELECT id, study_code, modality, study_name, study_date, radiologist_name, status, findings, impression
         FROM patient_radiology_reports
         WHERE patient_id::text = $1 OR patient_id::text = (SELECT id FROM patients WHERE id = $1 LIMIT 1)
         ORDER BY study_date DESC`,
        [patient.id]
      ).catch(() => ({ rows: [] })),

      query(
        `SELECT v.visit_id, v.visit_date, v.visit_type, v.status, dept.name AS department_name, doc.name AS doctor_name
         FROM visits v
         LEFT JOIN departments dept ON dept.id = v.department_id
         LEFT JOIN doctors doc ON doc.id = v.doctor_id
         WHERE v.patient_id = $1
         ORDER BY v.visit_date DESC
         LIMIT 10`,
        [patient.id]
      ).catch(() => ({ rows: [] })),

      query(
        `SELECT cr.*, doc.name AS doctor_name, dept.name AS department_name
         FROM consultation_records cr
         LEFT JOIN doctors doc ON doc.id = cr.doctor_id
         LEFT JOIN departments dept ON dept.id = cr.department_id
         WHERE cr.patient_id = $1
         ORDER BY cr.consultation_date DESC, cr.created_at DESC
         LIMIT 10`,
        [patient.id]
      ).catch(() => ({ rows: [] })),
    ]);

    res.json({
      success: true,
      patient,
      clinical_records: {
        medical_history: historyRes.rows,
        prescriptions: rxRes.rows,
        lab_reports: labRes.rows,
        radiology_reports: radRes.rows,
        previous_visits: visitsRes.rows,
        past_consultations: pastConsultsRes.rows,
      },
    });
  })
);

/**
 * POST /api/v1/doctor/consultations/complete
 * Comprehensive EHR encounter finalization: saves clinical findings, vitals, diagnosis, prescriptions, orders, and completes visit.
 */
router.post(
  '/consultations/complete',
  asyncHandler(async (req, res) => {
    const {
      token_id,
      visit_id,
      patient_id,
      doctor_id = 1,
      chief_complaint = '',
      vitals = {},
      examination_findings = '',
      diagnosis = '',
      clinical_assessment = '',
      treatment_plan = '',
      follow_up_advice = '',
      follow_up_date = null,
      prescriptions = [],
      lab_orders = [],
    } = req.body || {};

    if (!patient_id) {
      return res.status(400).json({ success: false, error: 'Patient ID is required.' });
    }

    const doctor = await resolveDoctor(doctor_id);
    const docId = doctor.id;
    const deptId = doctor.department_id;
    const consultationId = `CNS-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Insert Consultation Record
      const rxSummary = prescriptions.map((p) => `${p.medication_name} (${p.dosage}, ${p.frequency})`).join('; ');
      const labSummary = lab_orders.map((l) => l.test_name).join('; ');

      const consultRes = await client.query(
        `INSERT INTO consultation_records (
          consultation_id, visit_id, token_id, patient_id, doctor_id, department_id,
          consultation_date, chief_complaint, vitals, examination_findings, diagnosis,
          clinical_assessment, treatment_plan, follow_up_advice, follow_up_date,
          prescriptions_summary, lab_orders_summary, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, CURRENT_DATE, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW()
        ) RETURNING *`,
        [
          consultationId,
          visit_id || `VST-${consultationId}`,
          token_id || null,
          patient_id,
          docId,
          deptId,
          chief_complaint,
          JSON.stringify(vitals || {}),
          examination_findings,
          diagnosis,
          clinical_assessment,
          treatment_plan,
          follow_up_advice,
          follow_up_date || null,
          rxSummary || null,
          labSummary || null,
        ]
      );

      const savedConsultation = consultRes.rows[0];

      // 2. If Diagnosis provided, write into patient_medical_history
      if (diagnosis && diagnosis.trim()) {
        await client.query(
          `INSERT INTO patient_medical_history (
            patient_id, record_type, title, recorded_date, doctor_name, department_name, status, summary
          ) VALUES (
            (SELECT id FROM patients WHERE id = $1 OR patient_id = $1 LIMIT 1),
            'Diagnosis', $2, CURRENT_DATE, $3, $4, 'Active', $5
          )`,
          [
            patient_id,
            diagnosis.trim(),
            doctor.name,
            doctor.department_name,
            clinical_assessment || treatment_plan || 'Consultation diagnosis recorded by attending physician.',
          ]
        ).catch((err) => console.warn('Could not insert medical history record:', err.message));
      }

      // 3. Insert Prescriptions
      if (Array.isArray(prescriptions) && prescriptions.length > 0) {
        for (const rx of prescriptions) {
          if (rx.medication_name && rx.medication_name.trim()) {
            await client.query(
              `INSERT INTO patient_prescriptions (
                patient_id, medication_name, dosage, frequency, duration,
                prescribed_by, prescribed_date, status, refills_remaining, instructions
              ) VALUES (
                (SELECT id FROM patients WHERE id = $1 OR patient_id = $1 LIMIT 1),
                $2, $3, $4, $5, $6, CURRENT_DATE, 'Active', $7, $8
              )`,
              [
                patient_id,
                rx.medication_name.trim(),
                rx.dosage || 'Standard dose',
                rx.frequency || 'Once daily',
                rx.duration || '7 days',
                doctor.name,
                Number(rx.refills_remaining) || 0,
                rx.instructions || 'Take as advised with water.',
              ]
            ).catch((err) => console.warn('Could not insert prescription:', err.message));
          }
        }
      }

      // 4. Insert Lab Orders
      if (Array.isArray(lab_orders) && lab_orders.length > 0) {
        for (const order of lab_orders) {
          if (order.test_name && order.test_name.trim()) {
            const reportCode = `LAB-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 90 + 10)}`;
            await client.query(
              `INSERT INTO patient_lab_reports (
                patient_id, report_code, test_name, category, collected_date, ordered_by, status, summary, results_json
              ) VALUES (
                (SELECT id FROM patients WHERE id = $1 OR patient_id = $1 LIMIT 1),
                $2, $3, $4, CURRENT_DATE, $5, 'Ordered', $6, '[]'::jsonb
              )`,
              [
                patient_id,
                reportCode,
                order.test_name.trim(),
                order.category || 'Clinical Pathology',
                doctor.name,
                order.clinical_notes || 'Diagnostic investigation ordered during OPD consultation.',
              ]
            ).catch((err) => console.warn('Could not insert lab report order:', err.message));
          }
        }
      }

      // 5. Complete Token if associated
      if (token_id) {
        await client.query(
          `UPDATE tokens
           SET status = 'Completed',
               consultation_end_at = NOW(),
               updated_at = NOW()
           WHERE token_id = $1`,
          [token_id]
        );
      }

      // 6. Complete Visit if associated
      if (visit_id) {
        await client.query(
          `UPDATE visits
           SET status = 'Completed',
               updated_at = NOW()
           WHERE visit_id = $1`,
          [visit_id]
        );
      }

      // 7. Audit Log
      await client.query(
        `INSERT INTO audit_logs (action, entity, entity_type, entity_id, timestamp, details)
         VALUES ('DOCTOR_CONSULTATION_COMPLETED', 'consultation_records', 'consultations', $1, NOW(), $2)`,
        [
          consultationId,
          JSON.stringify({
            patient_id,
            doctor_name: doctor.name,
            diagnosis,
            prescriptions_count: prescriptions.length,
            lab_orders_count: lab_orders.length,
            token_id,
          }),
        ]
      );

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Clinical consultation concluded and EHR encounter record saved successfully.',
        consultation: savedConsultation,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error completing consultation:', err);
      res.status(500).json({ success: false, error: 'Failed to record consultation.', details: err.message });
    } finally {
      client.release();
    }
  })
);

/**
 * GET /api/v1/doctor/appointments
 * Today's and upcoming appointments roster for this doctor.
 */
router.get(
  '/appointments',
  asyncHandler(async (req, res) => {
    const { doctor_id = 1, date } = req.query;
    const doctor = await resolveDoctor(doctor_id);
    const targetDate = date || new Date().toISOString().slice(0, 10);

    const apptRes = await query(
      `SELECT 
         a.id,
         a.booking_reference,
         a.appointment_date,
         a.time_slot,
         a.visit_type,
         a.patient_name,
         a.patient_phone,
         a.patient_email,
         a.patient_gender,
         a.reason_for_visit,
         a.status,
         a.created_at,
         a.patient_id,
         a.visit_id,
         a.check_in_time
       FROM appointments a
       WHERE (a.doctor_id = $1 OR a.doctor_slug = $2)
         AND a.appointment_date = $3::date
       ORDER BY a.time_slot ASC, a.created_at ASC`,
      [doctor.id, doctor.slug, targetDate]
    );

    res.json({
      success: true,
      doctor_id: doctor.id,
      date: targetDate,
      count: apptRes.rows.length,
      appointments: apptRes.rows,
    });
  })
);

/**
 * GET /api/v1/doctor/history
 * History of consultations completed today by this doctor.
 */
router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const { doctor_id = 1, date } = req.query;
    const doctor = await resolveDoctor(doctor_id);
    const targetDate = date || new Date().toISOString().slice(0, 10);

    const historyRes = await query(
      `SELECT 
         cr.id,
         cr.consultation_id,
         cr.visit_id,
         cr.token_id,
         cr.consultation_date,
         cr.chief_complaint,
         cr.vitals,
         cr.diagnosis,
         cr.clinical_assessment,
         cr.treatment_plan,
         cr.follow_up_advice,
         cr.follow_up_date,
         cr.prescriptions_summary,
         cr.lab_orders_summary,
         cr.created_at,
         p.id AS patient_id,
         COALESCE(p.patient_id, p.id) AS patient_code,
         COALESCE(p.full_name, 'Patient') AS patient_name,
         p.gender,
         p.dob,
         p.blood_group,
         p.mobile,
         t.token_display,
         ROUND(EXTRACT(EPOCH FROM (t.consultation_end_at - t.consultation_start_at)) / 60)::int AS duration_mins
       FROM consultation_records cr
       JOIN patients p ON p.id = cr.patient_id
       LEFT JOIN tokens t ON t.token_id = cr.token_id
       WHERE cr.doctor_id = $1
         AND cr.consultation_date = $2::date
       ORDER BY cr.created_at DESC`,
      [doctor.id, targetDate]
    );

    res.json({
      success: true,
      doctor_id: doctor.id,
      date: targetDate,
      count: historyRes.rows.length,
      consultations: historyRes.rows,
    });
  })
);

export default router;
