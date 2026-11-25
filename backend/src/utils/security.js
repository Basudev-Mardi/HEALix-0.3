import crypto from 'node:crypto';
import { query } from '../db.js';

/**
 * In-memory / database rate limiter and progressive throttling
 * Prevents brute force on login, registration, password resets, and OTPs.
 */
class SecurityLimiter {
  constructor() {
    this.hits = new Map(); // ip -> { count, firstHit, lastHit, lockedUntil }
    this.accountFailures = new Map(); // identifier -> { count, lockedUntil }

    // Periodic cleanup every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000).unref();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, val] of this.hits.entries()) {
      if (now - val.lastHit > 60 * 60 * 1000) {
        this.hits.delete(key);
      }
    }
    for (const [key, val] of this.accountFailures.entries()) {
      if (now > (val.lockedUntil || 0) && now - (val.lastAttempt || 0) > 60 * 60 * 1000) {
        this.accountFailures.delete(key);
      }
    }
  }

  getClientIp(req) {
    return (
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      '127.0.0.1'
    );
  }

  // Rate limit by IP: maxRequests within windowSeconds
  checkRateLimit(req, windowSeconds = 60, maxRequests = 10) {
    const ip = this.getClientIp(req);
    const now = Date.now();
    const entry = this.hits.get(ip) || { count: 0, firstHit: now, lastHit: now };

    if (now - entry.firstHit > windowSeconds * 1000) {
      entry.count = 1;
      entry.firstHit = now;
      entry.lastHit = now;
    } else {
      entry.count += 1;
      entry.lastHit = now;
    }
    this.hits.set(ip, entry);

    if (entry.count > maxRequests) {
      const retryAfterSec = Math.ceil((entry.firstHit + windowSeconds * 1000 - now) / 1000);
      return { allowed: false, retryAfter: Math.max(1, retryAfterSec) };
    }
    return { allowed: true, remaining: maxRequests - entry.count };
  }

  // Account lockout / throttling on failed authentication
  isAccountLocked(identifier) {
    if (!identifier) return { locked: false };
    const idKey = identifier.toLowerCase().trim();
    const failure = this.accountFailures.get(idKey);
    if (!failure) return { locked: false };

    const now = Date.now();
    if (failure.lockedUntil && now < failure.lockedUntil) {
      const remainingSec = Math.ceil((failure.lockedUntil - now) / 1000);
      return { locked: true, remainingSec, attempts: failure.count };
    }
    return { locked: false, attempts: failure.count };
  }

  recordLoginFailure(identifier) {
    if (!identifier) return;
    const idKey = identifier.toLowerCase().trim();
    const now = Date.now();
    const failure = this.accountFailures.get(idKey) || { count: 0 };
    failure.count += 1;
    failure.lastAttempt = now;

    // Progressive throttling:
    // 5 failures -> 5 minutes lockout
    // 10 failures -> 30 minutes lockout
    if (failure.count >= 10) {
      failure.lockedUntil = now + 30 * 60 * 1000;
    } else if (failure.count >= 5) {
      failure.lockedUntil = now + 5 * 60 * 1000;
    }
    this.accountFailures.set(idKey, failure);
  }

  clearLoginFailure(identifier) {
    if (!identifier) return;
    this.accountFailures.delete(identifier.toLowerCase().trim());
  }
}

export const securityLimiter = new SecurityLimiter();

/**
 * Express middleware for endpoint rate limiting
 */
export function rateLimit({ windowSeconds = 60, maxRequests = 10, message = 'Too many requests. Please try again later.' }) {
  return (req, res, next) => {
    const check = securityLimiter.checkRateLimit(req, windowSeconds, maxRequests);
    if (!check.allowed) {
      res.setHeader('Retry-After', check.retryAfter);
      return res.status(429).json({
        error: message,
        retry_after_seconds: check.retryAfter,
      });
    }
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', check.remaining);
    next();
  };
}

/**
 * Safe cookie options for HTTP-only, secure, SameSite sessions
 */
export function getSessionCookieOptions(req) {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction, // HTTPS in production
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
}

/**
 * Anti-CSRF Token Generation and Verification
 * For cookie-based authenticated requests or mutation endpoints.
 */
export function generateCsrfToken() {
  return crypto.randomBytes(24).toString('hex');
}

export function verifyCsrfProtection(req, res, next) {
  // Safe HTTP verbs
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // If request uses Bearer token in Authorization header, CSRF isn't applicable
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return next();
  }

  const clientCsrf = req.headers['x-csrf-token'] || req.body?._csrf;
  const cookieCsrf = req.cookies?.['hx_csrf_token'];

  if (cookieCsrf && clientCsrf && cookieCsrf === clientCsrf) {
    return next();
  }

  // For strict API mode with cookies
  if (req.cookies?.['hx_session'] && (!clientCsrf || clientCsrf !== cookieCsrf)) {
    return res.status(403).json({
      error: 'Invalid or missing CSRF security token. Request denied.',
      code: 'CSRF_INVALID',
    });
  }

  next();
}

/**
 * Generates single-use, time-limited signed URL or token for medical report downloads.
 */
export function generateSignedReportToken(patientId, reportType, reportId, validityMinutes = 15) {
  const secret = process.env.REPORT_SIGNING_SECRET || 'healix-medical-report-signature-key-2026';
  const expiresAt = Date.now() + validityMinutes * 60 * 1000;
  const payload = `${patientId}:${reportType}:${reportId}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return {
    download_token: `${Buffer.from(payload).toString('base64url')}.${hmac}`,
    expires_at: new Date(expiresAt).toISOString(),
    valid_minutes: validityMinutes,
  };
}

export function verifySignedReportToken(signedToken) {
  if (!signedToken || !signedToken.includes('.')) {
    return { valid: false, error: 'Malformed download token' };
  }
  const [b64Payload, signature] = signedToken.split('.');
  const secret = process.env.REPORT_SIGNING_SECRET || 'healix-medical-report-signature-key-2026';
  let payloadStr = '';
  try {
    payloadStr = Buffer.from(b64Payload, 'base64url').toString('utf8');
  } catch {
    return { valid: false, error: 'Invalid payload encoding' };
  }

  const expectedSig = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSig, 'hex'))) {
    return { valid: false, error: 'Tampered download signature' };
  }

  const [patientId, reportType, reportId, expiresAtStr] = payloadStr.split(':');
  const expiresAt = Number(expiresAtStr);
  if (Date.now() > expiresAt) {
    return { valid: false, error: 'Download link has expired. Please request a fresh link.' };
  }

  return {
    valid: true,
    patientId,
    reportType,
    reportId,
    expiresAt: new Date(expiresAt),
  };
}

/**
 * Medical file upload restriction validator (allowed MIME types and 10MB size limit)
 */
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];
export const MAX_DOCUMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateUploadedDocument(file) {
  if (!file) {
    return { valid: false, error: 'No document file supplied.' };
  }
  if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Unsupported document format (${file.mimetype}). Permitted formats: PDF, JPEG, PNG, WEBP.`,
    };
  }
  if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Document exceeds maximum allowable limit of 10 MB (received ${Math.round(file.size / 1024 / 1024)} MB).`,
    };
  }
  return { valid: true };
}

/**
 * Access logging for sensitive medical records
 */
export async function logSensitiveAccess({
  userId = null,
  patientId,
  action,
  entityType,
  entityId,
  details = {},
  req,
}) {
  try {
    const ip = securityLimiter.getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    // Redact any passwords, secrets, or raw clinical tokens
    const safeDetails = { ...details };
    delete safeDetails.password;
    delete safeDetails.password_hash;
    delete safeDetails.token;
    delete safeDetails.cookie;

    await query(
      `INSERT INTO audit_logs (user_id, patient_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        patientId,
        action,
        entityType,
        String(entityId),
        JSON.stringify(safeDetails),
        ip,
        userAgent,
      ]
    );
  } catch (err) {
    console.error('Failed to log sensitive access:', err.message);
  }
}
