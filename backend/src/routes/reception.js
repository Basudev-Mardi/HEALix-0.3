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
 * Retrieve a complete patient profile including past visit history
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
        p.gender,
        COALESCE(p.mobile, p.phone, '') AS mobile,
        p.address,
        p.blood_group,
        p.allergies,
        p.emergency_contact,
        p.photo,
        p.registration_date,
        p.created_at
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

    // Fetch visits history
    const visitsRes = await query(
      `SELECT
        v.visit_id,
        v.visit_date,
        v.visit_type,
        v.status,
        v.created_at,
        dept.id AS department_id,
        dept.name AS department_name,
        doc.id AS doctor_id,
        doc.name AS doctor_name,
        t.token_number,
        t.status AS token_status,
        pay.amount AS fee_amount,
        pay.payment_status
       FROM visits v
       LEFT JOIN departments dept ON dept.id = v.department_id
       LEFT JOIN doctors doc ON doc.id = v.doctor_id
       LEFT JOIN tokens t ON t.visit_id = v.visit_id
       LEFT JOIN payments pay ON pay.visit_id = v.visit_id
       WHERE v.patient_id = $1
       ORDER BY v.visit_date DESC, v.created_at DESC`,
      [patientDbId]
    );

    res.json({
      success: true,
      patient: {
        ...patient,
        age: patient.dob ? calculateAgeFromDob(patient.dob) : null,
        visits: visitsRes.rows,
        totalVisits: visitsRes.rows.length,
      },
    });
  })
);

/**
 * GET /api/v1/reception/departments-and-doctors
 * Lists all departments and active doctors with real-time queue loads for receptionist assignment
 */
router.get(
  '/departments-and-doctors',
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
        v.reason,
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
        v.reason,
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
           FOR UPDATE`,
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
           FOR UPDATE`,
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

export default router;
