/**
 * PERSONAL DRIVER MARKETPLACE - MARKETPLACE PAYMENT & CANCELLATION POLICIES
 * Pan-India On-Demand Personal Driver Marketplace
 * "Your Car. Your Journey. Your Driver."
 * 
 * Documents operational business rules, default policies, and required founder decisions.
 */

export const PAYMENT_POLICIES = {
  // Active default policy: Full upfront payment captured on booking confirmation
  currentModel: 'UPFRONT_FULL_FARE',

  supportedModels: {
    UPFRONT_FULL_FARE: {
      id: 'UPFRONT_FULL_FARE',
      title: 'Full Upfront Fare Authorization & Capture',
      description: 'Customer pays estimated total fare at the time of booking confirmation. Overages (extra hours) reconciled at trip completion with explicit customer approval.',
      isDefault: true
    },
    ADVANCE_DEPOSIT: {
      id: 'ADVANCE_DEPOSIT',
      title: 'Booking Advance Deposit + Balance Post-Trip',
      description: 'Customer pays base fare (e.g. ₹299) as confirmation advance. Extra hours, night charges, and outstation DA collected upon completion.'
    },
    PRE_AUTH_HOLD: {
      id: 'PRE_AUTH_HOLD',
      title: 'Pre-Authorization Hold on Card/UPI + Post-Trip Capture',
      description: 'Funds held during booking, final exact amount captured at trip conclusion based on actual odometer and meter hours.'
    }
  },

  // Extra charges guardrails
  extraCharges: {
    requiresCustomerApproval: true,
    policyNotice: 'Under RBI and consumer protection guidelines, no additional charge (extra hours, outstation allowance, tolls) can be debited without explicit in-app authorization by the vehicle owner.',
    maxUnpromptedAdjustmentPaise: 0
  },

  // Cancellation & Refund Rules
  cancellationRules: {
    freeCancellationBeforeDispatch: {
      description: '100% full refund if cancelled before chauffeur is dispatched',
      feePaise: 0,
      refundPercent: 100
    },
    freeCancellationGracePeriodMinutes: 5, // 5 minutes after driver acceptance
    cancellationFeeAfterGracePaise: 10000, // ₹100 cancellation fee if driver already en route
    driverNoShowFullRefund: {
      description: '100% full refund if chauffeur fails to arrive or cancels',
      refundPercent: 100
    }
  },

  // Regulatory and Tax Disclaimers
  taxDisclaimer: 'Transport Aggregator GST (5%) is calculated under Section 9(5) of the CGST Act. Exact tax filing, input tax credits, and merchant registration must be audited with a certified Indian Chartered Accountant.'
};
