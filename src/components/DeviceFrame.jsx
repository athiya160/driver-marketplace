import React, { useState } from 'react';
import {
  Smartphone,
  Monitor,
  QrCode,
  Shield,
  User,
  Car,
  Bell,
  LogIn,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  X
} from 'lucide-react';
import { BRAND, THEME } from '../config/branding.js';
import { resetDemoEnvironment } from '../api.js';

export default function DeviceFrame({
  children,
  viewMode,
  setViewMode,
  currentRole,
  onSwitchRole,
  onOpenScanner,
  onOpenNotifications,
  unreadCount = 2,
  onOpenAuth,
  onResetDemo
}) {
  const [showDemoModal, setShowDemoModal] = useState(false);
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
    <div className="min-h-screen bg-slate-100 flex flex-col items-center">
      
      {/* 1. TOP GLOBAL STAGING / DEMONSTRATION BANNER */}
      <div className="w-full bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-xs z-50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-900 animate-ping"></span>
          <span className="uppercase tracking-wider font-extrabold text-[11px]">
            STAGING PREVIEW • TEST ENVIRONMENT
          </span>
          <span className="hidden md:inline font-normal text-slate-900/80 text-[11px]">
            — Private Demonstration for Salman & Operations Team (Simulated Payments & Test Drivers)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowDemoModal(true)}
            className="px-2.5 py-0.5 rounded-md bg-slate-900/10 hover:bg-slate-900/20 text-slate-950 font-bold transition flex items-center gap-1 text-[11px]"
          >
            <Info className="w-3 h-3" />
            <span>Platform Guide</span>
          </button>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="px-2.5 py-0.5 rounded-md bg-slate-950 text-white hover:bg-slate-800 font-bold transition flex items-center gap-1 text-[11px] shadow-xs"
          >
            <RotateCcw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Resetting...' : 'Reset Demo'}</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN HEADER & ROLE CONTROLS - DEEP NAVY */}
      <header className="w-full bg-[#0F1E36] border-b border-slate-800 text-white px-4 py-3 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand Logo & Configurable Title */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => onOpenAuth('splash')}
              className="w-10 h-10 rounded-2xl bg-[#091426] border border-[#D4AF37]/50 flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition overflow-hidden p-0.5"
              title="Click to view Splash Screen"
            >
              <img
                src={BRAND.logoBadgeUrl || "/sarathi-badge.png"}
                alt={BRAND.appName}
                className="w-full h-full object-contain drop-shadow"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">{BRAND.appName}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Across India 🇮🇳
                </span>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block">
                {BRAND.tagline}
              </p>
            </div>
          </div>

          {/* 1-Click Interactive Demo Role Switcher */}
          <div className="flex items-center bg-[#091426] p-1 rounded-xl border border-slate-700/60 text-xs">
            <span className="px-2 text-slate-400 font-medium hidden md:inline">Experience:</span>
            <button
              onClick={() => onSwitchRole('customer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                currentRole === 'customer'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>🚗 Customer</span>
            </button>
            <button
              onClick={() => onSwitchRole('driver')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                currentRole === 'driver'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>👔 Chauffeur</span>
            </button>
            <button
              onClick={() => onSwitchRole('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                currentRole === 'admin'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>🛡️ Operations</span>
            </button>
          </div>

          {/* Viewport, Notifications, Auth & QR Code Scanner Actions */}
          <div className="flex items-center gap-2">
            
            {/* Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 hover:text-white transition"
              title="In-App Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Auth / Onboarding Trigger */}
            <button
              onClick={() => onOpenAuth('login')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition"
              title="Test Login / Sign Up Flow"
            >
              <LogIn className="w-3.5 h-3.5 text-orange-400" />
              <span>Auth</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#091426] p-1 rounded-xl border border-slate-700/60 text-xs">
              <button
                onClick={() => setViewMode('mobile')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition ${
                  viewMode === 'mobile' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Mobile View (Phone Frame)"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
              <button
                onClick={() => setViewMode('desktop')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition ${
                  viewMode === 'desktop' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Desktop Responsive View"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
            </div>

            {/* Expo QR Code Scanner Trigger */}
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 transition shadow-sm"
              title="Open Mobile Scanner & Connect"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>📱 Mobile QR</span>
            </button>
          </div>

        </div>
      </header>

      {/* 3. PLATFORM OVERVIEW MODAL (INVESTOR & FOUNDER GUIDE) */}
      {showDemoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-800 text-xs">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold uppercase">
                  Startup Architecture Overview
                </span>
                <h3 className="text-lg font-black text-[#0F1E36] mt-1">
                  On-Demand Personal Driver Marketplace
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  "Your Car. Your Journey. Your Driver."
                </p>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl space-y-1">
                <span className="font-extrabold text-[#0F1E36] text-xs">The Core Business Model</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Unlike traditional ride-hailing services (Uber/Ola) where passengers are paired with a car and driver,
                  this platform connects <strong>vehicle owners with professional chauffeurs</strong> who drive the customer's own car (Hatchback, Sedan, SUV, Luxury).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="font-bold text-[#0F1E36] block">1. Customer Journey</span>
                  <p className="text-slate-500 text-[10px]">
                    Select vehicle transmission, browse 25+ verified chauffeurs, instant fare breakdown with 5% GST, live dispatch, and OTP verification.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="font-bold text-[#0F1E36] block">2. Chauffeur Journey</span>
                  <p className="text-slate-500 text-[10px]">
                    Online/offline duty, 45s dispatch timer, 4-digit OTP trip validation, 85% net earnings ledger + 100% outstation DA.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="font-bold text-[#0F1E36] block">3. Operations Desk</span>
                  <p className="text-slate-500 text-[10px]">
                    Real-time GMV analytics, 15% platform take, KYC verification queue (Commercial DL & PCC), instant refund simulator.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-1 text-[11px]">
                <span className="font-bold text-amber-900 block">Demonstration Environment Notice</span>
                <p className="text-amber-800 text-[10px] leading-relaxed">
                  All customer profiles, driver ratings, telemetry routes and payments displayed in Demo Mode are synthetic and isolated. You can click <strong>Reset Demo</strong> at any point to restore clean seed data.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowDemoModal(false)}
                className="px-4 py-2 bg-[#0F1E36] text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition"
              >
                Close & Explore Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MAIN CONTENT AREA: PHONE FRAME OR RESPONSIVE DESKTOP */}
      <main className="w-full flex-1 flex justify-center py-5 px-2 sm:px-4">
        {viewMode === 'mobile' ? (
          <div className="relative w-full max-w-[420px] h-[870px] max-h-[92vh] bg-slate-900 rounded-[48px] p-3 shadow-2xl shadow-slate-900/40 border-[8px] border-slate-800 ring-1 ring-slate-700/40 flex flex-col overflow-hidden">
            
            {/* Phone Speaker & Dynamic Island */}
            <div className="w-full flex items-center justify-between px-6 pt-1 pb-2 select-none">
              <span className="text-[11px] font-mono font-bold text-slate-400">9:41</span>
              <div className="w-24 h-4 bg-slate-950 rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700"></div>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                <span>5G</span>
                <span className="w-4 h-2.5 border border-slate-400 rounded-sm inline-block relative before:absolute before:inset-0.5 before:bg-slate-400"></span>
              </div>
            </div>

            {/* Mobile Viewport Screen */}
            <div className="w-full flex-1 bg-[#F8FAFC] rounded-[36px] overflow-y-auto overflow-x-hidden flex flex-col relative border border-slate-200 text-[#172033]">
              {children}
            </div>

            {/* Phone Bottom Gesture Bar */}
            <div className="w-full pt-2 flex justify-center items-center">
              <div className="w-32 h-1 bg-slate-500 rounded-full"></div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xl overflow-y-auto text-[#172033]">
            {children}
          </div>
        )}
      </main>
    </div>
  );
}
