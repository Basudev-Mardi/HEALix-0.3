import { Router } from 'express';
import { requirePatientAuth } from '../utils/auth.js';
import authRoutes from './auth.js';
import patientRoutes from './patient.js';
import appointmentRoutes from './appointments.js';
import supportRoutes from './support.js';
import publicRoutes from './public.js';
import { query } from '../db.js';

const router = Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 1. Authentication module: /api/v1/auth/*
router.use('/auth', authRoutes);

// 2. Patient Account & Profile module (Authenticated): /api/v1/patients/*
router.use('/patients', patientRoutes);

// 3. Appointments module: /api/v1/appointments/*
// Public booking, tracking, & slots, plus authenticated patient management
router.use('/appointments', appointmentRoutes);

// 4. Doctors module: /api/v1/doctors/*
router.get(
  '/doctors',
  asyncHandler(async (req, res) => {
    const { department, search, featured } = req.query;
    let sql = `
      SELECT d.id, d.slug, d.name, d.title, d.specialty, d.department_slug, dep.name AS department_name,
             dep.floor_location AS department_floor, dep.phone_ext AS department_phone,
             d.qualification, d.experience_years, d.languages, d.bio, d.consultation_days,
             d.consultation_hours, d.consultation_fee, d.avatar_initials, d.accent_tone, d.is_featured
      FROM doctors d
      JOIN departments dep ON dep.slug = d.department_slug
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (department && department !== 'all') {
      sql += ` AND d.department_slug = $${idx++}`;
      params.push(department);
    }
    if (featured === 'true') {
      sql += ` AND d.is_featured = TRUE`;
    }
    if (search) {
      sql += ` AND (LOWER(d.name) LIKE $${idx} OR LOWER(d.specialty) LIKE $${idx} OR LOWER(d.qualification) LIKE $${idx})`;
      params.push(`%${search.toLowerCase()}%`);
      idx++;
    }
    sql += ` ORDER BY d.display_order ASC, d.experience_years DESC`;
    const result = await query(sql, params);
    res.json({ data: result.rows });
  })
);

router.get(
  '/doctors/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const docRes = await query(
      `SELECT d.*, dep.name AS department_name, dep.floor_location AS department_floor, dep.phone_ext AS department_phone
       FROM doctors d
       JOIN departments dep ON dep.slug = d.department_slug
       WHERE d.slug = $1`,
      [slug]
    );
    if (docRes.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    const doctor = docRes.rows[0];
    res.json({ data: doctor });
  })
);

// 5. Departments module: /api/v1/departments/*
router.get(
  '/departments',
  asyncHandler(async (_req, res) => {
    const result = await query(
      `SELECT d.*, 
              (SELECT COUNT(*) FROM doctors doc WHERE doc.department_slug = d.slug) AS doctor_count,
              (SELECT COUNT(*) FROM services srv WHERE srv.department_slug = d.slug) AS service_count
       FROM departments d
       ORDER BY d.display_order ASC`
    );
    res.json({ data: result.rows });
  })
);

router.get(
  '/departments/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const deptRes = await query('SELECT * FROM departments WHERE slug = $1', [slug]);
    if (deptRes.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    const [doctorsRes, servicesRes] = await Promise.all([
      query('SELECT * FROM doctors WHERE department_slug = $1 ORDER BY display_order ASC', [slug]),
      query('SELECT * FROM services WHERE department_slug = $1 ORDER BY display_order ASC', [slug]),
    ]);
    res.json({
      data: {
        ...deptRes.rows[0],
        doctors: doctorsRes.rows,
        services: servicesRes.rows,
      },
    });
  })
);

// 6. Services module: /api/v1/services/*
router.get(
  '/services',
  asyncHandler(async (_req, res) => {
    const result = await query(
      `SELECT s.*, dep.name AS department_name, dep.floor_location AS department_floor, dep.phone_ext AS department_phone
       FROM services s
       JOIN departments dep ON dep.slug = s.department_slug
       ORDER BY s.display_order ASC`
    );
    res.json({ data: result.rows });
  })
);

router.get(
  '/services/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const srvRes = await query(
      `SELECT s.*, dep.name AS department_name, dep.floor_location AS department_floor, dep.phone_ext AS department_phone
       FROM services s
       JOIN departments dep ON dep.slug = s.department_slug
       WHERE s.slug = $1`,
      [slug]
    );
    if (srvRes.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json({ data: srvRes.rows[0] });
  })
);

// 7. Facilities module: /api/v1/facilities/*
router.get(
  '/facilities',
  asyncHandler(async (_req, res) => {
    const result = await query('SELECT * FROM facilities ORDER BY display_order ASC');
    res.json({ data: result.rows });
  })
);

router.get(
  '/facilities/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const result = await query('SELECT * FROM facilities WHERE slug = $1', [slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    res.json({ data: result.rows[0] });
  })
);

// 8. Schedules & Slots module: /api/v1/schedules/*
router.get(
  '/schedules/slots',
  asyncHandler(async (req, res) => {
    const { doctor_slug, date } = req.query;
    if (!doctor_slug || !date) {
      return res.status(400).json({ error: 'doctor_slug and date are required' });
    }
    // Return doctor slots and calculate live availability
    const bookedRes = await query(
      `SELECT time_slot FROM appointments
       WHERE doctor_slug = $1 AND appointment_date = $2 AND status != 'Cancelled'`,
      [doctor_slug, date]
    );
    const bookedSlots = new Set(bookedRes.rows.map((r) => r.time_slot));

    const allSlots = [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
    ];

    const slots = allSlots.map((slot) => ({
      time: slot,
      available: !bookedSlots.has(slot),
    }));

    res.json({ data: { date, doctor_slug, slots } });
  })
);

// 9. Protected Medical Records: /api/v1/medical-records/* (Authenticated Patient Only)
router.get(
  '/medical-records',
  requirePatientAuth,
  asyncHandler(async (req, res) => {
    const { email } = req.patient;
    const [labs, radiology] = await Promise.all([
      query(
        `SELECT * FROM patient_lab_reports 
         WHERE LOWER(patient_email) = LOWER($1) AND status IN ('Finalized', 'Released')
         ORDER BY collected_date DESC`,
        [email]
      ),
      query(
        `SELECT * FROM patient_radiology_reports
         WHERE LOWER(patient_email) = LOWER($1) AND status IN ('Finalized', 'Released')
         ORDER BY study_date DESC`,
        [email]
      ),
    ]);
    res.json({
      data: {
        laboratory: labs.rows,
        radiology: radiology.rows,
      },
    });
  })
);

// 10. Protected Prescriptions: /api/v1/prescriptions/* (Authenticated Patient Only)
router.get(
  '/prescriptions',
  requirePatientAuth,
  asyncHandler(async (req, res) => {
    const { email } = req.patient;
    const result = await query(
      `SELECT * FROM patient_prescriptions 
       WHERE LOWER(patient_email) = LOWER($1)
       ORDER BY issued_date DESC`,
      [email]
    );
    res.json({ data: result.rows });
  })
);

// 11. Protected Laboratory: /api/v1/lab-reports/* (Authenticated Patient Only)
router.get(
  '/lab-reports',
  requirePatientAuth,
  asyncHandler(async (req, res) => {
    const { email } = req.patient;
    const result = await query(
      `SELECT * FROM patient_lab_reports 
       WHERE LOWER(patient_email) = LOWER($1) AND status IN ('Finalized', 'Released')
       ORDER BY collected_date DESC`,
      [email]
    );
    res.json({ data: result.rows });
  })
);

// 12. Protected Radiology: /api/v1/radiology-reports/* (Authenticated Patient Only)
router.get(
  '/radiology-reports',
  requirePatientAuth,
  asyncHandler(async (req, res) => {
    const { email } = req.patient;
    const result = await query(
      `SELECT * FROM patient_radiology_reports 
       WHERE LOWER(patient_email) = LOWER($1) AND status IN ('Finalized', 'Released')
       ORDER BY study_date DESC`,
      [email]
    );
    res.json({ data: result.rows });
  })
);

// 13. Protected Billing: /api/v1/billing/* (Authenticated Patient Only)
router.get(
  '/billing',
  requirePatientAuth,
  asyncHandler(async (req, res) => {
    const { email } = req.patient;
    const result = await query(
      `SELECT * FROM patient_bills 
       WHERE LOWER(patient_email) = LOWER($1)
       ORDER BY invoice_date DESC`,
      [email]
    );
    res.json({ data: result.rows });
  })
);

// 14. Health Library Articles: /api/v1/articles/*
router.get(
  '/articles',
  asyncHandler(async (_req, res) => {
    const result = await query(
      `SELECT slug, title, category, excerpt, author_name, author_title, author_doctor_slug,
              TO_CHAR(published_date, 'YYYY-MM-DD') AS published_date, read_minutes, tags, key_takeaways, is_featured
       FROM health_articles
       ORDER BY display_order ASC, published_date DESC`
    );
    res.json({ data: result.rows });
  })
);

router.get(
  '/articles/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const result = await query('SELECT * FROM health_articles WHERE slug = $1', [slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json({ data: result.rows[0] });
  })
);

// 15. Health Packages: /api/v1/packages/*
router.get(
  '/packages',
  asyncHandler(async (_req, res) => {
    const result = await query('SELECT * FROM health_packages ORDER BY display_order ASC');
    res.json({ data: result.rows });
  })
);

router.get(
  '/packages/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const result = await query('SELECT * FROM health_packages WHERE slug = $1', [slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }
    res.json({ data: result.rows[0] });
  })
);

// 16. Insurance & TPA: /api/v1/insurance/*
router.get(
  '/insurance',
  asyncHandler(async (_req, res) => {
    const [providers, tpas, guidelines] = await Promise.all([
      query('SELECT * FROM insurance_providers ORDER BY display_order ASC'),
      query('SELECT * FROM tpa_partners ORDER BY display_order ASC'),
      query('SELECT * FROM cashless_guidelines ORDER BY display_order ASC'),
    ]);
    res.json({
      data: {
        providers: providers.rows,
        tpas: tpas.rows,
        guidelines: guidelines.rows,
      },
    });
  })
);

// 17. Contact & Support Enquiries: /api/v1/contact/*
router.use('/contact', supportRoutes);

// 18. Notifications: /api/v1/notifications/* (Authenticated Patient)
router.get(
  '/notifications',
  requirePatientAuth,
  asyncHandler(async (req, res) => {
    const { id: patientId } = req.patient;
    const result = await query(
      `SELECT * FROM patient_notifications 
       WHERE patient_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [patientId]
    );
    res.json({ data: result.rows });
  })
);

// 19. Audit Logs: /api/v1/audit/* (Protected)
router.get(
  '/audit',
  requirePatientAuth,
  asyncHandler(async (req, res) => {
    const { id: patientId } = req.patient;
    const result = await query(
      `SELECT id, action, details, ip_address, created_at 
       FROM audit_logs 
       WHERE patient_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [patientId]
    );
    res.json({ data: result.rows });
  })
);

// Fallback to legacy public endpoints for backward compatibility
router.use('/', publicRoutes);

export default router;
