/**
 * CONFIGURABLE BRAND & PRODUCT CONFIGURATION
 * Platform: Sarathi Global Rentals – Next-Generation On-Demand Personal Driver Marketplace
 * Value Proposition: "Your Car. Your Journey. Your Driver."
 */

export const BRAND = {
  // Brand & Application Identity
  brandName: (typeof process !== 'undefined' && process.env?.VITE_APP_BRAND_NAME) || 'Sarathi Global Rentals',
  appName: (typeof process !== 'undefined' && process.env?.VITE_APP_NAME) || 'Sarathi Global Rentals',
  shortName: 'Sarathi',
  tagline: 'Your Car. Your Journey. Your Driver.',
  serviceTitle: 'Verified Professional Chauffeurs for Your Own Vehicle',
  description: 'Hire verified, professional personal drivers on-demand for your own car (Hatchback, Sedan, SUV, Luxury) for hourly, daily, outstation, airport, and monthly driving services.',
  
  // Official Logo & Asset Identity
  logoUrl: '/sarathi-logo.png',
  logoBadgeUrl: '/sarathi-badge.png',
  logoHeroUrl: '/sarathi-hero-medallion.jpg',

  // Corporate & Statutory Details
  companyLegalName: 'Sarathi Global Rentals Private Limited',
  gstin: '07AAACS1234F1Z8',
  registeredAddress: 'Level 4, DLF Cyber City, Sector 24, Gurugram, Haryana - 122002',

  // Operational Helpdesk
  supportPhone: '+91 1800-PENDING (Unconfigured Placeholder)',
  supportPhoneDisplay: '+91 1800-XXX-XXXX (Pending Founder Setup)',
  supportEmail: 'pending-founder-setup@drivermarketplace.placeholder',
  supportEmailDisplay: 'support@drivermarketplace (Pending Founder Setup)',
  isSupportConfigured: false,
  supportNotice: 'Customer support hotline and email pending official verification from venture founder.',
  currency: '₹',
  countryCode: '+91',

  // Founder & Project Stewardship
  founderNotice: 'Founder: Salman | Pan-India Mobility Marketplace Venture',
  isDemoEnvironment: true
};

export const THEME = {
  primaryNavy: '#0F1E36',
  background: '#F8FAFC',
  white: '#FFFFFF',
  accentOrange: '#F97316',
  gold: '#D4AF37',
  primaryText: '#172033',
  secondaryText: '#64748B',
  borders: '#E2E8F0',
  successGreen: '#10B981',
  amberStar: '#F59E0B'
};

export function getBrandName() {
  return BRAND.brandName;
}

export function getBrandTagline() {
  return BRAND.tagline;
}
