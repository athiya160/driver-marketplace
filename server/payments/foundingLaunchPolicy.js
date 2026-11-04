/**
 * PERSONAL DRIVER MARKETPLACE - FOUNDING LAUNCH POLICY ENGINE
 * Pan-India On-Demand Personal Driver Marketplace
 * "Your Car. Your Journey. Your Driver."
 * 
 * Implements the Founding Launch ₹0 Platform Commission Model:
 * - 0% Platform Commission on chauffeur base fares (normally 15%)
 * - ₹0 Customer Platform / Convenience Fee (normally ₹49)
 * - ₹0 Chauffeur Onboarding, Registration & Background Verification Fees
 * - 100% Driver Base Earnings Retention
 * - 100% Pass-Through of Outstation Daily Allowance (₹350) and Night Allowance (₹250)
 * - Chauffeur Labour is NOT free: Customers pay chauffeurs 100% directly via UPI/Cash
 * - Direct Chauffeur Settlement Tracking: 'direct_chauffeur_upi_cash'
 * - Active Limit: First 90 Days OR First 1,000 Completed Trips (whichever comes first)
 */

import { persistentStorage } from '../db/persistentStorage.js';
import { rupeesToPaise, paiseToRupees, formatINR } from './paymentValidation.js';

export const FOUNDING_LAUNCH_DEFAULTS = {
  policyId: 'flp_founding_2026',
  programName: 'Founding Chauffeur & Customer Launch Pilot',
  active: true,
  startDate: '2026-11-01T00:00:00.000Z',
  validityDays: 90,
  maxTrips: 1000,
  completedTrips: 0,
  platformCommissionPercent: 0, // 0% platform commission during founding launch
  standardCommissionPercent: 15, // Standard platform commission after founding launch
  platformConvenienceFeePaise: 0, // ₹0 convenience fee during founding launch
  standardConvenienceFeePaise: 4900, // Standard ₹49 convenience fee
  driverRegistrationFeePaise: 0, // ₹0 onboarding fee
  outstationDAPassThroughPercent: 100, // 100% pass-through
  nightAllowancePassThroughPercent: 100, // 100% pass-through
  directPaymentMethod: 'direct_chauffeur_upi_cash',
  allowedDirectMethods: ['direct_upi_qr', 'cash_in_hand', 'direct_chauffeur_upi_cash'],
  settlementModel: 'direct_p2p_chauffeur_settlement',
  pilotCity: 'Bengaluru',
  cumulativeWaivedCommissionPaise: 0,
  cumulativeChauffeurDirectEarningsPaise: 0,
  statutoryTaxNote: 'Direct P2P driver settlement under founding pilot. Chauffeur acts as independent contractor; GST applicability on platform intermediation is ₹0 during zero-fee period.',
  guarantees: [
    '₹0 Commission for the first 90 days or 1,000 completed trips',
    'Chauffeurs keep 100% of the agreed driving fare',
    '100% of Outstation DA (₹350) and Night Allowance (₹250) goes directly to Chauffeur',
    'Customers pay Chauffeur directly at journey completion via UPI QR or cash',
    'Zero hidden fees, zero surge traps, zero platform deductions'
  ]
};

export class FoundingLaunchPolicyManager {
  constructor() {
    this.initPolicy();
  }

  /**
   * Initializes or fetches policy from persistent database
   */
  initPolicy() {
    const table = persistentStorage.getTable('founding_launch_policy');
    if (!Array.isArray(table) || table.length === 0) {
      persistentStorage.insert('founding_launch_policy', { ...FOUNDING_LAUNCH_DEFAULTS });
    }
  }

  /**
   * Retrieves current active policy state
   */
  getPolicy() {
    const table = persistentStorage.getTable('founding_launch_policy');
    const policy = (Array.isArray(table) && table.length > 0) ? table[0] : FOUNDING_LAUNCH_DEFAULTS;
    return { ...policy };
  }

  /**
   * Calculates days elapsed since launch
   */
  getDaysElapsed() {
    const policy = this.getPolicy();
    const start = new Date(policy.startDate).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, now - start);
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculates days remaining in founding launch window
   */
  getDaysRemaining() {
    const policy = this.getPolicy();
    const elapsed = this.getDaysElapsed();
    return Math.max(0, policy.validityDays - elapsed);
  }

  /**
   * Calculates trips remaining before founding launch quota is reached
   */
  getTripsRemaining() {
    const policy = this.getPolicy();
    return Math.max(0, policy.maxTrips - (policy.completedTrips || 0));
  }

  /**
   * Determines whether founding launch 0% commission is currently active
   */
  isActive() {
    const policy = this.getPolicy();
    if (!policy.active) return false;
    if (this.getDaysRemaining() <= 0) return false;
    if (this.getTripsRemaining() <= 0) return false;
    return true;
  }

  /**
   * Comprehensive diagnostic status and metrics
   */
  getStatus() {
    const policy = this.getPolicy();
    const active = this.isActive();
    const daysElapsed = this.getDaysElapsed();
    const daysRemaining = this.getDaysRemaining();
    const tripsRemaining = this.getTripsRemaining();

    let deactivationReason = null;
    if (!policy.active) {
      deactivationReason = 'Manually deactivated by administrator';
    } else if (daysRemaining <= 0) {
      deactivationReason = `90-day validity window expired (${daysElapsed} days elapsed)`;
    } else if (tripsRemaining <= 0) {
      deactivationReason = `1,000 founding trip quota reached (${policy.completedTrips} trips completed)`;
    }

    return {
      active,
      deactivationReason,
      programName: policy.programName,
      startDate: policy.startDate,
      validityDays: policy.validityDays,
      daysElapsed,
      daysRemaining,
      maxTrips: policy.maxTrips,
      completedTrips: policy.completedTrips || 0,
      tripsRemaining,
      platformCommissionPercent: active ? 0 : policy.standardCommissionPercent,
      standardCommissionPercent: policy.standardCommissionPercent,
      platformConvenienceFeePaise: active ? 0 : policy.standardConvenienceFeePaise,
      platformConvenienceFeeFormatted: formatINR(active ? 0 : policy.standardConvenienceFeePaise),
      driverKeepPercent: active ? 100 : (100 - policy.standardCommissionPercent),
      outstationDAPassThroughPercent: policy.outstationDAPassThroughPercent,
      nightAllowancePassThroughPercent: policy.nightAllowancePassThroughPercent,
      directPaymentMethod: policy.directPaymentMethod,
      allowedDirectMethods: policy.allowedDirectMethods,
      cumulativeWaivedCommissionPaise: policy.cumulativeWaivedCommissionPaise || 0,
      cumulativeWaivedCommissionFormatted: formatINR(policy.cumulativeWaivedCommissionPaise || 0),
      cumulativeChauffeurDirectEarningsPaise: policy.cumulativeChauffeurDirectEarningsPaise || 0,
      cumulativeChauffeurDirectEarningsFormatted: formatINR(policy.cumulativeChauffeurDirectEarningsPaise || 0),
      guarantees: policy.guarantees,
      statutoryTaxNote: policy.statutoryTaxNote,
      pilotCity: policy.pilotCity
    };
  }

  /**
   * Computes financial split under founding launch policy
   */
  calculateFoundingSplit(booking) {
    const isPolicyActive = this.isActive();
    const totalFareRupees = Number(booking.totalFare) || 599;
    const baseFareRupees = Number(booking.baseFare) || totalFareRupees;
    const extraHoursRupees = Number(booking.extraHoursCharge) || 0;
    const nightChargeRupees = Number(booking.nightCharge) || 0;
    const outstationDARupees = Number(booking.outstationDA) || 0;

    const totalFarePaise = rupeesToPaise(totalFareRupees);
    const grossBasePaise = rupeesToPaise(baseFareRupees + extraHoursRupees);
    const nightAllowancePaise = rupeesToPaise(nightChargeRupees);
    const outstationDAPaise = rupeesToPaise(outstationDARupees);

    if (isPolicyActive) {
      // Founding Launch: 0% platform commission, 100% to chauffeur + 100% allowances, ₹0 convenience fee
      const platformCommissionPaise = 0;
      const driverNetPayablePaise = grossBasePaise + nightAllowancePaise + outstationDAPaise;
      const platformNetRevenuePaise = 0;
      const waivedCommissionPaise = Math.round(grossBasePaise * 0.15); // Standard 15% waived

      return {
        isFoundingLaunch: true,
        totalFarePaise,
        totalFareFormatted: formatINR(totalFarePaise),
        grossBasePaise,
        nightAllowancePaise,
        outstationDAPaise,
        platformCommissionPaise: 0,
        platformCommissionFormatted: formatINR(0),
        waivedCommissionPaise,
        waivedCommissionFormatted: formatINR(waivedCommissionPaise),
        driverBasePaise: grossBasePaise,
        driverNetPayablePaise,
        driverNetPayableFormatted: formatINR(driverNetPayablePaise),
        platformNetRevenuePaise: 0,
        platformNetRevenueFormatted: formatINR(0),
        platformConvenienceFeePaise: 0,
        platformConvenienceFeeFormatted: formatINR(0),
        commissionSplit: '100% Chauffeur / 0% Platform (Founding Launch Waiver)',
        allowancePolicy: '100% Night & Outstation Allowances pass through directly to Chauffeur',
        paymentMethod: 'direct_chauffeur_upi_cash',
        paymentSettlementMode: 'direct_customer_to_chauffeur',
        customerNotice: 'Direct Chauffeur Settlement: Please scan chauffeur QR or pay cash directly. Platform fee is ₹0.'
      };
    }

    // Standard 85/15 model when founding launch is inactive/expired
    const standardCommissionPaise = Math.round(grossBasePaise * 0.15);
    const driverNetPayablePaise = (grossBasePaise - standardCommissionPaise) + nightAllowancePaise + outstationDAPaise;
    const platformNetRevenuePaise = standardCommissionPaise + 4900; // ₹49 standard convenience fee

    return {
      isFoundingLaunch: false,
      totalFarePaise,
      totalFareFormatted: formatINR(totalFarePaise),
      grossBasePaise,
      nightAllowancePaise,
      outstationDAPaise,
      platformCommissionPaise: standardCommissionPaise,
      platformCommissionFormatted: formatINR(standardCommissionPaise),
      waivedCommissionPaise: 0,
      waivedCommissionFormatted: formatINR(0),
      driverBasePaise: grossBasePaise - standardCommissionPaise,
      driverNetPayablePaise,
      driverNetPayableFormatted: formatINR(driverNetPayablePaise),
      platformNetRevenuePaise,
      platformNetRevenueFormatted: formatINR(platformNetRevenuePaise),
      platformConvenienceFeePaise: 4900,
      platformConvenienceFeeFormatted: formatINR(4900),
      commissionSplit: '85% Chauffeur / 15% Platform',
      allowancePolicy: '100% Night & Outstation Allowances pass through directly to Chauffeur',
      paymentMethod: booking.paymentMethod || 'upi',
      paymentSettlementMode: 'platform_escrow_settlement',
      customerNotice: 'Standard platform booking with payment protection.'
    };
  }

  /**
   * Records a completed founding trip, updating cumulative counters
   */
  recordCompletedTrip(tripFinancialSplit) {
    const table = persistentStorage.getTable('founding_launch_policy');
    const policy = (Array.isArray(table) && table.length > 0) ? table[0] : null;

    if (!policy) return null;

    const tripsCompleted = (policy.completedTrips || 0) + 1;
    const waivedPaise = (policy.cumulativeWaivedCommissionPaise || 0) + (tripFinancialSplit.waivedCommissionPaise || 0);
    const driverEarningsPaise = (policy.cumulativeChauffeurDirectEarningsPaise || 0) + (tripFinancialSplit.driverNetPayablePaise || 0);

    policy.completedTrips = tripsCompleted;
    policy.cumulativeWaivedCommissionPaise = waivedPaise;
    policy.cumulativeChauffeurDirectEarningsPaise = driverEarningsPaise;
    policy.lastUpdated = new Date().toISOString();

    persistentStorage.persist();

    return {
      completedTrips: tripsCompleted,
      tripsRemaining: Math.max(0, policy.maxTrips - tripsCompleted),
      cumulativeWaivedCommissionPaise: waivedPaise,
      cumulativeWaivedCommissionFormatted: formatINR(waivedPaise),
      cumulativeChauffeurDirectEarningsPaise: driverEarningsPaise,
      cumulativeChauffeurDirectEarningsFormatted: formatINR(driverEarningsPaise)
    };
  }

  /**
   * Admin configuration update
   */
  updatePolicy(updates = {}) {
    const table = persistentStorage.getTable('founding_launch_policy');
    const policy = (Array.isArray(table) && table.length > 0) ? table[0] : null;

    if (!policy) return null;

    const allowedFields = [
      'active',
      'validityDays',
      'maxTrips',
      'programName',
      'pilotCity',
      'statutoryTaxNote',
      'guarantees'
    ];

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        policy[key] = updates[key];
      }
    }

    policy.lastUpdated = new Date().toISOString();
    persistentStorage.persist();

    return this.getStatus();
  }

  /**
   * Records direct customer-to-chauffeur settlement confirmation
   */
  recordDirectSettlement({
    bookingId,
    driverId,
    amountPaise,
    paymentMode = 'direct_upi_qr',
    reference = null,
    confirmedBy = 'customer'
  }) {
    const settlementId = `dir_stl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const record = {
      id: settlementId,
      bookingId,
      driverId,
      amountPaise,
      amountFormatted: formatINR(amountPaise),
      platformFeePaise: 0,
      platformCommissionPaise: 0,
      paymentMode, // 'direct_upi_qr' | 'cash_in_hand' | 'direct_chauffeur_upi_cash'
      transactionReference: reference || `UPI/DIR/${Date.now()}`,
      status: 'paid_to_chauffeur',
      confirmedBy,
      settledAt: new Date().toISOString(),
      policy: 'founding_launch_zero_commission'
    };

    persistentStorage.insert('direct_chauffeur_settlements', record);

    // Also update booking status if present
    const bookings = persistentStorage.getTable('bookings');
    const booking = bookings.find(b => b.id === bookingId || b.bookingReference === bookingId);
    if (booking) {
      booking.paymentStatus = 'paid_to_chauffeur';
      booking.directSettlementId = settlementId;
      booking.paymentMethod = paymentMode;
      persistentStorage.persist();
    }

    return record;
  }
}

export const globalFoundingLaunchPolicy = new FoundingLaunchPolicyManager();
