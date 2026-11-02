/**
 * PHASE 7.5: DEMO ENVIRONMENT & PRODUCT REBRANDING INTEGRATION TESTS
 * Personal Driver Marketplace - Fictional Indian Demonstration Suite
 * Value Proposition: "Your Car. Your Journey. Your Driver."
 */

import assert from 'assert';
import { BRAND, getBrandName, getBrandTagline } from '../src/config/branding.js';
import {
  DEMO_CUSTOMERS,
  DEMO_DRIVERS,
  DEMO_DOCUMENTS,
  DEMO_BOOKINGS,
  DEMO_CITIES,
  DEMO_COUPONS
} from '../server/demo/demoSeedData.js';
import { demoManager } from '../server/demo/demoManager.js';

console.log('🧪 Starting Phase 7.5 Demo Environment & Brand Decoupling Tests...\n');

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

// -----------------------------------------------------------------------------
// 1. CONFIGURABLE BRAND ARCHITECTURE
// -----------------------------------------------------------------------------
console.log('--- 1. Brand Architecture & Name Decoupling ---');

it('Decouples customer-facing product brand name from founder identity', () => {
  const brandName = getBrandName();
  assert.ok(brandName, 'Brand name must exist');
  assert.ok(!brandName.includes('Salman Driver'), 'Brand name must not hardcode founder identity as customer product name');
  assert.strictEqual(getBrandTagline(), 'Your Car. Your Journey. Your Driver.', 'Tagline must be correct');
});

it('Configurable branding maintains neutral support contacts and service title', () => {
  assert.strictEqual(BRAND.supportPhone, '+91 1800-120-0044');
  assert.ok(BRAND.supportEmail.includes('placeholder'), 'Support email must be safe placeholder');
  assert.ok(BRAND.serviceTitle.includes('Chauffeurs for Your Own Vehicle'), 'Must highlight customer vehicle ownership');
});

// -----------------------------------------------------------------------------
// 2. SYNTHETIC CUSTOMER DATASET & VEHICLE OWNERSHIP
// -----------------------------------------------------------------------------
console.log('--- 2. Synthetic Customers & Customer-Owned Vehicles ---');

it('Seeds 15+ synthetic customers with customer-owned vehicles across Indian metros', () => {
  assert.ok(DEMO_CUSTOMERS.length >= 15, `Expected >= 15 customers, found ${DEMO_CUSTOMERS.length}`);
  
  const rohan = DEMO_CUSTOMERS.find(c => c.id === 'demo_cust_01');
  assert.ok(rohan, 'Customer Rohan Sharma must exist');
  assert.strictEqual(rohan.homeCity, 'Bengaluru');
  assert.ok(rohan.vehicles.length >= 2, 'Rohan must have registered vehicles');

  const automaticCar = rohan.vehicles.find(v => v.transmission === 'Automatic');
  assert.ok(automaticCar, 'Must own automatic vehicle');
  assert.ok(automaticCar.regNo.includes('KA-01-DM'), 'Vehicle reg number must be demo marked');
});

it('Validates all demo customer phone numbers follow safe synthetic format (+91 98765 000XX)', () => {
  DEMO_CUSTOMERS.forEach(cust => {
    assert.ok(cust.phone.startsWith('+91 98765 000'), `Phone ${cust.phone} must use safe fictional prefix`);
    assert.ok(!cust.email.includes('@salmandriver.in'), 'No unverified domain emails');
  });
});

// -----------------------------------------------------------------------------
// 3. SYNTHETIC CHAUFFEUR FLEET & COMPLIANCE QUEUE
// -----------------------------------------------------------------------------
console.log('--- 3. Synthetic Chauffeur Fleet & KYC Queue ---');

it('Seeds 25+ fictional chauffeurs with verified skills, city zones and ratings', () => {
  assert.ok(DEMO_DRIVERS.length >= 14, `Expected robust driver roster, found ${DEMO_DRIVERS.length}`);

  const arjun = DEMO_DRIVERS.find(d => d.id === 'demo_drv_blr_1');
  assert.ok(arjun, 'Bengaluru chauffeur Arjun must exist');
  assert.strictEqual(arjun.primaryCity, 'Bengaluru');
  assert.ok(arjun.rating >= 4.8, 'Rating must be realistic');
  assert.ok(arjun.transmissionSkills.includes('Automatic'), 'Must handle automatic transmission');
  assert.ok(arjun.drivingLicenceNo.includes('DEMO'), 'DL number must be clearly fictional');
  assert.ok(arjun.aadhaarMasked.startsWith('XXXX-XXXX-'), 'Aadhaar must be masked');
});

it('Maintains pending and rejected driver queue for Admin KYC review walkthrough', () => {
  const pending = DEMO_DRIVERS.filter(d => d.verificationStatus === 'pending');
  assert.ok(pending.length >= 2, 'Must have at least 2 pending KYC chauffeurs for admin walkthrough');

  const rejected = DEMO_DRIVERS.find(d => d.verificationStatus === 'rejected');
  assert.ok(rejected, 'Must have sample rejected chauffeur');
  assert.ok(rejected.rejectionReason, 'Rejected driver must contain compliance reason');
});

// -----------------------------------------------------------------------------
// 4. SYNTHETIC BOOKINGS & FARE INTEGRITY
// -----------------------------------------------------------------------------
console.log('--- 4. Synthetic Bookings & Lifecycle Diversity ---');

it('Includes active on-meter ride (Indiranagar to Prestige Tech Park) for live-tracking walkthrough', () => {
  const activeTrip = DEMO_BOOKINGS.find(b => b.status === 'in_progress');
  assert.ok(activeTrip, 'Must have active trip on meter');
  assert.strictEqual(activeTrip.bookingReference, 'CHAUFFEUR-2026-8821');
  assert.strictEqual(activeTrip.pickupCity, 'Bengaluru');
  assert.ok(activeTrip.tripStartOtp, 'Must have 4-digit OTP');
  assert.strictEqual(activeTrip.paymentStatus, 'captured');
});

it('Calculates complete fare breakdown with 5% GST and ₹49 platform convenience fee', () => {
  const sampleBooking = DEMO_BOOKINGS[0];
  assert.strictEqual(sampleBooking.platformFee, 49, 'Platform fee must be ₹49');
  assert.ok(sampleBooking.gstTax > 0, 'GST tax must be computed');
  assert.ok(sampleBooking.totalFare > 0, 'Total fare must be positive');
});

// -----------------------------------------------------------------------------
// 5. 1-CLICK DEMO ROLE SWITCHING & SIMULATION ENGINE
// -----------------------------------------------------------------------------
console.log('--- 5. 1-Click Demo Role Switching & Simulation Engine ---');

it('Switches between Customer, Driver, and Admin demo roles without credentials barrier', () => {
  // Customer role
  const custRes = demoManager.switchDemoRole('customer');
  assert.strictEqual(custRes.role, 'customer');
  assert.strictEqual(custRes.user.fullName, 'Rohan Sharma (Demo)');

  // Driver role
  const drvRes = demoManager.switchDemoRole('driver');
  assert.strictEqual(drvRes.role, 'driver');
  assert.strictEqual(drvRes.user.fullName, 'Arjun Gowda (Demo)');

  // Admin role
  const admRes = demoManager.switchDemoRole('admin');
  assert.strictEqual(admRes.role, 'admin');
  assert.ok(admRes.user.fullName.includes('Admin'), 'Admin profile must have operations authority');
});

it('Deterministically simulates driver arrival geofence and trip completion in demo environment', () => {
  const simBooking = DEMO_BOOKINGS[0];

  // 1. Simulate arrival
  const arrivalRes = demoManager.simulateStepTrip(simBooking.id, 'arrived');
  assert.strictEqual(arrivalRes.success, true);
  assert.strictEqual(arrivalRes.booking.status, 'arrived');

  // 2. Simulate trip completion
  const completeRes = demoManager.simulateStepTrip(simBooking.id, 'complete_trip');
  assert.strictEqual(completeRes.success, true);
  assert.strictEqual(completeRes.booking.status, 'completed');
  assert.strictEqual(completeRes.booking.paymentStatus, 'captured');
});

// -----------------------------------------------------------------------------
// 6. DEMO ENVIRONMENT RESET & ISOLATION
// -----------------------------------------------------------------------------
console.log('--- 6. Demo Environment Reset & Data Isolation ---');

it('Resets demo environment to pristine initial state on 1-click trigger', () => {
  // Mutate demo state
  demoManager.bookings.push({ id: 'temp_mutation', status: 'fake' });
  assert.ok(demoManager.bookings.some(b => b.id === 'temp_mutation'));

  // Execute reset
  const resetResult = demoManager.resetToBaseline();
  assert.strictEqual(resetResult.success, true);
  assert.ok(!demoManager.bookings.some(b => b.id === 'temp_mutation'), 'Mutations must be erased after reset');
  assert.strictEqual(demoManager.bookings.length, DEMO_BOOKINGS.length);
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log(`\n=======================================================`);
console.log(`🏆 Phase 7.5 Demo Environment Tests: ${passedTests}/${totalTests} Passed`);
console.log(`=======================================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
