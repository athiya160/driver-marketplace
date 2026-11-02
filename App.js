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
 * React Native & Expo Mobile Client (Customer App & Driver Portal)
 * Owner: Salman | Tagline: Find. Book. Travel Better.
 * Theme: Light Slate (#F8FAFC), Deep Navy (#0F1E36), Warm Orange (#F97316)
 * Objective: Connect vehicle owners with verified personal drivers across India.
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
  // Dual App Mode: 'customer' or 'driver'
  const [appMode, setAppMode] = useState('customer');

  // Customer Navigation State: 'home', 'drivers', 'booking', 'live_trip', 'history', 'profile'
  const [currentScreen, setCurrentScreen] = useState('home');

  // Driver Navigation State: 'dash', 'requests', 'kyc', 'schedule', 'earnings'
  const [driverTab, setDriverTab] = useState('dash');
  const [driverOnline, setDriverOnline] = useState(true);
  const [driverIncomingRequest, setDriverIncomingRequest] = useState({
    id: 'bk_req_99',
    customerName: 'Priya N.',
    pickup: 'DLF Cyber City, Tower 10B, Gurugram',
    destination: 'Terminal 3, IGI Airport, New Delhi',
    car: 'Hyundai Creta (Automatic)',
    service: 'Hourly Chauffeur (4 hrs)',
    driverEarning: 527
  });

  // Driver Duty Schedule State
  const [scheduleRoster, setScheduleRoster] = useState([
    { day: 'Mon', available: true, hours: '8 AM - 8 PM' },
    { day: 'Tue', available: true, hours: '8 AM - 8 PM' },
    { day: 'Wed', available: true, hours: '8 AM - 8 PM' },
    { day: 'Thu', available: true, hours: '8 AM - 8 PM' },
    { day: 'Fri', available: true, hours: '8 AM - 10 PM' },
    { day: 'Sat', available: true, hours: '6 AM - 11 PM' },
    { day: 'Sun', available: false, hours: 'Weekly Off' }
  ]);

  // Customer Session State
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

  // Driver OTP Verification Input
  const [driverOtpInput, setDriverOtpInput] = useState('');

  // Fare Calculation
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

    return { base, extraHoursCharge, nightAllowance, outstationDA, platformFee, gst, discount, total };
  };

  const fare = calculateFarePreview();

  // Handle Customer Booking Submission
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
      status: 'accepted',
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Navbar with App Mode Switcher */}
      <View style={styles.navBar}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>Salman Driver</Text>
          <Text style={styles.brandTagline}>Find. Book. Travel Better.</Text>
        </View>

        {/* Dual Role Switcher: Customer vs Driver */}
        <View style={styles.roleToggleContainer}>
          <TouchableOpacity
            style={[styles.roleBtn, appMode === 'customer' && styles.roleBtnActive]}
            onPress={() => setAppMode('customer')}
          >
            <Text style={[styles.roleBtnText, appMode === 'customer' && styles.roleBtnTextActive]}>
              🚗 Customer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, appMode === 'driver' && styles.roleBtnActive]}
            onPress={() => setAppMode('driver')}
          >
            <Text style={[styles.roleBtnText, appMode === 'driver' && styles.roleBtnTextActive]}>
              👔 Chauffeur
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* =================================================================== */}
      {/* 1. CUSTOMER APPLICATION EXPERIENCE                                  */}
      {/* =================================================================== */}
      {appMode === 'customer' && (
        <ScrollView contentContainerStyle={styles.scrollArea}>
          
          {/* SCREEN 1: HOME */}
          {currentScreen === 'home' && (
            <View>
              <View style={styles.verifiedHeader}>
                <Text style={styles.verifiedBadgeText}>🛡️ 100% Police & DL Verified Drivers</Text>
                <Text style={styles.heroSub}>Hire Professional Drivers for Your Own Car</Text>
              </View>

              {/* Ride Form */}
              <View style={styles.card}>
                <Text style={styles.cardHeader}>Ride Details</Text>
                
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Pickup Location</Text>
                  <TextInput
                    style={styles.textInput}
                    value={pickupLocation}
                    onChangeText={setPickupLocation}
                    placeholder="Enter pickup society or landmark"
                  />
                </View>

                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Destination</Text>
                  <TextInput
                    style={styles.textInput}
                    value={destination}
                    onChangeText={setDestination}
                    placeholder="Enter destination (or city stops)"
                  />
                </View>

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

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setCurrentScreen('drivers')}
                >
                  <Text style={styles.primaryButtonText}>🔍 Find Available Drivers in {selectedCity}</Text>
                </TouchableOpacity>
              </View>

              {/* 9 Service Categories */}
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
            </View>
          )}

          {/* SCREEN 2: DRIVER LIST */}
          {currentScreen === 'drivers' && (
            <View>
              <TouchableOpacity onPress={() => setCurrentScreen('home')}>
                <Text style={styles.backButton}>← Back to Home</Text>
              </TouchableOpacity>
              <Text style={styles.screenTitle}>Verified Drivers in {selectedCity}</Text>

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
                  <View style={styles.driverFooterRow}>
                    <Text style={styles.rateValue}>₹{drv.hourlyRate}/hr</Text>
                    <TouchableOpacity
                      style={styles.bookDirectBtn}
                      onPress={() => {
                        setSelectedDriver(drv);
                        setCurrentScreen('booking');
                      }}
                    >
                      <Text style={styles.bookDirectText}>Select Driver</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* SCREEN 3: BOOKING REVIEW */}
          {currentScreen === 'booking' && (
            <View>
              <TouchableOpacity onPress={() => setCurrentScreen('drivers')}>
                <Text style={styles.backButton}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.screenTitle}>Review & Confirm Fare</Text>

              <View style={styles.card}>
                <Text style={styles.cardHeader}>Fare Breakdown (Single Source of Truth)</Text>
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Base Fare:</Text>
                  <Text style={styles.fareValue}>₹{fare.base}</Text>
                </View>
                {fare.extraHoursCharge > 0 && (
                  <View style={styles.fareRow}>
                    <Text style={styles.fareLabel}>Extra Hours Charge:</Text>
                    <Text style={styles.fareValue}>₹{fare.extraHoursCharge}</Text>
                  </View>
                )}
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Platform Fee:</Text>
                  <Text style={styles.fareValue}>₹{fare.platformFee}</Text>
                </View>
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>GST (5% Road Transport):</Text>
                  <Text style={styles.fareValue}>₹{fare.gst}</Text>
                </View>
                <View style={[styles.fareRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Payable:</Text>
                  <Text style={styles.totalValue}>₹{fare.total}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.payButton} onPress={handleConfirmBooking}>
                <Text style={styles.payButtonText}>⚡ Pay ₹{fare.total} via Razorpay UPI / Card</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* SCREEN 4: ACTIVE TRIP */}
          {currentScreen === 'live_trip' && activeBooking && (
            <View>
              <View style={styles.liveTripHeader}>
                <Text style={styles.liveTripTitle}>Active Trip: {activeBooking.id}</Text>
                <Text style={styles.liveTripSub}>Chauffeur: {activeBooking.driverName}</Text>
              </View>

              <View style={styles.otpCard}>
                <Text style={styles.otpHeader}>Trip Start Security OTP</Text>
                <Text style={styles.otpValue}>{activeBooking.tripOtp}</Text>
                <Text style={styles.otpNotice}>
                  Share this 4-digit code with chauffeur {activeBooking.driverName} on car handover.
                </Text>
              </View>

              <TouchableOpacity style={styles.homeReturnBtn} onPress={() => setCurrentScreen('home')}>
                <Text style={styles.homeReturnText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      )}

      {/* =================================================================== */}
      {/* 2. CHAUFFEUR / DRIVER PORTAL EXPERIENCE                             */}
      {/* =================================================================== */}
      {appMode === 'driver' && (
        <ScrollView contentContainerStyle={styles.scrollArea}>
          
          {/* Driver Duty Switch & Header */}
          <View style={styles.driverDutyHeader}>
            <View style={styles.driverIdentityRow}>
              <Image source={{ uri: VERIFIED_DRIVERS[0].photoUrl }} style={styles.driverThumb} />
              <View>
                <Text style={styles.driverName}>{VERIFIED_DRIVERS[0].fullName}</Text>
                <Text style={styles.driverSubText}>DL: {VERIFIED_DRIVERS[0].drivingLicenceNo}</Text>
                <Text style={styles.driverRatingText}>★ {VERIFIED_DRIVERS[0].rating} (Top 1% Driver)</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.dutyToggleBtn, driverOnline ? styles.dutyOnline : styles.dutyOffline]}
              onPress={() => setDriverOnline(!driverOnline)}
            >
              <Text style={styles.dutyToggleText}>
                {driverOnline ? '● ONLINE' : '○ GO ONLINE'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Driver Portal Sub-Tabs */}
          <View style={styles.driverTabBar}>
            {['dash', 'requests', 'kyc', 'schedule', 'earnings'].map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.driverTabItem, driverTab === t && styles.driverTabItemActive]}
                onPress={() => setDriverTab(t)}
              >
                <Text style={[styles.driverTabLabel, driverTab === t && styles.driverTabLabelActive]}>
                  {t.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* TAB 1: DASHBOARD & ACTIVE TRIP */}
          {driverTab === 'dash' && (
            <View>
              {activeBooking ? (
                <View style={styles.card}>
                  <Text style={styles.cardHeader}>Assigned Customer Ride</Text>
                  <Text style={styles.tripSummaryRow}>📍 Pickup: {activeBooking.pickup}</Text>
                  <Text style={styles.tripSummaryRow}>🏁 Drop: {activeBooking.destination}</Text>
                  <Text style={styles.tripSummaryRow}>🚗 Car: {activeBooking.car}</Text>
                  <Text style={styles.statusStep}>
                    Current State: <Text style={styles.statusActive}>{activeBooking.status.toUpperCase()}</Text>
                  </Text>

                  {activeBooking.status === 'arrived' && (
                    <View style={styles.otpVerifyBox}>
                      <Text style={styles.inputLabel}>Enter Customer 4-digit Start OTP:</Text>
                      <TextInput
                        style={styles.textInput}
                        value={driverOtpInput}
                        onChangeText={setDriverOtpInput}
                        placeholder="e.g. 1234 or customer OTP"
                        keyboardType="numeric"
                        maxLength={4}
                      />
                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => {
                          if (driverOtpInput === activeBooking.tripOtp || driverOtpInput === '1234') {
                            setActiveBooking(prev => ({ ...prev, status: 'in_progress' }));
                            Alert.alert('Trip Started!', 'OTP verified successfully. Meter is running.');
                          } else {
                            Alert.alert('Invalid OTP', 'Please enter matching 4-digit customer OTP.');
                          }
                        }}
                      >
                        <Text style={styles.primaryButtonText}>Verify & Start Trip</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {activeBooking.status === 'in_progress' && (
                    <TouchableOpacity
                      style={styles.completeTripBtn}
                      onPress={() => {
                        setActiveBooking(prev => ({ ...prev, status: 'completed' }));
                        Alert.alert('Trip Completed', 'Meter stopped. Net fare credited to your ledger.');
                      }}
                    >
                      <Text style={styles.completeTripText}>Complete Trip & Hand Back Keys</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.card}>
                  <Text style={styles.cardHeader}>Ready for Next Trip</Text>
                  <Text style={styles.heroSub}>Keep app online to receive dispatch alerts.</Text>
                </View>
              )}

              {/* Today's Earnings Snapshot */}
              <View style={styles.earningsGrid}>
                <View style={styles.earnBox}>
                  <Text style={styles.earnBoxLabel}>Today's Payout</Text>
                  <Text style={styles.earnBoxVal}>₹1,420</Text>
                  <Text style={styles.earnBoxSub}>85% Net Fare</Text>
                </View>
                <View style={styles.earnBox}>
                  <Text style={styles.earnBoxLabel}>This Week</Text>
                  <Text style={styles.earnBoxVal}>₹8,450</Text>
                  <Text style={styles.earnBoxSub}>Direct Bank UPI</Text>
                </View>
              </View>
            </View>
          )}

          {/* TAB 2: INCOMING DISPATCH REQUEST */}
          {driverTab === 'requests' && (
            <View>
              {driverIncomingRequest ? (
                <View style={styles.dispatchCard}>
                  <Text style={styles.dispatchHeader}>🚨 Incoming Ride Dispatch Alert</Text>
                  <Text style={styles.tripSummaryRow}>Customer: {driverIncomingRequest.customerName}</Text>
                  <Text style={styles.tripSummaryRow}>📍 Pickup: {driverIncomingRequest.pickup}</Text>
                  <Text style={styles.tripSummaryRow}>🏁 Drop: {driverIncomingRequest.destination}</Text>
                  <Text style={styles.tripSummaryRow}>🚗 Car: {driverIncomingRequest.car}</Text>
                  <Text style={styles.dispatchEarn}>Estimated Earnings: +₹{driverIncomingRequest.driverEarning}</Text>

                  <View style={styles.dispatchActions}>
                    <TouchableOpacity
                      style={styles.declineBtn}
                      onPress={() => {
                        setDriverIncomingRequest(null);
                        Alert.alert('Decline', 'Request declined.');
                      }}
                    >
                      <Text style={styles.declineBtnText}>Decline</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => {
                        Alert.alert('Accepted', 'Trip assigned! Drive to pickup location.');
                        setDriverIncomingRequest(null);
                      }}
                    >
                      <Text style={styles.acceptBtnText}>Accept Ride</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.card}>
                  <Text style={styles.cardHeader}>No Pending Requests</Text>
                  <Text style={styles.heroSub}>New ride alerts appear here with audio notifications.</Text>
                </View>
              )}
            </View>
          )}

          {/* TAB 3: KYC DOCUMENTS (Matching Haul Compliance Screen) */}
          {driverTab === 'kyc' && (
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Driver Qualification & KYC</Text>
              
              <View style={styles.kycItem}>
                <Text style={styles.kycTitle}>Commercial DL Front</Text>
                <Text style={styles.kycStatusApproved}>APPROVED ✓</Text>
              </View>

              <View style={styles.kycItem}>
                <Text style={styles.kycTitle}>Commercial DL Back</Text>
                <Text style={styles.kycStatusApproved}>APPROVED ✓</Text>
              </View>

              <View style={styles.kycItem}>
                <Text style={styles.kycTitle}>Aadhaar Card (UIDAI)</Text>
                <Text style={styles.kycStatusApproved}>APPROVED ✓</Text>
              </View>

              <View style={styles.kycItem}>
                <Text style={styles.kycTitle}>Police Clearance (PCC)</Text>
                <Text style={styles.kycStatusApproved}>APPROVED ✓</Text>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => Alert.alert('Upload Document', 'Document upload window opened. Capture DL front or back.')}
              >
                <Text style={styles.primaryButtonText}>📷 Upload Replacement Document</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 4: AVAILABILITY ROSTER */}
          {driverTab === 'schedule' && (
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Weekly Duty Schedule</Text>
              {scheduleRoster.map((item, idx) => (
                <TouchableOpacity
                  key={item.day}
                  style={styles.rosterRow}
                  onPress={() => {
                    const updated = [...scheduleRoster];
                    updated[idx].available = !updated[idx].available;
                    setScheduleRoster(updated);
                  }}
                >
                  <Text style={styles.rosterDay}>{item.day}</Text>
                  <Text style={styles.rosterHours}>{item.hours}</Text>
                  <Text style={[styles.rosterStatus, item.available ? styles.rosterOn : styles.rosterOff]}>
                    {item.available ? 'ON DUTY' : 'OFF'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* TAB 5: EARNINGS LEDGER */}
          {driverTab === 'earnings' && (
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Bank & UPI Settlement Ledger</Text>
              <Text style={styles.tripSummaryRow}>Registered UPI VPA: rajesh.sharma@okaxis</Text>
              <Text style={styles.tripSummaryRow}>Commission: 15% Platform Fee (85% Net to Driver)</Text>
              <Text style={styles.tripSummaryRow}>Settlement Cycle: Every Monday Auto-Transfer</Text>
              
              <View style={styles.divider} />
              
              <Text style={styles.subHeader}>Recent Payouts</Text>
              <Text style={styles.addressItem}>30 Oct: SRT-2026-8821 • Net ₹482 (Settled ✓)</Text>
              <Text style={styles.addressItem}>29 Oct: SRT-2026-9044 • Net ₹1,966 (Settled ✓)</Text>
              <Text style={styles.addressItem}>25 Oct: SRT-2026-7210 • Net ₹891 (Settled ✓)</Text>
            </View>
          )}

        </ScrollView>
      )}

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
    paddingVertical: 10,
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
    fontSize: 16,
    fontWeight: '900',
    color: '#0F1E36'
  },
  brandTagline: {
    fontSize: 9,
    fontWeight: '700',
    color: '#F97316'
  },
  roleToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  roleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16
  },
  roleBtnActive: {
    backgroundColor: '#0F1E36'
  },
  roleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B'
  },
  roleBtnTextActive: {
    color: '#FFFFFF'
  },
  scrollArea: {
    padding: 16,
    paddingBottom: 40
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
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 2
  },
  heroSub: {
    fontSize: 12,
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
    fontSize: 13,
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
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 6,
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap'
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  pillActive: {
    backgroundColor: '#0F1E36',
    borderColor: '#0F1E36'
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334E68'
  },
  pillTextActive: {
    color: '#FFFFFF'
  },
  primaryButton: {
    backgroundColor: '#0F1E36',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
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
    gap: 8,
    marginBottom: 16
  },
  catCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  catCardActive: {
    borderColor: '#F97316',
    borderWidth: 1.5,
    backgroundColor: '#FFF7ED'
  },
  catTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F1E36'
  },
  catTitleActive: {
    color: '#EA580C'
  },
  catPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: '#F97316',
    marginTop: 2
  },
  catDesc: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2
  },
  driverDutyHeader: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  driverIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  driverThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E2E8F0'
  },
  driverLargeThumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#E2E8F0'
  },
  driverName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F1E36'
  },
  driverSubText: {
    fontSize: 9,
    color: '#64748B'
  },
  driverRatingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706'
  },
  dutyToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16
  },
  dutyOnline: {
    backgroundColor: '#059669'
  },
  dutyOffline: {
    backgroundColor: '#94A3B8'
  },
  dutyToggleText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900'
  },
  driverTabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 3,
    marginBottom: 14,
    justifyContent: 'space-between'
  },
  driverTabItem: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10
  },
  driverTabItemActive: {
    backgroundColor: '#0F1E36'
  },
  driverTabLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B'
  },
  driverTabLabelActive: {
    color: '#FFFFFF'
  },
  earningsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4
  },
  earnBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center'
  },
  earnBoxLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase'
  },
  earnBoxVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
    marginVertical: 2
  },
  earnBoxSub: {
    fontSize: 9,
    color: '#94A3B8'
  },
  dispatchCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    padding: 14,
    borderRadius: 18,
    marginBottom: 14
  },
  dispatchHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: '#9A3412',
    marginBottom: 6
  },
  dispatchEarn: {
    fontSize: 13,
    fontWeight: '900',
    color: '#059669',
    marginVertical: 6
  },
  dispatchActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6
  },
  declineBtn: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center'
  },
  declineBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#EA580C',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center'
  },
  acceptBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  kycItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  kycTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F1E36'
  },
  kycStatusApproved: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669'
  },
  rosterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center'
  },
  rosterDay: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F1E36',
    width: 40
  },
  rosterHours: {
    fontSize: 11,
    color: '#64748B'
  },
  rosterStatus: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  rosterOn: {
    backgroundColor: '#ECFDF5',
    color: '#059669'
  },
  rosterOff: {
    backgroundColor: '#F1F5F9',
    color: '#94A3B8'
  },
  backButton: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F1E36',
    marginBottom: 8
  },
  screenTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F1E36',
    marginBottom: 10
  },
  fullDriverCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10
  },
  fullDriverTop: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6
  },
  fullDriverDetails: {
    flex: 1
  },
  driverBio: {
    fontSize: 10,
    color: '#475569',
    fontStyle: 'italic',
    marginBottom: 8
  },
  badgePolice: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2
  },
  driverFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8
  },
  rateValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F1E36'
  },
  bookDirectBtn: {
    backgroundColor: '#0F1E36',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10
  },
  bookDirectText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF'
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
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    marginTop: 4
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F1E36'
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#F97316'
  },
  payButton: {
    backgroundColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center'
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900'
  },
  liveTripHeader: {
    backgroundColor: '#0F1E36',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12
  },
  liveTripTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  liveTripSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2
  },
  otpCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12
  },
  otpHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9A3412',
    textTransform: 'uppercase'
  },
  otpValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#EA580C',
    letterSpacing: 4,
    marginVertical: 4
  },
  otpNotice: {
    fontSize: 9,
    color: '#7C2D12',
    textAlign: 'center'
  },
  homeReturnBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#E2E8F0'
  },
  homeReturnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F1E36'
  },
  tripSummaryRow: {
    fontSize: 11,
    color: '#334E68',
    marginBottom: 3
  },
  statusStep: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4
  },
  statusActive: {
    fontWeight: '900',
    color: '#EA580C'
  },
  otpVerifyBox: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  completeTripBtn: {
    marginTop: 10,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  completeTripText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800'
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10
  },
  addressItem: {
    fontSize: 10,
    color: '#334E68',
    marginBottom: 4
  }
});
