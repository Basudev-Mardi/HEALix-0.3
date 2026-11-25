import crypto from 'node:crypto';
import { query } from '../db.js';

export function hashPassword(password) {
  // Uses crypto scrypt with high work factor (N=16384, r=8, p=1) and 32-byte salt
  const salt = crypto.randomBytes(32).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  
  // Support scrypt format with prefix
  if (storedHash.startsWith('scrypt:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const [, salt, keyHex] = parts;
    const keyBuf = Buffer.from(keyHex, 'hex');
    const derivedBuf = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
    if (keyBuf.length !== derivedBuf.length) return false;
    return crypto.timingSafeEqual(keyBuf, derivedBuf);
  }

  // Legacy format support (salt:keyHex)
  if (storedHash.includes(':')) {
    const [salt, keyHex] = storedHash.split(':');
    const keyBuf = Buffer.from(keyHex, 'hex');
    const derivedBuf = crypto.scryptSync(password, salt, 64);
    if (keyBuf.length !== derivedBuf.length) return false;
    return crypto.timingSafeEqual(keyBuf, derivedBuf);
  }

  return false;
}

export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function generateMrn() {
  const num = crypto.randomInt(100000, 999999);
  return `HX-MRN-${num}`;
}

export function sanitizePatient(row) {
  if (!row) return null;
  const { password_hash, token_hash, ...safe } = row;
  if (safe.date_of_birth instanceof Date) {
    safe.date_of_birth = safe.date_of_birth.toISOString().slice(0, 10);
  }
  return safe;
}

export async function requirePatientAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    let token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    // Also check HTTP-only cookie if Authorization header is not set
    if (!token && req.cookies && req.cookies.hx_session) {
      token = req.cookies.hx_session;
    } else if (!token && req.headers.cookie) {
      const match = req.headers.cookie.match(/hx_session=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    const result = await query(
      `SELECT p.*
       FROM patient_sessions s
       JOIN patient_accounts p ON p.id = s.patient_id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    }

    req.patient = sanitizePatient(result.rows[0]);
    req.sessionToken = token;
    next();
  } catch (error) {
    next(error);
  }
}
