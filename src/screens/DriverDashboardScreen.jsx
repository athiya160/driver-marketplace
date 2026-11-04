import React, { useState, useEffect } from 'react';
import {
  Car,
  Power,
  Star,
  Clock,
  Upload,
  MapPin,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  Calendar,
  Languages,
  SlidersHorizontal,
  ChevronRight,
  Phone,
  MessageSquare,
  X,
  Camera,
  RefreshCw,
  FileCheck2
} from 'lucide-react';
import DigitalVehicleHandoverModal from '../components/DigitalVehicleHandoverModal.jsx';
import {
  fetchDriverDashboard,
  toggleDriverOnline,
  fetchDriverKycStatus,
  submitDriverKyc,
  fetchDriverPricing,
  updateDriverPricing,
  fetchDriverAvailability,
  updateDriverAvailability,
  acceptBookingRequest,
  rejectBookingRequest,
  advanceTripStep,
  fetchDriverEarnings,
  fetchDriverReviews,
  submitSupportTicket
} from '../api.js';

export default function DriverDashboardScreen({
  onOpenTripScanner,
  onViewBooking
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'requests', 'kyc', 'schedule', 'earnings', 'rates', 'reviews', 'support'
  const [onlineToggling, setOnlineToggling] = useState(false);
  
  // Incoming Dispatch Request state
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [countdown, setCountdown] = useState(45);
  const [showHandoverModal, setShowHandoverModal] = useState(false);

  // KYC State
  const [kycDocs, setKycDocs] = useState([]);
  const [showKycModal, setShowKycModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('driving_licence_front');
  const [docNumberInput, setDocNumberInput] = useState('');
  const [docFileUrl, setDocFileUrl] = useState('');
  const [kycUploadSuccess, setKycUploadSuccess] = useState('');

  // Rates State
  const [rates, setRates] = useState({
    hourlyRate: 159,
    dailyRate: 1299,
    outstationRatePerDay: 1699,
    monthlyRate: 21999
  });
  const [savingRates, setSavingRates] = useState(false);
  const [ratesMsg, setRatesMsg] = useState('');

  // Availability Schedule State
  const [scheduleDays, setScheduleDays] = useState([
    { day: 'Monday', available: true, slots: '08:00 AM - 08:00 PM' },
    { day: 'Tuesday', available: true, slots: '08:00 AM - 08:00 PM' },
    { day: 'Wednesday', available: true, slots: '08:00 AM - 08:00 PM' },
    { day: 'Thursday', available: true, slots: '08:00 AM - 08:00 PM' },
    { day: 'Friday', available: true, slots: '08:00 AM - 10:00 PM' },
    { day: 'Saturday', available: true, slots: '06:00 AM - 11:00 PM' },
    { day: 'Sunday', available: false, slots: 'Weekly Rest Day' }
  ]);

  // Earnings State
  const [earningsData, setEarningsData] = useState(null);

  // Reviews State
  const [driverReviews, setDriverReviews] = useState([]);

  // Active Trip Manual OTP State
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

  // Support Ticket Form State
  const [supportCategory, setSupportCategory] = useState('billing');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSuccess, setSupportSuccess] = useState('');

  // Load Dashboard Data
  const loadDashboard = async () => {
    try {
      const res = await fetchDriverDashboard();
      if (res.success) {
        setData(res);
        if (res.driver.isOnline && !incomingRequest) {
          setIncomingRequest({
            id: 'bk_active_dispatch_01',
            bookingReference: 'SRT-2026-9912',
            customerName: 'Priya N. (Personal Car Hire)',
            pickupAddress: 'Tower 10B, DLF Cyber City, Phase 2, Gurugram',
            destination: 'Terminal 3, IGI Airport, New Delhi',
            serviceTitle: 'Hourly Chauffeur (4 hrs)',
            car: 'Honda City ZX (Automatic)',
            durationHours: 4,
            estFare: 620,
            driverEarning: 527 // 85% net
          });
          setCountdown(45);
        }
      }

      // Fetch KYC
      const kycRes = await fetchDriverKycStatus();
      if (kycRes.success) setKycDocs(kycRes.documents || []);

      // Fetch Pricing
      const pricingRes = await fetchDriverPricing();
      if (pricingRes.success) setRates(pricingRes.rates);

      // Fetch Earnings
      const earnRes = await fetchDriverEarnings();
      if (earnRes.success) setEarningsData(earnRes.earnings);

      // Fetch Reviews
      const revRes = await fetchDriverReviews();
      if (revRes.success) setDriverReviews(revRes.reviews || []);
    } catch (err) {
      console.error('Error loading driver dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Countdown timer for incoming request
  useEffect(() => {
    let timer = null;
    if (incomingRequest && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    } else if (countdown === 0 && incomingRequest) {
      setIncomingRequest(null);
    }
    return () => clearInterval(timer);
  }, [incomingRequest, countdown]);

  const handleToggleOnline = async () => {
    setOnlineToggling(true);
    try {
      const res = await toggleDriverOnline();
      if (res.success) {
        setData(prev => ({
          ...prev,
          driver: { ...prev.driver, isOnline: res.isOnline }
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOnlineToggling(false);
    }
  };

  const handleAcceptBooking = async () => {
    if (!incomingRequest) return;
    try {
      const res = await acceptBookingRequest(incomingRequest.id);
      if (res.success) {
        alert(`✅ Booking Accepted! You are assigned to drive ${incomingRequest.customerName}'s ${incomingRequest.car}.`);
        setIncomingRequest(null);
        loadDashboard();
      } else {
        alert(res.message || 'Could not accept booking.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeclineBooking = async () => {
    if (!incomingRequest) return;
    try {
      await rejectBookingRequest(incomingRequest.id);
      setIncomingRequest(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Step advancement for active trip
  const handleAdvanceTripStep = async (targetStatus) => {
    if (!data?.stats?.activeTrip) return;
    setOtpError('');
    try {
      const res = await advanceTripStep(data.stats.activeTrip.id, targetStatus, otpInput);
      if (res.success) {
        alert(`Trip status updated: ${targetStatus.toUpperCase()}`);
        setOtpInput('');
        loadDashboard();
      } else {
        setOtpError(res.message || 'Failed to update trip status');
      }
    } catch (err) {
      setOtpError('Failed to connect to trip verification server');
    }
  };

  // Submit KYC Document
  const handleSubmitKycDoc = async (e) => {
    e.preventDefault();
    if (!docNumberInput) return;
    try {
      const res = await submitDriverKyc({
        docType: selectedDocType,
        docNumber: docNumberInput,
        fileUrl: docFileUrl || 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=500&q=80'
      });
      if (res.success) {
        setKycUploadSuccess('Document submitted for admin verification.');
        setDocNumberInput('');
        setTimeout(() => {
          setKycUploadSuccess('');
          setShowKycModal(false);
          loadDashboard();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Configured Rates
  const handleSaveRates = async (e) => {
    e.preventDefault();
    setSavingRates(true);
    setRatesMsg('');
    try {
      const res = await updateDriverPricing(rates);
      if (res.success) {
        setRatesMsg('✅ Rates updated within platform guardrails.');
        setTimeout(() => setRatesMsg(''), 3000);
      } else {
        setRatesMsg(`❌ ${res.message}`);
      }
    } catch (err) {
      setRatesMsg('Failed to update rates.');
    } finally {
      setSavingRates(false);
    }
  };

  // Toggle Day Availability
  const toggleDayAvailability = (index) => {
    const updated = scheduleDays.map((item, idx) => idx === index ? { ...item, available: !item.available } : item);
    setScheduleDays(updated);
    updateDriverAvailability(updated).catch(console.error);
  };

  // Submit Support Ticket
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!supportSubject || !supportMessage) return;
    try {
      const res = await submitSupportTicket({
        category: supportCategory,
        subject: supportSubject,
        message: supportMessage
      });
      if (res.success) {
        setSupportSuccess('Support ticket submitted successfully. Support ID: ' + res.ticket.id);
        setSupportSubject('');
        setSupportMessage('');
        setTimeout(() => setSupportSuccess(''), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse font-sans">
        Loading Chauffeur Partner Portal...
      </div>
    );
  }

  const driver = data?.driver;
  const stats = data?.stats;
  const activeTrip = stats?.activeTrip;

  return (
    <div className="flex flex-col min-h-full pb-24 bg-[#F8FAFC] text-[#172033] font-sans">
      
      {/* Top Header with Chauffeur Identity & Online Duty Switch */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-20 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={driver?.photoUrl}
              alt={driver?.fullName}
              className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
            />
            {driver?.isOnline && (
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" title="Online"></span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-sm text-[#0F1E36]">{driver?.fullName}</h1>
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[8px] font-black" title="Police & DL Verified">✓</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
              <Star className="w-3 h-3 fill-current" />
              <span>{driver?.rating}</span>
              <span className="text-slate-400 font-normal">({driver?.totalTrips} Completed Trips)</span>
            </div>
          </div>
        </div>

        {/* Big Online/Offline Duty Switch */}
        <button
          onClick={handleToggleOnline}
          disabled={onlineToggling}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-black transition shadow-sm ${
            driver?.isOnline
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{driver?.isOnline ? 'ONLINE' : 'GO ONLINE'}</span>
        </button>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex gap-1.5 p-2 bg-white/80 border-b border-slate-200 overflow-x-auto scrollbar-none text-xs font-semibold">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'requests', label: 'Requests', badge: incomingRequest ? '1' : null },
          { id: 'kyc', label: 'KYC Compliance' },
          { id: 'schedule', label: 'Roster' },
          { id: 'earnings', label: 'Earnings' },
          { id: 'rates', label: 'My Rates' },
          { id: 'reviews', label: 'Reviews' },
          { id: 'support', label: 'Support' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition relative flex items-center gap-1 ${
              activeTab === tab.id
                ? 'bg-[#0F1E36] text-white shadow-sm font-extrabold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
            )}
          </button>
        ))}
      </div>

      {/* Main Tab Views */}
      <div className="p-4 space-y-4">
        
        {/* ================================================================= */}
        {/* TAB 1: OVERVIEW & ACTIVE TRIP STEPPER                             */}
        {/* ================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            
            {/* Active Ride Stepper Card */}
            {activeTrip ? (
              <div className="bg-white border-2 border-orange-500 rounded-3xl p-4 shadow-md space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-[11px] font-extrabold text-orange-600 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                    Active Assigned Journey
                  </span>
                  <span className="font-mono font-bold text-xs text-[#0F1E36]">{activeTrip.bookingReference}</span>
                </div>

                <div className="text-xs space-y-1">
                  <p className="font-extrabold text-[#0F1E36] text-sm">{activeTrip.customerName}</p>
                  <p className="text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Pickup: {activeTrip.pickupAddress}</span>
                  </p>
                  <p className="text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Destination: {activeTrip.dropAddress}</span>
                  </p>
                  <p className="text-slate-500">
                    🚗 Customer Vehicle: <strong>{activeTrip.vehicleType} ({activeTrip.transmissionType})</strong>
                  </p>
                </div>

                {/* Status Stepper Progression */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500 font-bold uppercase">Current Status:</span>
                    <span className="font-mono font-extrabold text-orange-600 uppercase">{activeTrip.status.replace('_', ' ')}</span>
                  </div>

                  {/* Actions according to state */}
                  {activeTrip.status === 'accepted' && (
                    <button
                      onClick={() => handleAdvanceTripStep('driver_en_route')}
                      className="w-full py-2.5 bg-[#0F1E36] hover:bg-[#1A2F45] text-white text-xs font-bold rounded-xl shadow-sm"
                    >
                      Step 1: Start Driving to Customer Vehicle →
                    </button>
                  )}

                  {activeTrip.status === 'driver_en_route' && (
                    <button
                      onClick={() => handleAdvanceTripStep('arrived')}
                      className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-sm"
                    >
                      Step 2: I Have Arrived at Customer Gate →
                    </button>
                  )}

                  {activeTrip.status === 'arrived' && (
                    <div className="space-y-2 pt-1">
                      {/* Vehicle Handover Inspection Button (Phase 9B) */}
                      <button
                        type="button"
                        onClick={() => setShowHandoverModal(true)}
                        className="w-full py-2 px-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 text-xs font-bold flex items-center justify-between shadow-xs hover:bg-orange-100 transition"
                      >
                        <div className="flex items-center gap-1.5">
                          <FileCheck2 className="w-4 h-4 text-orange-600" />
                          <span>Customer Vehicle Handover Checklist</span>
                        </div>
                        <span className="text-[10px] text-orange-700 font-bold uppercase">Inspect & Sign →</span>
                      </button>

                      <p className="text-[11px] text-slate-600 font-semibold">
                        Enter 4-digit OTP provided by customer upon car key handover:
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          placeholder="e.g. 4821 or 1234"
                          className="flex-1 p-2 bg-white border border-slate-300 rounded-xl text-center font-mono font-bold text-sm tracking-widest text-[#0F1E36]"
                        />
                        <button
                          onClick={() => handleAdvanceTripStep('in_progress')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl"
                        >
                          Verify OTP & Start Trip
                        </button>
                      </div>
                      {otpError && <p className="text-[11px] text-rose-600 font-bold">{otpError}</p>}
                    </div>
                  )}

                  {activeTrip.status === 'in_progress' && (
                    <div className="space-y-2 pt-1 text-center">
                      <span className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Trip in Progress • Meter Running
                      </span>
                      <button
                        onClick={() => handleAdvanceTripStep('completed')}
                        className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm"
                      >
                        Step 4: Trip Finished (Stop Meter & Hand Back Keys)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
                <Car className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-extrabold text-xs text-[#0F1E36]">No Active Trip Currently</p>
                <p className="text-[11px] text-slate-500 mt-1">Keep status Online to receive incoming ride dispatch alerts.</p>
              </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl text-center shadow-sm">
                <span className="text-[10px] text-slate-500 block font-semibold uppercase">Today's Net Payout</span>
                <span className="font-mono text-xl font-black text-emerald-700">₹{stats?.todayEarnings || 1420}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Direct UPI Transfer</span>
              </div>
              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl text-center shadow-sm">
                <span className="text-[10px] text-slate-500 block font-semibold uppercase">Rating & Feedback</span>
                <span className="font-mono text-xl font-black text-amber-500">{driver?.rating} ★</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">{driver?.totalReviews || 128} Verified Reviews</span>
              </div>
            </div>

          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: REQUESTS TAB                                               */}
        {/* ================================================================= */}
        {activeTab === 'requests' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Incoming Dispatch Alerts</h3>
            
            {incomingRequest ? (
              <div className="bg-orange-50 border-2 border-orange-400 rounded-3xl p-4 shadow-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-extrabold uppercase">
                    🚨 Rapid Alert ({countdown}s)
                  </span>
                  <span className="font-mono text-sm font-extrabold text-emerald-700">
                    +₹{incomingRequest.driverEarning} (85% net payout)
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-[#0F1E36]">{incomingRequest.serviceTitle}</h4>
                  <p className="text-xs text-slate-700 font-semibold mt-0.5">Customer: {incomingRequest.customerName}</p>
                  <p className="text-[11px] text-slate-600 mt-1">📍 Pickup: {incomingRequest.pickupAddress}</p>
                  <p className="text-[11px] text-slate-600">🏁 Drop: {incomingRequest.destination}</p>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">🚗 Customer Car: {incomingRequest.car}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={handleDeclineBooking}
                    className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition"
                  >
                    Decline
                  </button>
                  <button
                    onClick={handleAcceptBooking}
                    className="py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black shadow-sm transition"
                  >
                    Accept Ride (+₹{incomingRequest.driverEarning})
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl p-6 border border-slate-200 text-xs text-slate-500 shadow-sm">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-extrabold text-[#0F1E36]">No Pending Dispatch Alerts</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Keep app status online to receive local and outstation ride requests.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: KYC COMPLIANCE (Matching Haul Compliance UI screenshot)     */}
        {/* ================================================================= */}
        {activeTab === 'kyc' && (
          <div className="space-y-3">
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F1E36]">Driver Qualification & KYC</h3>
                  <p className="text-[11px] text-slate-500">Government identity & commercial driving licence verification.</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  100% Police Verified
                </span>
              </div>

              {/* Document Checklist matching screenshot */}
              <div className="space-y-2">
                {[
                  { key: 'driving_licence_front', title: 'Commercial Driving Licence (Front)', number: driver?.drivingLicenceNo, status: 'APPROVED' },
                  { key: 'driving_licence_back', title: 'Commercial Driving Licence (Back)', number: 'Valid LMV Commercial Endorsement', status: 'APPROVED' },
                  { key: 'aadhaar_card', title: 'Aadhaar Card (UIDAI)', number: `XXXX-XXXX-${driver?.aadhaarLast4 || '8842'}`, status: 'APPROVED' },
                  { key: 'police_clearance', title: 'Police Clearance Certificate (PCC)', number: 'PCC-DL-2025-99812', status: 'APPROVED' }
                ].map((doc) => (
                  <div
                    key={doc.key}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-extrabold text-xs text-[#0F1E36]">{doc.title}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{doc.number}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      {doc.status} ✓
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowKycModal(true)}
                className="w-full py-3 bg-[#0F1E36] hover:bg-[#1A2F45] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Camera className="w-3.5 h-3.5 text-orange-400" />
                <span>Upload New / Replacement Document</span>
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: ROSTER & AVAILABILITY CALENDAR                             */}
        {/* ================================================================= */}
        {activeTab === 'schedule' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="font-extrabold uppercase tracking-wider text-slate-500">Weekly Duty Roster</span>
              <span className="text-[10px] text-emerald-700 font-bold">Tap to Toggle Off-Duty</span>
            </div>

            <div className="space-y-2">
              {scheduleDays.map((item, idx) => (
                <div
                  key={item.day}
                  onClick={() => toggleDayAvailability(idx)}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                    item.available
                      ? 'bg-slate-50 border-slate-200 text-[#0F1E36]'
                      : 'bg-slate-100/60 border-slate-200 text-slate-400'
                  }`}
                >
                  <div>
                    <h5 className="font-extrabold text-xs">{item.day}</h5>
                    <p className="text-[10px] text-slate-500">{item.slots}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    item.available ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {item.available ? 'Available' : 'Off Duty'}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-800 text-[11px] flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0 text-orange-600" />
              <span>Mandatory 30-minute transit buffer is automatically applied between trips.</span>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: EARNINGS LEDGER & SETTLEMENTS                              */}
        {/* ================================================================= */}
        {activeTab === 'earnings' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="font-extrabold uppercase tracking-wider text-slate-500">Bank & UPI Settlement</span>
              <span className="text-[10px] text-emerald-700 font-bold">85% Gross + 100% DA</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Today</span>
                <span className="font-mono font-extrabold text-sm text-[#0F1E36]">₹{earningsData?.todayEarnings || 1420}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">This Week</span>
                <span className="font-mono font-extrabold text-sm text-[#0F1E36]">₹{earningsData?.weekEarnings || 8450}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">This Month</span>
                <span className="font-mono font-extrabold text-sm text-emerald-700">₹{earningsData?.monthEarnings || 34200}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Registered UPI VPA:</span>
                <span className="font-mono text-orange-600 font-bold">{earningsData?.payoutUpiId || 'rajesh.sharma@okaxis'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payout Settlement:</span>
                <span className="text-slate-700 font-semibold">Every Monday Direct Bank Transfer</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Platform Commission:</span>
                <span className="text-slate-700 font-semibold">15% on base fare</span>
              </div>
            </div>

            {/* Historical Payout Ledger */}
            <h4 className="font-extrabold text-xs text-[#0F1E36] pt-1">Recent Trip Payouts</h4>
            <div className="space-y-1.5">
              {(earningsData?.transactions || []).map(tx => (
                <div key={tx.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-xs text-[#0F1E36]">{tx.ref}</span>
                    <p className="text-[10px] text-slate-500">{tx.date} • Gross ₹{tx.fare}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-xs text-emerald-700">+₹{tx.netPayout}</span>
                    <span className="text-[9px] text-slate-400 block">{tx.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 6: MY RATES CONFIGURATION                                     */}
        {/* ================================================================= */}
        {activeTab === 'rates' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3 text-xs">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-sm text-[#0F1E36]">Driver Rate Guardrails</h3>
              <p className="text-[11px] text-slate-500">Configure rates within platform-regulated fair pricing limits.</p>
            </div>

            {ratesMsg && (
              <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-[#0F1E36]">
                {ratesMsg}
              </div>
            )}

            <form onSubmit={handleSaveRates} className="space-y-3">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">
                  Hourly Rate (₹120 – ₹350/hr):
                </label>
                <input
                  type="number"
                  min={120}
                  max={350}
                  value={rates.hourlyRate}
                  onChange={(e) => setRates(prev => ({ ...prev, hourlyRate: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-sm text-[#0F1E36]"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">
                  Full Day 8-Hour Rate (₹999 – ₹2,500):
                </label>
                <input
                  type="number"
                  min={999}
                  max={2500}
                  value={rates.dailyRate}
                  onChange={(e) => setRates(prev => ({ ...prev, dailyRate: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-sm text-[#0F1E36]"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">
                  Outstation Per Day Rate (₹1,499 – ₹3,500):
                </label>
                <input
                  type="number"
                  min={1499}
                  max={3500}
                  value={rates.outstationRatePerDay}
                  onChange={(e) => setRates(prev => ({ ...prev, outstationRatePerDay: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-sm text-[#0F1E36]"
                />
              </div>

              <button
                type="submit"
                disabled={savingRates}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-sm transition"
              >
                {savingRates ? 'Saving Rates...' : 'Save & Publish Rates'}
              </button>
            </form>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 7: REVIEWS & REPUTATION                                       */}
        {/* ================================================================= */}
        {activeTab === 'reviews' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="font-extrabold uppercase tracking-wider text-slate-500">Customer Reviews & Ratings</span>
              <span className="font-extrabold text-amber-500">★ {driver?.rating} Overall</span>
            </div>

            <div className="space-y-2">
              {driverReviews.map(r => (
                <div key={r.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#0F1E36]">{r.customerName}</span>
                    <span className="text-amber-500 font-extrabold text-[11px]">★ {r.rating}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">"{r.comment}"</p>
                  <p className="text-[9px] text-slate-400">{r.date}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 8: DRIVER SUPPORT                                             */}
        {/* ================================================================= */}
        {activeTab === 'support' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3 text-xs">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-sm text-[#0F1E36]">Driver Help & Support</h3>
              <p className="text-[11px] text-slate-500">Submit a query regarding KYC, earnings settlement or booking issues.</p>
            </div>

            {supportSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-bold">
                ✓ {supportSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitTicket} className="space-y-3">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Issue Category</label>
                <select
                  value={supportCategory}
                  onChange={(e) => setSupportCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[#172033]"
                >
                  <option value="billing">Earnings & UPI Payout Query</option>
                  <option value="kyc">KYC Document Verification</option>
                  <option value="dispute">Customer Booking Dispute</option>
                  <option value="app">App Technical Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. UPI transfer delay for trip SRT-2026-8821"
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[#172033]"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Details</label>
                <textarea
                  rows={3}
                  placeholder="Describe your issue in detail..."
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[#172033]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#0F1E36] hover:bg-[#1A2F45] text-white font-extrabold text-xs rounded-xl shadow-sm transition"
              >
                Submit Support Ticket
              </button>
            </form>
          </div>
        )}

      </div>

      {/* KYC Upload Modal */}
      {showKycModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-5 shadow-2xl relative text-[#172033]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-extrabold text-base text-[#0F1E36]">Submit KYC Document</h3>
              <button onClick={() => setShowKycModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            {kycUploadSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold mb-3">
                ✓ {kycUploadSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitKycDoc} className="space-y-3 text-left text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Document Type</label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[#172033]"
                >
                  <option value="driving_licence_front">Commercial Driving Licence (Front)</option>
                  <option value="driving_licence_back">Commercial Driving Licence (Back)</option>
                  <option value="aadhaar_card">Aadhaar Card (UIDAI)</option>
                  <option value="police_clearance">Police Clearance Certificate (PCC)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Document / Registration Number</label>
                <input
                  type="text"
                  placeholder="e.g. DL-0420180091223"
                  value={docNumberInput}
                  onChange={(e) => setDocNumberInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[#172033]"
                />
              </div>

              <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50">
                <Camera className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                <p className="font-bold text-xs text-[#0F1E36]">Take Photo or Browse Gallery</p>
                <p className="text-[10px] text-slate-400">Clear photo under good lighting</p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-sm transition"
              >
                Upload for Admin Verification
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Digital Vehicle Handover Inspection Modal (Phase 9B) */}
      {activeTrip && (
        <DigitalVehicleHandoverModal
          isOpen={showHandoverModal}
          onClose={() => setShowHandoverModal(false)}
          booking={activeTrip}
          handoverType={activeTrip.status === 'completed' ? 'post_trip_return' : 'pre_trip_handover'}
        />
      )}

    </div>
  );
}
