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
  Users,
  Camera,
  Award,
  ChevronRight,
  Shield,
  HelpCircle,
  KeyRound
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
  topDrivers = [],
  onOpenPhotoUpload
}) {
  const [locating, setLocating] = useState(false);
  const [showInteractiveMap, setShowInteractiveMap] = useState(false);
  const [isImmediate, setIsImmediate] = useState(true); // Immediate vs Scheduled
  const [activeFaq, setActiveFaq] = useState(null);

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
    }, 600);
  };

  // Filter available drivers by city and transmission
  const availableDrivers = topDrivers.filter(d => {
    const matchesCity = !selectedCity || (d.primaryCity && d.primaryCity.toLowerCase().includes(selectedCity.toLowerCase()));
    const matchesTrans = !bookingForm.transmissionType || (d.transmissionSkills && d.transmissionSkills.includes(bookingForm.transmissionType));
    return d.verificationStatus === 'approved' && matchesCity && matchesTrans;
  });

  const faqs = [
    {
      q: 'Does the chauffeur drive my personal car?',
      a: 'Yes, exactly! Sarathi is a personal chauffeur service designed for your own vehicle (Hatchback, Sedan, SUV, EV or Luxury). Our background-verified drivers pilot your car safely so you can relax, work, or enjoy your journey.'
    },
    {
      q: 'How does the 4-digit OTP trip security work?',
      a: 'When you confirm a booking, a unique 4-digit security code is generated. Your assigned chauffeur cannot start the trip or meter until they arrive at your vehicle and you verbally provide this OTP. This ensures no unauthorized person can start your booking.'
    },
    {
      q: 'What is the Founding Launch ₹0 Platform Fee policy?',
      a: 'To celebrate our pan-India launch starting in Bengaluru, we waive the standard ₹49 convenience fee and take 0% platform commission for 90 days / 1,000 trips. You pay your driver 100% of their earnings directly via UPI or cash.'
    },
    {
      q: 'Are your drivers trained for both Manual and Automatic cars?',
      a: 'Yes. Every chauffeur profile clearly lists their transmission certifications (Manual, Automatic, or both). Our booking engine matches your car type so only certified drivers are dispatched.'
    }
  ];

  return (
    <div className="space-y-12 md:space-y-16">
      
      {/* =========================================================================
          SECTION 1: HERO & INTERACTIVE BOOKING ENGINE (DESKTOP 2-COL / MOBILE 1-COL)
         ========================================================================= */}
      <section className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Brand Mission, Value Proposition & Trust Badges */}
          <div className="lg:col-span-7 space-y-6 pt-2">
            
            {/* Top Eyebrow Badge */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#0B1329] border border-[#D4AF37]/50 text-xs font-bold text-white shadow-sm">
              <img src="/sarathi-badge.png" alt="Sarathi Logo" className="w-5 h-5 object-contain" />
              <span className="font-semibold text-amber-200">Sarathi Global Rentals • Pan-India Chauffeur Marketplace</span>
            </div>

            {/* Primary Headline */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0B1329] tracking-tight font-display leading-[1.15]">
                Professional Chauffeurs for Your Own Vehicle.
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
                Skip traffic exhaustion, commute smoothly, or travel intercity with peace of mind. Hire background-verified personal drivers trained in manual, automatic, electric (EV), and luxury cars.
              </p>
            </div>

            {/* Trust Pillars Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-[#0B1329]">100% Police Verified</h4>
                  <p className="text-[11px] text-slate-500">Commercial DL & Aadhaar checked</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-[#0B1329]">Manual & Automatic</h4>
                  <p className="text-[11px] text-slate-500">Skill-matched to your transmission</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-[#0B1329]">4-Digit Trip OTP</h4>
                  <p className="text-[11px] text-slate-500">Secure trip start handshake</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-[#0B1329]">Zero Surge Guarantee</h4>
                  <p className="text-[11px] text-slate-500">Predictable, transparent hourly rates</p>
                </div>
              </div>
            </div>

            {/* Founding Launch Zero-Commission Showcase Banner */}
            <div className="rounded-3xl bg-[#0B1329] border border-[#D4AF37]/50 p-5 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 rounded-full bg-[#D4AF37]/15 blur-2xl pointer-events-none" />
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-xs font-bold text-[#D4AF37]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>FOUNDING LAUNCH • ₹0 PLATFORM COMMISSION</span>
                </div>
                <span className="text-[11px] font-bold text-slate-300 bg-white/10 px-3 py-0.5 rounded-full border border-white/10">
                  Bengaluru Pilot • 90 Days / 1,000 Trips
                </span>
              </div>
              <div className="flex items-center gap-4 my-2">
                <img
                  src="/sarathi-badge.png"
                  alt="Sarathi Emblem"
                  className="w-14 h-14 object-contain shrink-0 drop-shadow-lg"
                />
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-wide">
                    Sarathi Global Rentals • 100% Payout to Chauffeur
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    Your Car. Your Journey. Verified personal chauffeurs with ₹0 platform commission during the launch pilot.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10 text-center">
                <div className="bg-white/5 rounded-2xl p-2.5 border border-white/5">
                  <div className="text-lg font-mono font-black text-[#D4AF37]">₹0</div>
                  <div className="text-[10px] text-slate-300 font-semibold uppercase">Booking Fee</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-2.5 border border-white/5">
                  <div className="text-lg font-mono font-black text-[#10B981]">0%</div>
                  <div className="text-[10px] text-slate-300 font-semibold uppercase">Platform Take</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-2.5 border border-white/5">
                  <div className="text-lg font-mono font-black text-white">100%</div>
                  <div className="text-[10px] text-slate-300 font-semibold uppercase">Direct to Driver</div>
                </div>
              </div>
            </div>

            {/* Quick 3-Step How It Works Mini-Bar */}
            <div className="p-4 bg-white/70 border border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">How Sarathi Works:</span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0B1329] text-white flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                  <span className="font-semibold text-slate-700">Choose Package</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0B1329] text-white flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                  <span className="font-semibold text-slate-700">Matched with Driver</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0B1329] text-white flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                  <span className="font-semibold text-slate-700">Share 4-Digit OTP</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Booking Card */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-900/5 space-y-4">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-base text-[#0B1329] font-display">Book a Chauffeur</h3>
                  <p className="text-xs text-slate-500">Operating in {selectedCity}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                  {availableDrivers.length} Drivers Online
                </span>
              </div>

              {/* Instant vs Scheduled Switcher */}
              <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setIsImmediate(true)}
                  className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
                    isImmediate ? 'bg-white text-[#0B1329] shadow-xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Zap className={`w-3.5 h-3.5 ${isImmediate ? 'text-amber-500' : 'text-slate-400'}`} />
                  <span>Book Now</span>
                </button>
                <button
                  onClick={() => setIsImmediate(false)}
                  className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
                    !isImmediate ? 'bg-white text-[#0B1329] shadow-xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Clock4 className={`w-3.5 h-3.5 ${!isImmediate ? 'text-amber-500' : 'text-slate-400'}`} />
                  <span>Schedule Ahead</span>
                </button>
              </div>

              {/* Service Category Tabs */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Select Service
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {SERVICE_CATEGORIES.slice(0, 3).map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setBookingForm(prev => ({ ...prev, serviceType: cat.id }))}
                      className={`p-2.5 rounded-2xl border text-center transition ${
                        bookingForm.serviceType === cat.id
                          ? 'bg-[#0B1329] border-[#0B1329] text-white font-bold shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold text-xs">{cat.name.split(' ')[0]}</div>
                      <div className={`text-[10px] ${bookingForm.serviceType === cat.id ? 'text-[#D4AF37]' : 'text-slate-400'}`}>
                        {cat.basePrice}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pickup Address */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
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
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-[#0B1329] transition">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <input
                    type="text"
                    value={bookingForm.pickupAddress}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, pickupAddress: e.target.value }))}
                    placeholder="Enter pickup society, street or building"
                    className="w-full bg-transparent text-xs text-[#172033] focus:outline-none placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Destination Address */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Destination (Optional for Hourly)</span>
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-[#0B1329] transition">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <input
                    type="text"
                    value={bookingForm.dropAddress}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, dropAddress: e.target.value }))}
                    placeholder="Enter destination, landmark or airport terminal"
                    className="w-full bg-transparent text-xs text-[#172033] focus:outline-none placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Transmission & Duration Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Transmission (Manual vs Automatic) */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Car Transmission
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setBookingForm(prev => ({ ...prev, transmissionType: 'Manual' }))}
                      className={`py-2 rounded-xl font-bold text-center transition ${
                        bookingForm.transmissionType === 'Manual'
                          ? 'bg-[#0B1329] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Manual
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingForm(prev => ({ ...prev, transmissionType: 'Automatic' }))}
                      className={`py-2 rounded-xl font-bold text-center transition ${
                        bookingForm.transmissionType === 'Automatic'
                          ? 'bg-[#0B1329] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Automatic
                    </button>
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Rental Duration
                  </label>
                  <select
                    value={bookingForm.durationHours}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, durationHours: Number(e.target.value) }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-[#0B1329] focus:outline-none focus:border-[#0B1329]"
                  >
                    <option value={2}>2 Hours (20 km included)</option>
                    <option value={4}>4 Hours (40 km included)</option>
                    <option value={8}>8 Hours (80 km included)</option>
                    <option value={12}>12 Hours (120 km included)</option>
                  </select>
                </div>
              </div>

              {/* Vehicle Type (Sedan, SUV, Luxury) */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Vehicle Type
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {['Hatchback', 'Sedan', 'SUV', 'Luxury'].map(vType => (
                    <button
                      key={vType}
                      type="button"
                      onClick={() => setBookingForm(prev => ({ ...prev, vehicleType: vType }))}
                      className={`py-2 rounded-xl border text-center transition font-semibold ${
                        bookingForm.vehicleType === vType
                          ? 'bg-[#0B1329] text-white border-[#0B1329]'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {vType}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                onClick={onSearchDrivers}
                className="w-full py-4 rounded-2xl bg-[#0B1329] hover:bg-slate-900 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-slate-900/20 transition flex items-center justify-center gap-2 group min-h-[48px]"
              >
                <span>Find & Book Verified Chauffeur</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="text-center pt-1 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>₹0 Booking Fee Applied • Direct Chauffeur Settlement</span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 2: CHAUFFEUR SERVICE CATEGORIES (RESPONSIVE 4-CARD GRID)
         ========================================================================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Tailored to Your Journey</span>
            <h2 className="text-2xl font-black text-[#0B1329] font-display tracking-tight mt-0.5">
              Chauffeur Services for Every Need
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-md">
            Whether running daily city errands, heading to the airport, or embarking on a family vacation, our drivers are ready.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICE_CATEGORIES.map(cat => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-[#D4AF37]/60 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0B1329] text-[#D4AF37] flex items-center justify-center shadow-md font-bold group-hover:scale-105 transition-transform">
                  {cat.id === 'hourly' && <Clock className="w-6 h-6" />}
                  {cat.id === 'airport' && <Plane className="w-6 h-6" />}
                  {cat.id === 'outstation' && <Compass className="w-6 h-6" />}
                  {cat.id === 'corporate' && <Briefcase className="w-6 h-6" />}
                  {cat.id === 'oneway' && <Repeat className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#0B1329] group-hover:text-amber-700 transition">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Starting from</span>
                  <span className="font-mono font-bold text-sm text-[#0B1329]">{cat.basePrice}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#0B1329] group-hover:text-white flex items-center justify-center text-slate-600 transition">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: VERIFIED CHAUFFEURS SPOTLIGHT (RESPONSIVE GRID)
         ========================================================================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> 100% Background Screened
            </span>
            <h2 className="text-2xl font-black text-[#0B1329] font-display tracking-tight mt-0.5">
              Featured Verified Chauffeurs in {selectedCity}
            </h2>
          </div>
          <button
            onClick={onSearchDrivers}
            className="text-xs font-bold text-[#0B1329] hover:text-amber-700 transition flex items-center gap-1"
          >
            <span>View All Drivers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {topDrivers.slice(0, 4).map(drv => (
            <div
              key={drv.id}
              className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                
                {/* Header: Photo, Name, Rating & Online status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="relative">
                    <img
                      src={drv.photoUrl}
                      alt={drv.fullName}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                    />
                    {drv.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#10B981] border-2 border-white" title="Online now" />
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 font-mono font-bold text-xs text-[#0B1329]">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{drv.rating}</span>
                      <span className="text-slate-400 font-normal text-[10px]">({drv.totalTrips})</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Verified Chauffeur</span>
                  </div>
                </div>

                {/* Chauffeur Name & Certifications */}
                <div>
                  <h4 className="font-extrabold text-sm text-[#0B1329] flex items-center gap-1.5">
                    <span>{drv.fullName}</span>
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold" title="Police & DL Verified">✓</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {drv.experienceYears} Years Experience • {drv.primaryCity}
                  </p>
                </div>

                {/* Transmission & Skill Badges */}
                <div className="flex flex-wrap gap-1 text-[10px] font-semibold">
                  {drv.transmissionSkills?.map(skill => (
                    <span key={skill} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {skill}
                    </span>
                  ))}
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                    PCC Verified
                  </span>
                </div>

              </div>

              {/* Card Footer: Rates & Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Standard Rate</span>
                  <span className="font-mono font-bold text-xs text-[#0B1329]">₹{drv.hourlyRate}/hr</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onViewDriverDetails(drv)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
                  >
                    Passport
                  </button>
                  <button
                    onClick={() => {
                      setBookingForm(prev => ({ ...prev, selectedDriverId: drv.id }));
                      onSearchDrivers();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#0B1329] text-white text-xs font-bold hover:bg-slate-900 transition"
                  >
                    Book
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: SAFETY & DRIVER PASSPORT SHOWCASE
         ========================================================================= */}
      <section className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-10 shadow-xs">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
            Trust & Security Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0B1329] font-display tracking-tight">
            The Sarathi Chauffeur Passport™ Standard
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            We understand that entrusting your vehicle to another person requires absolute confidence. Every driver on our marketplace completes a rigorous 3-tier background verification process.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-slate-200 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#0B1329] text-[#D4AF37] flex items-center justify-center font-bold">
              1
            </div>
            <h4 className="font-extrabold text-sm text-[#0B1329]">Identity & Government Checks</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Real-time Aadhaar KYC authentication and commercial driving license validity checks directly against national transport records.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-slate-200 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#0B1329] text-[#D4AF37] flex items-center justify-center font-bold">
              2
            </div>
            <h4 className="font-extrabold text-sm text-[#0B1329]">Police Criminal Clearance</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mandatory Police Clearance Certificate (PCC) verification ensuring clean criminal records and zero reckless driving offenses.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-slate-200 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#0B1329] text-[#D4AF37] flex items-center justify-center font-bold">
              3
            </div>
            <h4 className="font-extrabold text-sm text-[#0B1329]">Transmission Skill Certification</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Hands-on driving evaluations on Manual, Automatic, SUV, and Luxury powertrains with strict vehicle etiquette guidelines.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: FREQUENTLY ASKED QUESTIONS (ACCORDION)
         ========================================================================= */}
      <section className="max-w-4xl mx-auto space-y-4">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Everything You Need to Know</span>
          <h2 className="text-2xl font-black text-[#0B1329] font-display">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3 pt-2">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-4 text-left font-bold text-xs sm:text-sm text-[#0B1329] flex items-center justify-between gap-3 hover:bg-slate-50"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              {activeFaq === idx && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
