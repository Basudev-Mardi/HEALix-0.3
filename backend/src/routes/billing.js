import { Router } from 'express';
import { query, pool } from '../db.js';

const router = Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * GET /api/v1/billing/dashboard
 * Telemetry summary for Patient Accounts & Revenue Cycle Operations.
 */
router.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    // 1. Total revenue collected today
    const revTodayRes = await query(`
      SELECT 
        COALESCE(SUM(amount), 0)::numeric AS total_collected_today,
        COUNT(*)::int AS transactions_today
      FROM billing_payments
      WHERE DATE(paid_at) = CURRENT_DATE
    `);

    const revToday = revTodayRes.rows[0] || {
      total_collected_today: 0,
      transactions_today: 0,
    };

    // 2. Pending Invoices & Outstanding Receivables
    const invStatsRes = await query(`
      SELECT 
        COUNT(*)::int AS total_invoices,
        COUNT(*) FILTER (WHERE status IN ('Pending', 'Partial'))::int AS pending_invoices_count,
        COALESCE(SUM(outstanding_balance) FILTER (WHERE status IN ('Pending', 'Partial')), 0)::numeric AS total_receivables,
        COUNT(*) FILTER (WHERE status = 'Paid')::int AS paid_invoices_count
      FROM billing_invoices
    `);

    const invStats = invStatsRes.rows[0] || {
      total_invoices: 0,
      pending_invoices_count: 0,
      total_receivables: 0,
      paid_invoices_count: 0,
    };

    // 3. Cashless Insurance / TPA Pre-Auth stats
    const claimsStatsRes = await query(`
      SELECT 
        COUNT(*)::int AS total_claims,
        COUNT(*) FILTER (WHERE status IN ('Claim Raised', 'Under Review', 'Query Raised'))::int AS pending_claims,
        COUNT(*) FILTER (WHERE status = 'Approved')::int AS approved_claims,
        COALESCE(SUM(claimed_amount), 0)::numeric AS total_claimed_amount,
        COALESCE(SUM(approved_amount), 0)::numeric AS total_approved_amount
      FROM billing_insurance_claims
    `);

    const claimStats = claimsStatsRes.rows[0] || {
      total_claims: 0,
      pending_claims: 0,
      approved_claims: 0,
      total_claimed_amount: 0,
      total_approved_amount: 0,
    };

    // 4. IPD Inpatients Awaiting Discharge Financial Settlement
    const ipdDischargeRes = await query(`
      SELECT 
        COUNT(*)::int AS discharge_pending_count
      FROM ipd_admissions
      WHERE status = 'Admitted'
    `);

    const dischargeCount = ipdDischargeRes.rows[0]?.discharge_pending_count || 0;

    // 5. Recent Payments List
    const recentPaymentsRes = await query(`
      SELECT *
      FROM billing_payments
      ORDER BY paid_at DESC
      LIMIT 6
    `);

    // 6. Top Pending Invoices
    const pendingInvoicesRes = await query(`
      SELECT *
      FROM billing_invoices
      WHERE status IN ('Pending', 'Partial')
      ORDER BY due_date ASC, created_at DESC
      LIMIT 6
    `);

    res.json({
      success: true,
      stats: {
        total_collected_today: parseFloat(revToday.total_collected_today),
        transactions_today: revToday.transactions_today,
        pending_invoices: invStats.pending_invoices_count,
        total_receivables: parseFloat(invStats.total_receivables),
        paid_invoices: invStats.paid_invoices_count,
        pending_tpa_claims: claimStats.pending_claims,
        approved_tpa_claims: claimStats.approved_claims,
        discharge_pending: dischargeCount,
      },
      recent_payments: recentPaymentsRes.rows,
      pending_invoices: pendingInvoicesRes.rows,
    });
  })
);

/**
 * GET /api/v1/billing/invoices
 * Filterable invoices list with itemized charges.
 */
router.get(
  '/invoices',
  asyncHandler(async (req, res) => {
    const { status, category, search } = req.query;

    let queryText = `
      SELECT *
      FROM billing_invoices
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      queryText += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (category && category !== 'all') {
      queryText += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      queryText += ` AND (patient_name ILIKE $${paramIndex} OR bill_number ILIKE $${paramIndex} OR id ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    queryText += ` ORDER BY CASE WHEN status = 'Pending' THEN 1 WHEN status = 'Partial' THEN 2 ELSE 3 END, created_at DESC`;

    const result = await query(queryText, params);
    res.json({
      success: true,
      data: result.rows,
    });
  })
);

/**
 * POST /api/v1/billing/invoices/generate
 * Issue a new hospital bill / itemized invoice.
 */
router.post(
  '/invoices/generate',
  asyncHandler(async (req, res) => {
    const {
      patient_id,
      patient_name,
      category = 'Outpatient (OPD)',
      items = [], // array of { item, category, unit_price, qty, total }
      discount_percent = 0,
      tax_percent = 5,
      notes = 'Standard clinical services bill.',
      created_by = 'David Chen, CPA',
    } = req.body;

    if (!patient_id || !patient_name || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing required invoice fields (patient_id, patient_name, items)' });
    }

    // Calculate subtotal
    const subtotal = items.reduce((acc, curr) => acc + (parseFloat(curr.total) || (curr.unit_price * curr.qty)), 0);
    const discPct = parseFloat(discount_percent) || 0;
    const discount_amount = (subtotal * discPct) / 100;
    const discountedSubtotal = subtotal - discount_amount;

    const txPct = parseFloat(tax_percent) || 0;
    const tax_amount = (discountedSubtotal * txPct) / 100;
    const total_amount = discountedSubtotal + tax_amount;

    const invoiceId = `INV-2026-${Date.now().toString().slice(-4)}`;
    const billNumber = `BILL-2026-${Math.floor(Math.random() * 9000 + 1000)}`;

    const result = await query(
      `
      INSERT INTO billing_invoices (
        id, bill_number, patient_id, patient_name, category,
        items, subtotal, discount_percent, discount_amount,
        tax_percent, tax_amount, total_amount, deposit_applied,
        paid_amount, outstanding_balance, status, due_date, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0.00, 0.00, $12, 'Pending', CURRENT_DATE + INTERVAL '7 days', $13, $14)
      RETURNING *
    `,
      [
        invoiceId,
        billNumber,
        patient_id,
        patient_name,
        category,
        JSON.stringify(items),
        subtotal.toFixed(2),
        discPct,
        discount_amount.toFixed(2),
        txPct,
        tax_amount.toFixed(2),
        total_amount.toFixed(2),
        notes,
        created_by,
      ]
    );

    res.json({
      success: true,
      message: `Invoice ${billNumber} created successfully. Total: $${total_amount.toFixed(2)}`,
      data: result.rows[0],
    });
  })
);

/**
 * POST /api/v1/billing/invoices/:id/pay
 * Collect payment, record receipt, and update invoice balance.
 */
router.post(
  '/invoices/:id/pay',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      amount,
      payment_type = 'Settlement',
      payment_method = 'Credit Card (POS)',
      reference_number,
      notes,
      received_by = 'David Chen, CPA',
    } = req.body;

    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const invRes = await client.query(`SELECT * FROM billing_invoices WHERE id = $1 FOR UPDATE`, [id]);
      if (invRes.rows.length === 0) {
        throw new Error('Invoice not found');
      }

      const inv = invRes.rows[0];
      const newPaid = parseFloat(inv.paid_amount || 0) + payAmount;
      const newBalance = Math.max(0, parseFloat(inv.total_amount) - newPaid);
      const newStatus = newBalance <= 0.01 ? 'Paid' : 'Partial';

      // 1. Update invoice
      await client.query(
        `
        UPDATE billing_invoices
        SET 
          paid_amount = $1,
          outstanding_balance = $2,
          status = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `,
        [newPaid.toFixed(2), newBalance.toFixed(2), newStatus, id]
      );

      // 2. Insert into billing_payments
      const payId = `PAY-2026-${Date.now().toString().slice(-4)}`;
      const refNum = reference_number || `TXN-${Math.floor(Math.random() * 900000 + 100000)}`;

      const payRes = await client.query(
        `
        INSERT INTO billing_payments (
          id, invoice_id, patient_id, patient_name,
          amount, payment_type, payment_method, reference_number,
          received_by, notes, paid_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
        RETURNING *
      `,
        [
          payId,
          id,
          inv.patient_id,
          inv.patient_name,
          payAmount.toFixed(2),
          payment_type,
          payment_method,
          refNum,
          received_by,
          notes || `Payment collected for invoice ${inv.bill_number}.`,
        ]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Payment of $${payAmount.toFixed(2)} recorded. Invoice status: ${newStatus}.`,
        payment: payRes.rows[0],
        new_balance: newBalance.toFixed(2),
        new_status: newStatus,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: err.message || 'Payment processing failed' });
    } finally {
      client.release();
    }
  })
);

/**
 * GET /api/v1/billing/insurance-claims
 * Cashless TPA insurance claims list.
 */
router.get(
  '/insurance-claims',
  asyncHandler(async (_req, res) => {
    const result = await query(`
      SELECT *
      FROM billing_insurance_claims
      ORDER BY 
        CASE 
          WHEN status = 'Under Review' THEN 1 
          WHEN status = 'Query Raised' THEN 2 
          WHEN status = 'Approved' THEN 3 
          ELSE 4 
        END,
        created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  })
);

/**
 * POST /api/v1/billing/insurance-claims
 * Submit new cashless insurance pre-authorization request.
 */
router.post(
  '/insurance-claims',
  asyncHandler(async (req, res) => {
    const {
      invoice_id,
      patient_id,
      patient_name,
      provider_name = 'StarHealth Shield TPA',
      policy_number,
      claimed_amount,
      notes = 'Initial pre-auth dossier submitted with clinical diagnosis.',
      submitted_by = 'David Chen, CPA',
    } = req.body;

    if (!patient_id || !patient_name || !policy_number || !claimed_amount) {
      return res.status(400).json({ error: 'Missing required claim fields (patient, policy_number, claimed_amount)' });
    }

    const claimId = `CLM-2026-${Date.now().toString().slice(-4)}`;
    const preAuthNum = `PA-${provider_name.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const historyEntry = {
      date: new Date().toISOString(),
      status: 'Claim Raised',
      note: notes,
      user: submitted_by,
    };

    const result = await query(
      `
      INSERT INTO billing_insurance_claims (
        id, invoice_id, patient_id, patient_name,
        provider_name, policy_number, coverage_verified, pre_auth_number,
        claimed_amount, approved_amount, settled_amount, status,
        submitted_by, history
      )
      VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, 0.00, 0.00, 'Under Review', $9, $10)
      RETURNING *
    `,
      [
        claimId,
        invoice_id || 'INV-PENDING',
        patient_id,
        patient_name,
        provider_name,
        policy_number,
        preAuthNum,
        parseFloat(claimed_amount),
        submitted_by,
        JSON.stringify([historyEntry]),
      ]
    );

    res.json({
      success: true,
      message: `Cashless pre-auth claim ${claimId} submitted to ${provider_name}.`,
      data: result.rows[0],
    });
  })
);

/**
 * PATCH /api/v1/billing/insurance-claims/:id
 * Update TPA claim status / record approved amount.
 */
router.patch(
  '/insurance-claims/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      status, // 'Approved' | 'Query Raised' | 'Rejected' | 'Settled'
      approved_amount,
      settled_amount,
      note = 'Status updated by billing coordinator.',
      updated_by = 'David Chen, CPA',
    } = req.body;

    const historyEntry = {
      date: new Date().toISOString(),
      status,
      note,
      user: updated_by,
    };

    const result = await query(
      `
      UPDATE billing_insurance_claims
      SET 
        status = COALESCE($1, status),
        approved_amount = COALESCE($2, approved_amount),
        settled_amount = COALESCE($3, settled_amount),
        history = COALESCE(history, '[]'::jsonb) || $4::jsonb,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `,
      [status, approved_amount, settled_amount, JSON.stringify([historyEntry]), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Insurance claim not found' });
    }

    res.json({
      success: true,
      message: `Claim ${id} updated to status: ${status}.`,
      data: result.rows[0],
    });
  })
);

/**
 * GET /api/v1/billing/discharge-clearances
 * Inpatient discharge financial settlement checklist.
 */
router.get(
  '/discharge-clearances',
  asyncHandler(async (_req, res) => {
    const result = await query(`
      SELECT 
        adm.id AS admission_id,
        adm.patient_id,
        adm.patient_name,
        adm.ward,
        adm.room,
        adm.bed_label,
        adm.admission_date,
        adm.admitting_doctor,
        adm.diagnosis,
        inv.id AS invoice_id,
        inv.bill_number,
        COALESCE(inv.total_amount, 0)::numeric AS total_amount,
        COALESCE(inv.paid_amount, 0)::numeric AS paid_amount,
        COALESCE(inv.outstanding_balance, 0)::numeric AS outstanding_balance,
        COALESCE(inv.status, 'No Bill Generated') AS billing_status,
        clm.id AS claim_id,
        clm.provider_name AS tpa_provider,
        clm.status AS claim_status,
        clm.approved_amount AS tpa_approved_amount
      FROM ipd_admissions adm
      LEFT JOIN billing_invoices inv ON inv.patient_id = adm.patient_id AND inv.category = 'Inpatient (IPD)'
      LEFT JOIN billing_insurance_claims clm ON clm.invoice_id = inv.id
      WHERE adm.status = 'Admitted'
      ORDER BY adm.admission_date ASC
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  })
);

/**
 * GET /api/v1/billing/payments
 * Payments & cash counter receipts log.
 */
router.get(
  '/payments',
  asyncHandler(async (_req, res) => {
    const result = await query(`
      SELECT *
      FROM billing_payments
      ORDER BY paid_at DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  })
);

export default router;
