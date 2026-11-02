import React, { useState } from 'react';
import {
  ArrowLeft,
  Filter,
  Star,
  ShieldCheck,
  Phone,
  MessageSquare,
  CheckCircle2,
  Car,
  Sparkles
} from 'lucide-react';
import { BRAND } from '../config/branding.js';

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
    <div className="flex flex-col min-h-full pb-20 bg-[#F8FAFC] text-[#172033]">
      
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 text-[#0F1E36] hover:bg-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-extrabold text-sm text-[#0F1E36]">Verified Drivers</h1>
            <p className="text-[11px] text-slate-500">{filtered.length} Chauffeurs in {city}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Police Verified</span>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="p-3 bg-white/80 border-b border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
        <span className="text-slate-500 text-[10px] uppercase font-bold shrink-0 flex items-center gap-1">
          <Filter className="w-3 h-3 text-orange-500" /> Filters:
        </span>
        
        {/* Transmission filter */}
        <button
          onClick={() => setFilterTrans(filterTrans === 'all' ? 'Automatic' : filterTrans === 'Automatic' ? 'Manual' : 'all')}
          className={`px-3 py-1 rounded-full border shrink-0 transition text-xs ${
            filterTrans !== 'all'
              ? 'bg-[#0F1E36] border-[#0F1E36] text-white font-bold'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {filterTrans === 'all' ? 'Gear: Any' : `Gear: ${filterTrans}`}
        </button>

        {/* Rating filter */}
        <button
          onClick={() => setFilterRating(filterRating === 'all' ? '4.8' : 'all')}
          className={`px-3 py-1 rounded-full border shrink-0 transition text-xs ${
            filterRating !== 'all'
              ? 'bg-orange-500 text-white font-bold border-orange-500'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {filterRating === 'all' ? 'Rating: Any' : '★ 4.8+ Rated'}
        </button>

        {/* Experience filter */}
        <button
          onClick={() => setFilterExp(filterExp === 'all' ? '8' : 'all')}
          className={`px-3 py-1 rounded-full border shrink-0 transition text-xs ${
            filterExp !== 'all'
              ? 'bg-[#0F1E36] text-white font-bold border-[#0F1E36]'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {filterExp === 'all' ? 'Experience: Any' : '8+ Yrs Veteran'}
        </button>
      </div>

      {/* Driver Cards List */}
      <div className="p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <Car className="w-12 h-12 text-slate-400 mx-auto mb-2" />
            <h3 className="font-bold text-[#0F1E36] text-sm">No Drivers Match Criteria</h3>
            <p className="text-xs text-slate-500 mt-1">Try resetting the transmission, experience or rating filter.</p>
          </div>
        ) : (
          filtered.map(driver => (
            <div
              key={driver.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 shadow-sm hover:shadow-md transition"
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
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                    />
                    {driver.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" title="Online now"></span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="font-extrabold text-sm text-[#0F1E36] hover:text-orange-600 transition">{driver.fullName}</h2>
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold" title="Verified Aadhaar & DL">
                        ✓
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex items-center text-amber-500 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="ml-1">{driver.rating}</span>
                      </div>
                      <span className="text-slate-300 text-[10px]">•</span>
                      <span className="text-slate-500 text-[11px] font-medium">{driver.totalTrips} Trips Done</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {driver.experienceYears} Years Exp • {driver.primaryCity}
                    </div>
                  </div>
                </div>

                {/* Price Display */}
                <div className="text-right shrink-0">
                  <div className="font-mono font-extrabold text-base text-orange-600">
                    ₹{driver.hourlyRate}<span className="text-xs text-slate-500 font-sans">/hr</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    ₹{driver.dailyRate}/day
                  </div>
                </div>
              </div>

              {/* Bio snippet */}
              <p
                onClick={() => onViewDriverDetails(driver)}
                className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-3 line-clamp-2 cursor-pointer"
              >
                "{driver.bio}"
              </p>

              {/* Skill Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {driver.transmissionSkills.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                    ⚙️ {t}
                  </span>
                ))}
                {driver.vehicleTypes.slice(0, 3).map(v => (
                  <span key={v} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                    🚗 {v}
                  </span>
                ))}
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] border border-slate-200">
                  🗣️ {driver.languages.join(', ')}
                </span>
              </div>

              {/* Police Clearance & DL Badge */}
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 mb-3 text-[10px]">
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>DL: {driver.drivingLicenceNo}</span>
                </div>
                <button
                  onClick={() => onViewDriverDetails(driver)}
                  className="text-orange-600 font-bold hover:underline flex items-center gap-0.5"
                >
                  Full Bio & Reviews →
                </button>
              </div>

              {/* Action Buttons: Call / Chat / Book Now */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setContactModal({ type: 'call', driver })}
                  className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition"
                  title="Masked Phone Call"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Call</span>
                </button>
                <button
                  onClick={() => setContactModal({ type: 'chat', driver })}
                  className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition"
                  title="In-App Masked Chat"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
                  <span className="hidden sm:inline">Chat</span>
                </button>
                <button
                  onClick={() => onSelectDriver(driver)}
                  className="col-span-2 py-2.5 bg-[#0F1E36] hover:bg-[#1A2F45] text-white font-extrabold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  <span>Book This Driver</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Masked Call / Chat Modal */}
      {contactModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl p-5 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3">
              {contactModal.type === 'call' ? <Phone className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </div>
            <h3 className="font-extrabold text-base text-[#0F1E36]">
              {contactModal.type === 'call' ? 'Masked Virtual Calling' : 'Secure In-App Chat'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Connecting with <strong className="text-[#0F1E36]">{contactModal.driver.fullName}</strong>.
              Your real mobile number is 100% masked for privacy & safety under Indian DPDP Act.
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 mb-4">
              Virtual Hotline: {BRAND.virtualHotline}
            </div>
            <button
              onClick={() => setContactModal(null)}
              className="w-full py-2.5 bg-[#0F1E36] hover:bg-[#1A2F45] text-white font-bold text-xs rounded-xl shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
