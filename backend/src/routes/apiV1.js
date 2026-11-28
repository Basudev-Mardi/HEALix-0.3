import { Router } from 'express';
import { requirePatientAuth } from '../utils/auth.js';
import authRoutes from './auth.js';
import patientRoutes from './patient.js';
import appointmentRoutes from './appointments.js';
import supportRoutes from './support.js';
import publicRoutes from './public.js';
import privacyRoutes from './privacy.js';
import integrationRoutes from './integrations.js';
import receptionRoutes from './reception.js';
import doctorRoutes from './doctor.js';
import nurseRoutes from './nurse.js';
import labRoutes from './lab.js';
import pharmacyRoutes from './pharmacy.js';
import { query } from '../db.js';

const router = Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 1. Authentication module: /api/v1/auth/*
router.use('/auth', authRoutes);

// Reception module: /api/v1/reception/*
router.use('/reception', receptionRoutes);

// Doctor clinical module: /api/v1/doctor/*
router.use('/doctor', doctorRoutes);

// Nurse clinical module: /api/v1/nurse/*
router.use('/nurse', nurseRoutes);

// Diagnostic laboratory module: /api/v1/lab/*
router.use('/lab', labRoutes);

// Central Pharmacy Dispensary & Inventory: /api/v1/pharmacy/*
router.use('/pharmacy', pharmacyRoutes);

// Hospital Settings & Institutional Information: /api/v1/hospital/settings
router.get(
  '/hospital/settings',
  asyncHandler(async (_req, res) => {
    const result = await query('SELECT * FROM hospital_settings WHERE id = 1');
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hospital settings not found' });
    }
    res.json({ data: result.rows[0] });
  })
);

// Hospital Branches: /api/v1/hospital/branches
router.get(
  '/hospital/branches',
  asyncHandler(async (_req, res) => {
    const result = await query(
      "SELECT * FROM hospital_branches WHERE status = 'active' ORDER BY is_main_campus DESC, id ASC"
    );
    res.json({ data: result.rows });
  })
);

// Hospital Gallery: /api/v1/hospital/gallery
router.get(
  '/hospital/gallery',
  asyncHandler(async (req, res) => {
    const { category } = req.query;
    let sql = 'SELECT * FROM hospital_gallery';
    const params = [];
    if (category && category !== 'All') {
      sql += ' WHERE category = $1';
      params.push(category);
    }
    sql += ' ORDER BY display_order ASC';
    const result = await query(sql, params);
    res.json({ data: result.rows });
  })
);

// Hospital Statistics: /api/v1/hospital/statistics
router.get(
  '/hospital/statistics',
  asyncHandler(async (_req, res) => {
    const result = await query('SELECT * FROM hospital_statistics ORDER BY display_order ASC');
    res.json({ data: result.rows });
  })
);

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

    // Fetch normalized sub-records
    const [qualRes, specRes, schedRes, leaveRes] = await Promise.all([
      query('SELECT qualification, institution, year_obtained FROM doctor_qualifications WHERE doctor_id = $1', [doctor.id]),
      query('SELECT specialization, is_primary FROM doctor_specializations WHERE doctor_id = $1', [doctor.id]),
      query('SELECT day, start_time, end_time, room_or_cabin FROM doctor_schedules WHERE doctor_id = $1 ORDER BY id ASC', [doctor.id]),
      query('SELECT start_date, end_date, reason FROM doctor_leaves WHERE doctor_id = $1 AND end_date >= CURRENT_DATE', [doctor.id]),
    ]);

    res.json({
      data: {
        ...doctor,
        qualifications: qualRes.rows,
        specializations: specRes.rows,
        schedules: schedRes.rows,
        leaves: leaveRes.rows,
      },
    });
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
  '/articles/categories',
  asyncHandler(async (_req, res) => {
    const result = await query('SELECT * FROM blog_categories ORDER BY display_order ASC, name ASC');
    res.json({ data: result.rows });
  })
);

router.get(
  '/articles',
  asyncHandler(async (req, res) => {
    const { category, search, status } = req.query;
    let sql = `
      SELECT a.id, a.slug, a.title, a.content, a.author, a.author_title, a.author_doctor_slug,
             c.name AS category_name, a.category_slug, a.excerpt, a.read_minutes, a.tags,
             a.key_takeaways, a.is_featured, a.status,
             TO_CHAR(a.published_at, 'YYYY-MM-DD') AS published_date
      FROM blog_articles a
      LEFT JOIN blog_categories c ON c.id = a.category_id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    const filterStatus = status || 'published';
    sql += ` AND a.status = $${idx++}`;
    params.push(filterStatus);

    if (category && category !== 'All') {
      sql += ` AND (a.category_slug = $${idx} OR LOWER(c.name) = LOWER($${idx}))`;
      params.push(category);
      idx++;
    }

    if (search) {
      sql += ` AND (LOWER(a.title) LIKE $${idx} OR LOWER(a.content) LIKE $${idx} OR LOWER(a.author) LIKE $${idx})`;
      params.push(`%${search.toLowerCase()}%`);
      idx++;
    }

    sql += ' ORDER BY a.is_featured DESC, a.published_at DESC';
    const result = await query(sql, params);

    // Fallback to health_articles if blog_articles empty
    if (result.rows.length === 0 && !search && (!category || category === 'All')) {
      const fallback = await query(
        `SELECT slug, title, category, excerpt, author_name, author_title, author_doctor_slug,
                TO_CHAR(published_date, 'YYYY-MM-DD') AS published_date, read_minutes, tags, key_takeaways, is_featured
         FROM health_articles
         ORDER BY display_order ASC, published_date DESC`
      );
      return res.json({ data: fallback.rows });
    }

    res.json({ data: result.rows });
  })
);

router.get(
  '/articles/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    let result = await query(
      `SELECT a.*, c.name AS category_name
       FROM blog_articles a
       LEFT JOIN blog_categories c ON c.id = a.category_id
       WHERE a.slug = $1`,
      [slug]
    );

    if (result.rows.length === 0) {
      // Check legacy table
      result = await query('SELECT * FROM health_articles WHERE slug = $1', [slug]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Article not found' });
      }
    }
    res.json({ data: result.rows[0] });
  })
);

// 15. Health Packages: /api/v1/packages/*
router.get(
  '/packages',
  asyncHandler(async (_req, res) => {
    const packagesRes = await query(
      "SELECT * FROM health_packages WHERE status = 'active' ORDER BY display_order ASC, id ASC"
    );
    const testsRes = await query('SELECT * FROM health_package_tests ORDER BY display_order ASC, id ASC');

    const testsByPackage = {};
    for (const test of testsRes.rows) {
      if (!testsByPackage[test.package_id]) {
        testsByPackage[test.package_id] = [];
      }
      testsByPackage[test.package_id].push(test.test_name);
    }

    const packagesWithTests = packagesRes.rows.map((pkg) => ({
      ...pkg,
      tests: testsByPackage[pkg.id] || pkg.tests_included || [],
    }));

    res.json({ data: packagesWithTests });
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
    const pkg = result.rows[0];
    const testsRes = await query(
      'SELECT * FROM health_package_tests WHERE package_id = $1 ORDER BY display_order ASC',
      [pkg.id]
    );
    res.json({ data: { ...pkg, tests: testsRes.rows.map((t) => t.test_name) } });
  })
);

// 16. Insurance & TPA: /api/v1/insurance/*
router.get(
  '/insurance',
  asyncHandler(async (_req, res) => {
    const [providers, tpas, guidelines] = await Promise.all([
      query("SELECT * FROM insurance_providers WHERE status = 'active' ORDER BY display_order ASC, id ASC"),
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

// FAQs: /api/v1/faqs
router.get(
  '/faqs',
  asyncHandler(async (req, res) => {
    const { category } = req.query;
    let sql = "SELECT * FROM faqs WHERE status = 'active'";
    const params = [];
    if (category && category !== 'All') {
      sql += ' AND LOWER(category) = LOWER($1)';
      params.push(category);
    }
    sql += ' ORDER BY display_order ASC, id ASC';
    const result = await query(sql, params);
    res.json({ data: result.rows });
  })
);

// 17. Contact & Support Enquiries: /api/v1/contact/*
router.post(
  '/contact/enquiries',
  asyncHandler(async (req, res) => {
    const { name, email, phone = '', subject, message, department = 'General Enquiries' } = req.body || {};
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Name, email, subject, and message are required.' });
    }
    const result = await query(
      `INSERT INTO enquiries (name, email, phone, subject, message, department)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name.trim(), email.trim(), phone.trim(), subject.trim(), message.trim(), department.trim()]
    );
    res.status(201).json({
      data: {
        message: 'Your enquiry has been received. A patient coordinator will respond shortly.',
        enquiry: result.rows[0],
      },
    });
  })
);

router.post(
  '/contact/feedback',
  asyncHandler(async (req, res) => {
    const {
      patient_id,
      patient_name,
      email,
      rating = 5,
      message,
      department_visited = '',
      doctor_care_rating = 5,
      cleanliness_rating = 5,
      staff_courtesy_rating = 5,
      would_recommend = true,
    } = req.body || {};

    if (!message?.trim() || (!patient_name?.trim() && !email?.trim())) {
      return res.status(400).json({ error: 'Patient identifier/email and message are required.' });
    }

    const ratingVal = Math.min(5, Math.max(1, Number(rating) || 5));
    const result = await query(
      `INSERT INTO feedback (
        patient_id, patient_name, email, rating, message, department_visited,
        doctor_care_rating, cleanliness_rating, staff_courtesy_rating, would_recommend
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        patient_id || null,
        patient_name || '',
        email || '',
        ratingVal,
        message.trim(),
        department_visited,
        Math.min(5, Math.max(1, Number(doctor_care_rating) || 5)),
        Math.min(5, Math.max(1, Number(cleanliness_rating) || 5)),
        Math.min(5, Math.max(1, Number(staff_courtesy_rating) || 5)),
        Boolean(would_recommend),
      ]
    );

    res.status(201).json({
      data: {
        message: 'Thank you for your feedback.',
        feedback: result.rows[0],
      },
    });
  })
);

router.use('/contact', supportRoutes);

// 18. Notifications: /api/v1/notifications/* (Authenticated Patient/User)
router.get(
  '/notifications',
  requirePatientAuth,
  asyncHandler(async (req, res) => {
    const patientAccount = req.patient;
    // Query both Section 8.F notifications table and legacy portal_notifications
    const result = await query(
      `SELECT n.id, n.title, n.message, n.category, n.action_href, n.read_at, n.created_at
       FROM notifications n
       LEFT JOIN patients p ON p.id = n.patient_id
       WHERE (n.patient_id = $1 OR n.patient_account_id = $2 OR LOWER(p.first_name || ' ' || p.last_name) = LOWER($3))
       ORDER BY n.created_at DESC 
       LIMIT 50`,
      [patientAccount.patient_id || '', patientAccount.id, patientAccount.full_name || '']
    );

    if (result.rows.length === 0) {
      const fallback = await query(
        `SELECT id, title, message, category, action_href, is_read, created_at
         FROM portal_notifications 
         WHERE patient_id = $1 
         ORDER BY created_at DESC 
         LIMIT 50`,
        [patientAccount.id]
      );
      return res.json({ data: fallback.rows });
    }

    res.json({ data: result.rows });
  })
);

// 19. Audit Logs: /api/v1/audit/* (Protected)
router.get(
  '/audit',
  requirePatientAuth,
  asyncHandler(async (req, res) => {
    const patientAccount = req.patient;
    const result = await query(
      `SELECT id, action, entity_type, entity_id, details, ip_address, created_at 
       FROM audit_logs 
       WHERE (patient_id = $1 OR patient_account_id = $2)
       ORDER BY created_at DESC 
       LIMIT 50`,
      [patientAccount.patient_id || 'HX-MRN-402819', patientAccount.id]
    );
    res.json({ data: result.rows });
  })
);

// 20. Privacy, Compliance & DPDP Act: /api/v1/privacy/*
router.use('/privacy', privacyRoutes);

// 21. External Integrations (Payments, Maps, Storage, Analytics): /api/v1/integrations/*
router.use('/integrations', integrationRoutes);

// Fallback to legacy public endpoints for backward compatibility
router.use('/', publicRoutes);

export default router;
