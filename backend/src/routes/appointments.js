import { Router } from 'express';
import crypto from 'node:crypto';
import { query } from '../db.js';

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
];

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

function generateBookingReference() {
  const year = new Date().getFullYear();
  const num = crypto.randomInt(1000, 9999);
  return `HX-${year}-${num}`;
}

// Get available slots for a doctor on a given date
router.get(
  '/slots',
  asyncHandler(async (req, res) => {
    const { doctor, date } = req.query;
    if (!doctor || !date) {
      return res.status(400).json({ error: 'Both doctor and date query parameters are required.' });
    }

    const bookedRes = await query(
      `SELECT time_slot
       FROM appointments
       WHERE doctor_slug = $1
         AND appointment_date = $2::date
         AND status <> 'Cancelled'`,
      [String(doctor), String(date)]
    );

    const bookedSet = new Set(bookedRes.rows.map((r) => r.time_slot));
    const slots = DEFAULT_SLOTS.map((time) => ({
      time,
      available: !bookedSet.has(time),
    }));

    res.json({ data: { doctor, date, slots } });
  })
);

// Create a new appointment
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

    const docRes = await query(
      `SELECT d.slug, d.name, d.specialty, d.department_slug, d.consultation_fee,
              dep.name AS department_name, dep.floor_location
       FROM doctors d
       JOIN departments dep ON dep.slug = d.department_slug
       WHERE d.slug = $1`,
      [doctor_slug]
    );

    if (docRes.rows.length === 0) {
      return res.status(404).json({ error: 'Selected doctor not found.' });
    }

    const doctor = docRes.rows[0];

    // Check slot availability
    const conflictRes = await query(
      `SELECT id FROM appointments
       WHERE doctor_slug = $1
         AND appointment_date = $2::date
         AND time_slot = $3
         AND status <> 'Cancelled'`,
      [doctor_slug, appointment_date, time_slot]
    );

    if (conflictRes.rows.length > 0) {
      return res.status(409).json({
        error: 'This time slot has already been booked. Please select another available time.',
      });
    }

    let reference = generateBookingReference();
    for (let i = 0; i < 5; i += 1) {
      const exists = await query(
        'SELECT 1 FROM appointments WHERE booking_reference = $1',
        [reference]
      );
      if (exists.rows.length === 0) break;
      reference = generateBookingReference();
    }

    const insertRes = await query(
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
    res.status(201).json({
      data: {
        ...appt,
        appointment_date: appt.appointment_date.toISOString().slice(0, 10),
        doctor_name: doctor.name,
        doctor_specialty: doctor.specialty,
        consultation_fee: doctor.consultation_fee,
        department_name: doctor.department_name,
        floor_location: doctor.floor_location,
      },
    });
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

// Cancel an appointment by booking reference
router.patch(
  '/:reference/cancel',
  asyncHandler(async (req, res) => {
    const ref = String(req.params.reference || '').trim().toUpperCase();
    const updateRes = await query(
      `UPDATE appointments
       SET status = 'Cancelled', updated_at = NOW()
       WHERE UPPER(booking_reference) = $1
       RETURNING *, TO_CHAR(appointment_date, 'YYYY-MM-DD') AS formatted_date`,
      [ref]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const row = updateRes.rows[0];
    res.json({
      data: {
        ...row,
        appointment_date: row.formatted_date,
      },
    });
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
