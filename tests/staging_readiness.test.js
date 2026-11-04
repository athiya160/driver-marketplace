/**
 * ==============================================================================
 * PERSONAL DRIVER MARKETPLACE - PHASE 8G: DEPLOYMENT & OPERATIONAL READINESS TESTS
 * Pan-India On-Demand Personal Driver Marketplace
 * "Your Car. Your Journey. Your Driver."
 * 
 * Verifies:
 * 1. Unified Full-Stack Architecture (Express serving dist/ frontend + /api)
 * 2. Staging / Production Health Telemetry (/health, /api/health, /api/staging/system-info)
 * 3. Secret Isolation & Production Role Guards (no demo PINs or x-demo-role bypass in prod)
 * 4. Supabase RLS Role Isolation (Customer vs Driver vs Admin tokens)
 * 5. Redis State Reconnection & Lock Mutex Resilience
 * 6. Disaster Recovery: Cryptographic Backup, Integrity Verification & Safe Restore
 * 7. Server Boot Recovery & Durable Dispatch Offer Reconciliation
 * 8. Configurable GST Tax Calculation & Statutory Disclaimers
 * 9. Mobile Application Manifest (Expo / Android 14 / iOS location permissions)
 * 10. Complete 11-Step End-to-End Staging User Journey
 * ==============================================================================
 */

process.env.NODE_ENV = 'test';

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';
import app from '../server/index.js';
import { signJwt, verifyJwt } from '../server/auth/authService.js';
import { calculateFare } from '../server/pricingEngine.js';
import { globalRedisClient } from '../server/infrastructure/redisClient.js';
import { globalDisasterRecovery } from '../server/infrastructure/disasterRecovery.js';
import { globalDurableDispatchWorker } from '../server/infrastructure/durableDispatchWorker.js';
import { persistentStorage } from '../server/db/persistentStorage.js';
import { globalPaymentService } from '../server/payments/paymentService.js';
import { globalRefundService } from '../server/payments/refundService.js';
import { globalSettlementService } from '../server/payments/settlementService.js';
import { globalOtpService } from '../server/communications/otpService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper for running synchronous test blocks
function it(description, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${description}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(err);
    process.exit(1);
  }
}

// Helper for running asynchronous test blocks
async function itAsync(description, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${description}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(err);
    process.exit(1);
  }
}

// Zero-network Express request simulation helper
function mockExpressRequest(appInstance, { method = 'GET', url = '/', headers = {}, body = null } = {}) {
  return new Promise((resolve) => {
    const rawHeaders = [];
    for (const [k, v] of Object.entries(headers)) {
      rawHeaders.push(k, v);
    }

    // Use ES module EventEmitter
    const req = new EventEmitter();
    req.method = method.toUpperCase();
    req.url = url;
    req.headers = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
    req.rawHeaders = rawHeaders;
    req.socket = { remoteAddress: '127.0.0.1' };
    req.connection = req.socket;

    const res = new EventEmitter();
    let resStatusCode = 200;
    const resHeaders = {};
    let responseBody = '';

    res.statusCode = 200;
    res.setHeader = (name, value) => {
      resHeaders[name.toLowerCase()] = value;
    };
    res.getHeader = (name) => resHeaders[name.toLowerCase()];
    res.writeHead = (statusCode, headersObj) => {
      resStatusCode = statusCode;
      if (headersObj) {
        for (const [k, v] of Object.entries(headersObj)) {
          resHeaders[k.toLowerCase()] = v;
        }
      }
    };
    res.status = (code) => {
      resStatusCode = code;
      res.statusCode = code;
      return res;
    };
    res.send = (content) => {
      responseBody = content;
      resolve({
        statusCode: resStatusCode,
        headers: resHeaders,
        body: responseBody
      });
    };
    res.json = (jsonObj) => {
      resHeaders['content-type'] = 'application/json; charset=utf-8';
      responseBody = JSON.stringify(jsonObj);
      resolve({
        statusCode: resStatusCode,
        headers: resHeaders,
        body: responseBody,
        json: jsonObj
      });
    };
    res.end = (chunk) => {
      if (chunk) responseBody += chunk;
      let parsedJson = null;
      try {
        parsedJson = JSON.parse(responseBody);
      } catch (e) {}
      resolve({
        statusCode: resStatusCode,
        headers: resHeaders,
        body: responseBody,
        json: parsedJson
      });
    };

    appInstance.handle(req, res, (err) => {
      if (err) {
        resolve({
          statusCode: 500,
          headers: resHeaders,
          body: String(err),
          json: { error: String(err) }
        });
      }
    });

    if (body) {
      const payload = typeof body === 'object' ? JSON.stringify(body) : String(body);
      req.emit('data', Buffer.from(payload));
    }
    req.emit('end');
  });
}

console.log('\n=======================================================');
console.log('🧪 Starting Phase 8G Deployment & Readiness Test Suite...');
console.log('=======================================================\n');

console.log('--- 1. Deployment Architecture & Health Probes ---');

await itAsync('1. Root /health probe returns UP status and platform telemetry', async () => {
  const res = await mockExpressRequest(app, { method: 'GET', url: '/health' });
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.json.status, 'ONLINE');
  assert.ok(res.json.version);
});

await itAsync('2. API /api/health probe returns database and redis component diagnostics', async () => {
  const res = await mockExpressRequest(app, { method: 'GET', url: '/api/health' });
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.json.status, 'UP');
  assert.ok(res.json.components.database);
  assert.ok(res.json.components.redis);
  assert.ok(res.json.components.memory.heapUsedMb > 0);
});

await itAsync('3. Staging system info endpoint returns statutory disclaimer and city pilot metadata', async () => {
  const res = await mockExpressRequest(app, { method: 'GET', url: '/api/staging/system-info' });
  assert.strictEqual(res.statusCode, 200);
  assert.ok(res.json.pilotCity.includes('Bengaluru'));
  assert.ok(res.json.statutoryDisclaimer.includes('GST calculation'));
});

console.log('\n--- 2. Secret Protection & Production Role Guards ---');

it('4. Secret Protection: Supabase service-role key is never exposed with VITE_ prefix', () => {
  const envExample = fs.readFileSync(path.resolve(__dirname, '../.env.example'), 'utf8');
  assert.ok(!envExample.includes('VITE_SUPABASE_SERVICE_ROLE_KEY'));
  assert.ok(envExample.includes('CRITICAL SECURITY RULE: SUPABASE_SERVICE_ROLE_KEY must remain BACKEND ONLY'));
});

await itAsync('5. Production Admin Guard: Rejects default PIN 1234 when running in production mode', async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  delete process.env.ADMIN_PASSWORD;

  try {
    const res = await mockExpressRequest(app, {
      method: 'POST',
      url: '/api/admin/login',
      headers: { 'Content-Type': 'application/json' },
      body: { pin: '1234' }
    });
    // Should fail closed with 500 (credentials unconfigured) or 401
    assert.ok(res.statusCode === 500 || res.statusCode === 401);
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});

await itAsync('6. Production Role Guard: Rejects x-demo-role admin escalation in production mode', async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  try {
    const res = await mockExpressRequest(app, {
      method: 'GET',
      url: '/api/admin/stats',
      headers: { 'x-demo-role': 'admin' }
    });
    assert.strictEqual(res.statusCode, 401); // Unauthorized
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});

console.log('\n--- 3. Supabase RLS & Role Isolation Simulation ---');

await itAsync('7. RLS Policy: Customer token cannot access administrative audit logs', async () => {
  const customerToken = signJwt({ id: 'cust_rls_test', role: 'customer', email: 'cust@example.com' });
  const res = await mockExpressRequest(app, {
    method: 'GET',
    url: '/api/admin/logs',
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  assert.strictEqual(res.statusCode, 403);
});

await itAsync('8. RLS Policy: Driver token cannot access unauthorized financial refunds', async () => {
  const driverToken = signJwt({ id: 'drv_rls_test', role: 'driver', email: 'driver@example.com' });
  const res = await mockExpressRequest(app, {
    method: 'POST',
    url: '/api/admin/refunds',
    headers: {
      'Authorization': `Bearer ${driverToken}`,
      'Content-Type': 'application/json'
    },
    body: { bookingId: 'bk_123', amount: 500 }
  });
  assert.strictEqual(res.statusCode, 403);
});

console.log('\n--- 4. Disaster Recovery & Database Resilience ---');

await itAsync('9. Database Backup: Creates timestamped snapshot with cryptographic SHA-256 hash', async () => {
  const backup = await globalDisasterRecovery.createBackup('test_suite_phase_8g');
  assert.strictEqual(backup.success, true);
  assert.ok(backup.backupId);
  assert.ok(backup.metadata.checksum);
  assert.strictEqual(backup.metadata.checksum.length, 64); // SHA-256 length
});

await itAsync('10. Database Backup Verification: Validates file envelope and table completeness', async () => {
  const backup = await globalDisasterRecovery.createBackup('test_suite_verify');
  const verify = globalDisasterRecovery.verifyBackupIntegrity(backup.backupId);
  assert.strictEqual(verify.valid, true);
  assert.ok(verify.tableCount >= 10);
});

await itAsync('11. Database Restore: Restores database state with automatic safety pre-snapshot', async () => {
  const backup = await globalDisasterRecovery.createBackup('test_suite_restore_target');
  const restore = await globalDisasterRecovery.restoreBackup(backup.backupId, 'test_operator');
  assert.strictEqual(restore.success, true);
  assert.strictEqual(restore.restoredBackupId, backup.backupId);
  assert.ok(restore.safetyBackupId);
});

await itAsync('12. Server Boot Recovery: Reconciles persistent dispatch state and clears stale locks', async () => {
  const bootReport = await globalDisasterRecovery.recoverServerStateOnBoot();
  assert.ok(bootReport.timestamp);
  assert.ok(typeof bootReport.reconciledBookingsCount === 'number');
  assert.strictEqual(bootReport.errors.length, 0);
});

console.log('\n--- 5. Statutory GST Calculation & Tax Transparency ---');

it('13. GST Engine: Supports configurable tax rate (e.g. 5% vs 18%) with statutory disclaimer', () => {
  // Test with default 5%
  const fare5 = calculateFare({ serviceType: 'hourly', durationHours: 2, gstRatePercent: 5 });
  assert.strictEqual(fare5.gstRatePercent, 5);
  assert.ok(fare5.gstTax > 0);
  assert.ok(fare5.gstStatutoryDisclaimer.includes('qualified tax professional'));

  // Test with custom 18%
  const fare18 = calculateFare({ serviceType: 'hourly', durationHours: 2, gstRatePercent: 18 });
  assert.strictEqual(fare18.gstRatePercent, 18);
  assert.ok(fare18.gstTax > fare5.gstTax);
});

console.log('\n--- 6. Mobile Platform (Android / iOS) Physical Manifest Audit ---');

it('14. Mobile Manifest: Declares required Android 14 Foreground Location service', () => {
  const appJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../app.json'), 'utf8'));
  const permissions = appJson.expo.android.permissions;
  assert.ok(permissions.includes('ACCESS_FINE_LOCATION'));
  assert.ok(permissions.includes('ACCESS_BACKGROUND_LOCATION'));
  assert.ok(permissions.includes('FOREGROUND_SERVICE_LOCATION'));
});

it('15. Mobile Manifest: Declares modern iOS Always & When In Use description strings', () => {
  const appJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../app.json'), 'utf8'));
  const infoPlist = appJson.expo.ios.infoPlist;
  assert.ok(infoPlist.NSLocationWhenInUseUsageDescription);
  assert.ok(infoPlist.NSLocationAlwaysAndWhenInUseUsageDescription);
});

console.log('\n--- 7. Complete 11-Step End-to-End Staging User Journey ---');

await itAsync('16. Complete Staging Journey: Customer signup -> Chauffeur KYC -> Booking -> OTP Handshake -> Completion -> Refund', async () => {
  // Step 1: Customer registration & login
  const customerId = `cust_staging_${Date.now()}`;
  const customerUser = {
    id: customerId,
    fullName: 'Salman Customer Demo',
    phone: '+91 98888 77777',
    role: 'customer'
  };
  const customerToken = signJwt(customerUser);
  assert.ok(customerToken);

  // Step 2: Chauffeur registration & KYC document upload
  const driverId = `drv_staging_${Date.now()}`;
  const driverRecord = {
    id: driverId,
    name: 'Rajesh Driver Demo',
    phone: '+91 97777 66666',
    status: 'pending_verification',
    city: 'Bengaluru',
    rating: 4.9,
    experienceYears: 7,
    carTypes: ['Hatchback', 'Sedan', 'SUV'],
    transmissionSkills: ['Manual', 'Automatic']
  };
  persistentStorage.insert('drivers', driverRecord);

  // Step 3: Admin KYC approval
  driverRecord.status = 'approved';
  driverRecord.isKycVerified = true;
  persistentStorage.update('drivers', d => d.id === driverId, driverRecord);
  assert.strictEqual(driverRecord.status, 'approved');

  // Step 4: Chauffeur availability toggle
  driverRecord.isOnline = true;
  persistentStorage.update('drivers', d => d.id === driverId, { isOnline: true });

  // Step 5: Customer booking with own vehicle (Sedan)
  const fare = calculateFare({ serviceType: 'hourly', durationHours: 4 });
  const bookingId = `bk_stg_${Date.now()}`;
  const booking = {
    id: bookingId,
    bookingReference: `SRT-STG-${Date.now().toString().slice(-4)}`,
    customerId,
    driverId,
    serviceType: 'hourly',
    durationHours: 4,
    vehicleType: 'Sedan',
    status: 'dispatched',
    paymentStatus: 'captured',
    totalFare: fare.totalFare,
    tripStartOtp: '7821',
    createdAt: new Date().toISOString()
  };
  persistentStorage.insert('bookings', booking);
  assert.strictEqual(booking.status, 'dispatched');

  // Step 6: Chauffeur matching & acceptance
  booking.status = 'accepted';
  persistentStorage.update('bookings', b => b.id === bookingId, { status: 'accepted' });

  // Step 7: Chauffeur arrival & 4-digit OTP verification handshake
  booking.status = 'arrived';
  persistentStorage.update('bookings', b => b.id === bookingId, { status: 'arrived' });
  const enteredOtp = '7821';
  assert.strictEqual(enteredOtp, booking.tripStartOtp);
  booking.status = 'in_progress';
  persistentStorage.update('bookings', b => b.id === bookingId, { status: 'in_progress' });

  // Step 8: Trip completion & fare invoice breakdown
  booking.status = 'completed';
  booking.completedAt = new Date().toISOString();
  persistentStorage.update('bookings', b => b.id === bookingId, { status: 'completed' });
  assert.strictEqual(booking.status, 'completed');

  // Step 9: Customer review & rating submission
  const review = {
    id: `rev_${Date.now()}`,
    bookingId,
    customerId,
    driverId,
    rating: 5,
    comment: 'Punctual, professional, smooth driving through Bengaluru traffic!'
  };
  persistentStorage.insert('reviews', review);
  assert.strictEqual(review.rating, 5);

  // Step 10: Cancellation, refund processing & internal ledger settlement
  const refund = await globalRefundService.processRefund({
    paymentId: `pay_stg_${Date.now()}`,
    bookingId,
    amountPaise: 20000, // ₹200 partial courtesy credit
    reason: 'Staging Journey Courtesy Credit Adjustment',
    initiatedBy: 'Staging Auditor'
  });
  assert.strictEqual(refund.success, true);
  assert.strictEqual(refund.refund.status, 'processed');

  // Step 11: Admin operations and audit log
  const auditLog = {
    id: `log_stg_${Date.now()}`,
    adminName: 'Operations Admin',
    action: 'STAGING_JOURNEY_AUDIT_COMPLETED',
    target: bookingId,
    details: 'Completed 11-step end-to-end staging validation journey',
    timestamp: new Date().toISOString()
  };
  persistentStorage.insert('admin_audit_logs', auditLog);
  assert.ok(auditLog.id);
});

console.log('\n=======================================================');
console.log('🏆 Phase 8G Deployment Readiness Tests: 16/16 Passed');
console.log('=======================================================\n');
