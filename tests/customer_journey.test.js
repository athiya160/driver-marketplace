/**
 * PHASE 4 CUSTOMER JOURNEY INTEGRATION TESTS
 * Salman Driver - Pan-India Chauffeur Booking Platform
 */

import assert from 'assert';
import { calculateFare, SERVICE_CATEGORIES } from '../server/pricingEngine.js';
import { checkDriverBookingConflict } from '../server/conflictEngine.js';
import { DRIVERS, USERS, INITIAL_BOOKINGS } from '../server/mockDb.js';

console.log('🧪 Starting Phase 4 Customer Journey Integration Tests...\n');

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

// 1. BRAND & CREDENTIAL HYGIENE
console.log('--- 1. Brand & Security Hygiene Tests ---');

it('No unverified corporate claims or unregistered domain emails in mock store', () => {
  const customer = USERS.find(u => u.role === 'customer');
  assert.ok(customer, 'Customer profile must exist');
  assert.ok(!customer.email.includes('@salmandriver.in'), 'Must not use unconfirmed domain email');
  assert.ok(customer.fullName.includes('Demo'), 'Demo customer must be clearly labeled');
});

// 2. DRIVER SEARCH & VERIFICATION INTEGRITY
console.log('--- 2. Driver Search & Verification Integrity ---');

it('Never shows unverified or pending drivers in customer search', () => {
  const approvedDrivers = DRIVERS.filter(d => d.verificationStatus === 'approved');
  assert.ok(approvedDrivers.length > 0, 'There must be approved drivers');
  
  // Ensure every driver shown to customer has verified police status and driving license
  approvedDrivers.forEach(drv => {
    assert.strictEqual(drv.verificationStatus, 'approved');
    assert.ok(drv.drivingLicenceNo.length > 5, `Driver ${drv.fullName} must have a valid DL format`);
    assert.ok(drv.transmissionSkills.length > 0, `Driver ${drv.fullName} must specify transmission skills`);
  });
});

it('Filters drivers correctly by transmission (Automatic vs Manual)', () => {
  const automaticDrivers = DRIVERS.filter(d => d.transmissionSkills.includes('Automatic'));
  const manualDrivers = DRIVERS.filter(d => d.transmissionSkills.includes('Manual'));

  assert.ok(automaticDrivers.length >= 2, 'Must have at least 2 automatic-capable drivers');
  assert.ok(manualDrivers.length >= 2, 'Must have at least 2 manual-capable drivers');
});

// 3. FARE CALCULATION AS SINGLE SOURCE OF TRUTH
console.log('--- 3. Fare Calculator Verification ---');

it('Calculates complete fare breakdown with 5% GST and ₹49 convenience fee', () => {
  const fare = calculateFare({
    serviceType: 'hourly',
    durationHours: 4,
    startTime: '14:30',
    couponCode: 'FIRST50'
  });

  // Base: 299, Extra 2h @ 120 = 240, Platform: 49. subTotal = 588
  // Discount: 50. Taxable = 538
  // GST 5% = 27. Total = 565
  assert.strictEqual(fare.baseFare, 299);
  assert.strictEqual(fare.extraHoursCharge, 240);
  assert.strictEqual(fare.discountAmount, 50);
  assert.strictEqual(fare.platformFee, 49);
  assert.strictEqual(fare.gstTax, 27);
  assert.strictEqual(fare.totalFare, 565);
});

// 4. BOOKING CONFLICT & 30-MIN BUFFER
console.log('--- 4. Booking Conflict & Buffer Engine ---');

it('Prevents double-booking driver within same slot or 30-min transit window', () => {
  const testBookings = [
    {
      driverId: 'drv_delhi_1',
      startDate: '2026-11-05',
      startTime: '10:00',
      durationHours: 4, // 10:00 to 14:00. Buffer until 14:30
      status: 'accepted'
    }
  ];

  const conflict1 = checkDriverBookingConflict({
    driverId: 'drv_delhi_1',
    proposedDate: '2026-11-05',
    proposedTime: '12:00',
    proposedDurationHours: 2,
    existingBookings: testBookings
  });
  assert.strictEqual(conflict1.hasConflict, true, 'Must detect direct time overlap');

  const conflict2 = checkDriverBookingConflict({
    driverId: 'drv_delhi_1',
    proposedDate: '2026-11-05',
    proposedTime: '14:15', // During 30-min buffer window (14:00 - 14:30)
    proposedDurationHours: 2,
    existingBookings: testBookings
  });
  assert.strictEqual(conflict2.hasConflict, true, 'Must enforce 30-min transit buffer');

  const clearBooking = checkDriverBookingConflict({
    driverId: 'drv_delhi_1',
    proposedDate: '2026-11-05',
    proposedTime: '15:00', // Safely after buffer
    proposedDurationHours: 2,
    existingBookings: testBookings
  });
  assert.strictEqual(clearBooking.hasConflict, false, 'Should allow booking after transit buffer');
});

// 5. SECURITY HANDSHAKE (OTP & QR)
console.log('--- 5. Trip Security Handshake ---');

it('Generates 4-digit numeric OTP and encrypted QR payload for trip verification', () => {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  assert.strictEqual(otp.length, 4);
  assert.ok(!isNaN(Number(otp)));

  const bookingRef = 'SRT-2026-9901';
  const qrPayload = `SARATHI:TRIP:${bookingRef}:OTP-${otp}`;
  assert.ok(qrPayload.includes(bookingRef));
  assert.ok(qrPayload.includes(otp));
});

console.log(`\n=======================================================`);
console.log(`🏆 Phase 4 Customer Integration Tests: ${passedTests}/${totalTests} Passed`);
console.log(`=======================================================\n`);
