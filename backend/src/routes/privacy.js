import { Router } from 'express';
import { query } from '../db.js';
import { requirePatientAuth } from '../utils/auth.js';
import { logSensitiveAccess } from '../utils/security.js';

const router = Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Ensure DPDP consent and request tables exist
async function ensureDpdpTables() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS dpdp_consents (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patient_accounts(id) ON DELETE CASCADE,
        consent_type TEXT NOT NULL,
        purpose TEXT NOT NULL,
        is_granted BOOLEAN NOT NULL DEFAULT TRUE,
        version TEXT NOT NULL DEFAULT 'v1.0-DPDP-2023',
        withdrawn_at TIMESTAMPTZ,
        granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_dpdp_consents_patient ON dpdp_consents(patient_id, consent_type);

      CREATE TABLE IF NOT EXISTS dpdp_data_requests (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patient_accounts(id) ON DELETE CASCADE,
        request_type TEXT NOT NULL CHECK (request_type IN ('ACCESS_EXPORT', 'CORRECTION', 'ERASURE_FORGET', 'NOMINATION', 'GRIEVANCE')),
        status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_REVIEW', 'COMPLETED', 'REJECTED')),
        details TEXT NOT NULL,
        resolution_notes TEXT DEFAULT '',
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_dpdp_requests_patient ON dpdp_data_requests(patient_id, status);
    `);
  } catch (err) {
    console.error('Error ensuring DPDP tables:', err.message);
  }
}

/**
 * 1. Public Privacy Notice (India DPDP Act 2023 & Healthcare Records Compliant)
 * Accessible publicly under /api/v1/privacy/notice
 */
router.get(
  '/notice',
  asyncHandler(async (_req, res) => {
    res.json({
      data: {
        act: 'Digital Personal Data Protection (DPDP) Act, 2023 (India) & National Digital Health Guidelines',
        data_fiduciary: {
          name: 'Healix Medical Center & Super Speciality Hospitals',
          address: '480 Meridian Avenue, Health Sciences District, Boston, MA / New Delhi Healthcare Hub',
          grievance_officer: {
            name: 'Dr. Ananya Roy, MD, CIPP/A',
            designation: 'Chief Privacy Officer & Data Protection Officer (DPO)',
            email: 'dpo.privacy@healixmedical.org',
            contact: '+1 (800) 432-5490 (Ext: 108) / +91 (11) 4567-8900',
            address: 'Office of the Data Protection Officer, 5th Floor, Healix Executive Wing',
            responseTime: 'Within 72 working hours (Max 30 days statutory ceiling)',
          },
        },
        principles: [
          {
            title: 'Lawful, Fair & Transparent Processing',
            description: 'Personal and clinical health data is processed solely for healthcare delivery, appointment fulfillment, and life-saving medical treatment with explicit patient consent.',
          },
          {
            title: 'Purpose Limitation & Data Minimization',
            description: 'We collect only the minimum required medical, diagnostic, and contact parameters needed to deliver clinical diagnosis, emergency trauma care, and statutory billing.',
          },
          {
            title: 'Storage Limitation & Retention Policy',
            description: 'Clinical health records, operation notes, and discharge summaries are retained for a minimum statutory period of 10 years in compliance with National Medical Commission (NMC) guidelines and DPDP rules. Non-clinical marketing cookies expire within 30 days.',
          },
          {
            title: 'Accuracy & Right to Correction',
            description: 'Patients have the absolute right to view, correct, update, or supplement incomplete demographic or billing records via the Patient Portal or DPO request.',
          },
          {
            title: 'Right to Withdraw Consent & Erasure',
            description: 'Patients can withdraw non-statutory consent (e.g., wellness newsletters, SMS notifications) at any time. Medical record deletion is honored subject to statutory hospital medical-legal record preservation mandates.',
          },
          {
            title: 'Security Safeguards & Breach Response',
            description: 'Data encrypted in transit (TLS 1.3 / HTTPS) and at rest (AES-256). Incident response procedures mandate notification to the Data Protection Board of India and affected data principals in case of unauthorized data exposure.',
          },
        ],
        patient_rights: [
          'Right to Access Summary of Personal Data',
          'Right to Correction and Erasure',
          'Right of Grievance Redressal with DPO and Data Protection Board of India',
          'Right to Nominate a Representative in Event of Death or Incapacity',
        ],
      },
    });
  })
);

/**
 * 2. Get Patient Consent Records (Authenticated)
 * GET /api/v1/privacy/consents
 */
router.get(
  '/consents',
  requirePatientAuth,
  asyncHandler(async (req, res) => {
    await ensureDpdpTables();
    const result = await query(
      `SELECT id, consent_type, purpose, is_granted, version, granted_at, withdrawn_at
       FROM dpdp_consents
       WHERE patient_id = $1
       ORDER BY id ASC`,
      [req.patient.id]
    );

    // If no explicit records exist yet, provide default registered consents
    if (result.rows.length === 0) {
      const defaultConsents = [
        {
          consent_type: 'PRIMARY_CARE_TREATMENT',
          purpose: 'Collection and processing of health vitals, clinical diagnostic history, and laboratory samples for clinical evaluation.',
          is_granted: true,
          version: 'v1.0-DPDP-2023',
          can_withdraw: false, // Mandatory for healthcare delivery
        },
        {
          consent_type: 'DIAGNOSTIC_REPORTS_PORTAL',
          purpose: 'Electronic storage and display of pathology and radiology findings on the verified patient portal.',
          is_granted: true,
          version: 'v1.0-DPDP-2023',
          can_withdraw: true,
        },
        {
          consent_type: 'ELECTRONIC_NOTIFICATIONS',
          purpose: 'Automated SMS, Email, and WhatsApp alerts for appointments, prescription refills, and critical lab releases.',
          is_granted: true,
          version: 'v1.0-DPDP-2023',
          can_withdraw: true,
        },
        {
          consent_type: 'PREVENTIVE_HEALTH_UPDATES',
          purpose: 'Health education articles, seasonal vaccination clinics, and preventive wellness check reminders.',
          is_granted: false,
          version: 'v1.0-DPDP-2023',
          can_withdraw: true,
        },
      ];
      return res.json({ data: defaultConsents });
    }

    res.json({ data: result.rows });
  })
);

/**
 * 3. Update / Withdraw Consent (DPDP Act Right to Withdraw)
 * POST /api/v1/privacy/consents/update
 */
router.post(
  '/consents/update',
  requirePatientAuth,
  asyncHandler(async (req, res) => {
    await ensureDpdpTables();
    const { consent_type, is_granted } = req.body || {};

    if (!consent_type) {
      return res.status(400).json({ error: 'consent_type is required.' });
    }

    if (consent_type === 'PRIMARY_CARE_TREATMENT' && !is_granted) {
      return res.status(400).json({
        error: 'Primary clinical care consent cannot be withdrawn while receiving active medical consultation. You may request account closure via the DPO.',
      });
    }

    const isGrantedBool = Boolean(is_granted);
    const existing = await query(
      `SELECT id FROM dpdp_consents WHERE patient_id = $1 AND consent_type = $2`,
      [req.patient.id, consent_type]
    );

    if (existing.rows.length > 0) {
      await query(
        `UPDATE dpdp_consents
         SET is_granted = $1,
             withdrawn_at = ${isGrantedBool ? 'NULL' : 'NOW()'},
             updated_at = NOW()
         WHERE patient_id = $2 AND consent_type = $3`,
        [isGrantedBool, req.patient.id, consent_type]
      );
    } else {
      await query(
        `INSERT INTO dpdp_consents (patient_id, consent_type, purpose, is_granted, withdrawn_at)
         VALUES ($1, $2, 'Patient-managed purpose consent', $3, ${isGrantedBool ? 'NULL' : 'NOW()'})`,
        [req.patient.id, consent_type, isGrantedBool]
      );
    }

    await logSensitiveAccess({
      patientId: req.patient.id,
      action: isGrantedBool ? 'DPDP_CONSENT_GRANTED' : 'DPDP_CONSENT_WITHDRAWN',
      entityType: 'privacy_consent',
      entityId: consent_type,
      details: { consent_type, is_granted: isGrantedBool },
      req,
    });

    res.json({
      data: {
        consent_type,
        is_granted: isGrantedBool,
        message: isGrantedBool
          ? 'Consent successfully updated and recorded.'
          : 'Consent has been withdrawn. Processing for this specific purpose has ceased.',
      },
    });
  })
);

/**
 * 4. Submit DPDP Data Principal Rights Request (Access/Export, Correction, Erasure, Grievance)
 * POST /api/v1/privacy/requests
 */
router.post(
  '/requests',
  requirePatientAuth,
  asyncHandler(async (req, res) => {
    await ensureDpdpTables();
    const { request_type, details } = req.body || {};

    const validTypes = ['ACCESS_EXPORT', 'CORRECTION', 'ERASURE_FORGET', 'NOMINATION', 'GRIEVANCE'];
    if (!request_type || !validTypes.includes(request_type)) {
      return res.status(400).json({
        error: `Invalid request_type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    if (!details?.trim()) {
      return res.status(400).json({ error: 'Details describing your request are required.' });
    }

    const result = await query(
      `INSERT INTO dpdp_data_requests (patient_id, request_type, details)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.patient.id, request_type, details.trim()]
    );

    await logSensitiveAccess({
      patientId: req.patient.id,
      action: `DPDP_RIGHTS_REQUEST_${request_type}`,
      entityType: 'dpdp_request',
      entityId: result.rows[0].id,
      details: { request_type, request_id: result.rows[0].id },
      req,
    });

    res.status(201).json({
      data: {
        request_id: result.rows[0].id,
        request_type,
        status: 'PENDING',
        message:
          'Your statutory data principal request has been logged with the Healix Data Protection Officer. A response will be issued within 72 business hours.',
      },
    });
  })
);

export default router;
