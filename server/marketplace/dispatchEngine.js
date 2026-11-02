/**
 * PERSONAL DRIVER MARKETPLACE - REAL-TIME DISPATCH & MATCHING ENGINE
 * Pan-India On-Demand Personal Driver Marketplace
 * Matches customer vehicles with verified professional chauffeurs
 */

import { checkDriverBookingConflict } from '../conflictEngine.js';

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Calculates Great-Circle Haversine distance between two GPS coordinates
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;
  return Math.round(distance * 10) / 10;
}

/**
 * Estimates driving arrival time (ETA) in minutes based on distance and city traffic speed
 */
export function calculateEstimatedEtaMinutes(distanceKm, averageSpeedKmh = 25) {
  if (distanceKm <= 0.2) return 1;
  const hours = distanceKm / averageSpeedKmh;
  const minutes = Math.ceil(hours * 60);
  return Math.max(minutes, 2); // Minimum 2 minutes buffer
}

/**
 * In-memory active dispatch lock table
 * Maps driverId -> bookingId to prevent race conditions & double-booking
 */
const driverDispatchLocks = new Map();

/**
 * Finds all eligible approved drivers within dispatch radius
 */
export function findEligibleDrivers(requestParams, allDrivers, existingBookings, options = {}) {
  const {
    pickupLatitude,
    pickupLongitude,
    transmissionType, // 'Manual' or 'Automatic'
    serviceCity,
    startDate,
    startTime,
    durationHours = 2,
    maxRadiusKm = 15
  } = requestParams;

  return allDrivers.filter(driver => {
    // 1. Must be verified and approved by admin compliance
    if (driver.verificationStatus !== 'approved') return false;

    // 2. Must be online and on duty
    if (!driver.isOnline) return false;

    // 3. Must match vehicle transmission (Manual vs Automatic)
    if (transmissionType && driver.transmissionSkills) {
      if (!driver.transmissionSkills.includes(transmissionType)) {
        return false;
      }
    }

    // 4. Must operate in the requested service city (if specified)
    if (serviceCity && driver.primaryCity) {
      if (driver.primaryCity.toLowerCase() !== serviceCity.toLowerCase()) {
        return false;
      }
    }

    // 5. Must not be currently locked in an active dispatch proposal
    if (driverDispatchLocks.has(driver.id) && driverDispatchLocks.get(driver.id) !== options.currentBookingId) {
      return false;
    }

    // 6. Must not have scheduling conflicts (enforcing 30-min transit buffer)
    if (startDate && startTime) {
      const conflictCheck = checkDriverBookingConflict(
        driver.id,
        startDate,
        startTime,
        durationHours,
        existingBookings
      );
      if (conflictCheck.hasConflict) return false;
    }

    // 7. Distance check from pickup location
    if (pickupLatitude && pickupLongitude && driver.currentLatitude && driver.currentLongitude) {
      const dist = calculateHaversineDistanceKm(
        pickupLatitude,
        pickupLongitude,
        driver.currentLatitude,
        driver.currentLongitude
      );
      if (dist > maxRadiusKm) return false;
    }

    return true;
  });
}

/**
 * Ranks candidate drivers using composite scoring
 * Proximity (60%) + Chauffeur Rating (30%) + Road Experience (10%)
 */
export function rankDrivers(candidateDrivers, pickupLat, pickupLon) {
  return candidateDrivers
    .map(driver => {
      const distanceKm = (pickupLat && pickupLon && driver.currentLatitude && driver.currentLongitude)
        ? calculateHaversineDistanceKm(pickupLat, pickupLon, driver.currentLatitude, driver.currentLongitude)
        : 3.5;

      const etaMinutes = calculateEstimatedEtaMinutes(distanceKm);
      const rating = Number(driver.rating) || 5.0;
      const experience = Number(driver.experienceYears) || 1;

      // Composite ranking formula (Higher is better)
      // Max score normalized: Distance (up to 45 pts), Rating (up to 40 pts), Experience (up to 15 pts)
      const distanceScore = Math.max(0, 45 - (distanceKm * 3));
      const ratingScore = (rating / 5.0) * 40;
      const experienceScore = Math.min(15, experience * 1.5);
      const compositeMatchScore = Math.round((distanceScore + ratingScore + experienceScore) * 10) / 10;

      return {
        ...driver,
        distanceKm,
        etaMinutes,
        compositeMatchScore
      };
    })
    .sort((a, b) => b.compositeMatchScore - a.compositeMatchScore);
}

/**
 * Manages active Cascade Dispatch Queue
 */
export class DispatchSessionManager {
  constructor() {
    this.activeSessions = new Map(); // bookingId -> session state
  }

  createDispatchSession(booking, rankedCandidates, timeoutSeconds = 45) {
    if (!rankedCandidates || rankedCandidates.length === 0) {
      return {
        success: false,
        message: 'No available approved chauffeurs currently matching vehicle criteria in this area.'
      };
    }

    const session = {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      candidates: rankedCandidates,
      currentIndex: 0,
      currentCandidate: rankedCandidates[0],
      dispatchedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + timeoutSeconds * 1000).toISOString(),
      status: 'dispatched', // 'dispatched', 'accepted', 'exhausted'
      history: []
    };

    // Lock top ranked driver
    driverDispatchLocks.set(rankedCandidates[0].id, booking.id);
    this.activeSessions.set(booking.id, session);

    return {
      success: true,
      session,
      candidate: rankedCandidates[0],
      expiresInSeconds: timeoutSeconds
    };
  }

  acceptDispatch(bookingId, driverId) {
    const session = this.activeSessions.get(bookingId);
    if (!session) return { success: false, message: 'Dispatch session expired or not found' };

    if (session.currentCandidate.id !== driverId) {
      return { success: false, message: 'Chauffeur is not the designated candidate for this request' };
    }

    session.status = 'accepted';
    session.acceptedDriver = session.currentCandidate;
    session.respondedAt = new Date().toISOString();

    // Release dispatch lock, booking is now firmly locked
    driverDispatchLocks.delete(driverId);
    return {
      success: true,
      message: 'Booking accepted by chauffeur',
      session,
      driver: session.currentCandidate
    };
  }

  rejectOrTimeoutDispatch(bookingId, driverId, reason = 'timeout') {
    const session = this.activeSessions.get(bookingId);
    if (!session) return { success: false, message: 'No active dispatch session' };

    // Record rejection
    session.history.push({
      driverId,
      driverName: session.currentCandidate.fullName,
      action: reason,
      timestamp: new Date().toISOString()
    });

    // Release current driver lock
    driverDispatchLocks.delete(driverId);

    // Advance to next ranked candidate in cascade
    session.currentIndex += 1;
    if (session.currentIndex < session.candidates.length) {
      const nextDriver = session.candidates[session.currentIndex];
      session.currentCandidate = nextDriver;
      session.expiresAt = new Date(Date.now() + 45 * 1000).toISOString();
      driverDispatchLocks.set(nextDriver.id, bookingId);

      return {
        success: true,
        action: 'cascaded_to_next',
        nextDriver,
        session
      };
    } else {
      session.status = 'exhausted';
      return {
        success: true,
        action: 'queue_exhausted',
        message: 'All eligible chauffeurs were occupied or unavailable.',
        session
      };
    }
  }

  getSession(bookingId) {
    return this.activeSessions.get(bookingId);
  }

  clearSession(bookingId) {
    const session = this.activeSessions.get(bookingId);
    if (session && session.currentCandidate) {
      driverDispatchLocks.delete(session.currentCandidate.id);
    }
    this.activeSessions.delete(bookingId);
  }
}

export const globalDispatchManager = new DispatchSessionManager();
