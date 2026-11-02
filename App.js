import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
  Dimensions
} from 'react-native';

const { width } = Dimensions.get('window');

/**
 * SALMAN DRIVER - PAN-INDIA DRIVER RENTAL MOBILE APPLICATION
 * React Native & Expo Mobile Client
 * Owner: Salman | Tagline: Find. Book. Travel Better.
 * Theme: Light Slate (#F8FAFC), Deep Navy (#0F1E36), Warm Orange (#F97316)
 * Objective: Hire verified personal drivers on demand for your own vehicle across India.
 */

// Production Service Categories Across India
const SERVICE_CATEGORIES = [
  { id: 'hourly', name: 'Hourly Driver', price: '₹299', unit: '2 hrs min', desc: 'Shopping & city errands' },
  { id: 'full_day', name: 'Full Day Driver', price: '₹1,199', unit: '8 hrs', desc: 'Multiple city stops' },
  { id: 'outstation', name: 'Outstation Driver', price: '₹1,599', unit: 'per day', desc: 'Highway & Intercity travel' },
  { id: 'one_way', name: 'One-Way Drop', price: '₹1,299', unit: 'per trip', desc: 'Relocate car to other city' },
  { id: 'round_trip', name: 'Round Trip 24h', price: '₹2,899', unit: '24 hours', desc: 'Weekend getaway with driver' },
  { id: 'monthly', name: 'Monthly Driver', price: '₹21,999', unit: 'per month', desc: 'Dedicated executive driver' },
  { id: 'replacement', name: 'Leave Cover Driver', price: '₹1,299', unit: 'per day', desc: 'Temporary personal driver' },
  { id: 'airport', name: 'Airport Transfer', price: '₹699', unit: 'flight-safe', desc: 'IGI T3, BOM, BLR drop' },
  { id: 'emergency', name: '30-Min Emergency', price: '₹499', unit: 'express', desc: 'Rapid chauffeur arrival' }
];

// Verified Production-Realistic Indian Drivers
const VERIFIED_DRIVERS = [
  {
    id: 'drv_delhi_1',
    fullName: 'Rajesh Kumar Sharma',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    primaryCity: 'Delhi NCR',
    experienceYears: 9,
    rating: 4.9,
    totalReviews: 248,
    totalTrips: 1420,
    hourlyRate: 159,
    dailyRate: 1299,
    outstationRate: 1699,
    transmissionSkills: ['Manual', 'Automatic'],
    vehicleTypes: ['Hatchback', 'Sedan', 'SUV', 'Luxury'],
    languages: ['Hindi', 'English', 'Punjabi'],
    bio: 'Professional chauffeur with 9+ years experience. Expert in manual and high-end automatic German cars. Punctual, non-smoker.',
    drivingLicenceNo: 'DL-0420150089211',
    isOnline: true
  },
  {
    id: 'drv_delhi_2',
    fullName: 'Harpreet Singh',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    primaryCity: 'Delhi NCR',
    experienceYears: 12,
    rating: 4.95,
    totalReviews: 412,
    totalTrips: 2150,
    hourlyRate: 179,
    dailyRate: 1499,
    outstationRate: 1799,
    transmissionSkills: ['Manual', 'Automatic'],
    vehicleTypes: ['Sedan', 'SUV', 'Luxury'],
    languages: ['Punjabi', 'Hindi', 'English'],
    bio: 'Veteran highway specialist. Master of overnight trips to Manali, Shimla, Jaipur, Agra, and Uttarakhand.',
    drivingLicenceNo: 'DL-1120120034120',
    isOnline: true
  },
  {
    id: 'drv_mumbai_1',
    fullName: 'Suresh Patel',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    primaryCity: 'Mumbai',
    experienceYears: 8,
    rating: 4.88,
    totalReviews: 194,
    totalTrips: 980,
    hourlyRate: 169,
    dailyRate: 1399,
    outstationRate: 1749,
    transmissionSkills: ['Manual', 'Automatic'],
    vehicleTypes: ['Hatchback', 'Sedan', 'SUV'],
    languages: ['Marathi', 'Hindi', 'Gujarati'],
    bio: 'Expert Mumbai city navigator. Daily Western Express, Sealink, BKC, and Navi Mumbai routes specialist.',
    drivingLicenceNo: 'MH-0120160078123',
    isOnline: true
  },
  {
    id: 'drv_bangalore_1',
    fullName: 'Anand Swaminathan',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    primaryCity: 'Bengaluru',
    experienceYears: 7,
    rating: 4.85,
    totalReviews: 165,
    totalTrips: 840,
    hourlyRate: 165,
    dailyRate: 1350,
    outstationRate: 1699,
    transmissionSkills: ['Manual', 'Automatic'],
    vehicleTypes: ['Hatchback', 'Sedan', 'SUV'],
    languages: ['Kannada', 'Tamil', 'English', 'Hindi'],
    bio: 'Patient and smooth driving through Bengaluru traffic. Expert with EV vehicles and automatic luxury sedans.',
    drivingLicenceNo: 'KA-0520170099412',
    isOnline: true
  }
];

export default function App() {
  // Navigation State: 'home', 'drivers', 'booking', 'live_trip', 'history', 'profile'
  const [currentScreen, setCurrentScreen] = useState('home');

  // Customer Session State (Demo default or Registered)
  const [currentUser, setCurrentUser] = useState({
    id: 'user_cust_demo_01',
    fullName: 'Demo Customer (Rohan Verma)',
    phone: '+91 98765 43210',
    email: 'rohan.demo@example.com'
  });

  // Selected Booking Form
  const [selectedCity, setSelectedCity] = useState('Delhi NCR');
  const [pickupLocation, setPickupLocation] = useState('Tower 4, DLF The Crest, Gurugram');
  const [destination, setDestination] = useState('Terminal 3, IGI Airport, New Delhi');
  const [selectedCategory, setSelectedCategory] = useState('hourly');
  const [transmission, setTransmission] = useState('Automatic');
  const [vehicleType, setVehicleType] = useState('Sedan');
  const [bookingDate, setBookingDate] = useState('2026-11-03');
  const [bookingTime, setBookingTime] = useState('14:30');
  const [durationHours, setDurationHours] = useState(4);
  const [couponCode, setCouponCode] = useState('FIRST50');

  // Driver Search & Selection
  const [selectedDriver, setSelectedDriver] = useState(VERIFIED_DRIVERS[0]);
  const [driverModalVisible, setDriverModalVisible] = useState(false);
  const [inspectedDriver, setInspectedDriver] = useState(null);

  // Active Booking & Booking History State
  const [activeBooking, setActiveBooking] = useState(null);
  const [bookingHistory, setBookingHistory] = useState([
    {
      id: 'SRT-2026-7210',
      service: 'Airport Transfer Flight-Safe',
      driverName: 'Rajesh Kumar Sharma',
      date: '25 Oct 2026',
      totalFare: 1048,
      status: 'completed',
      car: 'Honda City Automatic'
    }
  ]);

  // Review Modal State
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Fare Calculation (Pure source of truth matching backend pricingEngine)
  const calculateFarePreview = () => {
    let base = 299;
    let extraHourRate = 120;
    if (selectedCategory === 'full_day') { base = 1199; extraHourRate = 150; }
    else if (selectedCategory === 'outstation') { base = 1599; extraHourRate = 180; }
    else if (selectedCategory === 'airport') { base = 699; extraHourRate = 120; }

    const extraHours = Math.max(0, durationHours - 2);
    const extraHoursCharge = extraHours * extraHourRate;
    const nightAllowance = (bookingTime >= '22:00' || bookingTime <= '06:00') ? 250 : 0;
    const outstationDA = selectedCategory === 'outstation' ? 350 : 0;
    const platformFee = 49;
    const discount = couponCode === 'FIRST50' ? 50 : 0;

    const subtotal = Math.max(0, base + extraHoursCharge + nightAllowance + outstationDA - discount);
    const gst = Math.round(subtotal * 0.05);
    const total = subtotal + platformFee + gst;

    return {
      base,
      extraHoursCharge,
      nightAllowance,
      outstationDA,
      platformFee,
      gst,
      discount,
      total
    };
  };

  const fare = calculateFarePreview();

  // Handle Booking Submission
  const handleConfirmBooking = () => {
    const bookingRef = `SRT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const newBooking = {
      id: bookingRef,
      service: SERVICE_CATEGORIES.find(c => c.id === selectedCategory)?.name || 'Personal Driver',
      driverName: selectedDriver.fullName,
      driverPhone: '+91 98111 22334',
      driverPhoto: selectedDriver.photoUrl,
      date: bookingDate,
      time: bookingTime,
      pickup: pickupLocation,
      destination: destination,
      car: `${vehicleType} (${transmission})`,
      totalFare: fare.total,
      tripOtp: otp,
      status: 'accepted', // accepted -> driver_en_route -> in_progress -> completed
      createdAt: new Date().toLocaleTimeString()
    };

    setActiveBooking(newBooking);
    setBookingHistory(prev => [newBooking, ...prev]);
    setCurrentScreen('live_trip');

    Alert.alert(
      'Booking Confirmed!',
      `Driver ${selectedDriver.fullName} assigned for ${newBooking.car}.\nTrip Start OTP: ${otp}`
    );
  };

  // Simulate Step Progress for Active Booking
  const handleTripAction = () => {
    if (!activeBooking) return;

    if (activeBooking.status === 'accepted') {
      setActiveBooking(prev => ({ ...prev, status: 'driver_en_route' }));
      Alert.alert('Chauffeur En Route', `${activeBooking.driverName} is driving to your pickup location.`);
    } else if (activeBooking.status === 'driver_en_route') {
      setActiveBooking(prev => ({ ...prev, status: 'arrived' }));
      Alert.alert('Chauffeur Arrived', `${activeBooking.driverName} has arrived at your vehicle gate.`);
    } else if (activeBooking.status === 'arrived') {
      setActiveBooking(prev => ({ ...prev, status: 'in_progress' }));
      Alert.alert('Trip Started', `OTP verified. Meter is running for ${activeBooking.car}.`);
    } else if (activeBooking.status === 'in_progress') {
      setActiveBooking(prev => ({ ...prev, status: 'completed' }));
      setReviewModalVisible(true);
    }
  };

  // Submit Customer Review
  const handleSubmitReview = () => {
    setReviewModalVisible(false);
    Alert.alert('Feedback Received', 'Thank you! Your 5-star rating helps maintain chauffeur quality across India.');
    setCurrentScreen('home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Navbar */}
      <View style={styles.navBar}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>Salman Driver</Text>
          <Text style={styles.brandTagline}>Find. Book. Travel Better.</Text>
        </View>

        <TouchableOpacity
          style={styles.cityPill}
          onPress={() => setSelectedCity(selectedCity === 'Delhi NCR' ? 'Mumbai' : selectedCity === 'Mumbai' ? 'Bengaluru' : 'Delhi NCR')}
        >
          <Text style={styles.cityPillText}>📍 {selectedCity} ▼</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView contentContainerStyle={styles.scrollArea}>

        {/* ================================================================= */}
        {/* SCREEN 1: CUSTOMER HOME SCREEN                                    */}
        {/* ================================================================= */}
        {currentScreen === 'home' && (
          <View>
            {/* Header Badge */}
            <View style={styles.verifiedHeader}>
              <Text style={styles.verifiedBadgeText}>🛡️ 100% Police & DL Verified Drivers</Text>
              <Text style={styles.heroSub}>Rent a Professional Chauffeur for Your Own Car</Text>
            </View>

            {/* Location & Trip Request Card */}
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Ride Details</Text>

              {/* Pickup Input */}
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Pickup</Text>
                <TextInput
                  style={styles.textInput}
                  value={pickupLocation}
                  onChangeText={setPickupLocation}
                  placeholder="Enter pickup society or landmark"
                />
              </View>

              {/* Destination Input */}
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Drop-off</Text>
                <TextInput
                  style={styles.textInput}
                  value={destination}
                  onChangeText={setDestination}
                  placeholder="Enter destination (or City stops)"
                />
              </View>

              {/* Vehicle Specifications for Customer's Own Car */}
              <Text style={styles.subHeader}>Your Car Specifications</Text>
              <View style={styles.pillRow}>
                {['Automatic', 'Manual'].map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.pill, transmission === t && styles.pillActive]}
                    onPress={() => setTransmission(t)}
                  >
                    <Text style={[styles.pillText, transmission === t && styles.pillTextActive]}>
                      ⚙️ {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.pillRow}>
                {['Hatchback', 'Sedan', 'SUV', 'Luxury'].map(v => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.pill, vehicleType === v && styles.pillActive]}
                    onPress={() => setVehicleType(v)}
                  >
                    <Text style={[styles.pillText, vehicleType === v && styles.pillTextActive]}>
                      🚗 {v}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action Button: Search Drivers */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setCurrentScreen('drivers')}
              >
                <Text style={styles.primaryButtonText}>🔍 Find Available Drivers in {selectedCity}</Text>
              </TouchableOpacity>
            </View>

            {/* 9 Service Categories Grid */}
            <Text style={styles.sectionHeader}>Service Categories</Text>
            <View style={styles.categoryGrid}>
              {SERVICE_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catCard, selectedCategory === cat.id && styles.catCardActive]}
                  onPress={() => {
                    setSelectedCategory(cat.id);
                    setCurrentScreen('drivers');
                  }}
                >
                  <Text style={[styles.catTitle, selectedCategory === cat.id && styles.catTitleActive]}>
                    {cat.name}
                  </Text>
                  <Text style={styles.catPrice}>{cat.price}</Text>
                  <Text style={styles.catDesc}>{cat.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Available Drivers Preview */}
            <Text style={styles.sectionHeader}>Top Rated Drivers Ready</Text>
            {VERIFIED_DRIVERS.slice(0, 2).map(drv => (
              <View key={drv.id} style={styles.driverCard}>
                <Image source={{ uri: drv.photoUrl }} style={styles.driverThumb} />
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>{drv.fullName}</Text>
                  <Text style={styles.driverMeta}>
                    {drv.experienceYears} yrs exp • {drv.transmissionSkills.join('/')} • ★ {drv.rating}
                  </Text>
                  <Text style={styles.driverRate}>₹{drv.hourlyRate}/hr • ₹{drv.dailyRate}/day</Text>
                </View>
                <TouchableOpacity
                  style={styles.bookMiniButton}
                  onPress={() => {
                    setSelectedDriver(drv);
                    setCurrentScreen('booking');
                  }}
                >
                  <Text style={styles.bookMiniText}>Book</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ================================================================= */}
        {/* SCREEN 2: DRIVER SEARCH & LIST SCREEN                             */}
        {/* ================================================================= */}
        {currentScreen === 'drivers' && (
          <View>
            <View style={styles.screenHeaderRow}>
              <TouchableOpacity onPress={() => setCurrentScreen('home')}>
                <Text style={styles.backButton}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.screenTitle}>Verified Chauffeurs ({VERIFIED_DRIVERS.length})</Text>
            </View>

            <Text style={styles.filterNotice}>
              Filtering for {selectedCity} • {transmission} • {vehicleType}
            </Text>

            {VERIFIED_DRIVERS.map(drv => (
              <View key={drv.id} style={styles.fullDriverCard}>
                <View style={styles.fullDriverTop}>
                  <Image source={{ uri: drv.photoUrl }} style={styles.driverLargeThumb} />
                  <View style={styles.fullDriverDetails}>
                    <Text style={styles.driverName}>{drv.fullName}</Text>
                    <Text style={styles.driverSubText}>DL: {drv.drivingLicenceNo}</Text>
                    <Text style={styles.driverRatingText}>★ {drv.rating} ({drv.totalReviews} reviews)</Text>
                    <Text style={styles.badgePolice}>✓ 100% Police Verified</Text>
                  </View>
                </View>

                <Text style={styles.driverBio}>"{drv.bio}"</Text>

                <View style={styles.skillTagsRow}>
                  {drv.transmissionSkills.map(t => (
                    <Text key={t} style={styles.skillTag}>⚙️ {t}</Text>
                  ))}
                  {drv.languages.map(l => (
                    <Text key={l} style={styles.skillTag}>🗣️ {l}</Text>
                  ))}
                </View>

                <View style={styles.driverFooterRow}>
                  <View>
                    <Text style={styles.rateLabel}>Hourly Rate</Text>
                    <Text style={styles.rateValue}>₹{drv.hourlyRate}/hr</Text>
                  </View>

                  <View style={styles.actionBtnGroup}>
                    <TouchableOpacity
                      style={styles.profileOutlineBtn}
                      onPress={() => {
                        setInspectedDriver(drv);
                        setDriverModalVisible(true);
                      }}
                    >
                      <Text style={styles.profileOutlineText}>Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.bookDirectBtn}
                      onPress={() => {
                        setSelectedDriver(drv);
                        setCurrentScreen('booking');
                      }}
                    >
                      <Text style={styles.bookDirectText}>Select Chauffeur</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================================================================= */}
        {/* SCREEN 3: BOOKING DETAILS & FARE SUMMARY                          */}
        {/* ================================================================= */}
        {currentScreen === 'booking' && (
          <View>
            <View style={styles.screenHeaderRow}>
              <TouchableOpacity onPress={() => setCurrentScreen('drivers')}>
                <Text style={styles.backButton}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.screenTitle}>Review & Confirm Fare</Text>
            </View>

            {/* Selected Driver Banner */}
            <View style={styles.selectedDriverCard}>
              <Image source={{ uri: selectedDriver.photoUrl }} style={styles.driverThumb} />
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{selectedDriver.fullName}</Text>
                <Text style={styles.driverMeta}>★ {selectedDriver.rating} • {selectedDriver.experienceYears} Years Exp</Text>
                <Text style={styles.badgePolice}>Assigned Chauffeur</Text>
              </View>
            </View>

            {/* Trip Specs */}
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Ride Details</Text>
              <Text style={styles.tripSummaryRow}>📍 Pickup: {pickupLocation}</Text>
              <Text style={styles.tripSummaryRow}>🏁 Drop: {destination}</Text>
              <Text style={styles.tripSummaryRow}>🚗 Car: {vehicleType} ({transmission})</Text>
              <Text style={styles.tripSummaryRow}>⏱️ Duration: {durationHours} Hours</Text>
            </View>

            {/* Fare Breakdown Source of Truth */}
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Fare Breakdown (INR ₹)</Text>

              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Base Fare ({selectedCategory}):</Text>
                <Text style={styles.fareValue}>₹{fare.base}</Text>
              </View>

              {fare.extraHoursCharge > 0 && (
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Additional Hours Charge:</Text>
                  <Text style={styles.fareValue}>₹{fare.extraHoursCharge}</Text>
                </View>
              )}

              {fare.nightAllowance > 0 && (
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Night Charge (10PM - 6AM):</Text>
                  <Text style={styles.fareValue}>₹{fare.nightAllowance}</Text>
                </View>
              )}

              {fare.outstationDA > 0 && (
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Driver Daily Allowance (DA):</Text>
                  <Text style={styles.fareValue}>₹{fare.outstationDA}</Text>
                </View>
              )}

              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Platform Convenience Fee:</Text>
                <Text style={styles.fareValue}>₹{fare.platformFee}</Text>
              </View>

              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>GST (5% Road Transport):</Text>
                <Text style={styles.fareValue}>₹{fare.gst}</Text>
              </View>

              {fare.discount > 0 && (
                <View style={styles.fareRow}>
                  <Text style={styles.discountLabel}>Coupon FIRST50 Applied:</Text>
                  <Text style={styles.discountValue}>-₹{fare.discount}</Text>
                </View>
              )}

              <View style={[styles.fareRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Payable Fare:</Text>
                <Text style={styles.totalValue}>₹{fare.total}</Text>
              </View>
            </View>

            {/* Razorpay UPI & Payment CTA */}
            <TouchableOpacity style={styles.payButton} onPress={handleConfirmBooking}>
              <Text style={styles.payButtonText}>⚡ Pay ₹{fare.total} via Razorpay UPI / Card</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================================================================= */}
        {/* SCREEN 4: LIVE TRIP STATUS & OTP                                  */}
        {/* ================================================================= */}
        {currentScreen === 'live_trip' && activeBooking && (
          <View>
            <View style={styles.liveTripHeader}>
              <Text style={styles.liveTripTitle}>Active Trip: {activeBooking.id}</Text>
              <Text style={styles.liveTripSub}>Security Handshake & Meter Tracking</Text>
            </View>

            {/* Trip Start OTP Security Box */}
            <View style={styles.otpCard}>
              <Text style={styles.otpHeader}>Trip Start Security OTP</Text>
              <Text style={styles.otpValue}>{activeBooking.tripOtp}</Text>
              <Text style={styles.otpNotice}>
                Share this 4-digit OTP with chauffeur {activeBooking.driverName} only after vehicle handover.
              </Text>
            </View>

            {/* Status Stepper */}
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Trip Progress</Text>
              <Text style={styles.statusStep}>
                Status: <Text style={styles.statusActive}>{activeBooking.status.toUpperCase()}</Text>
              </Text>

              <TouchableOpacity style={styles.statusUpdateButton} onPress={handleTripAction}>
                <Text style={styles.statusUpdateText}>
                  {activeBooking.status === 'accepted' && '1. Simulate Driver En Route →'}
                  {activeBooking.status === 'driver_en_route' && '2. Simulate Driver Arrived at Gate →'}
                  {activeBooking.status === 'arrived' && '3. Verify OTP & Start Meter →'}
                  {activeBooking.status === 'in_progress' && '4. Complete Trip & Stop Meter →'}
                  {activeBooking.status === 'completed' && 'Trip Finished (Submit Review)'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Chauffeur Card */}
            <View style={styles.driverCard}>
              <Image source={{ uri: selectedDriver.photoUrl }} style={styles.driverThumb} />
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{activeBooking.driverName}</Text>
                <Text style={styles.driverMeta}>Driver assigned to {activeBooking.car}</Text>
                <Text style={styles.badgePolice}>100% Police Verified</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.homeReturnBtn} onPress={() => setCurrentScreen('home')}>
              <Text style={styles.homeReturnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================================================================= */}
        {/* SCREEN 5: TRIP HISTORY & CUSTOMER DASHBOARD                       */}
        {/* ================================================================= */}
        {currentScreen === 'history' && (
          <View>
            <Text style={styles.screenTitle}>Booking History & Invoices</Text>
            {bookingHistory.map((b, idx) => (
              <View key={idx} style={styles.card}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyRef}>{b.id}</Text>
                  <Text style={styles.historyStatus}>{b.status}</Text>
                </View>
                <Text style={styles.historyService}>{b.service}</Text>
                <Text style={styles.historySub}>Driver: {b.driverName}</Text>
                <Text style={styles.historySub}>Vehicle: {b.car}</Text>
                <View style={styles.historyFooter}>
                  <Text style={styles.historyPrice}>₹{b.totalFare}</Text>
                  <TouchableOpacity onPress={() => Alert.alert('GST Tax Invoice', `SAC 996601 Tax Invoice for ${b.id} downloaded.`)}>
                    <Text style={styles.invoiceLink}>📄 Download Invoice</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================================================================= */}
        {/* SCREEN 6: CUSTOMER PROFILE & AUTH                                 */}
        {/* ================================================================= */}
        {currentScreen === 'profile' && (
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Customer Profile</Text>
            <Text style={styles.profileName}>{currentUser.fullName}</Text>
            <Text style={styles.profileMeta}>{currentUser.phone} • {currentUser.email}</Text>

            <View style={styles.divider} />

            <Text style={styles.subHeader}>Saved Addresses</Text>
            <Text style={styles.addressItem}>🏠 Home: Tower 4, DLF The Crest, Sector 54, Gurugram</Text>
            <Text style={styles.addressItem}>🏢 Office: Building 10B, DLF Cyber City, Phase 2</Text>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => Alert.alert('Logout', 'You have been logged out of your session.')}
            >
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* Bottom Mobile Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentScreen('home')}>
          <Text style={[styles.tabIcon, currentScreen === 'home' && styles.tabIconActive]}>🏠</Text>
          <Text style={[styles.tabLabel, currentScreen === 'home' && styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentScreen('drivers')}>
          <Text style={[styles.tabIcon, currentScreen === 'drivers' && styles.tabIconActive]}>👥</Text>
          <Text style={[styles.tabLabel, currentScreen === 'drivers' && styles.tabLabelActive]}>Drivers</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentScreen('history')}>
          <Text style={[styles.tabIcon, currentScreen === 'history' && styles.tabIconActive]}>📋</Text>
          <Text style={[styles.tabLabel, currentScreen === 'history' && styles.tabLabelActive]}>Trips</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentScreen('profile')}>
          <Text style={[styles.tabIcon, currentScreen === 'profile' && styles.tabIconActive]}>👤</Text>
          <Text style={[styles.tabLabel, currentScreen === 'profile' && styles.tabLabelActive]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Driver Inspection Modal */}
      <Modal visible={driverModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {inspectedDriver && (
              <View>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{inspectedDriver.fullName}</Text>
                  <TouchableOpacity onPress={() => setDriverModalVisible(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalSub}>{inspectedDriver.experienceYears} Years Chauffeur Experience • {inspectedDriver.primaryCity}</Text>
                <Text style={styles.modalBio}>"{inspectedDriver.bio}"</Text>

                <View style={styles.credentialBox}>
                  <Text style={styles.credText}>DL: {inspectedDriver.drivingLicenceNo}</Text>
                  <Text style={styles.credText}>Languages: {inspectedDriver.languages.join(', ')}</Text>
                  <Text style={styles.credText}>Rating: ★ {inspectedDriver.rating} ({inspectedDriver.totalReviews} reviews)</Text>
                  <Text style={styles.badgePolice}>100% Police Verified</Text>
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    setSelectedDriver(inspectedDriver);
                    setDriverModalVisible(false);
                    setCurrentScreen('booking');
                  }}
                >
                  <Text style={styles.primaryButtonText}>Book This Driver (₹{inspectedDriver.hourlyRate}/hr)</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <Modal visible={reviewModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate Your Chauffeur</Text>
            <Text style={styles.modalSub}>How was your ride experience?</Text>

            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                  <Text style={[styles.starIcon, star <= reviewRating && styles.starActive]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reviewInput}
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder="Driver punctuality, gear smoothness, etiquette..."
              multiline
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleSubmitReview}>
              <Text style={styles.primaryButtonText}>Submit Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  navBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  brandContainer: {
    flex: 1
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F1E36'
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F97316'
  },
  cityPill: {
    backgroundColor: '#F0F4F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9E2EC'
  },
  cityPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F1E36'
  },
  scrollArea: {
    padding: 16,
    paddingBottom: 80
  },
  verifiedHeader: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 2
  },
  heroSub: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F1E36'
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F1E36',
    marginBottom: 10,
    textTransform: 'uppercase'
  },
  inputRow: {
    marginBottom: 10
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F1E36'
  },
  subHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 8,
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap'
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  pillActive: {
    backgroundColor: '#0F1E36',
    borderColor: '#0F1E36'
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334E68'
  },
  pillTextActive: {
    color: '#FFFFFF'
  },
  primaryButton: {
    backgroundColor: '#0F1E36',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F1E36',
    textTransform: 'uppercase',
    marginBottom: 10
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16
  },
  catCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  catCardActive: {
    borderColor: '#F97316',
    borderWidth: 1.5,
    backgroundColor: '#FFF7ED'
  },
  catTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F1E36'
  },
  catTitleActive: {
    color: '#EA580C'
  },
  catPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F97316',
    marginTop: 2
  },
  catDesc: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2
  },
  driverCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10
  },
  driverThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E2E8F0'
  },
  driverLargeThumb: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#E2E8F0'
  },
  driverInfo: {
    flex: 1
  },
  driverName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F1E36'
  },
  driverMeta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1
  },
  driverRate: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
    marginTop: 2
  },
  badgePolice: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 3
  },
  bookMiniButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10
  },
  bookMiniText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800'
  },
  screenHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10
  },
  backButton: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F1E36'
  },
  screenTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F1E36'
  },
  filterNotice: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12
  },
  fullDriverCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12
  },
  fullDriverTop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8
  },
  fullDriverDetails: {
    flex: 1
  },
  driverSubText: {
    fontSize: 10,
    color: '#64748B'
  },
  driverRatingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706'
  },
  driverBio: {
    fontSize: 11,
    color: '#334E68',
    fontStyle: 'italic',
    marginBottom: 8
  },
  skillTagsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 10
  },
  skillTag: {
    fontSize: 9,
    fontWeight: '700',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    color: '#334E68'
  },
  driverFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8
  },
  rateLabel: {
    fontSize: 9,
    color: '#64748B'
  },
  rateValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F1E36'
  },
  actionBtnGroup: {
    flexDirection: 'row',
    gap: 6
  },
  profileOutlineBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  profileOutlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F1E36'
  },
  bookDirectBtn: {
    backgroundColor: '#0F1E36',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10
  },
  bookDirectText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  selectedDriverCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  tripSummaryRow: {
    fontSize: 11,
    color: '#334E68',
    marginBottom: 4
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  fareLabel: {
    fontSize: 11,
    color: '#64748B'
  },
  fareValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F1E36'
  },
  discountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669'
  },
  discountValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669'
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    marginTop: 4
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F1E36'
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F97316'
  },
  payButton: {
    backgroundColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900'
  },
  liveTripHeader: {
    backgroundColor: '#0F1E36',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12
  },
  liveTripTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  liveTripSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2
  },
  otpCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 12
  },
  otpHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9A3412',
    textTransform: 'uppercase'
  },
  otpValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#EA580C',
    letterSpacing: 6,
    marginVertical: 4
  },
  otpNotice: {
    fontSize: 10,
    color: '#7C2D12',
    textAlign: 'center'
  },
  statusStep: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8
  },
  statusActive: {
    fontWeight: '900',
    color: '#0F1E36'
  },
  statusUpdateButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  statusUpdateText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F1E36'
  },
  homeReturnBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#E2E8F0'
  },
  homeReturnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F1E36'
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  historyRef: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F1E36'
  },
  historyStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    textTransform: 'uppercase'
  },
  historyService: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334E68'
  },
  historySub: {
    fontSize: 10,
    color: '#64748B'
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6
  },
  historyPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F1E36'
  },
  invoiceLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F97316'
  },
  profileName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F1E36'
  },
  profileMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12
  },
  addressItem: {
    fontSize: 11,
    color: '#334E68',
    marginBottom: 6
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800'
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  tabItem: {
    alignItems: 'center'
  },
  tabIcon: {
    fontSize: 16
  },
  tabIconActive: {
    transform: [{ scale: 1.1 }]
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2
  },
  tabLabelActive: {
    color: '#0F1E36',
    fontWeight: '900'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F1E36'
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B'
  },
  modalSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8
  },
  modalBio: {
    fontSize: 11,
    color: '#334E68',
    fontStyle: 'italic',
    marginBottom: 10
  },
  credentialBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14
  },
  credText: {
    fontSize: 10,
    color: '#334E68',
    marginBottom: 3
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12
  },
  starIcon: {
    fontSize: 28,
    color: '#CBD5E1'
  },
  starActive: {
    color: '#F59E0B'
  },
  reviewInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 10,
    fontSize: 11,
    color: '#0F1E36',
    minHeight: 60,
    marginBottom: 12
  }
});
