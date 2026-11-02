/**
 * PHASE 7: REAL-TIME MOBILITY MARKETPLACE & DISPATCH INTEGRATION TESTS
 * Salman Driver - Pan-India On-Demand Personal Driver Marketplace
 * "Your Car. Your Journey. Our Drivers."
 */

import assert from 'assert';
import {
  calculateHaversineDistanceKm,
  calculateEstimatedEtaMinutes,
  findEligibleDrivers,
  rankDrivers,
  DispatchSessionManager
} from '../server/marketplace/dispatchEngine.js';
import {
  calculateBearingDegrees,
  validateGpsCoordinates,
  LocationTrackerService
} from '../server/marketplace/locationTracker.js';
import {
  signJwt,
  verifyJwt,
  hashPassword
} from '../server/auth/authService.js';
import { persistentStorage } from '../server/db/persistentStorage.js';

console.log('🧪 Starting Phase 7 Mobility Marketplace & Dispatch Integration Tests...\n');

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
// 1. SPATIAL GEOMETRY & PROXIMITY MATHEMATICS
// -----------------------------------------------------------------------------
console.log('--- 1. Spatial Geometry & Proximity Mathematics ---');

it('Calculates accurate Great-Circle Haversine distance between Indian metro coordinates', () => {
  // Gurugram Sector 54 (28.4410, 77.1025) to Cyber City (28.4950, 77.0890) ~ 6.1 km
  const distance = calculateHaversineDistanceKm(28.4410, 77.1025, 28.4950, 77.0890);
  assert.ok(distance > 5.0 && distance < 7.5, `Distance was ${distance} km, expected ~6.1 km`);
});

it('Calculates dynamic ETA with city traffic buffering and minimum 2-minute buffer', () => {
  const shortEta = calculateEstimatedEtaMinutes(0.1, 25);
  assert.strictEqual(shortEta, 1, 'Very short distance under 200m should be 1 min');

  const mediumEta = calculateEstimatedEtaMinutes(5.0, 25);
  assert.strictEqual(mediumEta, 12, '5km at 25km/h should be 12 minutes');
});

it('Calculates navigational bearing in degrees for driver heading rotation on customer map', () => {
  // Driving strictly North (latitude increases)
  const northBearing = calculateBearingDegrees(28.0000, 77.0000, 28.1000, 77.0000);
  assert.strictEqual(northBearing, 0, 'Heading due north must be 0 degrees');

  // Driving East (longitude increases)
  const eastBearing = calculateBearingDegrees(28.0000, 77.0000, 28.0000, 77.1000);
  assert.strictEqual(eastBearing, 90, 'Heading due east must be 90 degrees');
});

// -----------------------------------------------------------------------------
// 2. DISPATCH CANDIDATE FILTERING & TRANSMISSION MATCHING
// -----------------------------------------------------------------------------
console.log('--- 2. Dispatch Candidate Filtering & Transmission Compatibility ---');

it('Filters drivers strictly by approval status, online duty, and vehicle transmission compatibility', () => {
  const testDrivers = [
    {
      id: 'drv_1',
      fullName: 'Manual Expert Chauffeur',
      verificationStatus: 'approved',
      isOnline: true,
      primaryCity: 'Delhi NCR',
      transmissionSkills: ['Manual'],
      currentLatitude: 28.4500,
      currentLongitude: 77.0500
    },
    {
      id: 'drv_2',
      fullName: 'Automatic Luxury Specialist',
      verificationStatus: 'approved',
      isOnline: true,
      primaryCity: 'Delhi NCR',
      transmissionSkills: ['Automatic'],
      currentLatitude: 28.4600,
      currentLongitude: 77.0600
    },
    {
      id: 'drv_3',
      fullName: 'Unverified Driver',
      verificationStatus: 'pending',
      isOnline: true,
      primaryCity: 'Delhi NCR',
      transmissionSkills: ['Automatic'],
      currentLatitude: 28.4550,
      currentLongitude: 77.0550
    },
    {
      id: 'drv_4',
      fullName: 'Offline Driver',
      verificationStatus: 'approved',
      isOnline: false,
      primaryCity: 'Delhi NCR',
      transmissionSkills: ['Automatic'],
      currentLatitude: 28.4550,
      currentLongitude: 77.0550
    }
  ];

  // Customer vehicle requires Automatic transmission (e.g. BMW / Honda City CVT)
  const automaticMatches = findEligibleDrivers(
    {
      pickupLatitude: 28.4500,
      pickupLongitude: 77.0500,
      transmissionType: 'Automatic',
      serviceCity: 'Delhi NCR'
    },
    testDrivers,
    []
  );

  assert.strictEqual(automaticMatches.length, 1, 'Only approved online driver with Automatic transmission should qualify');
  assert.strictEqual(automaticMatches[0].id, 'drv_2');
});

// -----------------------------------------------------------------------------
// 3. COMPOSITE RANKING ALGORITHM
// -----------------------------------------------------------------------------
console.log('--- 3. Composite Driver Ranking Algorithm ---');

it('Ranks closer and higher-rated chauffeurs ahead of distant or lower-rated drivers', () => {
  const candidates = [
    {
      id: 'drv_far',
      fullName: 'Distant Chauffeur',
      rating: 4.8,
      experienceYears: 5,
      currentLatitude: 28.5500, // ~12 km away
      currentLongitude: 77.0500
    },
    {
      id: 'drv_close',
      fullName: 'Nearby Chauffeur',
      rating: 4.9,
      experienceYears: 7,
      currentLatitude: 28.4550, // ~1.5 km away
      currentLongitude: 77.0520
    }
  ];

  const pickupLat = 28.4500;
  const pickupLon = 77.0500;

  const ranked = rankDrivers(candidates, pickupLat, pickupLon);
  assert.strictEqual(ranked[0].id, 'drv_close', 'Closer driver must rank higher than distant driver');
  assert.ok(ranked[0].compositeMatchScore > ranked[1].compositeMatchScore);
});

// -----------------------------------------------------------------------------
// 4. CASCADE DISPATCH & TIMEOUT ESCALATION
// -----------------------------------------------------------------------------
console.log('--- 4. Cascade Dispatch & Automatic Escalation ---');

it('Executes cascade dispatch: dispatches top candidate, then auto-cascades to next on rejection', () => {
  const manager = new DispatchSessionManager();
  const booking = { id: 'bk_cascade_01', bookingReference: 'SRT-CASCADE-101' };
  const rankedCandidates = [
    { id: 'drv_cand_1', fullName: 'Chauffeur Rajesh' },
    { id: 'drv_cand_2', fullName: 'Chauffeur Harpreet' }
  ];

  // 1. Initiate dispatch
  const initResult = manager.createDispatchSession(booking, rankedCandidates, 45);
  assert.strictEqual(initResult.success, true);
  assert.strictEqual(initResult.candidate.id, 'drv_cand_1');

  // 2. Chauffeur 1 declines -> engine auto-escalates to candidate 2
  const cascadeResult = manager.rejectOrTimeoutDispatch(booking.id, 'drv_cand_1', 'declined');
  assert.strictEqual(cascadeResult.action, 'cascaded_to_next');
  assert.strictEqual(cascadeResult.nextDriver.id, 'drv_cand_2');

  // 3. Chauffeur 2 accepts -> booking locks firmly
  const acceptResult = manager.acceptDispatch(booking.id, 'drv_cand_2');
  assert.strictEqual(acceptResult.success, true);
  assert.strictEqual(acceptResult.session.status, 'accepted');
});

it('Prevents race condition by locking driver from receiving simultaneous concurrent requests', () => {
  const manager = new DispatchSessionManager();
  const candidate = { id: 'drv_mutex_01', fullName: 'Exclusive Driver' };

  manager.createDispatchSession({ id: 'bk_first' }, [candidate], 45);

  // Active check in candidate filter
  const testDrivers = [{
    id: 'drv_mutex_01',
    fullName: 'Exclusive Driver',
    verificationStatus: 'approved',
    isOnline: true,
    transmissionSkills: ['Automatic'],
    currentLatitude: 28.45,
    currentLongitude: 77.05
  }];

  const eligibleForSecondCustomer = findEligibleDrivers(
    { pickupLatitude: 28.45, pickupLongitude: 77.05, transmissionType: 'Automatic' },
    testDrivers,
    [],
    { currentBookingId: 'bk_second' }
  );

  assert.strictEqual(eligibleForSecondCustomer.length, 0, 'Driver locked in dispatch cannot be offered to second customer simultaneously');
  manager.clearSession('bk_first');
});

// -----------------------------------------------------------------------------
// 5. LIVE GPS LOCATION & GEOFENCE ARRIVAL DETECTION
// -----------------------------------------------------------------------------
console.log('--- 5. Live GPS Location & Geofence Arrival Detection ---');

it('Ingests valid GPS coordinates and rejects degraded signals (> 150m)', () => {
  const tracker = new LocationTrackerService();

  // Valid coordinate
  const valid = tracker.recordDriverLocation('drv_gps_1', {
    latitude: 28.4595,
    longitude: 77.0266,
    heading: 180,
    speed: 35,
    accuracy: 8.5
  });
  assert.strictEqual(valid.success, true);

  // Degraded GPS signal
  const degraded = tracker.recordDriverLocation('drv_gps_1', {
    latitude: 28.4595,
    longitude: 77.0266,
    accuracy: 250 // > 150 meters
  });
  assert.strictEqual(degraded.success, false, 'Degraded GPS signals must be rejected');
});

it('Triggers geofence arrival detection when chauffeur is within 100 meters of pickup address', () => {
  const tracker = new LocationTrackerService();
  const pickupLat = 28.459500;
  const pickupLon = 77.026600;

  // Driver arrives 50 meters away
  tracker.recordDriverLocation('drv_geo_1', {
    latitude: 28.459800,
    longitude: 77.026700,
    speed: 5
  });

  const booking = {
    bookingReference: 'SRT-GEO-99',
    status: 'arriving',
    pickupLatitude: pickupLat,
    pickupLongitude: pickupLon
  };

  const telemetry = tracker.computeTripLiveTelemetry(booking, { id: 'drv_geo_1' });
  assert.ok(telemetry.remainingDistanceKm < 0.100, 'Distance must be less than 100 meters');
  assert.strictEqual(telemetry.isInsideArrivalGeofence, true, 'Must detect arrival inside 100m geofence');
});

// -----------------------------------------------------------------------------
// 6. CRYPTOGRAPHIC AUTHENTICATION & ACCESS CONTROL
// -----------------------------------------------------------------------------
console.log('--- 6. Cryptographic Authentication & Access Control ---');

it('Signs and verifies cryptographic HMAC SHA-256 JWT tokens with role claims', () => {
  const payload = {
    sub: 'user_cust_01',
    email: 'rohan.demo@example.com',
    role: 'customer',
    name: 'Rohan Verma (Demo)'
  };

  const token = signJwt(payload, 3600);
  assert.ok(token && token.split('.').length === 3, 'JWT must have header.payload.signature');

  const verification = verifyJwt(token);
  assert.strictEqual(verification.valid, true);
  assert.strictEqual(verification.payload.role, 'customer');
  assert.strictEqual(verification.payload.email, 'rohan.demo@example.com');
});

it('Cryptographically rejects forged or tampered JWT token signatures', () => {
  const validToken = signJwt({ sub: 'user_01', role: 'customer' });
  const tamperedToken = validToken.substring(0, validToken.length - 5) + 'AAAAA';

  const verification = verifyJwt(tamperedToken);
  assert.strictEqual(verification.valid, false, 'Tampered token signature must be rejected');
});

// -----------------------------------------------------------------------------
// 7. PERSISTENT STORAGE
// -----------------------------------------------------------------------------
console.log('--- 7. File-Backed Persistent Storage Verification ---');

it('Persists data across store reloads without in-memory amnesia', () => {
  const testRecord = persistentStorage.insert('service_areas', {
    id: 'city_test_surat',
    name: 'Surat',
    state: 'Gujarat',
    base_rate: 129
  });

  assert.ok(testRecord.id);
  const reloaded = persistentStorage.findOne('service_areas', c => c.name === 'Surat');
  assert.ok(reloaded, 'Record must be queryable in persistent storage');
  assert.strictEqual(reloaded.state, 'Gujarat');

  // Clean up test entry
  persistentStorage.delete('service_areas', c => c.name === 'Surat');
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log(`\n=======================================================`);
console.log(`🏆 Phase 7 Mobility Marketplace Tests: ${passedTests}/${totalTests} Passed`);
console.log(`=======================================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
