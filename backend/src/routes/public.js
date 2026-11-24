import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Health check
router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const result = await query('SELECT NOW() AS server_time');
    res.json({
      status: 'ok',
      service: 'healix-api',
      database: 'connected',
      timestamp: result.rows[0].server_time,
    });
  })
);

// Hospital info (About, Mission & Vision, Contact)
router.get(
  '/hospital',
  asyncHandler(async (_req, res) => {
    const result = await query('SELECT * FROM hospital_info WHERE id = 1');
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hospital profile not found' });
    }
    res.json({ data: result.rows[0] });
  })
);

// Homepage aggregated data
router.get(
  '/home',
  asyncHandler(async (_req, res) => {
    const [hospitalRes, deptRes, docRes, srvRes, infraRes] = await Promise.all([
      query('SELECT * FROM hospital_info WHERE id = 1'),
      query(
        'SELECT slug, name, short_description, icon, floor_location, beds_allocated FROM departments ORDER BY display_order ASC LIMIT 6'
      ),
      query(
        `SELECT d.slug, d.name, d.title, d.specialty, d.department_slug, dep.name AS department_name,
                d.qualification, d.experience_years, d.consultation_days, d.consultation_hours,
                d.avatar_initials, d.accent_tone
         FROM doctors d
         JOIN departments dep ON dep.slug = d.department_slug
         WHERE d.is_featured = TRUE
         ORDER BY d.display_order ASC
         LIMIT 4`
      ),
      query(
        `SELECT s.slug, s.name, s.category, s.department_slug, dep.name AS department_name,
                s.short_description, s.duration_estimate, s.availability
         FROM services s
         JOIN departments dep ON dep.slug = s.department_slug
         WHERE s.is_featured = TRUE
         ORDER BY s.display_order ASC
         LIMIT 4`
      ),
      query(
        'SELECT id, title, category, metric_value, metric_label FROM infrastructure_items ORDER BY display_order ASC LIMIT 4'
      ),
    ]);

    res.json({
      data: {
        hospital: hospitalRes.rows[0] || null,
        departments: deptRes.rows,
        featuredDoctors: docRes.rows,
        featuredServices: srvRes.rows,
        infrastructureHighlights: infraRes.rows,
      },
    });
  })
);

// Infrastructure
router.get(
  '/infrastructure',
  asyncHandler(async (_req, res) => {
    const result = await query(
      'SELECT * FROM infrastructure_items ORDER BY display_order ASC'
    );
    res.json({ data: result.rows });
  })
);

// Gallery
router.get(
  '/gallery',
  asyncHandler(async (req, res) => {
    const { category } = req.query;
    const params = [];
    let sql = 'SELECT * FROM gallery_items';
    if (category && category !== 'All') {
      params.push(category);
      sql += ' WHERE category = $1';
    }
    sql += ' ORDER BY display_order ASC';
    const result = await query(sql, params);
    res.json({ data: result.rows });
  })
);

// Doctors directory
router.get(
  '/doctors',
  asyncHandler(async (req, res) => {
    const { department, search } = req.query;
    const conditions = [];
    const params = [];

    if (department && department !== 'all') {
      params.push(department);
      conditions.push(`d.department_slug = $${params.length}`);
    }

    if (search && String(search).trim()) {
      params.push(`%${String(search).trim()}%`);
      conditions.push(
        `(d.name ILIKE $${params.length} OR d.specialty ILIKE $${params.length} OR d.title ILIKE $${params.length})`
      );
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(
      `SELECT d.*, dep.name AS department_name
       FROM doctors d
       JOIN departments dep ON dep.slug = d.department_slug
       ${whereClause}
       ORDER BY d.display_order ASC`,
      params
    );
    res.json({ data: result.rows });
  })
);

// Doctor profile by slug
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
    const [relatedRes, servicesRes] = await Promise.all([
      query(
        `SELECT slug, name, title, specialty, qualification, avatar_initials, accent_tone
         FROM doctors
         WHERE department_slug = $1 AND slug <> $2
         ORDER BY display_order ASC
         LIMIT 3`,
        [doctor.department_slug, slug]
      ),
      query(
        `SELECT slug, name, category, short_description, duration_estimate
         FROM services
         WHERE department_slug = $1
         ORDER BY display_order ASC`,
        [doctor.department_slug]
      ),
    ]);

    res.json({
      data: {
        ...doctor,
        relatedDoctors: relatedRes.rows,
        departmentServices: servicesRes.rows,
      },
    });
  })
);

// Departments directory
router.get(
  '/departments',
  asyncHandler(async (_req, res) => {
    const result = await query(
      `SELECT dep.*,
              (SELECT COUNT(*)::int FROM doctors d WHERE d.department_slug = dep.slug) AS doctor_count,
              (SELECT COUNT(*)::int FROM services s WHERE s.department_slug = dep.slug) AS service_count
       FROM departments dep
       ORDER BY dep.display_order ASC`
    );
    res.json({ data: result.rows });
  })
);

// Department details by slug
router.get(
  '/departments/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const deptRes = await query('SELECT * FROM departments WHERE slug = $1', [slug]);
    if (deptRes.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const [doctorsRes, servicesRes] = await Promise.all([
      query(
        `SELECT slug, name, title, specialty, qualification, experience_years,
                consultation_days, consultation_hours, avatar_initials, accent_tone
         FROM doctors
         WHERE department_slug = $1
         ORDER BY display_order ASC`,
        [slug]
      ),
      query(
        `SELECT slug, name, category, short_description, duration_estimate, availability
         FROM services
         WHERE department_slug = $1
         ORDER BY display_order ASC`,
        [slug]
      ),
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

// Medical services directory
router.get(
  '/services',
  asyncHandler(async (req, res) => {
    const { category, department } = req.query;
    const conditions = [];
    const params = [];

    if (category && category !== 'All') {
      params.push(category);
      conditions.push(`s.category = $${params.length}`);
    }
    if (department && department !== 'all') {
      params.push(department);
      conditions.push(`s.department_slug = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(
      `SELECT s.*, dep.name AS department_name
       FROM services s
       JOIN departments dep ON dep.slug = s.department_slug
       ${whereClause}
       ORDER BY s.display_order ASC`,
      params
    );
    res.json({ data: result.rows });
  })
);

// Service details by slug
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

    const service = srvRes.rows[0];
    const [doctorsRes, otherServicesRes] = await Promise.all([
      query(
        `SELECT slug, name, title, specialty, qualification, avatar_initials, accent_tone
         FROM doctors
         WHERE department_slug = $1
         ORDER BY display_order ASC`,
        [service.department_slug]
      ),
      query(
        `SELECT slug, name, category, short_description
         FROM services
         WHERE slug <> $1
         ORDER BY display_order ASC
         LIMIT 3`,
        [slug]
      ),
    ]);

    res.json({
      data: {
        ...service,
        specialists: doctorsRes.rows,
        relatedServices: otherServicesRes.rows,
      },
    });
  })
);

// Facilities
router.get(
  '/facilities',
  asyncHandler(async (req, res) => {
    const { category } = req.query;
    const params = [];
    let sql = 'SELECT * FROM facilities';
    if (category && category !== 'All') {
      params.push(category);
      sql += ' WHERE category = $1';
    }
    sql += ' ORDER BY display_order ASC';
    const result = await query(sql, params);
    res.json({ data: result.rows });
  })
);

// Facility details by slug
router.get(
  '/facilities/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    try {
      const result = await query('SELECT * FROM facilities WHERE slug = $1', [slug]);
      if (result.rows.length > 0) {
        return res.json({ data: result.rows[0] });
      }
    } catch {
      // If slug column is not present or query fails, try numeric id
    }
    if (/^\d+$/.test(slug)) {
      const idResult = await query('SELECT * FROM facilities WHERE id = $1', [parseInt(slug, 10)]);
      if (idResult.rows.length > 0) {
        return res.json({ data: idResult.rows[0] });
      }
    }
    res.status(404).json({ error: 'Facility not found' });
  })
);

// Visiting hours & timings
router.get(
  '/visiting-hours',
  asyncHandler(async (_req, res) => {
    const [hoursRes, hospitalRes] = await Promise.all([
      query('SELECT * FROM visiting_hours ORDER BY display_order ASC'),
      query('SELECT phone, emergency_phone, address, email FROM hospital_info WHERE id = 1'),
    ]);
    res.json({
      data: {
        schedules: hoursRes.rows,
        contact: hospitalRes.rows[0] || null,
      },
    });
  })
);

// Emergency information
router.get(
  '/emergency',
  asyncHandler(async (_req, res) => {
    const [protocolsRes, hospitalRes, deptRes] = await Promise.all([
      query('SELECT * FROM emergency_protocols ORDER BY display_order ASC'),
      query(
        'SELECT name, phone, emergency_phone, ambulance_phone, address FROM hospital_info WHERE id = 1'
      ),
      query("SELECT * FROM departments WHERE slug = 'emergency-critical-care'"),
    ]);

    res.json({
      data: {
        contact: hospitalRes.rows[0] || null,
        department: deptRes.rows[0] || null,
        protocols: protocolsRes.rows,
      },
    });
  })
);

export default router;
