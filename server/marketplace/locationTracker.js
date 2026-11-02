/**
 * SALMAN DRIVER - REAL-TIME GPS LOCATION & GEOFENCING TRACKER
 * Pan-India On-Demand Personal Driver Marketplace
 * Tracks driver movement, dynamic ETA, and pickup geofencing
 */

import { calculateHaversineDistanceKm, calculateEstimatedEtaMinutes } from './dispatchEngine.js';

// Arrival detection geofence threshold in kilometers (100 meters)
const ARRIVAL_GEOFENCE_RADIUS_KM = 0.100;

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
 * Validates GPS coordinate integrity
 */
export function validateGpsCoordinates(lat, lon, accuracy = 5.0) {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  if (lat < -90 || lat > 90) return false;
  if (lon < -180 || lon > 180) return false;
  // If GPS accuracy is worse than 150 meters, flag as degraded signal
  if (accuracy > 150) return false;
  return true;
}

export class LocationTrackerService {
  constructor() {
    this.driverLocations = new Map(); // driverId -> latest location
    this.locationHistory = new Map(); // driverId -> array of past 50 coordinates
  }

  recordDriverLocation(driverId, locationPayload) {
    const { latitude, longitude, heading = 0, speed = 0, accuracy = 5.0 } = locationPayload;

    if (!validateGpsCoordinates(latitude, longitude, accuracy)) {
      return { success: false, message: 'Invalid GPS coordinates or degraded signal accuracy' };
    }

    const locationRecord = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      heading: Number(heading),
      speed: Number(speed), // km/h
      accuracy: Number(accuracy),
      recordedAt: new Date().toISOString()
    };

    this.driverLocations.set(driverId, locationRecord);

    if (!this.locationHistory.has(driverId)) {
      this.locationHistory.set(driverId, []);
    }
    const history = this.locationHistory.get(driverId);
    history.push(locationRecord);
    if (history.length > 50) history.shift(); // retain last 50 breadcrumbs

    return {
      success: true,
      driverId,
      location: locationRecord
    };
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

    const targetLat = booking.status === 'in_progress' ? booking.dropLatitude : booking.pickupLatitude;
    const targetLon = booking.status === 'in_progress' ? booking.dropLongitude : booking.pickupLongitude;

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
        address: booking.status === 'in_progress' ? booking.dropAddress : booking.pickupAddress,
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
