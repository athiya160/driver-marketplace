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
  ChevronRight,
  Sparkles,
  Tag,
  ArrowRight,
  Map as MapIcon,
  ListFilter
} from 'lucide-react';
import { INDIAN_CITIES, SERVICE_CATEGORIES, VEHICLE_TYPES, TRANSMISSION_TYPES } from '../constants.js';
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
  const [pinCodeSearch, setPinCodeSearch] = useState('');

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
    }, 800);
  };

  return (
    <div className="flex flex-col min-h-full pb-20 bg-slate-950 text-slate-100">
      
      {/* Top City Bar & Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-4 border-b border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          
          {/* City Selector Button */}
          <div className="relative">
            <button
              onClick={() => setShowCityPicker(!showCityPicker)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-xs font-bold text-white hover:bg-slate-750 transition"
            >
              <MapPin className="w-3.5 h-3.5 text-brand-400" />
              <span>{selectedCity}</span>
              <span className="text-[10px] text-slate-400">▼</span>
            </button>

            {/* City Dropdown Menu */}
            {showCityPicker && (
              <div className="absolute top-10 left-0 w-48 max-h-64 overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1 z-50">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
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
                        ? 'bg-brand-600 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Safe Driving Verified Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Police Verified</span>
          </div>
        </div>

        {/* Hero Tagline */}
        <h1 className="text-xl font-extrabold tracking-tight text-white">
          Rent a Driver for <span className="bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">Your Own Car</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Verified chauffeurs for hourly, daily, outstation and monthly travel across India.
        </p>
      </div>

      {/* Main Booking Controls Container */}
      <div className="p-4 space-y-4">
        
        {/* Location Selection Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pickup & Destination</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInteractiveMap(!showInteractiveMap)}
                className="flex items-center gap-1 text-[11px] font-semibold text-brand-400 hover:text-brand-300 transition"
              >
                <MapIcon className="w-3 h-3" />
                <span>{showInteractiveMap ? 'Hide Map' : 'View Map'}</span>
              </button>
              <button
                onClick={handleDetectLocation}
                disabled={locating}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition"
              >
                <Navigation className={`w-3 h-3 ${locating ? 'animate-spin' : ''}`} />
                <span>{locating ? 'Locating...' : 'My GPS'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Map Component toggle */}
          {showInteractiveMap && (
            <div className="mb-3">
              <InteractiveMap
                pickupAddress={bookingForm.pickupAddress}
                dropAddress={bookingForm.dropAddress}
                height="190px"
              />
            </div>
          )}

          {/* Pickup Address Input */}
          <div className="flex items-center gap-2.5 p-3 bg-slate-950 border border-slate-800 rounded-2xl mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20 shrink-0"></div>
            <input
              type="text"
              value={bookingForm.pickupAddress}
              onChange={(e) => setBookingForm(prev => ({ ...prev, pickupAddress: e.target.value }))}
              placeholder="Enter pickup address, landmark or area"
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Drop Address Input */}
          <div className="flex items-center gap-2.5 p-3 bg-slate-950 border border-slate-800 rounded-2xl mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400 ring-4 ring-rose-500/20 shrink-0"></div>
            <input
              type="text"
              value={bookingForm.dropAddress}
              onChange={(e) => setBookingForm(prev => ({ ...prev, dropAddress: e.target.value }))}
              placeholder="Drop destination (or Multiple City Stops)"
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* PIN code or Local Area Filter */}
          <div className="flex items-center gap-2 p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl mb-2">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={pinCodeSearch}
              onChange={(e) => setPinCodeSearch(e.target.value)}
              placeholder="Filter drivers by PIN code (e.g. 122002, 110001)"
              className="w-full bg-transparent text-[11px] text-white placeholder-slate-500 focus:outline-none font-mono"
            />
          </div>

          {/* Quick Location Shortcuts */}
          <div className="flex items-center gap-2 overflow-x-auto text-[10px] text-slate-400 scrollbar-none pt-1">
            <span className="font-semibold text-slate-500">Quick:</span>
            <button
              onClick={() => setBookingForm(prev => ({ ...prev, pickupAddress: 'Tower 4, DLF The Crest, Sector 54, Gurugram' }))}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              🏠 DLF Crest
            </button>
            <button
              onClick={() => setBookingForm(prev => ({ ...prev, pickupAddress: 'Building 10B, DLF Cyber City Phase 2' }))}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              🏢 Cyber City
            </button>
            <button
              onClick={() => setBookingForm(prev => ({ ...prev, dropAddress: 'Terminal 3, Indira Gandhi International Airport' }))}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              ✈️ Airport T3
            </button>
          </div>
        </div>

        {/* Schedule & Duration Pickers */}
        <div className="grid grid-cols-3 gap-2">
          {/* Date */}
          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1">
              <Calendar className="w-3 h-3 text-brand-400" />
              <span>Date</span>
            </div>
            <input
              type="date"
              value={bookingForm.startDate}
              onChange={(e) => setBookingForm(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full bg-transparent text-xs font-semibold text-white focus:outline-none"
            />
          </div>

          {/* Start Time */}
          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1">
              <Clock className="w-3 h-3 text-brand-400" />
              <span>Time</span>
            </div>
            <input
              type="time"
              value={bookingForm.startTime}
              onChange={(e) => setBookingForm(prev => ({ ...prev, startTime: e.target.value }))}
              className="w-full bg-transparent text-xs font-semibold text-white focus:outline-none"
            />
          </div>

          {/* Duration */}
          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1">
              <Sparkles className="w-3 h-3 text-brand-400" />
              <span>Duration</span>
            </div>
            <select
              value={bookingForm.durationHours}
              onChange={(e) => setBookingForm(prev => ({ ...prev, durationHours: Number(e.target.value) }))}
              className="w-full bg-transparent text-xs font-semibold text-white focus:outline-none"
            >
              <option value={2} className="bg-slate-900">2 Hours</option>
              <option value={4} className="bg-slate-900">4 Hours</option>
              <option value={8} className="bg-slate-900">8 Hours</option>
              <option value={12} className="bg-slate-900">12 Hours</option>
              <option value={24} className="bg-slate-900">Full Day (24h)</option>
            </select>
          </div>
        </div>

        {/* Vehicle Transmission & Car Category */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Your Vehicle Specifications
          </div>

          {/* Transmission Toggle: Automatic vs Manual */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {TRANSMISSION_TYPES.map(trans => (
              <button
                key={trans.id}
                onClick={() => setBookingForm(prev => ({ ...prev, transmissionType: trans.id }))}
                className={`p-3 rounded-2xl border text-left transition ${
                  bookingForm.transmissionType === trans.id
                    ? 'bg-brand-600/20 border-brand-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-extrabold text-xs">{trans.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{trans.desc}</div>
              </button>
            ))}
          </div>

          {/* Vehicle Body Type */}
          <div className="grid grid-cols-4 gap-1.5">
            {VEHICLE_TYPES.map(veh => (
              <button
                key={veh.id}
                onClick={() => setBookingForm(prev => ({ ...prev, vehicleType: veh.id }))}
                className={`py-2 px-1 rounded-xl border text-center transition flex flex-col items-center ${
                  bookingForm.vehicleType === veh.id
                    ? 'bg-brand-600 text-white border-brand-500 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Car className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-bold leading-tight">{veh.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Driver Rental Categories Grid */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Select Rental Service
            </h2>
            <span className="text-[11px] text-brand-400 font-medium">9 Indian Services</span>
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
                      ? 'bg-slate-850 border-brand-500 ring-2 ring-brand-500/30 shadow-lg'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {cat.badge && (
                    <span className="absolute top-2 right-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">
                      {cat.badge}
                    </span>
                  )}

                  <div>
                    <h3 className="font-extrabold text-xs text-white">{cat.name}</h3>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{cat.tagline}</p>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-300">from </span>
                      <span className="font-mono font-extrabold text-sm text-brand-400">₹{cat.basePrice}</span>
                    </div>
                    <span className="text-[9px] text-slate-500">{cat.unit}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Promo Code Coupon Banner */}
        <div className="p-3 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-transparent border border-amber-500/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Flat ₹50 Off On First Ride</p>
              <p className="text-[10px] text-amber-300/80 font-mono">Use code: FIRST50 at checkout</p>
            </div>
          </div>
          <button
            onClick={() => setBookingForm(prev => ({ ...prev, couponCode: 'FIRST50' }))}
            className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[10px] hover:bg-amber-400 transition"
          >
            Apply
          </button>
        </div>

        {/* Search Drivers CTA */}
        <button
          onClick={onSearchDrivers}
          className="w-full py-4 bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-brand-600/30 flex items-center justify-center gap-2 transition hover:scale-[1.01]"
        >
          <Search className="w-4 h-4" />
          <span>Find Available Drivers in {selectedCity}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Top Verified Drivers Carousel */}
        {topDrivers.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Top Rated Drivers Near You
              </h3>
              <span className="text-[10px] text-emerald-400 font-semibold">● Ready Now</span>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
              {topDrivers.slice(0, 4).map(drv => (
                <div
                  key={drv.id}
                  onClick={() => onViewDriverDetails(drv)}
                  className="w-44 bg-slate-900 border border-slate-800 rounded-2xl p-3 shrink-0 cursor-pointer hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={drv.photoUrl}
                      alt={drv.fullName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                    />
                    <div className="overflow-hidden">
                      <p className="font-bold text-xs text-white truncate">{drv.fullName}</p>
                      <div className="flex items-center gap-1 text-[10px] text-amber-400">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{drv.rating}</span>
                        <span className="text-slate-500">({drv.totalTrips})</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 mb-2 truncate">
                    {drv.experienceYears} yrs exp • {drv.transmissionSkills.join('/')}
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-800">
                    <span className="font-mono font-bold text-xs text-brand-400">₹{drv.hourlyRate}/hr</span>
                    <span className="text-[9px] text-emerald-400 font-semibold">View Profile →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
