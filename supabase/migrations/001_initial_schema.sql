-- =============================================================================
-- PERSONAL DRIVER MARKETPLACE - PRODUCTION POSTGRESQL SCHEMA (SUPABASE MIGRATION 001)
-- Business Model: Pan-India On-Demand Personal Driver Marketplace
-- "Your Car. Your Journey. Your Driver."
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'driver', 'admin')),
    avatar_url TEXT,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. CUSTOMER PROFILES TABLE
CREATE TABLE IF NOT EXISTS customer_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    home_city VARCHAR(50) DEFAULT 'Delhi NCR',
    saved_addresses JSONB DEFAULT '[]'::jsonb,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    favorite_driver_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DRIVERS TABLE (CHAUFFEUR QUALIFICATIONS & ATTRIBUTES)
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    photo_url TEXT,
    primary_city VARCHAR(50) NOT NULL,
    experience_years INT NOT NULL DEFAULT 0,
    bio TEXT,
    languages TEXT[] DEFAULT ARRAY['Hindi', 'English']::TEXT[],
    transmission_skills TEXT[] DEFAULT ARRAY['Manual', 'Automatic']::TEXT[],
    vehicle_types TEXT[] DEFAULT ARRAY['Hatchback', 'Sedan', 'SUV']::TEXT[],
    hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 149.00,
    daily_rate NUMERIC(10, 2) NOT NULL DEFAULT 1199.00,
    outstation_rate_per_day NUMERIC(10, 2) NOT NULL DEFAULT 1699.00,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    total_reviews INT DEFAULT 0,
    total_trips INT DEFAULT 0,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'suspended')),
    police_verification_status VARCHAR(20) DEFAULT 'pending' CHECK (police_verification_status IN ('pending', 'verified', 'rejected')),
    is_online BOOLEAN DEFAULT FALSE,
    current_latitude NUMERIC(10, 6),
    current_longitude NUMERIC(10, 6),
    heading NUMERIC(5, 2) DEFAULT 0,
    speed NUMERIC(5, 2) DEFAULT 0,
    last_location_update TIMESTAMPTZ,
    payout_upi_id VARCHAR(100),
    driving_licence_no VARCHAR(50) NOT NULL,
    aadhaar_masked VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drivers_status_online ON drivers(verification_status, is_online);
CREATE INDEX IF NOT EXISTS idx_drivers_city ON drivers(primary_city);
CREATE INDEX IF NOT EXISTS idx_drivers_location ON drivers(current_latitude, current_longitude);

-- 4. DRIVER COMPLIANCE DOCUMENTS
CREATE TABLE IF NOT EXISTS driver_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    doc_type VARCHAR(50) NOT NULL,
    doc_number VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_driver_docs_driver_id ON driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_docs_status ON driver_documents(status);

-- 5. SERVICE AREAS / CITIES
CREATE TABLE IF NOT EXISTS service_areas (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    base_rate NUMERIC(10, 2) NOT NULL DEFAULT 139.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BOOKINGS TABLE (CHAUFFEUR DISPATCH & TRIP LIFECYCLE)
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(30) UNIQUE NOT NULL,
    customer_id UUID REFERENCES users(id),
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    driver_id UUID REFERENCES drivers(id),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    service_type VARCHAR(30) NOT NULL CHECK (service_type IN ('quick', 'hourly', 'daily', 'airport', 'outstation', 'one_way', 'round_trip', 'monthly', 'emergency')),
    service_title VARCHAR(100) NOT NULL,
    transmission_type VARCHAR(20) NOT NULL CHECK (transmission_type IN ('Manual', 'Automatic', 'Both')),
    vehicle_type VARCHAR(30) NOT NULL CHECK (vehicle_type IN ('Hatchback', 'Sedan', 'SUV', 'Luxury')),
    pickup_address TEXT NOT NULL,
    pickup_city VARCHAR(50) NOT NULL,
    pickup_latitude NUMERIC(10, 6) NOT NULL,
    pickup_longitude NUMERIC(10, 6) NOT NULL,
    drop_address TEXT NOT NULL,
    drop_latitude NUMERIC(10, 6),
    drop_longitude NUMERIC(10, 6),
    start_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_hours INT NOT NULL DEFAULT 2,
    status VARCHAR(30) DEFAULT 'requested' CHECK (status IN ('requested', 'dispatched', 'accepted', 'arriving', 'arrived', 'in_progress', 'completed', 'cancelled')),
    trip_start_otp VARCHAR(6) NOT NULL,
    trip_qr_payload TEXT NOT NULL,
    base_fare NUMERIC(10, 2) NOT NULL,
    extra_hours_charge NUMERIC(10, 2) DEFAULT 0,
    night_charge NUMERIC(10, 2) DEFAULT 0,
    outstation_da NUMERIC(10, 2) DEFAULT 0,
    platform_fee NUMERIC(10, 2) DEFAULT 49.00,
    gst_tax NUMERIC(10, 2) DEFAULT 0,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    coupon_code VARCHAR(30),
    total_fare NUMERIC(10, 2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'authorized', 'captured', 'refunded', 'failed')),
    payment_method VARCHAR(30) DEFAULT 'upi',
    special_instructions TEXT,
    cancellation_reason TEXT,
    refund_amount NUMERIC(10, 2) DEFAULT 0,
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bookings_ref ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(start_date, start_time);

-- 7. BOOKING STATUS HISTORY (AUDIT OF TRANSITIONS)
CREATE TABLE IF NOT EXISTS booking_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL,
    notes TEXT,
    changed_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. DISPATCH REQUESTS (MATCHING ENGINE CASCADE QUEUE)
CREATE TABLE IF NOT EXISTS dispatch_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'accepted', 'rejected', 'timed_out')),
    rejection_reason TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_dispatch_driver ON dispatch_requests(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_dispatch_booking ON dispatch_requests(booking_id);

-- 9. DRIVER LOCATION LOGS (LIVE GPS BREADCRUMBS)
CREATE TABLE IF NOT EXISTS driver_location_logs (
    id BIGSERIAL PRIMARY KEY,
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    heading NUMERIC(5, 2) DEFAULT 0,
    speed NUMERIC(5, 2) DEFAULT 0,
    accuracy NUMERIC(5, 2) DEFAULT 5.0,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_locations_recorded ON driver_location_logs(driver_id, recorded_at DESC);

-- 10. FINANCIAL TRANSACTIONS LEDGER
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(30) REFERENCES bookings(booking_reference) ON DELETE SET NULL,
    customer_id UUID REFERENCES users(id),
    driver_id UUID REFERENCES drivers(id),
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    gateway_payment_id VARCHAR(100),
    gateway_refund_id VARCHAR(100),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. PROMOTIONAL COUPONS
CREATE TABLE IF NOT EXISTS promo_coupons (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('flat', 'percentage')),
    discount_value NUMERIC(10, 2) NOT NULL,
    max_discount NUMERIC(10, 2),
    min_booking_amount NUMERIC(10, 2) DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at DATE NOT NULL
);

-- 12. ADMINISTRATIVE AUDIT LOGS
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id),
    admin_name VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    target VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 13. GRIEVANCE TICKETS
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    user_name VARCHAR(100) NOT NULL,
    booking_reference VARCHAR(30),
    category VARCHAR(50) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 14. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    customer_name VARCHAR(100) NOT NULL,
    rating NUMERIC(2, 1) NOT NULL,
    punctuality_rating NUMERIC(2, 1) DEFAULT 5.0,
    driving_skill_rating NUMERIC(2, 1) DEFAULT 5.0,
    behavior_rating NUMERIC(2, 1) DEFAULT 5.0,
    comment TEXT,
    moderation_status VARCHAR(20) DEFAULT 'approved' CHECK (moderation_status IN ('approved', 'flagged', 'hidden')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
