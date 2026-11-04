/**
 * SARATHI PRICING ENGINE - ACROSS INDIA
 * Configurable fare calculation supporting hourly, full-day, outstation,
 * night charges, driver allowances, GST, platform fee and promo discounts.
 */

export const SERVICE_CATEGORIES = {
  hourly: {
    id: 'hourly',
    title: 'Hourly Driver Rental',
    description: 'Shopping, dining, local errands, or meetings',
    baseFare: 299,
    includedHours: 2,
    perExtraHour: 120,
    nightCharge: 250,
    outstationDA: 0,
    minHours: 2,
    popular: true
  },
  full_day: {
    id: 'full_day',
    title: 'Full-Day City Chauffeur',
    description: '8 Hours city ride with multiple stops',
    baseFare: 1199,
    includedHours: 8,
    perExtraHour: 130,
    nightCharge: 250,
    outstationDA: 0,
    minHours: 8,
    popular: true
  },
  outstation: {
    id: 'outstation',
    title: 'Outstation Highway Trip',
    description: 'Intercity driving, hill stations & highways (Per Day)',
    baseFare: 1599,
    includedHours: 12,
    perExtraHour: 150,
    nightCharge: 300,
    outstationDA: 350, // Driver Daily Food & Lodging Allowance
    minHours: 12,
    popular: true
  },
  one_way: {
    id: 'one_way',
    title: 'One-Way Intercity Driver',
    description: 'Drop vehicle at another city or destination',
    baseFare: 1299,
    includedHours: 6,
    perExtraHour: 140,
    nightCharge: 250,
    outstationDA: 350,
    minHours: 4
  },
  round_trip: {
    id: 'round_trip',
    title: 'Round-Trip Weekend Drive',
    description: '24-hour weekend getaway with personal chauffeur',
    baseFare: 2899,
    includedHours: 24,
    perExtraHour: 140,
    nightCharge: 300,
    outstationDA: 700,
    minHours: 24
  },
  monthly: {
    id: 'monthly',
    title: 'Monthly Dedicated Chauffeur',
    description: 'Daily office commute & family driver (26 days/month)',
    baseFare: 21999,
    includedHours: 208,
    perExtraHour: 100,
    nightCharge: 0,
    outstationDA: 0,
    minHours: 208
  },
  replacement: {
    id: 'replacement',
    title: 'Temporary Leave Replacement',
    description: 'Cover for your regular driver on leave',
    baseFare: 1299,
    includedHours: 9,
    perExtraHour: 120,
    nightCharge: 200,
    outstationDA: 0,
    minHours: 8
  },
  airport: {
    id: 'airport',
    title: 'Airport Transfer Flight-Safe',
    description: 'Stress-free airport pickup or drop in your car',
    baseFare: 699,
    includedHours: 4,
    perExtraHour: 120,
    nightCharge: 250,
    outstationDA: 0,
    minHours: 3
  },
  emergency: {
    id: 'emergency',
    title: 'Express 30-Min Emergency Dispatch',
    description: 'Driver at your doorstep in under 30 minutes',
    baseFare: 499,
    includedHours: 2,
    perExtraHour: 150,
    nightCharge: 250,
    outstationDA: 0,
    minHours: 2
  }
};

export const ACTIVE_COUPONS = {
  FIRST50: { code: 'FIRST50', discount: 50, type: 'flat', minOrder: 299 },
  WEEKEND100: { code: 'WEEKEND100', discount: 100, type: 'flat', minOrder: 1199 },
  SARATHI15: { code: 'SARATHI15', discount: 0.15, type: 'percent', maxDiscount: 300, minOrder: 1500 }
};

/**
 * Checks if a given start time falls into the Indian Night Charge window (10:00 PM to 06:00 AM)
 * @param {string} timeString - Format "HH:mm" or "HH:mm:ss"
 * @returns {boolean}
 */
export function isNightTimeWindow(timeString) {
  if (!timeString) return false;
  const parts = timeString.split(':');
  const hours = parseInt(parts[0], 10);
  // Night window is 22:00 (10 PM) through 05:59 (6 AM)
  return hours >= 22 || hours < 6;
}

/**
 * Calculates complete Indian rupee fare breakdown
 */
export function calculateFare({
  serviceType = 'hourly',
  durationHours = 2,
  startTime = '10:00',
  couponCode = null,
  luxuryCar = false,
  gstRatePercent = null,
  applyFoundingLaunch = false
}) {
  const config = SERVICE_CATEGORIES[serviceType] || SERVICE_CATEGORIES.hourly;
  const hours = Math.max(Number(durationHours) || config.minHours, config.minHours);

  // 1. Base fare
  const baseFare = config.baseFare;

  // 2. Extra hours charge
  let extraHours = 0;
  if (hours > config.includedHours) {
    extraHours = hours - config.includedHours;
  }
  const extraHoursCharge = extraHours * config.perExtraHour;

  // 3. Luxury vehicle premium (e.g. BMW, Audi, Mercedes, Jaguar require master chauffeurs)
  const luxurySurcharge = luxuryCar ? Math.round(baseFare * 0.2) : 0;

  // 4. Night allowance (if trip starts between 10 PM and 6 AM)
  const isNight = isNightTimeWindow(startTime);
  const nightCharge = isNight ? config.nightCharge : 0;

  // 5. Outstation Driver Daily Allowance (Food & stay)
  const outstationDA = config.outstationDA || 0;

  // 6. Platform fee: ₹0 during Founding Launch Pilot (waived from ₹49)
  const platformFee = applyFoundingLaunch ? 0 : 49;

  // Subtotal before tax and discount
  const subTotal = baseFare + extraHoursCharge + luxurySurcharge + nightCharge + outstationDA + platformFee;

  // 7. Coupon Discount
  let discountAmount = 0;
  if (couponCode && ACTIVE_COUPONS[couponCode.toUpperCase()]) {
    const coupon = ACTIVE_COUPONS[couponCode.toUpperCase()];
    if (subTotal >= coupon.minOrder) {
      if (coupon.type === 'flat') {
        discountAmount = coupon.discount;
      } else if (coupon.type === 'percent') {
        discountAmount = Math.min(Math.round(subTotal * coupon.discount), coupon.maxDiscount || 9999);
      }
    }
  }

  const taxableAmount = Math.max(0, subTotal - discountAmount);

  // 8. GST (Configurable Road Transport / Chauffeur Aggregator Rate, default 5%)
  const gstRate = (typeof gstRatePercent === 'number' && !isNaN(gstRatePercent))
    ? (gstRatePercent / 100)
    : (parseFloat(process.env.STATUTORY_GST_PERCENT) || 5) / 100;
  const gstTax = Math.round(taxableAmount * gstRate);

  // Total Final Fare
  const totalFare = taxableAmount + gstTax;

  // Driver Earnings vs Platform Earnings
  // Standard: Driver gets Base + extra hours + night allowance + outstation DA minus 15% platform commission
  // Founding Launch: 0% Platform Commission, Chauffeur keeps 100% of base and 100% of allowances
  const driverGross = baseFare + extraHoursCharge + luxurySurcharge;
  const platformCommissionPercent = applyFoundingLaunch ? 0 : 15;
  const platformCommission = Math.round(driverGross * (platformCommissionPercent / 100));
  const driverEarnings = (driverGross - platformCommission) + nightCharge + outstationDA;
  const platformEarnings = platformCommission + platformFee;

  return {
    serviceType,
    serviceTitle: config.title,
    durationHours: hours,
    baseFare,
    extraHours,
    extraHoursCharge,
    luxurySurcharge,
    isNight,
    nightCharge,
    outstationDA,
    platformFee,
    discountAmount,
    couponCode: discountAmount > 0 ? couponCode.toUpperCase() : null,
    subTotal,
    taxableAmount,
    gstTax,
    gstRatePercent: Math.round(gstRate * 100),
    gstStatutoryDisclaimer: 'GST rate calculation is an estimate and must be reviewed with a qualified tax professional.',
    totalFare,
    driverEarnings,
    platformEarnings,
    currency: '₹',
    isFoundingLaunch: Boolean(applyFoundingLaunch),
    platformCommissionPercent,
    waivedCommissionAmount: applyFoundingLaunch ? Math.round(driverGross * 0.15) : 0,
    waivedConvenienceFee: applyFoundingLaunch ? 49 : 0
  };
}
