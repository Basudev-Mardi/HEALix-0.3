import { Router } from 'express';
import { query, pool } from '../db.js';

const router = Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * GET /api/v1/nurse/dashboard
 * Telemetry summary of ward bed occupancy, pending medications, and active alerts.
 */
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const { ward_id = 'WRD-002' } = req.query;

    // 1. Bed Statistics
    const bedsRes = await query(`
      SELECT 
        COUNT(*)::int AS total_beds,
        COUNT(*) FILTER (WHERE status = 'Occupied')::int AS occupied_beds,
        COUNT(*) FILTER (WHERE status = 'Available')::int AS available_beds,
        COUNT(*) FILTER (WHERE status = 'Maintenance' OR cleaning_status = 'Dirty')::int AS dirty_maintenance_beds
      FROM ipd_beds
      WHERE ward_id = $1 OR ward = 'Ward B'
    `, [ward_id]);

    const bedStats = bedsRes.rows[0] || {
      total_beds: 10,
      occupied_beds: 0,
      available_beds: 10,
      dirty_maintenance_beds: 0,
    };

    // 2. Pending MAR Medications Count
    const marRes = await query(`
      SELECT 
        COUNT(*)::int AS total_meds_today,
        COUNT(*) FILTER (WHERE status = 'Pending')::int AS pending_meds,
        COUNT(*) FILTER (WHERE status = 'Administered')::int AS administered_meds
      FROM nurse_mar
      WHERE DATE(created_at) = CURRENT_DATE OR status = 'Pending'
    `);
    const marStats = marRes.rows[0] || {
      total_meds_today: 0,
      pending_meds: 0,
      administered_meds: 0,
    };

    // 3. Active Emergency Codes
    const alertsRes = await query(`
      SELECT * FROM nurse_code_alerts
      WHERE status = 'Active'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // 4. Emergency Triage Waiting from Reception
    const triageRes = await query(`
      SELECT COUNT(*)::int AS count
      FROM tokens
      WHERE queue_date = CURRENT_DATE 
        AND priority IN ('Emergency', 'Urgent')
        AND status = 'Waiting'
    `);
    const emergencyWaiting = triageRes.rows[0]?.count || 0;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      ward: {
        id: ward_id,
        name: 'Ward B (Cardiac Inpatient Ward)',
        location: 'Wing B - Floor 2',
        incharge: 'Sister Claire Bennett, RN',
        shift: 'Day Nursing Shift (08:00 - 16:00)',
      },
      stats: {
        total_beds: bedStats.total_beds,
        occupied_beds: bedStats.occupied_beds,
        available_beds: bedStats.available_beds,
        dirty_maintenance_beds: bedStats.dirty_maintenance_beds,
        occupancy_rate: bedStats.total_beds > 0 ? Math.round((bedStats.occupied_beds / bedStats.total_beds) * 100) : 0,
        pending_meds: marStats.pending_meds,
        administered_meds: marStats.administered_meds,
        active_codes: alertsRes.rows.length,
        emergency_triage_waiting: emergencyWaiting,
      },
      active_codes: alertsRes.rows,
    });
  })
);

/**
 * GET /api/v1/nurse/beds
 * Full list of beds in ward with current occupant, diagnosis, and vitals summary.
 */
router.get(
  '/beds',
  asyncHandler(async (req, res) => {
    const { ward_id = 'WRD-002' } = req.query;

    const bedsRes = await query(`
      SELECT 
        b.id AS bed_id,
        b.bed_number,
        b.bed_type,
        b.status AS bed_status,
        b.room,
        b.ward,
        b.cleaning_status,
        b.is_isolation,
        a.id AS admission_id,
        a.admission_date,
        a.admitting_doctor,
        a.diagnosis,
        p.id AS patient_id,
        p.patient_id AS patient_code,
        p.full_name AS patient_name,
        p.gender,
        p.dob,
        p.blood_group,
        p.allergies,
        v.bp_systolic,
        v.bp_diastolic,
        v.pulse,
        v.temperature,
        v.spo2,
        v.resp_rate,
        v.pain_scale,
        v.created_at AS last_vitals_at
      FROM ipd_beds b
      LEFT JOIN ipd_admissions a ON a.id = b.current_admission_id AND a.status = 'Admitted'
      LEFT JOIN patients p ON p.id = a.patient_id
      LEFT JOIN LATERAL (
        SELECT * FROM nurse_vitals
        WHERE bed_id = b.id
        ORDER BY created_at DESC
        LIMIT 1
      ) v ON true
      WHERE b.ward_id = $1 OR b.ward = 'Ward B'
      ORDER BY b.bed_number ASC
    `, [ward_id]);

    res.json({
      success: true,
      count: bedsRes.rows.length,
      beds: bedsRes.rows,
    });
  })
);

/**
 * POST /api/v1/nurse/vitals
 * Log patient vitals & observations into chart.
 */
router.post(
  '/vitals',
  asyncHandler(async (req, res) => {
    const {
      bed_id,
      patient_id,
      recorded_by = 'Sister Claire Bennett, RN',
      bp_systolic,
      bp_diastolic,
      pulse,
      temperature,
      spo2,
      resp_rate,
      pain_scale = 0,
      blood_glucose,
      notes = '',
    } = req.body;

    if (!bed_id || !patient_id) {
      return res.status(400).json({ success: false, error: 'bed_id and patient_id are required.' });
    }

    const result = await query(`
      INSERT INTO nurse_vitals (
        bed_id, patient_id, recorded_by, bp_systolic, bp_diastolic,
        pulse, temperature, spo2, resp_rate, pain_scale, blood_glucose, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      bed_id,
      patient_id,
      recorded_by,
      bp_systolic ? Number(bp_systolic) : null,
      bp_diastolic ? Number(bp_diastolic) : null,
      pulse ? Number(pulse) : null,
      temperature ? Number(temperature) : null,
      spo2 ? Number(spo2) : null,
      resp_rate ? Number(resp_rate) : null,
      Number(pain_scale) || 0,
      blood_glucose ? Number(blood_glucose) : null,
      notes.trim(),
    ]);

    res.json({
      success: true,
      vitals: result.rows[0],
      message: 'Vitals observation successfully logged.',
    });
  })
);

/**
 * GET /api/v1/nurse/mar
 * Medication Administration Record list for ward / patient.
 */
router.get(
  '/mar',
  asyncHandler(async (req, res) => {
    const { bed_id, patient_id } = req.query;

    let sql = `
      SELECT 
        m.*,
        p.full_name AS patient_name,
        p.blood_group,
        p.allergies,
        b.bed_number,
        b.room
      FROM nurse_mar m
      JOIN patients p ON p.id = m.patient_id
      JOIN ipd_beds b ON b.id = m.bed_id
      WHERE 1=1
    `;
    const params = [];

    if (bed_id) {
      params.push(bed_id);
      sql += ` AND m.bed_id = $${params.length}`;
    }
    if (patient_id) {
      params.push(patient_id);
      sql += ` AND m.patient_id = $${params.length}`;
    }

    sql += ` ORDER BY CASE WHEN m.status = 'Pending' THEN 0 ELSE 1 END, m.created_at DESC`;

    const result = await query(sql, params);

    res.json({
      success: true,
      count: result.rows.length,
      mar: result.rows,
    });
  })
);

/**
 * POST /api/v1/nurse/mar/:id/administer
 * Sign off / record medication administration.
 */
router.post(
  '/mar/:id/administer',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      status = 'Administered',
      administered_by = 'Sister Claire Bennett, RN',
      notes = '',
    } = req.body;

    const result = await query(`
      UPDATE nurse_mar
      SET 
        status = $1,
        administered_by = $2,
        administered_at = CURRENT_TIMESTAMP,
        notes = COALESCE(NULLIF($3, ''), notes)
      WHERE id = $4
      RETURNING *
    `, [status, administered_by, notes.trim(), id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Medication order not found.' });
    }

    res.json({
      success: true,
      mar: result.rows[0],
      message: `Medication status updated to ${status}.`,
    });
  })
);

/**
 * POST /api/v1/nurse/beds/:id/clean
 * Update bed sanitation / cleaning status.
 */
router.post(
  '/beds/:id/clean',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { cleaning_status = 'Cleaned' } = req.body;

    const result = await query(`
      UPDATE ipd_beds
      SET cleaning_status = $1
      WHERE id = $2
      RETURNING *
    `, [cleaning_status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Bed not found.' });
    }

    res.json({
      success: true,
      bed: result.rows[0],
      message: `Bed sanitation updated to ${cleaning_status}.`,
    });
  })
);

/**
 * GET /api/v1/nurse/handovers
 * Get shift handover notes.
 */
router.get(
  '/handovers',
  asyncHandler(async (req, res) => {
    const result = await query(`
      SELECT * FROM nurse_handovers
      ORDER BY created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      count: result.rows.length,
      handovers: result.rows,
    });
  })
);

/**
 * POST /api/v1/nurse/handovers
 * Submit end-of-shift handover summary.
 */
router.post(
  '/handovers',
  asyncHandler(async (req, res) => {
    const {
      ward_id = 'WRD-002',
      shift_name = 'Day Nursing Shift (08:00 - 16:00)',
      nurse_name = 'Sister Claire Bennett, RN',
      handover_notes,
      high_risk_patients = '',
      pending_tasks = '',
    } = req.body;

    if (!handover_notes || !handover_notes.trim()) {
      return res.status(400).json({ success: false, error: 'Handover notes are required.' });
    }

    const result = await query(`
      INSERT INTO nurse_handovers (
        ward_id, shift_name, nurse_name, handover_notes, high_risk_patients, pending_tasks
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      ward_id,
      shift_name,
      nurse_name,
      handover_notes.trim(),
      high_risk_patients.trim(),
      pending_tasks.trim(),
    ]);

    res.json({
      success: true,
      handover: result.rows[0],
      message: 'Shift handover summary recorded successfully.',
    });
  })
);

/**
 * POST /api/v1/nurse/code-alert
 * Trigger hospital code alert (Code Blue, Rapid Response, etc.).
 */
router.post(
  '/code-alert',
  asyncHandler(async (req, res) => {
    const {
      code_type = 'Rapid Response',
      ward = 'Ward B (Cardiac)',
      bed_number = '',
      patient_name = '',
      initiator = 'Sister Claire Bennett, RN',
    } = req.body;

    const result = await query(`
      INSERT INTO nurse_code_alerts (
        code_type, ward, bed_number, patient_name, initiator, status
      ) VALUES ($1, $2, $3, $4, $5, 'Active')
      RETURNING *
    `, [code_type, ward, bed_number, patient_name, initiator]);

    res.json({
      success: true,
      alert: result.rows[0],
      message: `Emergency Alert ${code_type} broadcast across clinical station!`,
    });
  })
);

/**
 * POST /api/v1/nurse/code-alert/:id/resolve
 * Resolve an active code alert.
 */
router.post(
  '/code-alert/:id/resolve',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await query(`
      UPDATE nurse_code_alerts
      SET status = 'Resolved', resolved_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);

    res.json({
      success: true,
      alert: result.rows[0],
      message: 'Code alert marked as resolved.',
    });
  })
);

export default router;
