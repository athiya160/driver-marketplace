/**
 * PERSONAL DRIVER MARKETPLACE - SECURE AUTHENTICATION & ROLE-BASED ACCESS CONTROL
 * Production Token Signer, Refresh Token Generator & Role Authorization
 * Uses Node.js native crypto for zero-dependency high security
 */

import crypto from 'crypto';

// Secret keys for JWT signing & refresh tokens
const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'driver_marketplace_production_jwt_secret_2026';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'driver_marketplace_refresh_token_secret_2026';

// Token Revocation Blocklist (stores revoked token signatures or tokens)
const revokedTokens = new Set();

/**
 * Revokes an active JWT token (e.g. on logout or credential reset)
 */
export function revokeToken(token) {
  if (token && typeof token === 'string') {
    revokedTokens.add(token.trim());
  }
}

/**
 * Checks if a token has been explicitly revoked
 */
export function isTokenRevoked(token) {
  if (!token || typeof token !== 'string') return false;
  return revokedTokens.has(token.trim());
}

/**
 * Resets token revocation set (useful for test fixtures)
 */
export function clearRevokedTokens() {
  revokedTokens.clear();
}

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
export function signJwt(payload, expiresInSeconds = 86400, secret = JWT_SECRET) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const jti = payload.jti || crypto.randomBytes(8).toString('hex');
  const tokenPayload = { ...payload, exp, iat: Math.floor(Date.now() / 1000), jti };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload));

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifies JWT token and checks expiry, revocation, and production demo isolation
 */
export function verifyJwt(token, secret = JWT_SECRET, options = {}) {
  if (!token || typeof token !== 'string') {
    return { valid: false, message: 'Missing token' };
  }

  const cleanToken = token.trim();

  // Check Token Revocation Blocklist
  if (isTokenRevoked(cleanToken)) {
    return { valid: false, message: 'Token has been revoked. Please re-authenticate.' };
  }

  // Reject synthetic demo tokens in strict production mode
  if (process.env.NODE_ENV === 'production' && (cleanToken.startsWith('demo-') || cleanToken.startsWith('adm_session_'))) {
    return { valid: false, message: 'Forbidden: Demo tokens are rejected on production endpoints.' };
  }

  const parts = cleanToken.split('.');
  if (parts.length !== 3) {
    return { valid: false, message: 'Malformed token structure' };
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', secret)
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

    // Issuer & Audience validation if requested
    if (options.issuer && payload.iss && payload.iss !== options.issuer) {
      return { valid: false, message: `Invalid token issuer (expected ${options.issuer})` };
    }
    if (options.audience && payload.aud && payload.aud !== options.audience) {
      return { valid: false, message: `Invalid token audience (expected ${options.audience})` };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, message: 'Failed to parse token payload' };
  }
}

/**
 * Generates long-lived refresh token (7 days default)
 */
export function generateRefreshToken(payload, expiresInSeconds = 604800) {
  return signJwt({ ...payload, tokenType: 'refresh' }, expiresInSeconds, REFRESH_SECRET);
}

/**
 * Verifies long-lived refresh token
 */
export function verifyRefreshToken(token) {
  const res = verifyJwt(token, REFRESH_SECRET);
  if (!res.valid) return res;
  if (res.payload.tokenType !== 'refresh') {
    return { valid: false, message: 'Invalid token type for refresh' };
  }
  return res;
}

/**
 * Hashes password using cryptographic SHA-256 with salt
 */
export function hashPassword(plainPassword, salt = 'driver_marketplace_salt_2026') {
  return crypto
    .createHmac('sha256', salt)
    .update(plainPassword)
    .digest('hex');
}

/**
 * Verifies password against expected hash using timing-safe comparison
 */
export function verifyPassword(plainPassword, expectedHash, salt = 'driver_marketplace_salt_2026') {
  if (!plainPassword || !expectedHash || typeof plainPassword !== 'string' || typeof expectedHash !== 'string') {
    return false;
  }
  const computed = hashPassword(plainPassword, salt);
  const bufComputed = Buffer.from(computed);
  const bufExpected = Buffer.from(expectedHash);
  if (bufComputed.length !== bufExpected.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufComputed, bufExpected);
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
export function requireRole(allowedRoles = [], { allowDemo = false } = {}) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // In production mode, reject demo tokens from performing production actions
    if (req.user.isDemo && !allowDemo && process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Demo tokens cannot execute production operations.'
      });
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

/**
 * Express Middleware: Resource Ownership Verification
 * Prevents Customer A from accessing Customer B's booking or driver details
 */
export function verifyOwnership(resourceOwnerId, user) {
  if (!user) return false;
  if (user.role === 'admin') return true; // Admins have oversight
  return user.id === resourceOwnerId;
}
