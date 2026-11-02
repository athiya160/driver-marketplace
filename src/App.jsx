import React, { useState, useEffect } from 'react';
import {
  Home,
  Users,
  Compass,
  Clock,
  User,
  Car,
  Shield,
  QrCode,
  FileText,
  Star,
  Bell
} from 'lucide-react';

import DeviceFrame from './components/DeviceFrame.jsx';
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
  const [viewMode, setViewMode] = useState('mobile'); // 'mobile' or 'desktop'
  const [currentRole, setCurrentRole] = useState('customer'); // 'customer', 'driver', 'admin'
  const [activeScreen, setActiveScreen] = useState('home'); // 'home', 'drivers', 'booking', 'live_trip', 'profile', 'driver_dash', 'admin_dash', 'app_scanner'
  
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedCity, setSelectedCity] = useState('Delhi NCR');
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
      title: 'Chauffeur Arrived at DLF The Crest',
      message: 'Rajesh Kumar Sharma is waiting near Tower 4 gate in uniform. Please verify Trip OTP 4821.',
      time: '2 mins ago',
      read: false,
      type: 'driver'
    },
    {
      id: 'notif_2',
      title: 'Booking Confirmed • SRT-2026-8821',
      message: 'Hourly rental driver booked for 14:30. Car: Honda City ZX (Automatic).',
      time: '15 mins ago',
      read: false,
      type: 'booking'
    },
    {
      id: 'notif_3',
      title: 'Razorpay UPI Payment Successful',
      message: 'Received ₹567 via Google Pay. Download your GST tax invoice anytime from My Trips.',
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
    pickupCity: 'Delhi NCR',
    dropAddress: 'Ambience Mall, NH-8, Gurugram',
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
          setCurrentRole(res.user.role);
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
    // Add in-app notification
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

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  return (
    <DeviceFrame
      viewMode={viewMode}
      setViewMode={setViewMode}
      currentRole={currentRole}
      onSwitchRole={handleSwitchRole}
      onOpenScanner={() => setActiveScreen('app_scanner')}
      onOpenNotifications={() => setNotificationsOpen(true)}
      unreadCount={unreadNotifsCount}
      onOpenAuth={handleOpenAuth}
    >
      <div className="flex-1 flex flex-col h-full relative">
        
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

        {/* Bottom Navigation Bar */}
        {currentRole === 'customer' && (
          <nav className="absolute bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-4 py-2 flex items-center justify-around z-30">
            <button
              onClick={() => setActiveScreen('home')}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold transition ${
                activeScreen === 'home' ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Book</span>
            </button>
            <button
              onClick={() => setActiveScreen('drivers')}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold transition ${
                activeScreen === 'drivers' ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Drivers</span>
            </button>
            <button
              onClick={() => setActiveScreen('live_trip')}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold transition relative ${
                activeScreen === 'live_trip' ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span>Active Ride</span>
              {activeBooking?.status === 'in_progress' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-0 right-3 animate-ping"></span>
              )}
            </button>
            <button
              onClick={() => setActiveScreen('profile')}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold transition ${
                activeScreen === 'profile' ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </button>
          </nav>
        )}

        {currentRole === 'driver' && (
          <nav className="absolute bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-4 py-2 flex items-center justify-around z-30">
            <button
              onClick={() => setActiveScreen('driver_dash')}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold transition ${
                activeScreen === 'driver_dash' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Car className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveScreen('live_trip')}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold transition ${
                activeScreen === 'live_trip' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span>Active Ride</span>
            </button>
            <button
              onClick={() => {
                setModalBooking(activeBooking);
                setScannerModalOpen(true);
              }}
              className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-amber-400 transition"
            >
              <QrCode className="w-5 h-5 text-amber-400" />
              <span>Scan QR</span>
            </button>
            <button
              onClick={() => setActiveScreen('app_scanner')}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold transition ${
                activeScreen === 'app_scanner' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <QrCode className="w-5 h-5" />
              <span>Expo QR</span>
            </button>
          </nav>
        )}

        {currentRole === 'admin' && (
          <nav className="absolute bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-4 py-2 flex items-center justify-around z-30">
            <button
              onClick={() => setActiveScreen('admin_dash')}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold transition ${
                activeScreen === 'admin_dash' ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-5 h-5" />
              <span>Admin Center</span>
            </button>
            <button
              onClick={() => setActiveScreen('app_scanner')}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold transition ${
                activeScreen === 'app_scanner' ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <QrCode className="w-5 h-5" />
              <span>Expo QR</span>
            </button>
          </nav>
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
        onCallDriver={(drv) => alert(`Masked Virtual Call placed to ${drv.fullName} (+91 800-SALMAN-DRV). Passenger phone number is protected.`)}
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
          alert(`Welcome to Salman Driver, ${user.fullName}!`);
        }}
      />

      <PhotoUploadModal
        isOpen={photoUploadModalOpen}
        onClose={() => setPhotoUploadModalOpen(false)}
        onUploadComplete={(newImg) => {
          console.log('Uploaded image synced:', newImg);
        }}
      />

    </DeviceFrame>
  );
}
