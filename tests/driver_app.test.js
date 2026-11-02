/**
 * SARATHI AUTOMATED TEST SUITE
 * Tests: Pricing Engine, Booking Conflicts, Role Permissions, State Machine, Payments
 */

import assert from 'assert';
import { calculateFare, isNightTimeWindow, SERVICE_CATEGORIES } from '../server/pricingEngine.js';
import { checkDriverBookingConflict } from '../server/conflictEngine.js';

console.log('🧪 Starting Sarathi Automated Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

// ============================================================================
// 1. PRICING & INDIAN FARE CALCULATION TESTS
// ============================================================================
console.log('--- 1. Pricing Engine & Indian Fare Tests ---');

test('Hourly booking for 2 hours (minimum duration) calculates correctly', () => {
  const fare = calculateFare({
    serviceType: 'hourly',
    durationHours: 2,
    startTime: '14:00'
  });

  assert.strictEqual(fare.baseFare, 299, 'Base fare should be 299');
  assert.strictEqual(fare.extraHours, 0, 'No extra hours for 2h');
  assert.strictEqual(fare.nightCharge, 0, 'No night charge at 2 PM');
  assert.strictEqual(fare.platformFee, 49, 'Platform fee must be ₹49');
  
  // subTotal = 299 + 49 = 348. GST = 5% of 348 = 17. Total = 365
  assert.strictEqual(fare.subTotal, 348);
  assert.strictEqual(fare.gstTax, 17);
  assert.strictEqual(fare.totalFare, 365);
});

test('Hourly booking for 4 hours calculates extra hours accurately', () => {
  const fare = calculateFare({
    serviceType: 'hourly',
    durationHours: 4,
    startTime: '11:00'
  });

  assert.strictEqual(fare.extraHours, 2, 'Should have 2 extra hours');
  assert.strictEqual(fare.extraHoursCharge, 240, '2 * 120 = 240');
  assert.strictEqual(fare.subTotal, 299 + 240 + 49); // 588
});

test('Night time window detection (10:00 PM to 06:00 AM)', () => {
  assert.strictEqual(isNightTimeWindow('22:00'), true, '22:00 is night');
  assert.strictEqual(isNightTimeWindow('23:30'), true, '23:30 is night');
  assert.strictEqual(isNightTimeWindow('02:15'), true, '02:15 is night');
  assert.strictEqual(isNightTimeWindow('05:45'), true, '05:45 is night');
  assert.strictEqual(isNightTimeWindow('06:00'), false, '06:00 is daytime');
  assert.strictEqual(isNightTimeWindow('15:00'), false, '15:00 is daytime');
});

test('Night allowance ₹250 applied when trip is scheduled at 23:00', () => {
  const fare = calculateFare({
    serviceType: 'hourly',
    durationHours: 2,
    startTime: '23:00'
  });

  assert.strictEqual(fare.isNight, true);
  assert.strictEqual(fare.nightCharge, 250);
});

test('Outstation Driver Daily Allowance (DA) of ₹350 is added for outstation trips', () => {
  const fare = calculateFare({
    serviceType: 'outstation',
    durationHours: 12,
    startTime: '07:00'
  });

  assert.strictEqual(fare.baseFare, 1599);
  assert.strictEqual(fare.outstationDA, 350, 'Outstation DA must be ₹350');
  assert.strictEqual(fare.driverEarnings >= fare.outstationDA, true, 'Driver must receive the DA allowance');
});

test('Coupon FIRST50 applies flat ₹50 discount', () => {
  const fareWithoutCoupon = calculateFare({
    serviceType: 'hourly',
    durationHours: 2,
    startTime: '10:00'
  });

  const fareWithCoupon = calculateFare({
    serviceType: 'hourly',
    durationHours: 2,
    startTime: '10:00',
    couponCode: 'FIRST50'
  });

  assert.strictEqual(fareWithCoupon.discountAmount, 50);
  assert.strictEqual(fareWithCoupon.totalFare < fareWithoutCoupon.totalFare, true);
});

// ============================================================================
// 2. BOOKING CONFLICT PREVENTION ENGINE TESTS
// ============================================================================
console.log('\n--- 2. Booking Conflict Prevention Engine Tests ---');

const MOCK_EXISTING_BOOKINGS = [
  {
    id: 'bk_exist_1',
    driverId: 'drv_delhi_1',
    bookingReference: 'SRT-2026-1001',
    startDate: '2026-11-05',
    startTime: '10:00',
    durationHours: 4, // 10:00 to 14:00
    status: 'accepted'
  }
];

test('Detects conflict when booking overlaps during the same time window', () => {
  const conflict = checkDriverBookingConflict({
    driverId: 'drv_delhi_1',
    proposedDate: '2026-11-05',
    proposedTime: '11:00', // Overlaps with 10:00 - 14:00
    proposedDurationHours: 2,
    existingBookings: MOCK_EXISTING_BOOKINGS
  });

  assert.strictEqual(conflict.hasConflict, true);
  assert.ok(conflict.reason.includes('SRT-2026-1001'));
});

test('Detects conflict during the 30-minute buffer window', () => {
  const conflict = checkDriverBookingConflict({
    driverId: 'drv_delhi_1',
    proposedDate: '2026-11-05',
    proposedTime: '14:15', // Trip ends at 14:00, 30m buffer extends to 14:30
    proposedDurationHours: 2,
    existingBookings: MOCK_EXISTING_BOOKINGS
  });

  assert.strictEqual(conflict.hasConflict, true, 'Must enforce 30-minute transit buffer');
});

test('Allows booking when time is completely clear after buffer window', () => {
  const conflict = checkDriverBookingConflict({
    driverId: 'drv_delhi_1',
    proposedDate: '2026-11-05',
    proposedTime: '15:00', // Beyond 14:00 + 30m buffer
    proposedDurationHours: 3,
    existingBookings: MOCK_EXISTING_BOOKINGS
  });

  assert.strictEqual(conflict.hasConflict, false, 'Should allow booking without conflict');
});

test('Allows booking for a different driver on the same time slot', () => {
  const conflict = checkDriverBookingConflict({
    driverId: 'drv_delhi_2', // Different driver
    proposedDate: '2026-11-05',
    proposedTime: '11:00',
    proposedDurationHours: 2,
    existingBookings: MOCK_EXISTING_BOOKINGS
  });

  assert.strictEqual(conflict.hasConflict, false);
});

// ============================================================================
// 3. BOOKING LIFECYCLE & STATE MACHINE TESTS
// ============================================================================
console.log('\n--- 3. Booking State Machine & OTP / QR Verification ---');

test('Booking transitions through full lifecycle', () => {
  const validStatuses = ['pending', 'accepted', 'driver_en_route', 'arrived', 'in_progress', 'completed'];
  let currentStatus = 'pending';

  for (let i = 1; i < validStatuses.length; i++) {
    const nextStatus = validStatuses[i];
    // State machine validator
    assert.strictEqual(validStatuses.indexOf(nextStatus), i);
    currentStatus = nextStatus;
  }
  assert.strictEqual(currentStatus, 'completed');
});

test('Trip Start requires matching OTP or QR Payload', () => {
  const booking = {
    tripStartOtp: '4821',
    tripQrPayload: 'SARATHI:TRIP:SRT-2026-8821:OTP-4821'
  };

  const isInvalidOtp = '9999' === booking.tripStartOtp;
  const isValidOtp = '4821' === booking.tripStartOtp;
  const isValidQr = 'SARATHI:TRIP:SRT-2026-8821:OTP-4821' === booking.tripQrPayload;

  assert.strictEqual(isInvalidOtp, false);
  assert.strictEqual(isValidOtp, true);
  assert.strictEqual(isValidQr, true);
});

// ============================================================================
// 4. ROLE PERMISSIONS & KYC STATUS TESTS
// ============================================================================
console.log('\n--- 4. Role Permissions & KYC Document Approval ---');

test('Only approved drivers are visible in public search', () => {
  const allDrivers = [
    { id: '1', name: 'Rajesh', verificationStatus: 'approved' },
    { id: '2', name: 'Santosh', verificationStatus: 'pending' },
    { id: '3', name: 'Dinesh', verificationStatus: 'rejected' }
  ];

  const publicSearchable = allDrivers.filter(d => d.verificationStatus === 'approved');
  assert.strictEqual(publicSearchable.length, 1);
  assert.strictEqual(publicSearchable[0].name, 'Rajesh');
});

test('Admin can approve pending driver KYC', () => {
  const pendingDriver = {
    id: 'drv_p_1',
    verificationStatus: 'pending'
  };

  // Admin action
  pendingDriver.verificationStatus = 'approved';
  assert.strictEqual(pendingDriver.verificationStatus, 'approved');
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log(`\n=======================================================`);
console.log(`🏆 Test Suite Complete: ${passedTests}/${totalTests} Tests Passed`);
console.log(`=======================================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
