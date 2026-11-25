import { Router } from 'express';
import { pool, query } from '../db.js';
import {
  analyticsService,
  mapsService,
  objectStorageService,
  paymentGatewayService,
} from '../utils/integrations.js';
import { logSensitiveAccess, verifySignedReportToken } from '../utils/security.js';

const router = Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 1. Hospital Location & Maps Integration: GET /api/v1/integrations/location
router.get('/location', (_req, res) => {
  res.json({ data: mapsService.getLocationMetadata() });
});

// 2. Public Analytics Config: GET /api/v1/integrations/analytics-config
router.get('/analytics-config', (_req, res) => {
  res.json({ data: analyticsService.getPublicAnalyticsConfig() });
});

// 3. Secure Payment Gateway Orders: POST /api/v1/integrations/payments/create-order
router.post(
  '/payments/create-order',
  asyncHandler(async (req, res) => {
    const { booking_reference, amount = 1500 } = req.body || {};

    if (!booking_reference) {
      return res.status(400).json({ error: 'booking_reference is required to create a payment order.' });
    }

    const apptRes = await query(
      'SELECT id, booking_reference, patient_email, patient_phone, status FROM appointments WHERE UPPER(booking_reference) = UPPER($1)',
      [booking_reference.trim()]
    );

    if (apptRes.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const appt = apptRes.rows[0];
    const orderData = await paymentGatewayService.createOrder({
      appointmentId: appt.id,
      bookingReference: appt.booking_reference,
      amount: Number(amount) || 1500,
      currency: 'INR',
      customerEmail: appt.patient_email,
      customerPhone: appt.patient_phone,
    });

    res.status(201).json({
      data: orderData,
      message: 'Server-side payment order created successfully.',
    });
  })
);

// 4. Secure Payment Verification (Never trusts client claim; strictly checks HMAC signature)
// POST /api/v1/integrations/payments/verify
router.post(
  '/payments/verify',
  asyncHandler(async (req, res) => {
    const {
      order_id,
      payment_id,
      signature,
      booking_reference,
    } = req.body || {};

    if (!order_id || !payment_id || !signature || !booking_reference) {
      return res.status(400).json({
        error: 'order_id, payment_id, signature, and booking_reference are all required for verification.',
      });
    }

    // Step A: Cryptographically verify signature
    const verification = paymentGatewayService.verifyPaymentSignature({
      orderId: order_id,
      paymentId: payment_id,
      signature,
    });

    if (!verification.verified) {
      await logSensitiveAccess({
        patientId: null,
        action: 'PAYMENT_SIGNATURE_VERIFICATION_FAILED',
        entityType: 'payment_security',
        entityId: order_id,
        details: { reason: verification.reason, booking_reference },
        req,
      });

      return res.status(400).json({
        error: 'Payment verification failed: cryptographic signature invalid. Transaction rejected.',
        verified: false,
      });
    }

    // Step B: Atomically update appointment payment in database transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const apptRes = await client.query(
        'SELECT id, booking_reference, status FROM appointments WHERE UPPER(booking_reference) = UPPER($1) FOR UPDATE',
        [booking_reference.trim()]
      );

      if (apptRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Appointment reference not found.' });
      }

      const appt = apptRes.rows[0];

      // Record successful payment
      await client.query(
        `INSERT INTO appointment_payments (
          appointment_id, amount, payment_status, payment_method, transaction_ref, paid_at
        ) VALUES ($1, 1500.00, 'paid', 'online_gateway', $2, NOW())
        ON CONFLICT DO NOTHING`,
        [appt.id, payment_id]
      );

      // Audit log entry for payment receipt
      await client.query(
        `INSERT INTO appointment_audit_logs (
          appointment_id, booking_reference, previous_status, new_status, changed_by, reason
        ) VALUES ($1, $2, $3, $3, 'system_payment_gateway', $4)`,
        [
          appt.id,
          appt.booking_reference,
          appt.status,
          `Verified online payment received via ${verification.paymentId}`,
        ]
      );

      await logSensitiveAccess({
        patientId: null,
        action: 'PAYMENT_VERIFIED_SUCCESSFUL',
        entityType: 'payment_record',
        entityId: payment_id,
        details: { booking_reference: appt.booking_reference, order_id },
        req,
      });

      await client.query('COMMIT');

      res.json({
        data: {
          verified: true,
          booking_reference: appt.booking_reference,
          payment_id,
          order_id,
          status: 'PAID_VERIFIED',
          message: 'Payment verified and confirmed by bank gateway. Appointment recorded as paid.',
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

// 5. Secure Object Storage Document Download Handler (Time-limited signed token)
// GET /api/v1/integrations/storage/download
router.get(
  '/storage/download',
  asyncHandler(async (req, res) => {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Download token is required.' });
    }

    const check = verifySignedReportToken(String(token));
    if (!check.valid) {
      return res.status(403).json({ error: check.error || 'Access denied.' });
    }

    // Deliver simulated medical PDF report stream with appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Healix-${check.reportType}-${check.reportId}.pdf"`);
    res.send(`%PDF-1.4\n% Healix Medical Record Export\nPatientID: ${check.patientId}\nReportID: ${check.reportId}\nVerified.`);
  })
);

export default router;
