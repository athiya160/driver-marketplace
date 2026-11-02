import React from 'react';
import { Smartphone, Monitor, QrCode, Shield, User, Car, Bell, LogIn } from 'lucide-react';
import { BRAND, THEME } from '../config/branding.js';

export default function DeviceFrame({
  children,
  viewMode,
  setViewMode,
  currentRole,
  onSwitchRole,
  onOpenScanner,
  onOpenNotifications,
  unreadCount = 2,
  onOpenAuth
}) {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center">
      {/* Top Global Control Toolbar - Deep Navy */}
      <header className="w-full bg-[#0F1E36] border-b border-slate-800 text-white px-4 py-3 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => onOpenAuth('splash')}
              className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-md font-black text-white text-base cursor-pointer hover:scale-105 transition"
              title="Click to view Splash Screen"
            >
              SD
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">{BRAND.appName}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  Across India 🇮🇳
                </span>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block">
                {BRAND.tagline} • Owner: {BRAND.owner}
              </p>
            </div>
          </div>

          {/* Role Switcher (Customer / Driver / Admin) */}
          <div className="flex items-center bg-[#091426] p-1 rounded-xl border border-slate-700/60 text-xs">
            <span className="px-2 text-slate-400 font-medium hidden md:inline">Role:</span>
            <button
              onClick={() => onSwitchRole('customer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                currentRole === 'customer'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Customer
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
              Driver
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
              Admin
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
              <span>📱 App Scanner</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area: Phone Mockup Frame or Desktop View */}
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

            {/* Mobile Viewport Screen - Crisp Light Off-White #F8FAFC */}
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
