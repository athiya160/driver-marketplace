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
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  Shield
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
  const [filterExp, setFilterExp] = useState('all'); // 'all', '5', '8'
  const [contactModal, setContactModal] = useState(null);

  // Apply in-memory filtering
  let filtered = drivers.filter(d => d.verificationStatus === 'approved');

  if (filterRating !== 'all') {
    filtered = filtered.filter(d => d.rating >= Number(filterRating));
  }
  if (filterTrans !== 'all') {
    filtered = filtered.filter(d => d.transmissionSkills && d.transmissionSkills.includes(filterTrans));
  }
  if (filterExp !== 'all') {
    filtered = filtered.filter(d => d.experienceYears >= Number(filterExp));
  }

  const handleResetFilters = () => {
    setFilterRating('all');
    setFilterTrans('all');
    setFilterExp('all');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Navigation */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-100 text-[#0B1329] hover:bg-slate-200 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Back to Booking"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-extrabold text-lg text-[#0B1329] font-display">
              Verified Chauffeurs in {city}
            </h1>
            <p className="text-xs text-slate-500">
              Showing {filtered.length} background-verified personal drivers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Police & DL Verified</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Filter Sidebar (Desktop) + Right Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Filter Sidebar (Visible on Desktop, Horizontal Scroll on Mobile) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-extrabold text-xs text-[#0B1329] flex items-center gap-1.5 uppercase tracking-wider">
                <SlidersHorizontal className="w-4 h-4 text-[#D4AF37]" />
                <span>Filter Drivers</span>
              </span>
              <button
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-slate-400 hover:text-[#0B1329] flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Transmission Filter */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Car Transmission
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
                {['all', 'Manual', 'Automatic'].map(tOption => (
                  <button
                    key={tOption}
                    onClick={() => setFilterTrans(tOption)}
                    className={`py-2 rounded-xl text-center font-bold transition text-xs ${
                      filterTrans === tOption
                        ? 'bg-[#0B1329] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tOption === 'all' ? 'Any' : tOption}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Minimum Rating
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
                {[
                  { id: 'all', label: 'All' },
                  { id: '4.8', label: '★ 4.8+' },
                  { id: '4.9', label: '★ 4.9+' }
                ].map(rOption => (
                  <button
                    key={rOption.id}
                    onClick={() => setFilterRating(rOption.id)}
                    className={`py-2 rounded-xl text-center font-bold transition text-xs ${
                      filterRating === rOption.id
                        ? 'bg-[#0B1329] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {rOption.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Filter */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Experience
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
                {[
                  { id: 'all', label: 'All' },
                  { id: '5', label: '5+ Yrs' },
                  { id: '8', label: '8+ Yrs' }
                ].map(eOption => (
                  <button
                    key={eOption.id}
                    onClick={() => setFilterExp(eOption.id)}
                    className={`py-2 rounded-xl text-center font-bold transition text-xs ${
                      filterExp === eOption.id
                        ? 'bg-[#0B1329] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {eOption.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy & Safe Calling Guarantee */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-xs">
              <span className="font-bold text-[#0B1329] flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Masked Contact Guarantee
              </span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Your mobile phone number is protected under Indian DPDP Act. Drivers only receive masked virtual routing.
              </p>
            </div>

          </div>
        </div>

        {/* Right Main Area: Driver Cards Grid */}
        <div className="lg:col-span-9 space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xs space-y-3">
              <Car className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-[#0B1329] text-base">No Chauffeurs Match Your Filters</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try loosening your transmission or experience filter to view all available verified drivers in {city}.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-[#0B1329] text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(driver => (
                <div
                  key={driver.id}
                  className="bg-white border border-slate-200/90 hover:border-[#D4AF37]/60 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    
                    {/* Header: Photo, Name, Rating & Online Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="relative">
                        <img
                          src={driver.photoUrl}
                          alt={driver.fullName}
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
                        />
                        {driver.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#10B981] border-2 border-white" title="Online now" />
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 font-mono font-bold text-xs text-[#0B1329]">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{driver.rating}</span>
                          <span className="text-slate-400 font-normal text-[10px]">({driver.totalTrips})</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold mt-1 inline-block">
                          Verified Chauffeur
                        </span>
                      </div>
                    </div>

                    {/* Driver Identity & Details */}
                    <div>
                      <h3 className="font-extrabold text-base text-[#0B1329] font-display flex items-center gap-1.5">
                        <span>{driver.fullName}</span>
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold" title="Police & DL Verified">✓</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {driver.experienceYears} Years Driving • {driver.primaryCity}
                      </p>
                    </div>

                    {/* Bio Snippet */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      "{driver.bio}"
                    </p>

                    {/* Transmission & Skill Badges */}
                    <div className="flex flex-wrap gap-1 text-[10px] font-semibold">
                      {driver.transmissionSkills?.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {t}
                        </span>
                      ))}
                      {driver.vehicleTypes?.slice(0, 2).map(v => (
                        <span key={v} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {v}
                        </span>
                      ))}
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                        {driver.languages?.join(', ')}
                      </span>
                    </div>

                    {/* Verification & License Note */}
                    <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-[10px]">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>PCC & DL Verified</span>
                      </div>
                      <button
                        onClick={() => onViewDriverDetails(driver)}
                        className="text-[#D4AF37] font-bold hover:underline"
                      >
                        Driver Passport →
                      </button>
                    </div>

                  </div>

                  {/* Card Actions: Call, Chat & Book Button */}
                  <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Standard Rate</span>
                      <span className="font-mono font-bold text-sm text-[#0B1329]">₹{driver.hourlyRate}/hr</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => setContactModal({ type: 'call', driver })}
                        className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition min-h-[44px]"
                        title="Masked Phone Call"
                      >
                        <Phone className="w-4 h-4 text-emerald-600" />
                        <span className="hidden sm:inline">Call</span>
                      </button>
                      <button
                        onClick={() => setContactModal({ type: 'chat', driver })}
                        className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition min-h-[44px]"
                        title="Secure In-App Chat"
                      >
                        <MessageSquare className="w-4 h-4 text-amber-500" />
                        <span className="hidden sm:inline">Chat</span>
                      </button>
                      <button
                        onClick={() => onSelectDriver(driver)}
                        className="col-span-2 py-2.5 bg-[#0B1329] hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5 min-h-[44px]"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Book Chauffeur</span>
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Masked Call / Chat Modal */}
      {contactModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#D4AF37] flex items-center justify-center mx-auto">
              {contactModal.type === 'call' ? <Phone className="w-6 h-6 text-emerald-600" /> : <MessageSquare className="w-6 h-6 text-amber-500" />}
            </div>
            <h3 className="font-extrabold text-base text-[#0B1329] font-display">
              {contactModal.type === 'call' ? 'Masked Virtual Calling' : 'Secure In-App Chat'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Connecting with <strong className="text-[#0B1329]">{contactModal.driver.fullName}</strong>.
              Your personal phone number is 100% masked for safety under Indian DPDP Act.
            </p>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 font-mono text-xs text-slate-700">
              Virtual Hotline: {BRAND.supportPhone}
            </div>
            <button
              onClick={() => setContactModal(null)}
              className="w-full py-3 bg-[#0B1329] hover:bg-slate-900 text-white font-bold text-xs rounded-2xl shadow-sm min-h-[44px]"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
