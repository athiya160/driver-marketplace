import React, { useState, useEffect } from 'react';
import AppLayout from './components/AppLayout.jsx';
import TripQRScannerModal from './components/TripQRScannerModal.jsx';
import InvoiceModal from './components/InvoiceModal.jsx';
import ReviewModal from './components/ReviewModal.jsx';
import NotificationDrawer from './components/NotificationDrawer.jsx';
import PhotoUploadModal from './components/PhotoUploadModal.jsx';

import CustomerHomeScreen from './screens/CustomerHomeScreen.jsx';
import DriverSearchResultsScreen from './screens/DriverSearchResultsScreen.jsx';
import BookingFlowScreen from './screens/BookingFlowScreen.jsx';
import LiveTripStatusScreen from './screens/LiveTripStatusScreen.jsx';
import CustomerProfileScreen from './screens/CustomerProfileScreen.jsx';
import DriverDashboardScreen from './screens/DriverDashboardScreen.jsx';
import AdminDashboardScreen from './screens/AdminDashboardScreen.jsx';
import AppScannerScreen from './screens/AppScannerScreen.jsx';
import DriverProfileDetailsModal from './screens/DriverProfileDetailsModal.jsx';
import AuthModal from './screens/AuthModal.jsx';

import {
  fetchCurrentUser,
  switchUserRole,
  fetchDrivers,
  fetchBookings,
  verifyTripStart,
  submitReview
} from './api.js';

export default function App() {
  const getInitialRole = () => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname.toLowerCase();
      if (pathname.includes('/driver')) return 'driver';
      if (pathname.includes('/admin')) return 'admin';
      const params = new URLSearchParams(window.location.search);
      const role = params.get('role');
      if (['customer', 'driver', 'admin'].includes(role)) return role;
    }
    return 'customer';
  };

  const getInitialScreen = () => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname.toLowerCase();
      if (pathname.includes('/driver')) return 'driver_dash';
      if (pathname.includes('/admin')) return 'admin_dash';
      const params = new URLSearchParams(window.location.search);
      const screen = params.get('screen');
      if (screen) return screen;
      const role = params.get('role');
      if (role === 'driver') return 'driver_dash';
      if (role === 'admin') return 'admin_dash';
    }
    return 'home';
  };

  const [currentRole, setCurrentRole] = useState(getInitialRole);
  const [activeScreen, setActiveScreen] = useState(getInitialScreen);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedCity, setSelectedCity] = useState('Bengaluru');
  const [allDrivers, setAllDrivers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);

  // Modals state
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [modalBooking, setModalBooking] = useState(null);

  // Driver Profile Modal
  const [driverDetailsModalOpen, setDriverDetailsModalOpen] = useState(false);
  const [inspectedDriver, setInspectedDriver] = useState(null);

  // Photo & Document Upload Modal
  const [photoUploadModalOpen, setPhotoUploadModalOpen] = useState(false);

  // Auth & Onboarding Modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialView, setAuthInitialView] = useState('login');

  // Notifications state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 'notif_1',
      title: 'Chauffeur Arrived at Pickup Location',
      message: 'Rajesh Kumar Sharma is waiting near the main gate. Please verify Trip OTP 4821.',
      time: '2 mins ago',
      read: false,
      type: 'driver'
    },
    {
      id: 'notif_2',
      title: 'Booking Confirmed • SRT-2026-8821',
      message: 'Hourly rental chauffeur booked for today. Vehicle: Honda City ZX (Automatic).',
      time: '15 mins ago',
      read: false,
      type: 'booking'
    },
    {
      id: 'notif_3',
      title: 'Direct Driver Settlement Confirmed',
      message: 'Founding Launch Policy: ₹0 platform fee applied. Direct UPI/cash payout to chauffeur.',
      time: '1 hour ago',
      read: true,
      type: 'payment'
    },
    {
      id: 'notif_4',
      title: 'PCC Police Clearance Verified',
      message: 'Your assigned drivers undergo 100% Aadhaar & Commercial DL verification.',
      time: '1 day ago',
      read: true,
      type: 'security'
    }
  ]);

  // Customer booking form state
  const [bookingForm, setBookingForm] = useState({
    pickupAddress: 'Tower 4, DLF The Crest, Sector 54, Golf Course Road, Gurugram',
    pickupCity: 'Bengaluru',
    dropAddress: 'Kempegowda International Airport, Terminal 2',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '14:30',
    durationHours: 4,
    serviceType: 'hourly',
    transmissionType: 'Automatic',
    vehicleType: 'Sedan',
    couponCode: 'FIRST50'
  });

  // Load initial data
  useEffect(() => {
    let isMounted = true;
    fetchCurrentUser()
      .then(res => {
        if (isMounted && res.success) {
          setCurrentUser(res.user);
          setCurrentRole(res.user.role || 'customer');
        }
      })
      .catch(err => console.error(err));

    fetchDrivers({ city: selectedCity })
      .then(res => {
        if (isMounted && res.success) {
          setAllDrivers(res.drivers || []);
        }
      })
      .catch(err => console.error(err));

    fetchBookings(currentRole)
      .then(res => {
        if (isMounted && res.success) {
          setAllBookings(res.bookings || []);
          if (res.bookings.length > 0) {
            setActiveBooking(res.bookings[0]);
          }
        }
      })
      .catch(err => console.error(err));

    return () => { isMounted = false; };
  }, [selectedCity]);

  // Handle switching roles from top toolbar
  const handleSwitchRole = async (newRole) => {
    setCurrentRole(newRole);
    try {
      const res = await switchUserRole(newRole);
      if (res.success) {
        setCurrentUser(res.user);
        if (newRole === 'customer') {
          setActiveScreen('home');
        } else if (newRole === 'driver') {
          setActiveScreen('driver_dash');
        } else if (newRole === 'admin') {
          setActiveScreen('admin_dash');
        }
        const bRes = await fetchBookings(newRole);
        if (bRes.success) setAllBookings(bRes.bookings || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookingSuccess = (newBooking) => {
    setAllBookings(prev => [newBooking, ...prev]);
    setActiveBooking(newBooking);
    setActiveScreen('live_trip');
    setNotifications(prev => [
      {
        id: `notif_${Date.now()}`,
        title: `Driver Booked: ${newBooking.bookingReference}`,
        message: `${newBooking.driverName} assigned. Trip scheduled for ${newBooking.startDate} at ${newBooking.startTime}.`,
        time: 'Just now',
        read: false,
        type: 'booking'
      },
      ...prev
    ]);
  };

  const handleVerifyTripSuccess = async (verifyData) => {
    if (!activeBooking) return;
    try {
      const res = await verifyTripStart(activeBooking.id, verifyData);
      if (res.success) {
        setActiveBooking(res.booking);
        setAllBookings(prev => prev.map(b => b.id === res.booking.id ? res.booking : b));
        setNotifications(prev => [
          {
            id: `notif_${Date.now()}`,
            title: `Trip Started • Meter Running`,
            message: `OTP / QR verified. Driving in progress for ${res.booking.bookingReference}.`,
            time: 'Just now',
            read: false,
            type: 'driver'
          },
          ...prev
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReview = async (reviewData) => {
    if (!modalBooking) return;
    try {
      await submitReview(modalBooking.id, reviewData);
      alert('Thank you! Your feedback helps maintain high chauffeur standards across India.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewDriverDetails = (drv) => {
    setInspectedDriver(drv);
    setDriverDetailsModalOpen(true);
  };

  const handleOpenAuth = (targetView = 'login') => {
    setAuthInitialView(targetView);
    setAuthModalOpen(true);
  };

  const handleReloadAll = () => {
    fetchDrivers({ city: selectedCity }).then(res => {
      if (res.success) setAllDrivers(res.drivers || []);
    });
    fetchBookings(currentRole).then(res => {
      if (res.success) setAllBookings(res.bookings || []);
    });
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  return (
    <AppLayout
      currentRole={currentRole}
      onSwitchRole={handleSwitchRole}
      activeScreen={activeScreen}
      onNavigateScreen={(screen) => setActiveScreen(screen)}
      selectedCity={selectedCity}
      onSelectCity={(city) => setSelectedCity(city)}
      onOpenScanner={() => setActiveScreen('app_scanner')}
      onOpenNotifications={() => setNotificationsOpen(true)}
      unreadCount={unreadNotifsCount}
      onOpenAuth={handleOpenAuth}
      currentUser={currentUser}
      activeBooking={activeBooking}
      onResetDemo={handleReloadAll}
    >
      <div className="w-full">
        
        {/* 1. Customer Home Screen */}
        {activeScreen === 'home' && (
          <CustomerHomeScreen
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
            bookingForm={bookingForm}
            setBookingForm={setBookingForm}
            topDrivers={allDrivers}
            onSelectCategory={(catId) => {
              setBookingForm(prev => ({ ...prev, serviceType: catId }));
              setActiveScreen('drivers');
            }}
            onSearchDrivers={() => setActiveScreen('drivers')}
            onViewDriverDetails={handleViewDriverDetails}
            onOpenPhotoUpload={() => setPhotoUploadModalOpen(true)}
          />
        )}

        {/* 2. Driver Search Results Screen */}
        {activeScreen === 'drivers' && (
          <DriverSearchResultsScreen
            city={selectedCity}
            transmission={bookingForm.transmissionType}
            drivers={allDrivers}
            onBack={() => setActiveScreen('home')}
            onSelectDriver={(drv) => {
              setSelectedDriver(drv);
              setActiveScreen('booking');
            }}
            onViewDriverDetails={handleViewDriverDetails}
          />
        )}

        {/* 3. Booking Details & Fare Summary Screen */}
        {activeScreen === 'booking' && (
          <BookingFlowScreen
            selectedDriver={selectedDriver}
            bookingForm={bookingForm}
            currentUser={currentUser}
            onBack={() => setActiveScreen('drivers')}
            onBookingSuccess={handleBookingSuccess}
          />
        )}

        {/* 4. Live Booking Status & Meter Screen */}
        {activeScreen === 'live_trip' && (
          <LiveTripStatusScreen
            booking={activeBooking}
            onBack={() => setActiveScreen('home')}
            onOpenScanner={() => {
              setModalBooking(activeBooking);
              setScannerModalOpen(true);
            }}
            onOpenInvoice={() => {
              setModalBooking(activeBooking);
              setInvoiceModalOpen(true);
            }}
            onOpenReview={() => {
              setModalBooking(activeBooking);
              setReviewModalOpen(true);
            }}
            onRefreshBooking={(updated) => {
              setActiveBooking(updated);
              setAllBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
            }}
          />
        )}

        {/* 5. Customer Profile & History Screen */}
        {activeScreen === 'profile' && (
          <CustomerProfileScreen
            currentUser={currentUser}
            bookings={allBookings}
            onSelectBooking={(b) => {
              setActiveBooking(b);
              setActiveScreen('live_trip');
            }}
            onOpenInvoice={(b) => {
              setModalBooking(b);
              setInvoiceModalOpen(true);
            }}
            onOpenReview={(b) => {
              setModalBooking(b);
              setReviewModalOpen(true);
            }}
            onRebookDriver={(driverId) => {
              const drv = allDrivers.find(d => d.id === driverId);
              if (drv) {
                setSelectedDriver(drv);
                setActiveScreen('booking');
              }
            }}
          />
        )}

        {/* 6. Driver Dashboard Screen */}
        {activeScreen === 'driver_dash' && (
          <DriverDashboardScreen
            onOpenTripScanner={(bookingToScan) => {
              setModalBooking(bookingToScan);
              setActiveBooking(bookingToScan);
              setScannerModalOpen(true);
            }}
            onViewBooking={(bookingToView) => {
              setActiveBooking(bookingToView);
              setActiveScreen('live_trip');
            }}
          />
        )}

        {/* 7. Admin Dashboard Screen */}
        {activeScreen === 'admin_dash' && (
          <AdminDashboardScreen onSwitchRole={handleSwitchRole} />
        )}

        {/* 8. App Scanner Screen */}
        {activeScreen === 'app_scanner' && (
          <AppScannerScreen
            onBack={() => setActiveScreen(currentRole === 'driver' ? 'driver_dash' : currentRole === 'admin' ? 'admin_dash' : 'home')}
          />
        )}

      </div>

      {/* Global Modals */}
      <TripQRScannerModal
        isOpen={scannerModalOpen}
        onClose={() => setScannerModalOpen(false)}
        booking={modalBooking || activeBooking}
        onSuccess={handleVerifyTripSuccess}
      />

      <InvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        booking={modalBooking || activeBooking}
      />

      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        booking={modalBooking || activeBooking}
        onSubmit={handleSubmitReview}
      />

      <DriverProfileDetailsModal
        isOpen={driverDetailsModalOpen}
        onClose={() => setDriverDetailsModalOpen(false)}
        driver={inspectedDriver}
        onBookDriver={(drv) => {
          setSelectedDriver(drv);
          setActiveScreen('booking');
        }}
        onCallDriver={(drv) => alert(`Masked Virtual Call placed to ${drv.fullName} (+91 1800-200-8821). Passenger phone number is protected.`)}
        onChatDriver={(drv) => alert(`In-App Chat conversation opened with ${drv.fullName}.`)}
      />

      <NotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onClearAll={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
        onSelectNotification={(n) => {
          setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
          if (n.type === 'booking' || n.type === 'driver') {
            setActiveScreen('live_trip');
            setNotificationsOpen(false);
          }
        }}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialView={authInitialView}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setCurrentRole(user.role || 'customer');
          alert(`Welcome to Sarathi, ${user.fullName}!`);
        }}
      />

      <PhotoUploadModal
        isOpen={photoUploadModalOpen}
        onClose={() => setPhotoUploadModalOpen(false)}
        onUploadComplete={(newImg) => {
          console.log('Uploaded image synced:', newImg);
        }}
      />

    </AppLayout>
  );
}
