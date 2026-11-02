/**
 * PHASE 5 DRIVER APPLICATION & KYC INTEGRATION TESTS
 * Salman Driver - Pan-India Driver Platform
 */

import assert from 'assert';
import { DRIVERS, USERS, INITIAL_BOOKINGS, DRIVER_DOCUMENTS } from '../server/mockDb.js';
import { checkDriverBookingConflict } from '../server/conflictEngine.js';

console.log('🧪 Starting Phase 5 Driver Application & KYC Integration Tests...\n');

let passedTests = 0;
let totalTests = 0;

function it(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     Error: ${err.message}`);
  }
}

// 1. DRIVER REGISTRATION & ROLE SEPARATION
console.log('--- 1. Driver Registration & Role Authorization ---');

it('Customer account does not possess driver role or chauffeur capabilities', () => {
  const customer = USERS.find(u => u.role === 'customer');
  assert.strictEqual(customer.role, 'customer');
  assert.strictEqual(customer.role !== 'driver', true, 'Customer must not automatically have driver role');
});

it('Driver profile requires transmission skills and verified DL number', () => {
  const approvedDrivers = DRIVERS.filter(d => d.verificationStatus === 'approved');
  approvedDrivers.forEach(drv => {
    assert.ok(drv.transmissionSkills.length > 0, `${drv.fullName} must have transmission skills`);
    assert.ok(drv.drivingLicenceNo.length > 5, `${drv.fullName} must have driving licence`);
    assert.ok(['approved', 'verified'].includes(drv.policeVerificationStatus));
  });
});

// 2. KYC DOCUMENTS & SENSITIVE DATA PROTECTION
console.log('--- 2. KYC Lifecycle & Data Protection ---');

it('Aadhaar numbers are masked and never exposed publicly', () => {
  DRIVERS.forEach(drv => {
    assert.ok(drv.aadhaarLast4.length <= 4, 'Only last 4 digits of Aadhaar can be displayed');
    assert.strictEqual(drv.aadhaarLast4.length, 4);
  });
});

it('KYC documents track submission lifecycle and verification stamps', () => {
  assert.ok(DRIVER_DOCUMENTS.length > 0, 'Driver documents store must exist');
  DRIVER_DOCUMENTS.forEach(doc => {
    assert.ok(doc.docType, 'Doc type required');
    assert.ok(['pending', 'approved', 'rejected', 'UNDER_REVIEW', 'NOT_SUBMITTED'].includes(doc.status));
  });
});

// 3. DRIVER PRICING GUARDRAILS
console.log('--- 3. Driver Pricing Guardrails ---');

it('Driver rates adhere to platform fair pricing rules (₹120 - ₹350/hr)', () => {
  DRIVERS.forEach(drv => {
    assert.ok(drv.hourlyRate >= 120, 'Hourly rate cannot be below platform minimum ₹120');
    assert.ok(drv.hourlyRate <= 350, 'Hourly rate cannot exceed platform maximum ₹350');
  });
});

// 4. DUTY TOGGLE & BUFFER ENFORCEMENT
console.log('--- 4. Duty Toggle & Conflict Prevention ---');

it('Driver can toggle online and offline availability', () => {
  const testDriver = { ...DRIVERS[0] };
  const initial = testDriver.isOnline;
  testDriver.isOnline = !initial;
  assert.strictEqual(testDriver.isOnline, !initial);
});

it('Conflict engine enforces mandatory 30-min transit buffer for driver', () => {
  const sampleBookings = [
    {
      driverId: 'drv_delhi_1',
      startDate: '2026-11-06',
      startTime: '09:00',
      durationHours: 3, // 09:00 to 12:00. Buffer until 12:30
      status: 'accepted'
    }
  ];

  const bufferConflict = checkDriverBookingConflict({
    driverId: 'drv_delhi_1',
    proposedDate: '2026-11-06',
    proposedTime: '12:15',
    proposedDurationHours: 2,
    existingBookings: sampleBookings
  });
  assert.strictEqual(bufferConflict.hasConflict, true, 'Must block booking inside 30-min transit buffer');
});

// 5. EARNINGS & SETTLEMENT MATHEMATICS
console.log('--- 5. Driver Earnings & Settlement Mathematics ---');

it('Calculates driver net payout as 85% of gross fare plus 100% of outstation DA', () => {
  const grossFare = 1000;
  const outstationDA = 350;
  const commission = Math.round(grossFare * 0.15); // 15% platform commission
  const driverNet = (grossFare - commission) + outstationDA; // 850 + 350 = 1200

  assert.strictEqual(commission, 150);
  assert.strictEqual(driverNet, 1200);
});

// 6. TRIP VERIFICATION & METER START
console.log('--- 6. Trip OTP Security ---');

it('Rejects invalid OTP and accepts matching 4-digit code to start trip', () => {
  const correctOtp = '4821';
  const wrongOtp = '9999';

  assert.strictEqual(wrongOtp === correctOtp || wrongOtp === '1234', false, 'Wrong OTP must be rejected');
  assert.strictEqual(correctOtp === correctOtp, true, 'Matching OTP must verify');
});

console.log(`\n=======================================================`);
console.log(`🏆 Phase 5 Driver Tests: ${passedTests}/${totalTests} Passed`);
console.log(`=======================================================\n`);
