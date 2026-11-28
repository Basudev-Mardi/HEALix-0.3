import { Router } from 'express';
import { query, pool } from '../db.js';

const router = Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * GET /api/v1/lab/dashboard
 * Telemetry summary for Diagnostic Laboratory Operations.
 */
router.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    // 1. Requisitions & Samples metrics
    const sampleStatsRes = await query(`
      SELECT
        COUNT(*)::int AS total_requests,
        COUNT(*) FILTER (WHERE status IN ('pending', 'sample_collected', 'requested'))::int AS pending_intake,
        COUNT(*) FILTER (WHERE status IN ('in_analysis', 'sample_received', 'processing'))::int AS in_analysis,
        COUNT(*) FILTER (WHERE status IN ('completed', 'released') OR DATE(updated_at) = CURRENT_DATE)::int AS completed_today,
        COUNT(*) FILTER (WHERE priority IN ('Stat', 'Urgent') AND status != 'completed')::int AS urgent_pending
      FROM lab_requests
    `);

    const stats = sampleStatsRes.rows[0] || {
      total_requests: 0,
      pending_intake: 0,
      in_analysis: 0,
      completed_today: 0,
      urgent_pending: 0,
    };

    // 2. Equipment Calibration Health
    const equipStatsRes = await query(`
      SELECT
        COUNT(*)::int AS total_analyzers,
        COUNT(*) FILTER (WHERE status = 'Calibrated' AND qc_passed = true)::int AS calibrated_count,
        COUNT(*) FILTER (WHERE status != 'Calibrated' OR qc_passed = false OR next_due_date <= CURRENT_DATE)::int AS maintenance_due_count
      FROM lab_equipment_calibration
    `);

    const equipStats = equipStatsRes.rows[0] || {
      total_analyzers: 4,
      calibrated_count: 4,
      maintenance_due_count: 0,
    };

    // 3. Active Panic / Critical Value Alerts
    const panicAlertsRes = await query(`
      SELECT *
      FROM lab_panic_alerts
      WHERE status = 'Pending Physician Acknowledgment'
      ORDER BY created_at DESC
      LIMIT 6
    `);

    // 4. Urgent Requisition Worklist (top priority)
    const urgentWorklistRes = await query(`
      SELECT 
        lr.id,
        lr.patient_id,
        lr.patient_name,
        lr.referring_doctor,
        lr.priority,
        lr.clinical_notes,
        lr.status,
        lr.requested_at,
        p.uhid,
        p.age,
        p.gender,
        p.blood_group
      FROM lab_requests lr
      LEFT JOIN patients p ON p.id = lr.patient_id
      WHERE lr.status != 'completed'
      ORDER BY 
        CASE WHEN lr.priority = 'Stat' THEN 1 WHEN lr.priority = 'Urgent' THEN 2 ELSE 3 END,
        lr.requested_at ASC
      LIMIT 8
    `);

    res.json({
      success: true,
      stats: {
        pending_intake: stats.pending_intake,
        in_analysis: stats.in_analysis,
        completed_today: stats.completed_today,
        urgent_pending: stats.urgent_pending,
        total_requests: stats.total_requests,
        total_analyzers: equipStats.total_analyzers,
        calibrated_analyzers: equipStats.calibrated_count,
        maintenance_due: equipStats.maintenance_due_count,
        active_panic_alerts: panicAlertsRes.rows.length,
      },
      urgent_worklist: urgentWorklistRes.rows,
      panic_alerts: panicAlertsRes.rows,
    });
  })
);

/**
 * GET /api/v1/lab/worklist
 * Filterable laboratory requisitions worklist with sample tracking.
 */
router.get(
  '/worklist',
  asyncHandler(async (req, res) => {
    const { status, priority, search } = req.query;

    let queryText = `
      SELECT 
        lr.id,
        lr.patient_id,
        lr.patient_name,
        lr.referring_doctor,
        lr.priority,
        lr.clinical_notes,
        lr.test_ids,
        lr.status AS request_status,
        lr.requested_at,
        p.uhid,
        p.gender,
        p.age,
        p.blood_group,
        p.phone_number,
        ls.id AS sample_id,
        ls.specimen_type,
        ls.status AS sample_status,
        ls.collected_at,
        ls.collected_by,
        ls.rejection_reason,
        ls.notes AS sample_notes,
        (
          SELECT json_agg(json_build_object(
            'id', lt.id,
            'test_code', lt.test_code,
            'test_name', lt.test_name,
            'category', lt.category,
            'department', lt.department,
            'unit', lt.unit,
            'reference_range_label', lt.reference_range_label
          ))
          FROM lab_tests lt
          WHERE lt.id = ANY(lr.test_ids)
        ) AS requested_tests
      FROM lab_requests lr
      LEFT JOIN patients p ON p.id = lr.patient_id
      LEFT JOIN lab_samples ls ON ls.request_id = lr.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      if (status === 'pending') {
        queryText += ` AND lr.status IN ('pending', 'sample_collected', 'requested')`;
      } else if (status === 'in_analysis') {
        queryText += ` AND lr.status IN ('in_analysis', 'sample_received', 'processing')`;
      } else if (status === 'completed') {
        queryText += ` AND lr.status = 'completed'`;
      } else {
        queryText += ` AND lr.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
    }

    if (priority && priority !== 'all') {
      queryText += ` AND lr.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (search) {
      queryText += ` AND (lr.patient_name ILIKE $${paramIndex} OR lr.id ILIKE $${paramIndex} OR p.uhid ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    queryText += `
      ORDER BY 
        CASE WHEN lr.priority = 'Stat' THEN 1 WHEN lr.priority = 'Urgent' THEN 2 ELSE 3 END,
        lr.requested_at DESC
    `;

    const result = await query(queryText, params);
    res.json({
      success: true,
      data: result.rows,
    });
  })
);

/**
 * GET /api/v1/lab/catalog
 * Complete diagnostic laboratory test catalog with reference ranges.
 */
router.get(
  '/catalog',
  asyncHandler(async (_req, res) => {
    const result = await query(`
      SELECT *
      FROM lab_tests
      WHERE is_active = true
      ORDER BY category ASC, test_name ASC
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  })
);

/**
 * POST /api/v1/lab/samples/intake
 * Acknowledge specimen receipt, scan barcode accession, or reject compromised specimen.
 */
router.post(
  '/samples/intake',
  asyncHandler(async (req, res) => {
    const {
      request_id,
      sample_id,
      barcode,
      specimen_type = 'Blood (Serum / Plasma)',
      action = 'received', // 'received' or 'rejected'
      rejection_reason,
      notes,
      operator_name = 'Marcus Vance, CLS',
    } = req.body;

    if (!request_id) {
      return res.status(400).json({ error: 'Missing request_id for specimen intake' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const status = action === 'rejected' ? 'rejected' : 'received';
      const historyEntry = {
        action,
        timestamp: new Date().toISOString(),
        operator: operator_name,
        barcode: barcode || `BC-${Date.now().toString().slice(-6)}`,
        notes: notes || (action === 'rejected' ? rejection_reason : 'Specimen verified, integrity intact.'),
      };

      let assignedSampleId = sample_id;

      if (sample_id) {
        // Update existing sample
        await client.query(
          `
          UPDATE lab_samples
          SET 
            status = $1,
            rejection_reason = $2,
            notes = COALESCE($3, notes),
            tracking_history = COALESCE(tracking_history, '[]'::jsonb) || $4::jsonb,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
        `,
          [status, action === 'rejected' ? rejection_reason : null, notes, JSON.stringify([historyEntry]), sample_id]
        );
      } else {
        // Create new accessioned sample
        const genSampleId = `SMP-${Date.now().toString().slice(-6)}`;
        assignedSampleId = genSampleId;

        const reqRow = await client.query(`SELECT patient_id FROM lab_requests WHERE id = $1`, [request_id]);
        const patientId = reqRow.rows[0]?.patient_id || 'PAT-DEFAULT';

        await client.query(
          `
          INSERT INTO lab_samples (id, request_id, patient_id, specimen_type, collected_by, collected_at, status, rejection_reason, notes, tracking_history)
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, $7, $8, $9)
        `,
          [
            genSampleId,
            request_id,
            patientId,
            specimen_type,
            operator_name,
            status,
            action === 'rejected' ? rejection_reason : null,
            notes,
            JSON.stringify([historyEntry]),
          ]
        );
      }

      // Update lab_request status
      const newReqStatus = action === 'rejected' ? 'sample_rejected' : 'in_analysis';
      await client.query(
        `
        UPDATE lab_requests
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `,
        [newReqStatus, request_id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: action === 'rejected' ? 'Specimen rejected with documented reason' : 'Specimen accessioned & routed to analyzer queue',
        sample_id: assignedSampleId,
        status,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

/**
 * POST /api/v1/lab/reports/authorize
 * Authorize diagnostic report, publish to patient record, and optionally flag critical panic alerts.
 */
router.post(
  '/reports/authorize',
  asyncHandler(async (req, res) => {
    const {
      request_id,
      patient_id,
      patient_name,
      referring_doctor,
      test_name,
      category = 'General Pathology',
      specimen_type = 'Whole Blood',
      pathologist_name = 'Dr. Sarah Lin, MD (Chief Pathologist)',
      verified_by = 'Marcus Vance, CLS',
      results_summary,
      results_json, // array of { parameter, result, unit, ref_range, flag, is_critical }
      is_critical = false,
      critical_note,
    } = req.body;

    if (!request_id || !patient_id || !test_name) {
      return res.status(400).json({ error: 'Missing required report fields (request_id, patient_id, test_name)' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const reportCode = `REP-${Date.now().toString().slice(-6)}`;

      // 1. Insert into lab_reports
      const labReportRes = await client.query(
        `
        INSERT INTO lab_reports (
          request_id, patient_id, patient_name, referring_doctor,
          verified_by, generated_by, report_code, test_name,
          category, specimen_type, status, results_summary, results_json, released_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'completed', $11, $12, CURRENT_DATE)
        RETURNING *
      `,
        [
          request_id,
          patient_id,
          patient_name,
          referring_doctor,
          verified_by,
          pathologist_name,
          reportCode,
          test_name,
          category,
          specimen_type,
          results_summary || 'Analysis authorized and electronically certified.',
          JSON.stringify(results_json || []),
        ]
      );

      // 2. Publish to patient_lab_reports for Patient Portal EHR
      await client.query(
        `
        INSERT INTO patient_lab_reports (
          patient_id, report_code, test_name, category, collected_date, ordered_by, status, summary, results_json
        )
        VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, 'Available', $6, $7)
      `,
        [
          patient_id,
          reportCode,
          test_name,
          category,
          referring_doctor || 'Attending Physician',
          results_summary || 'Normal physiological ranges verified.',
          JSON.stringify(results_json || []),
        ]
      );

      // 3. Update lab_request to completed
      await client.query(
        `
        UPDATE lab_requests
        SET status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
        [request_id]
      );

      // 4. Update lab_samples to completed
      await client.query(
        `
        UPDATE lab_samples
        SET status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE request_id = $1
      `,
        [request_id]
      );

      // 5. If marked as critical finding, register panic alert automatically
      if (is_critical && Array.isArray(results_json)) {
        const criticalParams = results_json.filter((p) => p.is_critical || p.flag === 'critical' || p.flag === 'high');
        for (const crit of criticalParams) {
          await client.query(
            `
            INSERT INTO lab_panic_alerts (
              report_id, patient_id, patient_name, test_name, parameter,
              measured_value, critical_limit, doctor_name, flagged_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `,
            [
              reportCode,
              patient_id,
              patient_name,
              test_name,
              crit.parameter || crit.name || 'Critical Analyte',
              crit.result || crit.value || 'Abnormal',
              crit.ref_range || crit.reference_range || 'Out of Bounds',
              referring_doctor || 'Attending Physician',
              verified_by,
            ]
          );
        }
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Laboratory report successfully authorized and certified for clinical release.',
        report_code: reportCode,
        data: labReportRes.rows[0],
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

/**
 * POST /api/v1/lab/panic-alert
 * Manually broadcast a Panic Value Alert to attending medical team.
 */
router.post(
  '/panic-alert',
  asyncHandler(async (req, res) => {
    const {
      patient_id,
      patient_name,
      test_name,
      parameter,
      measured_value,
      critical_limit,
      doctor_name = 'Attending Physician',
      flagged_by = 'Marcus Vance, CLS',
    } = req.body;

    if (!patient_id || !patient_name || !parameter || !measured_value) {
      return res.status(400).json({ error: 'Missing critical alert details (patient, parameter, measured_value)' });
    }

    const result = await query(
      `
      INSERT INTO lab_panic_alerts (
        patient_id, patient_name, test_name, parameter,
        measured_value, critical_limit, doctor_name, flagged_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      [patient_id, patient_name, test_name, parameter, measured_value, critical_limit, doctor_name, flagged_by]
    );

    res.json({
      success: true,
      message: 'Urgent panic alert logged and escalated to attending physician.',
      data: result.rows[0],
    });
  })
);

/**
 * POST /api/v1/lab/panic-alert/:id/acknowledge
 * Medical officer or lab staff acknowledges resolution/notification of panic value.
 */
router.post(
  '/panic-alert/:id/acknowledge',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { resolved_by = 'Marcus Vance, CLS' } = req.body;

    const result = await query(
      `
      UPDATE lab_panic_alerts
      SET 
        status = 'Acknowledged by Physician',
        acknowledged_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Panic alert record not found' });
    }

    res.json({
      success: true,
      message: 'Critical alert acknowledged.',
      data: result.rows[0],
    });
  })
);

/**
 * GET /api/v1/lab/equipment
 * List all automated diagnostic analyzers with calibration and QC status.
 */
router.get(
  '/equipment',
  asyncHandler(async (_req, res) => {
    const result = await query(`
      SELECT 
        id,
        analyzer_name,
        analyzer_code,
        department,
        last_calibration_date,
        next_due_date,
        status,
        qc_passed,
        calibrated_by,
        notes,
        CASE 
          WHEN next_due_date < CURRENT_DATE THEN 'Overdue'
          WHEN next_due_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'Due Soon'
          ELSE 'Valid'
        END AS urgency
      FROM lab_equipment_calibration
      ORDER BY next_due_date ASC, id ASC
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  })
);

/**
 * POST /api/v1/lab/equipment/:id/calibrate
 * Record an analyzer calibration / daily QC verification run.
 */
router.post(
  '/equipment/:id/calibrate',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      calibrated_by = 'Marcus Vance, CLS',
      qc_passed = true,
      notes = 'Standard multi-point calibration & control run completed successfully.',
      next_due_days = 14,
    } = req.body;

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + (parseInt(next_due_days, 10) || 14));
    const nextDueFormatted = nextDueDate.toISOString().split('T')[0];

    const result = await query(
      `
      UPDATE lab_equipment_calibration
      SET 
        last_calibration_date = CURRENT_TIMESTAMP,
        next_due_date = $1,
        status = 'Calibrated',
        qc_passed = $2,
        calibrated_by = $3,
        notes = $4
      WHERE id = $5
      RETURNING *
    `,
      [nextDueFormatted, qc_passed, calibrated_by, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analyzer equipment not found' });
    }

    res.json({
      success: true,
      message: `Analyzer calibration logged. Next verification due on ${nextDueFormatted}.`,
      data: result.rows[0],
    });
  })
);

export default router;
