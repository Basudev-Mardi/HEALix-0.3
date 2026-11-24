import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Load content from JSON file (or fallback to empty collections)
function loadSupportContent() {
  try {
    const dataPath = path.resolve(__dirname, '../../database/data/support-content.json');
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }
    const altPath = path.resolve(__dirname, '../../../frontend/my-app/lib/content/support-content.json');
    if (fs.existsSync(altPath)) {
      return JSON.parse(fs.readFileSync(altPath, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading support content JSON:', err);
  }
  return { articles: [], packages: [], insurancePartners: [], faqs: [], jobs: [] };
}

const content = loadSupportContent();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 36. Health Blog / Library
router.get('/articles', (req, res) => {
  const { category, search, tag } = req.query;
  let items = content.articles || [];

  if (category && category !== 'All') {
    items = items.filter((a) => a.category.toLowerCase() === String(category).toLowerCase());
  }

  if (tag) {
    items = items.filter((a) => a.tags?.some((t) => t.toLowerCase() === String(tag).toLowerCase()));
  }

  if (search && String(search).trim()) {
    const q = String(search).toLowerCase();
    items = items.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }

  res.json({ data: items });
});

// 37. Article Details
router.get('/articles/:slug', (req, res) => {
  const { slug } = req.params;
  const article = (content.articles || []).find((a) => a.slug === slug);
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }

  const related = (content.articles || [])
    .filter((a) => a.slug !== slug && (a.category === article.category || a.is_featured))
    .slice(0, 3);

  res.json({ data: { ...article, related } });
});

// 38. Health Packages
router.get('/packages', (req, res) => {
  const { category, tier } = req.query;
  let items = content.packages || [];

  if (category && category !== 'All') {
    items = items.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
  }
  if (tier && tier !== 'All') {
    items = items.filter((p) => p.tier.toLowerCase() === String(tier).toLowerCase());
  }

  res.json({ data: items });
});

// 39. Package Details
router.get('/packages/:slug', (req, res) => {
  const { slug } = req.params;
  const pkg = (content.packages || []).find((p) => p.slug === slug);
  if (!pkg) {
    return res.status(404).json({ error: 'Health package not found' });
  }

  const otherPackages = (content.packages || [])
    .filter((p) => p.slug !== slug)
    .slice(0, 3);

  res.json({ data: { ...pkg, otherPackages } });
});

// Package Booking & Coordinator Enquiry Submission
router.post(
  '/packages/enquiry',
  asyncHandler(async (req, res) => {
    const {
      name,
      email,
      phone = '',
      package_slug = '',
      package_name = '',
      preferred_date = '',
      questions = '',
    } = req.body || {};

    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ error: 'Full name and email are required to submit an enquiry.' });
    }

    const subject = `Package Enquiry: ${package_name || package_slug || 'Preventive Screening'}`;
    const message = [
      `Package: ${package_name || package_slug}`,
      preferred_date ? `Preferred Date: ${preferred_date}` : null,
      questions ? `Questions / Clinical Notes: ${questions}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const result = await query(
      `INSERT INTO contact_inquiries (name, email, phone, department, subject, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        name.trim(),
        email.trim(),
        phone.trim(),
        'Preventive Healthcare',
        subject.trim(),
        message.trim() || 'Request for preventive health package scheduling guidance.',
      ]
    );

    res.status(201).json({
      data: {
        message:
          'Your package enquiry has been received. Please note that package date and slot availability are provisional until officially confirmed by authorized hospital personnel.',
        inquiry_id: result.rows[0].id,
      },
    });
  })
);

// 40. Insurance & TPA Partners
router.get('/insurance', (_req, res) => {
  res.json({ data: content.insurancePartners || [] });
});

// 42. FAQs
router.get('/faqs', (req, res) => {
  const { category, search } = req.query;
  let items = content.faqs || [];

  if (category && category !== 'All') {
    items = items.filter((f) => f.category.toLowerCase() === String(category).toLowerCase());
  }

  if (search && String(search).trim()) {
    const q = String(search).toLowerCase();
    items = items.filter(
      (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    );
  }

  res.json({ data: items });
});

// 44. Careers / Job Openings
router.get('/jobs', (req, res) => {
  const { department, type } = req.query;
  let items = content.jobs || [];

  if (department && department !== 'All') {
    items = items.filter((j) => j.department.toLowerCase() === String(department).toLowerCase());
  }
  if (type && type !== 'All') {
    items = items.filter((j) => j.employment_type.toLowerCase() === String(type).toLowerCase());
  }

  res.json({ data: items });
});

// 41. Contact Us Inquiry Submission
router.post(
  '/contact',
  asyncHandler(async (req, res) => {
    const { name, email, phone = '', department = '', subject, message } = req.body || {};

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Name, email, subject, and message are required.' });
    }

    const result = await query(
      `INSERT INTO contact_inquiries (name, email, phone, department, subject, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name.trim(), email.trim(), phone.trim(), department.trim(), subject.trim(), message.trim()]
    );

    res.status(201).json({
      data: {
        message: 'Thank you for reaching out. A Healix patient coordinator will respond within 24 hours.',
        inquiry_id: result.rows[0].id,
      },
    });
  })
);

// 43. Patient Feedback Submission
router.post(
  '/feedback',
  asyncHandler(async (req, res) => {
    const {
      full_name,
      email,
      phone = '',
      department_visited = '',
      overall_rating = 5,
      doctor_care_rating = 5,
      cleanliness_rating = 5,
      staff_courtesy_rating = 5,
      comments,
      would_recommend = true,
    } = req.body || {};

    if (!full_name?.trim() || !email?.trim() || !comments?.trim()) {
      return res.status(400).json({ error: 'Name, email, and comments are required.' });
    }

    const result = await query(
      `INSERT INTO patient_feedbacks (
        full_name, email, phone, department_visited, overall_rating,
        doctor_care_rating, cleanliness_rating, staff_courtesy_rating, comments, would_recommend
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        full_name.trim(),
        email.trim(),
        phone.trim(),
        department_visited.trim(),
        Math.min(5, Math.max(1, Number(overall_rating) || 5)),
        Math.min(5, Math.max(1, Number(doctor_care_rating) || 5)),
        Math.min(5, Math.max(1, Number(cleanliness_rating) || 5)),
        Math.min(5, Math.max(1, Number(staff_courtesy_rating) || 5)),
        comments.trim(),
        Boolean(would_recommend),
      ]
    );

    res.status(201).json({
      data: {
        message: 'Thank you for your valuable feedback. Our Quality & Patient Experience Committee reviews every submission.',
        feedback_id: result.rows[0].id,
      },
    });
  })
);

export default router;
