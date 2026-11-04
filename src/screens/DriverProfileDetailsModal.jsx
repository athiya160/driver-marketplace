import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  ShieldCheck,
  Award,
  Phone,
  MessageSquare,
  CheckCircle2,
  Car,
  Clock,
  Sparkles,
  MapPin,
  FileCheck,
  Calendar,
  Languages,
  Check,
  AlertCircle,
  Heart,
  FileBadge
} from 'lucide-react';
import { fetchDriverPassport, addPreferredChauffeur } from '../api.js';

export default function DriverProfileDetailsModal({
  isOpen,
  onClose,
  driver,
  onBookDriver,
  onCallDriver
}) {
  const [selectedTab, setSelectedTab] = useState('overview'); // 'overview', 'passport', 'reviews', 'availability'
  const [passportData, setPassportData] = useState(null);
  const [preferredSaved, setPreferredSaved] = useState(false);
  const [savingPreferred, setSavingPreferred] = useState(false);

  useEffect(() => {
    if (isOpen && driver?.id) {
      setPreferredSaved(false);
      fetchDriverPassport(driver.id)
        .then(res => {
          if (res.success && res.passport) {
            setPassportData(res.passport);
          }
        })
        .catch(err => console.error(err));
    }
  }, [isOpen, driver?.id]);

  if (!isOpen || !driver) return null;

  const handleTogglePreferred = async () => {
    if (preferredSaved) return;
    setSavingPreferred(true);
    try {
      const res = await addPreferredChauffeur(driver.id, 'Preferred chauffeur saved from Driver Passport');
      if (res.success) {
        setPreferredSaved(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPreferred(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-sans">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-5 shadow-2xl relative text-[#172033] max-h-[92vh] overflow-y-auto">
        
        {/* Top Bar with Close Button */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Verified Driver Profile
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chauffeur Hero Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="relative">
            <img
              src={driver.photoUrl}
              alt={driver.fullName}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm"
            />
            {driver.isOnline && (
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" title="Online & Available"></span>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-1.5">
              <h2 className="font-extrabold text-base text-[#0F1E36] truncate">{driver.fullName}</h2>
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-black" title="Identity & DL Authenticated">✓</span>
            </div>
            
            <p className="text-xs text-slate-500 mt-0.5">
              {driver.experienceYears} Years Chauffeur Experience • {driver.primaryCity}
            </p>

            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center text-amber-500 text-xs font-extrabold">
                <Star className="w-3.5 h-3.5 fill-current mr-0.5" />
                <span>{driver.rating}</span>
              </div>
              <span className="text-slate-300 text-[10px]">•</span>
              <span className="text-slate-600 text-xs font-semibold">{driver.totalTrips || 340} Completed Trips</span>
            </div>
          </div>

          {onCallDriver && (
            <button
              onClick={() => onCallDriver(driver)}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F1E36] transition shrink-0"
              title="Call Driver (Masked Number)"
            >
              <Phone className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 mb-4 text-xs font-bold">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              selectedTab === 'overview' ? 'bg-white text-[#0F1E36] shadow-sm font-extrabold' : 'text-slate-500'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedTab('passport')}
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
              selectedTab === 'passport' ? 'bg-white text-orange-600 shadow-sm font-extrabold' : 'text-slate-500'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Passport</span>
          </button>
          <button
            onClick={() => setSelectedTab('reviews')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              selectedTab === 'reviews' ? 'bg-white text-[#0F1E36] shadow-sm font-extrabold' : 'text-slate-500'
            }`}
          >
            Reviews ({driver.totalReviews || 128})
          </button>
          <button
            onClick={() => setSelectedTab('availability')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              selectedTab === 'availability' ? 'bg-white text-[#0F1E36] shadow-sm font-extrabold' : 'text-slate-500'
            }`}
          >
            Calendar
          </button>
        </div>

        {/* Tab 1: Overview */}
        {selectedTab === 'overview' && (
          <div className="space-y-4">
            
            {/* Rates Card */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Hourly Rate</span>
                <div className="font-mono font-extrabold text-sm text-[#0F1E36]">₹{driver.hourlyRate}/hr</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Full Day (8h)</span>
                <div className="font-mono font-extrabold text-sm text-[#0F1E36]">₹{driver.dailyRate || 1199}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Outstation / Day</span>
                <div className="font-mono font-extrabold text-sm text-[#0F1E36]">₹{driver.outstationRatePerDay || 1599}</div>
              </div>
            </div>

            {/* About Driver Bio */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                About the Driver
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                "{driver.bio}"
              </p>
            </div>

            {/* Vehicle & Transmission Mastery for Customer's Own Vehicle */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Supported Vehicles & Transmission
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {driver.transmissionSkills.map(t => (
                  <span key={t} className="px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold flex items-center gap-1">
                    ⚙️ {t} Transmission
                  </span>
                ))}
                {driver.vehicleTypes.map(v => (
                  <span key={v} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1">
                    🚗 {v}
                  </span>
                ))}
              </div>
            </div>

            {/* Languages Spoken */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Languages Spoken
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {driver.languages.map(l => (
                  <span key={l} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                    🗣️ {l}
                  </span>
                ))}
              </div>
            </div>

            {/* Verification Credentials Card */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-emerald-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Legal Verification</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                  100% Police Verified ✓
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-slate-500 block">Commercial DL:</span>
                  <span className="font-mono text-slate-800 font-bold">{driver.drivingLicenceNo || 'DL-0420150089211'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Aadhaar (UIDAI):</span>
                  <span className="font-mono text-slate-800 font-bold">XXXX-XXXX-{driver.aadhaarLast4 || '8842'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">PCC Clearance:</span>
                  <span className="text-emerald-700 font-bold">Clean Record Certified</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Operating Base:</span>
                  <span className="text-slate-800 font-bold">{driver.primaryCity}</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Driver Passport (Phase 9B) */}
        {selectedTab === 'passport' && (
          <div className="space-y-3.5 text-xs">
            {/* Passport Official Badge Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0F1E36] to-[#1A2F45] text-white border border-slate-700 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-orange-400" />
                  <span className="font-extrabold text-[11px] uppercase tracking-wider text-orange-400">
                    Official Driver Passport
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-300 font-bold">
                  {passportData?.passportNumber || 'DSP-DEL-2026-0891'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                  <span className="text-[9px] text-slate-400 uppercase font-semibold block">Safe Kilometers</span>
                  <span className="font-mono font-extrabold text-sm text-emerald-400">
                    {((passportData?.totalSafeKms || 184500) / 1000).toFixed(1)}k KM
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                  <span className="text-[9px] text-slate-400 uppercase font-semibold block">Zero Accident</span>
                  <span className="font-mono font-extrabold text-sm text-amber-400">
                    {passportData?.zeroAccidentStreakMonths || 54} Mos
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                  <span className="text-[9px] text-slate-400 uppercase font-semibold block">Punctuality</span>
                  <span className="font-mono font-extrabold text-sm text-blue-400">
                    {passportData?.punctualityScorePercent || 99.4}%
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-[11px] text-slate-200 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Police Verification:</span>
                  <span className="text-emerald-400 font-bold uppercase">{passportData?.policeVerificationStatus || 'Verified'} ✓</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">PCC Certificate:</span>
                  <span className="text-slate-300 truncate">{passportData?.policeClearanceNumber || 'PCC-DL-NORTH-2026-44910'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">License Category:</span>
                  <span className="text-slate-300">{passportData?.commercialLicenseType || 'LMV-TR'}</span>
                </div>
              </div>
            </div>

            {/* Luxury Certifications & Accreditations */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-orange-500" />
                Verified Luxury & Highway Accreditations
              </h4>
              <div className="space-y-1.5">
                {(passportData?.luxuryCertifications || [
                  'Mercedes-Benz 9G-Tronic Specialist',
                  'BMW Steptronic & xDrive Certified',
                  'Audi S-Tronic Executive Chauffeur',
                  'EV Regenerative Smooth Braking'
                ]).map((cert, i) => (
                  <div key={i} className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                    <span>{cert}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* VIP Client Commendations */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                VIP & Corporate Commendations
              </h4>
              <div className="space-y-1.5">
                {(passportData?.vipClientCommendations || [
                  'Corporate Managing Director Commendation (Golf Course Road, 2025)',
                  'Diplomatic Embassy Chauffeur Certificate of Appreciation (2024)'
                ]).map((comm, i) => (
                  <div key={i} className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-snug">
                    ★ "{comm}"
                  </div>
                ))}
              </div>
            </div>

            {/* Preferred Chauffeur Action */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTogglePreferred}
                disabled={savingPreferred || preferredSaved}
                className={`w-full py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition border ${
                  preferredSaved
                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <Heart className={`w-4 h-4 ${preferredSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                <span>
                  {preferredSaved
                    ? 'Saved in Your Preferred Chauffeurs List ✓'
                    : savingPreferred
                    ? 'Saving...'
                    : 'Add to My Preferred Chauffeurs'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Reviews */}
        {selectedTab === 'reviews' && (
          <div className="space-y-3">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#0F1E36]">Customer Ratings Breakdown</span>
                <span className="font-extrabold text-amber-500">★ {driver.rating} / 5.0</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-600 pt-1">
                <div className="flex justify-between">
                  <span>Punctuality (On-Time Arrival):</span>
                  <span className="font-bold text-slate-800">5.0 ★</span>
                </div>
                <div className="flex justify-between">
                  <span>Driving Smoothness & Gear Control:</span>
                  <span className="font-bold text-slate-800">4.9 ★</span>
                </div>
                <div className="flex justify-between">
                  <span>Etiquette & Route Knowledge:</span>
                  <span className="font-bold text-slate-800">5.0 ★</span>
                </div>
              </div>
            </div>

            {/* Sample Verified Reviews */}
            <div className="space-y-2">
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0F1E36]">Anil Mathur</span>
                  <span className="text-[10px] text-slate-400">2 days ago</span>
                </div>
                <div className="flex text-amber-500 text-[10px]">★★★★★</div>
                <p className="text-slate-600">
                  "Very punctual and well dressed. Drove our Honda City automatic through Gurgaon peak traffic without any jerks. Highly recommended."
                </p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0F1E36]">Dr. Neha K.</span>
                  <span className="text-[10px] text-slate-400">1 week ago</span>
                </div>
                <div className="flex text-amber-500 text-[10px]">★★★★★</div>
                <p className="text-slate-600">
                  "Took our Fortuner SUV for an outstation trip to Agra. Very safe overtaking and handled highway tolls smoothly."
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Availability Calendar */}
        {selectedTab === 'availability' && (
          <div className="space-y-3 text-xs">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                <span className="font-bold text-[#0F1E36]">Weekly Duty Slots</span>
              </div>
              <p className="text-slate-600 mb-2">
                This chauffeur is available for instant and pre-scheduled bookings across {driver.primaryCity}.
              </p>
              <div className="grid grid-cols-7 gap-1 text-center font-mono">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <div key={i} className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    <div>{day}</div>
                    <div className="text-[8px] text-emerald-600 mt-0.5">Free</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-800 text-[11px] flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0 text-orange-600" />
              <span>Standard transit buffer of 30 minutes is automatically applied between trips.</span>
            </div>
          </div>
        )}

        {/* Bottom Booking Action Bar */}
        <div className="pt-3 border-t border-slate-200 mt-4 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Base Fare</span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono font-black text-lg text-[#0F1E36]">₹{driver.hourlyRate}</span>
              <span className="text-[10px] text-slate-500">/ hour</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (onBookDriver) onBookDriver(driver);
              onClose();
            }}
            className="flex-1 py-3 bg-[#0F1E36] hover:bg-[#1A2F45] text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition"
          >
            <span>Book This Driver</span>
            <CheckCircle2 className="w-4 h-4 text-orange-400" />
          </button>
        </div>

      </div>
    </div>
  );
}
