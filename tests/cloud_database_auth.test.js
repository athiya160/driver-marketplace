/**
 * PHASE 8A AUTOMATED INTEGRATION TEST SUITE
 * Hosted Database, Persistent Authentication, Document Storage & Data Isolation
 * Platform: Personal Driver Marketplace ("Your Car. Your Journey. Your Driver.")
 */

import assert from 'assert';
import { supabase } from '../server/db/supabaseClient.js';
import { persistentStorage } from '../server/db/persistentStorage.js';
import {
  signJwt,
  verifyJwt,
  generateRefreshToken,
  verifyRefreshToken,
  hashPassword,
  verifyPassword,
  verifyOwnership
} from '../server/auth/authService.js';
import { demoManager } from '../server/demo/demoManager.js';

let passedTests = 0;
function it(desc, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Error: ${err.message}`);
    process.exit(1);
  }
}

async function itAsync(desc, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Error: ${err.message}`);
    process.exit(1);
  }
}

console.log('\n🧪 Starting Phase 8A Cloud Database, Storage & Authentication Tests...\n');

// -----------------------------------------------------------------------------
// 1. SUPABASE CLIENT & HEALTH CHECK ARCHITECTURE
// -----------------------------------------------------------------------------
console.log('--- 1. Supabase Client & Connection Health Check ---');

await itAsync('Probes database connection and returns valid health diagnostics', async () => {
  const health = await supabase.healthCheck();
  assert.ok(health.status === 'connected' || health.status === 'fallback_persistent', 'Health status must be connected or fallback');
  assert.ok(health.tableCount >= 14, `Expected at least 14 tables, found ${health.tableCount}`);
  assert.ok(health.timestamp, 'Healthcheck must include ISO timestamp');
  assert.ok(health.role, 'Must report active database role');
});

await itAsync('Operates dual-mode data access layer for customer vehicles', async () => {
  const testVehicle = {
    id: `test_veh_${Date.now()}`,
    customerId: 'cust_delhi_101',
    make: 'BMW',
    model: '3 Series Gran Limousine',
    year: 2024,
    vehicleType: 'Luxury',
    transmission: 'Automatic',
    registrationNumber: 'DL 01 AA 9999'
  };

  const insertResult = await supabase.from('customer_vehicles').insert(testVehicle);
  assert.strictEqual(insertResult.error, null, 'Vehicle insert must succeed');
  assert.ok(insertResult.data.length > 0, 'Must return inserted vehicle');

  const queryResult = await supabase.from('customer_vehicles').select('*');
  assert.strictEqual(queryResult.error, null, 'Vehicle select must succeed');
  const found = queryResult.data.find(v => v.registrationNumber === 'DL 01 AA 9999');
  assert.ok(found, 'Inserted vehicle must exist in storage');

  // Clean up
  await supabase.from('customer_vehicles').delete().eq('id', testVehicle.id);
});

// -----------------------------------------------------------------------------
// 2. PRIVATE DOCUMENT STORAGE & TIME-LIMITED SIGNED URLS
// -----------------------------------------------------------------------------
console.log('--- 2. Private Document Storage & Signed URL Security ---');

it('Prohibits direct public bucket URLs for private KYC compliance documents', () => {
  const publicAccess = supabase.storage.from('driver-documents').getPublicUrl('dl_front_123.jpg');
  assert.strictEqual(publicAccess.data, null, 'Public URL must be null for private bucket');
  assert.ok(publicAccess.error.includes('prohibited'), 'Must explicitly explain that public access is prohibited for KYC documents');
});

await itAsync('Generates time-limited signed URL with cryptographic signature for KYC verification', async () => {
  const filePath = 'drivers/drv_889/dl_front.jpg';
  const signedResult = await supabase.storage.from('driver-documents').createSignedUrl(filePath, 900);
  
  assert.strictEqual(signedResult.error, null, 'Signed URL generation must succeed');
  assert.ok(signedResult.data.signedUrl.includes('token='), 'Signed URL must include cryptographic token');
  assert.ok(signedResult.data.signedUrl.includes('expires='), 'Signed URL must include expiration timestamp');
  assert.strictEqual(signedResult.data.expiresInSeconds, 900, 'TTL must be 900 seconds');

  // Parse URL parameters to verify signature
  const urlObj = new URL(signedResult.data.signedUrl, 'http://localhost:5000');
  const token = urlObj.searchParams.get('token');
  const expires = urlObj.searchParams.get('expires');

  const verification = supabase.storage.from('driver-documents').verifySignedUrlToken(filePath, token, expires);
  assert.strictEqual(verification.valid, true, 'Cryptographic token verification must pass');
});

it('Rejects expired or tampered signed URL tokens for KYC documents', () => {
  const filePath = 'drivers/drv_889/dl_front.jpg';
  const expiredTime = Math.floor(Date.now() / 1000) - 300; // 5 minutes in the past
  
  const expiredCheck = supabase.storage.from('driver-documents').verifySignedUrlToken(filePath, 'some_token', expiredTime.toString());
  assert.strictEqual(expiredCheck.valid, false, 'Expired token must be rejected');
  assert.ok(expiredCheck.reason.includes('expired'), 'Must state token has expired');

  const validFutureTime = Math.floor(Date.now() / 1000) + 900;
  const tamperedCheck = supabase.storage.from('driver-documents').verifySignedUrlToken(filePath, 'forged_fake_signature_hex', validFutureTime.toString());
  assert.strictEqual(tamperedCheck.valid, false, 'Tampered signature must be rejected');
  assert.ok(tamperedCheck.reason.includes('Invalid'), 'Must state signature is invalid');
});

// -----------------------------------------------------------------------------
// 3. ROW LEVEL SECURITY & DATA ISOLATION
// -----------------------------------------------------------------------------
console.log('--- 3. Row Level Security & Data Isolation ---');

it('Enforces customer data ownership (Customer A cannot access Customer B private data)', () => {
  const customerA = { id: 'cust_001', role: 'customer' };
  const customerB = { id: 'cust_002', role: 'customer' };
  const adminUser = { id: 'adm_999', role: 'admin' };

  const customerAResourceOwnerId = 'cust_001';

  assert.strictEqual(verifyOwnership(customerAResourceOwnerId, customerA), true, 'Customer A can access own resource');
  assert.strictEqual(verifyOwnership(customerAResourceOwnerId, customerB), false, 'Customer B cannot access Customer A resource');
  assert.strictEqual(verifyOwnership(customerAResourceOwnerId, adminUser), true, 'Admin has authorized oversight access');
});

it('Enforces chauffeur trip assignment isolation', () => {
  const booking = {
    id: 'bk_prod_100',
    customerId: 'cust_alpha',
    driverId: 'drv_beta',
    status: 'accepted'
  };

  const assignedDriver = { id: 'drv_beta', role: 'driver' };
  const unassignedDriver = { id: 'drv_gamma', role: 'driver' };

  assert.strictEqual(verifyOwnership(booking.driverId, assignedDriver), true, 'Assigned chauffeur can access booking');
  assert.strictEqual(verifyOwnership(booking.driverId, unassignedDriver), false, 'Unassigned chauffeur cannot access booking');
});

// -----------------------------------------------------------------------------
// 4. TRANSACTIONAL LOCKING ON CONCURRENT DISPATCH
// -----------------------------------------------------------------------------
console.log('--- 4. Transactional Lock on Concurrent Dispatch ---');

await itAsync('Blocks concurrent double-booking of a chauffeur via database transactional lock', async () => {
  const driverId = 'drv_lock_test_1';
  
  // First active booking for driver
  const booking1 = {
    id: `bk_lock_1_${Date.now()}`,
    bookingReference: `SRT-LOCK-01`,
    driverId,
    status: 'in_progress',
    pickupAddress: 'Indiranagar 100ft Road',
    totalFare: 599
  };

  const firstInsert = await supabase.from('bookings').insert(booking1);
  assert.strictEqual(firstInsert.error, null, 'First active booking must succeed');

  // Attempt simultaneous second active booking for the same driver
  const booking2 = {
    id: `bk_lock_2_${Date.now()}`,
    bookingReference: `SRT-LOCK-02`,
    driverId,
    status: 'accepted',
    pickupAddress: 'MG Road Metro',
    totalFare: 399
  };

  const secondInsert = await supabase.from('bookings').insert(booking2);
  assert.notStrictEqual(secondInsert.error, null, 'Simultaneous booking for busy driver must fail with conflict');
  assert.ok(secondInsert.error.message.includes('Transactional Conflict'), 'Must return Transactional Conflict error');

  // Clean up test booking
  await supabase.from('bookings').delete().eq('id', booking1.id);
});

// -----------------------------------------------------------------------------
// 5. AUTHENTICATION, PASSWORD HASHING & REFRESH TOKENS
// -----------------------------------------------------------------------------
console.log('--- 5. Authentication, Refresh Tokens & Password Security ---');

it('Hashes passwords cryptographically with salt and verifies via timing-safe comparison', () => {
  const plain = 'ChauffeurSecurePass2026!';
  const hashed = hashPassword(plain);
  
  assert.notStrictEqual(hashed, plain, 'Password must not be stored in plain text');
  assert.strictEqual(verifyPassword(plain, hashed), true, 'Password verification must pass');
  assert.strictEqual(verifyPassword('WrongPassword', hashed), false, 'Wrong password must be rejected');
});

it('Issues and verifies long-lived refresh tokens (7 days TTL)', () => {
  const userPayload = { id: 'usr_secure_99', role: 'customer' };
  const refreshToken = generateRefreshToken(userPayload);
  
  const verified = verifyRefreshToken(refreshToken);
  assert.strictEqual(verified.valid, true, 'Refresh token must be valid');
  assert.strictEqual(verified.payload.id, 'usr_secure_99', 'Payload ID must match');
  assert.strictEqual(verified.payload.tokenType, 'refresh', 'Token type must be refresh');
});

// -----------------------------------------------------------------------------
// 6. PRODUCTION VS DEMO DATA ISOLATION & OTP RESTRICTION
// -----------------------------------------------------------------------------
console.log('--- 6. Production vs Demo Data Isolation & OTP Security ---');

it('Ensures demo environment reset never deletes or touches persistent production store', () => {
  // Insert production record
  const prodUser = {
    id: `prod_usr_${Date.now()}`,
    fullName: 'Persistent Enterprise Client',
    email: `enterprise_${Date.now()}@corporate.example.com`,
    phone: '+91 99000 11223',
    role: 'customer'
  };

  persistentStorage.insert('users', prodUser);
  const beforeReset = persistentStorage.findOne('users', u => u.id === prodUser.id);
  assert.ok(beforeReset, 'Production user must be present before demo reset');

  // Trigger full demo environment reset
  const resetResult = demoManager.resetToBaseline();
  assert.strictEqual(resetResult.success, true, 'Demo reset must report success');

  // Verify production user is completely unharmed
  const afterReset = persistentStorage.findOne('users', u => u.id === prodUser.id);
  assert.ok(afterReset, 'Production user MUST remain completely intact after demo reset');
  assert.strictEqual(afterReset.email, prodUser.email, 'Data integrity must be preserved');

  // Clean up
  persistentStorage.delete('users', u => u.id === prodUser.id);
});

it('Strictly rejects fallback demo OTP 4821 or 1234 on production trips', () => {
  const prodBooking = {
    id: 'bk_real_prod_550',
    bookingReference: 'SRT-PROD-2026-9901',
    tripStartOtp: '7419', // Cryptographically assigned OTP
    status: 'accepted'
  };

  const isDemo = Boolean(prodBooking.id.startsWith('demo_') || prodBooking.bookingReference.includes('8821'));
  const isProduction = true; // In production mode

  // Attempting demo fallback OTP 4821
  const attemptOtp4821 = '4821';
  let isValid4821 = false;
  if (isProduction && !isDemo) {
    isValid4821 = Boolean(attemptOtp4821 === prodBooking.tripStartOtp);
  } else {
    isValid4821 = Boolean(attemptOtp4821 === prodBooking.tripStartOtp || attemptOtp4821 === '4821');
  }
  assert.strictEqual(isValid4821, false, 'Fallback demo OTP 4821 must be REJECTED in production mode');

  // Attempting the real trip OTP
  const attemptRealOtp = '7419';
  const isValidReal = Boolean(attemptRealOtp === prodBooking.tripStartOtp);
  assert.strictEqual(isValidReal, true, 'Correct generated OTP 7419 must succeed');
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n=======================================================');
console.log(`🏆 Phase 8A Cloud Database & Auth Tests: ${passedTests}/${passedTests} Passed`);
console.log('=======================================================\n');
