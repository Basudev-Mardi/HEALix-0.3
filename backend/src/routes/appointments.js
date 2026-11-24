import { Router } from 'express';
import crypto from 'node:crypto';
import { pool, query } from '../db.js';
import { dispatchNotification, NOTIFICATION_EVENTS } from '../utils/notifications.js';

const router = Router();

const DEFAULT_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '01:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
];

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

function generateBookingReference() {
  const year = new Date().getFullYear();
  const num = crypto.randomInt(1000, 9999);
  return `HX-${year}-${num}`;
}

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

// Get available slots for a doctor on a given date
router.get(
  '/slots',
  asyncHandler(async (req, res) => {
    const { doctor, date } = req.query;
    if (!doctor || !date) {
      return res.status(400).json({ error: 'Both doctor and date query parameters are required.' });
    }

    // Query doctor schedule
    const docRes = await query(
      `SELECT slug, name, consultation_days, consultation_hours
       FROM doctors
       WHERE slug = $1`,
      [String(doctor)]
    );

    const doctorInfo = docRes.rows[0] || null;

    // Check booked slots; exclude Cancelled and ignore expired Pending holds (> 15 min old)
    const bookedRes = await query(
      `SELECT time_slot, COUNT(*)::int AS count
       FROM appointments
       WHERE doctor_slug = $1
         AND appointment_date = $2::date
         AND status <> 'Cancelled'
         AND (status <> 'Pending' OR created_at > NOW() - INTERVAL '15 minutes')
       GROUP BY time_slot`,
      [String(doctor), String(date)]
    );

    const bookedCounts = new Map(bookedRes.rows.map((r) => [r.time_slot, r.count]));
    const maxSlotCapacity = 1;

    const slots = DEFAULT_SLOTS.map((time) => {
      const booked = bookedCounts.get(time) || 0;
      return {
        time,
        available: booked < maxSlotCapacity,
        capacity: maxSlotCapacity,
        booked,
      };
    });

    res.json({
      data: {
        doctor,
        date,
        doctorSchedule: doctorInfo?.consultation_days || null,
        slots,
      },
    });
  })
);

// Create a new appointment with transaction and conflict locking
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      doctor_slug,
      appointment_date,
      time_slot,
      visit_type = 'In-Person Consultation',
      patient_name,
      patient_email,
      patient_phone,
      patient_dob = null,
      patient_gender = null,
      patient_mrn = '',
      reason_for_visit = '',
      insurance_provider = '',
    } = req.body || {};

    if (
      !doctor_slug ||
      !appointment_date ||
      !time_slot ||
      !patient_name?.trim() ||
      !patient_email?.trim() ||
      !patient_phone?.trim()
    ) {
      return res.status(400).json({
        error:
          'Missing required fields: doctor_slug, appointment_date, time_slot, patient_name, patient_email, patient_phone.',
      });
    }

    if (reason_for_visit && reason_for_visit.length > 500) {
      return res.status(400).json({
        error: 'Reason for visit must not exceed 500 characters.',
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await ensureAuditLogTable(client);

      // 1. Validate doctor and department existence
      const docRes = await client.query(
        `SELECT d.slug, d.name, d.specialty, d.department_slug, d.consultation_fee,
                d.consultation_days, dep.name AS department_name, dep.floor_location
         FROM doctors d
         JOIN departments dep ON dep.slug = d.department_slug
         WHERE d.slug = $1`,
        [doctor_slug]
      );

      if (docRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Selected doctor not found.' });
      }

      const doctor = docRes.rows[0];

      // 2. Lock & revalidate slot availability (concurrency safety)
      const conflictRes = await client.query(
        `SELECT id FROM appointments
         WHERE doctor_slug = $1
           AND appointment_date = $2::date
           AND time_slot = $3
           AND status <> 'Cancelled'
           AND (status <> 'Pending' OR created_at > NOW() - INTERVAL '15 minutes')
         FOR UPDATE`,
        [doctor_slug, appointment_date, time_slot]
      );

      if (conflictRes.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error:
            'This time slot has already been booked by another patient. Please select another available time.',
        });
      }

      // 3. Generate unique booking reference
      let reference = generateBookingReference();
      for (let i = 0; i < 5; i += 1) {
        const exists = await client.query(
          'SELECT 1 FROM appointments WHERE booking_reference = $1',
          [reference]
        );
        if (exists.rows.length === 0) break;
        reference = generateBookingReference();
      }

      // 4. Insert appointment
      const insertRes = await client.query(
        `INSERT INTO appointments (
          booking_reference, doctor_slug, department_slug, appointment_date, time_slot,
          visit_type, patient_name, patient_email, patient_phone, patient_dob,
          patient_gender, reason_for_visit, insurance_provider, status
        ) VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8, $9, $10::date, $11, $12, $13, 'Confirmed')
        RETURNING *`,
        [
          reference,
          doctor.slug,
          doctor.department_slug,
          appointment_date,
          time_slot,
          visit_type,
          patient_name.trim(),
          patient_email.trim().toLowerCase(),
          patient_phone.trim(),
          patient_dob || null,
          patient_gender || null,
          reason_for_visit.trim(),
          insurance_provider.trim(),
        ]
      );

      const appt = insertRes.rows[0];

      // 5. Check if patient has a registered account and create dashboard notification
      const patientAcctRes = await client.query(
        `SELECT id, mrn, full_name, email FROM patient_accounts
         WHERE LOWER(email) = LOWER($1) OR (mrn = $2 AND mrn IS NOT NULL)
         LIMIT 1`,
        [patient_email.trim(), patient_mrn.trim()]
      );

      let linkedMrn = null;
      let patientAcct = null;
      if (patientAcctRes.rows.length > 0) {
        patientAcct = patientAcctRes.rows[0];
        linkedMrn = patientAcct.mrn;
      }

      // Workflow F: Event: Appointment booked -> Booking confirmation & Event: Appointment confirmed -> Confirmation update
      await dispatchNotification({
        client,
        patientId: patientAcct?.id || null,
        recipientEmail: patient_email.trim(),
        recipientPhone: patient_phone.trim(),
        eventType: NOTIFICATION_EVENTS.APPOINTMENT_CONFIRMED,
        title: `Appointment Confirmed — Dr. ${doctor.name} (${reference})`,
        message: `Your ${visit_type} with ${doctor.name} (${doctor.specialty}) on ${appointment_date} at ${time_slot} is confirmed. Clinic Location: ${doctor.floor_location || 'Main Clinic Wing'}. Booking Reference: ${reference}.`,
        actionHref: '/patient/appointments',
        metadata: {
          booking_reference: reference,
          doctor_name: doctor.name,
          department_name: doctor.department_name,
          consultation_fee: doctor.consultation_fee,
        },
      });

      // 6. Record initial booking in audit log
      await client.query(
        `INSERT INTO appointment_audit_logs (
          appointment_id, booking_reference, previous_status, new_status, changed_by, reason
        ) VALUES ($1, $2, NULL, 'Confirmed', $3, $4)`,
        [
          appt.id,
          reference,
          patient_name.trim() + (linkedMrn ? ` (${linkedMrn})` : ''),
          linkedMrn
            ? `Initial appointment booking confirmed by registered patient (${linkedMrn})`
            : 'Initial appointment booking confirmed',
        ]
      );

      await client.query('COMMIT');

      res.status(201).json({
        data: {
          ...appt,
          appointment_date: appt.appointment_date.toISOString().slice(0, 10),
          doctor_name: doctor.name,
          doctor_specialty: doctor.specialty,
          consultation_fee: doctor.consultation_fee,
          department_name: doctor.department_name,
          floor_location: doctor.floor_location,
          patient_mrn: linkedMrn,
        },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.code === '23505') {
        return res.status(409).json({
          error:
            'A concurrent booking just occupied this time slot. Please choose another available slot.',
        });
      }
      throw err;
    } finally {
      client.release();
    }
  })
);

// Track appointment by reference code or patient email
router.get(
  '/track',
  asyncHandler(async (req, res) => {
    const { reference, email } = req.query;
    if (!reference && !email) {
      return res.status(400).json({
        error: 'Provide a booking reference (e.g. HX-2026-1042) or patient email address.',
      });
    }

    let sql = `
      SELECT a.*,
             TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS formatted_date,
             d.name AS doctor_name,
             d.specialty AS doctor_specialty,
             d.qualification AS doctor_qualification,
             d.consultation_fee,
             d.avatar_initials,
             d.accent_tone,
             dep.name AS department_name,
             dep.floor_location,
             dep.phone_ext
      FROM appointments a
      JOIN doctors d ON d.slug = a.doctor_slug
      JOIN departments dep ON dep.slug = a.department_slug
    `;
    const params = [];

    if (reference) {
      params.push(String(reference).trim().toUpperCase());
      sql += ' WHERE UPPER(a.booking_reference) = $1';
    } else {
      params.push(String(email).trim().toLowerCase());
      sql += ' WHERE LOWER(a.patient_email) = $1';
    }

    sql += ' ORDER BY a.appointment_date DESC, a.created_at DESC';

    const result = await query(sql, params);
    const rows = result.rows.map((r) => ({
      ...r,
      appointment_date: r.formatted_date,
    }));

    res.json({ data: rows });
  })
);

// Cancel an appointment with patient ownership check and audit logging
router.patch(
  '/:reference/cancel',
  asyncHandler(async (req, res) => {
    const ref = String(req.params.reference || '').trim().toUpperCase();
    const { email, phone, reason = 'Cancelled by patient' } = req.body || {};

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await ensureAuditLogTable(client);

      const findRes = await client.query(
        `SELECT * FROM appointments WHERE UPPER(booking_reference) = $1 FOR UPDATE`,
        [ref]
      );

      if (findRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Appointment not found.' });
      }

      const existing = findRes.rows[0];

      // Security check: patients cannot change another patient's appointment
      if (email && email.trim().toLowerCase() !== existing.patient_email.toLowerCase()) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          error: 'Security verification failed: You are not authorized to cancel this appointment.',
        });
      }

      if (phone && phone.trim() !== existing.patient_phone.trim()) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          error: 'Security verification failed: Phone number does not match appointment records.',
        });
      }

      if (existing.status === 'Cancelled') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'This appointment is already cancelled.' });
      }

      const updateRes = await client.query(
        `UPDATE appointments
         SET status = 'Cancelled', updated_at = NOW()
         WHERE id = $1
         RETURNING *, TO_CHAR(appointment_date, 'YYYY-MM-DD') AS formatted_date`,
        [existing.id]
      );

      await client.query(
        `INSERT INTO appointment_audit_logs (
          appointment_id, booking_reference, previous_status, new_status, changed_by, reason
        ) VALUES ($1, $2, $3, 'Cancelled', $4, $5)`,
        [existing.id, ref, existing.status, existing.patient_name, String(reason)]
      );

      // Workflow F: Event: Appointment cancelled -> Notification: Cancellation notice (Email, SMS, In-Portal)
      const patientCheck = await client.query(
        'SELECT id FROM patient_accounts WHERE LOWER(email) = LOWER($1) LIMIT 1',
        [existing.patient_email]
      );
      await dispatchNotification({
        client,
        patientId: patientCheck.rows[0]?.id || null,
        recipientEmail: existing.patient_email,
        recipientPhone: existing.patient_phone,
        eventType: NOTIFICATION_EVENTS.APPOINTMENT_CANCELLED,
        title: `Appointment Cancelled — ${ref}`,
        message: `Your appointment (Ref: ${ref}) has been cancelled. In accordance with hospital policy, your consultation slot has been released back to availability.`,
        actionHref: '/patient/appointments',
        metadata: { booking_reference: ref, reason },
      });

      await client.query('COMMIT');

      const row = updateRes.rows[0];
      res.json({
        data: {
          ...row,
          appointment_date: row.formatted_date,
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

// Reschedule an appointment with lock validation and audit logging
router.patch(
  '/:reference/reschedule',
  asyncHandler(async (req, res) => {
    const ref = String(req.params.reference || '').trim().toUpperCase();
    const { new_date, new_time_slot, email, phone, reason = 'Rescheduled by patient' } = req.body || {};

    if (!new_date || !new_time_slot) {
      return res.status(400).json({ error: 'Both new_date and new_time_slot are required.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await ensureAuditLogTable(client);

      const findRes = await client.query(
        `SELECT * FROM appointments WHERE UPPER(booking_reference) = $1 FOR UPDATE`,
        [ref]
      );

      if (findRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Appointment not found.' });
      }

      const existing = findRes.rows[0];

      if (email && email.trim().toLowerCase() !== existing.patient_email.toLowerCase()) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          error: 'Security verification failed: You are not authorized to reschedule this appointment.',
        });
      }

      if (phone && phone.trim() !== existing.patient_phone.trim()) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          error: 'Security verification failed: Phone number does not match appointment records.',
        });
      }

      // Check new slot conflict
      const conflictRes = await client.query(
        `SELECT id FROM appointments
         WHERE doctor_slug = $1
           AND appointment_date = $2::date
           AND time_slot = $3
           AND status <> 'Cancelled'
           AND id <> $4
         FOR UPDATE`,
        [existing.doctor_slug, new_date, new_time_slot, existing.id]
      );

      if (conflictRes.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: 'The requested new slot is not available. Please pick another date or time.',
        });
      }

      const updateRes = await client.query(
        `UPDATE appointments
         SET appointment_date = $1::date,
             time_slot = $2,
             updated_at = NOW()
         WHERE id = $3
         RETURNING *, TO_CHAR(appointment_date, 'YYYY-MM-DD') AS formatted_date`,
        [new_date, new_time_slot, existing.id]
      );

      await client.query(
        `INSERT INTO appointment_audit_logs (
          appointment_id, booking_reference, previous_status, new_status, changed_by, reason
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          existing.id,
          ref,
          existing.status,
          existing.status,
          existing.patient_name,
          `Rescheduled from ${existing.appointment_date.toISOString().slice(0, 10)} ${existing.time_slot} to ${new_date} ${new_time_slot}. Reason: ${reason}`,
        ]
      );

      // Workflow F: Event: Appointment rescheduled -> Notification: New date/time (Email, SMS, WhatsApp, In-Portal)
      const patientCheck = await client.query(
        'SELECT id FROM patient_accounts WHERE LOWER(email) = LOWER($1) LIMIT 1',
        [existing.patient_email]
      );
      await dispatchNotification({
        client,
        patientId: patientCheck.rows[0]?.id || null,
        recipientEmail: existing.patient_email,
        recipientPhone: existing.patient_phone,
        eventType: NOTIFICATION_EVENTS.APPOINTMENT_RESCHEDULED,
        title: `Appointment Rescheduled — ${ref}`,
        message: `Your consultation has been rescheduled to ${new_date} at ${new_time_slot}. Prior schedule was ${existing.appointment_date.toISOString().slice(0, 10)} (${existing.time_slot}).`,
        actionHref: '/patient/appointments',
        metadata: {
          booking_reference: ref,
          previous_date: existing.appointment_date.toISOString().slice(0, 10),
          previous_slot: existing.time_slot,
          new_date,
          new_time_slot,
        },
      });

      await client.query('COMMIT');

      const row = updateRes.rows[0];
      res.json({
        data: {
          ...row,
          appointment_date: row.formatted_date,
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

// Get appointment audit history
router.get(
  '/:reference/audit',
  asyncHandler(async (req, res) => {
    const ref = String(req.params.reference || '').trim().toUpperCase();
    const result = await query(
      `SELECT * FROM appointment_audit_logs
       WHERE UPPER(booking_reference) = $1
       ORDER BY created_at ASC`,
      [ref]
    );
    res.json({ data: result.rows });
  })
);

// Appointment FAQs & Help
router.get(
  '/faqs',
  asyncHandler(async (_req, res) => {
    const result = await query(
      'SELECT * FROM appointment_faqs ORDER BY display_order ASC'
    );
    res.json({ data: result.rows });
  })
);

export default router;
