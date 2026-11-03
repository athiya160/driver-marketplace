/**
 * PERSONAL DRIVER MARKETPLACE - MAPS & GEOLOCATION CONFIGURATION
 * Pan-India On-Demand Personal Driver Marketplace
 * "Your Car. Your Journey. Your Driver."
 * 
 * Provider selection, cost-control limits, caching rules & Indian traffic curves.
 */

// Active Provider Modes: 'google_maps' | 'mapbox' | 'simulator'
export const MAP_PROVIDERS = {
  GOOGLE_MAPS: 'google_maps',
  MAPBOX: 'mapbox',
  SIMULATOR: 'simulator'
};

export const MAPS_CONFIG = {
  // Provider Selection: prefers GOOGLE_MAPS if key present, then MAPBOX, else SIMULATOR
  defaultProvider: process.env.GOOGLE_MAPS_API_KEY
    ? MAP_PROVIDERS.GOOGLE_MAPS
    : process.env.MAPBOX_ACCESS_TOKEN
    ? MAP_PROVIDERS.MAPBOX
    : MAP_PROVIDERS.SIMULATOR,

  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || null,
  mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN || null,

  // Cache configuration to limit expensive 3rd-party API calls
  cache: {
    enabled: true,
    ttlSeconds: 900, // 15 minutes cache for identical routes
    maxEntries: 1000
  },

  // Rate Limiting per IP/Client
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60      // max 60 requests per minute
  },

  // Geofence thresholds (in kilometers and meters)
  geofence: {
    arrivalRadiusMeters: 150,     // 150m arrival detection
    arrivalRadiusKm: 0.150,
    offRouteThresholdMeters: 100, // 100m off-route detection
    offRouteThresholdKm: 0.100
  },

  // Indian Road & Territory Bounding
  bounds: {
    minLat: 6.0,
    maxLat: 38.0,
    minLon: 68.0,
    maxLon: 98.0
  },

  // Traffic congestion multipliers for Indian Metro Corridors (IST)
  trafficMultipliers: {
    morningPeak: { startHour: 8.5, endHour: 11.5, factor: 1.55 }, // 8:30 AM - 11:30 AM
    eveningPeak: { startHour: 17.5, endHour: 21.0, factor: 1.70 }, // 5:30 PM - 9:00 PM
    regularDay: { startHour: 11.5, endHour: 17.5, factor: 1.15 },  // 11:30 AM - 5:30 PM
    lateNight: { startHour: 23.0, endHour: 5.5, factor: 0.90 }     // 11:00 PM - 5:30 AM
  }
};

/**
 * Returns current Indian city traffic congestion multiplier based on current IST time
 */
export function getCurrentTrafficMultiplier(date = new Date()) {
  // Convert to Indian Standard Time (UTC + 5:30)
  const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
  const istTime = new Date(utcTime + 3600000 * 5.5);
  const hour = istTime.getHours() + istTime.getMinutes() / 60;

  const { morningPeak, eveningPeak, regularDay, lateNight } = MAPS_CONFIG.trafficMultipliers;

  if (hour >= morningPeak.startHour && hour < morningPeak.endHour) {
    return { factor: morningPeak.factor, condition: 'Heavy Morning Peak Traffic' };
  }
  if (hour >= eveningPeak.startHour && hour < eveningPeak.endHour) {
    return { factor: eveningPeak.factor, condition: 'Severe Evening Rush Traffic' };
  }
  if (hour >= regularDay.startHour && hour < regularDay.endHour) {
    return { factor: regularDay.factor, condition: 'Moderate Daytime City Traffic' };
  }
  if (hour >= lateNight.startHour || hour < lateNight.endHour) {
    return { factor: lateNight.factor, condition: 'Light Late Night Traffic' };
  }

  return { factor: 1.0, condition: 'Standard Flow' };
}
