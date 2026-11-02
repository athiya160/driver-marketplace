import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Phone,
  MessageSquare,
  Share2,
  AlertTriangle,
  QrCode,
  KeyRound,
  CheckCircle2,
  Clock,
  Car,
  FileText,
  Star,
  MapPin,
  Map as MapIcon
} from 'lucide-react';
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
      <div className="p-8 text-center text-slate-400">
        <p>No active booking found.</p>
        <button onClick={onBack} className="mt-3 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold">
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
    <div className="flex flex-col min-h-full pb-20 bg-slate-950 text-slate-100">
      
      {/* Top Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-extrabold text-sm text-white">Live Booking Status</h1>
            <p className="text-[11px] text-brand-400 font-mono font-bold">{booking.bookingReference}</p>
          </div>
        </div>

        {/* SOS Emergency Hotline */}
        <button
          onClick={() => alert('🚨 Emergency SOS Triggered: Dialing Indian National Emergency Helpline 112 and notifying Sarathi Rapid Response Control Room.')}
          className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-extrabold flex items-center gap-1 hover:bg-rose-500/30 transition shadow-sm animate-pulse"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>SOS (112)</span>
        </button>
      </div>

      <div className="p-4 space-y-4">
        
        {/* Real-Time GPS Tracking Map */}
        <InteractiveMap
          pickupAddress={booking.pickupAddress}
          dropAddress={booking.dropAddress}
          driverName={booking.driverName}
          driverPhoto={booking.driverPhoto}
          isLiveTracking={['driver_en_route', 'in_progress'].includes(booking.status)}
          height="210px"
        />

        {/* Status Pipeline Tracker */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Journey Tracking</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-500/20 text-brand-400 border border-brand-500/30 uppercase">
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
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-emerald-500'
                        : 'bg-slate-800'
                    }`}
                  ></div>
                  <span className={`text-[8px] leading-tight ${isCurrent ? 'font-bold text-white' : 'text-slate-500'}`}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assigned Driver Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <img
                src={booking.driverPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80'}
                alt={booking.driverName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-brand-500/30"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-white">{booking.driverName}</h3>
                  <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px] font-bold">✓</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Your Verified Chauffeur • {booking.transmissionType}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Police Verified • DL On Record</span>
                </div>
              </div>
            </div>

            {/* Quick Call & Share Trip */}
            <div className="flex flex-col gap-1.5">
              <a
                href={`tel:${booking.driverPhone || '+918001234567'}`}
                className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center hover:bg-emerald-500/30"
                title="Call Driver"
              >
                <Phone className="w-4 h-4" />
              </a>
              <button
                onClick={() => alert(`📲 Sharing Trip with Family: "I am traveling in my car with verified Sarathi driver ${booking.driverName}. Booking Ref: ${booking.bookingReference}. Emergency Support: +91 800 123 4567"`)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
                title="Share Trip details on WhatsApp"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-500">Pickup:</span>
              <p className="text-slate-200 font-semibold truncate">{booking.pickupAddress}</p>
            </div>
            <div>
              <span className="text-slate-500">Destination:</span>
              <p className="text-slate-200 font-semibold truncate">{booking.dropAddress}</p>
            </div>
          </div>
        </div>

        {/* Security & Trip Start Check-in Box (OTP & Scannable QR Code) */}
        {['accepted', 'driver_en_route', 'arrived'].includes(booking.status) && (
          <div className="bg-gradient-to-br from-brand-950/80 via-slate-900 to-slate-900 border border-brand-500/40 rounded-3xl p-4 shadow-xl text-center">
            <div className="flex items-center justify-center gap-1.5 text-brand-400 font-bold text-xs uppercase mb-1">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Trip Start Security Verification</span>
            </div>
            <p className="text-[11px] text-slate-300 mb-3">
              Share this 4-digit OTP or ask driver to scan your QR code upon vehicle arrival:
            </p>

            <div className="flex items-center justify-center gap-4 my-2">
              {/* 4-Digit OTP Box */}
              <div className="bg-slate-950 border-2 border-brand-500/50 rounded-2xl px-5 py-2 shadow-inner">
                <span className="text-[10px] text-slate-500 block font-semibold uppercase">Trip OTP</span>
                <span className="font-mono text-2xl font-black tracking-widest text-brand-400">
                  {booking.tripStartOtp}
                </span>
              </div>

              {/* Show QR Code button */}
              <button
                onClick={() => setShowQrModal(true)}
                className="p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-200 transition"
              >
                <QrCode className="w-6 h-6 text-brand-400 mb-0.5" />
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
          <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 rounded-3xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                  Live Trip Meter Running
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-slate-400">
                {booking.vehicleType} • {booking.transmissionType}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 my-3">
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-semibold">Elapsed Trip Time</span>
                <span className="font-mono text-xl font-black text-white">
                  {formatTimer(elapsedSeconds)}
                </span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-semibold">Total Fare</span>
                <span className="font-mono text-xl font-black text-brand-400">
                  ₹{booking.totalFare}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleStatusChange('completed')}
              disabled={updating}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition"
            >
              Finish Trip & Settle Payment
            </button>
          </div>
        )}

        {/* Completed Trip Card */}
        {booking.status === 'completed' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-white">Trip Completed Successfully!</h3>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">
              Total Amount: <span className="font-mono font-bold text-brand-400">₹{booking.totalFare}</span> (Paid via {booking.paymentMethod?.toUpperCase()})
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onOpenInvoice}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <FileText className="w-3.5 h-3.5 text-brand-400" />
                <span>GST Tax Invoice</span>
              </button>
              <button
                onClick={onOpenReview}
                className="py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Rate Chauffeur</span>
              </button>
            </div>
          </div>
        )}

        {/* Trip Stage Simulator Controls */}
        <div className="p-3 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            ⚙️ Real-Time Journey Flow Simulator:
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleStatusChange('driver_en_route')}
              disabled={updating}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold"
            >
              1. En Route
            </button>
            <button
              onClick={() => handleStatusChange('arrived')}
              disabled={updating}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold"
            >
              2. Arrived
            </button>
            <button
              onClick={onOpenScanner}
              className="px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-[10px] font-bold"
            >
              3. Scan Check-In
            </button>
            <button
              onClick={() => handleStatusChange('completed')}
              disabled={updating}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold"
            >
              4. Complete Trip
            </button>
          </div>
        </div>

      </div>

      {/* Customer QR Code Fullscreen Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xs rounded-3xl p-5 shadow-2xl text-center">
            <h3 className="font-extrabold text-base text-white mb-1">Your Trip Check-In QR</h3>
            <p className="text-xs text-slate-400 mb-4">Driver will scan this code to begin trip.</p>

            <div className="bg-white p-3 rounded-2xl inline-block shadow-lg mb-3">
              <QrCode className="w-48 h-48 text-slate-950" />
            </div>

            <div className="font-mono text-xs text-brand-400 font-bold mb-4">
              OTP: {booking.tripStartOtp}
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
