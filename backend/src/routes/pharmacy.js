import { Router } from 'express';
import { query, pool } from '../db.js';

const router = Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * GET /api/v1/pharmacy/dashboard
 * Telemetry summary for Central Pharmacy Dispensary & Inventory.
 */
router.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    // 1. Prescription stats
    const rxStatsRes = await query(`
      SELECT
        COUNT(*)::int AS total_prescriptions,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_prescriptions,
        COUNT(*) FILTER (WHERE status = 'dispensed' OR DATE(updated_at) = CURRENT_DATE)::int AS dispensed_today
      FROM pharmacy_prescriptions
    `);

    const rxStats = rxStatsRes.rows[0] || {
      total_prescriptions: 0,
      pending_prescriptions: 0,
      dispensed_today: 0,
    };

    // 2. Inventory stats & Stock health
    const invStatsRes = await query(`
      SELECT
        COUNT(DISTINCT m.id)::int AS total_medicines,
        COUNT(DISTINCT m.id) FILTER (
          WHERE COALESCE(stock_summary.total_available, 0) <= m.min_stock_threshold
        )::int AS low_stock_count,
        COUNT(b.id) FILTER (
          WHERE b.status = 'Active' AND b.expiry_date <= CURRENT_DATE + INTERVAL '60 days'
        )::int AS expiring_soon_count
      FROM pharmacy_medicines m
      LEFT JOIN (
        SELECT medicine_id, SUM(remaining_qty)::int AS total_available
        FROM pharmacy_batches
        WHERE status = 'Active' AND expiry_date > CURRENT_DATE
        GROUP BY medicine_id
      ) stock_summary ON stock_summary.medicine_id = m.id
      LEFT JOIN pharmacy_batches b ON b.medicine_id = m.id
      WHERE m.is_active = true
    `);

    const invStats = invStatsRes.rows[0] || {
      total_medicines: 0,
      low_stock_count: 0,
      expiring_soon_count: 0,
    };

    // 3. Low stock alert items (top 5 critical)
    const lowStockAlertsRes = await query(`
      SELECT 
        m.id,
        m.medicine_code,
        m.medicine_name,
        m.category,
        m.min_stock_threshold,
        COALESCE(SUM(b.remaining_qty), 0)::int AS current_stock
      FROM pharmacy_medicines m
      LEFT JOIN pharmacy_batches b ON b.medicine_id = m.id AND b.status = 'Active' AND b.expiry_date > CURRENT_DATE
      WHERE m.is_active = true
      GROUP BY m.id, m.medicine_code, m.medicine_name, m.category, m.min_stock_threshold
      HAVING COALESCE(SUM(b.remaining_qty), 0) <= m.min_stock_threshold
      ORDER BY (m.min_stock_threshold - COALESCE(SUM(b.remaining_qty), 0)) DESC
      LIMIT 6
    `);

    // 4. Pending prescriptions queue
    const pendingRxRes = await query(`
      SELECT 
        p.id,
        p.patient_id,
        p.patient_name,
        p.doctor_name,
        p.items,
        p.status,
        p.prescribed_at
      FROM pharmacy_prescriptions p
      WHERE p.status = 'pending'
      ORDER BY p.prescribed_at ASC
      LIMIT 6
    `);

    res.json({
      success: true,
      stats: {
        pending_prescriptions: rxStats.pending_prescriptions,
        dispensed_today: rxStats.dispensed_today,
        total_medicines: invStats.total_medicines,
        low_stock_items: invStats.low_stock_count,
        expiring_soon_batches: invStats.expiring_soon_count,
      },
      low_stock_alerts: lowStockAlertsRes.rows,
      pending_prescriptions: pendingRxRes.rows,
    });
  })
);

/**
 * GET /api/v1/pharmacy/prescriptions
 * Filterable electronic prescriptions worklist.
 */
router.get(
  '/prescriptions',
  asyncHandler(async (req, res) => {
    const { status = 'all', search } = req.query;

    let queryText = `
      SELECT 
        p.id,
        p.patient_id,
        p.patient_name,
        p.doctor_name,
        p.items,
        p.status,
        p.validated_by,
        p.validated_at,
        p.prescribed_at,
        p.updated_at
      FROM pharmacy_prescriptions p
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      queryText += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      queryText += ` AND (p.patient_name ILIKE $${paramIndex} OR p.id ILIKE $${paramIndex} OR p.doctor_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    queryText += ` ORDER BY CASE WHEN p.status = 'pending' THEN 1 ELSE 2 END, p.prescribed_at DESC`;

    const result = await query(queryText, params);
    res.json({
      success: true,
      data: result.rows,
    });
  })
);

/**
 * GET /api/v1/pharmacy/inventory
 * Complete medicines catalog with active batches and real-time stock balances.
 */
router.get(
  '/inventory',
  asyncHandler(async (req, res) => {
    const { category, search } = req.query;

    let queryText = `
      SELECT 
        m.id,
        m.medicine_code,
        m.medicine_name,
        m.generic_name,
        m.brand,
        m.category,
        m.strength,
        m.dosage_form,
        m.manufacturer,
        m.unit_price,
        m.min_stock_threshold,
        COALESCE(SUM(b.remaining_qty) FILTER (WHERE b.status = 'Active' AND b.expiry_date > CURRENT_DATE), 0)::int AS total_stock,
        (
          SELECT json_agg(json_build_object(
            'batch_id', pb.id,
            'batch_number', pb.batch_number,
            'remaining_qty', pb.remaining_qty,
            'expiry_date', pb.expiry_date,
            'status', pb.status
          ) ORDER BY pb.expiry_date ASC)
          FROM pharmacy_batches pb
          WHERE pb.medicine_id = m.id AND pb.remaining_qty > 0
        ) AS active_batches
      FROM pharmacy_medicines m
      LEFT JOIN pharmacy_batches b ON b.medicine_id = m.id
      WHERE m.is_active = true
    `;

    const params = [];
    let paramIndex = 1;

    if (category && category !== 'all') {
      queryText += ` AND m.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      queryText += ` AND (m.medicine_name ILIKE $${paramIndex} OR m.generic_name ILIKE $${paramIndex} OR m.medicine_code ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    queryText += `
      GROUP BY m.id, m.medicine_code, m.medicine_name, m.generic_name, m.brand, m.category, m.strength, m.dosage_form, m.manufacturer, m.unit_price, m.min_stock_threshold
      ORDER BY m.medicine_name ASC
    `;

    const result = await query(queryText, params);
    res.json({
      success: true,
      data: result.rows,
    });
  })
);

/**
 * POST /api/v1/pharmacy/dispense
 * Fulfill prescription, allocate stock from batch (FEFO), and record dispensing log.
 */
router.post(
  '/dispense',
  asyncHandler(async (req, res) => {
    const {
      prescription_id,
      patient_id,
      patient_name,
      items, // array of { medicine_id, medicine_name, batch_id, quantity, dosage_instructions }
      pharmacist_name = 'Priya Sharma, PharmD',
      counseling_notes = 'Patient counseled on proper dosing, timing, and storage.',
    } = req.body;

    if (!prescription_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing prescription_id or dispensable items array' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const dispensedRecords = [];

      for (const item of items) {
        const qtyToDispense = parseInt(item.quantity, 10) || 1;

        // 1. Locate best available batch (FEFO - First Expiry, First Out) if batch_id is not specified
        let targetBatchId = item.batch_id;
        let batchRow = null;

        if (targetBatchId) {
          const bRes = await client.query(
            `SELECT * FROM pharmacy_batches WHERE id = $1 AND remaining_qty >= $2 FOR UPDATE`,
            [targetBatchId, qtyToDispense]
          );
          batchRow = bRes.rows[0];
        } else {
          const bRes = await client.query(
            `SELECT * FROM pharmacy_batches 
             WHERE medicine_id = $1 AND status = 'Active' AND expiry_date > CURRENT_DATE AND remaining_qty >= $2
             ORDER BY expiry_date ASC
             LIMIT 1
             FOR UPDATE`,
            [item.medicine_id, qtyToDispense]
          );
          batchRow = bRes.rows[0];
        }

        if (!batchRow) {
          throw new Error(`Insufficient stock for medication "${item.medicine_name || item.medicine_id}". Required: ${qtyToDispense}`);
        }

        const newRemaining = batchRow.remaining_qty - qtyToDispense;

        // 2. Decrement batch remaining quantity
        await client.query(
          `UPDATE pharmacy_batches SET remaining_qty = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [newRemaining, batchRow.id]
        );

        // 3. Log stock movement
        await client.query(
          `INSERT INTO pharmacy_stock_movements (medicine_id, batch_id, movement_type, quantity_delta, balance_after, reason, performed_by)
           VALUES ($1, $2, 'dispense', $3, $4, $5, $6)`,
          [
            item.medicine_id,
            batchRow.id,
            -qtyToDispense,
            newRemaining,
            `Dispensed for Prescription ${prescription_id} (${patient_name})`,
            pharmacist_name,
          ]
        );

        // 4. Create dispensing record
        const dispId = `DISP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
        const dispRes = await client.query(
          `INSERT INTO pharmacy_dispensings (
            id, prescription_id, patient_id, patient_name,
            medicine_id, medicine_name, batch_id, batch_number,
            expiry_date, quantity_dispensed, dosage_instructions,
            dispensed_by, dispensed_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
          RETURNING *`,
          [
            dispId,
            prescription_id,
            patient_id || 'PAT-WALKIN',
            patient_name || 'Walk-in Patient',
            item.medicine_id,
            item.medicine_name || 'Prescribed Medicine',
            batchRow.id,
            batchRow.batch_number,
            batchRow.expiry_date,
            qtyToDispense,
            item.dosage_instructions || item.instructions || 'As directed by physician',
            pharmacist_name,
          ]
        );

        dispensedRecords.push(dispRes.rows[0]);
      }

      // 5. Update pharmacy_prescriptions status to 'dispensed'
      await client.query(
        `UPDATE pharmacy_prescriptions 
         SET 
           status = 'dispensed',
           validated_by = $1,
           validated_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [pharmacist_name, prescription_id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Prescription ${prescription_id} successfully validated, dispensed, and inventory deducted.`,
        dispensed: dispensedRecords,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: err.message || 'Dispensing failed' });
    } finally {
      client.release();
    }
  })
);

/**
 * POST /api/v1/pharmacy/inventory/stock-in
 * Receive fresh medicine batch into pharmacy stock inventory.
 */
router.post(
  '/inventory/stock-in',
  asyncHandler(async (req, res) => {
    const {
      medicine_id,
      batch_number,
      manufacturer,
      initial_qty,
      unit_cost = 0.50,
      expiry_date,
      performed_by = 'Priya Sharma, PharmD',
    } = req.body;

    if (!medicine_id || !batch_number || !initial_qty || !expiry_date) {
      return res.status(400).json({ error: 'Missing required batch fields (medicine_id, batch_number, initial_qty, expiry_date)' });
    }

    const qty = parseInt(initial_qty, 10);
    const batchId = `BCH-${Date.now().toString().slice(-6)}`;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Insert new batch
      const batchRes = await client.query(
        `INSERT INTO pharmacy_batches (
          id, batch_number, medicine_id, manufacturer,
          initial_qty, remaining_qty, purchase_date,
          manufacturing_date, expiry_date, unit_cost, status
        ) VALUES ($1, $2, $3, $4, $5, $5, CURRENT_DATE, CURRENT_DATE - INTERVAL '30 days', $6, $7, 'Active')
        RETURNING *`,
        [batchId, batch_number, medicine_id, manufacturer || 'Healix Authorized Supplier', qty, expiry_date, unit_cost]
      );

      // 2. Log stock movement
      await client.query(
        `INSERT INTO pharmacy_stock_movements (medicine_id, batch_id, movement_type, quantity_delta, balance_after, reason, performed_by)
         VALUES ($1, $2, 'purchase', $3, $3, 'Goods Receipt: Central Inpatient & OPD Pharmacy', $4)`,
        [medicine_id, batchId, qty, performed_by]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Batch ${batch_number} (${qty} units) accessioned into inventory.`,
        data: batchRes.rows[0],
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
 * GET /api/v1/pharmacy/dispensings
 * Audit trail of fulfilled dispensings.
 */
router.get(
  '/dispensings',
  asyncHandler(async (_req, res) => {
    const result = await query(`
      SELECT *
      FROM pharmacy_dispensings
      ORDER BY dispensed_at DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  })
);

export default router;
