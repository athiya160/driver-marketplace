/**
 * PHASE 8D AUTOMATED INTEGRATION TEST SUITE
 * Maps, Geolocation, Real Routes, Accurate ETA & Arrival Geofencing
 * Platform: Personal Driver Marketplace ("Your Car. Your Journey. Your Driver.")
 */

import assert from 'assert';
import { MAPS_CONFIG, getCurrentTrafficMultiplier, MAP_PROVIDERS } from '../server/maps/mapsConfig.js';
import {
  INDIAN_METRO_NODES,
  INDIAN_METRO_EDGES,
  findNearestRoadNode,
  calculateOfflineRoadRoute
} from '../server/maps/offlineRoadGraph.js';
import {
  calculateCrossTrackDistanceMeters,
  calculateDistanceToPolylineMeters,
  globalRoutingEngine,
  RoutingEngine
} from '../server/maps/routingEngine.js';
import { globalGeocodingService, GeocodingService } from '../server/maps/geocodingService.js';
import { globalGoogleMapsClient } from '../server/maps/googleMapsClient.js';
import { globalMapboxClient } from '../server/maps/mapboxClient.js';
import { projectDeadReckoningPosition, LOCATION_MANAGEMENT_SPEC } from '../server/maps/locationPermissionGuide.js';
import { globalSettlementService } from '../server/payments/settlementService.js';
import { calculateHaversineDistanceKm } from '../server/marketplace/dispatchEngine.js';

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

console.log('\n🧪 Starting Phase 8D Maps, Geolocation & Routing Tests...\n');

// -----------------------------------------------------------------------------
// 1. MAPS PROVIDER CONFIGURATION & INDIAN BOUNDARIES
// -----------------------------------------------------------------------------
console.log('--- 1. Provider Configuration & Geographic Boundaries ---');

it('Selects active provider or defaults safely to high-accuracy offline simulator', () => {
  assert.ok([MAP_PROVIDERS.GOOGLE_MAPS, MAP_PROVIDERS.MAPBOX, MAP_PROVIDERS.SIMULATOR].includes(MAPS_CONFIG.defaultProvider));
  assert.strictEqual(MAPS_CONFIG.bounds.minLat, 6.0);
  assert.strictEqual(MAPS_CONFIG.bounds.maxLat, 38.0);
  assert.strictEqual(MAPS_CONFIG.geofence.arrivalRadiusMeters, 150);
  assert.strictEqual(MAPS_CONFIG.geofence.offRouteThresholdMeters, 100);
});

// -----------------------------------------------------------------------------
// 2. INDIAN METRO ROAD GRAPH & ROAD DISTANCE CALCULATION
// -----------------------------------------------------------------------------
console.log('\n--- 2. Indian Road Graph & True Road Distance (vs Straight Line) ---');

it('Maintains verified road graph nodes across major Indian metro corridors', () => {
  assert.ok(INDIAN_METRO_NODES['blr_airport']);
  assert.ok(INDIAN_METRO_NODES['blr_indiranagar']);
  assert.ok(INDIAN_METRO_NODES['del_cyber_city']);
  assert.ok(INDIAN_METRO_NODES['bom_bkc']);
  assert.ok(INDIAN_METRO_NODES['hyd_hitec_city']);

  // Verify Bengaluru airport node
  const blrAirport = INDIAN_METRO_NODES['blr_airport'];
  assert.strictEqual(blrAirport.city, 'Bengaluru');
  assert.ok(blrAirport.lat > 13.0 && blrAirport.lon > 77.0);
});

it('Resolves closest road network node for arbitrary coordinates', () => {
  // Near Indiranagar 100ft road
  const nearest = findNearestRoadNode(12.9720, 77.6415);
  assert.ok(nearest);
  assert.strictEqual(nearest.node.id, 'blr_indiranagar');
  assert.ok(nearest.distanceKm < 0.5);
});

it('Calculates road-based distance strictly greater than straight-line distance', () => {
  // Indiranagar to Kempegowda Airport (BLR)
  const indiranagar = INDIAN_METRO_NODES['blr_indiranagar'];
  const airport = INDIAN_METRO_NODES['blr_airport'];

  const route = calculateOfflineRoadRoute(indiranagar.lat, indiranagar.lon, airport.lat, airport.lon);

  assert.ok(route.roadDistanceKm > route.straightLineDistanceKm);
  assert.strictEqual(route.roadDistanceMeters, Math.round(route.roadDistanceKm * 1000));
  assert.ok(route.polylineCoordinates.length >= 3);
  assert.ok(route.baseDurationMinutes > 20);
});

// -----------------------------------------------------------------------------
// 3. CROSS-TRACK ERROR & OFF-ROUTE DETECTION ENGINE
// -----------------------------------------------------------------------------
console.log('\n--- 3. Geometric Cross-Track Distance & Off-Route Detection ---');

it('Calculates exact cross-track perpendicular distance to line segment', () => {
  // Line segment along latitude from (12.9700, 77.6000) to (12.9700, 77.6100)
  const aLat = 12.9700, aLon = 77.6000;
  const bLat = 12.9700, bLon = 77.6100;

  // Point on segment: perpendicular distance = 0
  const distOnLine = calculateCrossTrackDistanceMeters(12.9700, 77.6050, aLat, aLon, bLat, bLon);
  assert.ok(distOnLine < 1.0);

  // Point offset by ~0.001 deg latitude (~111 meters North)
  const distOffset = calculateCrossTrackDistanceMeters(12.9710, 77.6050, aLat, aLon, bLat, bLon);
  assert.ok(distOffset >= 100 && distOffset <= 125);
});

it('Calculates minimum distance from driver to route polyline', () => {
  const polyline = [
    [12.9700, 77.6000],
    [12.9750, 77.6100],
    [12.9800, 77.6200]
  ];

  // Driver right on second segment
  const distNear = calculateDistanceToPolylineMeters(12.9750, 77.6100, polyline);
  assert.strictEqual(distNear, 0);

  // Driver 150m away from route
  const distFar = calculateDistanceToPolylineMeters(12.9770, 77.6100, polyline);
  assert.ok(distFar > 100);
});

// -----------------------------------------------------------------------------
// 4. DYNAMIC TRAFFIC CURVES & SERVER-SIDE ROUTE CACHING
// -----------------------------------------------------------------------------
console.log('\n--- 4. Indian Traffic Curves & Server-Side LRU Caching ---');

it('Computes accurate Indian rush hour traffic multipliers by time of day', () => {
  // Simulate 9:30 AM IST (Morning Peak)
  const morningDate = new Date('2026-11-03T04:00:00Z'); // 4:00 UTC = 9:30 AM IST
  const morning = getCurrentTrafficMultiplier(morningDate);
  assert.strictEqual(morning.factor, 1.55);
  assert.ok(morning.condition.includes('Morning Peak'));

  // Simulate 7:00 PM IST (Evening Peak)
  const eveningDate = new Date('2026-11-03T13:30:00Z'); // 13:30 UTC = 7:00 PM IST
  const evening = getCurrentTrafficMultiplier(eveningDate);
  assert.strictEqual(evening.factor, 1.70);
  assert.ok(evening.condition.includes('Evening Rush'));

  // Simulate 2:00 AM IST (Late Night)
  const nightDate = new Date('2026-11-03T20:30:00Z'); // 20:30 UTC = 2:00 AM IST
  const night = getCurrentTrafficMultiplier(nightDate);
  assert.strictEqual(night.factor, 0.90);
  assert.ok(night.condition.includes('Late Night'));
});

await itAsync('Caches computed road routes to control external API costs', async () => {
  const origin = { latitude: 12.9719, longitude: 77.6412 };
  const dest = { latitude: 12.9345, longitude: 77.6912 };

  // First request: computes route
  const r1 = await globalRoutingEngine.computeRoadRoute(origin, dest);
  assert.strictEqual(r1.isFromCache, undefined);
  assert.ok(r1.roadDistanceKm > 0);

  // Second request: served from in-memory cache
  const r2 = await globalRoutingEngine.computeRoadRoute(origin, dest);
  assert.strictEqual(r2.isFromCache, true);
  assert.strictEqual(r2.roadDistanceKm, r1.roadDistanceKm);
});

// -----------------------------------------------------------------------------
// 5. DRIVER PROGRESS EVALUATION & ARRIVAL GEOFENCING
// -----------------------------------------------------------------------------
console.log('\n--- 5. Off-Route Recalculation & Pickup Arrival Geofence (150m) ---');

await itAsync('Detects driver on-route when within 100m threshold', async () => {
  const booking = {
    id: `bk_eval_${Date.now()}`,
    bookingReference: 'SRT-MAP-01',
    status: 'arriving',
    pickupLatitude: 12.9756,
    pickupLongitude: 77.6066
  };

  // Driver near route
  const driverLoc = { latitude: 12.9750, longitude: 77.6070 };
  const evaluation = await globalRoutingEngine.evaluateDriverProgress(booking, driverLoc);

  assert.strictEqual(evaluation.isOffRoute, false);
  assert.ok(evaluation.deviationMeters <= 100);
});

await itAsync('Detects off-route deviation (> 100m) and dynamically recalculates route', async () => {
  const booking = {
    id: `bk_off_${Date.now()}`,
    bookingReference: 'SRT-MAP-02',
    status: 'arriving',
    pickupLatitude: 12.9756,
    pickupLongitude: 77.6066
  };

  // Pre-seed route
  await globalRoutingEngine.computeRoadRoute(
    { latitude: 12.9719, longitude: 77.6412 },
    { latitude: 12.9756, longitude: 77.6066 },
    { bookingId: booking.id }
  );

  // Driver deviates significantly (~600m off route)
  const offRouteLoc = { latitude: 12.9650, longitude: 77.6350 };
  const evaluation = await globalRoutingEngine.evaluateDriverProgress(booking, offRouteLoc);

  assert.strictEqual(evaluation.isOffRoute, true);
  assert.ok(evaluation.deviationMeters > 100);
  assert.ok(evaluation.activeRoute);
});

await itAsync('Detects when driver enters 150m pickup arrival geofence', async () => {
  const pickupLat = 12.9719;
  const pickupLon = 77.6412;

  const booking = {
    id: `bk_geo_${Date.now()}`,
    bookingReference: 'SRT-MAP-03',
    status: 'arriving',
    pickupLatitude: pickupLat,
    pickupLongitude: pickupLon
  };

  // 1. Driver 800m away
  const farLoc = { latitude: 12.9790, longitude: 77.6412 };
  const evalFar = await globalRoutingEngine.evaluateDriverProgress(booking, farLoc);
  assert.strictEqual(evalFar.isInsideArrivalGeofence, false);
  assert.ok(evalFar.remainingDistanceMeters > 150);

  // 2. Driver 80m away (inside 150m geofence)
  const nearLoc = { latitude: 12.9725, longitude: 77.6412 };
  const evalNear = await globalRoutingEngine.evaluateDriverProgress(booking, nearLoc);
  assert.strictEqual(evalNear.isInsideArrivalGeofence, true);
  assert.ok(evalNear.remainingDistanceMeters <= 150);
});

// -----------------------------------------------------------------------------
// 6. GEOCODING, PIN-DROP SEARCH & DEAD RECKONING
// -----------------------------------------------------------------------------
console.log('\n--- 6. Address Search, Map Pin Drops & Dead Reckoning ---');

await itAsync('Searches Indian places with address autocomplete', async () => {
  const res = await globalGeocodingService.searchAddresses('Indiranagar');
  assert.strictEqual(res.success, true);
  assert.ok(res.predictions.length > 0);
  assert.ok(res.predictions[0].mainText.includes('Indiranagar'));
});

await itAsync('Reverse geocodes pin-drop coordinates to nearest Indian address', async () => {
  // Pin dropped near DLF Cyber Hub (Gurugram)
  const pinRes = await globalGeocodingService.reverseGeocode(28.4952, 77.0892);
  assert.strictEqual(pinRes.success, true);
  assert.ok(pinRes.formattedAddress);
  assert.ok(pinRes.landmark);
});

it('Rejects pin drops placed outside Indian national territory', async () => {
  // Coordinates in London (51.5074, -0.1278)
  const outRes = await globalGeocodingService.reverseGeocode(51.5074, -0.1278);
  assert.strictEqual(outRes.success, false);
  assert.ok(outRes.message.includes('outside the operational service boundary of India'));
});

it('Projects vehicle coordinates via dead reckoning during temporary GPS tunnel loss', () => {
  const lastLocation = { latitude: 12.9719, longitude: 77.6412 };
  const heading = 90; // Due East
  const speed = 40;   // 40 km/h
  const elapsedSeconds = 15; // 15 seconds without GPS

  const projected = projectDeadReckoningPosition(lastLocation, heading, speed, elapsedSeconds);
  assert.ok(projected.isDeadReckoned);
  assert.strictEqual(projected.latitude, lastLocation.latitude);
  assert.ok(projected.longitude > lastLocation.longitude); // Moved East
});

// -----------------------------------------------------------------------------
// 7. REGULATORY & PRICING CONFIGURATION REVIEW
// -----------------------------------------------------------------------------
console.log('\n--- 7. Dynamic Platform Pricing & GST Professional Review Compliance ---');

it('Maintains dynamic pricing configuration with explicit statutory GST disclaimer', () => {
  const config = globalSettlementService.getPricingConfig();
  assert.strictEqual(config.platformCommissionPercent, 15);
  assert.strictEqual(config.driverSharePercent, 85);
  assert.strictEqual(config.outstationDriverDA, 350);
  assert.strictEqual(config.nightAllowance, 250);
  assert.ok(config.gstDisclaimer.includes('Section 9(5) CGST Act'));
});

console.log('\n=======================================================');
console.log(`🏆 Phase 8D Maps & Routing: ${passedTests}/${passedTests} Passed`);
console.log('=======================================================\n');
