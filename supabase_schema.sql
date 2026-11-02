-- ==============================================================================
-- SARATHI: DRIVER RENTAL BOOKING PLATFORM (ACROSS INDIA)
-- SUPABASE POSTGRESQL PRODUCTION DATABASE SCHEMA & POLICIES
-- ==============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('customer', 'driver', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE service_category AS ENUM (
  'hourly',
  'full_day',
  'outstation',
  'one_way',
  'round_trip',
  'monthly',
  'replacement',
  'airport',
  'emergency'
);
CREATE TYPE transmission_type AS ENUM ('Manual', 'Automatic', 'Both');
CREATE TYPE vehicle_category AS ENUM ('Hatchback', 'Sedan', 'SUV', 'Luxury', 'Commercial');
CREATE TYPE booking_status AS ENUM (
  'pending',
  'accepted',
  'driver_en_route',
  'arrived',
  'in_progress',
  'completed',
  'cancelled',
  'rejected'
);
CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'captured', 'refunded', 'cash_collected', 'failed');
CREATE TYPE payment_method AS ENUM ('upi', 'card', 'netbanking', 'cash', 'wallet');

-- 2. PROFILES (CUSTOMERS, DRIVERS, ADMINS)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE, -- Maps to Supabase auth.users
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL, -- Format: +919876543210
  email VARCHAR(180) UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
  is_phone_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DRIVER PROFILES
CREATE TABLE IF NOT EXISTS driver_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  experience_years INT NOT NULL DEFAULT 3,
  bio TEXT,
  languages TEXT[] DEFAULT ARRAY['Hindi', 'English'],
  transmission_skills TEXT[] DEFAULT ARRAY['Manual', 'Automatic'],
  vehicle_capabilities TEXT[] DEFAULT ARRAY['Hatchback', 'Sedan', 'SUV'],
  primary_city VARCHAR(80) NOT NULL DEFAULT 'Delhi NCR',
  service_pin_codes TEXT[] DEFAULT ARRAY['110001', '110020', '122001', '201301'],
  hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 149.00,
  daily_rate NUMERIC(10, 2) NOT NULL DEFAULT 1199.00,
  outstation_rate_per_day NUMERIC(10, 2) NOT NULL DEFAULT 1599.00,
  monthly_rate NUMERIC(10, 2) NOT NULL DEFAULT 21999.00,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 4.80,
  total_reviews INT NOT NULL DEFAULT 0,
  total_trips INT NOT NULL DEFAULT 0,
  verification_status verification_status NOT NULL DEFAULT 'pending',
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  current_latitude NUMERIC(10, 7) DEFAULT 28.6139,
  current_longitude NUMERIC(10, 7) DEFAULT 77.2090,
  police_verification_status VARCHAR(40) DEFAULT 'verified',
  payout_upi_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DRIVER DOCUMENTS (KYC: DL, AADHAAR, POLICE VERIFICATION)
CREATE TABLE IF NOT EXISTS driver_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES driver_profiles(id) ON DELETE CASCADE,
  doc_type VARCHAR(60) NOT NULL, -- 'driving_licence_front', 'driving_licence_back', 'aadhaar_card', 'police_clearance'
  document_number VARCHAR(100) NOT NULL,
  document_url TEXT NOT NULL,
  verification_status verification_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SERVICE AREAS ACROSS INDIA
CREATE TABLE IF NOT EXISTS service_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_name VARCHAR(80) NOT NULL UNIQUE,
  state VARCHAR(80) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  base_hourly_rate NUMERIC(10, 2) DEFAULT 149.00,
  base_day_rate NUMERIC(10, 2) DEFAULT 1199.00,
  night_charge NUMERIC(10, 2) DEFAULT 250.00,
  outstation_da NUMERIC(10, 2) DEFAULT 350.00,
  platform_fee NUMERIC(10, 2) DEFAULT 49.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PRICING RULES (CONFIGURABLE BY ADMIN)
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category service_category NOT NULL UNIQUE,
  title VARCHAR(100) NOT NULL,
  base_fare NUMERIC(10, 2) NOT NULL,
  included_hours NUMERIC(4, 1) NOT NULL,
  per_extra_hour_rate NUMERIC(10, 2) NOT NULL,
  night_charge_start TIME DEFAULT '22:00:00',
  night_charge_end TIME DEFAULT '06:00:00',
  night_allowance NUMERIC(10, 2) DEFAULT 250.00,
  outstation_driver_da NUMERIC(10, 2) DEFAULT 350.00,
  platform_commission_percent NUMERIC(5, 2) DEFAULT 15.00,
  gst_tax_percent NUMERIC(5, 2) DEFAULT 5.00,
  cancellation_fee NUMERIC(10, 2) DEFAULT 100.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_reference VARCHAR(32) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES profiles(id),
  driver_id UUID REFERENCES driver_profiles(id),
  service_type service_category NOT NULL,
  transmission_type VARCHAR(20) NOT NULL, -- Manual, Automatic
  vehicle_type VARCHAR(40) NOT NULL, -- Hatchback, Sedan, SUV, Luxury
  pickup_address TEXT NOT NULL,
  pickup_city VARCHAR(80) NOT NULL,
  pickup_latitude NUMERIC(10, 7),
  pickup_longitude NUMERIC(10, 7),
  drop_address TEXT,
  drop_city VARCHAR(80),
  drop_latitude NUMERIC(10, 7),
  drop_longitude NUMERIC(10, 7),
  start_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_hours NUMERIC(5, 2) NOT NULL DEFAULT 4.0,
  status booking_status NOT NULL DEFAULT 'pending',
  trip_start_otp VARCHAR(6) NOT NULL,
  trip_qr_payload TEXT NOT NULL,
  base_fare NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  duration_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  night_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  outstation_allowance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 49.00,
  gst_tax NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  coupon_code VARCHAR(40),
  total_fare NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  driver_earnings NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  platform_earnings NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  payment_method payment_method NOT NULL DEFAULT 'upi',
  special_instructions TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. BOOKING STATUS HISTORY (AUDIT TRAIL)
CREATE TABLE IF NOT EXISTS booking_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  from_status VARCHAR(40),
  to_status VARCHAR(40) NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PAYMENTS & TRANSACTIONS
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  payment_method payment_method NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  refund_id VARCHAR(100),
  refund_amount NUMERIC(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. REVIEWS & RATINGS
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id),
  driver_id UUID NOT NULL REFERENCES driver_profiles(id),
  rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  punctuality_rating NUMERIC(2, 1) DEFAULT 5.0,
  driving_skill_rating NUMERIC(2, 1) DEFAULT 5.0,
  behavior_rating NUMERIC(2, 1) DEFAULT 5.0,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SAVED ADDRESSES
CREATE TABLE IF NOT EXISTS saved_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(60) NOT NULL, -- 'Home', 'Office', 'Airport', 'Parents'
  address_line TEXT NOT NULL,
  city VARCHAR(80) NOT NULL,
  pin_code VARCHAR(10) NOT NULL,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. FAVORITE DRIVERS
CREATE TABLE IF NOT EXISTS favorite_drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES driver_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, driver_id)
);

-- 13. PROMOTIONAL OFFERS / COUPONS
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(40) UNIQUE NOT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'flat', -- 'flat', 'percent'
  discount_value NUMERIC(10, 2) NOT NULL,
  min_order_amount NUMERIC(10, 2) DEFAULT 0.00,
  max_discount NUMERIC(10, 2),
  valid_until DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  category VARCHAR(60) NOT NULL, -- 'billing', 'driver_behavior', 'safety', 'cancellation'
  subject VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. ADMIN AUDIT LOGS
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  action VARCHAR(100) NOT NULL,
  target_entity VARCHAR(60) NOT NULL,
  target_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR HIGH-CONCURRENCY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_city ON driver_profiles(primary_city);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_online ON driver_profiles(is_online, verification_status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_driver ON bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(start_date, start_time);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Customers can view & edit their own profile
CREATE POLICY customer_profile_policy ON profiles
  FOR ALL USING (auth.uid() = auth_user_id);

-- Public can view approved driver profiles
CREATE POLICY public_view_drivers ON driver_profiles
  FOR SELECT USING (verification_status = 'approved');

-- Drivers can update their own online/offline and rates
CREATE POLICY driver_update_own ON driver_profiles
  FOR ALL USING (
    id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  );

-- Customers can view their own bookings, Drivers can view assigned bookings
CREATE POLICY bookings_access_policy ON bookings
  FOR SELECT USING (
    customer_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    OR driver_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  );

-- ==============================================================================
-- SEED DATA: CITIES, PRICING, SAMPLE DRIVERS, COUPONS
-- ==============================================================================

-- 1. Insert Service Cities Across India
INSERT INTO service_areas (city_name, state, is_active, base_hourly_rate, base_day_rate, night_charge, outstation_da, platform_fee)
VALUES
  ('Delhi NCR', 'Delhi', TRUE, 149.00, 1199.00, 250.00, 350.00, 49.00),
  ('Mumbai', 'Maharashtra', TRUE, 169.00, 1299.00, 250.00, 400.00, 49.00),
  ('Bengaluru', 'Karnataka', TRUE, 159.00, 1249.00, 250.00, 350.00, 49.00),
  ('Hyderabad', 'Telangana', TRUE, 139.00, 1099.00, 200.00, 350.00, 49.00),
  ('Pune', 'Maharashtra', TRUE, 139.00, 1099.00, 200.00, 350.00, 49.00),
  ('Chennai', 'Tamil Nadu', TRUE, 149.00, 1149.00, 200.00, 350.00, 49.00),
  ('Kolkata', 'West Bengal', TRUE, 129.00, 999.00, 200.00, 300.00, 49.00),
  ('Ahmedabad', 'Gujarat', TRUE, 129.00, 999.00, 200.00, 300.00, 49.00),
  ('Jaipur', 'Rajasthan', TRUE, 129.00, 999.00, 200.00, 300.00, 49.00),
  ('Chandigarh', 'Punjab & Haryana', TRUE, 139.00, 1099.00, 200.00, 300.00, 49.00)
ON CONFLICT (city_name) DO NOTHING;

-- 2. Insert Pricing Rules for All Service Categories
INSERT INTO pricing_rules (category, title, base_fare, included_hours, per_extra_hour_rate, night_allowance, outstation_driver_da, platform_commission_percent, gst_tax_percent)
VALUES
  ('hourly', 'Hourly Driver Rental', 299.00, 2.0, 120.00, 250.00, 0.00, 15.00, 5.00),
  ('full_day', 'Full-Day 8 Hours City Chauffeur', 1199.00, 8.0, 130.00, 250.00, 0.00, 15.00, 5.00),
  ('outstation', 'Outstation Highway Trip (Per Day)', 1599.00, 12.0, 150.00, 300.00, 350.00, 15.00, 5.00),
  ('one_way', 'One-Way Intercity Driver', 1299.00, 6.0, 140.00, 250.00, 350.00, 15.00, 5.00),
  ('round_trip', 'Round-Trip Weekend Getaway', 2899.00, 24.0, 140.00, 300.00, 350.00, 15.00, 5.00),
  ('monthly', 'Monthly Dedicated Chauffeur', 21999.00, 240.0, 100.00, 0.00, 0.00, 10.00, 5.00),
  ('replacement', 'Temporary Driver (Leave Cover)', 1299.00, 9.0, 120.00, 200.00, 0.00, 15.00, 5.00),
  ('airport', 'Airport Pickup & Drop Flight Safe', 699.00, 4.0, 120.00, 250.00, 0.00, 15.00, 5.00),
  ('emergency', 'Express 30-Min Emergency Dispatch', 499.00, 2.0, 150.00, 250.00, 0.00, 20.00, 5.00)
ON CONFLICT (category) DO NOTHING;

-- 3. Insert Active Coupons
INSERT INTO coupons (code, title, description, discount_type, discount_value, min_order_amount, max_discount, is_active)
VALUES
  ('FIRST50', 'Flat ₹50 Off on First Ride', 'Welcome discount for new Sarathi users', 'flat', 50.00, 299.00, 50.00, TRUE),
  ('WEEKEND100', 'Weekend Getaway ₹100 Off', 'Save on your weekend outstation trips', 'flat', 100.00, 1199.00, 100.00, TRUE),
  ('SARATHI15', '15% Off Outstation Drives', 'Flat 15% discount up to ₹300', 'percent', 15.00, 1500.00, 300.00, TRUE)
ON CONFLICT (code) DO NOTHING;
