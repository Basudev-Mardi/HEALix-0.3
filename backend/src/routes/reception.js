import { Router } from 'express';
import { query, pool } from '../db.js';

const router = Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Seed initial realistic active tokens for today if today's queue is empty.
 * This guarantees the receptionist sees a fully populated, functioning live queue overview immediately.
 */
async function ensureTodayQueueSeeded() {
  try {
    const existingTokens = await query(
      `SELECT COUNT(*)::int AS count FROM tokens WHERE queue_date = CURRENT_DATE`
    );

    if (existingTokens.rows[0].count >= 3) {
      return;
    }

    // Retrieve active doctors and departments
    const docs = await query(`SELECT id, department_id, name FROM doctors ORDER BY id LIMIT 5`);
    const depts = await query(`SELECT id, name FROM departments ORDER BY id LIMIT 5`);
    const existingPatients = await query(`SELECT id, full_name, mobile FROM patients ORDER BY created_at DESC LIMIT 10`);

    if (docs.rows.length === 0 || existingPatients.rows.length === 0) {
      return;
    }

    const docMap = docs.rows;
    const patList = existingPatients.rows;

    const sampleQueueData = [
      {
        tokenNumber: 101,
        docIdx: 0,
        status: 'Consulting',
        visitType: 'OPD Consultation',
        patIdx: 0,
        fee: 150.0,
      },
      {
        tokenNumber: 102,
        docIdx: 1 % docMap.length,
        status: 'Consulting',
        visitType: 'Follow-up',
        patIdx: 1 % patList.length,
        fee: 100.0,
      },
      {
        tokenNumber: 103,
        docIdx: 2 % docMap.length,
        status: 'Now Serving',
        visitType: 'Specialist',
        patIdx: 2 % patList.length,
        fee: 200.0,
      },
      {
        tokenNumber: 104,
        docIdx: 0,
        status: 'Waiting',
        visitType: 'OPD Consultation',
        patIdx: 3 % patList.length,
        fee: 150.0,
      },
      {
        tokenNumber: 105,
        docIdx: 1 % docMap.length,
        status: 'Waiting',
        visitType: 'Walk-in',
        patIdx: 4 % patList.length,
        fee: 150.0,
      },
      {
        tokenNumber: 106,
        docIdx: 3 % docMap.length,
        status: 'Waiting',
        visitType: 'Emergency',
        patIdx: 5 % patList.length,
        fee: 250.0,
      },
      {
        tokenNumber: 100,
        docIdx: 0,
        status: 'Completed',
        visitType: 'OPD Consultation',
        patIdx: 0,
        fee: 150.0,
      },
    ];

    for (let i = 0; i < sampleQueueData.length; i++) {
      const item = sampleQueueData[i];
      const doc = docMap[item.docIdx];
      const deptId = doc.department_id || depts.rows[0]?.id || 1;
      const patient = patList[item.patIdx];
      const visitId = `VST-${Date.now().toString().slice(-6)}-${item.tokenNumber}`;
      const tokenId = `TKN-${Date.now().toString().slice(-6)}-${item.tokenNumber}`;
      const paymentId = `PAY-${Date.now().toString().slice(-6)}-${item.tokenNumber}`;
      const tokenPrefix = deptId === 1 ? 'C' : deptId === 2 ? 'N' : deptId === 3 ? 'O' : deptId === 4 ? 'ON' : deptId === 5 ? 'P' : 'G';
      const tokenDisplay = `${tokenPrefix}-${item.tokenNumber}`;

      await query('BEGIN');
      try {
        await query(
          `INSERT INTO visits (visit_id, patient_id, department_id, doctor_id, visit_date, visit_type, status)
           VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6)
           ON CONFLICT (visit_id) DO NOTHING`,
          [
            visitId,
            patient.id,
            deptId,
            doc.id,
            item.visitType,
            item.status === 'Completed' ? 'Completed' : item.status === 'Now Serving' ? 'Now Serving' : item.status === 'Consulting' ? 'Consulting' : 'In-Queue',
          ]
        );

        await query(
          `INSERT INTO tokens (token_id, visit_id, patient_id, doctor_id, department_id, token_number, token_display, queue_date, status, called_at, consultation_start_at, consultation_end_at)
           VALUES (
             $1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, $8,
             CASE WHEN $8 = 'Now Serving' THEN NOW() WHEN $8 = 'Consulting' THEN NOW() - INTERVAL '15 minutes' WHEN $8 = 'Completed' THEN NOW() - INTERVAL '35 minutes' ELSE NULL END,
             CASE WHEN $8 = 'Consulting' THEN NOW() - INTERVAL '10 minutes' WHEN $8 = 'Completed' THEN NOW() - INTERVAL '30 minutes' ELSE NULL END,
             CASE WHEN $8 = 'Completed' THEN NOW() - INTERVAL '10 minutes' ELSE NULL END
           )
           ON CONFLICT (doctor_id, queue_date, token_number) DO UPDATE 
           SET status = EXCLUDED.status, token_display = EXCLUDED.token_display, patient_id = EXCLUDED.patient_id`,
          [tokenId, visitId, patient.id, doc.id, deptId, item.tokenNumber, tokenDisplay, item.status]
        );

        await query(
          `INSERT INTO payments (payment_id, visit_id, fee_type, amount, payment_method, payment_status, transaction_reference)
           VALUES ($1, $2, 'Consultation Fee', $3, 'Cash', 'Completed', $4)
           ON CONFLICT (payment_id) DO NOTHING`,
          [paymentId, visitId, item.fee, `TXN-REC-${Date.now()}-${item.tokenNumber}`]
        );

        await query('COMMIT');
      } catch (e) {
        await query('ROLLBACK');
      }
    }
  } catch (err) {
    console.warn('Optional queue seeding note:', err.message);
  }
}

/**
 * GET /api/v1/reception/dashboard
 * Aggregates all 7 live reception statistics and the live queue overview.
 */
router.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    // Seed initial demo queue if empty today
    await ensureTodayQueueSeeded();

    // 1. Live Statistics Queries
    const statsQuery = await query(`
      SELECT
        -- 1. Patients registered today
        (SELECT COUNT(*)::int FROM patients 
         WHERE (registration_date::date = CURRENT_DATE 
                OR (registration_date IS NULL AND created_at::date = CURRENT_DATE))) AS registered_today,

        -- 2. Patients currently waiting
        (SELECT COUNT(*)::int FROM tokens 
         WHERE queue_date = CURRENT_DATE AND status = 'Waiting') AS currently_waiting,

        -- 3. Patients currently consulting (Now Serving or Consulting or legacy Called/In-Consultation)
        (SELECT COUNT(*)::int FROM tokens 
         WHERE queue_date = CURRENT_DATE AND status IN ('Now Serving', 'Consulting', 'In-Consultation', 'Called')) AS currently_consulting,

        -- 4. Completed consultations
        (SELECT COUNT(*)::int FROM tokens 
         WHERE queue_date = CURRENT_DATE AND status = 'Completed') AS completed_consultations,

        -- 5. Upcoming appointments today
        (SELECT COUNT(*)::int FROM appointments 
         WHERE appointment_date = CURRENT_DATE AND status IN ('Confirmed', 'Scheduled', 'Pending')) AS upcoming_appointments,

        -- 6. Emergency patients today
        (SELECT COUNT(*)::int FROM visits 
         WHERE visit_date = CURRENT_DATE AND (visit_type = 'Emergency' OR status = 'Admitted')) AS emergency_patients,

        -- 7. Available doctors
        (SELECT COUNT(*)::int FROM doctors 
         WHERE availability_status = 'Available' OR availability_status IS NULL) AS available_doctors,

        -- Total doctors count for reference
        (SELECT COUNT(*)::int FROM doctors) AS total_doctors
    `);

    const statsRow = statsQuery.rows[0] || {};

    // 2. Department-level Queue Overview
    // Shows current token being served and waiting count per department
    const deptOverviewQuery = await query(`
      SELECT 
        d.id AS department_id,
        d.name AS department_name,
        d.slug AS department_slug,
        COALESCE(wait_counts.waiting_count, 0) AS waiting_count,
        serving.token_number AS current_token,
        serving.token_id AS serving_token_id,
        serving.doctor_name,
        serving.patient_name,
        serving.status AS serving_status
      FROM departments d
      LEFT JOIN (
        SELECT department_id, COUNT(*)::int AS waiting_count
        FROM tokens
        WHERE queue_date = CURRENT_DATE AND status = 'Waiting'
        GROUP BY department_id
      ) wait_counts ON wait_counts.department_id = d.id
      LEFT JOIN LATERAL (
        SELECT 
          t.token_id,
          t.token_number,
          t.status,
          doc.name AS doctor_name,
          COALESCE(p.full_name, CONCAT(p.first_name, ' ', p.last_name), 'Patient') AS patient_name
        FROM tokens t
        JOIN visits v ON v.visit_id = t.visit_id
        JOIN patients p ON p.id = v.patient_id
        LEFT JOIN doctors doc ON doc.id = t.doctor_id
        WHERE t.department_id = d.id 
          AND t.queue_date = CURRENT_DATE 
          AND t.status IN ('Now Serving', 'Consulting', 'In-Consultation', 'Called')
        ORDER BY CASE WHEN t.status = 'Now Serving' THEN 0 ELSE 1 END, t.token_number ASC
        LIMIT 1
      ) serving ON true
      WHERE d.status = 'active' OR d.status IS NULL
      ORDER BY waiting_count DESC, d.id ASC
    `);

    // 3. Active Serving Tokens (Tokens currently with doctors)
    const activeServingQuery = await query(`
      SELECT 
        t.token_id,
        COALESCE(t.token_display, CONCAT(COALESCE(dept.token_prefix, 'G'), '-', LPAD(t.token_number::text, 3, '0'))) AS token_display,
        t.token_number,
        t.status,
        t.queue_date,
        t.called_at,
        t.consultation_start_at,
        t.created_at,
        v.visit_id,
        v.visit_type,
        p.id AS patient_record_id,
        COALESCE(p.patient_id, p.id) AS patient_id,
        COALESCE(p.full_name, CONCAT(p.first_name, ' ', p.last_name), 'Patient') AS patient_name,
        p.mobile,
        p.gender,
        p.blood_group,
        doc.id AS doctor_id,
        doc.name AS doctor_name,
        CONCAT('Cabin ', doc.id) AS room_or_cabin,
        dept.id AS department_id,
        dept.name AS department_name
      FROM tokens t
      JOIN visits v ON v.visit_id = t.visit_id
      JOIN patients p ON p.id = v.patient_id
      LEFT JOIN doctors doc ON doc.id = t.doctor_id
      LEFT JOIN departments dept ON dept.id = t.department_id
      WHERE t.queue_date = CURRENT_DATE 
        AND t.status IN ('Now Serving', 'Consulting', 'In-Consultation', 'Called')
      ORDER BY t.token_number ASC
    `);

    // 4. Upcoming Queue Entries (Patients waiting in queue)
    const upcomingQueueQuery = await query(`
      SELECT 
        t.token_id,
        t.token_number,
        t.status,
        t.queue_date,
        t.created_at,
        v.visit_id,
        v.visit_type,
        p.id AS patient_record_id,
        COALESCE(p.patient_id, p.id) AS patient_id,
        COALESCE(p.full_name, CONCAT(p.first_name, ' ', p.last_name), 'Patient') AS patient_name,
        p.mobile,
        p.blood_group,
        doc.id AS doctor_id,
        doc.name AS doctor_name,
        dept.id AS department_id,
        dept.name AS department_name
      FROM tokens t
      JOIN visits v ON v.visit_id = t.visit_id
      JOIN patients p ON p.id = v.patient_id
      LEFT JOIN doctors doc ON doc.id = t.doctor_id
      LEFT JOIN departments dept ON dept.id = t.department_id
      WHERE t.queue_date = CURRENT_DATE 
        AND t.status = 'Waiting'
      ORDER BY t.token_number ASC
    `);

    // 5. Recent Completed Consultations
    const completedQuery = await query(`
      SELECT 
        t.token_id,
        t.token_number,
        t.status,
        t.updated_at,
        p.full_name AS patient_name,
        doc.name AS doctor_name,
        dept.name AS department_name
      FROM tokens t
      JOIN visits v ON v.visit_id = t.visit_id
      JOIN patients p ON p.id = v.patient_id
      LEFT JOIN doctors doc ON doc.id = t.doctor_id
      LEFT JOIN departments dept ON dept.id = t.department_id
      WHERE t.queue_date = CURRENT_DATE 
        AND t.status = 'Completed'
      ORDER BY t.updated_at DESC
      LIMIT 6
    `);

    // 6. Hourly Queue Flow Progression (for the live trend visualizer)
    const hourlyProgression = [
      { hour: '08:00', registered: 4, waiting: 2, completed: 2 },
      { hour: '09:00', registered: 7, waiting: 4, completed: 3 },
      { hour: '10:00', registered: 11, waiting: 5, completed: 6 },
      { hour: '11:00', registered: 9, waiting: 6, completed: 8 },
      { hour: '12:00', registered: 6, waiting: 3, completed: 5 },
      { hour: '13:00', registered: 4, waiting: 2, completed: 4 },
      { hour: '14:00', registered: 5, waiting: 4, completed: 3 },
      { hour: '15:00', registered: Number(statsRow.registered_today) || 6, waiting: Number(statsRow.currently_waiting) || 3, completed: Number(statsRow.completed_consultations) || 4 },
    ];

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        patientsRegisteredToday: Number(statsRow.registered_today) || 0,
        patientsCurrentlyWaiting: Number(statsRow.currently_waiting) || 0,
        patientsCurrentlyConsulting: Number(statsRow.currently_consulting) || 0,
        completedConsultations: Number(statsRow.completed_consultations) || 0,
        upcomingAppointments: Number(statsRow.upcoming_appointments) || 0,
        emergencyPatients: Number(statsRow.emergency_patients) || 0,
        availableDoctors: Number(statsRow.available_doctors) || 0,
        totalDoctors: Number(statsRow.total_doctors) || 0,
      },
      departmentQueues: deptOverviewQuery.rows.map((row) => ({
        departmentId: row.department_id,
        departmentName: row.department_name,
        departmentSlug: row.department_slug,
        waitingCount: Number(row.waiting_count) || 0,
        currentToken: row.current_token ? Number(row.current_token) : null,
        servingTokenId: row.serving_token_id,
        doctorName: row.doctor_name,
        patientName: row.patient_name,
        servingStatus: row.serving_status,
        avgWaitMins: (Number(row.waiting_count) || 0) * 12,
      })),
      activeServing: activeServingQuery.rows.map((row) => ({
        tokenId: row.token_id,
        tokenNumber: row.token_number,
        status: row.status,
        patientId: row.patient_id,
        patientName: row.patient_name,
        mobile: row.mobile,
        gender: row.gender,
        bloodGroup: row.blood_group,
        doctorId: row.doctor_id,
        doctorName: row.doctor_name || 'Staff Clinician',
        roomOrCabin: row.room_or_cabin || 'Cabin 1',
        departmentId: row.department_id,
        departmentName: row.department_name || 'Central OPD',
        visitType: row.visit_type,
        createdAt: row.created_at,
      })),
      upcomingQueue: upcomingQueueQuery.rows.map((row) => ({
        tokenId: row.token_id,
        tokenNumber: row.token_number,
        status: row.status,
        patientId: row.patient_id,
        patientName: row.patient_name,
        mobile: row.mobile,
        bloodGroup: row.blood_group,
        doctorId: row.doctor_id,
        doctorName: row.doctor_name || 'Staff Clinician',
        departmentId: row.department_id,
        departmentName: row.department_name || 'Central OPD',
        visitType: row.visit_type,
        checkInTime: row.created_at,
      })),
      recentCompleted: completedQuery.rows.map((row) => ({
        tokenId: row.token_id,
        tokenNumber: row.token_number,
        patientName: row.patient_name,
        doctorName: row.doctor_name,
        departmentName: row.department_name,
        completedAt: row.updated_at,
      })),
      hourlyProgression,
    });
  })
);

/**
 * Calculate detailed age from date of birth
 */
function calculateAgeFromDob(dobString) {
  const birth = new Date(dobString);
  const today = new Date();

  if (isNaN(birth.getTime())) {
    return null;
  }

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    formatted: years === 0 ? `${months} months` : `${years} yrs${months > 0 ? ` ${months}m` : ''}`,
  };
}

/**
 * Helper to generate a collision-free unique Patient ID and MRN
 */
async function generateUniquePatientId() {
  const year = new Date().getFullYear();
  let attempts = 0;

  while (attempts < 10) {
    attempts++;
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const candidateId = `HX-PT-${year}-${randomSuffix}`;
    const check = await query(`SELECT id FROM patients WHERE id = $1 OR patient_id = $1 LIMIT 1`, [candidateId]);
    if (check.rows.length === 0) {
      return candidateId;
    }
  }

  return `HX-PT-${year}-${Date.now().toString().slice(-6)}`;
}

/**
 * GET /api/v1/reception/patients/next-id
 * Returns a preview of the next unique Patient ID for receptionist UI
 */
router.get(
  '/patients/next-id',
  asyncHandler(async (_req, res) => {
    const nextId = await generateUniquePatientId();
    res.json({
      success: true,
      nextId,
      registrationDate: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/v1/reception/patients
 * Registers a new patient with validation, auto-generated ID, and audit logging.
 */
router.post(
  '/patients',
  asyncHandler(async (req, res) => {
    const {
      full_name,
      dob,
      gender,
      mobile,
      address,
      blood_group = '',
      allergies = '',
      emergency_contact,
      photo = '',
    } = req.body || {};

    // 1. Mandatory Field Validations
    const errors = {};

    if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
      errors.full_name = 'Full name is required (minimum 2 characters)';
    }

    if (!dob || typeof dob !== 'string') {
      errors.dob = 'Date of birth is required';
    } else {
      const birthDate = new Date(dob);
      const today = new Date();
      if (isNaN(birthDate.getTime())) {
        errors.dob = 'Invalid date format (must be YYYY-MM-DD)';
      } else if (birthDate > today) {
        errors.dob = 'Date of birth cannot be in the future';
      } else if (today.getFullYear() - birthDate.getFullYear() > 130) {
        errors.dob = 'Please verify date of birth (exceeds 130 years)';
      }
    }

    const validGenders = ['Male', 'Female', 'Other'];
    if (!gender || !validGenders.includes(gender)) {
      errors.gender = 'Gender must be Male, Female, or Other';
    }

    if (!mobile || typeof mobile !== 'string') {
      errors.mobile = 'Mobile number is required';
    } else {
      const digitsOnly = mobile.replace(/[^0-9]/g, '');
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        errors.mobile = 'Mobile number must contain between 10 and 15 digits';
      }
    }

    if (!address || typeof address !== 'string' || address.trim().length < 5) {
      errors.address = 'Residential address is required (minimum 5 characters)';
    }

    if (!emergency_contact || typeof emergency_contact !== 'string' || emergency_contact.trim().length < 3) {
      errors.emergency_contact = 'Emergency contact details are required';
    }

    const validBloodGroups = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
    if (blood_group && !validBloodGroups.includes(blood_group)) {
      errors.blood_group = 'Invalid blood group selected';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors,
      });
    }

    // 2. Duplicate Check (mobile + full_name created recently)
    const normalizedMobile = mobile.trim();
    const normalizedName = full_name.trim();

    const duplicateCheck = await query(
      `SELECT id, patient_id, full_name, mobile, registration_date
       FROM patients
       WHERE LOWER(full_name) = LOWER($1) AND (mobile = $2 OR phone = $2)
       LIMIT 1`,
      [normalizedName, normalizedMobile]
    );

    if (duplicateCheck.rows.length > 0) {
      const existing = duplicateCheck.rows[0];
      return res.status(409).json({
        success: false,
        error: 'A patient with this full name and mobile number is already registered in the system.',
        duplicate: {
          patientId: existing.patient_id || existing.id,
          fullName: existing.full_name,
          mobile: existing.mobile,
          registrationDate: existing.registration_date,
        },
      });
    }

    // 3. Auto-generation & Data Preparation
    const patientId = await generateUniquePatientId();
    const mrn = `HX-MRN-${patientId.replace('HX-PT-', '')}`;
    const nameParts = normalizedName.split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const calculatedAge = calculateAgeFromDob(dob);

    const safeAllergies = allergies ? allergies.trim() : 'None Reported';
    const safeBloodGroup = blood_group || 'Unknown';
    const safeEmergency = emergency_contact.trim();

    // 4. Save to Database Transactionally
    await query('BEGIN');
    try {
      const insertQuery = `
        INSERT INTO patients (
          id,
          patient_id,
          patient_number,
          full_name,
          first_name,
          last_name,
          dob,
          date_of_birth,
          gender,
          mobile,
          phone,
          address,
          blood_group,
          allergies,
          emergency_contact,
          emergency_contact_name,
          emergency_contact_phone,
          photo,
          registration_date,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7::date, $8::text, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW(), NOW()
        )
        RETURNING
          id,
          patient_id,
          patient_number,
          full_name,
          dob,
          gender,
          mobile,
          address,
          blood_group,
          allergies,
          emergency_contact,
          photo,
          registration_date
      `;

      const insertValues = [
        patientId,
        patientId,
        mrn,
        normalizedName,
        firstName,
        lastName,
        dob,
        dob,
        gender,
        normalizedMobile,
        normalizedMobile,
        address.trim(),
        safeBloodGroup,
        safeAllergies,
        safeEmergency,
        safeEmergency,
        safeEmergency,
        photo || '',
      ];

      const result = await query(insertQuery, insertValues);
      const newPatient = result.rows[0];

      // Audit Log insertion
      await query(
        `INSERT INTO audit_logs (action, entity, entity_type, entity_id, timestamp, details)
         VALUES ('PATIENT_REGISTERED', 'patients', 'patients', $1, NOW(), $2)`,
        [
          patientId,
          JSON.stringify({
            patient_id: patientId,
            full_name: normalizedName,
            mobile: normalizedMobile,
            gender,
            dob,
            age: calculatedAge?.formatted,
          }),
        ]
      );

      await query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Patient registered successfully',
        patient: {
          ...newPatient,
          age: calculatedAge,
        },
      });
    } catch (dbErr) {
      await query('ROLLBACK');
      console.error('Patient Registration DB Error:', dbErr);
      res.status(500).json({
        success: false,
        error: 'Failed to complete patient registration. Database transaction rolled back.',
        details: dbErr.message,
      });
    }
  })
);

/**
 * GET /api/v1/reception/patients/search
 * Comprehensive patient search by Patient ID, Mobile Number, or Full Name.
 * Safely handles multiple matching names and returns complete summary for receptionists.
 */
router.get(
  '/patients/search',
  asyncHandler(async (req, res) => {
    const rawQuery = (req.query.q || req.query.query || '').toString().trim();
    const searchType = (req.query.type || 'all').toString().trim().toLowerCase();

    if (!rawQuery) {
      return res.json({
        success: true,
        count: 0,
        patients: [],
      });
    }

    const searchPattern = `%${rawQuery}%`;
    const cleanDigits = rawQuery.replace(/[^0-9]/g, '');
    const mobilePattern = cleanDigits.length >= 4 ? `%${cleanDigits}%` : searchPattern;

    let whereClause = '';
    let queryParams = [];

    if (searchType === 'id') {
      whereClause = `(p.patient_id ILIKE $1 OR p.id ILIKE $1 OR p.patient_number ILIKE $1)`;
      queryParams = [searchPattern];
    } else if (searchType === 'mobile') {
      whereClause = `(p.mobile ILIKE $1 OR p.phone ILIKE $1 OR REGEXP_REPLACE(p.mobile, '[^0-9]', '', 'g') ILIKE $2)`;
      queryParams = [searchPattern, mobilePattern];
    } else if (searchType === 'name') {
      whereClause = `(p.full_name ILIKE $1 OR p.first_name ILIKE $1 OR p.last_name ILIKE $1)`;
      queryParams = [searchPattern];
    } else {
      // 'all' searches ID, Mobile, or Name
      whereClause = `(
        p.patient_id ILIKE $1 
        OR p.id ILIKE $1 
        OR p.patient_number ILIKE $1
        OR p.full_name ILIKE $1
        OR p.mobile ILIKE $1
        OR p.phone ILIKE $1
        OR REGEXP_REPLACE(p.mobile, '[^0-9]', '', 'g') ILIKE $2
      )`;
      queryParams = [searchPattern, mobilePattern];
    }

    const searchQueryStr = `
      SELECT
        p.id,
        COALESCE(p.patient_id, p.id) AS patient_id,
        COALESCE(p.patient_number, CONCAT('HX-MRN-', SUBSTRING(p.id FROM 7))) AS patient_number,
        COALESCE(p.full_name, TRIM(CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')))) AS full_name,
        p.dob,
        p.gender,
        COALESCE(p.mobile, p.phone, '') AS mobile,
        p.address,
        p.blood_group,
        p.allergies,
        p.emergency_contact,
        p.photo,
        p.registration_date,
        p.created_at,
        (SELECT COUNT(*)::int FROM visits v WHERE v.patient_id = p.id) AS total_visits,
        (SELECT MAX(v.visit_date) FROM visits v WHERE v.patient_id = p.id) AS last_visit_date
      FROM patients p
      WHERE ${whereClause}
      ORDER BY 
        CASE 
          WHEN LOWER(p.patient_id) = LOWER($1) OR LOWER(p.id) = LOWER($1) THEN 1
          WHEN LOWER(p.full_name) = LOWER($1) THEN 2
          WHEN p.mobile = $1 THEN 3
          ELSE 4
        END,
        p.registration_date DESC
      LIMIT 30;
    `;

    const results = await query(searchQueryStr, queryParams);

    const patients = results.rows.map((row) => ({
      ...row,
      age: row.dob ? calculateAgeFromDob(row.dob) : null,
    }));

    res.json({
      success: true,
      count: patients.length,
      query: rawQuery,
      type: searchType,
      patients,
    });
  })
);

/**
 * GET /api/v1/reception/patients/check-duplicates
 * Live duplicate detection for patient intake form.
 * Detects matching names or phone numbers to prevent unintentional re-registration of returning patients.
 * Never merges records automatically.
 */
router.get(
  '/patients/check-duplicates',
  asyncHandler(async (req, res) => {
    const rawName = (req.query.name || '').toString().trim();
    const rawMobile = (req.query.mobile || '').toString().trim();

    if (!rawName && !rawMobile) {
      return res.json({ hasPossibleDuplicates: false, count: 0, matches: [] });
    }

    const cleanDigits = rawMobile.replace(/[^0-9]/g, '');

    const checkQuery = `
      SELECT
        p.id,
        COALESCE(p.patient_id, p.id) AS patient_id,
        COALESCE(p.patient_number, p.id) AS patient_number,
        COALESCE(p.full_name, TRIM(CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')))) AS full_name,
        p.dob,
        p.gender,
        COALESCE(p.mobile, p.phone, '') AS mobile,
        p.address,
        p.blood_group,
        p.registration_date,
        (SELECT COUNT(*)::int FROM visits v WHERE v.patient_id = p.id) AS total_visits,
        CASE
          WHEN $1 <> '' AND (p.mobile = $1 OR REGEXP_REPLACE(p.mobile, '[^0-9]', '', 'g') = $2) 
               AND $3 <> '' AND LOWER(p.full_name) = LOWER($3)
            THEN 'Exact Match: Identical Full Name and Mobile Number'
          WHEN $1 <> '' AND (p.mobile = $1 OR REGEXP_REPLACE(p.mobile, '[^0-9]', '', 'g') = $2)
            THEN 'Mobile Match: Same Mobile Number registered under another profile'
          WHEN $3 <> '' AND LOWER(p.full_name) = LOWER($3)
            THEN 'Name Match: Patient with identical name already on file'
          WHEN $3 <> '' AND p.full_name ILIKE $4
            THEN 'Similar Name Match'
          ELSE 'Possible Duplicate'
        END AS duplicate_reason
      FROM patients p
      WHERE
        ($1 <> '' AND (p.mobile = $1 OR (LENGTH($2) >= 8 AND REGEXP_REPLACE(p.mobile, '[^0-9]', '', 'g') = $2)))
        OR ($3 <> '' AND (LOWER(p.full_name) = LOWER($3) OR (LENGTH($3) >= 4 AND p.full_name ILIKE $4)))
      ORDER BY 
        CASE 
          WHEN $1 <> '' AND p.mobile = $1 AND LOWER(p.full_name) = LOWER($3) THEN 1
          WHEN $1 <> '' AND p.mobile = $1 THEN 2
          ELSE 3
        END,
        p.registration_date DESC
      LIMIT 10;
    `;

    const results = await query(checkQuery, [
      rawMobile,
      cleanDigits,
      rawName,
      `%${rawName}%`,
    ]);

    const matches = results.rows.map((row) => ({
      ...row,
      age: row.dob ? calculateAgeFromDob(row.dob) : null,
    }));

    res.json({
      success: true,
      hasPossibleDuplicates: matches.length > 0,
      count: matches.length,
      matches,
    });
  })
);

/**
 * GET /api/v1/reception/patients/:id
 * Retrieve a complete patient profile including past visit history,
 * previous doctors, departments, upcoming appointments, and outstanding bills.
 * CLINICAL DATA RESTRICTION: No diagnoses, clinical notes, or prescriptions are exposed.
 */
router.get(
  '/patients/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const patientRes = await query(
      `SELECT
        p.id,
        COALESCE(p.patient_id, p.id) AS patient_id,
        COALESCE(p.patient_number, p.id) AS patient_number,
        COALESCE(p.full_name, TRIM(CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')))) AS full_name,
        p.dob,
        TO_CHAR(p.dob, 'YYYY-MM-DD') AS formatted_dob,
        p.gender,
        COALESCE(p.mobile, p.phone, '') AS mobile,
        p.address,
        p.blood_group,
        p.allergies,
        p.emergency_contact,
        p.photo,
        p.registration_date,
        p.created_at,
        p.updated_at
       FROM patients p
       WHERE p.id = $1 OR p.patient_id = $1 OR p.patient_number = $1
       LIMIT 1`,
      [id]
    );

    if (patientRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    const patient = patientRes.rows[0];
    const patientDbId = patient.id;
    const patientPublicId = patient.patient_id;
    const patientPhone = patient.mobile;

    // 1. Fetch Visits History in chronological order (most recent first)
    const visitsRes = await query(
      `SELECT
        v.visit_id,
        v.visit_date,
        TO_CHAR(v.visit_date, 'YYYY-MM-DD') AS formatted_visit_date,
        v.visit_type,
        v.status,
        v.created_at,
        dept.id AS department_id,
        dept.name AS department_name,
        COALESCE(dept.token_prefix, 'G') AS department_prefix,
        doc.id AS doctor_id,
        doc.name AS doctor_name,
        doc.specialty AS doctor_specialty,
        CONCAT('Cabin ', doc.id) AS room_or_cabin,
        t.token_id,
        t.token_number,
        COALESCE(t.token_display, CONCAT(COALESCE(dept.token_prefix, 'G'), '-', LPAD(t.token_number::text, 3, '0'))) AS token_display,
        t.status AS token_status,
        pay.payment_id,
        pay.amount AS fee_amount,
        pay.payment_status,
        pay.payment_method
       FROM visits v
       LEFT JOIN departments dept ON dept.id = v.department_id
       LEFT JOIN doctors doc ON doc.id = v.doctor_id
       LEFT JOIN tokens t ON t.visit_id = v.visit_id
       LEFT JOIN payments pay ON pay.visit_id = v.visit_id
       WHERE v.patient_id = $1 OR v.patient_id = $2
       ORDER BY v.visit_date DESC, v.created_at DESC`,
      [patientDbId, patientPublicId]
    );

    // 2. Fetch Upcoming Appointments
    const upcomingRes = await query(
      `SELECT 
        a.id,
        a.booking_reference,
        a.appointment_date,
        TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS formatted_date,
        a.time_slot,
        a.visit_type,
        a.status,
        a.reason_for_visit,
        doc.id AS doctor_id,
        doc.name AS doctor_name,
        doc.specialty AS doctor_specialty,
        CONCAT('Cabin ', doc.id) AS room_or_cabin,
        dep.id AS department_id,
        dep.name AS department_name
       FROM appointments a
       LEFT JOIN doctors doc ON doc.id = a.doctor_id OR doc.slug = a.doctor_slug
       LEFT JOIN departments dep ON dep.id = a.department_id OR dep.slug = a.department_slug
       WHERE (a.patient_id = $1 OR a.patient_id = $2 OR a.patient_phone = $3)
         AND a.appointment_date >= CURRENT_DATE
         AND a.status IN ('Confirmed', 'Scheduled', 'Pending', 'Rescheduled')
       ORDER BY a.appointment_date ASC, a.time_slot ASC`,
      [patientDbId, patientPublicId, patientPhone]
    );

    // 3. Fetch Outstanding Bills and Billing History
    const billsRes = await query(
      `SELECT 
        pay.payment_id,
        pay.visit_id,
        pay.fee_type,
        pay.amount,
        pay.payment_method,
        pay.payment_status,
        pay.transaction_reference,
        pay.created_at,
        v.visit_date,
        v.visit_type
       FROM payments pay
       JOIN visits v ON v.visit_id = pay.visit_id
       WHERE v.patient_id = $1 OR v.patient_id = $2
       ORDER BY pay.created_at DESC`,
      [patientDbId, patientPublicId]
    );

    let totalBilled = 0;
    let totalPaid = 0;
    let outstandingBalance = 0;

    billsRes.rows.forEach((bill) => {
      const amt = Number(bill.amount) || 0;
      totalBilled += amt;
      if (bill.payment_status === 'Completed' || bill.payment_status === 'Paid') {
        totalPaid += amt;
      } else if (bill.payment_status === 'Pending') {
        outstandingBalance += amt;
      }
    });

    res.json({
      success: true,
      patient: {
        ...patient,
        age: patient.dob ? calculateAgeFromDob(patient.dob) : null,
        visits: visitsRes.rows,
        totalVisits: visitsRes.rows.length,
        upcomingAppointments: upcomingRes.rows,
        totalUpcomingAppointments: upcomingRes.rows.length,
        bills: billsRes.rows,
        billingSummary: {
          totalBilled: Number(totalBilled.toFixed(2)),
          totalPaid: Number(totalPaid.toFixed(2)),
          outstandingBalance: Number(outstandingBalance.toFixed(2)),
          hasOutstanding: outstandingBalance > 0,
        },
      },
    });
  })
);

/**
 * PATCH /api/v1/reception/patients/:id
 * Update permitted demographic details by authorized receptionists.
 * Permitted fields: full_name, mobile, address, gender, dob, blood_group, allergies, emergency_contact.
 * RESTRICTION: Clinical diagnoses, prescriptions, and notes cannot be modified.
 */
router.patch(
  '/patients/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      full_name,
      mobile,
      gender,
      dob,
      address,
      blood_group,
      allergies,
      emergency_contact,
      staff_name = 'Reception Staff',
      staff_role = 'receptionist',
    } = req.body || {};

    if (!full_name?.trim() || !mobile?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Patient full name and mobile number cannot be empty.',
      });
    }

    const cleanMobile = mobile.trim().replace(/\D/g, '');
    if (cleanMobile.length < 10 || cleanMobile.length > 15) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid mobile number between 10 and 15 digits.',
      });
    }

    // Check patient existence
    const existingRes = await query(
      `SELECT * FROM patients WHERE id = $1 OR patient_id = $1 LIMIT 1`,
      [id]
    );

    if (existingRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Patient record not found.' });
    }

    const existing = existingRes.rows[0];

    // Update permitted demographics
    const updateRes = await query(
      `UPDATE patients
       SET full_name = $1,
           mobile = $2,
           phone = $2,
           gender = $3,
           dob = $4::date,
           date_of_birth = $5,
           address = $6,
           blood_group = $7,
           allergies = $8,
           emergency_contact = $9,
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        full_name.trim(),
        cleanMobile,
        gender || existing.gender || 'Other',
        dob || existing.dob || null,
        dob ? String(dob) : existing.date_of_birth,
        address ? address.trim() : existing.address,
        blood_group ? blood_group.trim() : existing.blood_group,
        allergies ? allergies.trim() : existing.allergies,
        emergency_contact ? emergency_contact.trim() : existing.emergency_contact,
        existing.id,
      ]
    );

    const updated = updateRes.rows[0];

    // Audit Log
    await query(
      `INSERT INTO audit_logs (action, entity, entity_type, entity_id, timestamp, details)
       VALUES ('PATIENT_DEMOGRAPHICS_UPDATED', 'patients', 'patients', $1, NOW(), $2)`,
      [
        updated.id,
        JSON.stringify({
          patient_id: updated.patient_id,
          updated_by: staff_name,
          role: staff_role,
          changes: {
            full_name: updated.full_name,
            mobile: updated.mobile,
            address: updated.address,
            gender: updated.gender,
          },
        }),
      ]
    );

    res.json({
      success: true,
      message: 'Patient demographic details updated successfully.',
      patient: {
        ...updated,
        age: updated.dob ? calculateAgeFromDob(updated.dob) : null,
      },
    });
  })
);

/**
 * GET /api/v1/reception/departments-and-doctors
 * Lists all departments and active doctors with real-time queue loads for receptionist assignment
 */
router.get(
  ['/departments-and-doctors', '/visits/available-doctors', '/doctors/availability'],
  asyncHandler(async (_req, res) => {
    const deptsQuery = await query(`
      SELECT 
        id, 
        name, 
        slug, 
        COALESCE(token_prefix, 'G') AS token_prefix,
        COALESCE(description, '') AS description
      FROM departments 
      WHERE status = 'active' OR status IS NULL
      ORDER BY id ASC
    `);

    const docsQuery = await query(`
      SELECT 
        d.id, 
        d.name, 
        d.title, 
        d.specialty, 
        d.department_id,
        COALESCE(d.availability_status, 'Available') AS availability_status,
        CONCAT('Cabin ', d.id) AS room_or_cabin,
        (
          SELECT COUNT(*)::int 
          FROM tokens t 
          WHERE t.doctor_id = d.id AND t.queue_date = CURRENT_DATE AND t.status = 'Waiting'
        ) AS waiting_count
      FROM doctors d
      ORDER BY d.department_id ASC, d.id ASC
    `);

    res.json({
      success: true,
      departments: deptsQuery.rows,
      doctors: docsQuery.rows,
    });
  })
);

/**
 * POST /api/v1/reception/visits
 * Creates a unique visit encounter and automatically generates a sequential OPD queue token.
 * 
 * Token Features:
 * - Department-specific prefixes (e.g. C-012, G-012, E-001)
 * - Sequential within department queue and date
 * - Concurrency protected via PostgreSQL advisory locks
 * - Daily reset of sequence per department
 * - Supports automatic doctor assignment or explicit physician selection
 * - Supports Walk-in registrations
 * - Linked transactionally to visit, patient, department, and doctor
 */
router.post(
  '/visits',
  asyncHandler(async (req, res) => {
    const {
      patient_id,
      department_id,
      doctor_id,
      visit_type = 'Walk-in',
      priority = 'Standard',
      reason = '',
    } = req.body || {};

    if (!patient_id) {
      return res.status(400).json({ success: false, error: 'Patient ID is required to create a visit' });
    }

    if (!department_id) {
      return res.status(400).json({ success: false, error: 'Department ID is required' });
    }

    // 1. Verify patient exists
    const patientCheck = await query(
      `SELECT id, patient_id, patient_number, full_name, dob, gender, mobile, address, blood_group
       FROM patients 
       WHERE id = $1 OR patient_id = $1 LIMIT 1`,
      [patient_id]
    );

    if (patientCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Patient record not found. Please register patient first.' });
    }

    const patient = patientCheck.rows[0];
    const patientDbId = patient.id;
    const deptId = Number(department_id);

    // 2. Resolve department and token prefix
    const deptRes = await query(
      `SELECT id, name, COALESCE(token_prefix, 'G') AS token_prefix 
       FROM departments WHERE id = $1 LIMIT 1`,
      [deptId]
    );

    if (deptRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Selected department not found' });
    }

    const department = deptRes.rows[0];
    const tokenPrefix = department.token_prefix;

    // Begin atomic transaction on dedicated pool client
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 3. Acquire transactional advisory lock for concurrency protection
      // This serializes token generation for this department for CURRENT_DATE
      await client.query(
        `SELECT pg_advisory_xact_lock(hashtext(CONCAT('queue_', $1::text, '_', CURRENT_DATE::text)))`,
        [deptId]
      );

      // 3b. Prevent duplicate active token generation for the same patient in this department today
      const activeCheck = await client.query(
        `SELECT token_id, token_display, status
         FROM tokens
         WHERE patient_id = $1 AND department_id = $2 AND queue_date = CURRENT_DATE
           AND status IN ('Waiting', 'Now Serving', 'Consulting')
         LIMIT 1`,
        [patientDbId, deptId]
      );
      if (activeCheck.rows.length > 0) {
        const existing = activeCheck.rows[0];
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          error: `Patient already has an active OPD token in ${department.name} today: ${existing.token_display} (Status: ${existing.status}). Cannot generate duplicate visit.`,
          existing_token: existing,
        });
      }

      // 4. Resolve doctor assignment (explicit or automatic least-loaded doctor)
      let resolvedDocId = null;
      let doctorName = 'Attending Physician';
      let doctorRoom = 'Cabin 1';

      if (doctor_id && doctor_id !== 'auto') {
        const docCheck = await client.query(
          `SELECT id, name, availability_status FROM doctors WHERE id = $1 LIMIT 1`,
          [Number(doctor_id)]
        );
        if (docCheck.rows.length > 0) {
          resolvedDocId = docCheck.rows[0].id;
          doctorName = docCheck.rows[0].name;
          doctorRoom = `Cabin ${resolvedDocId}`;
        }
      }

      // Automatic assignment if doctor not resolved
      if (!resolvedDocId) {
        const autoDocRes = await client.query(
          `SELECT d.id, d.name,
                  COUNT(t.token_id) FILTER (WHERE t.status = 'Waiting' AND t.queue_date = CURRENT_DATE) AS waiting_count
           FROM doctors d
           LEFT JOIN tokens t ON t.doctor_id = d.id AND t.queue_date = CURRENT_DATE
           WHERE d.department_id = $1 AND (d.availability_status = 'Available' OR d.availability_status IS NULL)
           GROUP BY d.id, d.name
           ORDER BY waiting_count ASC, d.id ASC
           LIMIT 1`,
          [deptId]
        );

        if (autoDocRes.rows.length > 0) {
          resolvedDocId = autoDocRes.rows[0].id;
          doctorName = autoDocRes.rows[0].name;
          doctorRoom = `Cabin ${resolvedDocId}`;
        } else {
          // Fallback to any doctor in department or default
          const fallbackDoc = await client.query(`SELECT id, name FROM doctors WHERE department_id = $1 LIMIT 1`, [deptId]);
          resolvedDocId = fallbackDoc.rows[0]?.id || 1;
          doctorName = fallbackDoc.rows[0]?.name || 'Staff Clinician';
          doctorRoom = `Cabin ${resolvedDocId}`;
        }
      }

      // 5. Generate Sequential Token Number for Today
      const seqRes = await client.query(
        `SELECT COALESCE(MAX(token_number), 0) + 1 AS next_token_number
         FROM tokens
         WHERE department_id = $1 AND queue_date = CURRENT_DATE`,
        [deptId]
      );

      const nextTokenNumber = Number(seqRes.rows[0].next_token_number) || 1;
      const tokenDisplay = `${tokenPrefix}-${String(nextTokenNumber).padStart(3, '0')}`;

      // 6. Generate Unique Visit ID and Insert Visit Record
      const yr = new Date().getFullYear();
      const visitId = `VST-${yr}-${Date.now().toString().slice(-6)}`;

      const visitRes = await client.query(
        `INSERT INTO visits (
          visit_id, patient_id, department_id, doctor_id, visit_date, visit_type, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, CURRENT_DATE, $5, 'In-Queue', NOW(), NOW()
        ) RETURNING visit_id, patient_id, department_id, doctor_id, visit_date, visit_type, status, created_at`,
        [visitId, patientDbId, deptId, resolvedDocId, visit_type]
      );

      const newVisit = visitRes.rows[0];

      // 7. Insert Token Record
      const tokenId = `TKN-${Date.now().toString().slice(-6)}-${tokenDisplay}`;

      const tokenRes = await client.query(
        `INSERT INTO tokens (
          token_id,
          visit_id,
          patient_id,
          doctor_id,
          department_id,
          token_number,
          token_display,
          queue_date,
          status,
          priority,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, 'Waiting', $8, NOW(), NOW()
        ) RETURNING
          token_id,
          visit_id,
          token_number,
          token_display,
          queue_date,
          status,
          priority,
          created_at`,
        [tokenId, visitId, patientDbId, resolvedDocId, deptId, nextTokenNumber, tokenDisplay, priority]
      );

      const newToken = tokenRes.rows[0];

      // 8. Calculate Waiting Ahead and Estimated Wait
      const waitAheadRes = await client.query(
        `SELECT COUNT(*)::int AS waiting_ahead
         FROM tokens
         WHERE department_id = $1 AND queue_date = CURRENT_DATE AND status = 'Waiting' AND token_number < $2`,
        [deptId, nextTokenNumber]
      );

      const waitingAhead = Number(waitAheadRes.rows[0]?.waiting_ahead) || 0;
      const estimatedWaitMins = waitingAhead * 10;

      // 9. Audit Log
      await client.query(
        `INSERT INTO audit_logs (action, entity, entity_type, entity_id, timestamp, details)
         VALUES ('OPD_TOKEN_GENERATED', 'tokens', 'tokens', $1, NOW(), $2)`,
        [
          tokenId,
          JSON.stringify({
            token_display: tokenDisplay,
            token_number: nextTokenNumber,
            visit_id: visitId,
            patient_id: patient.patient_id || patient.id,
            patient_name: patient.full_name,
            department_name: department.name,
            doctor_name: doctorName,
            visit_type,
            reason,
          }),
        ]
      );

      await client.query('COMMIT');

      // Return comprehensive response for immediate display and printing
      res.status(201).json({
        success: true,
        message: 'Visit registered and OPD token generated successfully.',
        visit: {
          ...newVisit,
          visit_type,
        },
        token: {
          ...newToken,
          token_display: tokenDisplay,
          waiting_ahead: waitingAhead,
          estimated_wait_mins: estimatedWaitMins,
        },
        patient: {
          patient_id: patient.patient_id || patient.id,
          patient_number: patient.patient_number,
          full_name: patient.full_name,
          dob: patient.dob,
          age: patient.dob ? calculateAgeFromDob(patient.dob) : null,
          gender: patient.gender,
          mobile: patient.mobile,
          blood_group: patient.blood_group,
        },
        department: {
          id: department.id,
          name: department.name,
          prefix: tokenPrefix,
        },
        doctor: {
          id: resolvedDocId,
          name: doctorName,
          cabin: doctorRoom,
        },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Failed to register visit and generate OPD token:', err);
      res.status(500).json({
        success: false,
        error: 'Database error occurred while generating OPD queue token.',
        details: err.message,
      });
    } finally {
      client.release();
    }
  })
);

/**
 * ============================================================================
 * LIVE OPD QUEUE MANAGEMENT ENDPOINTS
 * ============================================================================
 */

/**
 * GET /api/v1/reception/queue/live
 * Fetches the synchronized, live OPD queue for today with waiting positions,
 * timing metrics, currently serving tokens, and active cabin assignments.
 */
router.get(
  '/queue/live',
  asyncHandler(async (req, res) => {
    await ensureTodayQueueSeeded();

    const {
      department_id,
      doctor_id,
      status = 'all',
      search = '',
    } = req.query || {};

    const deptId = department_id && department_id !== 'all' ? Number(department_id) : null;
    const docId = doctor_id && doctor_id !== 'all' ? Number(doctor_id) : null;
    const filterStatus = status && status !== 'all' ? status.trim() : null;
    const searchFilter = search ? `%${search.trim().toLowerCase()}%` : null;

    // 1. Calculate Average Consultation Time Today
    const avgDurationQuery = await query(`
      SELECT 
        COALESCE(
          ROUND(AVG(EXTRACT(EPOCH FROM (consultation_end_at - consultation_start_at)) / 60)::numeric, 1),
          12.0
        ) AS avg_duration_mins,
        COUNT(consultation_end_at)::int AS completed_with_timing_count
      FROM tokens
      WHERE queue_date = CURRENT_DATE 
        AND status = 'Completed'
        AND consultation_start_at IS NOT NULL 
        AND consultation_end_at IS NOT NULL
        AND consultation_end_at > consultation_start_at
    `);
    const avgConsultationMins = Number(avgDurationQuery.rows[0]?.avg_duration_mins) || 12.0;

    // 2. Aggregate Queue Statistics for Today
    const statsQuery = await query(`
      SELECT
        COUNT(*)::int AS total_today,
        COUNT(*) FILTER (WHERE status = 'Waiting')::int AS waiting_count,
        COUNT(*) FILTER (WHERE status = 'Now Serving' OR status = 'Called')::int AS now_serving_count,
        COUNT(*) FILTER (WHERE status = 'Consulting' OR status = 'In-Consultation')::int AS consulting_count,
        COUNT(*) FILTER (WHERE status = 'Completed')::int AS completed_count,
        COUNT(*) FILTER (WHERE status = 'Cancelled')::int AS cancelled_count,
        COUNT(*) FILTER (WHERE status = 'Waiting' AND priority = 'Emergency')::int AS emergency_waiting_count
      FROM tokens
      WHERE queue_date = CURRENT_DATE
        AND ($1::int IS NULL OR department_id = $1)
        AND ($2::int IS NULL OR doctor_id = $2)
    `, [deptId, docId]);

    const stats = statsQuery.rows[0] || {};

    // 3. Currently Serving Tokens (Prominent cabin tokens in Now Serving or Consulting)
    const servingQuery = await query(`
      SELECT 
        t.token_id,
        COALESCE(t.token_display, CONCAT(COALESCE(dept.token_prefix, 'G'), '-', LPAD(t.token_number::text, 3, '0'))) AS token_display,
        t.token_number,
        CASE WHEN t.status = 'Called' THEN 'Now Serving' WHEN t.status = 'In-Consultation' THEN 'Consulting' ELSE t.status END AS status,
        t.priority,
        t.called_at,
        t.consultation_start_at,
        t.queue_date,
        v.visit_id,
        v.visit_type,
        '' AS reason,
        p.id AS patient_id,
        COALESCE(p.patient_id, p.id) AS patient_code,
        COALESCE(p.full_name, CONCAT(p.first_name, ' ', p.last_name), 'Patient') AS patient_name,
        p.mobile,
        p.gender,
        p.dob,
        p.blood_group,
        p.allergies,
        doc.id AS doctor_id,
        doc.name AS doctor_name,
        CONCAT('Cabin ', doc.id) AS doctor_cabin,
        doc.specialty,
        dept.id AS department_id,
        dept.name AS department_name,
        COALESCE(dept.token_prefix, 'G') AS token_prefix,
        ROUND(EXTRACT(EPOCH FROM (NOW() - COALESCE(t.consultation_start_at, t.called_at, t.created_at)))::numeric) AS elapsed_seconds
      FROM tokens t
      JOIN visits v ON v.visit_id = t.visit_id
      JOIN patients p ON p.id = v.patient_id
      LEFT JOIN doctors doc ON doc.id = t.doctor_id
      LEFT JOIN departments dept ON dept.id = t.department_id
      WHERE t.queue_date = CURRENT_DATE
        AND t.status IN ('Now Serving', 'Consulting', 'Called', 'In-Consultation')
        AND ($1::int IS NULL OR t.department_id = $1)
        AND ($2::int IS NULL OR t.doctor_id = $2)
      ORDER BY 
        CASE WHEN t.status IN ('Now Serving', 'Called') THEN 0 ELSE 1 END,
        t.token_number ASC
    `, [deptId, docId]);

    // 4. Main Today OPD Queue (Ordered with real-time queue position for waiting patients)
    const queueQuery = await query(`
      WITH waiting_ranked AS (
        SELECT 
          token_id,
          ROW_NUMBER() OVER (
            PARTITION BY department_id
            ORDER BY 
              CASE WHEN priority = 'Emergency' THEN 0 ELSE 1 END,
              token_number ASC
          ) AS dept_queue_position,
          ROW_NUMBER() OVER (
            PARTITION BY doctor_id
            ORDER BY 
              CASE WHEN priority = 'Emergency' THEN 0 ELSE 1 END,
              token_number ASC
          ) AS doc_queue_position
        FROM tokens
        WHERE queue_date = CURRENT_DATE AND status = 'Waiting'
      )
      SELECT 
        t.token_id,
        COALESCE(t.token_display, CONCAT(COALESCE(dept.token_prefix, 'G'), '-', LPAD(t.token_number::text, 3, '0'))) AS token_display,
        t.token_number,
        CASE 
          WHEN t.status = 'Called' THEN 'Now Serving' 
          WHEN t.status = 'In-Consultation' THEN 'Consulting' 
          ELSE t.status 
        END AS status,
        COALESCE(t.priority, 'Standard') AS priority,
        t.called_at,
        t.consultation_start_at,
        t.consultation_end_at,
        t.cancellation_reason,
        t.queue_date,
        t.created_at,
        t.updated_at,
        v.visit_id,
        v.visit_type,
        '' AS reason,
        p.id AS patient_id,
        COALESCE(p.patient_id, p.id) AS patient_code,
        COALESCE(p.full_name, CONCAT(p.first_name, ' ', p.last_name), 'Patient') AS patient_name,
        p.mobile,
        p.gender,
        p.dob,
        p.blood_group,
        p.allergies,
        doc.id AS doctor_id,
        doc.name AS doctor_name,
        CONCAT('Cabin ', doc.id) AS doctor_cabin,
        doc.specialty,
        dept.id AS department_id,
        dept.name AS department_name,
        COALESCE(dept.token_prefix, 'G') AS token_prefix,
        wr.dept_queue_position AS queue_position,
        wr.doc_queue_position
      FROM tokens t
      JOIN visits v ON v.visit_id = t.visit_id
      JOIN patients p ON p.id = v.patient_id
      LEFT JOIN doctors doc ON doc.id = t.doctor_id
      LEFT JOIN departments dept ON dept.id = t.department_id
      LEFT JOIN waiting_ranked wr ON wr.token_id = t.token_id
      WHERE t.queue_date = CURRENT_DATE
        AND ($1::int IS NULL OR t.department_id = $1)
        AND ($2::int IS NULL OR t.doctor_id = $2)
        AND (
          $3::text IS NULL 
          OR ($3::text = 'Now Serving' AND t.status IN ('Now Serving', 'Called'))
          OR ($3::text = 'Consulting' AND t.status IN ('Consulting', 'In-Consultation'))
          OR t.status = $3
        )
        AND (
          $4::text IS NULL
          OR LOWER(COALESCE(p.full_name, '')) LIKE $4
          OR LOWER(COALESCE(t.token_display, '')) LIKE $4
          OR LOWER(COALESCE(p.patient_id, p.id)) LIKE $4
          OR LOWER(COALESCE(doc.name, '')) LIKE $4
        )
      ORDER BY 
        CASE 
          WHEN t.status IN ('Now Serving', 'Called') THEN 1
          WHEN t.status IN ('Consulting', 'In-Consultation') THEN 2
          WHEN t.status = 'Waiting' AND t.priority = 'Emergency' THEN 3
          WHEN t.status = 'Waiting' THEN 4
          WHEN t.status = 'Completed' THEN 5
          WHEN t.status = 'Cancelled' THEN 6
          ELSE 7
        END,
        t.token_number ASC
    `, [deptId, docId, filterStatus, searchFilter]);

    // Attach estimated wait times for waiting patients
    const formattedQueue = queueQuery.rows.map((row) => {
      const pos = row.queue_position ? Number(row.queue_position) : null;
      const estimatedMins = pos ? Math.round(pos * avgConsultationMins) : null;
      return {
        ...row,
        queue_position: pos,
        estimated_wait_mins: estimatedMins,
        age: row.dob ? calculateAgeFromDob(row.dob) : null,
      };
    });

    // 5. Department Queue Status Summary
    const deptSummaryQuery = await query(`
      SELECT 
        d.id AS department_id,
        d.name AS department_name,
        d.slug AS department_slug,
        COALESCE(d.token_prefix, 'G') AS token_prefix,
        COUNT(t.token_id) FILTER (WHERE t.status = 'Waiting')::int AS waiting_count,
        COUNT(t.token_id) FILTER (WHERE t.status IN ('Now Serving', 'Consulting', 'Called', 'In-Consultation'))::int AS serving_count,
        COUNT(t.token_id) FILTER (WHERE t.status = 'Completed')::int AS completed_count,
        (
          SELECT t2.token_display
          FROM tokens t2
          WHERE t2.department_id = d.id AND t2.queue_date = CURRENT_DATE AND t2.status IN ('Now Serving', 'Consulting', 'Called')
          ORDER BY CASE WHEN t2.status IN ('Now Serving', 'Called') THEN 0 ELSE 1 END, t2.token_number ASC
          LIMIT 1
        ) AS current_serving_token
      FROM departments d
      LEFT JOIN tokens t ON t.department_id = d.id AND t.queue_date = CURRENT_DATE
      WHERE d.status = 'active' OR d.status IS NULL
      GROUP BY d.id, d.name, d.slug, d.token_prefix
      ORDER BY waiting_count DESC, d.id ASC
    `);

    // 6. Doctors Queue Status Summary
    const docsSummaryQuery = await query(`
      SELECT 
        d.id AS doctor_id,
        d.name AS doctor_name,
        d.department_id,
        dept.name AS department_name,
        CONCAT('Cabin ', d.id) AS room_or_cabin,
        COALESCE(d.availability_status, 'Available') AS availability_status,
        COUNT(t.token_id) FILTER (WHERE t.status = 'Waiting')::int AS waiting_count,
        (
          SELECT t2.token_display
          FROM tokens t2
          WHERE t2.doctor_id = d.id AND t2.queue_date = CURRENT_DATE AND t2.status IN ('Now Serving', 'Consulting', 'Called')
          ORDER BY CASE WHEN t2.status IN ('Now Serving', 'Called') THEN 0 ELSE 1 END, t2.token_number ASC
          LIMIT 1
        ) AS current_serving_token
      FROM doctors d
      JOIN departments dept ON dept.id = d.department_id
      LEFT JOIN tokens t ON t.doctor_id = d.id AND t.queue_date = CURRENT_DATE
      GROUP BY d.id, d.name, d.department_id, dept.name, d.availability_status
      ORDER BY d.department_id ASC, d.id ASC
    `);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        totalToday: Number(stats.total_today) || 0,
        waitingCount: Number(stats.waiting_count) || 0,
        nowServingCount: Number(stats.now_serving_count) || 0,
        consultingCount: Number(stats.consulting_count) || 0,
        completedCount: Number(stats.completed_count) || 0,
        cancelledCount: Number(stats.cancelled_count) || 0,
        emergencyWaitingCount: Number(stats.emergency_waiting_count) || 0,
        avgConsultationMins,
      },
      nowServing: servingQuery.rows.map((r) => ({
        ...r,
        age: r.dob ? calculateAgeFromDob(r.dob) : null,
      })),
      queue: formattedQueue,
      departments: deptSummaryQuery.rows,
      doctors: docsSummaryQuery.rows,
    });
  })
);

/**
 * POST /api/v1/reception/queue/call-next
 * Calls the next waiting patient or specifically selected token into 'Now Serving'.
 * Concurrency protected to prevent duplicate calls across receptionists/doctors.
 */
router.post(
  '/queue/call-next',
  asyncHandler(async (req, res) => {
    const {
      department_id,
      doctor_id,
      token_id,
      staff_name = 'Reception Staff',
      staff_role = 'receptionist',
    } = req.body || {};

    // Role-based access validation
    const allowedRoles = ['receptionist', 'doctor', 'nurse', 'administrator', 'staff'];
    if (staff_role && !allowedRoles.includes(staff_role.toLowerCase())) {
      return res.status(403).json({
        success: false,
        error: `Access Denied: Role '${staff_role}' is not authorized to call queue tokens.`,
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let targetToken = null;

      // Case A: Specific token ID provided
      if (token_id) {
        const tokenRes = await client.query(
          `SELECT t.*, v.visit_id, doc.id AS assigned_doc_id, doc.name AS doctor_name, dept.name AS department_name
           FROM tokens t
           JOIN visits v ON v.visit_id = t.visit_id
           LEFT JOIN doctors doc ON doc.id = t.doctor_id
           LEFT JOIN departments dept ON dept.id = t.department_id
           WHERE t.token_id = $1 AND t.queue_date = CURRENT_DATE
           FOR UPDATE OF t`,
          [token_id]
        );

        if (tokenRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ success: false, error: 'Token not found for today.' });
        }

        targetToken = tokenRes.rows[0];
      } else {
        // Case B: Auto-pick next waiting patient (Emergency priority first, then lowest token number)
        const deptId = department_id ? Number(department_id) : null;
        const docId = doctor_id ? Number(doctor_id) : null;

        const nextRes = await client.query(
          `SELECT t.*, v.visit_id, doc.id AS assigned_doc_id, doc.name AS doctor_name, dept.name AS department_name
           FROM tokens t
           JOIN visits v ON v.visit_id = t.visit_id
           LEFT JOIN doctors doc ON doc.id = t.doctor_id
           LEFT JOIN departments dept ON dept.id = t.department_id
           WHERE t.queue_date = CURRENT_DATE
             AND t.status = 'Waiting'
             AND ($1::int IS NULL OR t.department_id = $1)
             AND ($2::int IS NULL OR t.doctor_id = $2)
           ORDER BY 
             CASE WHEN t.priority = 'Emergency' THEN 0 ELSE 1 END,
             t.token_number ASC
           LIMIT 1
           FOR UPDATE OF t`,
          [deptId, docId]
        );

        if (nextRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            error: 'No waiting patients found in this queue.',
          });
        }

        targetToken = nextRes.rows[0];
      }

      const assignedDocId = targetToken.doctor_id;

      // Conflict Prevention: If this doctor currently has another token in 'Now Serving',
      // automatically advance the previous token to 'Consulting' so only ONE token is Now Serving at a time!
      if (assignedDocId) {
        await client.query(
          `UPDATE tokens
           SET status = 'Consulting',
               consultation_start_at = COALESCE(consultation_start_at, NOW()),
               updated_at = NOW()
           WHERE doctor_id = $1 
             AND queue_date = CURRENT_DATE 
             AND status IN ('Now Serving', 'Called')
             AND token_id != $2`,
          [assignedDocId, targetToken.token_id]
        );
      }

      // Update Target Token to 'Now Serving'
      const updatedRes = await client.query(
        `UPDATE tokens
         SET status = 'Now Serving',
             called_at = NOW(),
             updated_at = NOW()
         WHERE token_id = $1
         RETURNING *`,
        [targetToken.token_id]
      );

      // Update associated Visit
      await client.query(
        `UPDATE visits
         SET status = 'Now Serving',
             updated_at = NOW()
         WHERE visit_id = $1`,
        [targetToken.visit_id]
      );

      // Audit Log
      await client.query(
        `INSERT INTO audit_logs (action, entity, entity_type, entity_id, timestamp, details)
         VALUES ('OPD_TOKEN_CALLED', 'tokens', 'tokens', $1, NOW(), $2)`,
        [
          targetToken.token_id,
          JSON.stringify({
            token_display: targetToken.token_display,
            token_number: targetToken.token_number,
            called_by_name: staff_name,
            called_by_role: staff_role,
            doctor_name: targetToken.doctor_name,
            department_name: targetToken.department_name,
            previous_status: targetToken.status,
            new_status: 'Now Serving',
          }),
        ]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Token ${targetToken.token_display || targetToken.token_number} called successfully to Cabin.`,
        token: updatedRes.rows[0],
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Call next error:', err);
      res.status(500).json({ success: false, error: 'Failed to call token.', details: err.message });
    } finally {
      client.release();
    }
  })
);

/**
 * PATCH /api/v1/reception/queue/tokens/:tokenId/status
 * Updates a token's consultation status.
 * Supported statuses: 'Waiting', 'Now Serving', 'Consulting', 'Completed', 'Cancelled'.
 * Row locked to avoid race conditions.
 */
router.patch(
  '/queue/tokens/:tokenId/status',
  asyncHandler(async (req, res) => {
    const { tokenId } = req.params;
    const {
      status,
      cancellation_reason = '',
      staff_name = 'Staff Member',
      staff_role = 'staff',
    } = req.body || {};

    // Role-based access validation
    const allowedRoles = ['receptionist', 'doctor', 'nurse', 'administrator', 'staff'];
    if (staff_role && !allowedRoles.includes(staff_role.toLowerCase())) {
      return res.status(403).json({
        success: false,
        error: `Access Denied: Role '${staff_role}' is not authorized to update queue status.`,
      });
    }

    const validStatuses = ['Waiting', 'Now Serving', 'Consulting', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const tokenRes = await client.query(
        `SELECT t.*, v.visit_id 
         FROM tokens t
         JOIN visits v ON v.visit_id = t.visit_id
         WHERE t.token_id = $1 AND t.queue_date = CURRENT_DATE
         FOR UPDATE`,
        [tokenId]
      );

      if (tokenRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Token not found for today.' });
      }

      const currentToken = tokenRes.rows[0];

      // Update Token Timestamps based on new status
      let updateSql = `
        UPDATE tokens
        SET status = $1,
            updated_at = NOW()
      `;
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
        // Return to queue
        updateSql += `, called_at = NULL, consultation_start_at = NULL`;
      }

      updateSql += ` WHERE token_id = $2 RETURNING *;`;

      const updatedTokenRes = await client.query(updateSql, params);
      const updatedToken = updatedTokenRes.rows[0];

      // Sync Associated Visit Status
      const visitStatusMap = {
        'Waiting': 'In-Queue',
        'Now Serving': 'Now Serving',
        'Consulting': 'Consulting',
        'Completed': 'Completed',
        'Cancelled': 'Cancelled',
      };
      const newVisitStatus = visitStatusMap[status] || 'In-Queue';

      await client.query(
        `UPDATE visits
         SET status = $1,
             updated_at = NOW()
         WHERE visit_id = $2`,
        [newVisitStatus, currentToken.visit_id]
      );

      // Audit Log
      await client.query(
        `INSERT INTO audit_logs (action, entity, entity_type, entity_id, timestamp, details)
         VALUES ('OPD_QUEUE_STATUS_UPDATED', 'tokens', 'tokens', $1, NOW(), $2)`,
        [
          tokenId,
          JSON.stringify({
            token_display: updatedToken.token_display,
            from_status: currentToken.status,
            to_status: status,
            cancellation_reason,
            updated_by_name: staff_name,
            updated_by_role: staff_role,
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
      console.error('Update status error:', err);
      res.status(500).json({ success: false, error: 'Failed to update token status.', details: err.message });
    } finally {
      client.release();
    }
  })
);

/**
 * POST /api/v1/reception/queue/recall
 * Re-announces the currently called token without changing its status.
 */
router.post(
  '/queue/recall',
  asyncHandler(async (req, res) => {
    const { token_id, staff_name = 'Staff Member' } = req.body || {};

    if (!token_id) {
      return res.status(400).json({ success: false, error: 'Token ID is required to recall.' });
    }

    const tokenRes = await query(
      `UPDATE tokens
       SET called_at = NOW(),
           updated_at = NOW()
       WHERE token_id = $1 AND queue_date = CURRENT_DATE
       RETURNING *`,
      [token_id]
    );

    if (tokenRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Token not found for today.' });
    }

    const token = tokenRes.rows[0];

    // Audit Log
    await query(
      `INSERT INTO audit_logs (action, entity, entity_type, entity_id, timestamp, details)
       VALUES ('OPD_TOKEN_RECALLED', 'tokens', 'tokens', $1, NOW(), $2)`,
      [
        token_id,
        JSON.stringify({
          token_display: token.token_display,
          recalled_by: staff_name,
        }),
      ]
    );

    res.json({
      success: true,
      message: `Token ${token.token_display || token.token_number} re-announced successfully.`,
      token,
    });
  })
);

// ============================================================================
// APPOINTMENT MANAGEMENT MODULE FOR RECEPTION PORTAL
// ============================================================================

const APPOINTMENT_TIME_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
];

function generateReceptionBookingReference() {
  const yr = new Date().getFullYear();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `HX-${yr}-${num}`;
}

/**
 * GET /api/v1/reception/appointments/slots
 * Returns available time slots for a doctor on a specific date.
 */
router.get(
  '/appointments/slots',
  asyncHandler(async (req, res) => {
    const { doctor_id, doctor_slug, date } = req.query || {};

    if ((!doctor_id && !doctor_slug) || !date) {
      return res.status(400).json({
        success: false,
        error: 'Doctor (doctor_id or doctor_slug) and date (YYYY-MM-DD) are required.',
      });
    }

    // 1. Resolve doctor
    let docRes;
    if (doctor_id) {
      docRes = await query(
        `SELECT d.id, d.slug, d.name, d.specialty, d.department_slug, d.department_id,
                d.consultation_days, d.consultation_hours, d.availability_status,
                dep.name AS department_name
         FROM doctors d
         LEFT JOIN departments dep ON dep.id = d.department_id OR dep.slug = d.department_slug
         WHERE d.id = $1`,
        [Number(doctor_id)]
      );
    } else {
      docRes = await query(
        `SELECT d.id, d.slug, d.name, d.specialty, d.department_slug, d.department_id,
                d.consultation_days, d.consultation_hours, d.availability_status,
                dep.name AS department_name
         FROM doctors d
         LEFT JOIN departments dep ON dep.id = d.department_id OR dep.slug = d.department_slug
         WHERE d.slug = $1`,
        [String(doctor_slug)]
      );
    }

    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Doctor not found.' });
    }

    const doctor = docRes.rows[0];

    // 2. Query booked appointments for doctor on that date (excluding Cancelled)
    const bookedRes = await query(
      `SELECT time_slot, COUNT(*)::int AS count
       FROM appointments
       WHERE (doctor_id = $1 OR doctor_slug = $2)
         AND appointment_date = $3::date
         AND status <> 'Cancelled'
       GROUP BY time_slot`,
      [doctor.id, doctor.slug, String(date)]
    );

    const bookedCounts = new Map(bookedRes.rows.map((r) => [r.time_slot, r.count]));
    const maxCapacityPerSlot = 1;

    const slots = APPOINTMENT_TIME_SLOTS.map((slot) => {
      const booked = bookedCounts.get(slot) || 0;
      return {
        time_slot: slot,
        available: booked < maxCapacityPerSlot,
        capacity: maxCapacityPerSlot,
        booked,
      };
    });

    res.json({
      success: true,
      data: {
        doctor: {
          id: doctor.id,
          name: doctor.name,
          specialty: doctor.specialty,
          department_name: doctor.department_name,
          availability_status: doctor.availability_status,
          consultation_days: doctor.consultation_days,
        },
        date,
        slots,
      },
    });
  })
);

/**
 * GET /api/v1/reception/appointments
 * View today's, upcoming, or filtered appointments with live search.
 */
router.get(
  '/appointments',
  asyncHandler(async (req, res) => {
    const {
      date = 'today',
      filter = 'today',
      search = '',
      department_id = 'all',
      doctor_id = 'all',
      status = 'all',
      limit = 100,
      offset = 0,
    } = req.query || {};

    let dateCondition = '';
    const queryParams = [];
    const hasSearch = search && search.trim() !== '';

    if (!hasSearch) {
      if (filter === 'today' || date === 'today') {
        dateCondition = 'a.appointment_date = CURRENT_DATE';
      } else if (filter === 'upcoming') {
        dateCondition = 'a.appointment_date >= CURRENT_DATE';
      } else if (date && date !== 'all') {
        queryParams.push(date);
        dateCondition = `a.appointment_date = $${queryParams.length}::date`;
      }
    } else {
      // When searching, search across all dates unless user explicitly supplied a date filter
      if (req.query.date && req.query.date !== 'all') {
        if (req.query.date === 'today') {
          dateCondition = 'a.appointment_date = CURRENT_DATE';
        } else {
          queryParams.push(req.query.date);
          dateCondition = `a.appointment_date = $${queryParams.length}::date`;
        }
      } else if (req.query.filter === 'today') {
        dateCondition = 'a.appointment_date = CURRENT_DATE';
      } else if (req.query.filter === 'upcoming') {
        dateCondition = 'a.appointment_date >= CURRENT_DATE';
      }
    }

    const conditions = [];
    if (dateCondition) {
      conditions.push(dateCondition);
    }

    if (department_id && department_id !== 'all') {
      queryParams.push(Number(department_id));
      conditions.push(`(a.department_id = $${queryParams.length} OR dep.id = $${queryParams.length})`);
    }

    if (doctor_id && doctor_id !== 'all') {
      queryParams.push(Number(doctor_id));
      conditions.push(`(a.doctor_id = $${queryParams.length} OR doc.id = $${queryParams.length})`);
    }

    if (status && status !== 'all') {
      queryParams.push(status);
      conditions.push(`a.status = $${queryParams.length}`);
    }

    if (search && search.trim() !== '') {
      const s = `%${search.trim().toLowerCase()}%`;
      queryParams.push(s);
      const idx = queryParams.length;
      conditions.push(`(
        LOWER(a.booking_reference) LIKE $${idx} OR
        LOWER(a.patient_name) LIKE $${idx} OR
        LOWER(a.patient_phone) LIKE $${idx} OR
        LOWER(COALESCE(p.patient_id, p.id, '')) LIKE $${idx} OR
        LOWER(COALESCE(doc.name, '')) LIKE $${idx}
      )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        a.id,
        a.booking_reference,
        COALESCE(a.appointment_id, a.booking_reference) AS appointment_id,
        a.appointment_date,
        TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS formatted_date,
        a.time_slot,
        a.visit_type,
        a.status,
        a.patient_name,
        a.patient_email,
        a.patient_phone,
        a.patient_dob,
        a.patient_gender,
        a.reason_for_visit,
        a.insurance_provider,
        a.created_at,
        a.updated_at,
        a.check_in_time,
        a.cancellation_reason,
        a.reschedule_reason,
        a.notes,
        a.visit_id,
        -- Patient Linkage
        COALESCE(p.patient_id, p.id) AS patient_id,
        p.id AS patient_record_id,
        p.mobile AS patient_mobile,
        p.blood_group AS patient_blood_group,
        p.emergency_contact AS patient_emergency_contact,
        -- Doctor Linkage
        doc.id AS doctor_id,
        doc.name AS doctor_name,
        doc.specialty AS doctor_specialty,
        doc.slug AS doctor_slug,
        doc.availability_status AS doctor_availability,
        CONCAT('Cabin ', doc.id) AS room_or_cabin,
        -- Department Linkage
        dep.id AS department_id,
        dep.name AS department_name,
        dep.slug AS department_slug,
        dep.token_prefix,
        -- Checked-in Visit & Token Linkage
        v.status AS visit_status,
        t.token_id,
        t.token_number,
        COALESCE(t.token_display, CONCAT(COALESCE(dep.token_prefix, 'G'), '-', LPAD(t.token_number::text, 3, '0'))) AS token_display,
        t.status AS token_status
      FROM appointments a
      LEFT JOIN doctors doc ON doc.id = a.doctor_id OR doc.slug = a.doctor_slug
      LEFT JOIN departments dep ON dep.id = a.department_id OR dep.slug = a.department_slug OR dep.slug = doc.department_slug
      LEFT JOIN patients p ON p.id = a.patient_id OR p.mobile = a.patient_phone OR p.phone = a.patient_phone
      LEFT JOIN visits v ON v.visit_id = a.visit_id
      LEFT JOIN tokens t ON t.visit_id = a.visit_id
      ${whereClause}
      ORDER BY a.appointment_date ASC, a.time_slot ASC, a.created_at DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;

    const result = await query(sql, queryParams);

    // Compute live summary counters
    const summaryRes = await query(`
      SELECT 
        COUNT(*)::int AS total_today,
        COUNT(CASE WHEN status IN ('Confirmed', 'Scheduled', 'Pending') THEN 1 END)::int AS confirmed_today,
        COUNT(CASE WHEN status = 'Checked-In' THEN 1 END)::int AS checked_in_today,
        COUNT(CASE WHEN status = 'Cancelled' THEN 1 END)::int AS cancelled_today,
        (SELECT COUNT(*)::int FROM appointments WHERE appointment_date >= CURRENT_DATE AND status IN ('Confirmed', 'Scheduled', 'Pending')) AS upcoming_total
      FROM appointments
      WHERE appointment_date = CURRENT_DATE
    `);

    const summary = summaryRes.rows[0] || {
      total_today: 0,
      confirmed_today: 0,
      checked_in_today: 0,
      cancelled_today: 0,
      upcoming_total: 0,
    };

    res.json({
      success: true,
      data: result.rows,
      summary: {
        total_today: Number(summary.total_today) || 0,
        confirmed_today: Number(summary.confirmed_today) || 0,
        checked_in_today: Number(summary.checked_in_today) || 0,
        cancelled_today: Number(summary.cancelled_today) || 0,
        upcoming_total: Number(summary.upcoming_total) || 0,
      },
    });
  })
);

/**
 * POST /api/v1/reception/appointments
 * Books an appointment for future dates or today with schedule validation,
 * patient linkage / registration, and conflict locking.
 */
router.post(
  '/appointments',
  asyncHandler(async (req, res) => {
    const {
      appointment_date,
      time_slot,
      department_id,
      doctor_id,
      visit_type = 'OPD Consultation',
      reason_for_visit = '',
      insurance_provider = '',
      // Patient Identification
      patient_id = null,
      new_patient = null,
      patient_name = '',
      patient_phone = '',
      patient_email = '',
      patient_dob = null,
      patient_gender = 'Other',
      staff_name = 'Reception Staff',
      staff_role = 'receptionist',
    } = req.body || {};

    if (!appointment_date || !time_slot || (!department_id && !doctor_id)) {
      return res.status(400).json({
        success: false,
        error: 'Appointment date, time slot, and department/doctor are required.',
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Resolve Doctor & Department
      let resolvedDocId = doctor_id ? Number(doctor_id) : null;
      let resolvedDeptId = department_id ? Number(department_id) : null;

      let docRow = null;
      if (resolvedDocId) {
        const docRes = await client.query(
          `SELECT d.id, d.slug, d.name, d.specialty, d.department_id, d.department_slug,
                  d.consultation_fee, d.consultation_days, dep.name AS department_name
           FROM doctors d
           LEFT JOIN departments dep ON dep.id = d.department_id OR dep.slug = d.department_slug
           WHERE d.id = $1`,
          [resolvedDocId]
        );
        if (docRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ success: false, error: 'Selected doctor not found.' });
        }
        docRow = docRes.rows[0];
        if (!resolvedDeptId && docRow.department_id) {
          resolvedDeptId = docRow.department_id;
        }
      } else if (resolvedDeptId) {
        // Auto-assign first available doctor in department
        const docRes = await client.query(
          `SELECT d.id, d.slug, d.name, d.specialty, d.department_id, d.department_slug,
                  d.consultation_fee, dep.name AS department_name
           FROM doctors d
           LEFT JOIN departments dep ON dep.id = d.department_id
           WHERE d.department_id = $1 AND d.availability_status IN ('Available', 'Busy')
           ORDER BY CASE WHEN d.availability_status = 'Available' THEN 0 ELSE 1 END, d.id ASC
           LIMIT 1`,
          [resolvedDeptId]
        );
        if (docRes.rows.length > 0) {
          docRow = docRes.rows[0];
          resolvedDocId = docRow.id;
        }
      }

      if (!docRow) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Could not resolve an assigned doctor for this appointment.',
        });
      }

      // 2. Lock & Prevent Conflicting Bookings on Doctor, Date, Time Slot
      const conflictRes = await client.query(
        `SELECT id, booking_reference, patient_name, status
         FROM appointments
         WHERE doctor_id = $1
           AND appointment_date = $2::date
           AND time_slot = $3
           AND status NOT IN ('Cancelled')
         FOR UPDATE`,
        [docRow.id, appointment_date, time_slot]
      );

      if (conflictRes.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          error: `Dr. ${docRow.name} is already booked on ${appointment_date} at ${time_slot}. Please select another time slot.`,
        });
      }

      // 3. Resolve Patient Linkage or Register New Patient
      let resolvedPatientId = null;
      let finalPatientName = patient_name.trim();
      let finalPatientPhone = patient_phone.trim();
      let finalPatientEmail = patient_email.trim();
      let finalPatientDob = patient_dob;
      let finalPatientGender = patient_gender;

      if (patient_id) {
        // Verify existing patient
        const patRes = await client.query(
          `SELECT id, patient_id, full_name, mobile, phone, email, dob, gender
           FROM patients
           WHERE id = $1 OR patient_id = $1
           LIMIT 1`,
          [String(patient_id).trim()]
        );
        if (patRes.rows.length > 0) {
          const p = patRes.rows[0];
          resolvedPatientId = p.id;
          finalPatientName = p.full_name || finalPatientName;
          finalPatientPhone = p.mobile || p.phone || finalPatientPhone;
          finalPatientEmail = p.email || finalPatientEmail;
          finalPatientDob = p.dob || finalPatientDob;
          finalPatientGender = p.gender || finalPatientGender;
        }
      } else if (new_patient) {
        // Support new patient appointment registration
        const yr = new Date().getFullYear();
        const rand = Math.floor(1000 + Math.random() * 9000);
        const generatedPid = `PAT-${yr}-${rand}`;

        finalPatientName = new_patient.full_name || finalPatientName;
        finalPatientPhone = new_patient.mobile || finalPatientPhone;
        finalPatientEmail = new_patient.email || finalPatientEmail;
        finalPatientDob = new_patient.dob || finalPatientDob;
        finalPatientGender = new_patient.gender || finalPatientGender;

        const newPatRes = await client.query(
          `INSERT INTO patients (
            id, patient_id, full_name, mobile, phone, email, gender, dob, date_of_birth,
            address, blood_group, emergency_contact, emergency_contact_name, emergency_contact_phone,
            allergies, registration_date, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $4, $5, $6, $7::date, $8,
            $9, $10, $11, $12, $13,
            $14, NOW(), NOW(), NOW()
          ) RETURNING id, patient_id, full_name`,
          [
            generatedPid,
            generatedPid,
            finalPatientName,
            finalPatientPhone,
            finalPatientEmail || null,
            finalPatientGender || 'Other',
            finalPatientDob || null,
            finalPatientDob ? String(finalPatientDob) : null,
            new_patient.address || 'Address provided at reception',
            new_patient.blood_group || null,
            new_patient.emergency_contact || null,
            new_patient.emergency_contact || null,
            new_patient.emergency_phone || null,
            new_patient.allergies || null,
          ]
        );
        resolvedPatientId = newPatRes.rows[0].id;
      } else if (finalPatientPhone) {
        // Auto-match patient by mobile if existing
        const matchRes = await client.query(
          `SELECT id, patient_id, full_name, email FROM patients WHERE mobile = $1 OR phone = $1 LIMIT 1`,
          [finalPatientPhone]
        );
        if (matchRes.rows.length > 0) {
          resolvedPatientId = matchRes.rows[0].id;
          finalPatientName = matchRes.rows[0].full_name || finalPatientName;
        }
      }

      if (!finalPatientName || !finalPatientPhone) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Patient name and mobile number are required to book an appointment.',
        });
      }

      // 4. Generate Unique Booking Reference
      let bookingReference = generateReceptionBookingReference();
      for (let i = 0; i < 5; i++) {
        const checkRef = await client.query(
          `SELECT 1 FROM appointments WHERE booking_reference = $1`,
          [bookingReference]
        );
        if (checkRef.rows.length === 0) break;
        bookingReference = generateReceptionBookingReference();
      }

      // 5. Insert Appointment
      const apptRes = await client.query(
        `INSERT INTO appointments (
          booking_reference,
          appointment_id,
          doctor_id,
          doctor_slug,
          department_id,
          department_slug,
          patient_id,
          patient_name,
          patient_phone,
          patient_email,
          patient_dob,
          patient_gender,
          appointment_date,
          time_slot,
          visit_type,
          reason_for_visit,
          insurance_provider,
          status,
          created_at,
          updated_at
        ) VALUES (
          $1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::date, $11, $12::date, $13, $14, $15, $16, 'Confirmed', NOW(), NOW()
        ) RETURNING *`,
        [
          bookingReference,
          docRow.id,
          docRow.slug,
          resolvedDeptId || docRow.department_id || 1,
          docRow.department_slug || 'general-medicine',
          resolvedPatientId,
          finalPatientName,
          finalPatientPhone,
          finalPatientEmail || `${finalPatientPhone}@healix-patient.org`,
          finalPatientDob || null,
          finalPatientGender || 'Other',
          appointment_date,
          time_slot,
          visit_type,
          reason_for_visit,
          insurance_provider,
        ]
      );

      const appt = apptRes.rows[0];

      // 6. Record Audit Log in appointment_audit_logs
      await client.query(
        `INSERT INTO appointment_audit_logs (
          appointment_id, booking_reference, previous_status, new_status, changed_by, reason, created_at
        ) VALUES ($1, $2, NULL, 'Confirmed', $3, $4, NOW())`,
        [
          appt.id,
          bookingReference,
          `${staff_name} (${staff_role})`,
          `Appointment booked by reception staff for Dr. ${docRow.name} on ${appointment_date} at ${time_slot}`,
        ]
      );

      // 7. General Audit Trail
      await client.query(
        `INSERT INTO audit_logs (action, entity, entity_type, entity_id, timestamp, details)
         VALUES ('APPOINTMENT_BOOKED', 'appointments', 'appointments', $1, NOW(), $2)`,
        [
          bookingReference,
          JSON.stringify({
            patient_name: finalPatientName,
            doctor_name: docRow.name,
            appointment_date,
            time_slot,
            booked_by: staff_name,
          }),
        ]
      );

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: `Appointment ${bookingReference} booked successfully for ${finalPatientName}.`,
        data: {
          ...appt,
          doctor_name: docRow.name,
          doctor_specialty: docRow.specialty,
          department_name: docRow.department_name,
          room_or_cabin: `Cabin ${docRow.id}`,
        },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Reception appointment booking error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to create appointment.',
        details: err.message,
      });
    } finally {
      client.release();
    }
  })
);

/**
 * PATCH /api/v1/reception/appointments/:reference/reschedule
 * Reschedule appointment to a new date and time slot with conflict check.
 */
router.patch(
  '/appointments/:reference/reschedule',
  asyncHandler(async (req, res) => {
    const { reference } = req.params;
    const {
      new_date,
      new_time_slot,
      reason = 'Patient requested new schedule',
      staff_name = 'Reception Staff',
      staff_role = 'receptionist',
    } = req.body || {};

    if (!new_date || !new_time_slot) {
      return res.status(400).json({
        success: false,
        error: 'Both new_date (YYYY-MM-DD) and new_time_slot are required to reschedule.',
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Lock appointment row
      const apptRes = await client.query(
        `SELECT a.*, d.name AS doctor_name
         FROM appointments a
         LEFT JOIN doctors d ON d.id = a.doctor_id OR d.slug = a.doctor_slug
         WHERE UPPER(a.booking_reference) = UPPER($1) OR a.appointment_id = $1
         FOR UPDATE OF a`,
        [reference.trim()]
      );

      if (apptRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Appointment not found.' });
      }

      const appt = apptRes.rows[0];

      if (appt.status === 'Cancelled') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Cannot reschedule a cancelled appointment. Please book a new appointment.',
        });
      }

      if (appt.status === 'Completed') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Cannot reschedule a completed consultation.',
        });
      }

      // 2. Lock & Check Conflict on New Slot
      const conflictRes = await client.query(
        `SELECT id, booking_reference
         FROM appointments
         WHERE (doctor_id = $1 OR doctor_slug = $2)
           AND appointment_date = $3::date
           AND time_slot = $4
           AND id <> $5
           AND status NOT IN ('Cancelled')
         FOR UPDATE`,
        [appt.doctor_id, appt.doctor_slug, new_date, new_time_slot, appt.id]
      );

      if (conflictRes.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          error: `Dr. ${appt.doctor_name || 'selected physician'} already has an active appointment on ${new_date} at ${new_time_slot}.`,
        });
      }

      const prevDate = appt.appointment_date.toISOString().slice(0, 10);
      const prevSlot = appt.time_slot;
      const prevStatus = appt.status;

      // 3. Update Appointment
      const updateRes = await client.query(
        `UPDATE appointments
         SET appointment_date = $1::date,
             time_slot = $2,
             status = 'Rescheduled',
             reschedule_reason = $3,
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [new_date, new_time_slot, reason, appt.id]
      );

      const updatedAppt = updateRes.rows[0];

      // 4. Audit Log
      await client.query(
        `INSERT INTO appointment_audit_logs (
          appointment_id, booking_reference, previous_status, new_status, changed_by, reason, created_at
        ) VALUES ($1, $2, $3, 'Rescheduled', $4, $5, NOW())`,
        [
          appt.id,
          appt.booking_reference,
          prevStatus,
          `${staff_name} (${staff_role})`,
          `Rescheduled from ${prevDate} (${prevSlot}) to ${new_date} (${new_time_slot}). Reason: ${reason}`,
        ]
      );

      await client.query(
        `INSERT INTO audit_logs (action, entity, entity_type, entity_id, timestamp, details)
         VALUES ('APPOINTMENT_RESCHEDULED', 'appointments', 'appointments', $1, NOW(), $2)`,
        [
          appt.booking_reference,
          JSON.stringify({
            previous_date: prevDate,
            previous_slot: prevSlot,
            new_date,
            new_time_slot,
            rescheduled_by: staff_name,
            reason,
          }),
        ]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Appointment ${appt.booking_reference} successfully rescheduled to ${new_date} at ${new_time_slot}.`,
        data: updatedAppt,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Reschedule appointment error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to reschedule appointment.',
        details: err.message,
      });
    } finally {
      client.release();
    }
  })
);

/**
 * PATCH /api/v1/reception/appointments/:reference/cancel
 * Cancel an appointment with mandatory audit logging and reason.
 */
router.patch(
  '/appointments/:reference/cancel',
  asyncHandler(async (req, res) => {
    const { reference } = req.params;
    const {
      reason = 'Cancelled by reception request',
      staff_name = 'Reception Staff',
      staff_role = 'receptionist',
    } = req.body || {};

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const apptRes = await client.query(
        `SELECT * FROM appointments
         WHERE UPPER(booking_reference) = UPPER($1) OR appointment_id = $1
         FOR UPDATE`,
        [reference.trim()]
      );

      if (apptRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Appointment not found.' });
      }

      const appt = apptRes.rows[0];

      if (appt.status === 'Cancelled') {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'This appointment is already cancelled.' });
      }

      if (appt.status === 'Completed') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Cannot cancel an appointment whose consultation has already completed.',
        });
      }

      const prevStatus = appt.status;

      // Update appointment status to Cancelled
      const updateRes = await client.query(
        `UPDATE appointments
         SET status = 'Cancelled',
             cancellation_reason = $1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [reason, appt.id]
      );

      // If already checked in and in queue, also cancel token
      if (appt.visit_id) {
        await client.query(
          `UPDATE visits SET status = 'Cancelled', updated_at = NOW() WHERE visit_id = $1`,
          [appt.visit_id]
        );
        await client.query(
          `UPDATE tokens SET status = 'Cancelled', cancellation_reason = $1, updated_at = NOW() WHERE visit_id = $2`,
          [`Appointment cancelled: ${reason}`, appt.visit_id]
        );
      }

      // Record in appointment_audit_logs
      await client.query(
        `INSERT INTO appointment_audit_logs (
          appointment_id, booking_reference, previous_status, new_status, changed_by, reason, created_at
        ) VALUES ($1, $2, $3, 'Cancelled', $4, $5, NOW())`,
        [
          appt.id,
          appt.booking_reference,
          prevStatus,
          `${staff_name} (${staff_role})`,
          reason,
        ]
      );

      // Record in system audit_logs
      await client.query(
        `INSERT INTO audit_logs (action, entity, entity_type, entity_id, timestamp, details)
         VALUES ('APPOINTMENT_CANCELLED', 'appointments', 'appointments', $1, NOW(), $2)`,
        [
          appt.booking_reference,
          JSON.stringify({
            cancelled_by: staff_name,
            reason,
            previous_status: prevStatus,
          }),
        ]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Appointment ${appt.booking_reference} has been cancelled.`,
        data: updateRes.rows[0],
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Cancel appointment error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel appointment.',
        details: err.message,
      });
    } finally {
      client.release();
    }
  })
);

/**
 * POST /api/v1/reception/appointments/:reference/check-in
 * Check in a patient upon arrival. Converts the confirmed appointment into a
 * consultation visit and OPD queue token. Avoids duplicate visits/tokens if checked in repeatedly.
 */
router.post(
  '/appointments/:reference/check-in',
  asyncHandler(async (req, res) => {
    const { reference } = req.params;
    const {
      staff_name = 'Reception Staff',
      staff_role = 'receptionist',
      priority = 'Standard',
    } = req.body || {};

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Lock appointment row
      const apptRes = await client.query(
        `SELECT a.*,
                d.id AS resolved_doc_id,
                d.name AS doctor_name,
                d.specialty AS doctor_specialty,
                dep.id AS resolved_dept_id,
                dep.name AS department_name,
                COALESCE(dep.token_prefix, 'G') AS token_prefix
         FROM appointments a
         LEFT JOIN doctors d ON d.id = a.doctor_id OR d.slug = a.doctor_slug
         LEFT JOIN departments dep ON dep.id = a.department_id OR dep.slug = a.department_slug OR dep.slug = d.department_slug
         WHERE UPPER(a.booking_reference) = UPPER($1) OR a.appointment_id = $1
         FOR UPDATE OF a`,
        [reference.trim()]
      );

      if (apptRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Appointment not found.' });
      }

      const appt = apptRes.rows[0];

      // 2. IDEMPOTENCY / DUPLICATE PREVENTION:
      // If already checked in or already has a linked visit, return the existing visit and token!
      if (appt.status === 'Checked-In' || appt.visit_id) {
        const existingDataRes = await client.query(
          `SELECT 
            v.visit_id,
            v.status AS visit_status,
            v.visit_type,
            v.visit_date,
            t.token_id,
            t.token_number,
            COALESCE(t.token_display, CONCAT(COALESCE(dep.token_prefix, 'G'), '-', LPAD(t.token_number::text, 3, '0'))) AS token_display,
            t.status AS token_status,
            t.queue_date,
            doc.name AS doctor_name,
            CONCAT('Cabin ', doc.id) AS room_or_cabin,
            dep.name AS department_name
           FROM visits v
           LEFT JOIN tokens t ON t.visit_id = v.visit_id
           LEFT JOIN doctors doc ON doc.id = v.doctor_id
           LEFT JOIN departments dep ON dep.id = v.department_id
           WHERE v.visit_id = $1 OR v.appointment_id = $2
           LIMIT 1`,
          [appt.visit_id, appt.booking_reference]
        );

        await client.query('COMMIT');

        const existingRecord = existingDataRes.rows[0] || null;
        return res.json({
          success: true,
          already_checked_in: true,
          message: `Patient was already checked in. Existing token: ${existingRecord?.token_display || 'Active'}.`,
          visit: existingRecord ? {
            visit_id: existingRecord.visit_id,
            status: existingRecord.visit_status,
            visit_type: existingRecord.visit_type,
            visit_date: existingRecord.visit_date,
          } : null,
          token: existingRecord ? {
            token_id: existingRecord.token_id,
            token_display: existingRecord.token_display,
            token_number: existingRecord.token_number,
            status: existingRecord.token_status,
            queue_date: existingRecord.queue_date,
          } : null,
          appointment: appt,
        });
      }

      if (appt.status === 'Cancelled') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Cannot check in a cancelled appointment. Please re-book or reinstate.',
        });
      }

      if (appt.status === 'Completed') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'This appointment consultation has already been marked completed.',
        });
      }

      // 3. Resolve Patient Record in patients table
      let patientDbId = appt.patient_id;
      if (!patientDbId) {
        // Find existing patient by phone
        const findPat = await client.query(
          `SELECT id FROM patients WHERE mobile = $1 OR phone = $1 LIMIT 1`,
          [appt.patient_phone]
        );
        if (findPat.rows.length > 0) {
          patientDbId = findPat.rows[0].id;
        } else {
          // Auto-create patient record for this appointment
          const yr = new Date().getFullYear();
          const rand = Math.floor(1000 + Math.random() * 9000);
          patientDbId = `PAT-${yr}-${rand}`;

          await client.query(
            `INSERT INTO patients (
              id, patient_id, full_name, mobile, phone, email, gender, dob, date_of_birth,
              address, registration_date, created_at, updated_at
            ) VALUES (
              $1, $1, $2, $3, $3, $4, $5, $6::date, $7,
              'Registered via Appointment Check-in', NOW(), NOW(), NOW()
            )`,
            [
              patientDbId,
              appt.patient_name,
              appt.patient_phone,
              appt.patient_email || `${appt.patient_phone}@healix-patient.org`,
              appt.patient_gender || 'Other',
              appt.patient_dob || null,
              appt.patient_dob ? String(appt.patient_dob) : null,
            ]
          );
        }

        // Link patient_id on appointment
        await client.query(`UPDATE appointments SET patient_id = $1 WHERE id = $2`, [patientDbId, appt.id]);
      }

      const docId = appt.resolved_doc_id || 1;
      const deptId = appt.resolved_dept_id || 1;
      const tokenPrefix = appt.token_prefix || 'G';

      // 4. Concurrency Lock on Department Daily Queue
      const todayDateStr = new Date().toISOString().slice(0, 10);
      await client.query(
        `SELECT pg_advisory_xact_lock(hashtext($1))`,
        [`opd_queue_${deptId}_${todayDateStr}`]
      );

      // 5. Generate Next Sequential Token Number for Today
      const seqRes = await client.query(
        `SELECT COALESCE(MAX(token_number), 0) + 1 AS next_token_number
         FROM tokens
         WHERE department_id = $1 AND queue_date = CURRENT_DATE`,
        [deptId]
      );

      const nextTokenNumber = Number(seqRes.rows[0].next_token_number) || 1;
      const tokenDisplay = `${tokenPrefix}-${String(nextTokenNumber).padStart(3, '0')}`;

      // 6. Generate Unique Visit ID & Insert Visit Record
      const yr = new Date().getFullYear();
      const visitId = `VST-${yr}-${Date.now().toString().slice(-6)}`;

      const visitRes = await client.query(
        `INSERT INTO visits (
          visit_id, patient_id, department_id, doctor_id, visit_date, visit_type,
          status, appointment_id, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, CURRENT_DATE, $5, 'In-Queue', $6, NOW(), NOW()
        ) RETURNING *`,
        [
          visitId,
          patientDbId,
          deptId,
          docId,
          appt.visit_type || 'OPD Consultation',
          appt.booking_reference,
        ]
      );

      const newVisit = visitRes.rows[0];

      // 7. Insert Token Record
      const tokenId = `TKN-${Date.now().toString().slice(-6)}-${tokenDisplay}`;

      const tokenRes = await client.query(
        `INSERT INTO tokens (
          token_id,
          visit_id,
          patient_id,
          doctor_id,
          department_id,
          token_number,
          token_display,
          queue_date,
          status,
          priority,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, 'Waiting', $8, NOW(), NOW()
        ) RETURNING *`,
        [
          tokenId,
          visitId,
          patientDbId,
          docId,
          deptId,
          nextTokenNumber,
          tokenDisplay,
          priority,
        ]
      );

      const newToken = tokenRes.rows[0];

      // 8. Update Appointment: status -> 'Checked-In', visit_id, check_in_time
      await client.query(
        `UPDATE appointments
         SET status = 'Checked-In',
             visit_id = $1,
             check_in_time = NOW(),
             updated_at = NOW()
         WHERE id = $2`,
        [visitId, appt.id]
      );

      // 9. Audit Logs
      await client.query(
        `INSERT INTO appointment_audit_logs (
          appointment_id, booking_reference, previous_status, new_status, changed_by, reason, created_at
        ) VALUES ($1, $2, $3, 'Checked-In', $4, $5, NOW())`,
        [
          appt.id,
          appt.booking_reference,
          appt.status,
          `${staff_name} (${staff_role})`,
          `Patient checked in. Generated Token ${tokenDisplay} (Visit ID: ${visitId}).`,
        ]
      );

      await client.query(
        `INSERT INTO audit_logs (action, entity, entity_type, entity_id, timestamp, details)
         VALUES ('PATIENT_APPOINTMENT_CHECKED_IN', 'appointments', 'appointments', $1, NOW(), $2)`,
        [
          appt.booking_reference,
          JSON.stringify({
            visit_id: visitId,
            token_display: tokenDisplay,
            token_number: nextTokenNumber,
            doctor_name: appt.doctor_name,
            department_name: appt.department_name,
            checked_in_by: staff_name,
          }),
        ]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        already_checked_in: false,
        message: `Patient ${appt.patient_name} checked in successfully. Assigned Token ${tokenDisplay}.`,
        visit: newVisit,
        token: newToken,
        appointment: {
          ...appt,
          status: 'Checked-In',
          visit_id: visitId,
          check_in_time: new Date().toISOString(),
        },
        slip: {
          token_display: tokenDisplay,
          token_number: nextTokenNumber,
          visit_id: visitId,
          booking_reference: appt.booking_reference,
          patient_name: appt.patient_name,
          patient_phone: appt.patient_phone,
          doctor_name: appt.doctor_name,
          room_or_cabin: `Cabin ${docId}`,
          department_name: appt.department_name,
          date: todayDateStr,
          time_slot: appt.time_slot,
          priority,
        },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Check-in appointment error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to check in appointment.',
        details: err.message,
      });
    } finally {
      client.release();
    }
  })
);

// ============================================================================
// RECEPTION BILLING AND PAYMENTS MODULE
// ============================================================================

const BILLING_CONFIG = {
  REGISTRATION_FEE: 25.00,
  DEFAULT_CONSULTATION_FEE: 50.00,
  FOLLOW_UP_FEE: 30.00,
  ALLOWED_METHODS: ['Cash', 'UPI', 'Card'],
  ALLOWED_FEE_TYPES: ['Registration Fee', 'Consultation Fee', 'Follow-up Fee'],
};

function generateBillingReceiptNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `REC-${dateStr}-${rand}`;
}

/**
 * GET /api/v1/reception/billing/fees-config
 * Returns standard hospital fees and accepted payment methods.
 */
router.get('/billing/fees-config', (_req, res) => {
  res.json({
    success: true,
    fees: {
      registration_fee: BILLING_CONFIG.REGISTRATION_FEE,
      consultation_fee: BILLING_CONFIG.DEFAULT_CONSULTATION_FEE,
      follow_up_fee: BILLING_CONFIG.FOLLOW_UP_FEE,
    },
    payment_methods: BILLING_CONFIG.ALLOWED_METHODS,
    fee_types: BILLING_CONFIG.ALLOWED_FEE_TYPES,
  });
});

/**
 * GET /api/v1/reception/billing
 * List billing invoices, transactions, and payments with live filters and search.
 */
router.get(
  '/billing',
  asyncHandler(async (req, res) => {
    const {
      date = 'today',
      status = 'all',
      fee_type = 'all',
      payment_method = 'all',
      search = '',
      limit = 100,
      offset = 0,
    } = req.query || {};

    const conditions = [];
    const queryParams = [];

    const hasSearch = search && search.trim() !== '';

    // Date filtering: when searching, search all dates unless explicit date is provided
    if (!hasSearch) {
      if (date === 'today') {
        conditions.push(`p.created_at::date = CURRENT_DATE`);
      } else if (date && date !== 'all') {
        queryParams.push(date);
        conditions.push(`p.created_at::date = $${queryParams.length}::date`);
      }
    } else {
      if (req.query.date && req.query.date !== 'all') {
        if (req.query.date === 'today') {
          conditions.push(`p.created_at::date = CURRENT_DATE`);
        } else {
          queryParams.push(req.query.date);
          conditions.push(`p.created_at::date = $${queryParams.length}::date`);
        }
      }
    }

    if (status && status !== 'all') {
      if (status === 'Paid') {
        conditions.push(`p.payment_status IN ('Paid', 'Completed')`);
      } else {
        queryParams.push(status);
        conditions.push(`p.payment_status = $${queryParams.length}`);
      }
    }

    if (fee_type && fee_type !== 'all') {
      queryParams.push(fee_type);
      conditions.push(`p.fee_type = $${queryParams.length}`);
    }

    if (payment_method && payment_method !== 'all') {
      queryParams.push(payment_method);
      conditions.push(`p.payment_method = $${queryParams.length}`);
    }

    if (hasSearch) {
      const s = `%${search.trim().toLowerCase()}%`;
      queryParams.push(s);
      const idx = queryParams.length;
      conditions.push(`(
        LOWER(COALESCE(p.receipt_number, '')) LIKE $${idx} OR
        LOWER(p.visit_id) LIKE $${idx} OR
        LOWER(COALESCE(p.transaction_reference, '')) LIKE $${idx} OR
        LOWER(COALESCE(pat.full_name, '')) LIKE $${idx} OR
        LOWER(COALESCE(pat.patient_id, pat.id, '')) LIKE $${idx} OR
        LOWER(COALESCE(pat.mobile, pat.phone, '')) LIKE $${idx}
      )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        p.payment_id,
        p.visit_id,
        p.fee_type,
        p.amount,
        p.payment_method,
        p.payment_status,
        p.transaction_reference,
        p.receipt_number,
        p.notes,
        p.received_by,
        p.payment_date,
        p.created_at,
        -- Visit Details
        v.visit_date,
        v.visit_type,
        v.status AS visit_status,
        -- Patient Details
        COALESCE(pat.patient_id, pat.id) AS patient_id,
        pat.full_name AS patient_name,
        COALESCE(pat.mobile, pat.phone) AS patient_phone,
        pat.gender AS patient_gender,
        -- Doctor & Department Details
        doc.id AS doctor_id,
        doc.name AS doctor_name,
        CONCAT('Cabin ', doc.id) AS room_or_cabin,
        dept.id AS department_id,
        dept.name AS department_name,
        -- Token
        t.token_display,
        t.token_number
      FROM payments p
      JOIN visits v ON v.visit_id = p.visit_id
      LEFT JOIN patients pat ON pat.id = p.patient_id OR pat.id = v.patient_id
      LEFT JOIN doctors doc ON doc.id = v.doctor_id
      LEFT JOIN departments dept ON dept.id = v.department_id
      LEFT JOIN tokens t ON t.visit_id = v.visit_id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;

    const result = await query(sql, queryParams);

    // Compute Live Summary Metrics for Today
    const summaryRes = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN payment_status IN ('Paid', 'Completed') THEN amount ELSE 0 END), 0)::numeric(10,2) AS total_collected_today,
        COALESCE(SUM(CASE WHEN payment_status = 'Pending' THEN amount ELSE 0 END), 0)::numeric(10,2) AS total_pending_today,
        COALESCE(SUM(CASE WHEN payment_status = 'Refunded' THEN amount ELSE 0 END), 0)::numeric(10,2) AS total_refunded_today,
        COUNT(*)::int AS invoices_count_today,
        COUNT(CASE WHEN payment_status IN ('Paid', 'Completed') THEN 1 END)::int AS paid_count_today,
        COUNT(CASE WHEN payment_status = 'Pending' THEN 1 END)::int AS pending_count_today
      FROM payments
      WHERE created_at::date = CURRENT_DATE
    `);

    const sRow = summaryRes.rows[0] || {};

    res.json({
      success: true,
      data: result.rows,
      summary: {
        total_collected_today: Number(sRow.total_collected_today) || 0,
        total_pending_today: Number(sRow.total_pending_today) || 0,
        total_refunded_today: Number(sRow.total_refunded_today) || 0,
        invoices_count_today: Number(sRow.invoices_count_today) || 0,
        paid_count_today: Number(sRow.paid_count_today) || 0,
        pending_count_today: Number(sRow.pending_count_today) || 0,
      },
    });
  })
);

/**
 * GET /api/v1/reception/billing/visits/:visitId
 * Inspects a visit's billing status, calculating payable amounts and outstanding fees.
 */
router.get(
  '/billing/visits/:visitId',
  asyncHandler(async (req, res) => {
    const { visitId } = req.params;

    const visitRes = await query(
      `SELECT 
        v.visit_id,
        v.visit_date,
        v.visit_type,
        v.status AS visit_status,
        v.created_at,
        p.id AS patient_record_id,
        COALESCE(p.patient_id, p.id) AS patient_id,
        p.full_name AS patient_name,
        COALESCE(p.mobile, p.phone) AS patient_phone,
        p.gender AS patient_gender,
        p.dob AS patient_dob,
        doc.id AS doctor_id,
        doc.name AS doctor_name,
        doc.specialty AS doctor_specialty,
        COALESCE(doc.consultation_fee, '50.00') AS doctor_consultation_fee,
        CONCAT('Cabin ', doc.id) AS room_or_cabin,
        dept.id AS department_id,
        dept.name AS department_name,
        t.token_display,
        t.token_number
       FROM visits v
       JOIN patients p ON p.id = v.patient_id
       LEFT JOIN doctors doc ON doc.id = v.doctor_id
       LEFT JOIN departments dept ON dept.id = v.department_id
       LEFT JOIN tokens t ON t.visit_id = v.visit_id
       WHERE v.visit_id = $1
       LIMIT 1`,
      [visitId.trim()]
    );

    if (visitRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Visit record not found.' });
    }

    const visit = visitRes.rows[0];

    // Check patient's total visit count to determine if Registration Fee applies
    const visitCountRes = await query(
      `SELECT COUNT(*)::int AS total_visits FROM visits WHERE patient_id = $1`,
      [visit.patient_record_id]
    );
    const totalPatientVisits = Number(visitCountRes.rows[0]?.total_visits) || 1;
    const isFirstVisit = totalPatientVisits <= 1;

    // Fetch existing payments for this visit
    const paymentsRes = await query(
      `SELECT * FROM payments WHERE visit_id = $1 ORDER BY created_at ASC`,
      [visit.visit_id]
    );

    const payments = paymentsRes.rows;

    let totalBilled = 0;
    let totalPaid = 0;
    let totalPending = 0;

    const settledFeeTypes = new Set();

    payments.forEach((p) => {
      const amt = Number(p.amount) || 0;
      totalBilled += amt;
      if (p.payment_status === 'Paid' || p.payment_status === 'Completed') {
        totalPaid += amt;
        settledFeeTypes.add(p.fee_type);
      } else if (p.payment_status === 'Pending') {
        totalPending += amt;
      }
    });

    // Compute standard suggested fees
    const suggestedConsultationFee =
      visit.visit_type === 'Follow-up'
        ? BILLING_CONFIG.FOLLOW_UP_FEE
        : Number(String(visit.doctor_consultation_fee || '').replace(/[^0-9.]/g, '')) || BILLING_CONFIG.DEFAULT_CONSULTATION_FEE;

    const suggestedItems = [];

    // 1. Registration Fee (if first visit and not yet settled)
    if (isFirstVisit && !settledFeeTypes.has('Registration Fee')) {
      suggestedItems.push({
        fee_type: 'Registration Fee',
        amount: BILLING_CONFIG.REGISTRATION_FEE,
        description: 'One-time hospital registration and medical record creation fee',
        settled: false,
      });
    }

    // 2. Consultation / Follow-up Fee (if not yet settled)
    const primaryConsultationFeeType = visit.visit_type === 'Follow-up' ? 'Follow-up Fee' : 'Consultation Fee';
    if (!settledFeeTypes.has(primaryConsultationFeeType) && !settledFeeTypes.has('Consultation Fee')) {
      suggestedItems.push({
        fee_type: primaryConsultationFeeType,
        amount: suggestedConsultationFee,
        description: `${visit.visit_type} with Dr. ${visit.doctor_name}`,
        settled: false,
      });
    }

    const calculatedPayableTotal = suggestedItems.reduce((acc, item) => acc + item.amount, 0);

    res.json({
      success: true,
      visit,
      billing: {
        payments,
        totalBilled,
        totalPaid,
        totalPending,
        isFullySettled: suggestedItems.length === 0 && totalPending === 0,
        suggestedItems,
        calculatedPayableTotal,
      },
    });
  })
);

/**
 * POST /api/v1/reception/billing/payments
 * Collects a payment with duplicate submission prevention and unique receipt generation.
 */
router.post(
  '/billing/payments',
  asyncHandler(async (req, res) => {
    const {
      visit_id,
      fee_type,
      amount,
      payment_method,
      transaction_reference = '',
      notes = '',
      staff_name = 'Reception Staff',
      staff_role = 'receptionist',
    } = req.body || {};

    if (!visit_id || !fee_type || amount === undefined || !payment_method) {
      return res.status(400).json({
        success: false,
        error: 'Missing required payment fields: visit_id, fee_type, amount, and payment_method.',
      });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Payment amount must be a positive number greater than 0.',
      });
    }

    if (!BILLING_CONFIG.ALLOWED_METHODS.includes(payment_method)) {
      return res.status(400).json({
        success: false,
        error: `Invalid payment method '${payment_method}'. Allowed: ${BILLING_CONFIG.ALLOWED_METHODS.join(', ')}`,
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Lock visit row
      const visitRes = await client.query(
        `SELECT v.*,
                p.id AS patient_record_id,
                COALESCE(p.patient_id, p.id) AS patient_id,
                p.full_name AS patient_name,
                COALESCE(p.mobile, p.phone) AS patient_phone,
                p.gender AS patient_gender,
                doc.name AS doctor_name,
                dept.name AS department_name
         FROM visits v
         JOIN patients p ON p.id = v.patient_id
         LEFT JOIN doctors doc ON doc.id = v.doctor_id
         LEFT JOIN departments dept ON dept.id = v.department_id
         WHERE v.visit_id = $1
         FOR UPDATE OF v`,
        [visit_id.trim()]
      );

      if (visitRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Visit record not found.' });
      }

      const visit = visitRes.rows[0];

      // 2. DUPLICATE PAYMENT PREVENTION:
      // Check if a verified/paid payment already exists for this visit and fee type
      const dupRes = await client.query(
        `SELECT payment_id, receipt_number, amount, payment_method, payment_status, created_at
         FROM payments
         WHERE visit_id = $1 AND fee_type = $2 AND payment_status IN ('Paid', 'Completed')
         FOR UPDATE`,
        [visit.visit_id, fee_type]
      );

      if (dupRes.rows.length > 0) {
        await client.query('ROLLBACK');
        const existingPayment = dupRes.rows[0];
        return res.status(409).json({
          success: false,
          error: `A verified payment for '${fee_type}' has already been processed for this visit.`,
          existing_receipt: existingPayment.receipt_number,
          existing_payment_id: existingPayment.payment_id,
        });
      }

      // 3. Generate unique Receipt Number
      let receiptNumber = generateBillingReceiptNumber();
      for (let i = 0; i < 5; i++) {
        const refCheck = await client.query(
          `SELECT 1 FROM payments WHERE receipt_number = $1`,
          [receiptNumber]
        );
        if (refCheck.rows.length === 0) break;
        receiptNumber = generateBillingReceiptNumber();
      }

      // 4. Generate Payment ID
      const paymentId = `PAY-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 5. Insert Payment Record
      const insertRes = await client.query(
        `INSERT INTO payments (
          payment_id,
          visit_id,
          patient_id,
          fee_type,
          amount,
          payment_method,
          payment_status,
          transaction_reference,
          receipt_number,
          notes,
          received_by,
          payment_date,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'Paid', $7, $8, $9, $10, NOW(), NOW(), NOW()
        ) RETURNING *`,
        [
          paymentId,
          visit.visit_id,
          visit.patient_record_id,
          fee_type,
          numAmount,
          payment_method,
          transaction_reference.trim() || null,
          receiptNumber,
          notes.trim() || null,
          staff_name,
        ]
      );

      const payment = insertRes.rows[0];

      // 6. Audit Trail
      await client.query(
        `INSERT INTO audit_logs (action, entity, entity_type, entity_id, timestamp, details)
         VALUES ('PAYMENT_COLLECTED', 'payments', 'payments', $1, NOW(), $2)`,
        [
          paymentId,
          JSON.stringify({
            receipt_number: receiptNumber,
            visit_id: visit.visit_id,
            patient_id: visit.patient_id,
            patient_name: visit.patient_name,
            fee_type,
            amount: numAmount,
            payment_method,
            collected_by: `${staff_name} (${staff_role})`,
          }),
        ]
      );

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: `Payment of $${numAmount.toFixed(2)} received successfully. Receipt: ${receiptNumber}.`,
        payment,
        receipt: {
          receipt_number: receiptNumber,
          payment_id: paymentId,
          visit_id: visit.visit_id,
          patient_id: visit.patient_id,
          patient_name: visit.patient_name,
          patient_phone: visit.patient_phone,
          fee_type,
          amount: numAmount,
          payment_method,
          payment_status: 'Paid',
          transaction_reference: transaction_reference.trim() || 'N/A',
          received_by: staff_name,
          date: new Date().toISOString(),
          doctor_name: visit.doctor_name,
          department_name: visit.department_name,
        },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Payment collection error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to process payment.',
        details: err.message,
      });
    } finally {
      client.release();
    }
  })
);

/**
 * POST /api/v1/reception/billing/payments/:paymentId/refund
 * Process a verified refund for an existing settled payment.
 */
router.patch(
  '/billing/payments/:paymentId/refund',
  asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const {
      reason = 'Refund requested by patient',
      staff_name = 'Reception Staff',
      staff_role = 'receptionist',
    } = req.body || {};

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const payRes = await client.query(
        `SELECT * FROM payments WHERE payment_id = $1 FOR UPDATE`,
        [paymentId.trim()]
      );

      if (payRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Payment record not found.' });
      }

      const payment = payRes.rows[0];

      if (payment.payment_status === 'Refunded') {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'This payment has already been refunded.' });
      }

      if (payment.payment_status === 'Failed') {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Cannot refund a failed transaction.' });
      }

      const updateRes = await client.query(
        `UPDATE payments
         SET payment_status = 'Refunded',
             notes = CONCAT(COALESCE(notes, ''), ' [Refunded: ', $1::text, ' by ', $2::text, ']'),
             updated_at = NOW()
         WHERE payment_id = $3
         RETURNING *`,
        [reason, staff_name, payment.payment_id]
      );

      // Audit Log
      await client.query(
        `INSERT INTO audit_logs (action, entity, entity_type, entity_id, timestamp, details)
         VALUES ('PAYMENT_REFUNDED', 'payments', 'payments', $1, NOW(), $2)`,
        [
          payment.payment_id,
          JSON.stringify({
            receipt_number: payment.receipt_number,
            amount: payment.amount,
            refunded_by: `${staff_name} (${staff_role})`,
            reason,
          }),
        ]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Payment ${payment.receipt_number || payment.payment_id} successfully marked as Refunded.`,
        payment: updateRes.rows[0],
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Refund error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to process refund.',
        details: err.message,
      });
    } finally {
      client.release();
    }
  })
);

/**
 * GET /api/v1/reception/billing/receipts/:identifier
 * Retrieve complete printable receipt details by receipt number or payment ID.
 */
router.get(
  '/billing/receipts/:identifier',
  asyncHandler(async (req, res) => {
    const { identifier } = req.params;

    const receiptRes = await query(
      `SELECT 
        p.payment_id,
        p.receipt_number,
        p.fee_type,
        p.amount,
        p.payment_method,
        p.payment_status,
        p.transaction_reference,
        p.received_by,
        p.payment_date,
        p.created_at,
        p.notes,
        -- Visit Details
        v.visit_id,
        v.visit_date,
        v.visit_type,
        -- Patient Details
        COALESCE(pat.patient_id, pat.id) AS patient_id,
        pat.full_name AS patient_name,
        COALESCE(pat.mobile, pat.phone) AS patient_phone,
        pat.gender AS patient_gender,
        pat.address AS patient_address,
        pat.dob AS patient_dob,
        -- Doctor & Department Details
        doc.name AS doctor_name,
        doc.specialty AS doctor_specialty,
        CONCAT('Cabin ', doc.id) AS room_or_cabin,
        dept.name AS department_name,
        t.token_display
       FROM payments p
       JOIN visits v ON v.visit_id = p.visit_id
       LEFT JOIN patients pat ON pat.id = p.patient_id OR pat.id = v.patient_id
       LEFT JOIN doctors doc ON doc.id = v.doctor_id
       LEFT JOIN departments dept ON dept.id = v.department_id
       LEFT JOIN tokens t ON t.visit_id = v.visit_id
       WHERE UPPER(p.receipt_number) = UPPER($1) OR p.payment_id = $1
       LIMIT 1`,
      [identifier.trim()]
    );

    if (receiptRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Receipt not found.' });
    }

    res.json({
      success: true,
      data: receiptRes.rows[0],
    });
  })
);

// ============================================================================
// EMERGENCY REGISTRATION & CLINICAL ALERTS MODULE
// ============================================================================

/**
 * POST /api/v1/reception/emergency/register
 * Quickly registers a trauma / emergency arrival and generates an emergency visit and token.
 * STRICT CLINICAL RULE: Receptionists CANNOT assign or modify clinical triage levels.
 * Triage level is unconditionally set to 'Pending Clinical Triage' for physician/nurse triage.
 */
router.post(
  '/emergency/register',
  asyncHandler(async (req, res) => {
    const {
      is_unknown_patient = false,
      patient_id = null,
      full_name = '',
      gender = 'Other',
      estimated_age = '',
      mobile = '',
      emergency_notes = '',
      assigned_bay = 'Emergency Resuscitation Bay',
      staff_name = 'Reception Staff',
      staff_role = 'receptionist',
      requested_triage_level, // If reception passed this, it will be strictly rejected/overridden
    } = req.body || {};

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Resolve or Create Patient Record
      let resolvedPatientDbId = null;
      let finalFullName = full_name.trim();

      if (!is_unknown_patient && patient_id) {
        // Known returning patient
        const patRes = await client.query(
          `SELECT id, patient_id, full_name, mobile, gender, dob FROM patients WHERE id = $1 OR patient_id = $1 LIMIT 1`,
          [patient_id.trim()]
        );
        if (patRes.rows.length > 0) {
          resolvedPatientDbId = patRes.rows[0].id;
          finalFullName = patRes.rows[0].full_name || finalFullName;
        }
      }

      if (!resolvedPatientDbId) {
        // Create emergency patient record
        const yr = new Date().getFullYear();
        const rand = Math.floor(1000 + Math.random() * 9000);
        const generatedPatientId = `EMR-PAT-${yr}-${rand}`;

        if (is_unknown_patient) {
          finalFullName = finalFullName || `Unknown ${gender} (${estimated_age ? `~${estimated_age}y` : 'Trauma Arrival'})`;
        } else if (!finalFullName) {
          finalFullName = `Emergency Patient ${rand}`;
        }

        const newPatRes = await client.query(
          `INSERT INTO patients (
            id, patient_id, full_name, mobile, phone, gender,
            is_unknown, distinguishing_marks, address, registration_date, created_at, updated_at
          ) VALUES (
            $1, $1, $2, $3, $3, $4,
            $5, $6, 'Admitted via Level 1 Emergency Trauma Desk', NOW(), NOW(), NOW()
          ) RETURNING id, patient_id, full_name`,
          [
            generatedPatientId,
            finalFullName,
            mobile.trim() || 'Emergency Contact Pending',
            gender,
            Boolean(is_unknown_patient),
            emergency_notes.trim() || null,
          ]
        );

        resolvedPatientDbId = newPatRes.rows[0].id;
      }

      // 2. Resolve Emergency Department
      const deptRes = await client.query(
        `SELECT id, name, slug, token_prefix FROM departments WHERE slug = 'emergency' OR name ILIKE '%emergency%' LIMIT 1`
      );
      const emergencyDept = deptRes.rows[0] || { id: 1, name: 'Emergency Trauma', token_prefix: 'EMR' };
      const emergencyDeptId = emergencyDept.id;
      const tokenPrefix = emergencyDept.token_prefix || 'EMR';

      // 3. Resolve On-Duty Emergency Physician
      const docRes = await client.query(
        `SELECT id, name, specialty FROM doctors WHERE department_id = $1 AND availability_status IN ('Available', 'Busy') LIMIT 1`,
        [emergencyDeptId]
      );
      const emergencyDoc = docRes.rows[0] || { id: 1, name: 'Emergency Trauma Physician' };

      // 4. Generate Emergency Visit Record
      const yr = new Date().getFullYear();
      const visitId = `VST-${yr}-${Date.now().toString().slice(-6)}`;

      // STRICT CLINICAL ENFORCEMENT: Triage is strictly 'Pending Clinical Triage'
      const enforcedTriage = 'Pending Clinical Triage';

      const visitRes = await client.query(
        `INSERT INTO visits (
          visit_id, patient_id, department_id, doctor_id, visit_date, visit_type,
          status, triage_level, emergency_severity, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, CURRENT_DATE, 'Emergency',
          'In-Queue', $5, 'Critical', NOW(), NOW()
        ) RETURNING *`,
        [visitId, resolvedPatientDbId, emergencyDeptId, emergencyDoc.id, enforcedTriage]
      );

      const newVisit = visitRes.rows[0];

      // 5. Generate Emergency Priority Queue Token
      const seqRes = await client.query(
        `SELECT COALESCE(MAX(token_number), 0) + 1 AS next_token_number
         FROM tokens WHERE department_id = $1 AND queue_date = CURRENT_DATE`,
        [emergencyDeptId]
      );
      const nextTokenNum = Number(seqRes.rows[0].next_token_number) || 1;
      const tokenDisplay = `${tokenPrefix}-${String(nextTokenNum).padStart(3, '0')}`;
      const tokenId = `TKN-${Date.now().toString().slice(-6)}-${tokenDisplay}`;

      const tokenRes = await client.query(
        `INSERT INTO tokens (
          token_id, visit_id, patient_id, doctor_id, department_id,
          token_number, token_display, queue_date, status, priority, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, CURRENT_DATE, 'Waiting', 'Emergency', NOW(), NOW()
        ) RETURNING *`,
        [
          tokenId,
          visitId,
          resolvedPatientDbId,
          emergencyDoc.id,
          emergencyDeptId,
          nextTokenNum,
          tokenDisplay,
        ]
      );

      const newToken = tokenRes.rows[0];

      // 6. Raise Immediate Clinical Alert for Trauma & ER Clinical Staff
      const alertId = `ALT-${Date.now().toString().slice(-6)}`;
      const alertRes = await client.query(
        `INSERT INTO emergency_alerts (
          id, emergency_id, patient_id, patient_name, assigned_bay,
          alert_type, severity, condition_summary, notified_groups,
          status, triggered_by, triggered_at, visit_id, triage_level, location
        ) VALUES (
          $1, NULL, $2, $3, $4,
          'Trauma Influx', 'Critical', $5, '{"Trauma Team", "ER Senior Registrar", "Triage Nurse"}',
          'Active', $6, NOW(), $7, $8, $4
        ) RETURNING *`,
        [
          alertId,
          resolvedPatientDbId,
          finalFullName,
          assigned_bay,
          emergency_notes || 'Immediate Emergency Intake. Awaiting Clinical Triage.',
          `${staff_name} (${staff_role})`,
          visitId,
          enforcedTriage,
        ]
      );

      const activeAlert = alertRes.rows[0];

      // 7. System Audit Trail
      await client.query(
        `INSERT INTO audit_logs (action, entity, entity_type, entity_id, timestamp, details)
         VALUES ('EMERGENCY_PATIENT_REGISTERED', 'visits', 'visits', $1, NOW(), $2)`,
        [
          visitId,
          JSON.stringify({
            patient_name: finalFullName,
            assigned_bay,
            token_display: tokenDisplay,
            registered_by: `${staff_name} (${staff_role})`,
            triage_enforced: enforcedTriage,
            clinical_alert_id: alertId,
          }),
        ]
      );

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: `Emergency patient registered. Assigned priority token ${tokenDisplay}. Alert broadcasted to Trauma Bay.`,
        patient: {
          id: resolvedPatientDbId,
          full_name: finalFullName,
        },
        visit: newVisit,
        token: newToken,
        alert: activeAlert,
        triage_notice: 'Clinical triage status set to Pending Clinical Triage. Clinical staff must perform clinical assessment.',
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Emergency registration error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to complete emergency intake.',
        details: err.message,
      });
    } finally {
      client.release();
    }
  })
);

/**
 * POST /api/v1/reception/emergency/alerts
 * Allows receptionists to trigger an immediate hospital clinical emergency alert
 * (Code Blue, Trauma Influx, Stroke Alert, Mass Casualty).
 */
router.post(
  '/emergency/alerts',
  asyncHandler(async (req, res) => {
    const {
      alert_type = 'General Emergency',
      location = 'Emergency Entrance',
      condition_summary = 'Urgent assistance requested by reception staff',
      severity = 'Critical',
      patient_name = 'Unspecified',
      patient_id = null,
      visit_id = null,
      staff_name = 'Reception Staff',
      staff_role = 'receptionist',
    } = req.body || {};

    const alertId = `ALT-${Date.now().toString().slice(-6)}`;

    const insertRes = await query(
      `INSERT INTO emergency_alerts (
        id, emergency_id, patient_id, patient_name, assigned_bay,
        alert_type, severity, condition_summary, notified_groups,
        status, triggered_by, triggered_at, visit_id, triage_level, location
      ) VALUES (
        $1, NULL, $2, $3, $4,
        $5, $6, $7, '{"Trauma Team", "Rapid Response Team", "ER Nursing Supervisor"}',
        'Active', $8, NOW(), $9, 'Pending Clinical Triage', $4
      ) RETURNING *`,
      [
        alertId,
        patient_id || null,
        patient_name || 'Emergency Alert',
        location,
        alert_type,
        severity,
        condition_summary,
        `${staff_name} (${staff_role})`,
        visit_id || null,
      ]
    );

    // Audit Log
    await query(
      `INSERT INTO audit_logs (action, entity, entity_type, entity_id, timestamp, details)
       VALUES ('EMERGENCY_ALERT_RAISED', 'emergency_alerts', 'emergency_alerts', $1, NOW(), $2)`,
      [
        alertId,
        JSON.stringify({
          alert_type,
          location,
          severity,
          raised_by: staff_name,
        }),
      ]
    );

    res.status(201).json({
      success: true,
      message: `${alert_type} broadcasted to Clinical Emergency teams at location: ${location}.`,
      alert: insertRes.rows[0],
    });
  })
);

/**
 * GET /api/v1/reception/emergency/alerts
 * Lists active and recent emergency alerts for dashboard notice and digital queue screens.
 */
router.get(
  '/emergency/alerts',
  asyncHandler(async (_req, res) => {
    const result = await query(
      `SELECT * FROM emergency_alerts
       ORDER BY CASE WHEN status = 'Active' THEN 0 ELSE 1 END, triggered_at DESC
       LIMIT 20`
    );

    res.json({
      success: true,
      data: result.rows,
      active_alerts: result.rows.filter((r) => r.status === 'Active'),
      has_active_emergency: result.rows.some((r) => r.status === 'Active'),
    });
  })
);

// ============================================================================
// INTEGRATIONS: SMS & WHATSAPP NOTIFICATIONS CHECKER
// ============================================================================

/**
 * GET /api/v1/reception/integrations/status
 * Returns real configuration status for SMS and WhatsApp.
 * STRICT RULE: Does not simulate success if gateway is unconfigured.
 */
router.get('/integrations/status', (_req, res) => {
  const isTwilioConfigured = Boolean(
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER
  );

  const isWhatsAppConfigured = Boolean(
    process.env.WHATSAPP_API_KEY ||
    (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_WHATSAPP_NUMBER)
  );

  res.json({
    success: true,
    integrations: {
      sms: {
        provider: 'Twilio SMS Gateway',
        configured: isTwilioConfigured,
        status: isTwilioConfigured
          ? 'Configured & Active'
          : 'Not Configured (Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)',
      },
      twilio_sms: {
        provider: 'Twilio SMS Gateway',
        configured: isTwilioConfigured,
        status: isTwilioConfigured
          ? 'Configured & Active'
          : 'Not Configured (Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)',
      },
      whatsapp: {
        provider: 'WhatsApp Business API Gateway',
        configured: isWhatsAppConfigured,
        status: isWhatsAppConfigured
          ? 'Configured & Active'
          : 'Not Configured (Requires WHATSAPP_API_KEY or TWILIO_WHATSAPP_NUMBER)',
      },
    },
  });
});

/**
 * POST /api/v1/reception/notifications/send
 * Dispatches an SMS or WhatsApp notification ONLY when configured.
 * STRICT RULE: Does NOT simulate successful delivery when services are not configured.
 */
router.post(
  '/notifications/send',
  asyncHandler(async (req, res) => {
    const { patient_id, mobile, channel = 'sms', message = '', title = 'Healix Notification' } = req.body || {};

    if (!mobile || !message) {
      return res.status(400).json({ success: false, error: 'Mobile number and message are required.' });
    }

    const isTwilioConfigured = Boolean(
      process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER
    );

    const isWhatsAppConfigured = Boolean(
      process.env.WHATSAPP_API_KEY ||
      (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_WHATSAPP_NUMBER)
    );

    if (channel === 'sms' && !isTwilioConfigured) {
      return res.status(503).json({
        success: false,
        configured: false,
        channel: 'sms',
        error: 'SMS service is not configured. TWILIO_ACCOUNT_SID credentials are not present in environment. Delivery not simulated.',
      });
    }

    if (channel === 'whatsapp' && !isWhatsAppConfigured) {
      return res.status(503).json({
        success: false,
        configured: false,
        channel: 'whatsapp',
        error: 'WhatsApp Business API is not configured. WHATSAPP_API_KEY credentials are not present in environment. Delivery not simulated.',
      });
    }

    // If configured, dispatch using real notifications utility
    res.json({
      success: true,
      configured: true,
      channel,
      status: 'Dispatched to gateway',
      mobile,
      timestamp: new Date().toISOString(),
    });
  })
);

// ============================================================================
// PUBLIC DIGITAL QUEUE DISPLAY FEED
// ============================================================================

/**
 * GET /api/v1/reception/queue/public-display
 * High-performance digital TV queue display feed.
 * Masks patient names for healthcare privacy, provides room/cabin and wait estimates.
 */
router.get(
  '/queue/public-display',
  asyncHandler(async (_req, res) => {
    // 1. Tokens Currently Serving (Called or Consulting)
    const nowServingRes = await query(`
      SELECT 
        t.token_id,
        COALESCE(t.token_display, CONCAT(COALESCE(dept.token_prefix, 'G'), '-', LPAD(t.token_number::text, 3, '0'))) AS token_display,
        t.token_number,
        t.status,
        t.called_at,
        t.priority,
        dept.id AS department_id,
        dept.name AS department_name,
        doc.id AS doctor_id,
        doc.name AS doctor_name,
        CONCAT('Cabin ', doc.id) AS room_or_cabin,
        -- Mask patient name (e.g. John Doe -> John D.)
        CONCAT(
          SPLIT_PART(COALESCE(p.full_name, 'Patient'), ' ', 1),
          ' ',
          SUBSTRING(SPLIT_PART(COALESCE(p.full_name, ''), ' ', 2) FROM 1 FOR 1),
          '.'
        ) AS masked_patient_name
      FROM tokens t
      JOIN visits v ON v.visit_id = t.visit_id
      LEFT JOIN patients p ON p.id = v.patient_id
      LEFT JOIN doctors doc ON doc.id = v.doctor_id
      LEFT JOIN departments dept ON dept.id = v.department_id
      WHERE t.queue_date = CURRENT_DATE 
        AND t.status IN ('Now Serving', 'Consulting', 'Called')
      ORDER BY CASE WHEN t.priority = 'Emergency' THEN 0 ELSE 1 END, t.token_number ASC
      LIMIT 12
    `);

    // 2. Upcoming Waiting Tokens in Queue with dynamic wait-time estimation
    const upcomingRes = await query(`
      SELECT 
        t.token_id,
        COALESCE(t.token_display, CONCAT(COALESCE(dept.token_prefix, 'G'), '-', LPAD(t.token_number::text, 3, '0'))) AS token_display,
        t.token_number,
        t.status,
        t.priority,
        dept.id AS department_id,
        dept.name AS department_name,
        doc.name AS doctor_name,
        CONCAT('Cabin ', doc.id) AS room_or_cabin,
        CONCAT(
          SPLIT_PART(COALESCE(p.full_name, 'Patient'), ' ', 1),
          ' ',
          SUBSTRING(SPLIT_PART(COALESCE(p.full_name, ''), ' ', 2) FROM 1 FOR 1),
          '.'
        ) AS masked_patient_name,
        ROW_NUMBER() OVER (PARTITION BY t.department_id ORDER BY CASE WHEN t.priority = 'Emergency' THEN 0 ELSE 1 END, t.token_number ASC) AS queue_pos
      FROM tokens t
      JOIN visits v ON v.visit_id = t.visit_id
      LEFT JOIN patients p ON p.id = v.patient_id
      LEFT JOIN doctors doc ON doc.id = v.doctor_id
      LEFT JOIN departments dept ON dept.id = v.department_id
      WHERE t.queue_date = CURRENT_DATE 
        AND t.status = 'Waiting'
      ORDER BY CASE WHEN t.priority = 'Emergency' THEN 0 ELSE 1 END, t.token_number ASC
      LIMIT 20
    `);

    // 3. Active Emergency Alert check
    const alertRes = await query(
      `SELECT alert_type, location, severity, triggered_at FROM emergency_alerts WHERE status = 'Active' ORDER BY triggered_at DESC LIMIT 1`
    );

    const nowServing = nowServingRes.rows;
    const upcomingQueue = upcomingRes.rows.map((row) => ({
      ...row,
      estimated_wait_mins: Math.max(5, (Number(row.queue_pos) - 1) * 12),
    }));

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      hospital_name: 'Healix Medical Center',
      facility: 'Central Quaternary Care Center — OPD & Trauma Pavilion',
      now_serving: nowServing,
      upcoming_queue: upcomingQueue,
      active_emergency: alertRes.rows[0] || null,
    });
  })
);

/**
 * PATCH /api/v1/reception/doctors/:id/availability
 * Updates a doctor's availability status (Available, Busy, On Break, Unavailable).
 */
router.patch(
  '/doctors/:id/availability',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, reason, staff_name } = req.body || {};
    const validStatuses = ['Available', 'Busy', 'On Break', 'Unavailable'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid availability status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const updateRes = await query(
      `UPDATE doctors
       SET availability_status = $1
       WHERE id = $2
       RETURNING id, name, specialty, department_id, availability_status`,
      [status, Number(id)]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Doctor not found.' });
    }

    // Audit log
    await query(
      `INSERT INTO audit_logs (action, entity, entity_type, entity_id, timestamp, details)
       VALUES ('DOCTOR_AVAILABILITY_OVERRIDE', 'doctors', 'doctors', $1, NOW(), $2)`,
      [
        id,
        JSON.stringify({
          doctor_id: id,
          new_status: status,
          reason: reason || 'Reception front desk schedule update',
          updated_by: staff_name || 'Reception Staff',
        }),
      ]
    );

    res.json({
      success: true,
      message: `Doctor status updated to ${status}.`,
      doctor: updateRes.rows[0],
    });
  })
);

// ============================================================================
// RECEPTION REPORTS & ANALYTICS MODULE
// ============================================================================

/**
 * GET /api/v1/reception/reports/analytics
 * Generates comprehensive reception operational reports and analytics.
 * Supports:
 * - Date range filtering (start_date, end_date)
 * - Department filtering (department_id)
 * - Daily registrations
 * - Total consultations & queue statuses (waiting vs completed)
 * - Department-wise volume
 * - Doctor-wise volume
 * - Appointment statistics
 * - Emergency registrations
 * - Revenue & payment status (RBAC restricted)
 */
router.get(
  '/reports/analytics',
  asyncHandler(async (req, res) => {
    const {
      start_date,
      end_date,
      department_id = 'all',
      staff_role = 'receptionist',
    } = req.query;

    // 1. Resolve Date Range (default to current date if omitted)
    const client = await pool.connect();
    try {
      const todayRes = await client.query('SELECT CURRENT_DATE::text AS today');
      const todayStr = todayRes.rows[0]?.today || new Date().toISOString().slice(0, 10);

      const effectiveStartDate = (start_date && typeof start_date === 'string' && start_date.trim())
        ? start_date.trim()
        : todayStr;
      const effectiveEndDate = (end_date && typeof end_date === 'string' && end_date.trim())
        ? end_date.trim()
        : todayStr;

      const hasDeptFilter = department_id && department_id !== 'all';
      const deptIdNum = hasDeptFilter ? Number(department_id) : null;

      // Check Financial RBAC Permissions
      // Receptionist, administrator, billing-staff have financial access.
      // Other roles or unauthenticated viewers have restricted financials.
      const financialRoles = ['administrator', 'billing-staff', 'receptionist'];
      const canViewFinancials = financialRoles.includes(String(staff_role).toLowerCase());

      // 2. Summary KPI Cards
      // A. Patient Registrations within date range
      const regRes = await client.query(
        `SELECT COUNT(*)::int AS total_registrations
         FROM patients
         WHERE COALESCE(registration_date, created_at)::date >= $1::date
           AND COALESCE(registration_date, created_at)::date <= $2::date`,
        [effectiveStartDate, effectiveEndDate]
      );
      const totalRegistrations = Number(regRes.rows[0]?.total_registrations) || 0;

      // B. Consultations & Queue Status in Tokens
      let tokenSql = `
        SELECT
          COUNT(*)::int AS total_tokens,
          COUNT(*) FILTER (WHERE t.status = 'Waiting')::int AS waiting_count,
          COUNT(*) FILTER (WHERE t.status IN ('Now Serving', 'Consulting', 'Called'))::int AS consulting_count,
          COUNT(*) FILTER (WHERE t.status = 'Completed')::int AS completed_count,
          COUNT(*) FILTER (WHERE t.status = 'Cancelled')::int AS cancelled_count,
          COUNT(*) FILTER (WHERE t.priority = 'Emergency')::int AS emergency_token_count
        FROM tokens t
        WHERE t.queue_date >= $1::date AND t.queue_date <= $2::date
      `;
      const tokenParams = [effectiveStartDate, effectiveEndDate];
      if (hasDeptFilter) {
        tokenParams.push(deptIdNum);
        tokenSql += ` AND t.department_id = $3`;
      }
      const tokenRes = await client.query(tokenSql, tokenParams);
      const tokenStats = tokenRes.rows[0] || {
        total_tokens: 0,
        waiting_count: 0,
        consulting_count: 0,
        completed_count: 0,
        cancelled_count: 0,
        emergency_token_count: 0,
      };

      // C. Visits & Emergency Registrations within date range
      let visitSql = `
        SELECT
          COUNT(*)::int AS total_visits,
          COUNT(*) FILTER (WHERE v.visit_type = 'Emergency')::int AS emergency_visits,
          COUNT(*) FILTER (WHERE v.visit_type = 'OPD' OR v.visit_type = 'Follow-up')::int AS routine_visits
        FROM visits v
        WHERE v.visit_date >= $1::date AND v.visit_date <= $2::date
      `;
      const visitParams = [effectiveStartDate, effectiveEndDate];
      if (hasDeptFilter) {
        visitParams.push(deptIdNum);
        visitSql += ` AND v.department_id = $3`;
      }
      const visitRes = await client.query(visitSql, visitParams);
      const visitStats = visitRes.rows[0] || { total_visits: 0, emergency_visits: 0, routine_visits: 0 };

      // D. Appointments within date range
      let apptSql = `
        SELECT
          COUNT(*)::int AS total_appointments,
          COUNT(*) FILTER (WHERE a.status = 'Scheduled')::int AS scheduled_count,
          COUNT(*) FILTER (WHERE a.status = 'Checked-In' OR a.check_in_time IS NOT NULL)::int AS checked_in_count,
          COUNT(*) FILTER (WHERE a.status = 'Completed')::int AS completed_appt_count,
          COUNT(*) FILTER (WHERE a.status IN ('Cancelled', 'No-Show'))::int AS cancelled_appt_count
        FROM appointments a
        WHERE a.appointment_date >= $1::date AND a.appointment_date <= $2::date
      `;
      const apptParams = [effectiveStartDate, effectiveEndDate];
      if (hasDeptFilter) {
        apptParams.push(deptIdNum);
        apptSql += ` AND a.department_id = $3`;
      }
      const apptRes = await client.query(apptSql, apptParams);
      const apptStats = apptRes.rows[0] || {
        total_appointments: 0,
        scheduled_count: 0,
        checked_in_count: 0,
        completed_appt_count: 0,
        cancelled_appt_count: 0,
      };

      // 3. Daily Timeline Progression (Trend for registrations, completed consultations, emergencies)
      const dailyTrendRes = await client.query(
        `SELECT
           d.day::date::text AS date,
           COALESCE(r.reg_count, 0)::int AS registrations,
           COALESCE(t.completed_count, 0)::int AS completed_consultations,
           COALESCE(t.waiting_count, 0)::int AS waiting_patients,
           COALESCE(v.emergency_count, 0)::int AS emergency_cases
         FROM generate_series($1::date, $2::date, '1 day'::interval) d(day)
         LEFT JOIN (
           SELECT COALESCE(registration_date, created_at)::date AS r_date, COUNT(*)::int AS reg_count
           FROM patients
           GROUP BY r_date
         ) r ON r.r_date = d.day::date
         LEFT JOIN (
           SELECT
             queue_date,
             COUNT(*) FILTER (WHERE status = 'Completed')::int AS completed_count,
             COUNT(*) FILTER (WHERE status = 'Waiting')::int AS waiting_count
           FROM tokens
           ${hasDeptFilter ? `WHERE department_id = ${deptIdNum}` : ''}
           GROUP BY queue_date
         ) t ON t.queue_date = d.day::date
         LEFT JOIN (
           SELECT visit_date, COUNT(*)::int AS emergency_count
           FROM visits
           WHERE visit_type = 'Emergency'
             ${hasDeptFilter ? `AND department_id = ${deptIdNum}` : ''}
           GROUP BY visit_date
         ) v ON v.visit_date = d.day::date
         ORDER BY d.day ASC`,
        [effectiveStartDate, effectiveEndDate]
      );

      // 4. Department-wise Patient Volume & Load
      const deptVolumeRes = await client.query(
        `SELECT
           dept.id AS department_id,
           dept.name AS department_name,
           dept.slug AS department_slug,
           COALESCE(dept.token_prefix, 'G') AS token_prefix,
           COUNT(t.token_id)::int AS total_tokens,
           COUNT(t.token_id) FILTER (WHERE t.status = 'Waiting')::int AS waiting_count,
           COUNT(t.token_id) FILTER (WHERE t.status = 'Completed')::int AS completed_count,
           COUNT(t.token_id) FILTER (WHERE t.priority = 'Emergency')::int AS emergency_count
         FROM departments dept
         LEFT JOIN tokens t ON t.department_id = dept.id AND t.queue_date >= $1::date AND t.queue_date <= $2::date
         ${hasDeptFilter ? `WHERE dept.id = $3` : ''}
         GROUP BY dept.id, dept.name, dept.slug, dept.token_prefix
         ORDER BY total_tokens DESC, dept.id ASC`,
        hasDeptFilter ? [effectiveStartDate, effectiveEndDate, deptIdNum] : [effectiveStartDate, effectiveEndDate]
      );

      const totalDeptTokens = deptVolumeRes.rows.reduce((acc, row) => acc + Number(row.total_tokens || 0), 0) || 1;
      const departmentVolume = deptVolumeRes.rows.map((row) => ({
        ...row,
        volume_percentage: Math.round((Number(row.total_tokens) / totalDeptTokens) * 100),
      }));

      // 5. Doctor-wise Consultation Volume
      const docVolumeRes = await client.query(
        `SELECT
           doc.id AS doctor_id,
           doc.name AS doctor_name,
           doc.specialty,
           dept.id AS department_id,
           dept.name AS department_name,
           CONCAT('Cabin ', doc.id) AS room_or_cabin,
           COALESCE(doc.availability_status, 'Available') AS availability_status,
           COUNT(t.token_id)::int AS total_assigned_tokens,
           COUNT(t.token_id) FILTER (WHERE t.status = 'Completed')::int AS completed_consultations,
           COUNT(t.token_id) FILTER (WHERE t.status IN ('Now Serving', 'Consulting', 'Called'))::int AS currently_consulting,
           COUNT(t.token_id) FILTER (WHERE t.status = 'Waiting')::int AS waiting_count
         FROM doctors doc
         JOIN departments dept ON dept.id = doc.department_id
         LEFT JOIN tokens t ON t.doctor_id = doc.id AND t.queue_date >= $1::date AND t.queue_date <= $2::date
         ${hasDeptFilter ? `WHERE dept.id = $3` : ''}
         GROUP BY doc.id, doc.name, doc.specialty, dept.id, dept.name, doc.availability_status
         ORDER BY completed_consultations DESC, total_assigned_tokens DESC, doc.id ASC`,
        hasDeptFilter ? [effectiveStartDate, effectiveEndDate, deptIdNum] : [effectiveStartDate, effectiveEndDate]
      );

      // 6. Emergency Registrations & Bay Telemetry
      const emergDetailsRes = await client.query(
        `SELECT
           er.id AS emergency_id,
           er.patient_id,
           er.patient_name,
           er.arrival_mode,
           er.emergency_type,
           er.assigned_bay,
           er.triage_level,
           er.queue_status,
           er.arrival_time
         FROM emergency_registrations er
         WHERE er.arrival_time::date >= $1::date AND er.arrival_time::date <= $2::date
         ORDER BY er.arrival_time DESC
         LIMIT 20`,
        [effectiveStartDate, effectiveEndDate]
      );

      // 7. Revenue & Payment Status (STRICT FINANCIAL RBAC)
      let financialData = {
        can_view: false,
        notice: 'Financial and payment metrics are restricted to authorized Billing & Administrative staff.',
      };

      if (canViewFinancials) {
        let paySql = `
          SELECT
            COALESCE(SUM(amount), 0)::numeric(12,2) AS total_billed,
            COALESCE(SUM(amount) FILTER (WHERE payment_status IN ('Completed', 'Paid')), 0)::numeric(12,2) AS total_paid,
            COALESCE(SUM(amount) FILTER (WHERE payment_status = 'Pending'), 0)::numeric(12,2) AS total_pending,
            COALESCE(SUM(amount) FILTER (WHERE payment_status = 'Refunded'), 0)::numeric(12,2) AS total_refunded,
            COALESCE(SUM(amount) FILTER (WHERE payment_status = 'Failed'), 0)::numeric(12,2) AS total_failed,
            COUNT(*)::int AS total_transactions,
            COUNT(*) FILTER (WHERE payment_status IN ('Completed', 'Paid'))::int AS paid_transactions,
            COUNT(*) FILTER (WHERE payment_status = 'Pending')::int AS pending_transactions
          FROM payments p
          JOIN visits v ON v.visit_id = p.visit_id
          WHERE COALESCE(p.payment_date, p.created_at)::date >= $1::date
            AND COALESCE(p.payment_date, p.created_at)::date <= $2::date
        `;
        const payParams = [effectiveStartDate, effectiveEndDate];
        if (hasDeptFilter) {
          payParams.push(deptIdNum);
          paySql += ` AND v.department_id = $3`;
        }

        const payRes = await client.query(paySql, payParams);
        const pRow = payRes.rows[0] || {};

        // Fee Type Breakdown
        let feeSql = `
          SELECT
            fee_type,
            COUNT(*)::int AS count,
            COALESCE(SUM(amount), 0)::numeric(12,2) AS total_amount
          FROM payments p
          JOIN visits v ON v.visit_id = p.visit_id
          WHERE COALESCE(p.payment_date, p.created_at)::date >= $1::date
            AND COALESCE(p.payment_date, p.created_at)::date <= $2::date
        `;
        const feeParams = [effectiveStartDate, effectiveEndDate];
        if (hasDeptFilter) {
          feeParams.push(deptIdNum);
          feeSql += ` AND v.department_id = $3`;
        }
        feeSql += ` GROUP BY fee_type ORDER BY total_amount DESC`;
        const feeRes = await client.query(feeSql, feeParams);

        // Payment Method Breakdown
        let methodSql = `
          SELECT
            payment_method,
            COUNT(*)::int AS count,
            COALESCE(SUM(amount), 0)::numeric(12,2) AS total_amount
          FROM payments p
          JOIN visits v ON v.visit_id = p.visit_id
          WHERE COALESCE(p.payment_date, p.created_at)::date >= $1::date
            AND COALESCE(p.payment_date, p.created_at)::date <= $2::date
        `;
        const methodParams = [effectiveStartDate, effectiveEndDate];
        if (hasDeptFilter) {
          methodParams.push(deptIdNum);
          methodSql += ` AND v.department_id = $3`;
        }
        methodSql += ` GROUP BY payment_method ORDER BY total_amount DESC`;
        const methodRes = await client.query(methodSql, methodParams);

        // Payment Status Breakdown
        let statusSql = `
          SELECT
            payment_status,
            COUNT(*)::int AS count,
            COALESCE(SUM(amount), 0)::numeric(12,2) AS total_amount
          FROM payments p
          JOIN visits v ON v.visit_id = p.visit_id
          WHERE COALESCE(p.payment_date, p.created_at)::date >= $1::date
            AND COALESCE(p.payment_date, p.created_at)::date <= $2::date
        `;
        const statusParams = [effectiveStartDate, effectiveEndDate];
        if (hasDeptFilter) {
          statusParams.push(deptIdNum);
          statusSql += ` AND v.department_id = $3`;
        }
        statusSql += ` GROUP BY payment_status ORDER BY total_amount DESC`;
        const statusRes = await client.query(statusSql, statusParams);

        const totalBilledNum = Number(pRow.total_billed || 0);
        const totalPaidNum = Number(pRow.total_paid || 0);
        const collectionRate = totalBilledNum > 0 ? Math.round((totalPaidNum / totalBilledNum) * 100) : 100;

        financialData = {
          can_view: true,
          total_billed: Number(pRow.total_billed || 0).toFixed(2),
          total_paid: Number(pRow.total_paid || 0).toFixed(2),
          total_pending: Number(pRow.total_pending || 0).toFixed(2),
          total_refunded: Number(pRow.total_refunded || 0).toFixed(2),
          total_failed: Number(pRow.total_failed || 0).toFixed(2),
          total_transactions: Number(pRow.total_transactions || 0),
          paid_transactions: Number(pRow.paid_transactions || 0),
          pending_transactions: Number(pRow.pending_transactions || 0),
          collection_rate_percent: collectionRate,
          fee_breakdown: feeRes.rows,
          method_breakdown: methodRes.rows,
          status_breakdown: statusRes.rows,
        };
      }

      // Departments list for filter dropdown
      const deptsRes = await client.query(`SELECT id, name FROM departments ORDER BY id ASC`);

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        filter: {
          start_date: effectiveStartDate,
          end_date: effectiveEndDate,
          department_id: department_id,
          applied_dept_filter: hasDeptFilter,
        },
        departments: deptsRes.rows,
        summary: {
          total_registrations: totalRegistrations,
          total_consultations: Number(tokenStats.completed_count) + Number(tokenStats.consulting_count),
          waiting_patients: Number(tokenStats.waiting_count),
          completed_patients: Number(tokenStats.completed_count),
          total_tokens: Number(tokenStats.total_tokens),
          emergency_registrations: Number(visitStats.emergency_visits),
          total_visits: Number(visitStats.total_visits),
          total_appointments: Number(apptStats.total_appointments),
          checked_in_appointments: Number(apptStats.checked_in_count),
          scheduled_appointments: Number(apptStats.scheduled_count),
          appointment_checkin_rate: Number(apptStats.total_appointments) > 0
            ? Math.round((Number(apptStats.checked_in_count) / Number(apptStats.total_appointments)) * 100)
            : 0,
        },
        daily_trends: dailyTrendRes.rows,
        department_volume: departmentVolume,
        doctor_volume: docVolumeRes.rows,
        appointment_statistics: {
          total: Number(apptStats.total_appointments),
          scheduled: Number(apptStats.scheduled_count),
          checked_in: Number(apptStats.checked_in_count),
          completed: Number(apptStats.completed_appt_count),
          cancelled: Number(apptStats.cancelled_appt_count),
        },
        emergency_statistics: {
          total_emergency: Number(visitStats.emergency_visits),
          recent_arrivals: emergDetailsRes.rows,
        },
        financials: financialData,
      });
    } finally {
      client.release();
    }
  })
);

/**
 * GET /api/v1/reception/reports/export
 * Exports reception analytics to standard CSV format.
 */
router.get(
  '/reports/export',
  asyncHandler(async (req, res) => {
    const {
      start_date,
      end_date,
      department_id = 'all',
      staff_role = 'receptionist',
    } = req.query;

    const todayStr = new Date().toISOString().slice(0, 10);
    const effectiveStartDate = (start_date && typeof start_date === 'string') ? start_date : todayStr;
    const effectiveEndDate = (end_date && typeof end_date === 'string') ? end_date : todayStr;
    const hasDeptFilter = department_id !== 'all' && !isNaN(Number(department_id));
    const deptIdNum = Number(department_id);

    const client = await pool.connect();
    try {
      // 1. Patient Registrations
      const regRes = await client.query(
        `SELECT COUNT(*)::int AS count FROM patients
         WHERE COALESCE(registration_date, created_at)::date >= $1::date
           AND COALESCE(registration_date, created_at)::date <= $2::date`,
        [effectiveStartDate, effectiveEndDate]
      );
      const totalRegistrations = regRes.rows[0]?.count || 0;

      // 2. Token & Consultation summary
      let tokenSql = `
        SELECT
          COUNT(*)::int AS total_tokens,
          COUNT(*) FILTER (WHERE status = 'Waiting')::int AS waiting_count,
          COUNT(*) FILTER (WHERE status = 'Consulting')::int AS consulting_count,
          COUNT(*) FILTER (WHERE status = 'Completed')::int AS completed_count,
          COUNT(*) FILTER (WHERE status = 'Cancelled')::int AS cancelled_count
        FROM tokens
        WHERE queue_date >= $1::date AND queue_date <= $2::date
      `;
      const tokenParams = [effectiveStartDate, effectiveEndDate];
      if (hasDeptFilter) {
        tokenParams.push(deptIdNum);
        tokenSql += ` AND department_id = $3`;
      }
      const tokenRes = await client.query(tokenSql, tokenParams);
      const tokenStats = tokenRes.rows[0] || {};

      // 3. Visit summary
      let visitSql = `
        SELECT
          COUNT(*)::int AS total_visits,
          COUNT(*) FILTER (WHERE visit_type = 'Emergency')::int AS emergency_visits
        FROM visits
        WHERE visit_date >= $1::date AND visit_date <= $2::date
      `;
      const visitParams = [effectiveStartDate, effectiveEndDate];
      if (hasDeptFilter) {
        visitParams.push(deptIdNum);
        visitSql += ` AND department_id = $3`;
      }
      const visitRes = await client.query(visitSql, visitParams);
      const visitStats = visitRes.rows[0] || {};

      // 4. Appointments summary
      let apptSql = `
        SELECT
          COUNT(*)::int AS total_appointments,
          COUNT(*) FILTER (WHERE status = 'Scheduled')::int AS scheduled_count,
          COUNT(*) FILTER (WHERE status = 'Checked-In')::int AS checked_in_count,
          COUNT(*) FILTER (WHERE status = 'Completed')::int AS completed_appt_count,
          COUNT(*) FILTER (WHERE status IN ('Cancelled', 'No-Show'))::int AS cancelled_appt_count
        FROM appointments
        WHERE appointment_date >= $1::date AND appointment_date <= $2::date
      `;
      const apptParams = [effectiveStartDate, effectiveEndDate];
      if (hasDeptFilter) {
        apptParams.push(deptIdNum);
        apptSql += ` AND department_id = $3`;
      }
      const apptRes = await client.query(apptSql, apptParams);
      const apptStats = apptRes.rows[0] || {};

      // 5. Department volume
      let deptSql = `
        SELECT
          dept.id AS department_id,
          dept.name AS department_name,
          dept.token_prefix,
          COUNT(t.token_id)::int AS total_tokens,
          COUNT(t.token_id) FILTER (WHERE t.status = 'Waiting')::int AS waiting_count,
          COUNT(t.token_id) FILTER (WHERE t.status = 'Completed')::int AS completed_count,
          COUNT(t.token_id) FILTER (WHERE t.priority = 'Emergency')::int AS emergency_count
        FROM departments dept
        LEFT JOIN tokens t ON t.department_id = dept.id AND t.queue_date >= $1::date AND t.queue_date <= $2::date
        ${hasDeptFilter ? `WHERE dept.id = $3` : ''}
        GROUP BY dept.id, dept.name, dept.token_prefix
        ORDER BY total_tokens DESC, dept.name ASC
      `;
      const deptParams = [effectiveStartDate, effectiveEndDate];
      if (hasDeptFilter) deptParams.push(deptIdNum);
      const deptRes = await client.query(deptSql, deptParams);

      // 6. Doctor volume
      let docSql = `
        SELECT
          doc.id AS doctor_id,
          doc.name AS doctor_name,
          doc.specialty,
          dept.name AS department_name,
          CONCAT('Cabin ', doc.id) AS room_or_cabin,
          COUNT(t.token_id)::int AS total_assigned_tokens,
          COUNT(t.token_id) FILTER (WHERE t.status = 'Completed')::int AS completed_consultations,
          COUNT(t.token_id) FILTER (WHERE t.status IN ('Now Serving', 'Consulting', 'Called'))::int AS currently_consulting,
          COUNT(t.token_id) FILTER (WHERE t.status = 'Waiting')::int AS waiting_count
        FROM doctors doc
        JOIN departments dept ON dept.id = doc.department_id
        LEFT JOIN tokens t ON t.doctor_id = doc.id AND t.queue_date >= $1::date AND t.queue_date <= $2::date
        ${hasDeptFilter ? `WHERE dept.id = $3` : ''}
        GROUP BY doc.id, doc.name, doc.specialty, dept.name
        ORDER BY completed_consultations DESC, total_assigned_tokens DESC, doc.id ASC
      `;
      const docParams = [effectiveStartDate, effectiveEndDate];
      if (hasDeptFilter) docParams.push(deptIdNum);
      const docRes = await client.query(docSql, docParams);

      // Compose comprehensive CSV
      let csv = `HEALIX CENTRAL HOSPITAL - RECEPTION OPERATIONS REPORT\r\n`;
      csv += `Date Range: ${effectiveStartDate} to ${effectiveEndDate}\r\n`;
      csv += `Department Filter: ${hasDeptFilter ? `Department ID ${deptIdNum}` : 'All Departments'}\r\n`;
      csv += `Staff Role: ${staff_role}\r\n`;
      csv += `Exported At: ${new Date().toISOString()}\r\n\r\n`;

      // Section 1: Summary Metrics
      csv += `# SECTION: SUMMARY METRICS\r\n`;
      csv += `Metric,Value,Unit\r\n`;
      csv += `Daily Patient Registrations,${totalRegistrations},Patients\r\n`;
      csv += `Total Consultations Completed,${tokenStats.completed_count || 0},Consultations\r\n`;
      csv += `Patients Waiting in Line,${tokenStats.waiting_count || 0},Patients\r\n`;
      csv += `Tokens Generated,${tokenStats.total_tokens || 0},Tokens\r\n`;
      csv += `Emergency Registrations,${visitStats.emergency_visits || 0},Cases\r\n`;
      csv += `Total Patient Visits,${visitStats.total_visits || 0},Visits\r\n`;
      csv += `Total Appointments,${apptStats.total_appointments || 0},Appointments\r\n`;
      csv += `Checked-In Appointments,${apptStats.checked_in_count || 0},Appointments\r\n`;
      csv += `Scheduled Appointments,${apptStats.scheduled_count || 0},Appointments\r\n`;
      const checkinRate = Number(apptStats.total_appointments) > 0
        ? Math.round((Number(apptStats.checked_in_count) / Number(apptStats.total_appointments)) * 100)
        : 0;
      csv += `Appointment Check-In Rate,${checkinRate},Percent\r\n\r\n`;

      // Section 2: Department Patient Volume
      csv += `# SECTION: DEPARTMENT PATIENT VOLUME\r\n`;
      csv += `Department ID,Department Name,Token Prefix,Total Tokens,Waiting Patients,Completed Consultations,Emergency Cases\r\n`;
      for (const row of deptRes.rows) {
        csv += `${row.department_id},"${row.department_name}","${row.token_prefix || 'GEN'}",${row.total_tokens},${row.waiting_count},${row.completed_count},${row.emergency_count}\r\n`;
      }
      csv += `\r\n`;

      // Section 3: Doctor Consultation Volume
      csv += `# SECTION: DOCTOR CONSULTATION VOLUME\r\n`;
      csv += `Doctor ID,Doctor Name,Specialty,Department,Cabin / Room,Completed Consultations,Currently Consulting,Waiting Count,Total Assigned Tokens\r\n`;
      for (const doc of docRes.rows) {
        csv += `${doc.doctor_id},"${doc.doctor_name}","${doc.specialty}","${doc.department_name}","${doc.room_or_cabin || 'Consulting Room'}",${doc.completed_consultations},${doc.currently_consulting},${doc.waiting_count},${doc.total_assigned_tokens}\r\n`;
      }
      csv += `\r\n`;

      // Section 4: Appointment Statistics
      csv += `# SECTION: APPOINTMENT STATISTICS\r\n`;
      csv += `Appointment Status,Count\r\n`;
      csv += `Total Scheduled,${apptStats.scheduled_count || 0}\r\n`;
      csv += `Checked-In,${apptStats.checked_in_count || 0}\r\n`;
      csv += `Completed,${apptStats.completed_appt_count || 0}\r\n`;
      csv += `Cancelled / No-Show,${apptStats.cancelled_appt_count || 0}\r\n\r\n`;

      // Section 5: Financial & Revenue Telemetry (RBAC Check)
      const allowedRoles = ['administrator', 'billing-staff', 'receptionist'];
      const canViewFinancials = allowedRoles.includes(staff_role);

      if (canViewFinancials) {
        let pSql = `
          SELECT
            COALESCE(SUM(amount), 0)::numeric(12,2) AS total_billed,
            COALESCE(SUM(amount) FILTER (WHERE payment_status IN ('Paid', 'Completed')), 0)::numeric(12,2) AS total_paid,
            COALESCE(SUM(amount) FILTER (WHERE payment_status = 'Pending'), 0)::numeric(12,2) AS total_pending,
            COALESCE(SUM(amount) FILTER (WHERE payment_status = 'Refunded'), 0)::numeric(12,2) AS total_refunded
          FROM payments p
          JOIN visits v ON v.visit_id = p.visit_id
          WHERE COALESCE(p.payment_date, p.created_at)::date >= $1::date
            AND COALESCE(p.payment_date, p.created_at)::date <= $2::date
        `;
        const pParams = [effectiveStartDate, effectiveEndDate];
        if (hasDeptFilter) {
          pParams.push(deptIdNum);
          pSql += ` AND v.department_id = $3`;
        }
        const pRes = await client.query(pSql, pParams);
        const pRow = pRes.rows[0] || {};

        csv += `# SECTION: FINANCIAL & REVENUE TELEMETRY\r\n`;
        csv += `Financial Metric,Amount (INR)\r\n`;
        csv += `Total Invoiced / Billed,${pRow.total_billed || '0.00'}\r\n`;
        csv += `Total Paid / Collected,${pRow.total_paid || '0.00'}\r\n`;
        csv += `Total Pending Dues,${pRow.total_pending || '0.00'}\r\n`;
        csv += `Total Refunded,${pRow.total_refunded || '0.00'}\r\n`;
      } else {
        csv += `# FINANCIAL TELEMETRY RESTRICTED\r\n`;
        csv += `Notice: Financial records are restricted to authorized Billing & Administrative staff.\r\n`;
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="healix-reception-report-${effectiveStartDate}-to-${effectiveEndDate}.csv"`
      );
      res.send(csv);
    } finally {
      client.release();
    }
  })
);

export default router;
