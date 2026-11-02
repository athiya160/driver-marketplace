import React, { useState, useEffect } from 'react';
import {
  Car,
  Power,
  Star,
  Clock,
  Upload,
  MapPin,
  QrCode
} from 'lucide-react';
import { fetchDriverDashboard, toggleDriverOnline, uploadDriverDocument } from '../api.js';

export default function DriverDashboardScreen({
  onOpenTripScanner,
  onViewBooking
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'requests', 'schedule', 'earnings', 'kyc'
  const [onlineToggling, setOnlineToggling] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [countdown, setCountdown] = useState(45);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('driving_licence');
  const [uploadDocNo, setUploadDocNo] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Weekly availability schedule state
  const [scheduleDays, setScheduleDays] = useState([
    { day: 'Monday', available: true, slots: '08:00 AM - 08:00 PM' },
    { day: 'Tuesday', available: true, slots: '08:00 AM - 08:00 PM' },
    { day: 'Wednesday', available: true, slots: '08:00 AM - 08:00 PM' },
    { day: 'Thursday', available: true, slots: '08:00 AM - 08:00 PM' },
    { day: 'Friday', available: true, slots: '08:00 AM - 10:00 PM' },
    { day: 'Saturday', available: true, slots: '06:00 AM - 11:00 PM (Outstation Open)' },
    { day: 'Sunday', available: false, slots: 'Weekly Rest Day' }
  ]);

  useEffect(() => {
    let isMounted = true;
    fetchDriverDashboard()
      .then(res => {
        if (isMounted && res.success) {
          setData(res);
          if (res.driver.isOnline) {
            setIncomingRequest({
              id: 'req_sim_99',
              bookingReference: 'SRT-2026-9912',
              customerName: 'Priya Narayanan',
              pickupAddress: 'DLF Cyber City, Tower 10B, Gurugram',
              serviceTitle: 'Hourly Rental (4 hrs)',
              car: 'Hyundai Creta (Automatic)',
              estFare: 620,
              driverEarning: 527
            });
          }
        }
      })
      .catch(err => console.error(err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let timer = null;
    if (incomingRequest && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    } else if (countdown === 0) {
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

  const handleAcceptRequest = () => {
    alert(`✅ Request Accepted! Navigating to customer vehicle at ${incomingRequest.pickupAddress}`);
    setIncomingRequest(null);
  };

  const handleRejectRequest = () => {
    setIncomingRequest(null);
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!uploadDocNo) return;
    try {
      const res = await uploadDriverDocument({
        docType: uploadDocType,
        docNumber: uploadDocNo
      });
      if (res.success) {
        setUploadSuccess(res.message);
        setUploadDocNo('');
        setTimeout(() => {
          setUploadSuccess('');
          setShowUploadModal(false);
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDayAvailability = (index) => {
    setScheduleDays(prev => prev.map((item, idx) => idx === index ? { ...item, available: !item.available } : item));
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse">
        Loading Driver Dashboard...
      </div>
    );
  }

  const driver = data?.driver;
  const stats = data?.stats;

  return (
    <div className="flex flex-col min-h-full pb-20 bg-[#F8FAFC] text-[#172033]">
      
      {/* Top Header & Online Toggle */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img
            src={driver?.photoUrl}
            alt={driver?.fullName}
            className="w-11 h-11 rounded-2xl object-cover border border-slate-200"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-sm text-[#0F1E36]">{driver?.fullName}</h1>
              <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px] font-bold">✓</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
              <Star className="w-3 h-3 fill-current" />
              <span>{driver?.rating}</span>
              <span className="text-slate-400 font-normal">({driver?.totalTrips} Trips)</span>
            </div>
          </div>
        </div>

        {/* Online / Offline Power Toggle */}
        <button
          onClick={handleToggleOnline}
          disabled={onlineToggling}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold transition shadow-sm ${
            driver?.isOnline
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{driver?.isOnline ? 'ONLINE' : 'GO ONLINE'}</span>
        </button>
      </div>

      {/* Driver Sub-Navigation Tabs */}
      <div className="flex gap-1.5 p-2 bg-white/80 border-b border-slate-200 overflow-x-auto scrollbar-none text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
            activeTab === 'overview' ? 'bg-[#0F1E36] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition relative ${
            activeTab === 'requests' ? 'bg-[#0F1E36] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Requests
          {incomingRequest && <span className="w-2 h-2 rounded-full bg-orange-500 absolute top-1 right-1 animate-ping"></span>}
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
            activeTab === 'schedule' ? 'bg-[#0F1E36] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Availability Calendar
        </button>
        <button
          onClick={() => setActiveTab('earnings')}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
            activeTab === 'earnings' ? 'bg-[#0F1E36] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Earnings Ledger
        </button>
        <button
          onClick={() => setActiveTab('kyc')}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
            activeTab === 'kyc' ? 'bg-[#0F1E36] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          KYC Documents
        </button>
      </div>

      <div className="p-4 space-y-4">
        
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* Active Trip Card */}
            {stats?.activeTrip ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-orange-600 uppercase tracking-wider">
                    ⚡ Current Assigned Ride
                  </span>
                  <span className="font-mono font-bold text-xs text-[#0F1E36]">
                    {stats.activeTrip.bookingReference}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 mb-3">
                  <p className="font-bold text-[#0F1E36] text-sm">{stats.activeTrip.customerName}</p>
                  <p className="text-slate-500">{stats.activeTrip.pickupAddress}</p>
                  <p className="text-slate-500">{stats.activeTrip.vehicleType} • {stats.activeTrip.transmissionType}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onOpenTripScanner(stats.activeTrip)}
                    className="py-2.5 bg-[#0F1E36] hover:bg-[#1A2F45] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <QrCode className="w-4 h-4 text-orange-400" />
                    <span>Verify & Start Trip</span>
                  </button>
                  <button
                    onClick={() => onViewBooking(stats.activeTrip)}
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition border border-slate-200"
                  >
                    <span>Trip Details</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
                <Car className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                <p className="font-bold text-xs text-[#0F1E36]">Ready for Next Customer</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Keep app open and status Online to receive city rides.</p>
              </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 p-3 rounded-2xl text-center shadow-sm">
                <span className="text-[10px] text-slate-500 block font-semibold">Today's Payout</span>
                <span className="font-mono text-xl font-black text-emerald-700">₹{stats?.todayEarnings || 1420}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Direct UPI Transfer</span>
              </div>
              <div className="bg-white border border-slate-200 p-3 rounded-2xl text-center shadow-sm">
                <span className="text-[10px] text-slate-500 block font-semibold">Rating & Review</span>
                <span className="font-mono text-xl font-black text-amber-500">{driver?.rating} ★</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Top 1% Chauffeur</span>
              </div>
            </div>
          </>
        )}

        {/* 2. REQUESTS TAB */}
        {activeTab === 'requests' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Incoming Ride Requests</h3>
            {incomingRequest ? (
              <div className="bg-orange-50 border-2 border-orange-400 rounded-2xl p-4 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-extrabold uppercase">
                    🚨 Dispatch Alert ({countdown}s)
                  </span>
                  <span className="font-mono text-sm font-extrabold text-emerald-700">
                    +₹{incomingRequest.driverEarning} (85% net)
                  </span>
                </div>

                <h4 className="font-extrabold text-sm text-[#0F1E36] mb-1">{incomingRequest.serviceTitle}</h4>
                <p className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-orange-500" />
                  <span>{incomingRequest.pickupAddress}</span>
                </p>
                <p className="text-[11px] text-slate-500 mb-3">Vehicle: {incomingRequest.car}</p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleRejectRequest}
                    className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200"
                  >
                    Decline
                  </button>
                  <button
                    onClick={handleAcceptRequest}
                    className="py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs transition shadow-sm"
                  >
                    Accept Trip
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl p-6 border border-slate-200 text-xs text-slate-500 shadow-sm">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-[#0F1E36]">No Pending Requests</p>
                <p className="text-[11px] text-slate-400 mt-1">New requests appear here automatically with alert notification.</p>
              </div>
            )}
          </div>
        )}

        {/* 3. AVAILABILITY CALENDAR TAB */}
        {activeTab === 'schedule' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="font-bold uppercase tracking-wider text-slate-500">Weekly Duty Roster</span>
              <span className="text-[10px] text-emerald-700 font-semibold">Tap to Toggle Off-Duty</span>
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
          </div>
        )}

        {/* 4. EARNINGS LEDGER TAB */}
        {activeTab === 'earnings' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="font-bold uppercase tracking-wider text-slate-500">Bank & UPI Settlement</span>
              <span className="text-[10px] text-emerald-700 font-bold">85% Gross + 100% DA</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">This Week Earnings:</span>
                <span className="font-mono font-bold text-[#0F1E36]">₹8,450</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lifetime Paid Payouts:</span>
                <span className="font-mono font-bold text-emerald-700">₹{stats?.totalEarnings || '14,280'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Registered UPI VPA:</span>
                <span className="font-mono text-orange-600 font-semibold">{driver?.payoutUpiId || 'rajesh.sharma@okaxis'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payout Cycle:</span>
                <span className="text-slate-700 font-medium">Every Monday Auto-Transfer</span>
              </div>
            </div>
          </div>
        )}

        {/* 5. KYC DOCUMENTS TAB */}
        {activeTab === 'kyc' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold uppercase tracking-wider text-slate-500">Government KYC Records</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                Active & Verified
              </span>
            </div>

            <div className="space-y-2">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex justify-between items-center">
                <div>
                  <h5 className="font-bold text-[#0F1E36]">Commercial Driving Licence (LMV)</h5>
                  <p className="text-[10px] text-slate-500 font-mono">{driver?.drivingLicenceNo}</p>
                </div>
                <span className="text-emerald-700 font-bold text-[11px]">Approved ✓</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex justify-between items-center">
                <div>
                  <h5 className="font-bold text-[#0F1E36]">Police Clearance Certificate (PCC)</h5>
                  <p className="text-[10px] text-slate-500 font-mono">PCC-DL-2025-99812</p>
                </div>
                <span className="text-emerald-700 font-bold text-[11px]">Approved ✓</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex justify-between items-center">
                <div>
                  <h5 className="font-bold text-[#0F1E36]">Aadhaar Card (UIDAI Verified)</h5>
                  <p className="text-[10px] text-slate-500 font-mono">XXXX-XXXX-{driver?.aadhaarLast4 || '8842'}</p>
                </div>
                <span className="text-emerald-700 font-bold text-[11px]">Approved ✓</span>
              </div>
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="w-full py-2.5 bg-[#0F1E36] hover:bg-[#1A2F45] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <Upload className="w-3.5 h-3.5 text-orange-400" />
              <span>Submit Document Update</span>
            </button>
          </div>
        )}

      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl p-5 shadow-2xl relative text-center text-[#172033]">
            <h3 className="font-extrabold text-base text-[#0F1E36] mb-1">Submit KYC Documents</h3>
            <p className="text-xs text-slate-500 mb-4">Mandatory document verification for Indian chauffeurs.</p>

            {uploadSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 font-bold mb-3">
                ✓ {uploadSuccess}
              </div>
            )}

            <form onSubmit={handleUploadDoc} className="space-y-3 text-left text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Document Type</label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[#172033] focus:outline-none focus:border-orange-500"
                >
                  <option value="driving_licence">Driving Licence (Commercial LMV)</option>
                  <option value="aadhaar_card">Aadhaar Card (UIDAI)</option>
                  <option value="police_verification">Police Clearance Certificate (PCC)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Document Reference Number</label>
                <input
                  type="text"
                  placeholder="e.g. DL-0420180091223"
                  value={uploadDocNo}
                  onChange={(e) => setUploadDocNo(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[#172033] focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Upload for Review
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
