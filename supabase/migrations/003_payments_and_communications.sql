-- =============================================================================
-- PERSONAL DRIVER MARKETPLACE - PAYMENTS, REFUNDS & COMMUNICATIONS (MIGRATION 003)
-- Pan-India On-Demand Personal Driver Marketplace
-- "Your Car. Your Journey. Your Driver."
-- =============================================================================

-- 1. PAYMENTS TABLE (AUTHORITATIVE GATEWAY FINANCIAL RECORDS)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    razorpay_order_id VARCHAR(100) UNIQUE NOT NULL,
    razorpay_payment_id VARCHAR(100) UNIQUE,
    razorpay_signature VARCHAR(255),
    amount_paise BIGINT NOT NULL, -- Integer paise (e.g. 59900 for ₹599.00)
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(30) NOT NULL CHECK (status IN (
        'created',
        'pending',
        'authorized',
        'captured',
        'failed',
        'partially_refunded',
        'refunded'
    )),
    payment_method VARCHAR(50) DEFAULT 'upi', -- 'upi', 'card', 'netbanking', 'wallet'
    is_test_mode BOOLEAN DEFAULT TRUE,
    error_code VARCHAR(100),
    error_description TEXT,
    captured_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 2. PAYMENT REFUNDS TABLE
CREATE TABLE IF NOT EXISTS payment_refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    razorpay_refund_id VARCHAR(100) UNIQUE,
    amount_paise BIGINT NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(30) NOT NULL CHECK (status IN (
        'requested',
        'processing',
        'processed',
        'failed'
    )),
    reason TEXT NOT NULL,
    initiated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_notes TEXT,
    is_test_mode BOOLEAN DEFAULT TRUE,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_payment ON payment_refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_booking ON payment_refunds(booking_id);
CREATE INDEX IF NOT EXISTS idx_refunds_rzp_id ON payment_refunds(razorpay_refund_id);

-- 3. PROCESSED WEBHOOK EVENTS (DEDUPLICATION & IDEMPOTENCY)
CREATE TABLE IF NOT EXISTS processed_webhook_events (
    event_id VARCHAR(100) PRIMARY KEY, -- x-razorpay-event-id
    event_type VARCHAR(100) NOT NULL,
    source VARCHAR(50) DEFAULT 'razorpay',
    payload JSONB NOT NULL,
    status VARCHAR(30) DEFAULT 'processed',
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_type ON processed_webhook_events(event_type);

-- 4. DRIVER SETTLEMENTS & COMMISSION LEDGER
CREATE TABLE IF NOT EXISTS driver_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_trips INT DEFAULT 0,
    gross_fares_paise BIGINT NOT NULL,
    platform_commission_paise BIGINT NOT NULL, -- 15% platform split
    outstation_da_paise BIGINT DEFAULT 0,      -- 100% to driver
    night_allowance_paise BIGINT DEFAULT 0,    -- 100% to driver
    adjustments_paise BIGINT DEFAULT 0,
    net_payout_paise BIGINT NOT NULL,          -- Net payable to chauffeur
    payout_status VARCHAR(30) DEFAULT 'pending' CHECK (payout_status IN (
        'pending',
        'processing',
        'settled',
        'failed'
    )),
    payout_method VARCHAR(50) DEFAULT 'upi',
    payout_upi_id VARCHAR(100),
    razorpay_transfer_id VARCHAR(100),
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settlements_driver ON driver_settlements(driver_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON driver_settlements(payout_status);

-- 5. OTP VERIFICATIONS TABLE (HASHED SECURE OTPs)
CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) NOT NULL,
    hashed_otp VARCHAR(255) NOT NULL, -- SHA-256 hashed (NEVER PLAINTEXT!)
    purpose VARCHAR(50) NOT NULL CHECK (purpose IN (
        'customer_auth',
        'driver_auth',
        'trip_start'
    )),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_phone_purpose ON otp_verifications(phone, purpose);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR FINANCIAL & COMMUNICATION RECORDS
-- =============================================================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;

-- Payments: Customer can view their own payments; Admin can view all
CREATE POLICY "Customer can view own payments"
ON payments FOR SELECT
USING (auth.uid() = customer_id OR is_admin());

-- Refunds: Customer can view refunds for own bookings; Admin can view/create all
CREATE POLICY "Customer can view own refunds"
ON payment_refunds FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM bookings
        WHERE bookings.id = payment_refunds.booking_id
        AND bookings.customer_id = auth.uid()
    ) OR is_admin()
);

CREATE POLICY "Admin can manage refunds"
ON payment_refunds FOR ALL
USING (is_admin());

-- Settlements: Chauffeur can view own settlement ledger; Admin can view/create all
CREATE POLICY "Chauffeur can view own settlements"
ON driver_settlements FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM drivers
        WHERE drivers.id = driver_settlements.driver_id
        AND drivers.user_id = auth.uid()
    ) OR is_admin()
);

CREATE POLICY "Admin can manage settlements"
ON driver_settlements FOR ALL
USING (is_admin());

-- Webhooks & OTP: Strictly Admin and System Internal Access
CREATE POLICY "Admin can view webhook logs"
ON processed_webhook_events FOR SELECT
USING (is_admin());

CREATE POLICY "Admin can view otp verification records"
ON otp_verifications FOR SELECT
USING (is_admin());
