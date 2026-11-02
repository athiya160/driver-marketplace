-- =============================================================================
-- PERSONAL DRIVER MARKETPLACE - ROW LEVEL SECURITY (RLS) POLICIES (MIGRATION 002)
-- Enforces customer isolation, chauffeur booking privacy & admin authority
-- =============================================================================

-- Enable Row Level Security on core entities
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if authenticated user is admin
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT (role = 'admin') 
        FROM users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. USERS POLICIES
-- Users can read their own profile; Admins can read all profiles
CREATE POLICY "Users can view their own profile" 
ON users FOR SELECT 
USING (auth.uid() = id OR is_admin());

-- Users can update their own personal info
CREATE POLICY "Users can update their own profile" 
ON users FOR UPDATE 
USING (auth.uid() = id);

-- 2. CUSTOMER PROFILES POLICIES
CREATE POLICY "Customers can manage their own profile" 
ON customer_profiles FOR ALL 
USING (auth.uid() = user_id OR is_admin());

-- 3. DRIVERS POLICIES
-- Public search: anyone can view APPROVED drivers
CREATE POLICY "Public can view approved active chauffeurs" 
ON drivers FOR SELECT 
USING (verification_status = 'approved' OR auth.uid() = user_id OR is_admin());

-- Drivers can update their own duty status and rates
CREATE POLICY "Drivers can update their own operational status" 
ON drivers FOR UPDATE 
USING (auth.uid() = user_id OR is_admin());

-- 4. DRIVER COMPLIANCE DOCUMENTS POLICIES
-- Strict isolation: Only the driver who submitted or an Admin can access KYC docs
CREATE POLICY "Only submitting driver or admin can view KYC documents" 
ON driver_documents FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM drivers 
        WHERE drivers.id = driver_documents.driver_id 
        AND drivers.user_id = auth.uid()
    ) OR is_admin()
);

CREATE POLICY "Drivers can upload KYC documents" 
ON driver_documents FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM drivers 
        WHERE drivers.id = driver_documents.driver_id 
        AND drivers.user_id = auth.uid()
    ) OR is_admin()
);

-- 5. BOOKINGS POLICIES
-- Customers see their own bookings; Assigned drivers see their trips; Admins see all
CREATE POLICY "Parties to booking can view details" 
ON bookings FOR SELECT 
USING (
    auth.uid() = customer_id OR 
    EXISTS (
        SELECT 1 FROM drivers 
        WHERE drivers.id = bookings.driver_id 
        AND drivers.user_id = auth.uid()
    ) OR 
    is_admin()
);

-- Customers can create booking requests
CREATE POLICY "Customers can create booking requests" 
ON bookings FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

-- Drivers can update booking lifecycle (e.g. advance trip step with OTP)
CREATE POLICY "Assigned driver or customer can update booking" 
ON bookings FOR UPDATE 
USING (
    auth.uid() = customer_id OR 
    EXISTS (
        SELECT 1 FROM drivers 
        WHERE drivers.id = bookings.driver_id 
        AND drivers.user_id = auth.uid()
    ) OR 
    is_admin()
);

-- 6. DISPATCH REQUESTS POLICIES
-- Targeted driver can view and respond to their incoming dispatch request
CREATE POLICY "Target driver can view and respond to dispatch" 
ON dispatch_requests FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM drivers 
        WHERE drivers.id = dispatch_requests.driver_id 
        AND drivers.user_id = auth.uid()
    ) OR is_admin()
);

-- 7. FINANCIAL TRANSACTIONS POLICIES
-- Read-only for customers/drivers involved; Admins have full access
CREATE POLICY "Parties can view their transactions" 
ON financial_transactions FOR SELECT 
USING (auth.uid() = customer_id OR is_admin());

-- 8. AUDIT LOGS POLICIES
-- Only Admins can view audit trail; Insertable only by system functions
CREATE POLICY "Admins only audit trail access" 
ON admin_audit_logs FOR SELECT 
USING (is_admin());

-- 9. CUSTOMER-OWNED VEHICLES POLICIES
ALTER TABLE customer_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can manage their own registered vehicles"
ON customer_vehicles FOR ALL
USING (auth.uid() = customer_id OR is_admin());

-- 10. PRIVATE STORAGE BUCKET POLICIES (KYC & DRIVING LICENSE PROTECTION)
-- Direct public reads are blocked; signed time-limited URLs or owner/admin access only
CREATE POLICY "Chauffeur can read own compliance documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'driver-documents' AND (
        (storage.foldername(name))[1] = auth.uid()::text OR
        is_admin()
    )
);

CREATE POLICY "Chauffeur can upload compliance documents to own directory"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'driver-documents' AND (
        (storage.foldername(name))[1] = auth.uid()::text OR
        is_admin()
    )
);
