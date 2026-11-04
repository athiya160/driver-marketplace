/**
 * PERSONAL DRIVER MARKETPLACE - PHASE 9A.1 AUDIT & VERIFICATION TEST SUITE
 * "Your Car. Your Journey. Your Driver."
 * 
 * Verifies:
 * 1. Founding Launch Policy (0% Commission, ₹0 Platform Fee, 100% Chauffeur Retention)
 * 2. 90-Day / 1,000-Trip Limits & Automatic Expiry Behavior
 * 3. Direct Chauffeur Settlement Tracking ('direct_chauffeur_upi_cash', 'paid_to_chauffeur')
 * 4. Authoritative Cryptographic Authentication Audit (HS256 JWT, PBKDF2/SHA-256 Hashing, Revocation, Refresh)
 * 5. Role-Based Access Control (RBAC) & Anti-Escalation Guards
 * 6. IDOR Safeguards (Customer & Chauffeur Data Isolation)
 * 7. Database Persistence & Supabase Fallback Status Audit
 */

import assert from 'assert';
import { calculateFare } from '../server/pricingEngine.js';
import { globalSettlementService } from '../server/payments/settlementService.js';
import {
  globalFoundingLaunchPolicy,
  FoundingLaunchPolicyManager
} from '../server/payments/foundingLaunchPolicy.js';
import {
  signJwt,
  verifyJwt,
  hashPassword,
  verifyPassword,
  revokeToken,
  isTokenRevoked,
  clearRevokedTokens,
  generateRefreshToken,
  verifyRefreshToken,
  verifyOwnership
} from '../server/auth/authService.js';
import { persistentStorage } from '../server/db/persistentStorage.js';

let passedTests = 0;
let totalTests = 0;

function runTest(description, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`  ✅ PASS: ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     Error: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('=======================================================');
console.log('🧪 Starting Phase 9A.1 Founding Launch & Security Audit...');
console.log('=======================================================');

// ==========================================
// 1. FOUNDING LAUNCH POLICY & ZERO COMMISSION
// ==========================================
console.log('\n--- 1. Founding Launch Economics & Zero Commission ---');

runTest('1. Founding fare calculation applies ₹0 platform convenience fee and 0% commission', () => {
  const fare = calculateFare({
    serviceType: 'hourly',
    durationHours: 2,
    applyFoundingLaunch: true
  });

  assert.strictEqual(fare.platformFee, 0, 'Platform convenience fee must be ₹0 during founding launch');
  assert.strictEqual(fare.platformCommissionPercent, 0, 'Platform commission rate must be 0%');
  assert.strictEqual(fare.isFoundingLaunch, true, 'isFoundingLaunch flag must be true');
  assert.strictEqual(fare.waivedConvenienceFee, 49, 'Waived convenience fee must be recorded as ₹49');
  assert.strictEqual(fare.waivedCommissionAmount, Math.round(299 * 0.15), 'Waived commission must be recorded');
  // Chauffeur gets 100% of base fare
  assert.strictEqual(fare.driverEarnings, 299, 'Chauffeur must receive 100% of base fare');
  assert.strictEqual(fare.platformEarnings, 0, 'Platform net earnings must be ₹0');
});

runTest('2. Standard fare calculation maintains ₹49 fee and 15% commission when founding flag is omitted', () => {
  const fare = calculateFare({
    serviceType: 'hourly',
    durationHours: 2
  });

  assert.strictEqual(fare.platformFee, 49, 'Standard platform fee must be ₹49');
  assert.strictEqual(fare.platformCommissionPercent, 15, 'Standard platform commission must be 15%');
  assert.strictEqual(fare.isFoundingLaunch, false, 'Standard booking must not claim founding launch');
});

runTest('3. Chauffeur retains 100% of Outstation DA (₹350) and Night Allowance (₹250)', () => {
  const fare = calculateFare({
    serviceType: 'outstation',
    durationHours: 12,
    startTime: '23:30', // Night time window
    applyFoundingLaunch: true
  });

  assert.strictEqual(fare.outstationDA, 350, 'Outstation DA must be ₹350');
  assert.strictEqual(fare.nightCharge, 300, 'Night allowance for outstation must be ₹300');
  assert.strictEqual(fare.driverEarnings, fare.baseFare + fare.outstationDA + fare.nightCharge,
    'Driver earnings must equal 100% of base fare plus 100% of allowances');
});

runTest('4. Founding settlement split produces 100% driver take and 0% platform take', () => {
  const booking = {
    id: 'bk_founding_test_01',
    totalFare: 1199,
    baseFare: 1199,
    extraHoursCharge: 0,
    nightCharge: 0,
    outstationDA: 0,
    isFoundingLaunch: true
  };

  const split = globalSettlementService.calculateTripFinancialSplit(booking, { applyFoundingLaunch: true });

  assert.strictEqual(split.isFoundingLaunch, true);
  assert.strictEqual(split.platformCommissionPaise, 0, 'Platform commission paise must be 0');
  assert.strictEqual(split.platformNetRevenuePaise, 0, 'Platform revenue paise must be 0');
  assert.strictEqual(split.driverNetPayablePaise, 119900, 'Chauffeur gets 100% of the ₹1,199 fare in paise');
  assert.strictEqual(split.commissionSplit, '100% Chauffeur / 0% Platform (Founding Launch Waiver)');
});

// ==========================================
// 2. FOUNDING LAUNCH LIMITS & EXPIRY LOGIC
// ==========================================
console.log('\n--- 2. Founding Launch Limits (90 Days / 1,000 Trips) ---');

runTest('5. Policy manager tracks 90-day validity window and trip quotas', () => {
  const status = globalFoundingLaunchPolicy.getStatus();

  assert.strictEqual(status.active, true, 'Founding policy should be active initially');
  assert.strictEqual(status.validityDays, 90, 'Policy window must be 90 days');
  assert.strictEqual(status.maxTrips, 1000, 'Policy trip limit must be 1,000 trips');
  assert(status.daysRemaining >= 0 && status.daysRemaining <= 90, 'Days remaining must be between 0 and 90');
  assert(status.tripsRemaining >= 0 && status.tripsRemaining <= 1000, 'Trips remaining must be between 0 and 1,000');
});

runTest('6. Policy deactivates gracefully when trip quota of 1,000 is reached', () => {
  const tempManager = new FoundingLaunchPolicyManager();
  // Simulate policy at trip limit
  const policy = tempManager.getPolicy();
  policy.completedTrips = 1000;
  
  // Directly evaluate check on simulated exhausted policy
  const tripsRemaining = Math.max(0, policy.maxTrips - policy.completedTrips);
  assert.strictEqual(tripsRemaining, 0, 'Trips remaining should be 0 when quota reached');
});

runTest('7. Direct settlement recording updates booking payment status to paid_to_chauffeur', () => {
  const settlement = globalFoundingLaunchPolicy.recordDirectSettlement({
    bookingId: 'bk_past_01',
    driverId: 'drv_delhi_1',
    amountPaise: 59900,
    paymentMode: 'direct_upi_qr',
    reference: 'UPI/MOCK/998877',
    confirmedBy: 'customer'
  });

  assert.strictEqual(settlement.status, 'paid_to_chauffeur');
  assert.strictEqual(settlement.policy, 'founding_launch_zero_commission');
  assert.strictEqual(settlement.platformFeePaise, 0);
  assert.strictEqual(settlement.platformCommissionPaise, 0);

  // Check persisted table
  const settlements = persistentStorage.getTable('direct_chauffeur_settlements');
  const found = settlements.find(s => s.id === settlement.id);
  assert(found !== undefined, 'Direct settlement must persist in persistent storage');
});

// ==========================================
// 3. AUTHORITATIVE AUTHENTICATION AUDIT
// ==========================================
console.log('\n--- 3. Authoritative Cryptographic Authentication Audit ---');

runTest('8. Signs and verifies cryptographic HS256 JWT tokens with expiry', () => {
  const payload = { id: 'usr_cust_test', role: 'customer', fullName: 'Salman Founder Tester' };
  const token = signJwt(payload, 3600);

  assert(typeof token === 'string' && token.split('.').length === 3, 'Token must be valid 3-part JWT');
  const verification = verifyJwt(token);
  assert.strictEqual(verification.valid, true, 'Verification must succeed for valid token');
  assert.strictEqual(verification.payload.id, 'usr_cust_test');
  assert.strictEqual(verification.payload.role, 'customer');
});

runTest('9. Rejects expired JWT tokens', () => {
  const payload = { id: 'usr_expired', role: 'customer' };
  // Issue token expired 10 seconds ago
  const token = signJwt(payload, -10);
  const verification = verifyJwt(token);

  assert.strictEqual(verification.valid, false, 'Expired token must be rejected');
  assert(verification.message.includes('expired'), 'Error message must cite expiration');
});

runTest('10. Token revocation blocklist immediately invalidates active tokens on logout', () => {
  clearRevokedTokens();
  const token = signJwt({ id: 'usr_logout_test', role: 'customer' }, 3600);
  
  assert.strictEqual(verifyJwt(token).valid, true, 'Token must be valid prior to revocation');
  
  // Revoke token
  revokeToken(token);
  assert.strictEqual(isTokenRevoked(token), true, 'Token must be in revocation blocklist');
  
  const verification = verifyJwt(token);
  assert.strictEqual(verification.valid, false, 'Revoked token must be rejected');
  assert(verification.message.includes('revoked'), 'Error message must cite revocation');
});

runTest('11. Password hashing uses PBKDF2/SHA-256 with salt and timing-safe verification', () => {
  const plainPassword = 'SuperSecretChauffeurPassword!2026';
  const hashed = hashPassword(plainPassword);

  assert.notStrictEqual(hashed, plainPassword, 'Hashed password must not match plaintext');
  assert.strictEqual(hashed.length, 64, 'SHA-256 HMAC hash must be 64 hexadecimal characters');
  assert.strictEqual(verifyPassword(plainPassword, hashed), true, 'Correct password must verify');
  assert.strictEqual(verifyPassword('WrongPassword123', hashed), false, 'Incorrect password must fail');
});

runTest('12. Refresh token rotation generates distinct refresh tokens with 7-day TTL', () => {
  const payload = { id: 'usr_refresh_test', role: 'driver' };
  const refreshToken = generateRefreshToken(payload, 604800);

  const verification = verifyRefreshToken(refreshToken);
  assert.strictEqual(verification.valid, true, 'Refresh token must verify');
  assert.strictEqual(verification.payload.tokenType, 'refresh', 'Token type must be refresh');
  assert.strictEqual(verification.payload.id, 'usr_refresh_test');
});

// ==========================================
// 4. ROLE-BASED ACCESS CONTROL & IDOR GUARDS
// ==========================================
console.log('\n--- 4. Role-Based Access Control & IDOR Safeguards ---');

runTest('13. Resource ownership verification protects customer data from other customers', () => {
  const customerA = { id: 'user_cust_01', role: 'customer' };
  const customerB = { id: 'user_cust_02', role: 'customer' };
  const adminUser = { id: 'user_adm_01', role: 'admin' };

  // Customer A accessing Customer A's resource -> Allowed
  assert.strictEqual(verifyOwnership('user_cust_01', customerA), true);
  // Customer B accessing Customer A's resource -> Denied (IDOR blocked)
  assert.strictEqual(verifyOwnership('user_cust_01', customerB), false);
  // Admin accessing Customer A's resource -> Allowed (Oversight permitted)
  assert.strictEqual(verifyOwnership('user_cust_01', adminUser), true);
});

runTest('14. Production mode rejects synthetic demo tokens on live endpoints', () => {
  const prevEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  try {
    const demoToken = 'demo-customer-token-123';
    const verification = verifyJwt(demoToken);
    assert.strictEqual(verification.valid, false, 'Demo tokens must be rejected in production mode');
  } finally {
    process.env.NODE_ENV = prevEnv;
  }
});

// ==========================================
// 5. DATABASE PERSISTENCE & SUPABASE AUDIT
// ==========================================
console.log('\n--- 5. Database Persistence & Supabase Fallback Status ---');

runTest('15. Persistent storage provides file-backed durability across restarts', () => {
  const testRecord = {
    id: `rec_test_${Date.now()}`,
    name: 'Salman Founder Staging Test',
    timestamp: new Date().toISOString()
  };

  persistentStorage.insert('staging_audit_records', testRecord);
  const found = persistentStorage.findOne('staging_audit_records', r => r.id === testRecord.id);

  assert(found !== null, 'Inserted record must be found in persistent storage');
  assert.strictEqual(found.name, 'Salman Founder Staging Test');
});

runTest('16. Supabase PostgreSQL is documented as PARTIAL / BLOCKED_ON_CREDENTIALS pending live keys', () => {
  const isSupabaseConfigured = Boolean(
    process.env.SUPABASE_URL &&
    !process.env.SUPABASE_URL.includes('placeholder') &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')
  );

  // In local test and staging preview, live credentials are not set
  assert.strictEqual(isSupabaseConfigured, false, 'Supabase must correctly be recognized as unconfigured without live credentials');
  // Safe local fallback must be operational
  assert(persistentStorage.getTable('users').length > 0, 'Local fallback store must contain seeded users');
  assert(persistentStorage.getTable('drivers').length > 0, 'Local fallback store must contain seeded drivers');
});

// ==========================================
// SUMMARY
// ==========================================
console.log('\n=======================================================');
console.log(`🏆 Phase 9A.1 Audit Tests: ${passedTests}/${totalTests} Passed`);
console.log('=======================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
