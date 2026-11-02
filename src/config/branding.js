/**
 * CONFIGURABLE BRAND & PRODUCT CONFIGURATION
 * Platform: Next-Generation On-Demand Personal Driver Marketplace
 * Value Proposition: "Your Car. Your Journey. Your Driver."
 * 
 * Note: Customer-facing brand identity is decoupled from founder identity.
 * Brand name, tagline, logo and colors can be customized here or via ENV
 * without modifying application code.
 */

export const BRAND = {
  // Brand & Application Identity (Neutral configurable placeholder)
  brandName: (typeof process !== 'undefined' && process.env?.VITE_APP_BRAND_NAME) || 'Personal Driver Marketplace',
  appName: (typeof process !== 'undefined' && process.env?.VITE_APP_NAME) || 'Personal Driver Marketplace',
  shortName: 'Driver Marketplace',
  tagline: 'Your Car. Your Journey. Your Driver.',
  serviceTitle: 'Verified Professional Chauffeurs for Your Own Vehicle',
  description: 'Hire verified, professional personal drivers on-demand for your own car (Hatchback, Sedan, SUV, Luxury) for hourly, daily, outstation, airport, and monthly driving services.',
  
  // Operational Helpdesk (Neutral placeholders)
  supportPhone: '+91 1800-120-0044',
  supportEmail: 'help@drivermarketplace.placeholder',
  currency: '₹',
  countryCode: '+91',

  // Founder & Project Stewardship (Internal documentation only)
  founderNotice: 'Founder: Salman | Pan-India Mobility Marketplace Venture',
  isDemoEnvironment: true
};

export const THEME = {
  primaryNavy: '#0F1E36',
  background: '#F8FAFC',
  white: '#FFFFFF',
  accentOrange: '#F97316',
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
