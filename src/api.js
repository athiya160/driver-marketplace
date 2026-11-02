/**
 * SARATHI CLIENT API SERVICE
 * Connects directly to Vite-mounted Express API endpoints
 */

const BASE_URL = '/api';

export async function fetchCurrentUser() {
  const res = await fetch(`${BASE_URL}/auth/me`);
  return res.json();
}

export async function switchUserRole(role) {
  const res = await fetch(`${BASE_URL}/auth/switch-role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role })
  });
  return res.json();
}

export async function registerUser(userData) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return res.json();
}

export async function loginUser(credentials) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  return res.json();
}

export async function fetchDrivers(filters = {}) {
  const query = new URLSearchParams(filters).toString();
  const res = await fetch(`${BASE_URL}/drivers?${query}`);
  return res.json();
}

export async function fetchDriverById(driverId) {
  const res = await fetch(`${BASE_URL}/drivers/${driverId}`);
  return res.json();
}

export async function estimateFare(bookingParams) {
  const res = await fetch(`${BASE_URL}/bookings/estimate-fare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingParams)
  });
  return res.json();
}

export async function createBooking(bookingData) {
  const res = await fetch(`${BASE_URL}/bookings/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData)
  });
  return res.json();
}

export async function fetchBookings(role = 'customer') {
  const res = await fetch(`${BASE_URL}/bookings?role=${role}`);
  return res.json();
}

export async function updateBookingStatus(bookingId, status, cancellationReason = '') {
  const res = await fetch(`${BASE_URL}/bookings/${bookingId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, cancellationReason })
  });
  return res.json();
}

export async function verifyTripStart(bookingId, { otp, qrPayload }) {
  const res = await fetch(`${BASE_URL}/bookings/${bookingId}/verify-trip-start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ otp, qrPayload })
  });
  return res.json();
}

export async function submitReview(bookingId, reviewData) {
  const res = await fetch(`${BASE_URL}/bookings/${bookingId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reviewData)
  });
  return res.json();
}

export async function fetchDriverDashboard() {
  const res = await fetch(`${BASE_URL}/driver/dashboard`);
  return res.json();
}

export async function toggleDriverOnline() {
  const res = await fetch(`${BASE_URL}/driver/toggle-online`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}

export async function uploadDriverDocument(docData) {
  const res = await fetch(`${BASE_URL}/driver/upload-document`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(docData)
  });
  return res.json();
}

export async function fetchAdminStats() {
  const res = await fetch(`${BASE_URL}/admin/stats`);
  return res.json();
}

export async function fetchAdminKycQueue() {
  const res = await fetch(`${BASE_URL}/admin/drivers/kyc`);
  return res.json();
}

export async function verifyDriverKyc(driverId, action, reason = '') {
  const res = await fetch(`${BASE_URL}/admin/drivers/${driverId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, reason })
  });
  return res.json();
}

export async function submitSupportTicket(ticketData) {
  const res = await fetch(`${BASE_URL}/support/ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticketData)
  });
  return res.json();
}

// -----------------------------------------------------------------------------
// PHASE 5: DRIVER MANAGEMENT CLIENT APIS
// -----------------------------------------------------------------------------

export async function registerDriver(driverData) {
  const res = await fetch(`${BASE_URL}/driver/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(driverData)
  });
  return res.json();
}

export async function fetchDriverKycStatus() {
  const res = await fetch(`${BASE_URL}/driver/kyc-status`);
  return res.json();
}

export async function submitDriverKyc(kycData) {
  const res = await fetch(`${BASE_URL}/driver/submit-kyc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(kycData)
  });
  return res.json();
}

export async function fetchDriverProfile() {
  const res = await fetch(`${BASE_URL}/driver/profile`);
  return res.json();
}

export async function updateDriverProfile(profileData) {
  const res = await fetch(`${BASE_URL}/driver/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData)
  });
  return res.json();
}

export async function fetchDriverPricing() {
  const res = await fetch(`${BASE_URL}/driver/pricing`);
  return res.json();
}

export async function updateDriverPricing(pricingData) {
  const res = await fetch(`${BASE_URL}/driver/pricing`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pricingData)
  });
  return res.json();
}

export async function fetchDriverAvailability() {
  const res = await fetch(`${BASE_URL}/driver/availability`);
  return res.json();
}

export async function updateDriverAvailability(schedule) {
  const res = await fetch(`${BASE_URL}/driver/availability`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schedule })
  });
  return res.json();
}

export async function acceptBookingRequest(bookingId) {
  const res = await fetch(`${BASE_URL}/driver/requests/${bookingId}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}

export async function rejectBookingRequest(bookingId) {
  const res = await fetch(`${BASE_URL}/driver/requests/${bookingId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}

export async function advanceTripStep(bookingId, targetStatus, otp = '') {
  const res = await fetch(`${BASE_URL}/driver/trip/${bookingId}/step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetStatus, otp })
  });
  return res.json();
}

export async function fetchDriverEarnings() {
  const res = await fetch(`${BASE_URL}/driver/earnings`);
  return res.json();
}

export async function fetchDriverReviews() {
  const res = await fetch(`${BASE_URL}/driver/reviews`);
  return res.json();
}

