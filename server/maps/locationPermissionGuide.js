/**
 * PERSONAL DRIVER MARKETPLACE - LOCATION PERMISSIONS & BATTERY MANAGEMENT SPECIFICATION
 * Pan-India On-Demand Personal Driver Marketplace
 * "Your Car. Your Journey. Your Driver."
 * 
 * Provides client-side implementation guidelines for Expo / React Native & Web apps:
 * 1. Android & iOS Foreground and Background Location Permission models
 * 2. Battery optimization & dynamic distance filtering
 * 3. Graceful handling of GPS loss & dead reckoning
 */

export const LOCATION_MANAGEMENT_SPEC = {
  // 1. Mobile (React Native / Expo) Permissions Configuration
  mobilePermissions: {
    android: {
      foregroundPermission: 'android.permission.ACCESS_FINE_LOCATION',
      backgroundPermission: 'android.permission.ACCESS_BACKGROUND_LOCATION',
      foregroundServiceType: 'location',
      notificationTitle: 'Chauffeur On Duty',
      notificationBody: 'Sharing live location with customer and operations center'
    },
    ios: {
      usageDescriptionWhenInUse: 'Personal Driver Marketplace requires your location to match nearby vehicle owners and provide navigation.',
      usageDescriptionAlways: 'Location access is required in the background to track on-duty trips and calculate accurate arrival times.'
    }
  },

  // 2. Battery Conservation & Dynamic Distance Filters
  batteryOptimization: {
    // Distance filter in meters before firing GPS callback
    movingDistanceFilterMeters: 10,
    // Stationary update interval when vehicle is parked/idle (60 seconds)
    stationaryIntervalMs: 60 * 1000,
    // Active navigation interval (3 seconds)
    activeDrivingIntervalMs: 3 * 1000,
    // Dynamic accuracy mode
    accuracyModes: {
      onDutyDriving: 'Accuracy.High',       // GPS lock for navigation
      onDutyWaiting: 'Accuracy.Balanced',   // Cell + Wi-Fi tower triangulation (saves 70% battery)
      offDuty: 'Accuracy.Lowest'
    }
  },

  // 3. Web Geolocation API Options
  webGeolocationOptions: {
    enableHighAccuracy: true,
    timeout: 10000,      // 10s timeout
    maximumAge: 2000     // 2s cache
  },

  // 4. Dead Reckoning & Tunnel GPS Loss Projection
  deadReckoning: {
    maxProjectionSeconds: 180, // Project location along route for up to 3 mins
    speedDampingFactor: 0.95   // Gradually damp speed during tunnel transit
  }
};

/**
 * Dead Reckoning Simulator: Projects next coordinate if GPS signal drops temporarily
 */
export function projectDeadReckoningPosition(lastKnownLocation, headingDegrees, speedKmh, elapsedSeconds) {
  if (!lastKnownLocation || !headingDegrees || !speedKmh) return lastKnownLocation;

  const distanceKm = (speedKmh * Math.min(elapsedSeconds, 180)) / 3600;
  const earthRadiusKm = 6371;

  const latRad = (lastKnownLocation.latitude * Math.PI) / 180;
  const lonRad = (lastKnownLocation.longitude * Math.PI) / 180;
  const bearingRad = (headingDegrees * Math.PI) / 180;

  const projectedLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(distanceKm / earthRadiusKm) +
    Math.cos(latRad) * Math.sin(distanceKm / earthRadiusKm) * Math.cos(bearingRad)
  );

  const projectedLonRad = lonRad + Math.atan2(
    Math.sin(bearingRad) * Math.sin(distanceKm / earthRadiusKm) * Math.cos(latRad),
    Math.cos(distanceKm / earthRadiusKm) - Math.sin(latRad) * Math.sin(projectedLatRad)
  );

  return {
    latitude: Number(((projectedLatRad * 180) / Math.PI).toFixed(6)),
    longitude: Number(((projectedLonRad * 180) / Math.PI).toFixed(6)),
    speed: Math.round(speedKmh * 0.95),
    heading: headingDegrees,
    isDeadReckoned: true,
    projectedAt: new Date().toISOString()
  };
}
