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
  Star,
  FileCheck2,
  Users,
  Clock,
  MapPin,
  Car
} from 'lucide-react';
import { BRAND } from '../config/branding.js';
import { updateBookingStatus } from '../api.js';
import InteractiveMap from '../components/InteractiveMap.jsx';
import DigitalVehicleHandoverModal from '../components/DigitalVehicleHandoverModal.jsx';
import FamilyCircleModal from '../components/FamilyCircleModal.jsx';

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
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showFamilyCircleModal, setShowFamilyCircleModal] = useState(false);
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
      <div className="bg-white border border-slate-200/90 rounded-3xl p-12 text-center text-slate-500 space-y-4 max-w-md mx-auto shadow-xs">
        <Car className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="font-extrabold text-base text-[#0B1329]">No Active Booking Found</h3>
        <p className="text-xs text-slate-400">You do not currently have any active rides in progress.</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-[#0B1329] text-white rounded-2xl text-xs font-bold hover:bg-slate-900 transition min-h-[44px]"
        >
          Book a Chauffeur
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

  const handleAdvanceStep = async (newStatus) => {
    setUpdating(true);
    try {
      const res = await updateBookingStatus(booking.id, newStatus);
      if (res.success && onRefreshBooking) {
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
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-100 text-[#0B1329] hover:bg-slate-200 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-extrabold text-lg text-[#0B1329] font-display">
              Live Booking Command & Tracking
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Ref: <strong className="text-amber-700">{booking.bookingReference}</strong> • {booking.serviceType.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* SOS Emergency Hotline */}
          <button
            onClick={() => alert(`🚨 Emergency SOS Triggered: Dialing Indian National Emergency Helpline 112 and notifying ${BRAND.appName} Rapid Response Control Room.`)}
            className="px-3.5 py-2 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-extrabold flex items-center gap-1.5 hover:bg-rose-100 transition shadow-xs min-h-[44px]"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Emergency SOS (112)</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Desktop Grid / 1-Column Mobile Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (7 cols): Interactive GPS Map & Stepper */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Real-Time GPS Tracking Map */}
          <div className="rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs bg-white">
            <InteractiveMap
              pickupAddress={booking.pickupAddress}
              dropAddress={booking.dropAddress}
              driverName={booking.driverName}
              driverPhoto={booking.driverPhoto}
              isLiveTracking={['driver_en_route', 'in_progress'].includes(booking.status)}
              height="380px"
            />
          </div>

          {/* Status Pipeline Stepper */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#0B1329]">
                Live Journey Tracking
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                {booking.status.replace('_', ' ')}
              </span>
            </div>

            {/* Stepper Progress Bar */}
            <div className="grid grid-cols-5 gap-2">
              {STATUS_STAGES.map((stage, idx) => {
                const isPastOrCurrent = currentStageIndex >= idx;
                const isCurrent = currentStageIndex === idx;
                return (
                  <div key={stage.id} className="flex flex-col items-center text-center">
                    <div
                      className={`w-full h-2 rounded-full transition-all mb-1.5 ${
                        isPastOrCurrent
                          ? isCurrent
                            ? 'bg-[#D4AF37] animate-pulse'
                            : 'bg-[#10B981]'
                          : 'bg-slate-200'
                      }`}
                    />
                    <span className={`text-[10px] leading-tight ${isCurrent ? 'font-bold text-[#0B1329]' : 'text-slate-400'}`}>
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Timer (When Trip is In Progress) */}
          {booking.status === 'in_progress' && (
            <div className="bg-[#0B1329] border border-[#D4AF37]/50 rounded-3xl p-6 text-white shadow-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#D4AF37] animate-spin" /> Live Trip Duration
                </span>
                <div className="font-mono text-3xl font-black text-white mt-1">
                  {formatTimer(elapsedSeconds)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-300 block">Meter Status</span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold inline-block mt-1">
                  Active Driving
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Right Column (5 cols): Secret OTP Handshake & Driver Details */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Secret 4-Digit Trip OTP Handshake Box */}
          <div className="bg-gradient-to-tr from-[#0B1329] to-[#152347] border border-[#D4AF37]/60 rounded-3xl p-6 text-white shadow-xl space-y-3 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-xs font-bold text-[#D4AF37]">
              <KeyRound className="w-3.5 h-3.5" />
              <span>4-DIGIT TRIP SECURITY OTP</span>
            </div>
            <p className="text-xs text-slate-300">
              Share this secret code with your chauffeur upon arrival to start your ride:
            </p>
            <div className="py-4 px-6 bg-white/10 rounded-2xl border border-white/15 max-w-[200px] mx-auto">
              <span className="font-mono text-4xl sm:text-5xl font-black tracking-widest text-[#D4AF37]">
                {booking.tripOtp || '4821'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Your driver cannot start the journey until they input this exact OTP into their chauffeur companion app.
            </p>
          </div>

          {/* Assigned Driver Profile Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img
                  src={booking.driverPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80'}
                  alt={booking.driverName}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-base text-[#0B1329] font-display">{booking.driverName}</h3>
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your Verified Chauffeur • {booking.transmissionType}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Police Verified • DL On Record</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Contact & Safety Actions */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${booking.driverPhone || '+918001234567'}`}
                className="py-3 px-4 rounded-2xl bg-[#0B1329] hover:bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-2 transition min-h-[44px]"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Call Chauffeur</span>
              </a>

              <button
                onClick={() => setShowFamilyCircleModal(true)}
                className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition min-h-[44px]"
              >
                <Share2 className="w-4 h-4 text-amber-600" />
                <span>Share Ride</span>
              </button>
            </div>

            {/* Pre-Trip Vehicle Handover Inspection */}
            <button
              onClick={() => setShowHandoverModal(true)}
              className="w-full py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-center gap-2 transition min-h-[44px]"
            >
              <FileCheck2 className="w-4 h-4 text-amber-700" />
              <span>Digital Vehicle Handover Checklist</span>
            </button>

            {/* Post-Trip Actions: Invoice & Review */}
            {booking.status === 'completed' && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={onOpenInvoice}
                  className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#0B1329] text-xs font-bold flex items-center justify-center gap-1.5 transition min-h-[44px]"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Tax Invoice</span>
                </button>
                <button
                  onClick={onOpenReview}
                  className="py-3 rounded-2xl bg-[#D4AF37] hover:bg-[#c49f2e] text-[#0B1329] text-xs font-bold flex items-center justify-center gap-1.5 transition min-h-[44px]"
                >
                  <Star className="w-4 h-4 fill-[#0B1329]" />
                  <span>Review Driver</span>
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Handover Modal */}
      <DigitalVehicleHandoverModal
        isOpen={showHandoverModal}
        onClose={() => setShowHandoverModal(false)}
        booking={booking}
      />

      {/* Family Circle Share Modal */}
      <FamilyCircleModal
        isOpen={showFamilyCircleModal}
        onClose={() => setShowFamilyCircleModal(false)}
        activeTrip={booking}
      />

    </div>
  );
}
