/**
 * PERSONAL DRIVER MARKETPLACE - PRODUCTION REAL-TIME GPS TRACKER & GEOFENCING SERVICE
 * Pan-India On-Demand Personal Driver Marketplace
 * "Your Car. Your Journey. Your Driver."
 * 
 * Capabilities:
 * 1. Indian boundary validation & coordinate sanity checks
 * 2. GPS accuracy filtering (< 150m threshold)
 * 3. Teleportation / unrealistic jump detection (> 160 km/h threshold)
 * 4. Stale location detection (> 3 min without GPS marks driver offline/stale)
 * 5. Dynamic ETA & bearing calculation with arrival geofence (100m)
 * 6. Real-time telemetry broadcasting via SSE Event Bus
 */

import { calculateHaversineDistanceKm, calculateEstimatedEtaMinutes } from './dispatchEngine.js';
import { globalRealtimeBus } from './realtimeEventBus.js';

// Arrival detection geofence threshold in kilometers (100 meters)
const ARRIVAL_GEOFENCE_RADIUS_KM = 0.100;

// Maximum acceptable speed for personal car driving before flagging as anomalous jump (160 km/h)
const MAX_REALISTIC_SPEED_KMH = 160;

// Maximum location freshness age in milliseconds (3 minutes)
const MAX_LOCATION_FRESHNESS_MS = 3 * 60 * 1000;

// Geographic bounds for India
const INDIA_BOUNDS = {
  minLat: 6.0,
  maxLat: 38.0,
  minLon: 68.0,
  maxLon: 98.0
};

/**
 * Calculates navigational bearing in degrees from point A to point B
 */
export function calculateBearingDegrees(startLat, startLon, destLat, destLon) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const y = Math.sin(toRad(destLon - startLon)) * Math.cos(toRad(destLat));
  const x =
    Math.cos(toRad(startLat)) * Math.sin(toRad(destLat)) -
    Math.sin(toRad(startLat)) * Math.cos(toRad(destLat)) * Math.cos(toRad(destLon - startLon));

  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return Math.round(bearing);
}

/**
 * Validates GPS coordinate integrity against geographic bounds and accuracy
 */
export function validateGpsCoordinates(lat, lon, accuracy = 5.0, recordedAt = null) {
  if (typeof lat !== 'number' || typeof lon !== 'number') return { valid: false, reason: 'Coordinates must be numeric' };
  if (isNaN(lat) || isNaN(lon)) return { valid: false, reason: 'Coordinates cannot be NaN' };
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return { valid: false, reason: 'Coordinates out of global bounds' };

  // Indian territory bounding check
  if (lat < INDIA_BOUNDS.minLat || lat > INDIA_BOUNDS.maxLat || lon < INDIA_BOUNDS.minLon || lon > INDIA_BOUNDS.maxLon) {
    return { valid: false, reason: `Coordinates (${lat}, ${lon}) are outside India service operational boundary` };
  }

  // Degraded accuracy threshold
  if (accuracy > 150) {
    return { valid: false, reason: `Degraded GPS accuracy (${accuracy}m > 150m threshold)` };
  }

  // Stale coordinate check (> 5 mins old timestamp)
  if (recordedAt) {
    const timestampMs = new Date(recordedAt).getTime();
    const ageMs = Date.now() - timestampMs;
    if (ageMs > 5 * 60 * 1000) {
      return { valid: false, reason: 'Recorded timestamp is older than 5 minutes' };
    }
  }

  return { valid: true };
}

export class LocationTrackerService {
  constructor() {
    this.driverLocations = new Map(); // driverId -> latest valid location
    this.driverHeartbeats = new Map(); // driverId -> latest heartbeat timestamp
    this.locationHistory = new Map(); // driverId -> array of past 50 coordinates
    this.lastIngestTimes = new Map(); // driverId -> timestamp of last accepted ingest
  }

  /**
   * Records driver GPS location with jump detection and freshness validation
   */
  recordDriverLocation(driverId, locationPayload, activeBooking = null, options = {}) {
    const { latitude, longitude, heading = 0, speed = 0, accuracy = 5.0, recordedAt } = locationPayload;

    // Rate-limiting: Max 1 ingest per 800ms per driver (unless bypassed)
    const now = Date.now();
    const lastIngest = this.lastIngestTimes.get(driverId) || 0;
    if (!options.bypassRateLimit && (now - lastIngest < 800)) {
      return { success: false, reason: 'Rate limited: GPS ingest too frequent' };
    }

    // 1. Basic coordinate and bounding validation
    const validation = validateGpsCoordinates(latitude, longitude, accuracy, recordedAt);
    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }

    const previousLocation = this.driverLocations.get(driverId);
    const recordedTimestamp = recordedAt || new Date().toISOString();
    const currentLat = Number(latitude);
    const currentLon = Number(longitude);

    // 2. Unrealistic Jump / Teleportation Detection
    if (previousLocation) {
      const timeDiffSeconds = Math.max(1, (new Date(recordedTimestamp).getTime() - new Date(previousLocation.recordedAt).getTime()) / 1000);
      const distanceMovedKm = calculateHaversineDistanceKm(
        previousLocation.latitude,
        previousLocation.longitude,
        currentLat,
        currentLon
      );

      const calculatedSpeedKmh = (distanceMovedKm / timeDiffSeconds) * 3600;

      if (calculatedSpeedKmh > MAX_REALISTIC_SPEED_KMH) {
        return {
          success: false,
          reason: `Unrealistic GPS jump detected: ${Math.round(calculatedSpeedKmh)} km/h exceeds safe maximum (${MAX_REALISTIC_SPEED_KMH} km/h). Location update rejected.`
        };
      }
    }

    const locationRecord = {
      latitude: currentLat,
      longitude: currentLon,
      heading: Number(heading),
      speed: Number(speed),
      accuracy: Number(accuracy),
      recordedAt: recordedTimestamp
    };

    this.driverLocations.set(driverId, locationRecord);
    this.driverHeartbeats.set(driverId, Date.now());
    this.lastIngestTimes.set(driverId, now);

    // Retain history
    if (!this.locationHistory.has(driverId)) {
      this.locationHistory.set(driverId, []);
    }
    const history = this.locationHistory.get(driverId);
    history.push(locationRecord);
    if (history.length > 50) history.shift();

    // 3. Real-Time Telemetry Broadcast for Active Booking
    if (activeBooking && ['accepted', 'arriving', 'arrived', 'in_progress'].includes(activeBooking.status)) {
      const telemetry = this.computeTripLiveTelemetry(activeBooking, {
        id: driverId,
        currentLatitude: currentLat,
        currentLongitude: currentLon,
        heading,
        speed
      });

      // Stream to Customer
      globalRealtimeBus.publish(`customer:booking:${activeBooking.id}`, 'LOCATION_UPDATED', {
        bookingId: activeBooking.id,
        driverId,
        telemetry
      }, activeBooking.isDemo);

      // Stream to Admin Operations
      globalRealtimeBus.publish('admin:operations', 'LOCATION_UPDATED', {
        bookingReference: activeBooking.bookingReference,
        driverId,
        telemetry
      }, activeBooking.isDemo);
    }

    return {
      success: true,
      driverId,
      location: locationRecord
    };
  }

  /**
   * Records driver online heartbeat
   */
  recordDriverHeartbeat(driverId) {
    this.driverHeartbeats.set(driverId, Date.now());
    return { success: true, timestamp: new Date().toISOString() };
  }

  /**
   * Checks whether a driver's GPS location is fresh (within 3 minutes)
   */
  isDriverLocationFresh(driverId, maxAgeMs = MAX_LOCATION_FRESHNESS_MS) {
    const loc = this.driverLocations.get(driverId);
    if (!loc) return false;
    const age = Date.now() - new Date(loc.recordedAt).getTime();
    return age <= maxAgeMs;
  }

  getDriverLocation(driverId) {
    return this.driverLocations.get(driverId) || null;
  }

  computeTripLiveTelemetry(booking, driver) {
    if (!booking) return null;

    const driverLoc = this.getDriverLocation(driver?.id) || {
      latitude: driver?.currentLatitude || 28.4595,
      longitude: driver?.currentLongitude || 77.0266,
      heading: driver?.heading || 0,
      speed: driver?.speed || 25,
      recordedAt: new Date().toISOString()
    };

    const isTripInProgress = booking.status === 'in_progress';
    const targetLat = isTripInProgress ? booking.dropLatitude : booking.pickupLatitude;
    const targetLon = isTripInProgress ? booking.dropLongitude : booking.pickupLongitude;

    const remainingDistanceKm = calculateHaversineDistanceKm(
      driverLoc.latitude,
      driverLoc.longitude,
      targetLat || driverLoc.latitude,
      targetLon || driverLoc.longitude
    );

    const etaMinutes = calculateEstimatedEtaMinutes(remainingDistanceKm, driverLoc.speed || 25);
    const bearing = calculateBearingDegrees(
      driverLoc.latitude,
      driverLoc.longitude,
      targetLat || driverLoc.latitude,
      targetLon || driverLoc.longitude
    );

    const isInsideArrivalGeofence = remainingDistanceKm <= ARRIVAL_GEOFENCE_RADIUS_KM;

    return {
      bookingReference: booking.bookingReference,
      tripStatus: booking.status,
      driverCurrentLocation: driverLoc,
      targetDestination: {
        address: isTripInProgress ? booking.dropAddress : booking.pickupAddress,
        latitude: targetLat,
        longitude: targetLon
      },
      remainingDistanceKm,
      etaMinutes,
      bearingDegrees: bearing,
      isInsideArrivalGeofence,
      lastUpdated: new Date().toISOString()
    };
  }
}

export const globalLocationTracker = new LocationTrackerService();
