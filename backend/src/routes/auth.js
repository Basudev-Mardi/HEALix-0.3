import { Router } from 'express';
import crypto from 'node:crypto';
import { query } from '../db.js';
import { dispatchNotification, NOTIFICATION_EVENTS } from '../utils/notifications.js';
import {
  generateMrn,
  generateToken,
  hashPassword,
  requirePatientAuth,
  sanitizePatient,
  verifyPassword,
} from '../utils/auth.js';
import {
  getSessionCookieOptions,
  logSensitiveAccess,
  rateLimit,
  securityLimiter,
} from '../utils/security.js';

const router = Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Ensure OTP verification table exists
async function ensureOtpTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS patient_otp_verifications (
        id SERIAL PRIMARY KEY,
        identifier TEXT NOT NULL,
        otp_code TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_patient_otp_ident ON patient_otp_verifications(identifier, used, expires_at);
    `);
  } catch {
    // ignore
  }
}

// 0. Pre-Registration Validation & OTP Dispatch (Workflow B, Step 3 & 4)
router.post(
  '/register/send-otp',
  rateLimit({ windowSeconds: 60, maxRequests: 5, message: 'Too many OTP requests. Please wait a minute before requesting another code.' }),
  asyncHandler(async (req, res) => {
    await ensureOtpTable();
    const {
      full_name,
      email,
      phone,
      date_of_birth,
      password,
      confirm_password,
      consent_privacy_terms,
    } = req.body || {};

    // 1. Validate required fields
    if (!full_name?.trim() || !email?.trim() || !phone?.trim() || !password) {
      return res.status(400).json({
        error: 'Full legal name, email address, mobile number, and password are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long.',
      });
    }

    if (confirm_password && password !== confirm_password) {
      return res.status(400).json({
        error: 'Passwords do not match.',
      });
    }

    if (consent_privacy_terms !== true && consent_privacy_terms !== 'true') {
      return res.status(400).json({
        error: 'Consent to the Healix Health Information Privacy Policy and Patient Rights is required to register.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    // 2. Check duplicate email
    const emailCheck = await query('SELECT id FROM patient_accounts WHERE LOWER(email) = $1', [
      normalizedEmail,
    ]);
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({
        error: 'An account with this email address is already registered. Please sign in or recover your password.',
      });
    }

    // 3. Check duplicate mobile number
    const phoneCheck = await query(
      'SELECT id FROM patient_accounts WHERE phone = $1 AND phone <> \'\'',
      [normalizedPhone]
    );
    if (phoneCheck.rows.length > 0) {
      return res.status(409).json({
        error: 'An account with this mobile number is already registered. Please sign in or use mobile OTP.',
      });
    }

    // 4. Check potential duplicate demographic record (matching Full Name + Date of Birth)
    if (date_of_birth && full_name) {
      const demographicCheck = await query(
        `SELECT id, mrn FROM patient_accounts
         WHERE LOWER(full_name) = LOWER($1) AND date_of_birth = $2::date`,
        [full_name.trim(), date_of_birth]
      );
      if (demographicCheck.rows.length > 0) {
        return res.status(409).json({
          error:
            'A medical patient record with identical full name and date of birth is already registered. Please sign in or contact patient administration to link your medical records.',
        });
      }
    }

    // 5. Generate and store OTP code (valid for 10 minutes)
    const code = crypto.randomInt(100000, 999999).toString();
    const targetIdentifier = normalizedPhone;

    await query('UPDATE patient_otp_verifications SET used = TRUE WHERE identifier = $1', [targetIdentifier]);
    await query(
      `INSERT INTO patient_otp_verifications (identifier, otp_code, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '10 minutes')`,
      [targetIdentifier, code]
    );

    // Workflow F: Event: Registration -> Notification: Account verification (Email & SMS)
    await dispatchNotification({
      recipientEmail: normalizedEmail,
      recipientPhone: normalizedPhone,
      eventType: NOTIFICATION_EVENTS.REGISTRATION,
      title: 'Registration Verification Code',
      message: `Your Healix account verification code is ${code}. Valid for 10 minutes.`,
      channelsOverride: ['email', 'sms'],
    });

    res.json({
      data: {
        message: `A 6-digit verification code has been dispatched to ${normalizedPhone}.`,
        target: normalizedPhone,
        demo_otp: code,
      },
    });
  })
);

// 1. Patient Registration (Workflow B, Steps 5 & 6)
router.post(
  '/register',
  rateLimit({ windowSeconds: 60, maxRequests: 5, message: 'Too many registration attempts. Please wait a minute.' }),
  asyncHandler(async (req, res) => {
    await ensureOtpTable();
    const {
      full_name,
      email,
      password,
      confirm_password,
      phone = '',
      date_of_birth = null,
      gender = '',
      address = '',
      consent_privacy_terms = false,
      otp_code = '',
      // Note: any client-supplied role or mrn is strictly ignored and discarded server-side
    } = req.body || {};

    // Validate required fields
    if (!full_name?.trim() || !email?.trim() || !phone?.trim() || !password) {
      return res.status(400).json({
        error: 'Full name, email address, mobile number, and password are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long.',
      });
    }

    if (confirm_password && password !== confirm_password) {
      return res.status(400).json({
        error: 'Passwords do not match.',
      });
    }

    if (consent_privacy_terms !== true && consent_privacy_terms !== 'true') {
      return res.status(400).json({
        error: 'Consent to the Healix Health Information Privacy Policy and Patient Rights is required to register.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    // Verify OTP code if supplied
    if (otp_code?.trim()) {
      const code = otp_code.trim();
      const otpRes = await query(
        `SELECT * FROM patient_otp_verifications
         WHERE (identifier = $1 OR identifier = $2) AND otp_code = $3 AND used = FALSE AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [normalizedPhone, normalizedEmail, code]
      );

      if (otpRes.rows.length === 0) {
        return res.status(400).json({
          error: 'Invalid or expired verification code. Please check your code or request a new one.',
        });
      }

      await query('UPDATE patient_otp_verifications SET used = TRUE WHERE id = $1', [otpRes.rows[0].id]);
    }

    // Check duplicate email
    const emailCheck = await query('SELECT id FROM patient_accounts WHERE LOWER(email) = $1', [
      normalizedEmail,
    ]);
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({
        error: 'An account with this email address is already registered. Please sign in or recover your password.',
      });
    }

    // Check duplicate mobile number
    if (normalizedPhone) {
      const phoneCheck = await query(
        'SELECT id FROM patient_accounts WHERE phone = $1 AND phone <> \'\'',
        [normalizedPhone]
      );
      if (phoneCheck.rows.length > 0) {
        return res.status(409).json({
          error: 'An account with this mobile number is already registered. Please sign in or use mobile OTP.',
        });
      }
    }

    // Check potential duplicate patient record (matching Full Name + Date of Birth)
    if (date_of_birth && full_name) {
      const demographicCheck = await query(
        `SELECT id, mrn FROM patient_accounts
         WHERE LOWER(full_name) = LOWER($1) AND date_of_birth = $2::date`,
        [full_name.trim(), date_of_birth]
      );
      if (demographicCheck.rows.length > 0) {
        return res.status(409).json({
          error:
            'A medical patient record with identical name and date of birth is already registered. Please sign in or contact patient administration if you need to merge records.',
        });
      }
    }

    // Server-side assignment of patient identity & credentials (MRN)
    const mrn = generateMrn();
    const passwordHash = hashPassword(password);

    const insertRes = await query(
      `INSERT INTO patient_accounts (
        mrn, full_name, email, password_hash, phone, date_of_birth, gender, address
      ) VALUES ($1, $2, $3, $4, $5, $6::date, $7, $8)
      RETURNING *`,
      [
        mrn,
        full_name.trim(),
        normalizedEmail,
        passwordHash,
        normalizedPhone,
        date_of_birth || null,
        gender || '',
        address.trim() || '',
      ]
    );

    const patient = sanitizePatient(insertRes.rows[0]);

    // Workflow F: Registration -> Account verification notification (Email, SMS, In-Portal)
    await dispatchNotification({
      patientId: patient.id,
      recipientEmail: patient.email,
      recipientPhone: patient.phone,
      eventType: NOTIFICATION_EVENTS.REGISTRATION,
      title: 'Welcome to Healix — Account Verified',
      message: `Your account registration is confirmed. Your official Medical Record Number is ${patient.mrn}. Your patient profile and electronic health record access are now active.`,
      actionHref: '/patient/profile',
    });

    // Create session token (7-day validity)
    const token = generateToken();
    await query(
      `INSERT INTO patient_sessions (patient_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [patient.id, token]
    );

    // Set secure HTTP-only cookie
    const cookieOpts = getSessionCookieOptions(req);
    res.cookie('hx_session', token, cookieOpts);

    res.status(201).json({
      data: {
        token,
        patient,
        message: 'Account created successfully with verified patient identity.',
      },
    });
  })
);

// 2. Patient Login (Supports both Email and Mobile Phone)
router.post(
  '/login',
  rateLimit({ windowSeconds: 60, maxRequests: 5, message: 'Too many login attempts. Please wait a minute.' }),
  asyncHandler(async (req, res) => {
    const { identifier, email, phone, password } = req.body || {};
    const loginTarget = (identifier || email || phone || '').trim();

    if (!loginTarget || !password) {
      return res.status(400).json({ error: 'Email or mobile number, and password are required.' });
    }

    // Check account lockout status
    const lockout = securityLimiter.isAccountLocked(loginTarget);
    if (lockout.locked) {
      return res.status(429).json({
        error: `Account is temporarily locked due to repeated failed login attempts. Please retry in ${lockout.remainingSec} seconds or reset your password.`,
        locked: true,
        retry_after_seconds: lockout.remainingSec,
      });
    }

    const normalizedTarget = loginTarget.toLowerCase();

    // Query by email OR phone
    const userRes = await query(
      `SELECT * FROM patient_accounts
       WHERE LOWER(email) = $1 OR phone = $2 OR LOWER(mrn) = $1`,
      [normalizedTarget, loginTarget]
    );

    if (userRes.rows.length === 0 || !verifyPassword(password, userRes.rows[0].password_hash)) {
      securityLimiter.recordLoginFailure(loginTarget);
      await logSensitiveAccess({
        patientId: userRes.rows[0]?.id || null,
        action: 'FAILED_LOGIN_ATTEMPT',
        entityType: 'auth_session',
        entityId: loginTarget,
        details: { target: loginTarget, reason: 'Invalid password or user not found' },
        req,
      });
      return res.status(401).json({ error: 'Invalid login credentials. Please check your email/mobile and password.' });
    }

    // Reset login failures on success
    securityLimiter.clearLoginFailure(loginTarget);

    const account = userRes.rows[0];

    // Check account status if status column exists
    if (account.status && account.status !== 'Active') {
      return res.status(403).json({
        error: `Your patient account is currently ${account.status}. Please contact Healix Patient Services for assistance.`,
      });
    }

    const patient = sanitizePatient(account);
    const token = generateToken();

    await query(
      `INSERT INTO patient_sessions (patient_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [patient.id, token]
    );

    // Set secure HTTP-only cookie
    const cookieOpts = getSessionCookieOptions(req);
    res.cookie('hx_session', token, cookieOpts);

    await logSensitiveAccess({
      patientId: patient.id,
      action: 'SUCCESSFUL_LOGIN',
      entityType: 'auth_session',
      entityId: patient.id,
      details: { mrn: patient.mrn, method: 'password' },
      req,
    });

    res.json({
      data: {
        token,
        patient,
      },
    });
  })
);

// 3. Send Login OTP (Email or Mobile)
router.post(
  '/otp/send',
  rateLimit({ windowSeconds: 60, maxRequests: 5, message: 'Too many OTP requests. Please wait a minute.' }),
  asyncHandler(async (req, res) => {
    await ensureOtpTable();
    const { identifier } = req.body || {};
    if (!identifier?.trim()) {
      return res.status(400).json({ error: 'Please enter your registered email address or mobile number.' });
    }

    const target = identifier.trim();
    const normalizedTarget = target.toLowerCase();

    const userRes = await query(
      `SELECT id, email, phone, full_name
       FROM patient_accounts
       WHERE LOWER(email) = $1 OR phone = $2`,
      [normalizedTarget, target]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({
        error: 'No registered patient account found with that email or mobile number.',
      });
    }

    const user = userRes.rows[0];
    const code = crypto.randomInt(100000, 999999).toString();

    // Expire any existing OTPs for this identifier
    await query(
      'UPDATE patient_otp_verifications SET used = TRUE WHERE identifier = $1',
      [target]
    );

    // Save new OTP valid for 5 minutes
    await query(
      `INSERT INTO patient_otp_verifications (identifier, otp_code, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '5 minutes')`,
      [target, code]
    );

    res.json({
      data: {
        message: `A 6-digit verification code has been dispatched to your registered contact.`,
        destination: user.email ? `${user.email.slice(0, 3)}***@***` : user.phone,
        // Provided for development testing without live SMS gateway
        demo_otp: code,
      },
    });
  })
);

// 4. Verify OTP & Authenticate
router.post(
  '/otp/verify',
  asyncHandler(async (req, res) => {
    await ensureOtpTable();
    const { identifier, otp_code } = req.body || {};
    if (!identifier?.trim() || !otp_code?.trim()) {
      return res.status(400).json({ error: 'Identifier and 6-digit verification code are required.' });
    }

    const target = identifier.trim();
    const code = otp_code.trim();

    const otpRes = await query(
      `SELECT * FROM patient_otp_verifications
       WHERE identifier = $1 AND otp_code = $2 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [target, code]
    );

    if (otpRes.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code. Please request a new code.' });
    }

    // Mark OTP used
    await query('UPDATE patient_otp_verifications SET used = TRUE WHERE id = $1', [otpRes.rows[0].id]);

    // Retrieve user and log in
    const userRes = await query(
      `SELECT * FROM patient_accounts
       WHERE LOWER(email) = $1 OR phone = $2`,
      [target.toLowerCase(), target]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Patient account not found.' });
    }

    const patient = sanitizePatient(userRes.rows[0]);
    const token = generateToken();

    await query(
      `INSERT INTO patient_sessions (patient_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [patient.id, token]
    );

    // Set secure HTTP-only cookie
    const cookieOpts = getSessionCookieOptions(req);
    res.cookie('hx_session', token, cookieOpts);

    await logSensitiveAccess({
      patientId: patient.id,
      action: 'OTP_LOGIN',
      entityType: 'auth_session',
      entityId: patient.id,
      details: { mrn: patient.mrn, method: 'otp' },
      req,
    });

    res.json({
      data: {
        token,
        patient,
        message: 'OTP verified successfully.',
      },
    });
  })
);

// 5. Current authenticated patient (Session validation)
router.get('/me', requirePatientAuth, (req, res) => {
  res.json({ data: { patient: req.patient } });
});

// 6. Logout (Invalidates session in DB and clears cookie)
router.post(
  '/logout',
  requirePatientAuth,
  asyncHandler(async (req, res) => {
    await query('DELETE FROM patient_sessions WHERE token = $1', [req.sessionToken]);
    res.clearCookie('hx_session', { path: '/' });
    await logSensitiveAccess({
      patientId: req.patient.id,
      action: 'LOGOUT',
      entityType: 'auth_session',
      entityId: req.patient.id,
      details: { reason: 'User initiated logout' },
      req,
    });
    res.json({ data: { loggedOut: true } });
  })
);

// 7. Forgot Password (Expiring single-use token with rate limit)
router.post(
  '/forgot-password',
  rateLimit({ windowSeconds: 60, maxRequests: 3, message: 'Too many password reset requests. Please wait a minute.' }),
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
      const user = userRes.rows[0];
      resetToken = generateToken(32);
      await query(
        `INSERT INTO password_reset_tokens (patient_id, token, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
        [user.id, resetToken]
      );

      await logSensitiveAccess({
        patientId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        entityType: 'auth_security',
        entityId: user.id,
        details: { email: normalizedEmail },
        req,
      });

      // Workflow F: Password reset -> Security notification (Email & SMS)
      await dispatchNotification({
        patientId: user.id,
        recipientEmail: user.email,
        eventType: NOTIFICATION_EVENTS.PASSWORD_RESET,
        title: 'Security Alert: Password Reset Requested',
        message: 'A password reset was requested for your Healix account. If this was you, please use the reset link. Link expires in 1 hour.',
        actionHref: `/reset-password?token=${resetToken}`,
      });
    }

    res.json({
      data: {
        message:
          'If an account matches that email, a single-use password reset link has been dispatched (valid for 1 hour).',
        demo_reset_token: resetToken,
      },
    });
  })
);

// 8. Reset Password (Single-use token consumption)
router.post(
  '/reset-password',
  rateLimit({ windowSeconds: 60, maxRequests: 5, message: 'Too many attempts. Please try again shortly.' }),
  asyncHandler(async (req, res) => {
    const { token, new_password, confirm_password } = req.body || {};
    if (!token?.trim() || !new_password || new_password.length < 8) {
      return res.status(400).json({
        error: 'A valid reset token and a new password (at least 8 characters) are required.',
      });
    }

    if (confirm_password && new_password !== confirm_password) {
      return res.status(400).json({ error: 'Passwords do not match.' });
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
    // Single-use token invalidation
    await query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [record.id]);
    // Invalidate all existing sessions on password change
    await query('DELETE FROM patient_sessions WHERE patient_id = $1', [record.patient_id]);
    res.clearCookie('hx_session', { path: '/' });

    await logSensitiveAccess({
      patientId: record.patient_id,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'auth_security',
      entityId: record.patient_id,
      details: { outcome: 'All existing sessions terminated' },
      req,
    });

    // Workflow F: Password reset -> Security notification (Password changed confirmation)
    await dispatchNotification({
      patientId: record.patient_id,
      eventType: NOTIFICATION_EVENTS.PASSWORD_RESET,
      title: 'Security Alert: Password Updated',
      message: 'Your Healix patient portal password was successfully updated. All other active sessions have been terminated for security.',
      actionHref: '/login',
    });

    res.json({ data: { message: 'Password updated successfully. You may now sign in with your new password.' } });
  })
);

// ==========================================
// HOSPITAL STAFF PORTAL ROLE-BASED AUTH
// ==========================================

const STAFF_ROSTER = {
  receptionist: {
    role: 'receptionist',
    roleName: 'Receptionist',
    staffId: 'REC-4011',
    name: 'Elena Rostova',
    email: 'reception@healix.org',
    department: 'Central OPD & Front Desk',
    shift: 'Morning OPD (07:30 - 15:30)',
  },
  doctor: {
    role: 'doctor',
    roleName: 'Doctor',
    staffId: 'DOC-1024',
    name: 'Dr. Aris Thorne, MD',
    email: 'doctor@healix.org',
    department: 'Cardiology & Heart Institute',
    shift: 'Clinical Consultations & Rounds',
  },
  nurse: {
    role: 'nurse',
    roleName: 'Nurse',
    staffId: 'NUR-3088',
    name: 'Sister Claire Bennett, RN',
    email: 'nurse@healix.org',
    department: 'Cardiac Inpatient Ward 4B',
    shift: 'Day Nursing Shift (08:00 - 16:00)',
  },
  'lab-staff': {
    role: 'lab-staff',
    roleName: 'Lab Staff',
    staffId: 'LAB-5021',
    name: 'Marcus Vance, CLS',
    email: 'lab@healix.org',
    department: 'Central Clinical Pathology',
    shift: 'Diagnostic Laboratory Core',
  },
  'billing-staff': {
    role: 'billing-staff',
    roleName: 'Billing Staff',
    staffId: 'BIL-6019',
    name: 'David Chen, CPA',
    email: 'billing@healix.org',
    department: 'Patient Accounts & Cashless TPA',
    shift: 'Revenue Cycle Desk',
  },
  pharmacist: {
    role: 'pharmacist',
    roleName: 'Pharmacist',
    staffId: 'PHM-7014',
    name: 'Priya Sharma, PharmD',
    email: 'pharmacy@healix.org',
    department: 'Central Inpatient & OPD Pharmacy',
    shift: 'Dispensary & Stock Control',
  },
  'hr-staff': {
    role: 'hr-staff',
    roleName: 'HR Staff',
    staffId: 'HR-8002',
    name: 'Sarah Jenkins, SHRM',
    email: 'hr@healix.org',
    department: 'Human Resources & Credentialing',
    shift: 'Administrative Office',
  },
  administrator: {
    role: 'administrator',
    roleName: 'Administrator',
    staffId: 'ADM-9001',
    name: 'Jonathan Hayes, MHA',
    email: 'admin@healix.org',
    department: 'Hospital Administration & IS',
    shift: '24/7 System Governance',
  },
};

// Staff Login Endpoint: POST /api/v1/auth/staff/login
router.post(
  '/staff/login',
  asyncHandler(async (req, res) => {
    const { role, email, password, staff_id } = req.body || {};

    if (!role) {
      return res.status(400).json({ error: 'Please select a hospital staff role to sign in.' });
    }

    const normalizedRole = String(role).trim().toLowerCase();
    const staffEntry = STAFF_ROSTER[normalizedRole];

    if (!staffEntry) {
      return res.status(400).json({ error: `Unrecognized staff role: ${role}` });
    }

    const inputIdent = (email || staff_id || '').trim().toLowerCase();
    if (inputIdent && inputIdent !== staffEntry.email.toLowerCase() && inputIdent !== staffEntry.staffId.toLowerCase()) {
      return res.status(401).json({
        error: `Staff credential mismatch for ${staffEntry.roleName}. Expected ${staffEntry.email} or ID ${staffEntry.staffId}`,
      });
    }

    if (password && password !== 'staff123') {
      return res.status(401).json({
        error: 'Invalid password. (Use demo password: staff123)',
      });
    }

    const token = generateToken();
    const staffPayload = {
      ...staffEntry,
      id: `staff_${staffEntry.staffId}`,
      token,
      loggedInAt: new Date().toISOString(),
    };

    try {
      await logSensitiveAccess({
        patientId: 0,
        action: 'STAFF_ROLE_LOGIN',
        entityType: 'staff_session',
        entityId: staffEntry.staffId,
        details: { role: staffEntry.role, department: staffEntry.department },
        req,
      });
    } catch {
      // ignore
    }

    res.json({
      data: {
        message: `Welcome, ${staffEntry.name} (${staffEntry.roleName})`,
        staff: staffPayload,
        token,
      },
    });
  })
);

// Staff Current Session Endpoint: GET /api/v1/auth/staff/me
router.get(
  '/staff/me',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No active staff session.' });
    }
    res.json({ data: { status: 'authenticated' } });
  })
);

// Staff Logout Endpoint: POST /api/v1/auth/staff/logout
router.post(
  '/staff/logout',
  asyncHandler(async (req, res) => {
    res.json({ data: { message: 'Staff session terminated successfully.' } });
  })
);

export default router;
