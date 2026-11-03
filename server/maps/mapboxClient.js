/**
 * PERSONAL DRIVER MARKETPLACE - MAPBOX PLATFORM CLIENT (ALTERNATIVE PROVIDER)
 * Pan-India On-Demand Personal Driver Marketplace
 * "Your Car. Your Journey. Your Driver."
 * 
 * Provides failover and alternative vector-tile routing integration with Mapbox Directions & Geocoding APIs.
 */

import { MAPS_CONFIG } from './mapsConfig.js';
import { calculateOfflineRoadRoute } from './offlineRoadGraph.js';

const MAPBOX_BASE_URL = 'https://api.mapbox.com';

export class MapboxClient {
  constructor(accessToken = MAPS_CONFIG.mapboxAccessToken) {
    this.accessToken = accessToken;
    this.isConfigured = Boolean(accessToken && accessToken.length > 15 && accessToken.startsWith('pk.'));
  }

  /**
   * Forward Geocoding via Mapbox Geocoding API v5
   */
  async forwardGeocode(query) {
    if (!query) throw new Error('Query string is required for geocoding');

    if (this.isConfigured) {
      try {
        const url = `${MAPBOX_BASE_URL}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=in&access_token=${this.accessToken}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const first = data.features[0];
          const [lon, lat] = first.center;
          return {
            latitude: lat,
            longitude: lon,
            formattedAddress: first.place_name,
            placeId: first.id
          };
        }
      } catch (err) {
        console.warn('Mapbox forward geocode call failed, falling back to simulator:', err.message);
      }
    }

    // Default simulator
    return {
      latitude: 12.9719,
      longitude: 77.6412,
      formattedAddress: `${query}, India`,
      placeId: `mbx_${Date.now()}`
    };
  }

  /**
   * Reverse Geocoding via Mapbox Geocoding API v5
   */
  async reverseGeocode(latitude, longitude) {
    if (this.isConfigured) {
      try {
        const url = `${MAPBOX_BASE_URL}/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${this.accessToken}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const first = data.features[0];
          return {
            formattedAddress: first.place_name,
            placeId: first.id
          };
        }
      } catch (err) {
        console.warn('Mapbox reverse geocode failed, using simulator:', err.message);
      }
    }

    return {
      formattedAddress: `Road Point (${latitude.toFixed(4)}, ${longitude.toFixed(4)}), India`,
      placeId: `mbx_rev_${Date.now()}`
    };
  }

  /**
   * Directions via Mapbox Directions API v5 (Driving profile)
   */
  async getDirections(origin, destination) {
    if (this.isConfigured) {
      try {
        const oLon = origin.longitude;
        const oLat = origin.latitude;
        const dLon = destination.longitude;
        const dLat = destination.latitude;

        const url = `${MAPBOX_BASE_URL}/directions/v5/mapbox/driving/${oLon},${oLat};${dLon},${dLat}?geometries=geojson&overview=full&access_token=${this.accessToken}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);

          return {
            roadDistanceMeters: Math.round(route.distance),
            roadDistanceKm: Number((route.distance / 1000).toFixed(2)),
            durationSeconds: Math.round(route.duration),
            durationMinutes: Math.round(route.duration / 60),
            polylineCoordinates: coordinates,
            provider: 'mapbox_platform'
          };
        }
      } catch (err) {
        console.warn('Mapbox Directions failed, using offline road graph simulator:', err.message);
      }
    }

    return calculateOfflineRoadRoute(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
  }
}

export const globalMapboxClient = new MapboxClient();
