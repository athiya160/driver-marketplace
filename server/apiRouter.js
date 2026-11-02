import { Router } from 'express';
import { calculateFare, SERVICE_CATEGORIES, ACTIVE_COUPONS } from './pricingEngine.js';
import { checkDriverBookingConflict } from './conflictEngine.js';
import {
  USERS,
  DRIVERS,
  DRIVER_DOCUMENTS,
  INITIAL_BOOKINGS,
  REVIEWS,
  SUPPORT_TICKETS
} from './mockDb.js';

export const apiRouter = Router();

// Mutable state stores (backed by mockDb)
let users = [...USERS];
let drivers = [...DRIVERS];
let driverDocuments = [...DRIVER_DOCUMENTS];
let bookings = [...INITIAL_BOOKINGS];
let reviews = [...REVIEWS];
let supportTickets = [...SUPPORT_TICKETS];
let currentUser = users[0]; // Initialized with demo customer profile

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

apiRouter.post('/auth/login', (req, res) => {
  const { phoneOrEmail, otp, password } = req.body;
  const user = users.find(u => u.phone === phoneOrEmail || u.email === phoneOrEmail);
  if (!user) {
    return res.status(404).json({ success: false, message: 'No account found with this phone or email' });
  }
  // OTP simulation: any 4-digit or 6-digit OTP is valid for rapid testing
  currentUser = user;
  return res.json({ success: true, message: 'Login successful', user });
});

apiRouter.post('/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  return res.json({
    success: true,
    message: `OTP sent successfully to ${phone}. (For sandbox testing, use OTP: 1234)`,
    sandboxOtp: '1234'
  });
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
  const booking = bookings.find(b => b.id === req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }
  return res.json({ success: true, booking });
});

apiRouter.post('/bookings/create', (req, res) => {
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
  } = req.body;

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
  const booking = bookings.find(b => b.id === req.params.id);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  const validStatuses = ['pending', 'accepted', 'driver_en_route', 'arrived', 'in_progress', 'completed', 'cancelled', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status transition' });
  }

  booking.status = status;
  if (!booking.statusHistory) booking.statusHistory = [];
  booking.statusHistory.push({
    status,
    time: new Date().toISOString(),
    note: cancellationReason || `Status updated to ${status}`
  });

  if (status === 'in_progress') {
    booking.startedAt = new Date().toISOString();
  } else if (status === 'completed') {
    booking.completedAt = new Date().toISOString();
    booking.paymentStatus = 'captured';
  } else if (status === 'cancelled') {
    booking.cancelledAt = new Date().toISOString();
    booking.cancellationReason = cancellationReason || 'Cancelled by user';
  }

  return res.json({ success: true, message: `Booking status updated to ${status}`, booking });
});

// Trip Start OTP or QR code verification
apiRouter.post('/bookings/:id/verify-trip-start', (req, res) => {
  const { otp, qrPayload } = req.body;
  const booking = bookings.find(b => b.id === req.params.id);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  const isOtpValid = otp && (otp === booking.tripStartOtp || otp === '1234');
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

  return res.json({
    success: true,
    message: 'Trip verified and started successfully!',
    booking
  });
});

// Rating & Review Submission
apiRouter.post('/bookings/:id/review', (req, res) => {
  const { rating, comment, punctualityRating, drivingSkillRating, behaviorRating } = req.body;
  const booking = bookings.find(b => b.id === req.params.id);

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

// -----------------------------------------------------------------------------
// 4. RAZORPAY / INDIAN PAYMENTS API
// -----------------------------------------------------------------------------

apiRouter.post('/payments/razorpay/order', (req, res) => {
  const { amount, bookingId, currency = 'INR' } = req.body;
  const orderId = `order_sarathi_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

  return res.json({
    success: true,
    orderId,
    amount,
    currency,
    keyId: 'rzp_test_SarathiSandboxKey123',
    merchantName: 'Sarathi Driver Rentals India',
    bookingId
  });
});

apiRouter.post('/payments/razorpay/verify', (req, res) => {
  const { razorpayPaymentId, razorpayOrderId, bookingId } = req.body;
  const booking = bookings.find(b => b.id === bookingId);
  if (booking) {
    booking.paymentStatus = 'captured';
  }
  return res.json({
    success: true,
    message: 'Payment verified successfully via Razorpay UPI / Netbanking',
    paymentId: razorpayPaymentId || `pay_rzp_${Date.now()}`
  });
});

// -----------------------------------------------------------------------------
// 5. DRIVER DASHBOARD APIS
// -----------------------------------------------------------------------------

apiRouter.get('/driver/dashboard', (req, res) => {
  // Find driver corresponding to current logged in driver or default Rajesh
  const driver = drivers.find(d => d.userId === currentUser.id) || drivers[0];
  const driverBookings = bookings.filter(b => b.driverId === driver.id);
  const activeTrip = driverBookings.find(b => ['in_progress', 'driver_en_route', 'arrived'].includes(b.status));
  const pendingRequests = driverBookings.filter(b => b.status === 'accepted' || b.status === 'pending');
  const completedTrips = driverBookings.filter(b => b.status === 'completed');

  // Compute total earnings: 85% of totalFare + 100% of outstation allowance
  const totalEarnings = completedTrips.reduce((acc, curr) => acc + Math.round(curr.totalFare * 0.85), 0) + 12850; // Add historical base

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
    message: driver.isOnline ? 'You are now ONLINE and visible to customers across your city' : 'You are now OFFLINE'
  });
});

apiRouter.post('/driver/upload-document', (req, res) => {
  const { docType, docNumber, fileUrl } = req.body;
  const driver = drivers.find(d => d.userId === currentUser.id) || drivers[0];

  const newDoc = {
    id: `doc_${Date.now()}`,
    driverId: driver.id,
    driverName: driver.fullName,
    docType: docType || 'Driving Licence (Commercial)',
    docNumber: docNumber || 'DL-IN-2026-9901',
    fileUrl: fileUrl || 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=400&q=80',
    status: 'pending',
    uploadedAt: new Date().toISOString()
  };

  driverDocuments.push(newDoc);
  return res.json({
    success: true,
    message: 'Document submitted for Admin KYC Verification.',
    document: newDoc
  });
});

// -----------------------------------------------------------------------------
// 6. ADMIN DASHBOARD APIS
// -----------------------------------------------------------------------------

apiRouter.get('/admin/stats', (req, res) => {
  const totalBookingsCount = bookings.length;
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalFare || 0), 0) + 842000;
  const platformRevenue = Math.round(totalRevenue * 0.15) + (totalBookingsCount * 49);
  const totalDriversCount = drivers.length;
  const verifiedDriversCount = drivers.filter(d => d.verificationStatus === 'approved').length;
  const pendingKycCount = driverDocuments.filter(d => d.status === 'pending').length;

  return res.json({
    success: true,
    metrics: {
      totalBookings: totalBookingsCount + 3120,
      totalGMV: totalRevenue,
      platformRevenue,
      totalCustomers: users.filter(u => u.role === 'customer').length + 8400,
      totalDrivers: totalDriversCount,
      verifiedDrivers: verifiedDriversCount,
      pendingKyc: pendingKycCount,
      activeTripsNow: bookings.filter(b => b.status === 'in_progress').length
    }
  });
});

apiRouter.get('/admin/drivers/kyc', (req, res) => {
  return res.json({
    success: true,
    documents: driverDocuments,
    drivers: drivers
  });
});

apiRouter.post('/admin/drivers/:id/verify', (req, res) => {
  const { action, reason } = req.body; // 'approve', 'reject', 'suspend'
  const driver = drivers.find(d => d.id === req.params.id);

  if (!driver) {
    return res.status(404).json({ success: false, message: 'Driver not found' });
  }

  if (action === 'approve') {
    driver.verificationStatus = 'approved';
    driver.policeVerificationStatus = 'verified';
  } else if (action === 'reject') {
    driver.verificationStatus = 'rejected';
  } else if (action === 'suspend') {
    driver.verificationStatus = 'suspended';
    driver.isOnline = false;
  }

  // Update documents of this driver
  driverDocuments.forEach(doc => {
    if (doc.driverId === driver.id) {
      doc.status = action === 'approve' ? 'approved' : 'rejected';
      if (reason) doc.rejectionReason = reason;
    }
  });

  return res.json({
    success: true,
    message: `Driver status successfully updated to ${driver.verificationStatus}`,
    driver
  });
});

apiRouter.get('/admin/support-tickets', (req, res) => {
  return res.json({ success: true, tickets: supportTickets });
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
