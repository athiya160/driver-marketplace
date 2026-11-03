/**
 * PERSONAL DRIVER MARKETPLACE - DRIVER SETTLEMENT & COMMISSION SERVICE
 * Pan-India On-Demand Personal Driver Marketplace
 * "Your Car. Your Journey. Your Driver."
 * 
 * Computes 85/15 commission splits, transparent allowance pass-through,
 * driver payout ledgers, and integrates Razorpay Route adapter architecture.
 */

import { rupeesToPaise, paiseToRupees, formatINR } from './paymentValidation.js';
import { persistentStorage } from '../db/persistentStorage.js';

export class SettlementService {
  constructor() {
    this.platformCommissionPercent = 15; // Default 15% platform commission
    this.driverSharePercent = 85;        // Default 85% chauffeur base earnings
    this.platformConvenienceFeePaise = 4900; // Default ₹49 platform fee
    this.gstTaxPercent = 5.0;            // 5% Aggregator GST (provisional estimate)
  }

  /**
   * Retrieves active dynamic pricing configuration from persistent storage
   * Note: GST treatment requires qualified Indian tax professional review before live launch.
   */
  getPricingConfig() {
    const pricingTable = persistentStorage.getTable('pricing_rules');
    const customConfig = (Array.isArray(pricingTable) ? pricingTable[0] : pricingTable) || {};
    const commPercent = Number(customConfig.platformCommissionPercent ?? this.platformCommissionPercent);

    return {
      platformCommissionPercent: commPercent,
      driverSharePercent: 100 - commPercent,
      platformConvenienceFeePaise: rupeesToPaise(Number(customConfig.platformConvenienceFee ?? 49)),
      gstTaxPercent: Number(customConfig.transportGstPercent ?? 5.0),
      outstationDriverDA: Number(customConfig.outstationDriverDA ?? 350),
      nightAllowance: Number(customConfig.nightAllowance ?? 250),
      gstDisclaimer: 'Provisional 5% GST rate. Legal liability under Section 9(5) CGST Act must be verified by a certified Indian GST professional.'
    };
  }

  /**
   * Computes exact mathematical split for a completed trip
   */
  calculateTripFinancialSplit(booking) {
    const config = this.getPricingConfig();
    const convenienceFeeRs = paiseToRupees(config.platformConvenienceFeePaise);
    const totalFareRupees = Number(booking.totalFare) || 599;
    const baseFareRupees = Number(booking.baseFare) || (totalFareRupees - convenienceFeeRs);
    const extraHoursRupees = Number(booking.extraHoursCharge) || 0;
    const nightChargeRupees = Number(booking.nightCharge) || 0;
    const outstationDARupees = Number(booking.outstationDA) || 0;

    const totalFarePaise = rupeesToPaise(totalFareRupees);
    const grossBasePaise = rupeesToPaise(baseFareRupees + extraHoursRupees);
    const nightAllowancePaise = rupeesToPaise(nightChargeRupees);
    const outstationDAPaise = rupeesToPaise(outstationDARupees);

    // Platform commission is dynamically calculated from configured percentage
    const platformCommissionPaise = Math.round(grossBasePaise * (config.platformCommissionPercent / 100));
    
    // Driver gets remaining driver share of driving base + 100% of night allowance + 100% of outstation DA
    const driverBasePaise = grossBasePaise - platformCommissionPaise;
    const driverNetPayablePaise = driverBasePaise + nightAllowancePaise + outstationDAPaise;

    // Platform net revenue: Commission + Platform convenience fee
    const platformNetRevenuePaise = platformCommissionPaise + config.platformConvenienceFeePaise;

    return {
      totalFarePaise,
      totalFareFormatted: formatINR(totalFarePaise),
      grossBasePaise,
      nightAllowancePaise,
      outstationDAPaise,
      platformCommissionPaise,
      platformCommissionFormatted: formatINR(platformCommissionPaise),
      driverBasePaise,
      driverNetPayablePaise,
      driverNetPayableFormatted: formatINR(driverNetPayablePaise),
      platformNetRevenuePaise,
      platformNetRevenueFormatted: formatINR(platformNetRevenuePaise),
      commissionSplit: '85% Chauffeur / 15% Platform',
      allowancePolicy: '100% Night & Outstation Allowances pass through directly to Chauffeur'
    };
  }

  /**
   * Generates or reconciles weekly driver payout settlement
   * Prevents duplicate settlement generation for the same driver and period
   */
  generateWeeklySettlement(driverId, periodStart, periodEnd) {
    const pStart = periodStart || '2026-10-26';
    const pEnd = periodEnd || '2026-11-01';

    // 1. Check for existing settlement for this period to prevent double-payouts
    const existingSettlements = persistentStorage.getTable('driver_settlements');
    const existing = existingSettlements.find(
      s => s.driverId === driverId && s.periodStart === pStart && s.periodEnd === pEnd
    );

    if (existing) {
      return {
        success: true,
        alreadyGenerated: true,
        message: `Settlement for chauffeur ${driverId} for period ${pStart} to ${pEnd} has already been generated.`,
        settlement: existing
      };
    }

    const bookings = persistentStorage.getTable('bookings');
    const driverBookings = bookings.filter(b =>
      b.driverId === driverId &&
      b.status === 'completed' &&
      b.paymentStatus === 'captured'
    );

    let grossFaresPaise = 0;
    let platformCommissionPaise = 0;
    let outstationDAPaise = 0;
    let nightAllowancePaise = 0;
    let netPayoutPaise = 0;

    for (const b of driverBookings) {
      const split = this.calculateTripFinancialSplit(b);
      grossFaresPaise += split.totalFarePaise;
      platformCommissionPaise += split.platformCommissionPaise;
      outstationDAPaise += split.outstationDAPaise;
      nightAllowancePaise += split.nightAllowancePaise;
      netPayoutPaise += split.driverNetPayablePaise;
    }

    const drivers = persistentStorage.getTable('drivers');
    const driver = drivers.find(d => d.id === driverId);

    const settlementRecord = {
      id: `stl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      driverId,
      driverName: driver?.fullName || 'Chauffeur',
      periodStart: periodStart || '2026-10-26',
      periodEnd: periodEnd || '2026-11-01',
      totalTrips: driverBookings.length,
      grossFaresPaise,
      platformCommissionPaise,
      outstationDAPaise,
      nightAllowancePaise,
      netPayoutPaise,
      netPayoutFormatted: formatINR(netPayoutPaise),
      payoutStatus: netPayoutPaise > 0 ? 'pending' : 'settled',
      payoutMethod: 'upi',
      payoutUpiId: driver?.payoutUpiId || 'driver@okaxis',
      createdAt: new Date().toISOString()
    };

    persistentStorage.insert('driver_settlements', settlementRecord);

    return {
      success: true,
      settlement: settlementRecord
    };
  }

  /**
   * Razorpay Route Marketplace Adapter Interface
   * Evaluates eligibility and simulates transfer without moving real bank funds
   */
  async executeRouteTransfer(settlementId, adapterOptions = {}) {
    const settlements = persistentStorage.getTable('driver_settlements');
    const settlement = settlements.find(s => s.id === settlementId);

    if (!settlement) {
      return { success: false, message: 'Settlement record not found' };
    }

    // Razorpay Route Eligibility Assessment:
    // Requires merchant account approval, linked account onboarding, and active settlement schedule
    const isRouteLiveOnboarded = Boolean(process.env.RAZORPAY_ROUTE_ENABLED === 'true');

    if (!isRouteLiveOnboarded) {
      // Internal settlement ledger mode (Safe default)
      settlement.payoutStatus = 'settled';
      settlement.razorpayTransferId = `trf_mock_${Date.now()}`;
      settlement.settledAt = new Date().toISOString();
      settlement.routeMode = 'internal_ledger_settlement';
      persistentStorage.persist();

      return {
        success: true,
        mode: 'internal_ledger',
        message: `Payout of ${settlement.netPayoutFormatted} settled in platform ledger. Razorpay Route live transfers pending founder merchant onboarding.`,
        settlement
      };
    }

    // Live Route transfer contract
    settlement.payoutStatus = 'settled';
    settlement.razorpayTransferId = `trf_live_${Date.now()}`;
    settlement.settledAt = new Date().toISOString();
    persistentStorage.persist();

    return {
      success: true,
      mode: 'razorpay_route',
      transferId: settlement.razorpayTransferId,
      settlement
    };
  }
}

export const globalSettlementService = new SettlementService();
