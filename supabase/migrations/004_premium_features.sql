-- ==============================================================================
-- PERSONAL DRIVER MARKETPLACE - MIGRATION 004: ADDITIONAL PREMIUM FEATURES
-- Pan-India On-Demand Personal Driver Marketplace
-- "Your Car. Your Journey. Your Driver."
--
-- Features:
-- 1. Driver Passport (Verification, Safety History, Luxury Accreditations)
-- 2. Digital Vehicle Handover (Pre/Post-trip Odometers, Fuel, Scratches, Photos)
-- 3. Family Circle (Trip Visibility, Emergency SOS, Real-time SMS/SSE Broadcast)
-- 4. Preferred Chauffeur (Customer Saved Drivers, Direct Rehire Priority)
-- ==============================================================================

-- 1. DRIVER PASSPORT TABLE
CREATE TABLE IF NOT EXISTS driver_passports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  passport_number VARCHAR(32) UNIQUE NOT NULL,
  police_verification_status VARCHAR(32) DEFAULT 'verified',
  police_clearance_number VARCHAR(64),
  commercial_license_type VARCHAR(32) DEFAULT 'LMV-TR',
  license_expiry_date DATE,
  total_safe_kms INTEGER DEFAULT 50000,
  zero_accident_streak_months INTEGER DEFAULT 24,
  punctuality_score_percent NUMERIC(5,2) DEFAULT 99.20,
  luxury_certifications JSONB DEFAULT '["Automatic Dual-Clutch", "German Luxury Sedans", "Air Suspension"]',
  highway_accreditation BOOLEAN DEFAULT TRUE,
  languages_spoken JSONB DEFAULT '["Hindi", "English"]',
  vip_client_commendations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DIGITAL VEHICLE HANDOVER TABLE
CREATE TABLE IF NOT EXISTS vehicle_handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_model VARCHAR(100) NOT NULL,
  vehicle_reg_number VARCHAR(32) NOT NULL,
  handover_type VARCHAR(32) NOT NULL CHECK (handover_type IN ('pre_trip_handover', 'post_trip_return')),
  odometer_reading_km INTEGER NOT NULL,
  fuel_level_percent INTEGER NOT NULL CHECK (fuel_level_percent >= 0 AND fuel_level_percent <= 100),
  existing_damages JSONB DEFAULT '[]',
  photo_urls JSONB DEFAULT '[]',
  cleanliness_rating INTEGER DEFAULT 5 CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  customer_signature_token VARCHAR(128),
  handover_notes TEXT,
  status VARCHAR(32) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending_customer_ack', 'disputed')),
  confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FAMILY CIRCLE TABLE
CREATE TABLE IF NOT EXISTS family_circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  relationship VARCHAR(32) NOT NULL CHECK (relationship IN ('Spouse', 'Parent', 'Child', 'Sibling', 'Other')),
  permissions JSONB DEFAULT '{"live_tracking": true, "trip_alerts": true, "sos_emergency": true}',
  is_emergency_contact BOOLEAN DEFAULT TRUE,
  status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'invited', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PREFERRED CHAUFFEURS TABLE
CREATE TABLE IF NOT EXISTS preferred_chauffeurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  notes TEXT,
  priority_tier INTEGER DEFAULT 1,
  trips_completed_together INTEGER DEFAULT 1,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_customer_preferred_driver UNIQUE (customer_id, driver_id)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_driver_passports_driver ON driver_passports(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_handovers_booking ON vehicle_handovers(booking_id);
CREATE INDEX IF NOT EXISTS idx_family_circles_customer ON family_circles(customer_id);
CREATE INDEX IF NOT EXISTS idx_preferred_chauffeurs_customer ON preferred_chauffeurs(customer_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE driver_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferred_chauffeurs ENABLE ROW LEVEL SECURITY;

-- 1. Driver Passport: Public read for verified drivers
CREATE POLICY driver_passports_public_read ON driver_passports
  FOR SELECT USING (true);

-- 2. Vehicle Handover: Read/Write by booking customer, assigned driver, or admin
CREATE POLICY vehicle_handovers_parties_access ON vehicle_handovers
  FOR ALL USING (
    auth.uid() = customer_id OR
    auth.uid() = driver_id OR
    is_admin()
  );

-- 3. Family Circle: Customer can view, insert, update and delete own family members
CREATE POLICY family_circles_owner_access ON family_circles
  FOR ALL USING (
    auth.uid() = customer_id OR
    is_admin()
  );

-- 4. Preferred Chauffeurs: Customer manages own favorites
CREATE POLICY preferred_chauffeurs_owner_access ON preferred_chauffeurs
  FOR ALL USING (
    auth.uid() = customer_id OR
    is_admin()
  );
