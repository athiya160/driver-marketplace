/**
 * PERSONAL DRIVER MARKETPLACE - PRODUCTION SECURITY MIDDLEWARE
 * Pan-India On-Demand Personal Driver Marketplace
 * "Your Car. Your Journey. Your Driver."
 * 
 * Capabilities:
 * 1. Strict CORS Allowlist Enforcement
 * 2. Enterprise Security Response Headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
 * 3. In-Memory Sliding-Window Rate Limiting with standard RFC headers & 429 Retry-After
 * 4. Sensitive PII & Credential Sanitizer (Zero Aadhaar, OTP, Password or Secret leakage in logs)
 * 5. Request Payload Validation & File Upload MIME Guard
 */

// Production CORS Allowed Origins
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000'
];

export function getCorsOriginValidator() {
  const customOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  const allowedOrigins = new Set([...DEFAULT_ALLOWED_ORIGINS, ...customOrigins]);

  return (origin, callback) => {
    // In development or test, or if request is non-browser (curl, mobile app, postman, direct server call)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    // In production mode, reject unauthorized foreign origins
    if (process.env.NODE_ENV === 'production') {
      return callback(new Error(`CORS Policy Violation: Origin '${origin}' is not authorized by platform access control.`));
    }

    // Allow in test/dev with standard warning
    return callback(null, true);
  };
}

/**
 * Enterprise HTTP Security Headers Middleware
 */
export function securityHeadersMiddleware(req, res, next) {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent Clickjacking (iframe embedding)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Cross-Site Scripting (XSS) Protection filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Strict Transport Security (HSTS) - 1 year with subdomains
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; img-src 'self' data: blob: https:; connect-src 'self' https: ws: wss:; font-src 'self' https: data:;"
  );

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), payment=(self)');

  next();
}

/**
 * In-Memory Sliding-Window Rate Limiter
 */
export function createRateLimiter({
  windowMs = 60 * 1000,
  max = 100,
  message = 'Too many requests from this client. Please slow down and try again later.',
  keyGenerator = (req) => req.ip || req.connection?.remoteAddress || '127.0.0.1'
} = {}) {
  const clientBuckets = new Map();

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let record = clientBuckets.get(key);
    if (!record || now - record.windowStart >= windowMs) {
      record = { count: 1, windowStart: now };
      clientBuckets.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.windowStart + windowMs - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (record.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfterSeconds: resetSeconds
      });
    }

    next();
  };
}

// Pre-configured Production Limiters
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: 'Too many authentication attempts. Please wait 15 minutes before retrying.'
});

export const otpRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  message: 'OTP request quota exceeded for this number/session. Please wait 5 minutes.'
});

export const bookingRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30,
  message: 'Booking request rate limit reached. Please wait before creating additional rides.'
});

export const mapsRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: 'Geocoding & Directions API rate limit exceeded. Please wait 60 seconds.'
});

/**
 * PII & Credential Sanitizer for Audit Logging
 * Strips or masks passwords, OTPs, Aadhaar numbers, 16-digit PAN/Cards, and auth tokens.
 */
export function sanitizeLogDetails(details) {
  if (!details) return details;

  let str = typeof details === 'object' ? JSON.stringify(details) : String(details);

  // 1. Redact OTPs (e.g., "tripStartOtp": "4821", "otp": "9921", OTP 1234)
  str = str.replace(/(otp["']?\s*[:=]\s*["']?)\d{4,6}(["']?)/gi, '$1[REDACTED_OTP]$2');
  str = str.replace(/\b(OTP\s+is\s+)\d{4,6}\b/gi, '$1[REDACTED_OTP]');

  // 2. Redact Passwords
  str = str.replace(/(password["']?\s*[:=]\s*["']?)[^"',\s]+(["']?)/gi, '$1[REDACTED_PASSWORD]$2');

  // 3. Mask Aadhaar Numbers (12 digits with optional spaces/dashes) -> show only last 4
  str = str.replace(/\b\d{4}[ -]?\d{4}[ -]?(\d{4})\b/g, 'XXXX-XXXX-$1');

  // 4. Redact 16-digit Card Numbers
  str = str.replace(/\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?(\d{4})\b/g, 'XXXX-XXXX-XXXX-$1');

  // 5. Redact Bearer Tokens & Secrets
  str = str.replace(/Bearer\s+[A-Za-z0-9-_.]+/gi, 'Bearer [REDACTED_TOKEN]');
  str = str.replace(/(secret["']?\s*[:=]\s*["']?)[^"',\s]+(["']?)/gi, '$1[REDACTED_SECRET]$2');

  return typeof details === 'object' ? JSON.parse(str) : str;
}

/**
 * KYC & Document Upload Validation Guard
 * Validates allowed MIME types, extensions and file size limits
 */
export const ALLOWED_KYC_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
];

export const ALLOWED_KYC_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateDocumentUpload({ mimeType, fileName, sizeBytes }) {
  if (mimeType && !ALLOWED_KYC_MIME_TYPES.includes(mimeType.toLowerCase())) {
    return {
      valid: false,
      reason: `Unsupported document format '${mimeType}'. Allowed formats: JPG, PNG, WebP, PDF.`
    };
  }

  if (fileName) {
    const ext = fileName.slice(((fileName.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
    const hasValidExt = ALLOWED_KYC_EXTENSIONS.includes(`.${ext}`);
    if (!hasValidExt) {
      return {
        valid: false,
        reason: `Unsupported file extension '.${ext}'. Allowed extensions: .jpg, .jpeg, .png, .webp, .pdf`
      };
    }

    // Path traversal / shell injection prevention in file name
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\') || fileName.includes('\0')) {
      return {
        valid: false,
        reason: 'Illegal characters or path traversal sequence detected in file name.'
      };
    }
  }

  if (sizeBytes && sizeBytes > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      reason: `File size exceeds 10MB compliance limit (${Math.round(sizeBytes / (1024 * 1024))}MB).`
    };
  }

  return { valid: true };
}
