import { Router } from 'express';
import { query } from '../db.js';
import {
  generateMrn,
  generateToken,
  hashPassword,
  requirePatientAuth,
  sanitizePatient,
  verifyPassword,
} from '../utils/auth.js';

const router = Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Patient Registration
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { full_name, email, password, phone = '', date_of_birth = null, gender = '' } =
      req.body || {};

    if (!full_name?.trim() || !email?.trim() || !password || password.length < 8) {
      return res.status(400).json({
        error: 'Full name, valid email, and a password of at least 8 characters are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await query('SELECT id FROM patient_accounts WHERE LOWER(email) = $1', [
      normalizedEmail,
    ]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'An account with this email already exists. Please sign in instead.',
      });
    }

    const mrn = generateMrn();
    const passwordHash = hashPassword(password);

    const insertRes = await query(
      `INSERT INTO patient_accounts (mrn, full_name, email, password_hash, phone, date_of_birth, gender)
       VALUES ($1, $2, $3, $4, $5, $6::date, $7)
       RETURNING *`,
      [
        mrn,
        full_name.trim(),
        normalizedEmail,
        passwordHash,
        phone.trim(),
        date_of_birth || null,
        gender || '',
      ]
    );

    const patient = sanitizePatient(insertRes.rows[0]);

    // Welcome notification
    await query(
      `INSERT INTO portal_notifications (patient_id, category, title, message, action_href)
       VALUES ($1, 'Account', 'Welcome to Healix Patient Portal', 'Your medical record number is ' || $2 || '. Complete your profile or book your first consultation anytime.', '/patient/profile')`,
      [patient.id, patient.mrn]
    );

    const token = generateToken();
    await query(
      `INSERT INTO patient_sessions (patient_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [patient.id, token]
    );

    res.status(201).json({ data: { token, patient } });
  })
);

// Patient Login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userRes = await query('SELECT * FROM patient_accounts WHERE LOWER(email) = $1', [
      normalizedEmail,
    ]);

    if (userRes.rows.length === 0 || !verifyPassword(password, userRes.rows[0].password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const patient = sanitizePatient(userRes.rows[0]);
    const token = generateToken();

    await query(
      `INSERT INTO patient_sessions (patient_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [patient.id, token]
    );

    res.json({ data: { token, patient } });
  })
);

// Current authenticated patient
router.get('/me', requirePatientAuth, (req, res) => {
  res.json({ data: { patient: req.patient } });
});

// Logout
router.post(
  '/logout',
  requirePatientAuth,
  asyncHandler(async (req, res) => {
    await query('DELETE FROM patient_sessions WHERE token = $1', [req.sessionToken]);
    res.json({ data: { loggedOut: true } });
  })
);

// Forgot Password — generates a real time-limited reset token
router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = req.body || {};
    if (!email?.trim()) {
      return res.status(400).json({ error: 'Please enter your registered email address.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userRes = await query('SELECT id, email FROM patient_accounts WHERE LOWER(email) = $1', [
      normalizedEmail,
    ]);

    let resetToken = null;
    if (userRes.rows.length > 0) {
      resetToken = generateToken(20);
      await query(
        `INSERT INTO password_reset_tokens (patient_id, token, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
        [userRes.rows[0].id, resetToken]
      );
    }

    res.json({
      data: {
        message:
          'If an account matches that email, a password reset link has been generated (valid for 1 hour).',
        // Returned in development/demo so the user can test /reset-password immediately without SMTP
        demo_reset_token: resetToken,
      },
    });
  })
);

// Reset Password
router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const { token, new_password } = req.body || {};
    if (!token?.trim() || !new_password || new_password.length < 8) {
      return res.status(400).json({
        error: 'A valid reset token and a new password (at least 8 characters) are required.',
      });
    }

    const tokenRes = await query(
      `SELECT * FROM password_reset_tokens
       WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
      [token.trim()]
    );

    if (tokenRes.rows.length === 0) {
      return res.status(400).json({ error: 'Reset link is invalid or has expired.' });
    }

    const record = tokenRes.rows[0];
    const newHash = hashPassword(new_password);

    await query('UPDATE patient_accounts SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
      newHash,
      record.patient_id,
    ]);
    await query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [record.id]);
    await query('DELETE FROM patient_sessions WHERE patient_id = $1', [record.patient_id]);

    res.json({ data: { message: 'Password updated successfully. You may now sign in.' } });
  })
);

export default router;
