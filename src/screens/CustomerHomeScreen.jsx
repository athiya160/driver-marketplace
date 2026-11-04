import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  Car,
  Search,
  Navigation,
  ShieldCheck,
  Star,
  Sparkles,
  Tag,
  ArrowRight,
  ArrowUpRight,
  Map as MapIcon,
  ChevronDown,
  CheckCircle2,
  Clock4,
  Zap,
  PhoneCall,
  SlidersHorizontal,
  Compass,
  Repeat,
  Plane,
  Briefcase,
  Heart,
  Users,
  Camera,
  Bot
} from 'lucide-react';
import { INDIAN_CITIES, SERVICE_CATEGORIES, VEHICLE_TYPES, TRANSMISSION_TYPES } from '../constants.js';
import { BRAND, THEME } from '../config/branding.js';
import InteractiveMap from '../components/InteractiveMap.jsx';

export default function CustomerHomeScreen({
  onSelectCategory,
  onSearchDrivers,
  onViewDriverDetails,
  selectedCity,
  setSelectedCity,
  bookingForm,
  setBookingForm,
  topDrivers = []
}) {
  const [locating, setLocating] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showInteractiveMap, setShowInteractiveMap] = useState(false);
  const [isImmediate, setIsImmediate] = useState(true); // Immediate vs Scheduled
  const [pinCodeFilter, setPinCodeFilter] = useState('');

  // Auto-detect GPS simulation
  const handleDetectLocation = () => {
    setLocating(true);
    setTimeout(() => {
      setLocating(false);
      setBookingForm(prev => ({
        ...prev,
        pickupAddress: 'Tower 4, DLF The Crest, Sector 54, Golf Course Road, Gurugram',
        pickupCity: selectedCity
      }));
    }, 700);
  };

  // Filter available drivers by city and transmission
  const availableDrivers = topDrivers.filter(d => {
    const matchesCity = !selectedCity || d.primaryCity.toLowerCase().includes(selectedCity.toLowerCase());
    const matchesTrans = !bookingForm.transmissionType || d.transmissionSkills.includes(bookingForm.transmissionType);
    return d.verificationStatus === 'approved' && matchesCity && matchesTrans;
  });

  return (
    <div className="flex flex-col min-h-full pb-24 bg-[#F8FAFC] text-[#172033] font-sans">
      
      {/* Top Header - Chauffeur Marketplace */}
      <div className="p-4 bg-white border-b border-slate-200/90 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          
          {/* Operating City Selector */}
          <div className="relative">
            <button
              onClick={() => setShowCityPicker(!showCityPicker)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-[#0F1E36] hover:bg-slate-200 transition"
            >
              <MapPin className="w-3.5 h-3.5 text-orange-500" />
              <span>{selectedCity}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {/* City Dropdown Menu */}
            {showCityPicker && (
              <div className="absolute top-10 left-0 w-48 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl p-1 z-50 text-xs">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                  Select Operating City
                </div>
                {INDIAN_CITIES.map(city => (
                  <button
                    key={city}
                    onClick={() => {
                      setSelectedCity(city);
                      setBookingForm(prev => ({ ...prev, pickupCity: city }));
                      setShowCityPicker(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition ${
                      selectedCity === city
                        ? 'bg-[#0F1E36] text-white font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Safe Driving Verified Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Police Verified</span>
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="mt-1">
          <h1 className="text-xl font-extrabold tracking-tight text-[#0F1E36] flex items-center justify-between">
            <span>{BRAND.appName}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
              For Your Own Car
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {BRAND.tagline} • Verified personal chauffeurs across India.
          </p>
        </div>
      </div>

      {/* Main Booking Controls Container */}
      <div className="p-4 space-y-4">

        {/* Founding Launch Zero-Commission Showcase Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0B1329] border border-[#D4AF37]/50 p-4 text-white shadow-lg">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-[#D4AF37]/15 blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[11px] font-extrabold text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>FOUNDING LAUNCH • ₹0 PLATFORM COMMISSION</span>
            </div>
            <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
              90 Days / 1,000 Trips
            </span>
          </div>

          <h3 className="text-sm font-extrabold text-white tracking-wide">
            Your Car. Your Journey. 100% Direct to Chauffeur.
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            During Salman's Founding Launch across India, we waive the ₹49 booking fee and 15% platform commission. You pay your verified chauffeur directly via UPI or cash. Zero middleman markup, transparent pricing, verified peace of mind.
          </p>

          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10 text-center">
            <div className="bg-white/5 rounded-2xl p-2 border border-white/5">
              <div className="text-base font-mono font-extrabold text-[#D4AF37]">₹0</div>
              <div className="text-[10px] text-slate-300 font-semibold">Booking Fee</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-2 border border-white/5">
              <div className="text-base font-mono font-extrabold text-[#10B981]">0%</div>
              <div className="text-[10px] text-slate-300 font-semibold">Commission</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-2 border border-white/5">
              <div className="text-base font-mono font-extrabold text-white">100%</div>
              <div className="text-[10px] text-slate-300 font-semibold">To Chauffeur</div>
            </div>
          </div>
        </div>
        
        {/* Booking Card: Immediate vs Scheduled + Location Inputs */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
          
          {/* Immediate vs Scheduled Tab Switcher */}
          <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setIsImmediate(true)}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                isImmediate
                  ? 'bg-white text-[#0F1E36] shadow-sm font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${isImmediate ? 'text-orange-500' : 'text-slate-400'}`} />
              <span>Book Now (Instant)</span>
            </button>
            <button
              onClick={() => setIsImmediate(false)}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                !isImmediate
                  ? 'bg-white text-[#0F1E36] shadow-sm font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock4 className={`w-3.5 h-3.5 ${!isImmediate ? 'text-orange-500' : 'text-slate-400'}`} />
              <span>Schedule For Later</span>
            </button>
          </div>

          {/* Pickup Address Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100"></div>
                <span>Pickup Location</span>
              </label>
              <button
                onClick={handleDetectLocation}
                disabled={locating}
                className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
              >
                <Navigation className={`w-3 h-3 ${locating ? 'animate-spin' : ''}`} />
                <span>{locating ? 'Locating...' : 'Detect GPS'}</span>
              </button>
            </div>
            
            <div className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <input
                type="text"
                value={bookingForm.pickupAddress}
                onChange={(e) => setBookingForm(prev => ({ ...prev, pickupAddress: e.target.value }))}
                placeholder="Enter pickup address, society or office"
                className="w-full bg-transparent text-xs text-[#172033] placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Destination Address Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-100"></div>
                <span>Destination (Optional for local errands)</span>
              </label>
              <button
                onClick={() => setShowInteractiveMap(!showInteractiveMap)}
                className="text-[10px] text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1"
              >
                <MapIcon className="w-3 h-3" />
                <span>{showInteractiveMap ? 'Hide Route' : 'Show Route'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <Navigation className="w-4 h-4 text-rose-500 shrink-0" />
              <input
                type="text"
                value={bookingForm.dropAddress}
                onChange={(e) => setBookingForm(prev => ({ ...prev, dropAddress: e.target.value }))}
                placeholder="Drop address, airport terminal or outstation city"
                className="w-full bg-transparent text-xs text-[#172033] placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Interactive Route Map */}
          {showInteractiveMap && (
            <div className="rounded-2xl overflow-hidden border border-slate-200">
              <InteractiveMap
                pickupAddress={bookingForm.pickupAddress}
                dropAddress={bookingForm.dropAddress}
                height="180px"
              />
            </div>
          )}

          {/* Scheduled Date, Time & Duration (If not immediate) */}
          {!isImmediate && (
            <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2">
              <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
                  <Calendar className="w-3 h-3 text-orange-500" />
                  <span>Date</span>
                </div>
                <input
                  type="date"
                  value={bookingForm.startDate}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full bg-transparent text-xs font-semibold text-[#0F1E36] focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
                  <Clock className="w-3 h-3 text-orange-500" />
                  <span>Time</span>
                </div>
                <input
                  type="time"
                  value={bookingForm.startTime}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full bg-transparent text-xs font-semibold text-[#0F1E36] focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
                  <Sparkles className="w-3 h-3 text-orange-500" />
                  <span>Duration</span>
                </div>
                <select
                  value={bookingForm.durationHours}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, durationHours: Number(e.target.value) }))}
                  className="w-full bg-transparent text-xs font-semibold text-[#0F1E36] focus:outline-none"
                >
                  <option value={2}>2 Hours</option>
                  <option value={4}>4 Hours</option>
                  <option value={8}>8 Hours</option>
                  <option value={12}>12 Hours</option>
                  <option value={24}>Full Day (24h)</option>
                </select>
              </div>
            </div>
          )}

          {/* Customer Vehicle Specifications (Hatchback/Sedan/SUV/Luxury & MT/AT) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Your Vehicle Specifications
              </span>
              <span className="text-[10px] text-orange-600 font-bold">Matches Driver Mastery</span>
            </div>

            {/* Transmission Selector: Automatic vs Manual */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              {TRANSMISSION_TYPES.map(trans => (
                <button
                  key={trans.id}
                  onClick={() => setBookingForm(prev => ({ ...prev, transmissionType: trans.id }))}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    bookingForm.transmissionType === trans.id
                      ? 'bg-orange-50 border-orange-500 text-[#0F1E36] ring-1 ring-orange-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-extrabold text-xs">{trans.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{trans.desc}</div>
                </button>
              ))}
            </div>

            {/* Vehicle Body Type */}
            <div className="grid grid-cols-4 gap-1.5">
              {VEHICLE_TYPES.map(veh => (
                <button
                  key={veh.id}
                  onClick={() => setBookingForm(prev => ({ ...prev, vehicleType: veh.id }))}
                  className={`py-1.5 px-1 rounded-xl border text-center transition flex flex-col items-center ${
                    bookingForm.vehicleType === veh.id
                      ? 'bg-[#0F1E36] text-white border-[#0F1E36] shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Car className="w-3.5 h-3.5 mb-0.5" />
                  <span className="text-[10px] font-bold leading-tight">{veh.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search CTA */}
          <button
            onClick={onSearchDrivers}
            className="w-full min-h-[48px] py-3.5 bg-[#0B1329] hover:bg-[#152347] text-white font-extrabold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99] border border-[#D4AF37]/30"
          >
            <Search className="w-4 h-4 text-[#D4AF37]" />
            <span>Search Verified Drivers in {selectedCity}</span>
            <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
          </button>
        </div>

        {/* 9 Service Categories Grid */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-extrabold text-[#0F1E36] tracking-wide uppercase">
              Driver Rental Categories
            </h2>
            <span className="text-[11px] text-orange-600 font-bold">9 Services</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {SERVICE_CATEGORIES.map(cat => {
              const isSelected = bookingForm.serviceType === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setBookingForm(prev => ({ ...prev, serviceType: cat.id }));
                    onSelectCategory(cat.id);
                  }}
                  className={`p-3 rounded-2xl border text-left relative transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-orange-50/60 border-orange-500 ring-2 ring-orange-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  {cat.badge && (
                    <span className="absolute top-2 right-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                      {cat.badge}
                    </span>
                  )}

                  <div>
                    <h3 className="font-extrabold text-xs text-[#0F1E36]">{cat.name}</h3>
                    <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{cat.tagline}</p>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-400">from </span>
                      <span className="font-mono font-extrabold text-sm text-orange-600">₹{cat.basePrice}</span>
                    </div>
                    <span className="text-[9px] text-slate-400">{cat.unit}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Available Verified Drivers in Selected City */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Verified Drivers Available in {selectedCity} ({availableDrivers.length})
            </h3>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Ready Now
            </span>
          </div>

          <div className="space-y-2.5">
            {availableDrivers.slice(0, 3).map(drv => (
              <div
                key={drv.id}
                className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm hover:border-orange-300 transition"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={drv.photoUrl}
                    alt={drv.fullName}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-xs text-[#0F1E36] truncate">{drv.fullName}</h4>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                          Verified ✓
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{drv.rating}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {drv.experienceYears} Years Experience • {drv.languages.join(', ')}
                    </p>

                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {drv.transmissionSkills.map(t => (
                        <span key={t} className="text-[9px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                          ⚙️ {t}
                        </span>
                      ))}
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                        🚗 {drv.vehicleTypes.join('/')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-extrabold text-sm text-[#0F1E36]">₹{drv.hourlyRate}</span>
                    <span className="text-[10px] text-slate-500">/hr • ₹{drv.dailyRate}/day</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewDriverDetails(drv)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => onViewDriverDetails(drv)}
                      className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm"
                    >
                      Book Driver
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Core Startup Differentiators Preview */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#D4AF37]">
                Executive Chauffeur Hospitality
              </span>
              <h3 className="font-extrabold text-sm text-[#0B1329]">5 Core Platform Differentiators</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-[#FAF9F6] border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-[#0B1329] text-[#D4AF37] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#0B1329]">1. Digital Driver Passport</h4>
                  <span className="text-[9px] text-emerald-600 font-bold">100% Verified</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Complete transparency: Aadhaar biometric KYC, Commercial DL authenticity stamp & PCC police clearance.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-[#FAF9F6] border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-[#0B1329] text-[#D4AF37] flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#D4AF37]">2. My Preferred Chauffeur</h4>
                  <span className="text-[9px] text-[#D4AF37] font-bold">VIP Feature</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Loved a chauffeur's driving and punctuality? Save to your favorites to re-book with priority dispatch.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-[#FAF9F6] border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-[#0B1329] text-[#D4AF37] flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#0B1329]">3. Family Circle Telemetry</h4>
                  <span className="text-[9px] text-indigo-600 font-bold">Live Sharing</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Share live GPS, chauffeur credentials and trip progress automatically with family members or spouses.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-[#FAF9F6] border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-[#0B1329] text-[#D4AF37] flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#0B1329]">4. Smart Car Handover Inspection</h4>
                  <span className="text-[9px] text-slate-600 font-bold">Pre & Post Photos</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Digital vehicle check before departure: timestamped odometer, fuel level, and scratch inspection.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-[#FAF9F6] border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-[#0B1329] text-[#D4AF37] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#0B1329]">5. Multilingual AI Concierge</h4>
                  <span className="text-[9px] text-emerald-600 font-bold">Kannada • English • Hindi</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Instant conversational assistance for Bengaluru traffic estimates, toll rates, and booking guidance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Confidence & Safety Badges */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="font-extrabold text-[#0F1E36]">Why Hire With Our Marketplace?</span>
            <span className="text-[10px] text-emerald-600 font-bold">100% Peace of Mind</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Police Verified (PCC)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Manual & Automatic Mastery</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Commercial DL Authenticated</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>4-Digit Start OTP Security</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
