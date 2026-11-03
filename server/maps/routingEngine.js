/**
 * PERSONAL DRIVER MARKETPLACE - ADVANCED ROUTING & ETA ENGINE
 * Pan-India On-Demand Personal Driver Marketplace
 * "Your Car. Your Journey. Your Driver."
 * 
 * Features:
 * 1. Road-based distance computation (not straight-line)
 * 2. Dynamic traffic-aware ETA calculation (morning/evening rush hour multipliers)
 * 3. Server-side LRU route caching (saves 3rd-party API costs)
 * 4. Off-route detection (cross-track distance > 100m) with automatic dynamic recalculation
 * 5. Pickup arrival geofencing (150m threshold)
 * 6. Provider abstraction (Google Maps, Mapbox, Offline Indian Road Graph)
 */

import { MAPS_CONFIG, getCurrentTrafficMultiplier } from './mapsConfig.js';
import { globalGoogleMapsClient } from './googleMapsClient.js';
import { globalMapboxClient } from './mapboxClient.js';
import { calculateOfflineRoadRoute } from './offlineRoadGraph.js';
import { calculateHaversineDistanceKm } from '../marketplace/dispatchEngine.js';
import { globalRealtimeBus } from '../marketplace/realtimeEventBus.js';

/**
 * Calculates perpendicular cross-track distance in meters from point P to line segment AB
 */
export function calculateCrossTrackDistanceMeters(pLat, pLon, aLat, aLon, bLat, bLon) {
  // Convert lat/lon degrees to meters using equirectangular approximation for local distances
  const midLat = (aLat + bLat) / 2;
  const latToMeters = 111139; // ~111.139 km per degree of latitude
  const lonToMeters = 111139 * Math.cos((midLat * Math.PI) / 180);

  const px = (pLon - aLon) * lonToMeters;
  const py = (pLat - aLat) * latToMeters;
  const bx = (bLon - aLon) * lonToMeters;
  const by = (bLat - aLat) * latToMeters;

  const segmentLengthSquared = bx * bx + by * by;
  if (segmentLengthSquared === 0) {
    return Math.sqrt(px * px + py * py);
  }

  // Projection scalar t of P onto AB
  let t = (px * bx + py * by) / segmentLengthSquared;
  t = Math.max(0, Math.min(1, t)); // Clamp to segment boundaries

  const projX = t * bx;
  const projY = t * by;

  const dx = px - projX;
  const dy = py - projY;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates minimum distance from a driver's GPS coordinate to any segment in a polyline
 */
export function calculateDistanceToPolylineMeters(driverLat, driverLon, polylineCoordinates) {
  if (!polylineCoordinates || polylineCoordinates.length < 2) return 0;

  let minDistanceMeters = Infinity;

  for (let i = 0; i < polylineCoordinates.length - 1; i++) {
    const a = polylineCoordinates[i];
    const b = polylineCoordinates[i + 1];

    const dist = calculateCrossTrackDistanceMeters(
      driverLat, driverLon,
      a[0], a[1],
      b[0], b[1]
    );

    if (dist < minDistanceMeters) {
      minDistanceMeters = dist;
    }
  }

  return Math.round(minDistanceMeters);
}

export class RoutingEngine {
  constructor(google = globalGoogleMapsClient, mapbox = globalMapboxClient) {
    this.google = google;
    this.mapbox = mapbox;
    this.routeCache = new Map(); // cacheKey -> { route, timestamp }
    this.activeBookingRoutes = new Map(); // bookingId -> current calculated route
  }

  /**
   * Generates a stable cache key for route coordinates
   */
  getCacheKey(originLat, originLon, destLat, destLon) {
    const r = (val) => Number(val).toFixed(4);
    return `${r(originLat)},${r(originLon)}:${r(destLat)},${r(destLon)}`;
  }

  /**
   * Computes authoritative road route with dynamic traffic ETA and server-side caching
   */
  async computeRoadRoute(origin, destination, options = {}) {
    const originLat = Number(origin.latitude || origin.lat);
    const originLon = Number(origin.longitude || origin.lon);
    const destLat = Number(destination.latitude || destination.lat);
    const destLon = Number(destination.longitude || destination.lon);

    if (isNaN(originLat) || isNaN(originLon) || isNaN(destLat) || isNaN(destLon)) {
      throw new Error('Valid numeric coordinates are required for origin and destination');
    }

    // 1. Check LRU Cache (saves external API costs)
    const cacheKey = this.getCacheKey(originLat, originLon, destLat, destLon);
    const now = Date.now();
    const cached = this.routeCache.get(cacheKey);

    if (cached && (now - cached.timestamp < MAPS_CONFIG.cache.ttlSeconds * 1000) && !options.bypassCache) {
      // Re-apply current traffic condition to cached base duration
      const traffic = getCurrentTrafficMultiplier();
      const adjustedMinutes = Math.max(3, Math.round(cached.route.baseDurationMinutes * traffic.factor));

      return {
        ...cached.route,
        durationMinutes: adjustedMinutes,
        trafficMultiplier: traffic.factor,
        trafficCondition: traffic.condition,
        isFromCache: true
      };
    }

    // 2. Fetch from active provider or fallback
    let route = null;
    if (this.google.isConfigured) {
      route = await this.google.getDirections(
        { latitude: originLat, longitude: originLon },
        { latitude: destLat, longitude: destLon }
      );
    } else if (this.mapbox.isConfigured) {
      route = await this.mapbox.getDirections(
        { latitude: originLat, longitude: originLon },
        { latitude: destLat, longitude: destLon }
      );
    } else {
      // Native Indian Road Graph Network Simulator
      route = calculateOfflineRoadRoute(originLat, originLon, destLat, destLon);
    }

    // 3. Compute Traffic-Aware ETA
    const traffic = getCurrentTrafficMultiplier();
    const baseDuration = route.baseDurationMinutes || route.durationMinutes || 10;
    const finalDurationMinutes = Math.max(3, Math.round(baseDuration * traffic.factor));

    // Ensure road distance is greater than or equal to straight line
    const straightLineDistanceKm = calculateHaversineDistanceKm(originLat, originLon, destLat, destLon);
    const finalRoadDistanceKm = Math.max(
      Number(straightLineDistanceKm.toFixed(2)),
      route.roadDistanceKm || Number((straightLineDistanceKm * 1.3).toFixed(2))
    );

    const completedRoute = {
      origin: { latitude: originLat, longitude: originLon },
      destination: { latitude: destLat, longitude: destLon },
      straightLineDistanceKm: Number(straightLineDistanceKm.toFixed(2)),
      roadDistanceKm: finalRoadDistanceKm,
      roadDistanceMeters: Math.round(finalRoadDistanceKm * 1000),
      baseDurationMinutes: baseDuration,
      durationMinutes: finalDurationMinutes,
      trafficMultiplier: traffic.factor,
      trafficCondition: traffic.condition,
      polylineCoordinates: route.polylineCoordinates || [
        [originLat, originLon],
        [destLat, destLon]
      ],
      provider: route.provider || 'indian_road_graph',
      createdAt: new Date().toISOString()
    };

    // Store in cache
    if (this.routeCache.size >= MAPS_CONFIG.cache.maxEntries) {
      const oldestKey = this.routeCache.keys().next().value;
      this.routeCache.delete(oldestKey);
    }
    this.routeCache.set(cacheKey, { route: completedRoute, timestamp: now });

    if (options.bookingId) {
      this.activeBookingRoutes.set(options.bookingId, completedRoute);
    }

    return completedRoute;
  }

  /**
   * Evaluates driver position relative to active route for off-route deviation and arrival geofencing
   */
  async evaluateDriverProgress(booking, driverLocation) {
    if (!booking || !driverLocation) {
      return { success: false, message: 'Booking and driver location are required' };
    }

    const dLat = Number(driverLocation.latitude);
    const dLon = Number(driverLocation.longitude);
    const isTripInProgress = booking.status === 'in_progress';

    // Target is Dropoff if in_progress, else Pickup
    const targetLat = isTripInProgress ? Number(booking.dropLatitude) : Number(booking.pickupLatitude);
    const targetLon = isTripInProgress ? Number(booking.dropLongitude) : Number(booking.pickupLongitude);

    // 1. Calculate road route if not cached
    let currentRoute = this.activeBookingRoutes.get(booking.id);
    if (!currentRoute) {
      currentRoute = await this.computeRoadRoute(
        { latitude: dLat, longitude: dLon },
        { latitude: targetLat, longitude: targetLon },
        { bookingId: booking.id }
      );
    }

    // 2. Off-Route Detection: measure perpendicular distance to polyline
    const deviationMeters = calculateDistanceToPolylineMeters(dLat, dLon, currentRoute.polylineCoordinates);
    const isOffRoute = deviationMeters > MAPS_CONFIG.geofence.offRouteThresholdMeters;

    let recalculatedRoute = null;
    if (isOffRoute) {
      // Dynamic route recalculation from current off-route coordinates to target
      recalculatedRoute = await this.computeRoadRoute(
        { latitude: dLat, longitude: dLon },
        { latitude: targetLat, longitude: targetLon },
        { bookingId: booking.id, bypassCache: true }
      );
      this.activeBookingRoutes.set(booking.id, recalculatedRoute);

      // Broadcast Route Recalculation event
      globalRealtimeBus.publish(`customer:booking:${booking.id}`, 'ROUTE_RECALCULATED', {
        bookingId: booking.id,
        driverLocation: { latitude: dLat, longitude: dLon },
        deviationMeters,
        newRoute: recalculatedRoute
      }, booking.isDemo);
    }

    const activeRoute = recalculatedRoute || currentRoute;

    // 3. Arrival Geofence Detection (150 meters)
    const distanceToTargetKm = calculateHaversineDistanceKm(dLat, dLon, targetLat, targetLon);
    const distanceToTargetMeters = Math.round(distanceToTargetKm * 1000);
    const isInsideArrivalGeofence = distanceToTargetMeters <= MAPS_CONFIG.geofence.arrivalRadiusMeters;

    // Traffic-aware ETA to target
    const traffic = getCurrentTrafficMultiplier();
    const remainingEtaMinutes = Math.max(1, Math.round((distanceToTargetKm / 28) * 60 * traffic.factor));

    return {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      tripStatus: booking.status,
      driverLocation: { latitude: dLat, longitude: dLon },
      targetDestination: { latitude: targetLat, longitude: targetLon },
      remainingDistanceMeters: distanceToTargetMeters,
      remainingDistanceKm: Number(distanceToTargetKm.toFixed(2)),
      remainingEtaMinutes,
      isOffRoute,
      deviationMeters,
      isInsideArrivalGeofence,
      activeRoute: {
        roadDistanceKm: activeRoute.roadDistanceKm,
        durationMinutes: remainingEtaMinutes,
        polylineCoordinates: activeRoute.polylineCoordinates
      }
    };
  }
}

export const globalRoutingEngine = new RoutingEngine();
