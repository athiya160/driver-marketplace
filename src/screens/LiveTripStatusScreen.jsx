import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Phone,
  Share2,
  AlertTriangle,
  QrCode,
  KeyRound,
  CheckCircle2,
  FileText,
  Star
} from 'lucide-react';
import { BRAND } from '../config/branding.js';
import { updateBookingStatus } from '../api.js';
import InteractiveMap from '../components/InteractiveMap.jsx';

export default function LiveTripStatusScreen({
  booking,
  onBack,
  onOpenScanner,
  onOpenInvoice,
  onOpenReview,
  onRefreshBooking
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(1450);
  const [showQrModal, setShowQrModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Live timer tick when trip is in_progress
  useEffect(() => {
    let interval = null;
    if (booking?.status === 'in_progress') {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [booking?.status]);

  if (!booking) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>No active booking found.</p>
        <button onClick={onBack} className="mt-3 px-4 py-2 bg-[#0F1E36] text-white rounded-xl text-xs font-bold">
          Go Home
        </button>
      </div>
    );
  }

  const formatTimer = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStatusChange = async (nextStatus) => {
    setUpdating(true);
    try {
      const res = await updateBookingStatus(booking.id, nextStatus);
      if (res.success) {
        onRefreshBooking(res.booking);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const STATUS_STAGES = [
    { id: 'accepted', label: 'Driver Assigned' },
    { id: 'driver_en_route', label: 'Driver on Way' },
    { id: 'arrived', label: 'Chauffeur Arrived' },
    { id: 'in_progress', label: 'Trip In Progress' },
    { id: 'completed', label: 'Completed' }
  ];

  const currentStageIndex = STATUS_STAGES.findIndex(s => s.id === booking.status);

  return (
    <div className="flex flex-col min-h-full pb-20 bg-[#F8FAFC] text-[#172033]">
      
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 text-[#0F1E36] hover:bg-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-extrabold text-sm text-[#0F1E36]">Live Booking Status</h1>
            <p className="text-[11px] text-orange-600 font-mono font-bold">{booking.bookingReference}</p>
          </div>
        </div>

        {/* SOS Emergency Hotline */}
        <button
          onClick={() => alert(`🚨 Emergency SOS Triggered: Dialing Indian National Emergency Helpline 112 and notifying ${BRAND.appName} Rapid Response Control Room.`)}
          className="px-2.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-extrabold flex items-center gap-1 hover:bg-rose-100 transition shadow-sm animate-pulse"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          <span>SOS (112)</span>
        </button>
      </div>

      <div className="p-4 space-y-4">
        
        {/* Real-Time GPS Tracking Map */}
        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <InteractiveMap
            pickupAddress={booking.pickupAddress}
            dropAddress={booking.dropAddress}
            driverName={booking.driverName}
            driverPhoto={booking.driverPhoto}
            isLiveTracking={['driver_en_route', 'in_progress'].includes(booking.status)}
            height="210px"
          />
        </div>

        {/* Status Pipeline Tracker */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Live Journey Tracking</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-50 text-orange-700 border border-orange-200 uppercase">
              {booking.status.replace('_', ' ')}
            </span>
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-5 gap-1 mb-2">
            {STATUS_STAGES.map((stage, idx) => {
              const isPastOrCurrent = currentStageIndex >= idx;
              const isCurrent = currentStageIndex === idx;
              return (
                <div key={stage.id} className="flex flex-col items-center text-center">
                  <div
                    className={`w-full h-1.5 rounded-full transition-all mb-1 ${
                      isPastOrCurrent
                        ? isCurrent
                          ? 'bg-orange-500 animate-pulse'
                          : 'bg-emerald-500'
                        : 'bg-slate-200'
                    }`}
                  ></div>
                  <span className={`text-[8px] leading-tight ${isCurrent ? 'font-bold text-[#0F1E36]' : 'text-slate-400'}`}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assigned Driver Profile Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <img
                src={booking.driverPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80'}
                alt={booking.driverName}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-[#0F1E36]">{booking.driverName}</h3>
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px] font-bold">✓</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Your Verified Chauffeur • {booking.transmissionType}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold mt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Police Verified • DL On Record</span>
                </div>
              </div>
            </div>

            {/* Quick Call & Share Trip */}
            <div className="flex flex-col gap-1.5">
              <a
                href={`tel:${booking.driverPhone || '+918001234567'}`}
                className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center hover:bg-emerald-100"
                title="Call Driver"
              >
                <Phone className="w-4 h-4" />
              </a>
              <button
                onClick={() => alert(`📲 Sharing Trip with Family: "I am traveling in my car with verified ${BRAND.appName} driver ${booking.driverName}. Booking Ref: ${booking.bookingReference}. Emergency Support: ${BRAND.supportPhone}"`)}
                className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center"
                title="Share Trip details on WhatsApp"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
            <div>
              <span className="text-slate-400">Pickup:</span>
              <p className="text-slate-700 font-semibold truncate">{booking.pickupAddress}</p>
            </div>
            <div>
              <span className="text-slate-400">Destination:</span>
              <p className="text-slate-700 font-semibold truncate">{booking.dropAddress}</p>
            </div>
          </div>
        </div>

        {/* Security & Trip Start Check-in Box (OTP & Scannable QR Code) */}
        {['accepted', 'driver_en_route', 'arrived'].includes(booking.status) && (
          <div className="bg-gradient-to-br from-orange-50/60 to-amber-50/60 border border-orange-200 rounded-2xl p-4 shadow-sm text-center">
            <div className="flex items-center justify-center gap-1.5 text-orange-700 font-bold text-xs uppercase mb-1">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Trip Start Security Verification</span>
            </div>
            <p className="text-[11px] text-slate-600 mb-3">
              Share this 4-digit OTP or ask driver to scan your QR code upon vehicle arrival:
            </p>

            <div className="flex items-center justify-center gap-4 my-2">
              {/* 4-Digit OTP Box */}
              <div className="bg-white border-2 border-orange-400 rounded-2xl px-5 py-2 shadow-sm">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Trip OTP</span>
                <span className="font-mono text-2xl font-black tracking-widest text-[#0F1E36]">
                  {booking.tripStartOtp}
                </span>
              </div>

              {/* Show QR Code button */}
              <button
                onClick={() => setShowQrModal(true)}
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-[#0F1E36] transition shadow-sm"
              >
                <QrCode className="w-6 h-6 text-orange-500 mb-0.5" />
                <span className="text-[10px] font-bold">Show QR</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-500 mt-2">
              🔒 Prevents unauthorized driver boarding & confirms insurance coverage.
            </p>
          </div>
        )}

        {/* Active Trip Live Meter (When Trip is In Progress) */}
        {booking.status === 'in_progress' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
                  Live Trip Meter Running
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-slate-500">
                {booking.vehicleType} • {booking.transmissionType}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 my-3">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 block font-semibold">Elapsed Trip Time</span>
                <span className="font-mono text-xl font-black text-[#0F1E36]">
                  {formatTimer(elapsedSeconds)}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 block font-semibold">Total Fare</span>
                <span className="font-mono text-xl font-black text-orange-600">
                  ₹{booking.totalFare}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleStatusChange('completed')}
              disabled={updating}
              className="w-full py-3 bg-[#0F1E36] hover:bg-[#1A2F45] text-white font-extrabold text-xs rounded-xl shadow-md transition"
            >
              Finish Trip & Settle Payment
            </button>
          </div>
        )}

        {/* Completed Trip Card */}
        {booking.status === 'completed' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-[#0F1E36]">Trip Completed Successfully!</h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">
              Total Amount: <span className="font-mono font-bold text-orange-600">₹{booking.totalFare}</span> (Paid via {booking.paymentMethod?.toUpperCase()})
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onOpenInvoice}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-[#0F1E36] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition border border-slate-200"
              >
                <FileText className="w-3.5 h-3.5 text-orange-500" />
                <span>GST Tax Invoice</span>
              </button>
              <button
                onClick={onOpenReview}
                className="py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Rate Chauffeur</span>
              </button>
            </div>
          </div>
        )}

        {/* Trip Stage Simulator Controls */}
        <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            ⚙️ Real-Time Journey Flow Simulator:
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleStatusChange('driver_en_route')}
              disabled={updating}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold border border-slate-200"
            >
              1. En Route
            </button>
            <button
              onClick={() => handleStatusChange('arrived')}
              disabled={updating}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold border border-slate-200"
            >
              2. Arrived
            </button>
            <button
              onClick={onOpenScanner}
              className="px-2.5 py-1 rounded-lg bg-[#0F1E36] hover:bg-[#1A2F45] text-white text-[10px] font-bold"
            >
              3. Scan Check-In
            </button>
            <button
              onClick={() => handleStatusChange('completed')}
              disabled={updating}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold"
            >
              4. Complete Trip
            </button>
          </div>
        </div>

      </div>

      {/* Customer QR Code Fullscreen Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-xs rounded-2xl p-5 shadow-2xl text-center">
            <h3 className="font-extrabold text-base text-[#0F1E36] mb-1">Your Trip Check-In QR</h3>
            <p className="text-xs text-slate-500 mb-4">Driver will scan this code to begin trip.</p>

            <div className="bg-slate-50 p-3 rounded-2xl inline-block border border-slate-200 mb-3">
              <QrCode className="w-48 h-48 text-[#0F1E36]" />
            </div>

            <div className="font-mono text-xs text-orange-600 font-bold mb-4">
              OTP: {booking.tripStartOtp}
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-[#0F1E36] text-xs font-bold rounded-xl border border-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
