/**
 * SARATHI CONSTANTS - CITIES, CARS, CATEGORIES ACROSS INDIA
 */

export const INDIAN_CITIES = [
  'Delhi NCR',
  'Mumbai',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Chandigarh',
  'Lucknow',
  'Kochi',
  'Indore',
  'Goa'
];

export const SERVICE_CATEGORIES = [
  {
    id: 'hourly',
    name: 'Hourly Rental',
    badge: 'Popular',
    icon: 'Clock',
    tagline: 'Min 2 Hours • City errands, meetings & shopping',
    basePrice: 299,
    unit: 'for 2 hrs',
    color: 'from-blue-600 to-cyan-600'
  },
  {
    id: 'full_day',
    name: 'Full Day (8h)',
    badge: 'Best Value',
    icon: 'Sun',
    tagline: '8 Hours city ride with unlimited stops',
    basePrice: 1199,
    unit: 'for 8 hrs',
    color: 'from-amber-600 to-orange-600'
  },
  {
    id: 'outstation',
    name: 'Outstation Trip',
    badge: 'Highway Expert',
    icon: 'Compass',
    tagline: 'Intercity driving & vacations (Per day rate)',
    basePrice: 1599,
    unit: 'per day',
    color: 'from-emerald-600 to-teal-600'
  },
  {
    id: 'one_way',
    name: 'One-Way Drop',
    badge: 'Flexible',
    icon: 'ArrowRight',
    tagline: 'Drive your vehicle to another city or state',
    basePrice: 1299,
    unit: 'per trip',
    color: 'from-purple-600 to-indigo-600'
  },
  {
    id: 'round_trip',
    name: 'Round Trip 24h',
    badge: 'Weekend',
    icon: 'Repeat',
    tagline: '24-hour weekend gateway with driver',
    basePrice: 2899,
    unit: '24 hours',
    color: 'from-pink-600 to-rose-600'
  },
  {
    id: 'monthly',
    name: 'Monthly Chauffeur',
    badge: 'Executive',
    icon: 'Calendar',
    tagline: 'Dedicated monthly driver for daily office commute',
    basePrice: 21999,
    unit: 'per month',
    color: 'from-sky-700 to-blue-900'
  },
  {
    id: 'airport',
    name: 'Airport Transfer',
    badge: 'Flight-Safe',
    icon: 'Plane',
    tagline: 'On-time IGI, BOM, BLR airport pickup & drop',
    basePrice: 699,
    unit: 'for 4 hrs',
    color: 'from-violet-600 to-fuchsia-600'
  },
  {
    id: 'emergency',
    name: 'Express 30-Min',
    badge: 'Fast Dispatch',
    icon: 'Zap',
    tagline: 'Driver reaches your vehicle in under 30 minutes',
    basePrice: 499,
    unit: 'express',
    color: 'from-red-600 to-rose-700'
  }
];

export const VEHICLE_TYPES = [
  { id: 'Hatchback', name: 'Hatchback', example: 'Swift, i20, Tiago, Baleno' },
  { id: 'Sedan', name: 'Sedan', example: 'Dzire, City, Verna, Ciaz, Virtus' },
  { id: 'SUV', name: 'SUV / MUV', example: 'Creta, Brezza, Innova, XUV700, Harrier' },
  { id: 'Luxury', name: 'Luxury / German', example: 'Audi, BMW, Mercedes, Jaguar, Volvo' }
];

export const TRANSMISSION_TYPES = [
  { id: 'Automatic', name: 'Automatic (AT)', desc: 'Torque Converter, CVT, DSG, DCT' },
  { id: 'Manual', name: 'Manual (MT)', desc: 'Standard 5/6 Speed Manual' }
];

export const PAYMENT_METHODS = [
  { id: 'direct_chauffeur_upi_cash', name: 'Direct to Chauffeur (UPI QR / Cash)', desc: '100% direct settlement upon completion • ₹0 platform cut • Founding Launch' },
  { id: 'upi', name: 'UPI (Instant Pay)', desc: 'Google Pay, PhonePe, Paytm, BHIM UPI' },
  { id: 'card', name: 'Credit / Debit Card', desc: 'Visa, MasterCard, RuPay' },
  { id: 'netbanking', name: 'Net Banking', desc: 'HDFC, SBI, ICICI, Axis, Kotak' },
  { id: 'cash', name: 'Pay Cash to Driver', desc: 'Settle in cash after trip completion' }
];
