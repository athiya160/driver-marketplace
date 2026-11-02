/**
 * PERSONAL DRIVER MARKETPLACE - DEMO ENVIRONMENT MANAGER
 * Manages isolated synthetic demo state, role switching, deterministic simulations, and 1-click reset.
 * All demo actions affect ONLY this in-memory sandbox and NEVER touch real production databases.
 */

import {
  DEMO_CUSTOMERS,
  DEMO_DRIVERS,
  DEMO_DOCUMENTS,
  DEMO_BOOKINGS,
  DEMO_CITIES,
  DEMO_COUPONS,
  DEMO_SUPPORT_TICKETS,
  DEMO_REVIEWS,
  DEMO_AUDIT_LOGS
} from './demoSeedData.js';

export class DemoManager {
  constructor() {
    this.resetToBaseline();
  }

  resetToBaseline() {
    this.customers = JSON.parse(JSON.stringify(DEMO_CUSTOMERS));
    this.drivers = JSON.parse(JSON.stringify(DEMO_DRIVERS));
    this.documents = JSON.parse(JSON.stringify(DEMO_DOCUMENTS));
    this.bookings = JSON.parse(JSON.stringify(DEMO_BOOKINGS));
    this.cities = JSON.parse(JSON.stringify(DEMO_CITIES));
    this.coupons = JSON.parse(JSON.stringify(DEMO_COUPONS));
    this.tickets = JSON.parse(JSON.stringify(DEMO_SUPPORT_TICKETS));
    this.reviews = JSON.parse(JSON.stringify(DEMO_REVIEWS));
    this.auditLogs = JSON.parse(JSON.stringify(DEMO_AUDIT_LOGS));
    this.currentRole = 'customer';
    this.currentUser = this.customers[0]; // Rohan Sharma (Demo)
    this.pricingRules = {
      baseHourlyRate: 299,
      extraHourlyRate: 120,
      fullDay8Hours: 1199,
      outstationDriverDA: 350,
      nightAllowance: 250,
      platformConvenienceFee: 49,
      platformCommissionPercent: 15,
      transportGstPercent: 5.0
    };
    this.lastResetAt = new Date().toISOString();
    return {
      success: true,
      message: 'Demo environment reset to pristine baseline state.',
      resetAt: this.lastResetAt
    };
  }

  switchDemoRole(role) {
    if (role === 'customer') {
      this.currentRole = 'customer';
      this.currentUser = this.customers[0]; // Rohan Sharma
    } else if (role === 'driver') {
      this.currentRole = 'driver';
      this.currentUser = {
        id: this.drivers[0].id,
        fullName: this.drivers[0].fullName,
        phone: this.drivers[0].phone,
        email: 'arjun.gowda.demo@example.com',
        role: 'driver'
      };
    } else if (role === 'admin') {
      this.currentRole = 'admin';
      this.currentUser = {
        id: 'demo_adm_001',
        fullName: 'Marketplace Operations Admin',
        phone: '+91 99999 88888',
        email: 'admin.ops@example.com',
        role: 'admin'
      };
    } else {
      return { success: false, message: 'Invalid demo role' };
    }

    return {
      success: true,
      role: this.currentRole,
      user: this.currentUser
    };
  }

  // Deterministic GPS Simulation along Bengaluru route (Indiranagar -> Outer Ring Road)
  simulateStepTrip(bookingId, targetStep) {
    const booking = this.bookings.find(b => b.id === bookingId || b.bookingReference === bookingId);
    if (!booking) return { success: false, message: 'Booking not found' };

    const assignedDriver = this.drivers.find(d => d.id === booking.driverId) || this.drivers[0];

    if (targetStep === 'arriving') {
      booking.status = 'arriving';
      // Simulate moving closer (1.2 km away)
      assignedDriver.currentLatitude = 12.9750;
      assignedDriver.currentLongitude = 77.6430;
      assignedDriver.speed = 32;
    } else if (targetStep === 'arrived') {
      booking.status = 'arrived';
      // Simulate entering arrival geofence (< 50 meters away)
      assignedDriver.currentLatitude = booking.pickupLatitude;
      assignedDriver.currentLongitude = booking.pickupLongitude;
      assignedDriver.speed = 0;
    } else if (targetStep === 'start_trip') {
      booking.status = 'in_progress';
      booking.startedAt = new Date().toISOString();
    } else if (targetStep === 'complete_trip') {
      booking.status = 'completed';
      booking.completedAt = new Date().toISOString();
      booking.paymentStatus = 'captured';
    }

    return {
      success: true,
      booking,
      driver: assignedDriver,
      step: targetStep
    };
  }

  getDemoAnalytics() {
    const totalGmv = this.bookings.reduce((sum, b) => sum + (b.totalFare || 0), 0) + 842000;
    const platformNet = Math.round(totalGmv * 0.15) + (this.bookings.length * 49);
    const driverPayouts = totalGmv - platformNet;

    return {
      totalGMV: totalGmv,
      platformRevenue: platformNet,
      driverPayoutsTotal: driverPayouts,
      activeTripsNow: this.bookings.filter(b => b.status === 'in_progress').length,
      totalCustomers: this.customers.length + 8400,
      totalDrivers: this.drivers.length,
      verifiedDrivers: this.drivers.filter(d => d.verificationStatus === 'approved').length,
      pendingKyc: this.documents.filter(d => d.status === 'pending').length,
      serviceBreakdown: {
        hourly: 1850,
        outstation: 720,
        airport: 420,
        daily: 130
      }
    };
  }
}

export const demoManager = new DemoManager();
