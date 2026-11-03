/**
 * PERSONAL DRIVER MARKETPLACE - PRODUCTION REAL-TIME DISPATCH & CASCADE MATCHING ENGINE
 * Pan-India On-Demand Personal Driver Marketplace
 * "Your Car. Your Journey. Your Driver."
 * 
 * Features:
 * 1. Persistent dispatch sessions surviving backend restarts
 * 2. Durable server-side timeout worker (45s acceptance window)
 * 3. Multi-instance atomic concurrency & double-booking protection
 * 4. Configurable composite ranking formula with new-driver fairness
 * 5. Driver cancellation & replacement cascade workflow
 * 6. Real-time event broadcasting to Customer, Driver & Admin channels
 */

import { checkDriverBookingConflict } from '../conflictEngine.js';
import { persistentStorage } from '../db/persistentStorage.js';
import { globalRealtimeBus } from './realtimeEventBus.js';

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Configurable Ranking Weights
 * Total: 100 points
 */
export const RANKING_WEIGHTS = {
  proximityMaxPoints: 45,       // 45% Proximity (closer is better)
  ratingMaxPoints: 30,          // 30% Chauffeur rating & review quality
  experienceMaxPoints: 15,      // 15% Verified driving experience
  reliabilityMaxPoints: 10,     // 10% Historical acceptance & completion rate
  defaultNewDriverRating: 4.8,  // Fair baseline for new drivers with no reviews
  defaultNewDriverReliability: 100 // Fair 100% baseline for newly approved drivers
};

/**
 * Calculates Great-Circle Haversine distance between two GPS coordinates
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 999;
  
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
 * Marked as approximate until real-time road graph navigation in Phase 8D
 */
export function calculateEstimatedEtaMinutes(distanceKm, averageSpeedKmh = 25) {
  if (distanceKm <= 0.2) return 1;
  const hours = distanceKm / averageSpeedKmh;
  const minutes = Math.ceil(hours * 60);
  return Math.max(minutes, 2); // Minimum 2 minutes buffer
}

/**
 * Computes composite match score for a chauffeur candidate
 */
export function calculateDriverMatchScore(driver, distanceKm) {
  const {
    proximityMaxPoints,
    ratingMaxPoints,
    experienceMaxPoints,
    reliabilityMaxPoints,
    defaultNewDriverRating,
    defaultNewDriverReliability
  } = RANKING_WEIGHTS;

  // 1. Proximity score (Max 45 pts): decreases as distance increases (approx -3 pts per km)
  const distanceScore = Math.max(0, proximityMaxPoints - (distanceKm * 3));

  // 2. Rating score (Max 30 pts): new drivers receive fair baseline (4.8)
  const effectiveRating = (driver.totalReviews > 0 && driver.rating)
    ? Number(driver.rating)
    : defaultNewDriverRating;
  const ratingScore = (effectiveRating / 5.0) * ratingMaxPoints;

  // 3. Experience score (Max 15 pts): 1.5 pts per year of verified driving up to 10 years
  const experienceYears = Number(driver.experienceYears) || 1;
  const experienceScore = Math.min(experienceMaxPoints, experienceYears * 1.5);

  // 4. Reliability score (Max 10 pts): historical acceptance rate
  const acceptanceRate = driver.acceptanceRate !== undefined
    ? Number(driver.acceptanceRate)
    : defaultNewDriverReliability;
  const reliabilityScore = (acceptanceRate / 100) * reliabilityMaxPoints;

  const compositeMatchScore = Math.round((distanceScore + ratingScore + experienceScore + reliabilityScore) * 10) / 10;

  return {
    distanceScore: Math.round(distanceScore * 10) / 10,
    ratingScore: Math.round(ratingScore * 10) / 10,
    experienceScore: Math.round(experienceScore * 10) / 10,
    reliabilityScore: Math.round(reliabilityScore * 10) / 10,
    compositeMatchScore
  };
}

/**
 * Shared active dispatch lock table (maps driverId -> bookingId)
 * Ensures mutex locking across dispatch manager instances
 */
const sharedDriverDispatchLocks = new Map();

/**
 * Persistent Dispatch Session Manager
 */
export class DispatchSessionManager {
  constructor() {
    this.activeSessions = new Map(); // bookingId -> session state
    this.driverDispatchLocks = sharedDriverDispatchLocks;
    this.isWorkerRunning = false;

    // Load active sessions from persistent storage on startup
    this.restoreFromStorage();

    // Start server-side durable dispatch timeout worker
    this.startDurableExpiryWorker();
  }

  /**
   * Restores active dispatch sessions from persistent store
   */
  restoreFromStorage() {
    try {
      const persistedSessions = persistentStorage.getTable('dispatch_sessions') || [];
      const now = Date.now();

      for (const session of persistedSessions) {
        if (session.status === 'dispatched') {
          // If expired during server restart, mark timed out
          if (new Date(session.expiresAt).getTime() <= now) {
            session.status = 'timed_out_during_restart';
            continue;
          }

          this.activeSessions.set(session.bookingId, session);
          if (session.currentCandidate) {
            this.driverDispatchLocks.set(session.currentCandidate.id, session.bookingId);
          }
        }
      }
    } catch (err) {
      console.warn('Could not restore dispatch sessions:', err.message);
    }
  }

  /**
   * Persists active session state to persistent store
   */
  persistSession(session) {
    try {
      const sessions = persistentStorage.getTable('dispatch_sessions');
      const idx = sessions.findIndex(s => s.bookingId === session.bookingId);
      if (idx >= 0) {
        sessions[idx] = { ...session, updatedAt: new Date().toISOString() };
      } else {
        sessions.push({ ...session, createdAt: new Date().toISOString() });
      }
      persistentStorage.persist();
    } catch (err) {
      console.error('Failed to persist dispatch session:', err.message);
    }
  }

  /**
   * Starts server-side background worker to check dispatch timeouts every 2 seconds
   */
  startDurableExpiryWorker() {
    if (this.isWorkerRunning) return;
    this.isWorkerRunning = true;

    this.expiryInterval = setInterval(() => {
      this.checkExpiredSessions();
    }, 2000);

    if (this.expiryInterval.unref) {
      this.expiryInterval.unref();
    }
  }

  /**
   * Checks and cascades any expired dispatch proposals
   */
  checkExpiredSessions() {
    const now = Date.now();

    for (const [bookingId, session] of this.activeSessions.entries()) {
      if (session.status === 'dispatched' && session.expiresAt) {
        const expiresTime = new Date(session.expiresAt).getTime();
        if (now >= expiresTime) {
          // Timeout triggered by server-side clock
          this.rejectOrTimeoutDispatch(bookingId, session.currentCandidate?.id, 'timeout');
        }
      }
    }
  }

  /**
   * Finds all eligible approved drivers within dispatch radius
   */
  findEligibleDrivers(requestParams, allDrivers, existingBookings, options = {}) {
    const {
      pickupLatitude,
      pickupLongitude,
      transmissionType,
      serviceCity,
      startDate,
      startTime,
      durationHours = 2,
      maxRadiusKm = 15
    } = requestParams;

    return allDrivers.filter(driver => {
      // 1. Must be verified and approved by admin compliance
      if (driver.verificationStatus !== 'approved') return false;

      // 2. Must not be suspended
      if (driver.isSuspended) return false;

      // 3. Must be online and on duty
      if (!driver.isOnline) return false;

      // 4. Must match vehicle transmission (Manual vs Automatic)
      if (transmissionType && driver.transmissionSkills) {
        if (!driver.transmissionSkills.includes(transmissionType)) {
          return false;
        }
      }

      // 5. Must operate in the requested service city (if specified)
      if (serviceCity && driver.primaryCity) {
        if (driver.primaryCity.toLowerCase() !== serviceCity.toLowerCase()) {
          return false;
        }
      }

      // 6. Must not be currently locked in an active dispatch proposal
      if (this.driverDispatchLocks.has(driver.id) && this.driverDispatchLocks.get(driver.id) !== options.currentBookingId) {
        return false;
      }

      // 7. Must not be locked in an active on-meter ride
      const activeBookings = (existingBookings || []).filter(b =>
        b.driverId === driver.id &&
        ['requested', 'dispatched', 'accepted', 'arriving', 'in_progress'].includes(b.status) &&
        b.id !== options.currentBookingId
      );
      if (activeBookings.length > 0) return false;

      // 8. Must not have scheduling conflicts (enforcing 30-min transit buffer)
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

      // 9. Distance check from pickup location
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
   */
  rankDrivers(candidateDrivers, pickupLat, pickupLon) {
    return candidateDrivers
      .map(driver => {
        const distanceKm = (pickupLat && pickupLon && driver.currentLatitude && driver.currentLongitude)
          ? calculateHaversineDistanceKm(pickupLat, pickupLon, driver.currentLatitude, driver.currentLongitude)
          : 3.5;

        const etaMinutes = calculateEstimatedEtaMinutes(distanceKm);
        const scoreDetails = calculateDriverMatchScore(driver, distanceKm);

        return {
          ...driver,
          distanceKm,
          etaMinutes,
          ...scoreDetails
        };
      })
      .sort((a, b) => b.compositeMatchScore - a.compositeMatchScore);
  }

  /**
   * Creates a new cascade dispatch session with atomic candidate locking
   */
  createDispatchSession(booking, rankedCandidates, timeoutSeconds = 45) {
    if (!rankedCandidates || rankedCandidates.length === 0) {
      return {
        success: false,
        message: 'No available approved chauffeurs currently matching vehicle criteria in this area.'
      };
    }

    const topCandidate = rankedCandidates[0];

    // Atomic Concurrency Lock Check
    if (this.driverDispatchLocks.has(topCandidate.id) && this.driverDispatchLocks.get(topCandidate.id) !== booking.id) {
      return {
        success: false,
        code: 'CONCURRENT_LOCK',
        message: `Driver ${topCandidate.fullName} is currently being offered another dispatch. Cascade evaluating next candidate.`
      };
    }

    const session = {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      candidates: rankedCandidates,
      currentIndex: 0,
      currentCandidate: topCandidate,
      dispatchedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + timeoutSeconds * 1000).toISOString(),
      status: 'dispatched',
      history: []
    };

    // Lock the driver
    this.driverDispatchLocks.set(topCandidate.id, booking.id);
    this.activeSessions.set(booking.id, session);
    this.persistSession(session);

    // Publish DISPATCH_OFFERED event to driver's private channel
    globalRealtimeBus.publish(`driver:dispatch:${topCandidate.id}`, 'DISPATCH_OFFERED', {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      serviceType: booking.serviceType,
      serviceTitle: booking.serviceTitle,
      vehicleType: booking.vehicleType,
      transmissionType: booking.transmissionType,
      pickupAddress: booking.pickupAddress,
      dropAddress: booking.dropAddress,
      estimatedFare: booking.totalFare,
      durationHours: booking.durationHours,
      expiresAt: session.expiresAt,
      expiresInSeconds: timeoutSeconds
    }, booking.isDemo);

    // Notify Customer & Admin
    globalRealtimeBus.publish(`customer:booking:${booking.id}`, 'DISPATCH_SEARCHING', {
      bookingId: booking.id,
      status: 'dispatched',
      message: 'Searching for nearest verified chauffeur...'
    }, booking.isDemo);

    globalRealtimeBus.publish('admin:operations', 'DISPATCH_STARTED', {
      bookingReference: booking.bookingReference,
      candidateDriverId: topCandidate.id,
      candidateName: topCandidate.fullName,
      dispatchedAt: session.dispatchedAt
    }, booking.isDemo);

    return {
      success: true,
      session,
      candidate: topCandidate,
      expiresInSeconds: timeoutSeconds
    };
  }

  /**
   * Driver accepts dispatch proposal (Idempotent)
   */
  acceptDispatch(bookingId, driverId) {
    const session = this.activeSessions.get(bookingId);
    if (!session) {
      return { success: false, message: 'Dispatch session expired or not found' };
    }

    // Idempotency: If already accepted by this driver, return success
    if (session.status === 'accepted' && session.acceptedDriver?.id === driverId) {
      return {
        success: true,
        message: 'Booking already confirmed for this chauffeur',
        session,
        driver: session.acceptedDriver
      };
    }

    if (session.currentCandidate.id !== driverId) {
      return { success: false, message: 'Chauffeur is not the designated candidate for this request' };
    }

    session.status = 'accepted';
    session.acceptedDriver = session.currentCandidate;
    session.respondedAt = new Date().toISOString();

    // Release dispatch proposal lock since ride is firmly confirmed
    this.driverDispatchLocks.delete(driverId);
    this.persistSession(session);

    // Publish DISPATCH_ACCEPTED to customer and admin
    globalRealtimeBus.publish(`customer:booking:${bookingId}`, 'DISPATCH_ACCEPTED', {
      bookingId,
      status: 'accepted',
      driver: {
        id: session.acceptedDriver.id,
        fullName: session.acceptedDriver.fullName,
        phone: session.acceptedDriver.phone,
        rating: session.acceptedDriver.rating,
        photoUrl: session.acceptedDriver.photoUrl,
        etaMinutes: session.acceptedDriver.etaMinutes || 5
      }
    });

    globalRealtimeBus.publish('admin:operations', 'DISPATCH_ACCEPTED', {
      bookingId,
      bookingReference: session.bookingReference,
      driverId,
      driverName: session.acceptedDriver.fullName,
      acceptedAt: session.respondedAt
    });

    return {
      success: true,
      message: 'Booking accepted by chauffeur',
      session,
      driver: session.acceptedDriver
    };
  }

  /**
   * Driver declines or request times out; auto-cascades to next ranked chauffeur
   */
  rejectOrTimeoutDispatch(bookingId, driverId, reason = 'timeout') {
    const session = this.activeSessions.get(bookingId);
    if (!session) return { success: false, message: 'No active dispatch session' };

    const currentDriver = session.currentCandidate;
    const isTimeout = reason === 'timeout';

    // Record rejection
    session.history.push({
      driverId: currentDriver.id,
      driverName: currentDriver.fullName,
      action: reason,
      timestamp: new Date().toISOString()
    });

    // Release current driver lock
    this.driverDispatchLocks.delete(currentDriver.id);

    // Notify the expiring/declining driver
    globalRealtimeBus.publish(`driver:dispatch:${currentDriver.id}`, isTimeout ? 'DISPATCH_EXPIRED' : 'DISPATCH_DECLINED', {
      bookingId,
      bookingReference: session.bookingReference,
      reason
    });

    // Advance to next ranked candidate in cascade
    session.currentIndex += 1;
    if (session.currentIndex < session.candidates.length) {
      const nextDriver = session.candidates[session.currentIndex];
      session.currentCandidate = nextDriver;
      session.dispatchedAt = new Date().toISOString();
      session.expiresAt = new Date(Date.now() + 45 * 1000).toISOString();
      
      this.driverDispatchLocks.set(nextDriver.id, bookingId);
      this.persistSession(session);

      // Offer request to next candidate
      globalRealtimeBus.publish(`driver:dispatch:${nextDriver.id}`, 'DISPATCH_OFFERED', {
        bookingId,
        bookingReference: session.bookingReference,
        expiresAt: session.expiresAt,
        expiresInSeconds: 45
      });

      globalRealtimeBus.publish(`customer:booking:${bookingId}`, 'DISPATCH_CASCADED', {
        bookingId,
        message: 'Connecting with next available verified chauffeur in your area...'
      });

      return {
        success: true,
        action: 'cascaded_to_next',
        nextDriver,
        session
      };
    } else {
      session.status = 'exhausted';
      this.persistSession(session);

      globalRealtimeBus.publish(`customer:booking:${bookingId}`, 'DISPATCH_EXHAUSTED', {
        bookingId,
        status: 'exhausted',
        message: 'All eligible chauffeurs were occupied or unavailable. Please try again shortly.'
      });

      globalRealtimeBus.publish('admin:operations', 'DISPATCH_EXHAUSTED', {
        bookingId,
        bookingReference: session.bookingReference,
        exhaustedAt: new Date().toISOString()
      });

      return {
        success: true,
        action: 'queue_exhausted',
        message: 'All eligible chauffeurs were occupied or unavailable.',
        session
      };
    }
  }

  /**
   * Handles driver cancellation after acceptance and triggers replacement search
   */
  requestReplacementDispatch(booking, cancellingDriverId, reason = 'Driver emergency cancellation') {
    const bookingId = booking.id;

    // Release locks
    this.driverDispatchLocks.delete(cancellingDriverId);

    // Record cancellation in session
    const oldSession = this.activeSessions.get(bookingId);
    if (oldSession) {
      oldSession.status = 'driver_cancelled_replacement_needed';
      oldSession.history.push({
        driverId: cancellingDriverId,
        action: 'cancelled_after_acceptance',
        reason,
        timestamp: new Date().toISOString()
      });
    }

    // Broadcast replacement status
    globalRealtimeBus.publish(`customer:booking:${bookingId}`, 'REPLACEMENT_SEARCHING', {
      bookingId,
      status: 'replacement_requested',
      message: 'Your assigned chauffeur had an unexpected conflict. Finding an immediate replacement chauffeur now...'
    });

    globalRealtimeBus.publish('admin:operations', 'REPLACEMENT_REQUESTED', {
      bookingReference: booking.bookingReference,
      cancellingDriverId,
      reason,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Replacement search initiated',
      status: 'replacement_requested'
    };
  }

  getSession(bookingId) {
    return this.activeSessions.get(bookingId);
  }

  clearSession(bookingId) {
    const session = this.activeSessions.get(bookingId);
    if (session && session.currentCandidate) {
      this.driverDispatchLocks.delete(session.currentCandidate.id);
    }
    this.activeSessions.delete(bookingId);
  }
}

export const globalDispatchManager = new DispatchSessionManager();

/**
 * Functional wrapper exports for backwards compatibility across existing test suites
 */
export function findEligibleDrivers(requestParams, allDrivers, existingBookings, options = {}) {
  return globalDispatchManager.findEligibleDrivers(requestParams, allDrivers, existingBookings, options);
}

export function rankDrivers(candidateDrivers, pickupLat, pickupLon) {
  return globalDispatchManager.rankDrivers(candidateDrivers, pickupLat, pickupLon);
}
