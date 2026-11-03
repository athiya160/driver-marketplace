/**
 * PERSONAL DRIVER MARKETPLACE - GEOCODING & MAP PIN SEARCH SERVICE
 * Pan-India On-Demand Personal Driver Marketplace
 * "Your Car. Your Journey. Your Driver."
 * 
 * Provides address search, reverse geocoding for pin-drops, and Indian address structuring.
 */

import { globalGoogleMapsClient } from './googleMapsClient.js';
import { globalMapboxClient } from './mapboxClient.js';
import { MAPS_CONFIG } from './mapsConfig.js';
import { INDIAN_METRO_NODES } from './offlineRoadGraph.js';

export class GeocodingService {
  constructor(google = globalGoogleMapsClient, mapbox = globalMapboxClient) {
    this.google = google;
    this.mapbox = mapbox;
  }

  /**
   * Search for addresses with place predictions
   */
  async searchAddresses(query, sessionToken = null) {
    if (!query || query.trim().length === 0) {
      return { success: true, predictions: [] };
    }

    if (this.google.isConfigured) {
      const res = await this.google.autocompletePlaces(query, sessionToken);
      return { success: true, predictions: res.predictions };
    }

    if (this.mapbox.isConfigured) {
      const res = await this.mapbox.forwardGeocode(query);
      return {
        success: true,
        predictions: [
          {
            placeId: res.placeId,
            description: res.formattedAddress,
            mainText: query,
            secondaryText: res.formattedAddress
          }
        ]
      };
    }

    // Default simulator with rich Indian cities landmark dictionary
    const res = await this.google.autocompletePlaces(query, sessionToken);
    return { success: true, predictions: res.predictions };
  }

  /**
   * Forward Geocoding: resolves string address to coordinates
   */
  async geocode(address) {
    if (!address) throw new Error('Address is required');

    if (this.google.isConfigured) {
      return this.google.geocodeAddress(address);
    }
    if (this.mapbox.isConfigured) {
      return this.mapbox.forwardGeocode(address);
    }
    return this.google.geocodeAddress(address);
  }

  /**
   * Reverse Geocoding: maps pin drop coordinates to nearest Indian address
   */
  async reverseGeocode(latitude, longitude) {
    const lat = Number(latitude);
    const lon = Number(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      throw new Error('Valid numeric coordinates are required');
    }

    // Check bounds
    if (lat < MAPS_CONFIG.bounds.minLat || lat > MAPS_CONFIG.bounds.maxLat ||
        lon < MAPS_CONFIG.bounds.minLon || lon > MAPS_CONFIG.bounds.maxLon) {
      return {
        success: false,
        message: 'Pin is dropped outside the operational service boundary of India'
      };
    }

    if (this.google.isConfigured) {
      const gRes = await this.google.reverseGeocode(lat, lon);
      return { success: true, ...gRes };
    }

    if (this.mapbox.isConfigured) {
      const mRes = await this.mapbox.reverseGeocode(lat, lon);
      return { success: true, ...mRes };
    }

    // Find nearest known landmark in road graph
    let nearestLandmark = null;
    let minDist = Infinity;
    for (const node of Object.values(INDIAN_METRO_NODES)) {
      const d = Math.hypot(node.lat - lat, node.lon - lon);
      if (d < minDist) {
        minDist = d;
        nearestLandmark = node;
      }
    }

    const proximityDesc = minDist < 0.03
      ? `Near ${nearestLandmark.name}, ${nearestLandmark.city}`
      : `Sector Road, Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;

    return {
      success: true,
      formattedAddress: proximityDesc,
      landmark: nearestLandmark ? nearestLandmark.name : 'Main Road Access',
      city: nearestLandmark ? nearestLandmark.city : 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      latitude: lat,
      longitude: lon
    };
  }
}

export const globalGeocodingService = new GeocodingService();
