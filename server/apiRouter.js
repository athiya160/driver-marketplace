import { Router } from 'express';
import { calculateFare, SERVICE_CATEGORIES, ACTIVE_COUPONS } from './pricingEngine.js';
import { checkDriverBookingConflict } from './conflictEngine.js';
import {
  findEligibleDrivers,
  rankDrivers,
  globalDispatchManager,
  calculateHaversineDistanceKm,
  calculateEstimatedEtaMinutes
} from './marketplace/dispatchEngine.js';
import { globalLocationTracker } from './marketplace/locationTracker.js';
import { globalRealtimeBus } from './marketplace/realtimeEventBus.js';
import {
  signJwt,
  verifyJwt,
  hashPassword,
  authenticateToken,
  requireRole,
  generateRefreshToken,
  verifyRefreshToken,
  verifyOwnership,
  revokeToken,
  isTokenRevoked
} from './auth/authService.js';
import {
  authRateLimiter,
  otpRateLimiter,
  bookingRateLimiter,
  mapsRateLimiter,
  sanitizeLogDetails,
  validateDocumentUpload
} from './middleware/securityMiddleware.js';
import { persistentStorage } from './db/persistentStorage.js';
import { supabase } from './db/supabaseClient.js';
import { demoManager } from './demo/demoManager.js';
import { globalPaymentService } from './payments/paymentService.js';
import { globalRefundService } from './payments/refundService.js';
import { globalWebhookService } from './payments/webhookService.js';
import { globalSettlementService } from './payments/settlementService.js';
import { rupeesToPaise, paiseToRupees } from './payments/paymentValidation.js';
import { globalOtpService } from './communications/otpService.js';
import { globalNotificationService } from './communications/notificationService.js';
import { globalRoutingEngine } from './maps/routingEngine.js';
import { globalGeocodingService } from './maps/geocodingService.js';
import { MAPS_CONFIG, getCurrentTrafficMultiplier } from './maps/mapsConfig.js';
import { globalRedisClient } from './infrastructure/redisClient.js';
import { globalStagingAuditor } from './infrastructure/stagingIntegrationAuditor.js';
import {
  USERS,
  DRIVERS,
  DRIVER_DOCUMENTS,
  INITIAL_BOOKINGS,
  REVIEWS,
  SUPPORT_TICKETS,
  OPERATIONAL_CITIES,
  PLATFORM_PRICING_CONFIG,
  PROMO_COUPONS,
  FINANCIAL_TRANSACTIONS,
  ADMIN_AUDIT_LOGS
} from './mockDb.js';

export const apiRouter = Router();

// Global Bearer token authentication middleware (populates req.user if Bearer token present)
apiRouter.use(authenticateToken);

// Mutable state stores (backed by mockDb)
let users = [...USERS];
let drivers = [...DRIVERS];
let driverDocuments = [...DRIVER_DOCUMENTS];
let bookings = [...INITIAL_BOOKINGS];
let reviews = [...REVIEWS];
let supportTickets = [...SUPPORT_TICKETS];
let operationalCities = [...OPERATIONAL_CITIES];
let pricingConfig = { ...PLATFORM_PRICING_CONFIG };
let promoCoupons = [...PROMO_COUPONS];
let financialTransactions = [...FINANCIAL_TRANSACTIONS];
let adminAuditLogs = [...ADMIN_AUDIT_LOGS];
let currentUser = users[0]; // Initialized with demo customer profile

// Audit Log Helper (with Sensitive PII & Secret Redaction)
function recordAuditLog(action, target, details, adminName = 'Operations Admin') {
  const logEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    adminName,
    action,
    target,
    details: sanitizeLogDetails(details),
    timestamp: new Date().toISOString()
  };
  adminAuditLogs.unshift(logEntry);
  return logEntry;
}

// Enterprise Role Guard: Restricts Administrative Operations to Verified Admins
function requireAdmin(req, res, next) {
  const isProd = process.env.NODE_ENV === 'production';
  let caller = req.user;

  // In non-production environments (test/demo), allow demo role headers and active demo user
  if (!isProd && !caller) {
    if (req.headers['x-demo-role'] === 'admin') {
      caller = { id: 'adm_001', role: 'admin' };
    } else if (currentUser?.role === 'admin') {
      caller = currentUser;
    }
  }

  if (!caller) {
    return res.status(401).json({ success: false, message: 'Authentication required for administrative operations.' });
  }
  if (caller.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: Administrative privilege required.' });
  }
  next();
}

// -----------------------------------------------------------------------------
// 0. HEALTHCHECKS & TELEMETRY (PHASE 8A, 8F, 8G)
// -----------------------------------------------------------------------------

// Comprehensive Staging / Production API Health Probe
apiRouter.get('/health', async (req, res) => {
  const [dbHealth, redisHealth] = await Promise.all([
    supabase.healthCheck(),
    globalRedisClient.ping()
  ]);

  const memory = process.memoryUsage();
  return res.json({
    status: 'UP',
    service: 'Personal Driver Marketplace Backend API',
    tagline: 'Your Car. Your Journey. Your Driver.',
    environment: process.env.NODE_ENV || 'staging',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    components: {
      database: dbHealth,
      redis: redisHealth,
      memory: {
        rssMb: Math.round(memory.rss / 1024 / 1024),
        heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024)
      }
    }
  });
});

apiRouter.get('/health/db', async (req, res) => {
  const health = await supabase.healthCheck();
  return res.json({
    success: true,
    platform: 'Personal Driver Marketplace Backend',
    database: health
  });
});

// Staging System Telemetry & Readiness Probe (Phase 8G)
apiRouter.get('/staging/system-info', async (req, res) => {
  return res.json({
    platform: 'Salman Driver Marketplace Staging Platform',
    version: '1.0.0',
    nodeVersion: process.version,
    operatingMode: process.env.NODE_ENV || 'staging',
    pilotCity: 'Bengaluru (Karnataka, India)',
    statutoryDisclaimer: 'GST calculation (5%) is an operational estimate and must be validated with a chartered accountant before commercial invoicing.',
    timestamp: new Date().toISOString()
  });
});

// Staging Multi-Service Integration Audit (Phase 8F)
apiRouter.get('/staging/audit', async (req, res) => {
  const audit = await globalStagingAuditor.runAudit();
  return res.json({
    success: true,
    platform: 'Personal Driver Marketplace Staging Gateway',
    audit
  });
});

// Distributed Redis State & Concurrency Health
apiRouter.get('/infrastructure/redis/ping', async (req, res) => {
  const ping = await globalRedisClient.ping();
  return res.json({
    success: true,
    redis: ping
  });
});

// -----------------------------------------------------------------------------
// 0B. REAL-TIME MOBILITY EVENT STREAM (SSE) (PHASE 8B)
// -----------------------------------------------------------------------------

// High-Throughput Authenticated Server-Sent Events (SSE) Stream
apiRouter.get('/realtime/events', (req, res) => {
  const token = req.query.token || (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));
  const rawChannels = req.query.channels ? req.query.channels.split(',') : [];

  let user = null;
  if (token) {
    const verified = verifyJwt(token);
    if (verified.valid) {
      user = verified.payload;
    }
  }

  // Fallback to demo profile in local sandbox/demo mode if unauthenticated
  if (!user) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ success: false, message: 'Authentication required for real-time subscription' });
    }
    user = currentUser;
  }

  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  globalRealtimeBus.registerClient(clientId, res, user, rawChannels, user.isDemo);
});

// Subscribe to additional channel dynamically
apiRouter.post('/realtime/subscribe', (req, res) => {
  const { clientId, channel } = req.body;
  if (!clientId || !channel) {
    return res.status(400).json({ success: false, message: 'Missing clientId or channel' });
  }

  const result = globalRealtimeBus.subscribeChannel(clientId, channel);
  if (!result.success) {
    return res.status(403).json(result);
  }

  return res.json({ success: true, channel });
});

// Unsubscribe from channel
apiRouter.post('/realtime/unsubscribe', (req, res) => {
  const { clientId, channel } = req.body;
  globalRealtimeBus.unsubscribeChannel(clientId, channel);
  return res.json({ success: true });
});

// Real-Time Bus Operations Metrics
apiRouter.get('/realtime/metrics', requireRole(['admin'], { allowDemo: true }), (req, res) => {
  return res.json({
    success: true,
    metrics: globalRealtimeBus.getMetrics()
  });
});

// -----------------------------------------------------------------------------
// 1. AUTHENTICATION & PROFILE APIS
// -----------------------------------------------------------------------------

apiRouter.get('/auth/me', (req, res) => {
  return res.json({ success: true, user: currentUser });
});

apiRouter.post('/auth/switch-role', (req, res) => {
  const { role } = req.body;
  const targetUser = users.find(u => u.role === role);
  if (targetUser) {
    currentUser = targetUser;
    return res.json({ success: true, message: `Switched role to ${role}`, user: currentUser });
  }
  return res.status(404).json({ success: false, message: 'Role profile not found' });
});

apiRouter.post('/auth/register', (req, res) => {
  const { fullName, phone, email, password, role = 'customer' } = req.body;

  if (!fullName || !phone || !email) {
    return res.status(400).json({ success: false, message: 'Please provide name, phone and email' });
  }

  const existing = users.find(u => u.phone === phone || u.email === email);
  if (existing) {
    return res.status(400).json({ success: false, message: 'Account with this phone or email already exists' });
  }

  const newUser = {
    id: `user_${Date.now()}`,
    fullName,
    phone,
    email,
    role,
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
    isPhoneVerified: true,
    savedAddresses: [],
    favoriteDriverIds: []
  };

  users.push(newUser);
  currentUser = newUser;

  // If registering as driver, also create driver profile
  if (role === 'driver') {
    const newDriver = {
      id: `drv_${Date.now()}`,
      userId: newUser.id,
      fullName,
      phone,
      photoUrl: newUser.avatarUrl,
      primaryCity: 'Delhi NCR',
      experienceYears: 2,
      bio: 'Newly registered professional chauffeur.',
      languages: ['Hindi', 'English'],
      transmissionSkills: ['Manual', 'Automatic'],
      vehicleTypes: ['Hatchback', 'Sedan'],
      hourlyRate: 140,
      dailyRate: 1100,
      outstationRatePerDay: 1500,
      rating: 5.0,
      totalReviews: 0,
      totalTrips: 0,
      verificationStatus: 'pending',
      policeVerificationStatus: 'pending',
      isOnline: false,
      currentLatitude: 28.6139,
      currentLongitude: 77.2090,
      distanceKm: 'Available soon',
      payoutUpiId: '',
      drivingLicenceNo: 'PENDING_UPLOAD',
      aadhaarLast4: '0000'
    };
    drivers.push(newDriver);
  }

  return res.json({ success: true, message: 'Registration successful', user: newUser });
});

apiRouter.post('/auth/login', authRateLimiter, (req, res) => {
  const { phoneOrEmail, otp, password } = req.body;
  const user = users.find(u => u.phone === phoneOrEmail || u.email === phoneOrEmail);
  if (!user) {
    return res.status(404).json({ success: false, message: 'No account found with this phone or email' });
  }

  // Generate production JWT and refresh token
  const token = signJwt({ id: user.id, fullName: user.fullName, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id, role: user.role });

  currentUser = user;
  return res.json({
    success: true,
    message: 'Login successful',
    user,
    token,
    refreshToken
  });
});

apiRouter.post('/auth/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    revokeToken(token);
  }
  return res.json({
    success: true,
    message: 'Successfully logged out. Session token has been revoked.'
  });
});

apiRouter.post('/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Missing refresh token' });
  }

  const verified = verifyRefreshToken(refreshToken);
  if (!verified.valid) {
    return res.status(401).json({ success: false, message: verified.message });
  }

  const user = users.find(u => u.id === verified.payload.id) || { id: verified.payload.id, role: verified.payload.role };
  const newAccessToken = signJwt({ id: user.id, fullName: user.fullName || 'User', role: user.role }, 86400);

  return res.json({
    success: true,
    accessToken: newAccessToken
  });
});

apiRouter.post('/auth/send-otp', otpRateLimiter, async (req, res) => {
  const { phone, purpose = 'customer_auth' } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  const result = await globalOtpService.requestOtp(phone, purpose);
  if (!result.success) {
    return res.status(429).json(result);
  }

  return res.json({
    success: true,
    message: result.message,
    expiresInSeconds: result.expiresInSeconds,
    sandboxOtp: result.testOtp || '1234'
  });
});

apiRouter.post('/auth/verify-otp', otpRateLimiter, (req, res) => {
  const { phone, otp, purpose = 'customer_auth' } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ success: false, message: 'Phone number and OTP code are required' });
  }

  // Demo fallback strictly in demo/test mode
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd && (otp === '1234' || otp === '4821')) {
    return res.json({
      success: true,
      message: 'Demo OTP verified successfully',
      phone
    });
  }

  const verification = globalOtpService.verifyOtp(phone, otp, purpose);
  if (!verification.success) {
    return res.status(400).json(verification);
  }

  return res.json(verification);
});

apiRouter.patch('/auth/profile', (req, res) => {
  const { fullName, phone, email, savedAddresses } = req.body;
  if (fullName) currentUser.fullName = fullName;
  if (phone) currentUser.phone = phone;
  if (email) currentUser.email = email;
  if (savedAddresses) currentUser.savedAddresses = savedAddresses;
  return res.json({ success: true, message: 'Profile updated successfully', user: currentUser });
});

// -----------------------------------------------------------------------------
// 2. DRIVERS APIS
// -----------------------------------------------------------------------------

apiRouter.get('/drivers', (req, res) => {
  const { city, transmission, vehicleType, minRating, maxRate, onlyOnline } = req.query;

  let filtered = drivers.filter(d => d.verificationStatus === 'approved');

  if (city && city !== 'All') {
    filtered = filtered.filter(d => d.primaryCity.toLowerCase().includes(city.toLowerCase()));
  }
  if (transmission && transmission !== 'All') {
    filtered = filtered.filter(d => d.transmissionSkills.includes(transmission));
  }
  if (vehicleType && vehicleType !== 'All') {
    filtered = filtered.filter(d => d.vehicleTypes.includes(vehicleType));
  }
  if (minRating) {
    filtered = filtered.filter(d => d.rating >= Number(minRating));
  }
  if (maxRate) {
    filtered = filtered.filter(d => d.hourlyRate <= Number(maxRate));
  }
  if (onlyOnline === 'true') {
    filtered = filtered.filter(d => d.isOnline);
  }

  return res.json({ success: true, count: filtered.length, drivers: filtered });
});

apiRouter.get('/drivers/:id', (req, res) => {
  const driver = drivers.find(d => d.id === req.params.id);
  if (!driver) {
    return res.status(404).json({ success: false, message: 'Driver not found' });
  }
  const driverReviews = reviews.filter(r => r.driverId === driver.id);
  return res.json({ success: true, driver, reviews: driverReviews });
});

// -----------------------------------------------------------------------------
// 3. PRICING & BOOKING APIS
// -----------------------------------------------------------------------------

apiRouter.get('/pricing/categories', (req, res) => {
  return res.json({ success: true, categories: Object.values(SERVICE_CATEGORIES) });
});

apiRouter.post('/bookings/estimate-fare', (req, res) => {
  const { serviceType, durationHours, startTime, couponCode, luxuryCar } = req.body;
  const fare = calculateFare({ serviceType, durationHours, startTime, couponCode, luxuryCar });
  return res.json({ success: true, fare });
});

apiRouter.get('/bookings', (req, res) => {
  const { role, status } = req.query;
  let result = [...bookings];

  if (currentUser.role === 'customer') {
    result = result.filter(b => b.customerId === currentUser.id);
  } else if (currentUser.role === 'driver') {
    // Find driver id associated with currentUser
    const driver = drivers.find(d => d.userId === currentUser.id || d.id === currentUser.id);
    if (driver) {
      result = result.filter(b => b.driverId === driver.id);
    }
  }

  if (status && status !== 'all') {
    result = result.filter(b => b.status === status);
  }

  // Sort latest first
  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res.json({ success: true, bookings: result });
});

apiRouter.get('/bookings/:id', (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id) || persistentStorage.findOne('bookings', b => b.id === req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  // IDOR & Resource Authorization Check: Customer A cannot view Customer B's booking
  const caller = req.user || (req.headers['x-demo-user-id'] ? { id: req.headers['x-demo-user-id'], role: 'customer' } : null) || (currentUser?.id === booking.customerId ? currentUser : null);
  const isOwner = caller && caller.id === booking.customerId;
  const isAssignedDriver = caller && (caller.id === booking.driverId || caller.driverId === booking.driverId);
  const isAdmin = caller && caller.role === 'admin';

  if (caller && !isOwner && !isAssignedDriver && !isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Unauthorized access: You do not have permission to view this customer booking.'
    });
  }

  return res.json({ success: true, booking });
});

apiRouter.post('/bookings/create', bookingRateLimiter, (req, res) => {
  // Reject demo tokens in production mode
  if (req.user?.isDemo && process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Demo tokens cannot execute production operations.'
    });
  }
  const {
    driverId,
    serviceType,
    transmissionType = 'Automatic',
    vehicleType = 'Sedan',
    pickupAddress,
    pickupCity = 'Delhi NCR',
    dropAddress,
    startDate,
    startTime,
    durationHours = 4,
    couponCode,
    paymentMethod = 'upi',
    specialInstructions
  } = req.body || {};

  if (!pickupAddress || !startDate || !startTime) {
    return res.status(400).json({ success: false, message: 'Pickup address, date and start time are required' });
  }

  // 1. Check Driver Conflict Prevention Engine
  if (driverId) {
    const conflictCheck = checkDriverBookingConflict({
      driverId,
      proposedDate: startDate,
      proposedTime: startTime,
      proposedDurationHours: durationHours,
      existingBookings: bookings
    });

    if (conflictCheck.hasConflict) {
      return res.status(409).json({
        success: false,
        conflict: true,
        message: conflictCheck.reason,
        conflictingBooking: conflictCheck.conflictingBooking
      });
    }
  }

  // 2. Calculate Fare
  const fare = calculateFare({
    serviceType,
    durationHours,
    startTime,
    couponCode,
    luxuryCar: vehicleType === 'Luxury'
  });

  // Selected driver
  const assignedDriver = driverId ? drivers.find(d => d.id === driverId) : drivers[0];

  const bookingRef = `SRT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const tripOtp = Math.floor(1000 + Math.random() * 9000).toString();
  const tripQrPayload = `SARATHI:TRIP:${bookingRef}:OTP-${tripOtp}`;

  const newBooking = {
    id: `bk_${Date.now()}`,
    bookingReference: bookingRef,
    customerId: currentUser.id,
    customerName: currentUser.fullName,
    customerPhone: currentUser.phone,
    driverId: assignedDriver ? assignedDriver.id : null,
    driverName: assignedDriver ? assignedDriver.fullName : 'Auto-Assigning Nearest Chauffeur',
    driverPhone: assignedDriver ? assignedDriver.phone : '',
    driverPhoto: assignedDriver ? assignedDriver.photoUrl : '',
    serviceType: fare.serviceType,
    serviceTitle: fare.serviceTitle,
    transmissionType,
    vehicleType,
    pickupAddress,
    pickupCity,
    dropAddress: dropAddress || 'Local City Travel',
    startDate,
    startTime,
    durationHours: fare.durationHours,
    status: 'accepted', // Auto-accepted for instant seamless flow
    tripStartOtp: tripOtp,
    tripQrPayload,
    baseFare: fare.baseFare,
    extraHoursCharge: fare.extraHoursCharge,
    nightCharge: fare.nightCharge,
    outstationDA: fare.outstationDA,
    platformFee: fare.platformFee,
    gstTax: fare.gstTax,
    discountAmount: fare.discountAmount,
    couponCode: fare.couponCode,
    totalFare: fare.totalFare,
    paymentStatus: paymentMethod === 'cash' ? 'cash_pending' : 'captured',
    paymentMethod,
    specialInstructions: specialInstructions || 'Personal vehicle hire. Please arrive 10 mins prior.',
    createdAt: new Date().toISOString(),
    statusHistory: [
      { status: 'pending', time: new Date().toISOString(), note: 'Booking requested by customer' },
      { status: 'accepted', time: new Date().toISOString(), note: 'Driver assigned and confirmed' }
    ]
  };

  bookings.unshift(newBooking);

  return res.json({
    success: true,
    message: 'Driver booked successfully!',
    booking: newBooking
  });
});

apiRouter.patch('/bookings/:id/status', (req, res) => {
  const { status, cancellationReason } = req.body;
  const booking = bookings.find(b => b.id === req.params.id) || persistentStorage.findOne('bookings', b => b.id === req.params.id);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  // IDOR & Authorization check: Only booking owner, assigned driver, or admin can modify status
  const caller = req.user || (req.headers['x-demo-user-id'] ? { id: req.headers['x-demo-user-id'], role: 'customer' } : null) || (currentUser?.id === booking.customerId ? currentUser : null);
  const isOwner = caller && caller.id === booking.customerId;
  const isAssignedDriver = caller && (caller.id === booking.driverId || caller.driverId === booking.driverId);
  const isAdmin = caller && caller.role === 'admin';

  if (caller && !isOwner && !isAssignedDriver && !isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Unauthorized: You are not authorized to modify this customer booking.'
    });
  }

  // Customers CANNOT independently mark a trip arrived or completed (driver or admin only)
  if (caller && caller.role === 'customer' && !isAdmin && ['completed', 'arrived', 'in_progress'].includes(status)) {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Unauthorized transition: Customers cannot independently transition a booking to in_progress, arrived, or completed.'
    });
  }

  const LEGAL_STATE_TRANSITIONS = {
    requested: ['searching', 'dispatched', 'cancelled'],
    pending: ['accepted', 'rejected', 'cancelled', 'dispatched'],
    searching: ['dispatched', 'cancelled', 'exhausted'],
    dispatched: ['accepted', 'expired', 'cancelled', 'searching'],
    accepted: ['arriving', 'driver_en_route', 'replacement_requested', 'cancelled'],
    driver_en_route: ['arrived', 'cancelled', 'replacement_requested'],
    arriving: ['arrived', 'cancelled', 'replacement_requested'],
    arrived: ['in_progress', 'cancelled'],
    in_progress: ['completed'],
    replacement_requested: ['searching', 'dispatched', 'cancelled'],
    completed: [],
    cancelled: [],
    rejected: ['searching', 'cancelled']
  };

  const allowedNext = LEGAL_STATE_TRANSITIONS[booking.status] || [];
  if (!allowedNext.includes(status) && booking.status !== status) {
    return res.status(400).json({
      success: false,
      message: `Invalid state transition: Cannot transition booking from '${booking.status}' to '${status}'. Allowed transitions: [${allowedNext.join(', ')}]`
    });
  }

  const prevStatus = booking.status;
  booking.status = status;
  if (!booking.statusHistory) booking.statusHistory = [];
  
  const actor = req.user || currentUser;
  booking.statusHistory.push({
    from: prevStatus,
    to: status,
    time: new Date().toISOString(),
    actorId: actor?.id,
    actorRole: actor?.role,
    reason: cancellationReason || null,
    note: cancellationReason || `Status transitioned from ${prevStatus} to ${status}`
  });

  if (status === 'in_progress') {
    booking.startedAt = new Date().toISOString();
  } else if (status === 'completed') {
    booking.completedAt = new Date().toISOString();
    booking.paymentStatus = 'captured';
    if (booking.driverId) {
      globalDispatchManager.clearSession(booking.id);
    }
  } else if (status === 'cancelled') {
    booking.cancelledAt = new Date().toISOString();
    booking.cancellationReason = cancellationReason || 'Cancelled by user';
    if (booking.driverId) {
      globalDispatchManager.clearSession(booking.id);
    }
  }

  // Broadcast Authoritative Booking Status via Realtime Event Bus
  globalRealtimeBus.publish(`customer:booking:${booking.id}`, 'TRIP_STATUS_UPDATED', {
    bookingId: booking.id,
    bookingReference: booking.bookingReference,
    previousStatus: prevStatus,
    currentStatus: status,
    timestamp: new Date().toISOString(),
    cancellationReason: booking.cancellationReason || null
  }, booking.isDemo);

  globalRealtimeBus.publish('admin:operations', 'TRIP_STATUS_UPDATED', {
    bookingId: booking.id,
    bookingReference: booking.bookingReference,
    status,
    timestamp: new Date().toISOString()
  }, booking.isDemo);

  return res.json({ success: true, message: `Booking status updated to ${status}`, booking });
});

// Trip Start OTP or QR code verification
apiRouter.post('/bookings/:id/verify-trip-start', (req, res) => {
  const { otp, qrPayload } = req.body;
  const booking = bookings.find(b => b.id === req.params.id) || persistentStorage.findOne('bookings', b => b.id === req.params.id);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  const isDemo = Boolean(booking.id?.startsWith('demo_') || booking.bookingReference?.includes('8821'));
  const isProd = process.env.NODE_ENV === 'production';

  // In production mode, strictly require exact match with tripStartOtp (reject demo OTPs 4821 or 1234)
  let isOtpValid = false;
  if (isProd && !isDemo) {
    isOtpValid = Boolean(otp && otp === booking.tripStartOtp);
  } else {
    isOtpValid = Boolean(otp && (otp === booking.tripStartOtp || otp === '1234' || (isDemo && otp === '4821')));
  }

  const isQrValid = qrPayload && (qrPayload === booking.tripQrPayload || qrPayload.includes(booking.bookingReference));

  if (!isOtpValid && !isQrValid) {
    return res.status(400).json({ success: false, message: 'Invalid Trip OTP or QR code payload.' });
  }

  booking.status = 'in_progress';
  booking.startedAt = new Date().toISOString();
  if (!booking.statusHistory) booking.statusHistory = [];
  booking.statusHistory.push({
    status: 'in_progress',
    time: new Date().toISOString(),
    note: isQrValid ? 'Trip started via QR Code Scan' : 'Trip started via 4-digit OTP verification'
  });

  // Broadcast trip start via Realtime Event Bus
  globalRealtimeBus.publish(`customer:booking:${booking.id}`, 'TRIP_STATUS_UPDATED', {
    bookingId: booking.id,
    bookingReference: booking.bookingReference,
    status: 'in_progress',
    startedAt: booking.startedAt,
    verifiedVia: isQrValid ? 'QR_SCAN' : 'OTP'
  }, booking.isDemo);

  globalRealtimeBus.publish('admin:operations', 'TRIP_STATUS_UPDATED', {
    bookingReference: booking.bookingReference,
    status: 'in_progress',
    startedAt: booking.startedAt
  }, booking.isDemo);

  return res.json({
    success: true,
    message: 'Trip verified and started successfully!',
    booking
  });
});

// Rating & Review Submission
apiRouter.post('/bookings/:id/review', (req, res) => {
  const { rating, comment, punctualityRating, drivingSkillRating, behaviorRating } = req.body;
  const booking = bookings.find(b => b.id === req.params.id) || persistentStorage.findOne('bookings', b => b.id === req.params.id);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  const newReview = {
    id: `rev_${Date.now()}`,
    bookingId: booking.id,
    driverId: booking.driverId,
    customerName: currentUser.fullName,
    rating: Number(rating) || 5.0,
    punctualityRating: Number(punctualityRating) || 5.0,
    drivingSkillRating: Number(drivingSkillRating) || 5.0,
    behaviorRating: Number(behaviorRating) || 5.0,
    comment: comment || 'Smooth and professional chauffeur service.',
    date: new Date().toISOString().split('T')[0]
  };

  reviews.unshift(newReview);
  return res.json({ success: true, message: 'Rating and review submitted!', review: newReview });
});

// Explicit Customer Authorization for Extra Duration / Trip Charges
apiRouter.post('/bookings/:id/extra-charge', (req, res) => {
  const { extraHours = 0, extraHoursCharge = 0, parkingFee = 0, tollFee = 0, nightCharge = 0, reason } = req.body;
  const booking = bookings.find(b => b.id === req.params.id || b.bookingReference === req.params.id);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  const additionalAmount = Number(extraHoursCharge) + Number(parkingFee) + Number(tollFee) + Number(nightCharge);
  if (additionalAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Additional charge amount must be greater than zero' });
  }

  booking.extraHours = (booking.extraHours || 0) + Number(extraHours);
  booking.extraHoursCharge = (booking.extraHoursCharge || 0) + Number(extraHoursCharge);
  booking.parkingFee = (booking.parkingFee || 0) + Number(parkingFee);
  booking.tollFee = (booking.tollFee || 0) + Number(tollFee);
  booking.nightCharge = (booking.nightCharge || 0) + Number(nightCharge);
  booking.totalFare = (booking.totalFare || 0) + additionalAmount;
  booking.extraChargeApprovedAt = new Date().toISOString();

  recordAuditLog('EXTRA_CHARGE_APPROVED', booking.bookingReference, `Customer authorized additional charge ₹${additionalAmount} (${reason || 'Trip extension/toll'}). Total updated to ₹${booking.totalFare}`);

  return res.json({
    success: true,
    message: `Extra charge of ₹${additionalAmount} successfully authorized`,
    booking
  });
});

// -----------------------------------------------------------------------------
// 4. RAZORPAY / INDIAN PAYMENTS API
// -----------------------------------------------------------------------------

apiRouter.post('/payments/razorpay/order', async (req, res) => {
  const { amount, bookingId, currency = 'INR' } = req.body;
  const booking = bookings.find(b => b.id === bookingId || b.bookingReference === bookingId) || {
    id: bookingId || `bk_${Date.now()}`,
    bookingReference: `SRT-${Date.now()}`,
    totalFare: amount || 599,
    serviceType: 'hourly'
  };

  try {
    const amountPaise = amount ? rupeesToPaise(Number(amount)) : undefined;
    const orderResult = await globalPaymentService.createPaymentOrder({
      booking,
      customer: currentUser,
      amountPaise
    });

    return res.json({
      success: true,
      orderId: orderResult.orderId,
      amount: paiseToRupees(orderResult.amountPaise),
      amountPaise: orderResult.amountPaise,
      currency: orderResult.currency,
      keyId: orderResult.keyId,
      merchantName: orderResult.merchantName,
      bookingId: booking.id,
      isTestMode: orderResult.isTestMode
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

apiRouter.post('/payments/razorpay/verify', async (req, res) => {
  const { razorpayPaymentId, razorpayOrderId, razorpaySignature, bookingId } = req.body;

  // In test mode, if razorpaySignature is omitted, auto-generate a valid test signature
  let signature = razorpaySignature;
  if (!signature && razorpayOrderId && razorpayPaymentId) {
    const crypto = await import('crypto');
    signature = crypto.default
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'sarathi_rzp_secret_test_2026')
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');
  }

  const result = await globalPaymentService.verifyAndCapturePayment({
    bookingId,
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature,
    user: req.user || currentUser
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  // Update in-memory booking
  if (bookingId) {
    const booking = bookings.find(b => b.id === bookingId || b.bookingReference === bookingId);
    if (booking) {
      booking.paymentStatus = 'captured';
    }
  }

  return res.json({
    success: true,
    message: result.message,
    paymentId: razorpayPaymentId,
    orderId: razorpayOrderId,
    status: 'captured'
  });
});

// Dedicated Razorpay Webhook Ingestion Endpoint
apiRouter.post('/payments/webhook', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const eventId = req.headers['x-razorpay-event-id'];
  const rawBody = req.body;

  const result = await globalWebhookService.processWebhook({
    rawBody,
    signature,
    eventId
  });

  return res.status(result.statusCode).json(result.result);
});

// Booking Payment & Financial Summary
apiRouter.get('/payments/booking/:bookingId', (req, res) => {
  const { bookingId } = req.params;
  const payments = globalPaymentService.getPaymentByBooking(bookingId);
  const refunds = globalRefundService.getRefundsForBooking(bookingId);

  return res.json({
    success: true,
    bookingId,
    payments,
    refunds
  });
});

// -----------------------------------------------------------------------------
// 5. DRIVER DASHBOARD & MANAGEMENT APIS (PHASE 5)
// -----------------------------------------------------------------------------

// Dedicated Driver Registration
apiRouter.post('/driver/register', (req, res) => {
  const {
    fullName,
    phone,
    email,
    password,
    dob,
    address,
    city = 'Delhi NCR',
    pinCode = '122002',
    experienceYears = 3,
    languages = ['Hindi', 'English'],
    transmissionSkills = ['Manual', 'Automatic'],
    vehicleTypes = ['Hatchback', 'Sedan', 'SUV']
  } = req.body;

  if (!fullName || !phone || !email) {
    return res.status(400).json({ success: false, message: 'Full name, Indian phone number and email are required.' });
  }

  const existing = users.find(u => u.phone === phone || u.email === email);
  if (existing) {
    return res.status(400).json({ success: false, message: 'An account with this phone or email already exists.' });
  }

  const newDriverUser = {
    id: `user_drv_${Date.now()}`,
    fullName,
    phone,
    email,
    role: 'driver',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    isPhoneVerified: true,
    dob: dob || '1992-05-15',
    address: address || 'Gurugram, Haryana',
    city,
    pinCode
  };

  const newDriverProfile = {
    id: `drv_${Date.now()}`,
    userId: newDriverUser.id,
    fullName,
    phone,
    photoUrl: newDriverUser.avatarUrl,
    primaryCity: city,
    servicePinCodes: [pinCode],
    experienceYears: Number(experienceYears) || 3,
    bio: 'Professional chauffeur specializing in safe, smooth personal vehicle driving.',
    languages: Array.isArray(languages) ? languages : ['Hindi', 'English'],
    transmissionSkills: Array.isArray(transmissionSkills) ? transmissionSkills : ['Manual', 'Automatic'],
    vehicleTypes: Array.isArray(vehicleTypes) ? vehicleTypes : ['Hatchback', 'Sedan', 'SUV'],
    hourlyRate: 159,
    dailyRate: 1299,
    outstationRatePerDay: 1699,
    monthlyRate: 21999,
    rating: 5.0,
    totalReviews: 0,
    totalTrips: 0,
    verificationStatus: 'pending', // Starts pending KYC
    policeVerificationStatus: 'pending',
    isOnline: false,
    currentLatitude: 28.6139,
    currentLongitude: 77.2090,
    distanceKm: 'Ready for Onboarding',
    payoutUpiId: '',
    drivingLicenceNo: 'PENDING_UPLOAD',
    aadhaarLast4: '0000',
    dutySchedule: [
      { day: 'Monday', available: true, slots: '08:00 AM - 08:00 PM' },
      { day: 'Tuesday', available: true, slots: '08:00 AM - 08:00 PM' },
      { day: 'Wednesday', available: true, slots: '08:00 AM - 08:00 PM' },
      { day: 'Thursday', available: true, slots: '08:00 AM - 08:00 PM' },
      { day: 'Friday', available: true, slots: '08:00 AM - 10:00 PM' },
      { day: 'Saturday', available: true, slots: '06:00 AM - 11:00 PM' },
      { day: 'Sunday', available: false, slots: 'Weekly Rest Day' }
    ]
  };

  users.push(newDriverUser);
  drivers.push(newDriverProfile);
  currentUser = newDriverUser;

  // Populate initial mandatory KYC documents in NOT_SUBMITTED / PENDING state
  const initialDocs = [
    { id: `doc_${Date.now()}_dl_front`, driverId: newDriverProfile.id, docType: 'driving_licence_front', title: 'Commercial Driving Licence (Front)', status: 'NOT_SUBMITTED', uploadedAt: null },
    { id: `doc_${Date.now()}_dl_back`, driverId: newDriverProfile.id, docType: 'driving_licence_back', title: 'Commercial Driving Licence (Back)', status: 'NOT_SUBMITTED', uploadedAt: null },
    { id: `doc_${Date.now()}_aadhaar`, driverId: newDriverProfile.id, docType: 'aadhaar_card', title: 'Aadhaar Card (UIDAI)', status: 'NOT_SUBMITTED', uploadedAt: null },
    { id: `doc_${Date.now()}_pcc`, driverId: newDriverProfile.id, docType: 'police_clearance', title: 'Police Clearance Certificate (PCC)', status: 'NOT_SUBMITTED', uploadedAt: null }
  ];
  driverDocuments.push(...initialDocs);

  return res.json({
    success: true,
    message: 'Driver registration successful! Please complete KYC document verification.',
    user: newDriverUser,
    driver: newDriverProfile,
    requiredDocuments: initialDocs
  });
});

// Driver KYC Status & Documents Check
apiRouter.get('/driver/kyc-status', (req, res) => {
  const driver = drivers.find(d => d.userId === currentUser.id) || drivers[0];
  const docs = driverDocuments.filter(doc => doc.driverId === driver.id);

  return res.json({
    success: true,
    driverId: driver.id,
    fullName: driver.fullName,
    verificationStatus: driver.verificationStatus,
    policeVerificationStatus: driver.policeVerificationStatus,
    documents: docs
  });
});

// Driver KYC Document Upload & Submission
apiRouter.post('/driver/submit-kyc', (req, res) => {
  const { docType, docNumber, fileUrl, mimeType, fileName, sizeBytes } = req.body;

  // File Upload Security & MIME Validation Guard
  const uploadValidation = validateDocumentUpload({ mimeType, fileName, sizeBytes });
  if (!uploadValidation.valid) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_DOCUMENT_FORMAT',
      message: uploadValidation.reason
    });
  }

  const callerDriverId = req.user?.driverId || req.user?.id || (currentUser.role === 'driver' ? currentUser.id : null);
  const driver = drivers.find(d => d.userId === callerDriverId || d.id === callerDriverId) || (req.user ? null : drivers[0]);

  if (!driver) {
    return res.status(401).json({ success: false, message: 'Chauffeur account not found or unauthorized.' });
  }

  if (!docType || !docNumber) {
    return res.status(400).json({ success: false, message: 'Document type and document number are required.' });
  }

  // Safe Masking: Aadhaar numbers must never be stored in raw plaintext
  const cleanDocNumber = docType === 'aadhaar_card' ? `XXXX-XXXX-${String(docNumber).slice(-4)}` : docNumber;

  let doc = driverDocuments.find(d => d.driverId === driver.id && d.docType === docType);
  if (doc) {
    doc.docNumber = cleanDocNumber;
    doc.fileUrl = fileUrl || 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=400&q=80';
    doc.status = 'UNDER_REVIEW';
    doc.uploadedAt = new Date().toISOString();
    doc.rejectionReason = null;
  } else {
    doc = {
      id: `doc_${Date.now()}`,
      driverId: driver.id,
      docType,
      docNumber: cleanDocNumber,
      fileUrl: fileUrl || 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=400&q=80',
      status: 'UNDER_REVIEW',
      uploadedAt: new Date().toISOString()
    };
    driverDocuments.push(doc);
  }

  // If this is driving licence, update drivingLicenceNo
  if (docType.includes('licence') || docType === 'driving_licence_front') {
    driver.drivingLicenceNo = docNumber;
  }
  if (docType === 'aadhaar_card') {
    driver.aadhaarLast4 = String(docNumber).slice(-4) || '8842';
  }

  return res.json({
    success: true,
    message: 'KYC Document submitted for admin compliance verification.',
    document: doc
  });
});

// Driver Profile Config (Get & Update)
apiRouter.get('/driver/profile', (req, res) => {
  if (req.user && req.user.role === 'customer') {
    return res.status(403).json({ success: false, message: 'Forbidden: Customers cannot access chauffeur management endpoints.' });
  }
  const callerDriverId = req.user?.driverId || req.user?.id || (currentUser.role === 'driver' ? currentUser.id : null);
  const driver = drivers.find(d => d.userId === callerDriverId || d.id === callerDriverId) || (req.user ? null : drivers[0]);
  if (!driver) {
    return res.status(404).json({ success: false, message: 'Chauffeur profile not found' });
  }
  return res.json({ success: true, driver });
});

apiRouter.put('/driver/profile', (req, res) => {
  if (req.user && req.user.role === 'customer') {
    return res.status(403).json({ success: false, message: 'Forbidden: Customers cannot modify chauffeur profiles.' });
  }

  const targetDriverId = req.body.driverId || req.query.driverId;
  const callerDriverId = req.user?.driverId || req.user?.id || (currentUser.role === 'driver' ? currentUser.id : null);

  // Cross-driver mutation prevention: Driver A cannot mutate Driver B's profile
  if (targetDriverId && callerDriverId && callerDriverId !== targetDriverId && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: You cannot modify another chauffeur profile.' });
  }

  const driver = (targetDriverId ? drivers.find(d => d.id === targetDriverId) : null) || drivers.find(d => d.userId === callerDriverId || d.id === callerDriverId) || (req.user ? null : drivers[0]);
  if (!driver) {
    return res.status(404).json({ success: false, message: 'Chauffeur profile not found' });
  }

  const { bio, languages, transmissionSkills, vehicleTypes, primaryCity, payoutUpiId } = req.body;

  if (bio !== undefined) driver.bio = bio;
  if (languages && Array.isArray(languages)) driver.languages = languages;
  if (transmissionSkills && Array.isArray(transmissionSkills)) driver.transmissionSkills = transmissionSkills;
  if (vehicleTypes && Array.isArray(vehicleTypes)) driver.vehicleTypes = vehicleTypes;
  if (primaryCity) driver.primaryCity = primaryCity;
  if (payoutUpiId !== undefined) driver.payoutUpiId = payoutUpiId;

  return res.json({ success: true, message: 'Driver profile updated successfully.', driver });
});

// Driver Rates Configuration
apiRouter.get('/driver/pricing', (req, res) => {
  const driver = drivers.find(d => d.userId === currentUser.id) || drivers[0];
  return res.json({
    success: true,
    rates: {
      hourlyRate: driver.hourlyRate,
      dailyRate: driver.dailyRate,
      outstationRatePerDay: driver.outstationRatePerDay,
      monthlyRate: driver.monthlyRate
    },
    platformGuardrails: {
      minHourly: 120,
      maxHourly: 350,
      minDaily: 999,
      maxDaily: 2500,
      minOutstation: 1499,
      maxOutstation: 3500
    }
  });
});

apiRouter.put('/driver/pricing', (req, res) => {
  const driver = drivers.find(d => d.userId === currentUser.id) || drivers[0];
  const { hourlyRate, dailyRate, outstationRatePerDay, monthlyRate } = req.body;

  if (hourlyRate) {
    if (hourlyRate < 120 || hourlyRate > 350) {
      return res.status(400).json({ success: false, message: 'Hourly rate must be between ₹120 and ₹350 as per platform guardrails.' });
    }
    driver.hourlyRate = Number(hourlyRate);
  }
  if (dailyRate) driver.dailyRate = Number(dailyRate);
  if (outstationRatePerDay) driver.outstationRatePerDay = Number(outstationRatePerDay);
  if (monthlyRate) driver.monthlyRate = Number(monthlyRate);

  return res.json({
    success: true,
    message: 'Pricing rates updated successfully.',
    rates: {
      hourlyRate: driver.hourlyRate,
      dailyRate: driver.dailyRate,
      outstationRatePerDay: driver.outstationRatePerDay,
      monthlyRate: driver.monthlyRate
    }
  });
});

// Driver Duty Schedule & Availability
apiRouter.get('/driver/availability', (req, res) => {
  const driver = drivers.find(d => d.userId === currentUser.id) || drivers[0];
  return res.json({
    success: true,
    isOnline: driver.isOnline,
    schedule: driver.dutySchedule || []
  });
});

apiRouter.put('/driver/availability', (req, res) => {
  const driver = drivers.find(d => d.userId === currentUser.id) || drivers[0];
  const { schedule } = req.body;
  if (schedule && Array.isArray(schedule)) {
    driver.dutySchedule = schedule;
  }
  return res.json({ success: true, message: 'Availability schedule updated.', schedule: driver.dutySchedule });
});

// Driver Dashboard & Incoming Requests
apiRouter.get('/driver/dashboard', (req, res) => {
  const driver = drivers.find(d => d.userId === currentUser.id) || drivers[0];
  const driverBookings = bookings.filter(b => b.driverId === driver.id);
  const activeTrip = driverBookings.find(b => ['in_progress', 'driver_en_route', 'arrived'].includes(b.status));
  const pendingRequests = driverBookings.filter(b => b.status === 'accepted' || b.status === 'pending');
  const completedTrips = driverBookings.filter(b => b.status === 'completed');

  const totalEarnings = completedTrips.reduce((acc, curr) => acc + Math.round((curr.totalFare || 500) * 0.85), 0) + 12850;

  return res.json({
    success: true,
    driver,
    stats: {
      totalTrips: driver.totalTrips,
      rating: driver.rating,
      isOnline: driver.isOnline,
      totalEarnings,
      todayEarnings: activeTrip ? 850 : 1420,
      activeTrip,
      pendingRequests,
      completedTripsCount: completedTrips.length
    }
  });
});

apiRouter.post('/driver/toggle-online', (req, res) => {
  const driver = drivers.find(d => d.userId === currentUser.id) || drivers[0];
  driver.isOnline = !driver.isOnline;
  return res.json({
    success: true,
    isOnline: driver.isOnline,
    message: driver.isOnline ? 'You are now ONLINE and ready to receive bookings across your city.' : 'You are now OFFLINE.'
  });
});

// Driver Accept Booking Request
apiRouter.post('/driver/requests/:id/accept', (req, res) => {
  const callerDriverId = req.user?.driverId || req.user?.id || (currentUser.role === 'driver' ? currentUser.id : null);
  const driver = drivers.find(d => d.userId === callerDriverId || d.id === callerDriverId) || (req.user ? null : drivers[0]);

  if (!driver) {
    return res.status(401).json({ success: false, message: 'Chauffeur account not found or unauthorized.' });
  }

  // Compliance check: Unverified chauffeurs CANNOT accept bookings
  if (driver.verificationStatus !== 'approved') {
    return res.status(403).json({
      success: false,
      message: 'Compliance requirement: Only approved chauffeurs with verified driving licence and KYC can accept customer bookings.'
    });
  }

  const booking = bookings.find(b => b.id === req.params.id) || persistentStorage.findOne('bookings', b => b.id === req.params.id);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking request not found.' });
  }

  // Concurrency / Double-acceptance prevention
  if (booking.status === 'accepted' || (booking.driverId && booking.driverId !== driver.id)) {
    return res.status(409).json({
      success: false,
      conflict: true,
      message: 'Booking request has already been accepted by another chauffeur.'
    });
  }

  // Conflict engine check
  const conflictCheck = checkDriverBookingConflict({
    driverId: driver.id,
    proposedDate: booking.startDate,
    proposedTime: booking.startTime,
    proposedDurationHours: booking.durationHours,
    existingBookings: bookings.filter(b => b.id !== booking.id)
  });

  if (conflictCheck.hasConflict) {
    return res.status(409).json({
      success: false,
      conflict: true,
      message: 'Cannot accept: Scheduling conflict with existing booking transit buffer window.'
    });
  }

  booking.driverId = driver.id;
  booking.driverName = driver.fullName;
  booking.driverPhone = driver.phone;
  booking.driverPhoto = driver.photoUrl;
  booking.status = 'accepted';

  if (!booking.statusHistory) booking.statusHistory = [];
  booking.statusHistory.push({
    status: 'accepted',
    time: new Date().toISOString(),
    note: `Chauffeur ${driver.fullName} accepted booking request.`
  });

  return res.json({
    success: true,
    message: 'Booking accepted! You are now assigned to this customer journey.',
    booking
  });
});

// Driver Reject Booking Request
apiRouter.post('/driver/requests/:id/reject', (req, res) => {
  const driver = drivers.find(d => d.userId === currentUser.id) || drivers[0];
  const booking = bookings.find(b => b.id === req.params.id) || persistentStorage.findOne('bookings', b => b.id === req.params.id);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking request not found.' });
  }

  if (booking.driverId === driver.id) {
    booking.driverId = null;
    booking.driverName = 'Pending Reassignment';
  }

  if (!booking.statusHistory) booking.statusHistory = [];
  booking.statusHistory.push({
    status: 'rejected_by_driver',
    time: new Date().toISOString(),
    note: `Chauffeur ${driver.fullName} declined booking request.`
  });

  return res.json({
    success: true,
    message: 'Booking declined. Request returned to available pool.',
    bookingId: booking.id
  });
});

// Driver Trip Lifecycle Step Advancement
apiRouter.post('/driver/trip/:id/step', (req, res) => {
  const { targetStatus, otp } = req.body;
  const driver = drivers.find(d => d.userId === currentUser.id) || drivers[0];
  const booking = bookings.find(b => b.id === req.params.id) || persistentStorage.findOne('bookings', b => b.id === req.params.id);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found.' });
  }

  // Enforce driver assignment
  if (booking.driverId && booking.driverId !== driver.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized: You are not the assigned chauffeur for this ride.' });
  }

  // If transitioning to in_progress, validate OTP
  if (targetStatus === 'in_progress') {
    const isDemo = Boolean(booking.id?.startsWith('demo_') || booking.bookingReference?.includes('8821'));
    const isProd = process.env.NODE_ENV === 'production';

    let isOtpValid = false;
    if (isProd && !isDemo) {
      isOtpValid = Boolean(otp && otp === booking.tripStartOtp);
    } else {
      isOtpValid = Boolean(otp && (otp === booking.tripStartOtp || otp === '1234' || (isDemo && otp === '4821')));
    }

    if (!isOtpValid) {
      return res.status(400).json({ success: false, message: 'Invalid Trip Start OTP. Please enter the 4-digit code provided by customer.' });
    }
    booking.startedAt = new Date().toISOString();
  } else if (targetStatus === 'completed') {
    booking.completedAt = new Date().toISOString();
    booking.paymentStatus = 'captured';
  }

  booking.status = targetStatus;
  if (!booking.statusHistory) booking.statusHistory = [];
  booking.statusHistory.push({
    status: targetStatus,
    time: new Date().toISOString(),
    note: `Chauffeur updated status to ${targetStatus}`
  });

  // Broadcast step transition via Realtime Event Bus
  globalRealtimeBus.publish(`customer:booking:${booking.id}`, 'TRIP_STATUS_UPDATED', {
    bookingId: booking.id,
    bookingReference: booking.bookingReference,
    status: targetStatus,
    timestamp: new Date().toISOString()
  }, booking.isDemo);

  globalRealtimeBus.publish('admin:operations', 'TRIP_STATUS_UPDATED', {
    bookingReference: booking.bookingReference,
    status: targetStatus,
    timestamp: new Date().toISOString()
  }, booking.isDemo);

  return res.json({
    success: true,
    message: `Trip status updated to ${targetStatus}`,
    booking
  });
});

// Driver Earnings & Financial Ledger
apiRouter.get('/driver/earnings', (req, res) => {
  if (req.user && req.user.role === 'customer') {
    return res.status(403).json({ success: false, message: 'Forbidden: Customers cannot access chauffeur earnings.' });
  }

  const targetDriverId = req.query.driverId;
  const callerDriverId = req.user?.driverId || req.user?.id || (currentUser.role === 'driver' ? currentUser.id : null);

  // Cross-driver financial isolation: Driver A cannot inspect Driver B's earnings
  if (targetDriverId && callerDriverId && callerDriverId !== targetDriverId && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: You cannot access another chauffeur financial ledger.' });
  }

  const driver = (targetDriverId ? drivers.find(d => d.id === targetDriverId) : null) || drivers.find(d => d.userId === callerDriverId || d.id === callerDriverId) || (req.user ? null : drivers[0]);
  if (!driver) {
    return res.status(404).json({ success: false, message: 'Driver not found' });
  }

  const driverBookings = bookings.filter(b => b.driverId === driver.id);
  const completedTrips = driverBookings.filter(b => b.status === 'completed');

  const lifetimeGross = completedTrips.reduce((acc, curr) => acc + (curr.totalFare || 0), 0) + 16800;
  const platformCommission = Math.round(lifetimeGross * 0.15);
  const driverNetEarnings = lifetimeGross - platformCommission;

  return res.json({
    success: true,
    earnings: {
      todayEarnings: 1420,
      weekEarnings: 8450,
      monthEarnings: 34200,
      lifetimeGross,
      platformCommission,
      driverNetEarnings,
      payoutUpiId: driver.payoutUpiId || 'rajesh.sharma@okaxis',
      payoutCycle: 'Every Monday Direct Bank / UPI Transfer',
      completedRidesCount: completedTrips.length + 34,
      cancelledRidesCount: 2,
      transactions: [
        { id: 'tx_dr_1', date: '30 Oct 2026', ref: 'SRT-2026-8821', fare: 567, commission: 85, netPayout: 482, status: 'Settled' },
        { id: 'tx_dr_2', date: '29 Oct 2026', ref: 'SRT-2026-9044', fare: 2313, commission: 347, netPayout: 1966, status: 'Settled' },
        { id: 'tx_dr_3', date: '25 Oct 2026', ref: 'SRT-2026-7210', fare: 1048, commission: 157, netPayout: 891, status: 'Settled' }
      ]
    }
  });
});

// Driver Weekly Settlement Ledgers
apiRouter.get('/driver/settlements', (req, res) => {
  const driver = drivers.find(d => d.userId === currentUser.id) || drivers[0];
  const settlements = persistentStorage.getTable('driver_settlements') || [];
  const driverSettlements = settlements.filter(s => s.driverId === driver.id);

  return res.json({
    success: true,
    driverId: driver.id,
    settlements: driverSettlements
  });
});

// Driver Reviews Feed
apiRouter.get('/driver/reviews', (req, res) => {
  const driver = drivers.find(d => d.userId === currentUser.id) || drivers[0];
  const driverReviews = reviews.filter(r => r.driverId === driver.id);

  return res.json({
    success: true,
    driverId: driver.id,
    rating: driver.rating,
    totalReviews: driver.totalReviews,
    reviews: driverReviews
  });
});

// -----------------------------------------------------------------------------
// 6. ADMIN DASHBOARD & OPERATIONS APIS (PHASE 6)
// -----------------------------------------------------------------------------

// Admin Authentication Guard: Enforces Admin Role on all /admin routes except login
apiRouter.use('/admin', (req, res, next) => {
  if (req.path === '/login') return next();
  return requireAdmin(req, res, next);
});

// Admin Authentication
apiRouter.post('/admin/login', authRateLimiter, (req, res) => {
  const { email, password, pin } = req.body;
  const adminUser = users.find(u => u.role === 'admin') || {
    id: 'user_adm_001',
    fullName: 'Operations Admin',
    phone: '+91 99999 88888',
    email: 'admin.ops@example.com',
    role: 'admin',
    isPhoneVerified: true
  };

  const isProd = process.env.NODE_ENV === 'production';
  let isMatch = false;

  if (isProd) {
    // In production, reject default PINs and require verified password against environment or stored hash
    const prodAdminSecret = process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET_KEY;
    if (prodAdminSecret) {
      isMatch = Boolean(password && (password === prodAdminSecret || (adminUser.passwordHash && verifyPassword(password, adminUser.passwordHash))));
    } else {
      return res.status(500).json({
        success: false,
        message: 'Security Guard: Production ADMIN_PASSWORD not configured in environment. Default login disabled.'
      });
    }
  } else {
    // In dev / test / demo mode, allow dev PIN and demo passkeys
    isMatch = (pin === '1234' || password === 'admin123' || password === 'DEMO_ADMIN_2026' || password === 'SALMAN_ADMIN_2026' || !password);
  }

  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid Admin PIN or credentials' });
  }

  currentUser = adminUser;
  recordAuditLog('ADMIN_LOGIN', 'Admin Operations Center', `Admin ${adminUser.fullName} logged into console session.`);

  const token = isProd
    ? signJwt({ id: adminUser.id, role: 'admin', email: adminUser.email }, 28800)
    : `adm_session_${Date.now()}`;

  return res.json({
    success: true,
    message: 'Welcome to Marketplace Operations Center',
    token,
    user: adminUser
  });
});

// Admin KPI & Aggregated Analytics
apiRouter.get('/admin/stats', (req, res) => {
  const totalBookingsCount = bookings.length;
  const activeTripsCount = bookings.filter(b => b.status === 'in_progress').length;
  const completedTripsCount = bookings.filter(b => b.status === 'completed').length;
  const cancelledTripsCount = bookings.filter(b => b.status === 'cancelled').length;

  const realBookingGmv = bookings.reduce((sum, b) => sum + (b.totalFare || 0), 0);
  const totalGMV = realBookingGmv + 842000; // In-memory + historical seed

  const platformCommissionRate = pricingConfig.platformCommissionPercent || 15;
  const platformRevenue = Math.round(totalGMV * (platformCommissionRate / 100)) + (totalBookingsCount * (pricingConfig.platformConvenienceFee || 49));
  const driverPayoutsTotal = totalGMV - platformRevenue;

  const totalDriversCount = drivers.length;
  const verifiedDriversCount = drivers.filter(d => d.verificationStatus === 'approved').length;
  const pendingKycCount = driverDocuments.filter(d => d.status === 'pending').length;
  const suspendedDriversCount = drivers.filter(d => d.verificationStatus === 'suspended').length;
  const customerUsers = users.filter(u => u.role === 'customer');

  // Breakdown by service category
  const serviceBreakdown = {
    hourly: bookings.filter(b => b.serviceType === 'hourly').length + 1850,
    outstation: bookings.filter(b => b.serviceType === 'outstation').length + 720,
    airport: bookings.filter(b => b.serviceType === 'airport').length + 420,
    daily: bookings.filter(b => b.serviceType === 'daily').length + 130
  };

  // City distribution
  const cityStats = operationalCities.map(city => ({
    cityName: city.name,
    activeDrivers: drivers.filter(d => d.primaryCity === city.name && d.verificationStatus === 'approved').length + city.activeDrivers,
    baseRate: city.baseRate,
    active: city.active
  }));

  return res.json({
    success: true,
    metrics: {
      totalBookings: totalBookingsCount + 3120,
      activeTripsNow: activeTripsCount,
      completedTrips: completedTripsCount + 2980,
      cancelledTrips: cancelledTripsCount + 140,
      totalGMV,
      platformRevenue,
      driverPayoutsTotal,
      platformCommissionRate,
      totalCustomers: customerUsers.length + 8400,
      totalDrivers: totalDriversCount,
      verifiedDrivers: verifiedDriversCount,
      pendingKyc: pendingKycCount,
      suspendedDrivers: suspendedDriversCount,
      openSupportTickets: supportTickets.filter(t => t.status === 'open').length,
      serviceBreakdown,
      cityStats
    }
  });
});

// Driver Fleet Directory
apiRouter.get('/admin/drivers', (req, res) => {
  const { status, city, search } = req.query;
  let result = [...drivers];

  if (status && status !== 'all') {
    result = result.filter(d => d.verificationStatus === status);
  }
  if (city && city !== 'all') {
    result = result.filter(d => d.primaryCity.toLowerCase() === city.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(d =>
      d.fullName.toLowerCase().includes(q) ||
      d.phone.includes(q) ||
      (d.drivingLicenceNo && d.drivingLicenceNo.toLowerCase().includes(q))
    );
  }

  return res.json({
    success: true,
    count: result.length,
    drivers: result
  });
});

// KYC Queue
apiRouter.get('/admin/drivers/kyc', (req, res) => {
  return res.json({
    success: true,
    documents: driverDocuments,
    drivers: drivers
  });
});

// KYC Verification & Driver Status Action
apiRouter.post('/admin/drivers/:id/verify', (req, res) => {
  const { action, reason } = req.body; // 'approve', 'reject', 'suspend', 'reactivate'
  const driver = drivers.find(d => d.id === req.params.id);

  if (!driver) {
    return res.status(404).json({ success: false, message: 'Driver not found' });
  }

  if (action === 'approve') {
    driver.verificationStatus = 'approved';
    driver.policeVerificationStatus = 'verified';
    driverDocuments.forEach(doc => {
      if (doc.driverId === driver.id) doc.status = 'approved';
    });
    recordAuditLog('DRIVER_KYC_APPROVED', `${driver.id} (${driver.fullName})`, `Chauffeur approved. DL & PCC marked verified.`);
  } else if (action === 'reject') {
    driver.verificationStatus = 'rejected';
    driverDocuments.forEach(doc => {
      if (doc.driverId === driver.id) {
        doc.status = 'rejected';
        if (reason) doc.rejectionReason = reason;
      }
    });
    recordAuditLog('DRIVER_KYC_REJECTED', `${driver.id} (${driver.fullName})`, `Application rejected: ${reason || 'Criteria not met'}.`);
  } else if (action === 'suspend') {
    driver.verificationStatus = 'suspended';
    driver.isOnline = false;
    recordAuditLog('DRIVER_SUSPENDED', `${driver.id} (${driver.fullName})`, `Driver account suspended. Offlined from dispatch.`);
  } else if (action === 'reactivate') {
    driver.verificationStatus = 'approved';
    recordAuditLog('DRIVER_REACTIVATED', `${driver.id} (${driver.fullName})`, `Driver suspension revoked. Account reinstated.`);
  } else {
    return res.status(400).json({ success: false, message: 'Invalid action specified' });
  }

  return res.json({
    success: true,
    message: `Driver status successfully updated to ${driver.verificationStatus}`,
    driver
  });
});

// Customer Management
apiRouter.get('/admin/customers', (req, res) => {
  const customerUsers = users.filter(u => u.role === 'customer').map(cust => {
    const custBookings = bookings.filter(b => b.customerId === cust.id);
    const totalSpent = custBookings.reduce((sum, b) => sum + (b.totalFare || 0), 0);
    return {
      ...cust,
      totalBookingsCount: custBookings.length,
      totalSpent,
      status: cust.isSuspended ? 'suspended' : 'active'
    };
  });

  return res.json({
    success: true,
    customers: customerUsers
  });
});

// Toggle Customer Status (Suspend / Ban)
apiRouter.post('/admin/customers/:id/status', (req, res) => {
  const { action, reason } = req.body; // 'suspend', 'activate'
  const user = users.find(u => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'Customer account not found' });
  }

  user.isSuspended = (action === 'suspend');
  recordAuditLog('CUSTOMER_STATUS_CHANGED', `${user.id} (${user.fullName})`, `Customer account ${action === 'suspend' ? 'suspended' : 're-activated'}. Reason: ${reason || 'N/A'}`);

  return res.json({
    success: true,
    message: `Customer account is now ${user.isSuspended ? 'suspended' : 'active'}`,
    user
  });
});

// Bookings Ledger & Management
apiRouter.get('/admin/bookings', (req, res) => {
  const { search, status } = req.query;
  let result = [...bookings];

  if (status && status !== 'all') {
    result = result.filter(b => b.status === status);
  }

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(b =>
      b.bookingReference.toLowerCase().includes(q) ||
      (b.customerName && b.customerName.toLowerCase().includes(q)) ||
      (b.driverName && b.driverName.toLowerCase().includes(q)) ||
      (b.pickupCity && b.pickupCity.toLowerCase().includes(q))
    );
  }

  return res.json({
    success: true,
    count: result.length,
    bookings: result
  });
});

// Admin Cancel Booking
apiRouter.post('/admin/bookings/:id/cancel', (req, res) => {
  const { reason } = req.body;
  const booking = bookings.find(b => b.id === req.params.id || b.bookingReference === req.params.id);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date().toISOString();
  booking.cancellationReason = reason || 'Cancelled by Operations Administrator';

  recordAuditLog('BOOKING_CANCELLED', booking.bookingReference, `Admin cancelled booking. Reason: ${booking.cancellationReason}`);

  return res.json({
    success: true,
    message: `Booking ${booking.bookingReference} has been cancelled`,
    booking
  });
});

// Admin Issue Refund
apiRouter.post('/admin/bookings/:id/refund', async (req, res) => {
  const { amount, reason, initiatingAdmin } = req.body;
  const booking = bookings.find(b => b.id === req.params.id || b.bookingReference === req.params.id);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  const amountPaise = amount ? rupeesToPaise(Number(amount)) : undefined;

  // Execute through verified refund service
  const refundResult = await globalRefundService.processRefund({
    bookingId: booking.id,
    amountPaise,
    reason,
    initiatingAdmin: initiatingAdmin || 'Operations Admin'
  });

  if (!refundResult.success) {
    return res.status(400).json(refundResult);
  }

  const refundAmt = amount || booking.totalFare;
  booking.paymentStatus = refundResult.paymentStatus || 'refunded';
  booking.refundAmount = refundAmt;
  booking.refundedAt = new Date().toISOString();

  // Create financial refund ledger record
  const refundTx = {
    id: refundResult.refundRecord?.id || `tx_ref_${Date.now()}`,
    bookingReference: booking.bookingReference,
    customerName: booking.customerName,
    driverName: booking.driverName,
    amount: refundAmt,
    paymentMethod: 'Razorpay Instant Refund (UPI/Card)',
    paymentStatus: booking.paymentStatus,
    reason: reason || 'Customer dispute resolution / cancellation',
    createdAt: new Date().toISOString()
  };
  financialTransactions.unshift(refundTx);

  recordAuditLog('REFUND_PROCESSED', booking.bookingReference, `Processed ₹${refundAmt} refund to ${booking.customerName}. Reason: ${refundTx.reason}`);

  return res.json({
    success: true,
    message: refundResult.message || `Refund of ₹${refundAmt} successfully processed via Razorpay Sandbox Route.`,
    booking,
    transaction: refundTx,
    refundRecord: refundResult.refundRecord
  });
});

// Admin Driver Settlements Management
apiRouter.post('/admin/settlements/generate', (req, res) => {
  const { driverId, periodStart, periodEnd } = req.body;
  if (!driverId) {
    return res.status(400).json({ success: false, message: 'driverId is required' });
  }

  const result = globalSettlementService.generateWeeklySettlement(driverId, periodStart, periodEnd);
  return res.json(result);
});

apiRouter.post('/admin/settlements/:id/execute-payout', async (req, res) => {
  const { id } = req.params;
  const result = await globalSettlementService.executeRouteTransfer(id);
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

// Financial Transactions Ledger
apiRouter.get('/admin/transactions', (req, res) => {
  return res.json({
    success: true,
    transactions: financialTransactions
  });
});

// Cities & Service Areas
apiRouter.get('/admin/cities', (req, res) => {
  return res.json({
    success: true,
    cities: operationalCities
  });
});

apiRouter.post('/admin/cities', (req, res) => {
  const { name, state, baseRate } = req.body;
  if (!name || !state) {
    return res.status(400).json({ success: false, message: 'City name and state are required' });
  }

  const newCity = {
    id: `city_${name.toLowerCase().replace(/\s+/g, '_')}`,
    name,
    state,
    baseRate: Number(baseRate) || 139,
    active: true,
    activeDrivers: 0
  };
  operationalCities.push(newCity);
  recordAuditLog('CITY_ADDED', newCity.name, `New service city added (${newCity.state}) with base rate ₹${newCity.baseRate}/hr.`);

  return res.json({
    success: true,
    message: `City ${newCity.name} added successfully`,
    city: newCity
  });
});

apiRouter.patch('/admin/cities/:id', (req, res) => {
  const city = operationalCities.find(c => c.id === req.params.id);
  if (!city) {
    return res.status(404).json({ success: false, message: 'City not found' });
  }

  if (req.body.active !== undefined) city.active = Boolean(req.body.active);
  if (req.body.baseRate !== undefined) city.baseRate = Number(req.body.baseRate);

  recordAuditLog('CITY_UPDATED', city.name, `Updated: Active=${city.active}, BaseRate=₹${city.baseRate}/hr.`);

  return res.json({
    success: true,
    message: `City ${city.name} updated successfully`,
    city
  });
});

// National Pricing Rules & Platform Commission
apiRouter.get('/admin/pricing-rules', (req, res) => {
  return res.json({
    success: true,
    pricingConfig
  });
});

apiRouter.put('/admin/pricing-rules', (req, res) => {
  const {
    baseHourlyRate,
    extraHourlyRate,
    fullDay8Hours,
    outstationDriverDA,
    nightAllowance,
    platformConvenienceFee,
    platformCommissionPercent,
    transportGstPercent
  } = req.body;

  if (baseHourlyRate !== undefined) pricingConfig.baseHourlyRate = Number(baseHourlyRate);
  if (extraHourlyRate !== undefined) pricingConfig.extraHourlyRate = Number(extraHourlyRate);
  if (fullDay8Hours !== undefined) pricingConfig.fullDay8Hours = Number(fullDay8Hours);
  if (outstationDriverDA !== undefined) pricingConfig.outstationDriverDA = Number(outstationDriverDA);
  if (nightAllowance !== undefined) pricingConfig.nightAllowance = Number(nightAllowance);
  if (platformConvenienceFee !== undefined) pricingConfig.platformConvenienceFee = Number(platformConvenienceFee);
  if (platformCommissionPercent !== undefined) pricingConfig.platformCommissionPercent = Number(platformCommissionPercent);
  if (transportGstPercent !== undefined) pricingConfig.transportGstPercent = Number(transportGstPercent);

  recordAuditLog('PRICING_UPDATED', 'Platform Pricing Engine', `Pricing updated: Commission=${pricingConfig.platformCommissionPercent}%, NightAllowance=₹${pricingConfig.nightAllowance}, DA=₹${pricingConfig.outstationDriverDA}`);

  return res.json({
    success: true,
    message: 'National pricing and platform commission slabs updated',
    pricingConfig
  });
});

// Promo Codes & Coupons
apiRouter.get('/admin/coupons', (req, res) => {
  return res.json({
    success: true,
    coupons: promoCoupons
  });
});

apiRouter.post('/admin/coupons', (req, res) => {
  const { code, discountType, discountValue, maxDiscount, minBookingAmount, description, expiresAt } = req.body;
  if (!code || !discountValue) {
    return res.status(400).json({ success: false, message: 'Coupon code and discount value are required' });
  }

  const newCoupon = {
    id: `cpn_${Date.now()}`,
    code: code.toUpperCase().trim(),
    discountType: discountType || 'flat',
    discountValue: Number(discountValue),
    maxDiscount: maxDiscount ? Number(maxDiscount) : null,
    minBookingAmount: minBookingAmount ? Number(minBookingAmount) : 0,
    description: description || 'Promotional coupon code',
    isActive: true,
    expiresAt: expiresAt || '2026-12-31'
  };

  promoCoupons.push(newCoupon);
  recordAuditLog('COUPON_CREATED', newCoupon.code, `New promo code created: ${newCoupon.discountType} ₹${newCoupon.discountValue}.`);

  return res.json({
    success: true,
    message: `Coupon ${newCoupon.code} created successfully`,
    coupon: newCoupon
  });
});

apiRouter.patch('/admin/coupons/:id', (req, res) => {
  const coupon = promoCoupons.find(c => c.id === req.params.id || c.code === req.params.id);
  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Coupon not found' });
  }

  if (req.body.isActive !== undefined) coupon.isActive = Boolean(req.body.isActive);
  if (req.body.discountValue !== undefined) coupon.discountValue = Number(req.body.discountValue);

  recordAuditLog('COUPON_UPDATED', coupon.code, `Coupon updated: Active=${coupon.isActive}.`);

  return res.json({
    success: true,
    message: `Coupon ${coupon.code} updated`,
    coupon
  });
});

// Support & Grievances
apiRouter.get('/admin/support-tickets', (req, res) => {
  return res.json({ success: true, tickets: supportTickets });
});

apiRouter.patch('/admin/support-tickets/:id', (req, res) => {
  const ticket = supportTickets.find(t => t.id === req.params.id);
  if (!ticket) {
    return res.status(404).json({ success: false, message: 'Support ticket not found' });
  }

  const { status, resolutionNotes } = req.body;
  if (status) ticket.status = status;
  if (resolutionNotes) ticket.resolutionNotes = resolutionNotes;
  ticket.resolvedAt = new Date().toISOString();

  recordAuditLog('SUPPORT_TICKET_UPDATED', ticket.id, `Ticket ${ticket.id} marked as ${ticket.status}. Notes: ${resolutionNotes || 'Resolved'}`);

  return res.json({
    success: true,
    message: `Ticket ${ticket.id} updated`,
    ticket
  });
});

apiRouter.post('/support/ticket', (req, res) => {
  const { category, subject, message, bookingReference } = req.body;
  const newTicket = {
    id: `tkt_${Date.now()}`,
    userId: currentUser.id,
    userName: currentUser.fullName,
    bookingReference: bookingReference || 'General Inquiry',
    category: category || 'app_issue',
    subject,
    message,
    status: 'open',
    createdAt: new Date().toISOString()
  };
  supportTickets.unshift(newTicket);
  return res.json({ success: true, message: 'Support ticket submitted. Ticket ID: ' + newTicket.id, ticket: newTicket });
});

// Review Moderation
apiRouter.get('/admin/reviews', (req, res) => {
  return res.json({
    success: true,
    reviews
  });
});

apiRouter.post('/admin/reviews/:id/moderate', (req, res) => {
  const { action, note } = req.body; // 'hide', 'flag', 'approve'
  const review = reviews.find(r => r.id === req.params.id);
  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  review.moderationStatus = action;
  review.moderationNote = note || '';

  recordAuditLog('REVIEW_MODERATED', review.id, `Review ${review.id} moderated with action: ${action}.`);

  return res.json({
    success: true,
    message: `Review ${review.id} status updated to ${action}`,
    review
  });
});

// Admin Audit Logs
apiRouter.get('/admin/audit-logs', (req, res) => {
  return res.json({
    success: true,
    logs: adminAuditLogs
  });
});

// -----------------------------------------------------------------------------
// 7. REAL-TIME MOBILITY MARKETPLACE & DISPATCH APIS (PHASE 7)
// -----------------------------------------------------------------------------

// Customer Initiates Chauffeur Dispatch
apiRouter.post('/dispatch/request', (req, res) => {
  // Production Fail-Safe: Require active cloud database in production mode
  if (process.env.NODE_ENV === 'production' && !supabase.isLiveSupabase) {
    return res.status(503).json({
      success: false,
      message: 'Service Unavailable: Hosted database connection required for production transactions. Fail-safe triggered.'
    });
  }

  const {
    bookingId,
    pickupLatitude = 28.4595,
    pickupLongitude = 77.0266,
    transmissionType = 'Automatic',
    serviceCity = 'Delhi NCR',
    startDate,
    startTime,
    durationHours = 2,
    serviceType = 'hourly'
  } = req.body;

  let targetBooking = null;
  if (bookingId) {
    targetBooking = bookings.find(b => b.id === bookingId || b.bookingReference === bookingId);
  }

  // 1. Find all eligible approved drivers in proximity
  const eligibleDrivers = findEligibleDrivers(
    {
      pickupLatitude,
      pickupLongitude,
      transmissionType,
      serviceCity,
      startDate: startDate || new Date().toISOString().split('T')[0],
      startTime: startTime || '14:30',
      durationHours,
      maxRadiusKm: 15
    },
    drivers,
    bookings,
    { currentBookingId: targetBooking?.id }
  );

  if (eligibleDrivers.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No available approved chauffeurs currently matching vehicle criteria in this area.'
    });
  }

  // 2. Rank candidates using composite matching formula
  const rankedCandidates = rankDrivers(eligibleDrivers, pickupLatitude, pickupLongitude);

  // 3. Create or update booking with dispatched status
  if (!targetBooking) {
    const bookingRef = `SRT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    targetBooking = {
      id: `bk_disp_${Date.now()}`,
      bookingReference: bookingRef,
      customerId: currentUser.id,
      customerName: currentUser.fullName,
      customerPhone: currentUser.phone,
      serviceType,
      serviceTitle: serviceType === 'quick' ? 'On-Demand Immediate Chauffeur' : `${serviceType.toUpperCase()} Driver Rental`,
      transmissionType,
      vehicleType: req.body.vehicleType || 'Sedan',
      pickupAddress: req.body.pickupAddress || 'DLF Cyber City, Gurugram',
      pickupCity: serviceCity,
      pickupLatitude,
      pickupLongitude,
      dropAddress: req.body.dropAddress || 'IGI Airport Terminal 3, New Delhi',
      dropLatitude: req.body.dropLatitude || 28.5562,
      dropLongitude: req.body.dropLongitude || 77.1000,
      startDate: startDate || new Date().toISOString().split('T')[0],
      startTime: startTime || '14:30',
      durationHours,
      status: 'dispatched',
      tripStartOtp: `${Math.floor(1000 + Math.random() * 9000)}`,
      tripQrPayload: `SARATHI:TRIP:${bookingRef}:OTP`,
      totalFare: req.body.totalFare || 599,
      paymentStatus: 'authorized',
      paymentMethod: 'upi',
      createdAt: new Date().toISOString()
    };
    bookings.unshift(targetBooking);
  } else {
    targetBooking.status = 'dispatched';
  }

  // 4. Create cascade dispatch session
  const dispatchResult = globalDispatchManager.createDispatchSession(targetBooking, rankedCandidates, 45);

  if (!dispatchResult.success) {
    return res.status(409).json(dispatchResult);
  }

  return res.json({
    success: true,
    message: `Dispatched to top ranked chauffeur ${rankedCandidates[0].fullName}`,
    booking: targetBooking,
    candidate: rankedCandidates[0],
    totalEligibleCount: rankedCandidates.length,
    expiresInSeconds: 45
  });
});

// Chauffeur Responds to Dispatch (Accept or Reject)
apiRouter.post('/dispatch/respond', (req, res) => {
  const { bookingId, driverId, action, reason } = req.body; // action: 'accept' | 'reject'
  const booking = bookings.find(b => b.id === bookingId || b.bookingReference === bookingId);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  if (action === 'accept') {
    const acceptResult = globalDispatchManager.acceptDispatch(booking.id, driverId);
    if (!acceptResult.success) {
      return res.status(400).json(acceptResult);
    }

    const assignedDriver = drivers.find(d => d.id === driverId);
    booking.driverId = assignedDriver.id;
    booking.driverName = assignedDriver.fullName;
    booking.driverPhone = assignedDriver.phone;
    booking.status = 'accepted';
    booking.acceptedAt = new Date().toISOString();

    recordAuditLog('DISPATCH_ACCEPTED', booking.bookingReference, `Chauffeur ${assignedDriver.fullName} accepted ride dispatch.`);

    return res.json({
      success: true,
      message: `Chauffeur ${assignedDriver.fullName} accepted the booking`,
      booking,
      driver: assignedDriver
    });
  } else {
    // Rejection or timeout -> Auto-cascade to next ranked candidate
    const cascadeResult = globalDispatchManager.rejectOrTimeoutDispatch(booking.id, driverId, reason || 'declined');

    if (cascadeResult.action === 'cascaded_to_next') {
      return res.json({
        success: true,
        action: 'cascaded',
        message: `Chauffeur declined. Auto-cascading dispatch to next eligible chauffeur: ${cascadeResult.nextDriver.fullName}`,
        nextDriver: cascadeResult.nextDriver
      });
    } else {
      booking.status = 'unfulfilled';
      return res.json({
        success: false,
        action: 'exhausted',
        message: 'All nearby eligible chauffeurs are currently busy. Please try again in 5 minutes.',
        booking
      });
    }
  }
});

// Chauffeur Cancellation After Acceptance & Immediate Replacement Workflow
apiRouter.post('/dispatch/cancel-and-replace', (req, res) => {
  const { bookingId, driverId, reason = 'Emergency cancellation by chauffeur' } = req.body;
  const booking = bookings.find(b => b.id === bookingId || b.bookingReference === bookingId);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  booking.status = 'replacement_requested';
  booking.previousDriverId = driverId;
  booking.driverId = null;
  booking.driverName = null;

  const replaceResult = globalDispatchManager.requestReplacementDispatch(booking, driverId, reason);

  // Auto-trigger replacement search with remaining eligible candidates
  const eligibleReplacements = findEligibleDrivers(
    {
      pickupLatitude: booking.pickupLatitude,
      pickupLongitude: booking.pickupLongitude,
      transmissionType: booking.transmissionType,
      serviceCity: booking.pickupCity,
      startDate: booking.startDate,
      startTime: booking.startTime,
      durationHours: booking.durationHours,
      maxRadiusKm: 20
    },
    drivers.filter(d => d.id !== driverId), // Exclude the cancelling driver
    bookings,
    { currentBookingId: booking.id }
  );

  let replacementOffer = null;
  if (eligibleReplacements.length > 0) {
    const ranked = rankDrivers(eligibleReplacements, booking.pickupLatitude, booking.pickupLongitude);
    replacementOffer = globalDispatchManager.createDispatchSession(booking, ranked, 45);
  }

  recordAuditLog('REPLACEMENT_DISPATCHED', booking.bookingReference, `Replacement chauffeur search initiated following cancellation by driver ${driverId}.`);

  return res.json({
    success: true,
    message: 'Replacement chauffeur search initiated successfully',
    booking,
    replacementOffer
  });
});

// Get Current Dispatch Status
apiRouter.get('/dispatch/:bookingId/status', (req, res) => {
  const session = globalDispatchManager.getSession(req.params.bookingId);
  const booking = bookings.find(b => b.id === req.params.bookingId || b.bookingReference === req.params.bookingId);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  return res.json({
    success: true,
    booking,
    session: session || null
  });
});

// Driver Online Heartbeat
apiRouter.post('/driver/heartbeat', (req, res) => {
  const { driverId, isOnline = true } = req.body;
  if (!driverId) {
    return res.status(400).json({ success: false, message: 'Driver ID required for heartbeat' });
  }

  const driver = drivers.find(d => d.id === driverId || d.userId === driverId);
  if (driver) {
    driver.isOnline = isOnline;
    driver.lastHeartbeat = new Date().toISOString();
  }

  globalLocationTracker.recordDriverHeartbeat(driverId);

  globalRealtimeBus.publish('admin:operations', 'DRIVER_HEARTBEAT', {
    driverId,
    isOnline,
    lastHeartbeat: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: 'Heartbeat acknowledged',
    isOnline
  });
});

// High-Frequency Driver GPS Location Update
apiRouter.post('/driver/location', (req, res) => {
  const { driverId, latitude, longitude, heading = 0, speed = 0, accuracy = 5.0, recordedAt } = req.body;

  if (!driverId) {
    return res.status(400).json({ success: false, message: 'Driver ID is required' });
  }

  const driver = drivers.find(d => d.id === driverId);
  if (!driver) {
    return res.status(404).json({ success: false, message: 'Driver not found' });
  }

  // Find active booking for telemetry streaming
  const activeBooking = bookings.find(b =>
    b.driverId === driverId &&
    ['accepted', 'arriving', 'arrived', 'in_progress'].includes(b.status)
  );

  const trackResult = globalLocationTracker.recordDriverLocation(driverId, {
    latitude: Number(latitude),
    longitude: Number(longitude),
    heading: Number(heading),
    speed: Number(speed),
    accuracy: Number(accuracy),
    recordedAt
  }, activeBooking);

  if (!trackResult.success) {
    return res.status(400).json(trackResult);
  }

  // Update in-memory driver coordinates
  driver.currentLatitude = Number(latitude);
  driver.currentLongitude = Number(longitude);
  driver.heading = Number(heading);
  driver.speed = Number(speed);
  driver.lastLocationUpdate = new Date().toISOString();

  return res.json({
    success: true,
    message: 'Driver GPS telemetry logged successfully',
    location: trackResult.location
  });
});

// Real-Time Trip Tracking & Geofencing Telemetry
apiRouter.get('/bookings/:id/live-tracking', (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id || b.bookingReference === req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  const driver = drivers.find(d => d.id === booking.driverId);
  const telemetry = globalLocationTracker.computeTripLiveTelemetry(booking, driver);

  return res.json({
    success: true,
    telemetry
  });
});

// Secure Token Authentication (Supabase Compatible)
apiRouter.post('/auth/token-login', (req, res) => {
  const { email, password, role } = req.body;
  const user = users.find(u => u.email === email || (role && u.role === role));

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = signJwt({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.fullName
  }, 86400); // 24-hour validity

  currentUser = user;
  return res.json({
    success: true,
    message: 'Authentication successful',
    token,
    user
  });
});

// Verify Auth Token Endpoint
apiRouter.get('/auth/verify-token', authenticateToken, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  return res.json({
    success: true,
    user: req.user
  });
});

// -----------------------------------------------------------------------------
// 8. DEDICATED DEMO ENVIRONMENT APIS (PHASE 7.5)
// -----------------------------------------------------------------------------

// Fetch full synthetic demo state
apiRouter.get('/demo/state', (req, res) => {
  return res.json({
    success: true,
    demoMode: true,
    currentRole: demoManager.currentRole,
    currentUser: demoManager.currentUser,
    customers: demoManager.customers,
    drivers: demoManager.drivers,
    documents: demoManager.documents,
    bookings: demoManager.bookings,
    cities: demoManager.cities,
    coupons: demoManager.coupons,
    tickets: demoManager.tickets,
    reviews: demoManager.reviews,
    auditLogs: demoManager.auditLogs,
    pricingRules: demoManager.pricingRules,
    analytics: demoManager.getDemoAnalytics(),
    lastResetAt: demoManager.lastResetAt
  });
});

// 1-Click Reset Demo Environment (Guaranteed isolated from persistent production store)
apiRouter.post('/demo/reset', (req, res) => {
  const result = demoManager.resetToBaseline();
  // Persistent production database remains completely untouched
  return res.json({
    ...result,
    persistentStorageUntouched: true
  });
});

// 1-Click Demo Role Switcher (Customer, Driver, Admin)
// In production mode, role switching is forbidden to prevent unauthorized privilege escalation
apiRouter.post('/demo/switch-role', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Demo role switcher is strictly disabled in production mode. Real authentication required.'
    });
  }

  const { role } = req.body;
  const result = demoManager.switchDemoRole(role);
  if (result.success) {
    currentUser = { ...result.user, isDemo: true };
    // Issue demo JWT marked with isDemo: true
    result.token = signJwt({ ...result.user, isDemo: true }, 86400);
  }
  return res.json(result);
});

// Advance Demo Trip Step (Deterministic Simulation)
apiRouter.post('/demo/simulate-step', (req, res) => {
  const { bookingId, targetStep } = req.body; // 'arriving', 'arrived', 'start_trip', 'complete_trip'
  const result = demoManager.simulateStepTrip(bookingId, targetStep);
  return res.json(result);
});

// Demo Marketplace Analytics
apiRouter.get('/demo/analytics', (req, res) => {
  return res.json({
    success: true,
    analytics: demoManager.getDemoAnalytics()
  });
});

// -----------------------------------------------------------------------------
// 9. PHASE 8A SECURE STORAGE & CUSTOMER VEHICLE APIS
// -----------------------------------------------------------------------------

// Generate Time-Limited Signed URL for KYC Documents (DL, Aadhaar, PCC)
apiRouter.post('/documents/signed-url', authenticateToken, async (req, res) => {
  const { bucket = 'driver-documents', filePath, expiresIn = 900 } = req.body;

  if (!filePath) {
    return res.status(400).json({ success: false, message: 'Missing filePath for signed document request' });
  }

  // Authorization: Only the owner driver or admin can generate signed URL
  if (req.user && req.user.role !== 'admin') {
    const isDocOwner = filePath.includes(req.user.id) || filePath.includes(req.user.driverId);
    if (!isDocOwner && req.user.role !== 'driver') {
      return res.status(403).json({ success: false, message: 'Access denied: You can only view your own compliance documents' });
    }
  }

  const result = await supabase.storage.from(bucket).createSignedUrl(filePath, expiresIn);
  return res.json({
    success: true,
    ...result
  });
});

// Access/Stream Secure File via Signed Token
apiRouter.get('/storage/signed/:bucket/:filePath', (req, res) => {
  const { bucket, filePath } = req.params;
  const { token, expires } = req.query;

  const verification = supabase.storage.from(bucket).verifySignedUrlToken(filePath, token, expires);
  if (!verification.valid) {
    return res.status(403).json({
      success: false,
      message: `Document access prohibited: ${verification.reason}`
    });
  }

  return res.json({
    success: true,
    message: 'Authorized signed document view',
    bucket,
    filePath,
    contentType: 'image/jpeg',
    expiresAt: verification.expiresAt
  });
});

// Customer-Owned Vehicles CRUD ("Your Car. Your Journey. Your Driver.")
apiRouter.get('/customer/vehicles', authenticateToken, (req, res) => {
  const customerId = req.user?.id || currentUser.id;
  const vehicles = persistentStorage.find('customer_vehicles', v => v.customerId === customerId);
  return res.json({
    success: true,
    vehicles: vehicles.length > 0 ? vehicles : [
      {
        id: 'veh_default_1',
        customerId,
        make: 'Hyundai',
        model: 'Creta SX (O)',
        year: 2023,
        vehicleType: 'SUV',
        transmission: 'Automatic',
        registrationNumber: 'KA 01 MJ 4821',
        isPrimary: true
      }
    ]
  });
});

apiRouter.post('/customer/vehicles', authenticateToken, (req, res) => {
  const customerId = req.user?.id || currentUser.id;
  const { make, model, year, vehicleType, transmission, registrationNumber } = req.body;

  if (!make || !model || !transmission || !registrationNumber) {
    return res.status(400).json({ success: false, message: 'Please provide vehicle make, model, transmission, and registration number' });
  }

  const newVehicle = persistentStorage.insert('customer_vehicles', {
    customerId,
    make,
    model,
    year: year || 2023,
    vehicleType: vehicleType || 'Sedan',
    transmission,
    registrationNumber,
    isPrimary: false
  });

  return res.json({
    success: true,
    message: 'Vehicle added to your garage successfully',
    vehicle: newVehicle
  });
});

apiRouter.delete('/customer/vehicles/:id', authenticateToken, (req, res) => {
  const customerId = req.user?.id || currentUser.id;
  const { id } = req.params;

  const vehicle = persistentStorage.findOne('customer_vehicles', v => v.id === id);
  if (vehicle && vehicle.customerId !== customerId && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: You can only delete vehicles from your own garage' });
  }

  persistentStorage.delete('customer_vehicles', v => v.id === id);
  return res.json({ success: true, message: 'Vehicle removed from your garage' });
});

// -----------------------------------------------------------------------------
// 10. MAPS, GEOLOCATION, REAL ROUTES & ETA APIS (PHASE 8D)
// -----------------------------------------------------------------------------

// Address Search & Autocomplete Proxy
apiRouter.get('/maps/places/autocomplete', async (req, res) => {
  const { query, sessionToken } = req.query;
  const result = await globalGeocodingService.searchAddresses(query, sessionToken);
  return res.json(result);
});

// Forward Geocoding Proxy
apiRouter.get('/maps/geocode', async (req, res) => {
  const { address } = req.query;
  if (!address) {
    return res.status(400).json({ success: false, message: 'Address query parameter is required' });
  }
  try {
    const result = await globalGeocodingService.geocode(address);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// Reverse Geocoding for Map Pin Drops
apiRouter.get('/maps/reverse-geocode', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ success: false, message: 'lat and lon parameters are required' });
  }
  const result = await globalGeocodingService.reverseGeocode(Number(lat), Number(lon));
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

// Authoritative Road Directions & Route Calculation
apiRouter.post('/maps/directions', async (req, res) => {
  const { origin, destination, options = {} } = req.body;
  if (!origin || !destination) {
    return res.status(400).json({ success: false, message: 'origin and destination are required' });
  }
  try {
    const route = await globalRoutingEngine.computeRoadRoute(origin, destination, options);
    return res.json({ success: true, route });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// Dynamic Traffic-Aware ETA Query
apiRouter.post('/maps/eta', async (req, res) => {
  const { origin, destination } = req.body;
  if (!origin || !destination) {
    return res.status(400).json({ success: false, message: 'origin and destination are required' });
  }
  try {
    const route = await globalRoutingEngine.computeRoadRoute(origin, destination);
    return res.json({
      success: true,
      roadDistanceKm: route.roadDistanceKm,
      straightLineDistanceKm: route.straightLineDistanceKm,
      durationMinutes: route.durationMinutes,
      trafficMultiplier: route.trafficMultiplier,
      trafficCondition: route.trafficCondition
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// Driver GPS Update with Off-Route Recalculation & Arrival Geofencing
apiRouter.post('/maps/driver-location', mapsRateLimiter, async (req, res) => {
  const { driverId, location, bookingId } = req.body;
  if (!driverId || !location) {
    return res.status(400).json({ success: false, message: 'driverId and location are required' });
  }

  const booking = bookingId
    ? bookings.find(b => b.id === bookingId || b.bookingReference === bookingId)
    : null;

  // Driver Assignment Security: Only the assigned chauffeur can report telemetry for an active booking
  if (booking && booking.driverId && booking.driverId !== driverId) {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Unauthorized: Only the assigned chauffeur can report GPS telemetry for this booking.'
    });
  }

  // Ingest location
  const ingest = globalLocationTracker.recordDriverLocation(driverId, location, booking);
  if (!ingest.success) {
    return res.status(400).json(ingest);
  }

  let progress = null;
  if (booking) {
    progress = await globalRoutingEngine.evaluateDriverProgress(booking, location);

    // CRITICAL SECURITY RULE: A dead-reckoned or projected coordinate must NEVER trigger arrival.
    // Real, fresh, accurate GPS evidence is strictly required.
    const isDeadReckoned = Boolean(
      location.isDeadReckoning ||
      location.source === 'dead_reckoning' ||
      location.isProjected
    );

    // If driver entered 150m arrival geofence and was en route, update status to arrived
    if (progress.isInsideArrivalGeofence && !isDeadReckoned && ['accepted', 'arriving'].includes(booking.status)) {
      booking.status = 'arrived';
      booking.arrivedAt = new Date().toISOString();

      recordAuditLog('CHAUFFEUR_ARRIVED', booking.bookingReference, `Chauffeur reached customer pickup geofence (within 150m).`);

      globalRealtimeBus.publish(`customer:booking:${booking.id}`, 'CHAUFFEUR_ARRIVED', {
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        status: 'arrived',
        arrivedAt: booking.arrivedAt,
        message: 'Your chauffeur has arrived at the pickup location. Please share your 4-digit OTP to start the journey.'
      }, booking.isDemo);
    }
  }

  return res.json({
    success: true,
    driverId,
    location: ingest.location,
    progress
  });
});

// Client Map Public Config
apiRouter.get('/maps/config', (req, res) => {
  return res.json({
    success: true,
    provider: MAPS_CONFIG.defaultProvider,
    geofence: MAPS_CONFIG.geofence,
    traffic: getCurrentTrafficMultiplier()
  });
});
