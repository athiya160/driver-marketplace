import React, { useState } from 'react';
import {
  Car,
  Shield,
  User,
  Bell,
  MapPin,
  ChevronDown,
  QrCode,
  LogIn,
  RotateCcw,
  Sparkles,
  Phone,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Menu,
  X,
  Compass,
  FileText,
  HelpCircle,
  ExternalLink,
  SlidersHorizontal,
  Home,
  Users
} from 'lucide-react';
import { BRAND, THEME } from '../config/branding.js';
import { INDIAN_CITIES } from '../constants.js';
import { resetDemoEnvironment } from '../api.js';

export default function AppLayout({
  children,
  currentRole,
  onSwitchRole,
  activeScreen,
  onNavigateScreen,
  selectedCity,
  onSelectCity,
  onOpenScanner,
  onOpenNotifications,
  unreadCount = 0,
  onOpenAuth,
  currentUser,
  activeBooking,
  onResetDemo
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [showStagingDrawer, setShowStagingDrawer] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetDemoEnvironment();
      if (onResetDemo) onResetDemo();
      alert('Demo environment reset to clean initial state.');
    } catch (err) {
      console.error('Reset failed:', err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#172033] flex flex-col font-sans antialiased selection:bg-[#D4AF37] selection:text-[#0B1329]">
      
      {/* =========================================================================
          1. DESKTOP & TABLET TOP NAVIGATION BAR (DEEP NAVY LUXURY)
         ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#0B1329] border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20 gap-4">
            
            {/* Left: Brand Identity & City Selector */}
            <div className="flex items-center gap-4 lg:gap-6">
              {/* Brand Logo & Name */}
              <div
                onClick={() => onNavigateScreen('home')}
                className="flex items-center gap-3 cursor-pointer group"
                title="Sarathi Global Rentals - Home"
              >
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-[#091426] border border-[#D4AF37]/60 flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 group-hover:scale-105 transition-transform duration-200 p-0.5 overflow-hidden">
                  <img
                    src={BRAND.logoBadgeUrl || "/sarathi-badge.png"}
                    alt="Sarathi Global Rentals"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-lg md:text-xl tracking-tight text-white font-display">
                      SARATHI
                    </span>
                    <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                      Global Rentals
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium hidden md:block">
                    {BRAND.tagline}
                  </p>
                </div>
              </div>

              {/* Operating City Selector Pill */}
              <div className="relative">
                <button
                  onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition"
                  title="Select Operating City"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{selectedCity}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {cityDropdownOpen && (
                  <div className="absolute top-11 left-0 w-52 max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl p-1.5 z-50 text-xs text-[#172033]">
                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                      Select Operating Metro
                    </div>
                    {INDIAN_CITIES.map(city => (
                      <button
                        key={city}
                        onClick={() => {
                          onSelectCity(city);
                          setCityDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                          selectedCity === city
                            ? 'bg-[#0B1329] text-white font-bold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{city}</span>
                        {selectedCity === city && <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Center: Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {currentRole === 'customer' && (
                <>
                  <button
                    onClick={() => onNavigateScreen('home')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      activeScreen === 'home'
                        ? 'bg-white/10 text-white border border-white/15'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Book Chauffeur
                  </button>
                  <button
                    onClick={() => onNavigateScreen('drivers')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      activeScreen === 'drivers'
                        ? 'bg-white/10 text-white border border-white/15'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Browse Drivers
                  </button>
                  <button
                    onClick={() => onNavigateScreen('live_trip')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      activeScreen === 'live_trip'
                        ? 'bg-white/10 text-white border border-white/15'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>Active Ride</span>
                    {activeBooking?.status === 'in_progress' && (
                      <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                    )}
                  </button>
                  <button
                    onClick={() => onNavigateScreen('profile')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      activeScreen === 'profile'
                        ? 'bg-white/10 text-white border border-white/15'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    My Account
                  </button>
                </>
              )}

              {currentRole === 'driver' && (
                <>
                  <button
                    onClick={() => onNavigateScreen('driver_dash')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      activeScreen === 'driver_dash'
                        ? 'bg-white/10 text-white border border-white/15'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Chauffeur Cockpit
                  </button>
                  <button
                    onClick={() => onNavigateScreen('live_trip')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      activeScreen === 'live_trip'
                        ? 'bg-white/10 text-white border border-white/15'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Current Trip
                  </button>
                </>
              )}

              {currentRole === 'admin' && (
                <>
                  <button
                    onClick={() => onNavigateScreen('admin_dash')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      activeScreen === 'admin_dash'
                        ? 'bg-white/10 text-white border border-white/15'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Operations Console
                  </button>
                </>
              )}
            </nav>

            {/* Right: Role Navigation, Notifications, QR & Auth */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Role Navigation Pill */}
              <div className="hidden sm:flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 text-xs">
                <button
                  onClick={() => onSwitchRole('customer')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    currentRole === 'customer'
                      ? 'bg-[#D4AF37] text-[#0B1329] shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Switch to Customer Booking Experience"
                >
                  Customer
                </button>
                <button
                  onClick={() => onSwitchRole('driver')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    currentRole === 'driver'
                      ? 'bg-[#D4AF37] text-[#0B1329] shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Switch to Chauffeur Companion Experience"
                >
                  Chauffeur
                </button>
                <button
                  onClick={() => onSwitchRole('admin')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    currentRole === 'admin'
                      ? 'bg-[#D4AF37] text-[#0B1329] shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Switch to Operations SuperAdmin Desk"
                >
                  Operations
                </button>
              </div>

              {/* Mobile QR Connect Button */}
              <button
                onClick={onOpenScanner}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition"
                title="Connect Smartphone via QR"
              >
                <QrCode className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="hidden xl:inline">Phone QR</span>
              </button>

              {/* Notifications Bell */}
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 hover:text-white transition"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D4AF37] text-[#0B1329] text-[9px] font-black flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* User Authentication Trigger */}
              {currentUser ? (
                <button
                  onClick={() => onNavigateScreen('profile')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/15 transition text-xs font-semibold"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#D4AF37] text-[#0B1329] flex items-center justify-center font-bold text-xs">
                    {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
                  </div>
                  <span className="hidden md:inline max-w-[100px] truncate">{currentUser.fullName}</span>
                </button>
              ) : (
                <button
                  onClick={() => onOpenAuth('login')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#D4AF37] text-[#0B1329] text-xs font-bold hover:bg-[#c49f2e] transition shadow-md shadow-[#D4AF37]/20"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Mobile Hamburger Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer / Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#070D1C] border-b border-slate-800 px-4 py-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Switch Experience</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { onSwitchRole('customer'); setMobileMenuOpen(false); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${currentRole === 'customer' ? 'bg-[#D4AF37] text-[#0B1329]' : 'text-slate-300'}`}
                >
                  Customer
                </button>
                <button
                  onClick={() => { onSwitchRole('driver'); setMobileMenuOpen(false); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${currentRole === 'driver' ? 'bg-[#D4AF37] text-[#0B1329]' : 'text-slate-300'}`}
                >
                  Chauffeur
                </button>
                <button
                  onClick={() => { onSwitchRole('admin'); setMobileMenuOpen(false); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${currentRole === 'admin' ? 'bg-[#D4AF37] text-[#0B1329]' : 'text-slate-300'}`}
                >
                  Admin
                </button>
              </div>
            </div>

            <div className="space-y-1">
              {currentRole === 'customer' && (
                <>
                  <button
                    onClick={() => { onNavigateScreen('home'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Car className="w-4 h-4 text-[#D4AF37]" /> Book a Chauffeur
                  </button>
                  <button
                    onClick={() => { onNavigateScreen('drivers'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Users className="w-4 h-4 text-[#D4AF37]" /> Explore Verified Chauffeurs
                  </button>
                  <button
                    onClick={() => { onNavigateScreen('live_trip'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4 text-[#D4AF37]" /> Active Booking Status
                  </button>
                  <button
                    onClick={() => { onNavigateScreen('profile'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-slate-800 flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-[#D4AF37]" /> Customer Profile & History
                  </button>
                </>
              )}
              {currentRole === 'driver' && (
                <>
                  <button
                    onClick={() => { onNavigateScreen('driver_dash'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Car className="w-4 h-4 text-[#D4AF37]" /> Driver Cockpit & Duty Toggle
                  </button>
                  <button
                    onClick={() => { onNavigateScreen('live_trip'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4 text-[#D4AF37]" /> Current Trip Meter
                  </button>
                </>
              )}
              {currentRole === 'admin' && (
                <button
                  onClick={() => { onNavigateScreen('admin_dash'); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-slate-800 flex items-center gap-2"
                >
                  <Shield className="w-4 h-4 text-[#D4AF37]" /> Marketplace Operations Console
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. MAIN CONTENT VIEWPORT (GENUINE FULL-WIDTH RESPONSIVE EXPERIENCE)
         ========================================================================= */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {children}
      </main>

      {/* =========================================================================
          3. MOBILE FIXED BOTTOM NAVIGATION (TOUCH-FRIENDLY > 48PX TARGETS)
         ========================================================================= */}
      <div className="md:hidden sticky bottom-0 z-30 bg-[#0B1329]/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 shadow-2xl">
        {currentRole === 'customer' && (
          <div className="flex items-center justify-around">
            <button
              onClick={() => onNavigateScreen('home')}
              className={`flex-1 py-1.5 flex flex-col items-center gap-1 text-[10px] font-bold transition ${
                activeScreen === 'home' ? 'text-[#D4AF37]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Car className="w-5 h-5" />
              <span>Book</span>
            </button>
            <button
              onClick={() => onNavigateScreen('drivers')}
              className={`flex-1 py-1.5 flex flex-col items-center gap-1 text-[10px] font-bold transition ${
                activeScreen === 'drivers' ? 'text-[#D4AF37]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Drivers</span>
            </button>
            <button
              onClick={() => onNavigateScreen('live_trip')}
              className={`flex-1 py-1.5 flex flex-col items-center gap-1 text-[10px] font-bold transition relative ${
                activeScreen === 'live_trip' ? 'text-[#D4AF37]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span>Active Ride</span>
              {activeBooking?.status === 'in_progress' && (
                <span className="w-2 h-2 rounded-full bg-[#10B981] absolute top-1 right-6 animate-ping" />
              )}
            </button>
            <button
              onClick={() => onNavigateScreen('profile')}
              className={`flex-1 py-1.5 flex flex-col items-center gap-1 text-[10px] font-bold transition ${
                activeScreen === 'profile' ? 'text-[#D4AF37]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </button>
          </div>
        )}

        {currentRole === 'driver' && (
          <div className="flex items-center justify-around">
            <button
              onClick={() => onNavigateScreen('driver_dash')}
              className={`flex-1 py-1.5 flex flex-col items-center gap-1 text-[10px] font-bold transition ${
                activeScreen === 'driver_dash' ? 'text-[#D4AF37]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Car className="w-5 h-5" />
              <span>Cockpit</span>
            </button>
            <button
              onClick={() => onNavigateScreen('live_trip')}
              className={`flex-1 py-1.5 flex flex-col items-center gap-1 text-[10px] font-bold transition ${
                activeScreen === 'live_trip' ? 'text-[#D4AF37]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span>Trip Meter</span>
            </button>
            <button
              onClick={onOpenScanner}
              className="flex-1 py-1.5 flex flex-col items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white transition"
            >
              <QrCode className="w-5 h-5 text-[#D4AF37]" />
              <span>Scan QR</span>
            </button>
          </div>
        )}

        {currentRole === 'admin' && (
          <div className="flex items-center justify-around">
            <button
              onClick={() => onNavigateScreen('admin_dash')}
              className={`flex-1 py-1.5 flex flex-col items-center gap-1 text-[10px] font-bold transition ${
                activeScreen === 'admin_dash' ? 'text-[#D4AF37]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-5 h-5" />
              <span>Admin Console</span>
            </button>
            <button
              onClick={onOpenScanner}
              className="flex-1 py-1.5 flex flex-col items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white transition"
            >
              <QrCode className="w-5 h-5 text-[#D4AF37]" />
              <span>QR Connect</span>
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          4. PROFESSIONAL GLOBAL MARKETPLACE FOOTER
         ========================================================================= */}
      <footer className="bg-[#0B1329] border-t border-slate-800 text-slate-400 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
            
            {/* Col 1 & 2: Brand & Mission */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#091426] border border-[#D4AF37]/50 flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                  <img
                    src={BRAND.logoBadgeUrl || "/sarathi-badge.png"}
                    alt="Sarathi Global Rentals"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-extrabold text-base tracking-tight text-white font-display">
                  SARATHI GLOBAL RENTALS
                </span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed max-w-sm">
                India's next-generation personal driver marketplace. We pair car owners with verified, professional chauffeurs to drive their personal vehicle for hourly city commutes, late nights, airport transfers, and outstation road trips.
              </p>
              <div className="flex items-center gap-3 pt-2 text-[11px] font-semibold text-[#D4AF37]">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" /> 100% Police Verified
                </span>
                <span>•</span>
                <span>Manual & Automatic</span>
                <span>•</span>
                <span>Zero Surge Pricing</span>
              </div>
            </div>

            {/* Col 3: Services */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">Chauffeur Services</h4>
              <ul className="space-y-1.5 text-slate-300">
                <li><button onClick={() => onNavigateScreen('home')} className="hover:text-white transition">Hourly City Chauffeur (2h - 12h)</button></li>
                <li><button onClick={() => onNavigateScreen('home')} className="hover:text-white transition">Airport Drop & Pickup</button></li>
                <li><button onClick={() => onNavigateScreen('home')} className="hover:text-white transition">Outstation Multi-Day Drives</button></li>
                <li><button onClick={() => onNavigateScreen('home')} className="hover:text-white transition">Luxury & EV Specialists</button></li>
                <li><button onClick={() => onNavigateScreen('home')} className="hover:text-white transition">Corporate Fleet Driving</button></li>
              </ul>
            </div>

            {/* Col 4: Operational Metros */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">Top Indian Metros</h4>
              <ul className="space-y-1.5 text-slate-300">
                <li><span>Bengaluru (Pilot City)</span></li>
                <li><span>Mumbai & Navi Mumbai</span></li>
                <li><span>Delhi NCR (Gurugram, Noida)</span></li>
                <li><span>Hyderabad & Cyberabad</span></li>
                <li><span>Chennai & Pune</span></li>
              </ul>
            </div>

            {/* Col 5: Trust & Legal */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">Safety & Support</h4>
              <ul className="space-y-1.5 text-slate-300">
                <li className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-[#D4AF37]" /> {BRAND.supportPhoneDisplay}</li>
                <li><span>{BRAND.supportEmailDisplay}</span></li>
                <li><span className="text-[11px] text-slate-400">Section 79 IT Act Intermediary</span></li>
                <li><span className="text-[11px] text-slate-400">White-Plate Motor Vehicles Act</span></li>
              </ul>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <p>© {new Date().getFullYear()} Sarathi Driver Marketplace. All rights reserved.</p>
            <p className="text-slate-400 text-center sm:text-right">
              "Your Car. Your Journey. Your Driver."
            </p>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          5. DISCREET STAGING & DEMO TOOLS TRIGGER (BOTTOM RIGHT PILL)
         ========================================================================= */}
      <div className="fixed bottom-16 md:bottom-4 right-4 z-40">
        <button
          onClick={() => setShowStagingDrawer(!showStagingDrawer)}
          className="px-3 py-1.5 rounded-full bg-[#0B1329] text-[#D4AF37] border border-[#D4AF37]/40 shadow-xl hover:scale-105 transition-all text-xs font-bold flex items-center gap-1.5"
          title="Open Developer & Staging Tools"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Staging Tools</span>
        </button>

        {showStagingDrawer && (
          <div className="absolute bottom-10 right-0 w-80 bg-white border border-slate-200 rounded-3xl shadow-2xl p-4 text-xs text-[#172033] space-y-3 z-50">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-[#0B1329] text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> Staging Controls
              </span>
              <button onClick={() => setShowStagingDrawer(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Switch Persona</label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => { onSwitchRole('customer'); setShowStagingDrawer(false); }}
                  className={`py-1.5 rounded-xl font-bold text-center ${currentRole === 'customer' ? 'bg-[#0B1329] text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  Customer
                </button>
                <button
                  onClick={() => { onSwitchRole('driver'); setShowStagingDrawer(false); }}
                  className={`py-1.5 rounded-xl font-bold text-center ${currentRole === 'driver' ? 'bg-[#0B1329] text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  Chauffeur
                </button>
                <button
                  onClick={() => { onSwitchRole('admin'); setShowStagingDrawer(false); }}
                  className={`py-1.5 rounded-xl font-bold text-center ${currentRole === 'admin' ? 'bg-[#0B1329] text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  Admin
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Demo Environment State</label>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="w-full py-2 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800 transition"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                <span>{resetting ? 'Resetting Data...' : 'Reset Demo to Initial Seed'}</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500">
              <p>Staging mode active. Financial transactions and driver dispatch operate in safe simulation mode.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
