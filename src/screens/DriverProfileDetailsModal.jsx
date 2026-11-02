import React from 'react';
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
  FileCheck
} from 'lucide-react';

export default function DriverProfileDetailsModal({
  isOpen,
  onClose,
  driver,
  onBookDriver,
  onCallDriver,
  onChatDriver
}) {
  if (!isOpen || !driver) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-5 shadow-2xl relative text-slate-100 max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Chauffeur Hero Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <img
              src={driver.photoUrl}
              alt={driver.fullName}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-500 shadow-xl"
            />
            {driver.isOnline && (
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" title="Online & Available"></span>
            )}
          </div>

          <div className="flex-1 pr-6">
            <div className="flex items-center gap-1.5">
              <h2 className="font-extrabold text-base text-white">{driver.fullName}</h2>
              <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-bold" title="Aadhaar & DL Verified">✓</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{driver.experienceYears} Years Chauffeur Experience</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center text-amber-400 text-xs font-extrabold">
                <Star className="w-3.5 h-3.5 fill-current mr-0.5" />
                <span>{driver.rating}</span>
              </div>
              <span className="text-slate-500 text-[10px]">•</span>
              <span className="text-slate-300 text-xs font-semibold">{driver.totalTrips} Completed Trips</span>
            </div>
          </div>
        </div>

        {/* Identity & Legal Verification Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 mb-4 space-y-2 text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security & Credentials</span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              100% Police Verified ✓
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500 block">Driving Licence:</span>
              <span className="font-mono text-slate-200 font-bold">{driver.drivingLicenceNo}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Aadhaar (UIDAI):</span>
              <span className="font-mono text-slate-200 font-bold">XXXX-XXXX-{driver.aadhaarLast4 || '8842'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Police Clearance:</span>
              <span className="text-emerald-400 font-bold">Clean Record (PCC)</span>
            </div>
            <div>
              <span className="text-slate-500 block">Primary City:</span>
              <span className="text-slate-200 font-bold">{driver.primaryCity}</span>
            </div>
          </div>
        </div>

        {/* Pricing Rates Bar */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 text-center mb-4">
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-semibold">Hourly Rate</span>
            <div className="font-mono font-extrabold text-sm text-brand-400">₹{driver.hourlyRate}/hr</div>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-semibold">Full Day 8h</span>
            <div className="font-mono font-extrabold text-sm text-amber-400">₹{driver.dailyRate}</div>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-semibold">Outstation</span>
            <div className="font-mono font-extrabold text-sm text-emerald-400">₹{driver.outstationRatePerDay}/day</div>
          </div>
        </div>

        {/* Biography & Skills */}
        <div className="mb-4">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Chauffeur Biography</h4>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
            "{driver.bio}"
          </p>
        </div>

        {/* Transmission & Vehicles Handled */}
        <div className="mb-4 space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Vehicle & Transmission Mastery</h4>
          <div className="flex flex-wrap gap-1.5">
            {driver.transmissionSkills.map(t => (
              <span key={t} className="px-2.5 py-1 rounded-lg bg-slate-800 text-brand-300 text-xs font-semibold flex items-center gap-1">
                ⚙️ {t}
              </span>
            ))}
            {driver.vehicleTypes.map(v => (
              <span key={v} className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 text-xs font-semibold flex items-center gap-1">
                🚗 {v}
              </span>
            ))}
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold">
              🗣️ {driver.languages.join(', ')}
            </span>
          </div>
        </div>

        {/* Ratings Breakdown */}
        <div className="mb-4 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs space-y-2">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Punctuality (On-Time Arrival)</span>
            <span className="font-bold text-amber-400">5.0 / 5.0 ★</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="bg-amber-400 h-full w-[98%]"></div>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Driving Skill & Smooth Braking</span>
            <span className="font-bold text-amber-400">4.9 / 5.0 ★</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="bg-amber-400 h-full w-[96%]"></div>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Politeness & Non-Smoker</span>
            <span className="font-bold text-amber-400">5.0 / 5.0 ★</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="bg-amber-400 h-full w-[100%]"></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => onCallDriver(driver)}
            className="py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs flex items-center justify-center gap-1 transition"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>Call</span>
          </button>
          <button
            onClick={() => onChatDriver(driver)}
            className="py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs flex items-center justify-center gap-1 transition"
          >
            <MessageSquare className="w-4 h-4 text-brand-400" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => {
              onClose();
              onBookDriver(driver);
            }}
            className="col-span-2 py-3 bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Book Chauffeur Now</span>
          </button>
        </div>

      </div>
    </div>
  );
}
