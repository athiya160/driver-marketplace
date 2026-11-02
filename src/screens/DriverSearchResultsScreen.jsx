import React, { useState } from 'react';
import {
  ArrowLeft,
  Filter,
  Star,
  ShieldCheck,
  Phone,
  MessageSquare,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  Car,
  ChevronRight
} from 'lucide-react';

export default function DriverSearchResultsScreen({
  onBack,
  onSelectDriver,
  onViewDriverDetails,
  drivers = [],
  city = 'Delhi NCR',
  transmission = 'Automatic'
}) {
  const [filterRating, setFilterRating] = useState('all');
  const [filterTrans, setFilterTrans] = useState(transmission || 'all');
  const [filterExp, setFilterExp] = useState('all'); // 'all', '5+', '8+'
  const [contactModal, setContactModal] = useState(null);

  // Apply in-memory filtering
  let filtered = drivers.filter(d => d.verificationStatus === 'approved');

  if (filterRating !== 'all') {
    filtered = filtered.filter(d => d.rating >= Number(filterRating));
  }
  if (filterTrans !== 'all') {
    filtered = filtered.filter(d => d.transmissionSkills.includes(filterTrans));
  }
  if (filterExp !== 'all') {
    filtered = filtered.filter(d => d.experienceYears >= Number(filterExp));
  }

  return (
    <div className="flex flex-col min-h-full pb-20 bg-slate-950 text-slate-100">
      
      {/* Top Navigation Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-extrabold text-sm text-white">Verified Drivers</h1>
            <p className="text-[11px] text-slate-400">{filtered.length} Chauffeurs in {city}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified Only</span>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
        <span className="text-slate-500 text-[10px] uppercase font-bold shrink-0 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Filters:
        </span>
        
        {/* Transmission filter */}
        <button
          onClick={() => setFilterTrans(filterTrans === 'all' ? 'Automatic' : filterTrans === 'Automatic' ? 'Manual' : 'all')}
          className={`px-3 py-1 rounded-full border shrink-0 transition ${
            filterTrans !== 'all'
              ? 'bg-brand-600 border-brand-500 text-white font-bold'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}
        >
          {filterTrans === 'all' ? 'Gear: Any' : `Gear: ${filterTrans}`}
        </button>

        {/* Rating filter */}
        <button
          onClick={() => setFilterRating(filterRating === 'all' ? '4.8' : 'all')}
          className={`px-3 py-1 rounded-full border shrink-0 transition ${
            filterRating !== 'all'
              ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}
        >
          {filterRating === 'all' ? 'Rating: Any' : '★ 4.8+ Rated'}
        </button>

        {/* Experience filter */}
        <button
          onClick={() => setFilterExp(filterExp === 'all' ? '8' : 'all')}
          className={`px-3 py-1 rounded-full border shrink-0 transition ${
            filterExp !== 'all'
              ? 'bg-purple-600 text-white font-bold border-purple-500'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}
        >
          {filterExp === 'all' ? 'Experience: Any' : '8+ Yrs Veteran'}
        </button>
      </div>

      {/* Driver Cards List */}
      <div className="p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 rounded-3xl p-6 border border-slate-800">
            <Car className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <h3 className="font-bold text-white text-sm">No Drivers Match Criteria</h3>
            <p className="text-xs text-slate-400 mt-1">Try resetting the transmission, experience or rating filter.</p>
          </div>
        ) : (
          filtered.map(driver => (
            <div
              key={driver.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-4 shadow-xl transition"
            >
              {/* Header: Photo, Name, Rating & Badges */}
              <div
                onClick={() => onViewDriverDetails(driver)}
                className="flex items-start justify-between gap-3 mb-3 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={driver.photoUrl}
                      alt={driver.fullName}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-brand-500/30"
                    />
                    {driver.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" title="Online now"></span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="font-extrabold text-sm text-white hover:text-brand-400 transition">{driver.fullName}</h2>
                      <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-bold" title="Verified Aadhaar & DL">
                        ✓
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex items-center text-amber-400 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="ml-1">{driver.rating}</span>
                      </div>
                      <span className="text-slate-500 text-[10px]">•</span>
                      <span className="text-slate-400 text-[11px] font-medium">{driver.totalTrips} Trips Done</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {driver.experienceYears} Years Exp • {driver.primaryCity}
                    </div>
                  </div>
                </div>

                {/* Price Display */}
                <div className="text-right shrink-0">
                  <div className="font-mono font-extrabold text-base text-brand-400">
                    ₹{driver.hourlyRate}<span className="text-xs text-slate-400 font-sans">/hr</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    ₹{driver.dailyRate}/day
                  </div>
                </div>
              </div>

              {/* Bio snippet */}
              <p
                onClick={() => onViewDriverDetails(driver)}
                className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800/60 mb-3 line-clamp-2 cursor-pointer"
              >
                "{driver.bio}"
              </p>

              {/* Skill Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {driver.transmissionSkills.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-semibold">
                    ⚙️ {t}
                  </span>
                ))}
                {driver.vehicleTypes.slice(0, 3).map(v => (
                  <span key={v} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-semibold">
                    🚗 {v}
                  </span>
                ))}
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px]">
                  🗣️ {driver.languages.join(', ')}
                </span>
              </div>

              {/* Police Clearance & DL Badge */}
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-950 border border-slate-800/80 mb-3 text-[10px]">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>DL: {driver.drivingLicenceNo}</span>
                </div>
                <button
                  onClick={() => onViewDriverDetails(driver)}
                  className="text-brand-400 font-bold hover:underline flex items-center gap-0.5"
                >
                  Full Bio & Reviews →
                </button>
              </div>

              {/* Action Buttons: Call / Chat / Book Now */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setContactModal({ type: 'call', driver })}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition"
                  title="Masked Phone Call"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Call</span>
                </button>
                <button
                  onClick={() => setContactModal({ type: 'chat', driver })}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition"
                  title="In-App Masked Chat"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-brand-400" />
                  <span className="hidden sm:inline">Chat</span>
                </button>
                <button
                  onClick={() => onSelectDriver(driver)}
                  className="col-span-2 py-2.5 bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-extrabold text-xs rounded-xl transition shadow-lg shadow-brand-600/30 flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Book This Driver</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Masked Call / Chat Modal */}
      {contactModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-5 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-3">
              {contactModal.type === 'call' ? <Phone className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </div>
            <h3 className="font-extrabold text-base text-white">
              {contactModal.type === 'call' ? 'Masked Virtual Calling' : 'Secure In-App Chat'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Connecting with <strong className="text-white">{contactModal.driver.fullName}</strong>.
              Your real mobile number is 100% masked for privacy & safety under Indian DPDP Act.
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 mb-4">
              Virtual Hotline: +91 800-SARATHI-DRV
            </div>
            <button
              onClick={() => setContactModal(null)}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
