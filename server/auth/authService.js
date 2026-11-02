/**
 * SALMAN DRIVER - SECURE AUTHENTICATION & ROLE-BASED ACCESS CONTROL
 * Production Token Signer & Role Authorization
 * Uses Node.js native crypto for zero-dependency security
 */

import crypto from 'crypto';

// Secret key for JWT signing (In production, loaded from JWT_SECRET or SUPABASE_JWT_SECRET)
const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'salman_driver_production_secret_2026_india';

/**
 * Creates base64url encoded string
 */
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Decodes base64url string
 */
function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Signs payload creating JWT token
 */
export function signJwt(payload, expiresInSeconds = 86400) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const tokenPayload = { ...payload, exp, iat: Math.floor(Date.now() / 1000) };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload));

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifies JWT token and checks expiry
 */
export function verifyJwt(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, message: 'Missing token' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, message: 'Malformed token structure' };
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature !== expectedSig) {
    return { valid: false, message: 'Invalid token signature' };
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, message: 'Token has expired' };
    }
    return { valid: true, payload };
  } catch (err) {
    return { valid: false, message: 'Failed to parse token payload' };
  }
}

/**
 * Hashes password using cryptographic SHA-256 with salt
 */
export function hashPassword(plainPassword, salt = 'salman_driver_salt') {
  return crypto
    .createHmac('sha256', salt)
    .update(plainPassword)
    .digest('hex');
}

/**
 * Express Middleware: Authenticates Bearer Token from headers or cookies
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Allow optional token in local test runner
  if (!token) {
    req.user = null;
    return next();
  }

  const verification = verifyJwt(token);
  if (!verification.valid) {
    return res.status(401).json({ success: false, message: verification.message });
  }

  req.user = verification.payload;
  next();
}

/**
 * Express Middleware: Enforces specific role access
 */
export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: requires one of roles [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
}
