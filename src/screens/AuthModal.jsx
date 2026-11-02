import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Mail,
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  KeyRound,
  CheckCircle2,
  Car
} from 'lucide-react';
import { loginUser, registerUser } from '../api.js';
import { BRAND } from '../config/branding.js';

export default function AuthModal({
  isOpen,
  onClose,
  initialView = 'login', // 'splash', 'onboarding', 'login', 'signup', 'otp', 'forgot_password'
  onAuthSuccess
}) {
  const [view, setView] = useState(initialView);
  const [onboardingSlide, setOnboardingSlide] = useState(0);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [otpInput, setOtpInput] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(30);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const ONBOARDING_SLIDES = [
    {
      title: 'Verified Drivers Across India',
      subtitle: 'Rent trusted chauffeurs for your personal car in 14+ major cities with 100% police clearance and commercial license verification.',
      icon: '🛡️',
      color: 'from-blue-600 to-cyan-600'
    },
    {
      title: 'Manual, Automatic & Luxury',
      subtitle: 'Expert drivers for hatchbacks, sedans, SUVs, and German luxury vehicles (Audi, BMW, Mercedes) with seamless gear shifting.',
      icon: '🚗',
      color: 'from-amber-600 to-orange-600'
    },
    {
      title: 'Transparent Pricing & GST Invoices',
      subtitle: 'Pay via UPI, Cards or Netbanking with transparent hourly rates, night allowances, and instant downloadable GST tax invoices.',
      icon: '🇮🇳',
      color: 'from-emerald-600 to-teal-600'
    }
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await loginUser({ phoneOrEmail: phone || email, password, otp: otpInput });
      if (res.success) {
        onAuthSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.message || 'Login failed');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to authentication server');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!fullName || !phone || !email) {
      setErrorMsg('Please enter name, mobile number and email');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await registerUser({ fullName, phone, email, password, role });
      if (res.success) {
        setView('otp');
      } else {
        setErrorMsg(res.message || 'Registration failed');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to authentication server');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!otpInput || otpInput.length < 4) {
      setErrorMsg('Please enter 4-digit verification OTP');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg('Phone verified successfully!');
      setTimeout(() => {
        onAuthSuccess({
          fullName: fullName || BRAND.owner,
          phone,
          email,
          role
        });
        onClose();
      }, 1000);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 1. SPLASH SCREEN VIEW */}
        {view === 'splash' && (
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-xl font-black text-white text-3xl">
              SD
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200 text-[10px] font-extrabold uppercase mb-2">
              Across India 🇮🇳
            </div>
            <h2 className="text-2xl font-black tracking-tight text-[#0F1E36]">{BRAND.appName}</h2>
            <p className="text-xs font-bold text-orange-600 mt-0.5">{BRAND.tagline}</p>
            <p className="text-xs text-slate-500 mt-2 px-4">
              Connecting personal vehicle owners with verified drivers across 14+ Indian cities.
            </p>

            <div className="mt-8 space-y-2.5">
              <button
                onClick={() => setView('onboarding')}
                className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition"
              >
                Get Started • View Walkthrough
              </button>
              <button
                onClick={() => setView('login')}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs rounded-xl transition"
              >
                Sign In to Existing Account
              </button>
            </div>
          </div>
        )}

        {/* 2. ONBOARDING WALKTHROUGH VIEW */}
        {view === 'onboarding' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-3xl mx-auto mb-4 shadow-xl">
              {ONBOARDING_SLIDES[onboardingSlide].icon}
            </div>

            <h3 className="font-extrabold text-lg text-white mb-2">
              {ONBOARDING_SLIDES[onboardingSlide].title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed min-h-[56px] px-2">
              {ONBOARDING_SLIDES[onboardingSlide].subtitle}
            </p>

            {/* Stepper Dots */}
            <div className="flex justify-center gap-2 my-6">
              {ONBOARDING_SLIDES.map((_, idx) => (
                <span
                  key={idx}
                  onClick={() => setOnboardingSlide(idx)}
                  className={`h-2 rounded-full cursor-pointer transition-all ${
                    onboardingSlide === idx ? 'w-8 bg-brand-500' : 'w-2 bg-slate-700'
                  }`}
                ></span>
              ))}
            </div>

            <div className="flex gap-2">
              {onboardingSlide > 0 && (
                <button
                  onClick={() => setOnboardingSlide(s => s - 1)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Back
                </button>
              )}
              {onboardingSlide < ONBOARDING_SLIDES.length - 1 ? (
                <button
                  onClick={() => setOnboardingSlide(s => s + 1)}
                  className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => setView('login')}
                  className="flex-1 py-3 bg-gradient-to-r from-brand-600 to-cyan-600 text-white font-extrabold text-xs rounded-xl shadow-lg"
                >
                  Ready to Book • Continue
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. LOGIN VIEW */}
        {view === 'login' && (
          <div>
            <div className="text-center mb-5">
              <h3 className="font-extrabold text-lg text-white">Welcome Back</h3>
              <p className="text-xs text-slate-500 mt-0.5">Sign in to your {BRAND.appName} account</p>
            </div>

            {errorMsg && (
              <div className="p-3 mb-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-400">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Mobile Number / Email
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full py-2.5 pl-9 pr-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-semibold text-slate-400">Password / OTP</label>
                  <button
                    type="button"
                    onClick={() => setView('forgot_password')}
                    className="text-[10px] text-brand-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password or leave blank for OTP"
                    className="w-full py-2.5 pl-9 pr-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition"
              >
                {loading ? 'Authenticating...' : 'Sign In With Mobile OTP'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
              Don't have an account?{' '}
              <button
                onClick={() => setView('signup')}
                className="text-brand-400 font-bold hover:underline"
              >
                Register Now
              </button>
            </div>
          </div>
        )}

        {/* 4. SIGN UP VIEW */}
        {view === 'signup' && (
          <div>
            <div className="text-center mb-4">
              <h3 className="font-extrabold text-lg text-white">Create Account</h3>
              <p className="text-xs text-slate-400 mt-0.5">Register as Customer or Driver</p>
            </div>

            {/* Role Toggle */}
            <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl mb-3 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`py-1.5 rounded-lg transition ${
                  role === 'customer' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setRole('driver')}
                className={`py-1.5 rounded-lg transition ${
                  role === 'driver' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Driver / Chauffeur
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 mb-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-400">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Indian Mobile (+91)</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="salman@salmandriver.in"
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition mt-2"
              >
                {loading ? 'Sending Verification OTP...' : 'Send OTP & Register'}
              </button>
            </form>

            <div className="mt-3 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <button
                onClick={() => setView('login')}
                className="text-brand-400 font-bold hover:underline"
              >
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* 5. OTP VERIFICATION VIEW */}
        {view === 'otp' && (
          <div className="text-center py-2">
            <div className="w-12 h-12 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-white">Enter OTP Verification</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              We sent a 4-digit code to <strong className="text-white">{phone}</strong>
            </p>

            {successMsg ? (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-bold mb-3">
                ✓ {successMsg}
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <input
                  type="text"
                  maxLength={4}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234"
                  className="w-48 mx-auto py-3 bg-slate-950 border border-slate-700 rounded-2xl text-center text-3xl font-mono font-bold tracking-widest text-white focus:outline-none focus:border-brand-500 block"
                />

                <p className="text-[11px] text-slate-500">
                  Demo Test OTP: <strong className="text-brand-400 font-mono">1234</strong>
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs rounded-xl shadow-lg"
                >
                  Verify & Complete Login
                </button>
              </form>
            )}
          </div>
        )}

        {/* 6. FORGOT PASSWORD VIEW */}
        {view === 'forgot_password' && (
          <div>
            <div className="text-center mb-4">
              <h3 className="font-extrabold text-lg text-white">Reset Password</h3>
              <p className="text-xs text-slate-400 mt-0.5">We will send a reset OTP to your mobile</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Registered Phone</label>
                <input
                  type="tel"
                  defaultValue="+91 98765 43210"
                  className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <button
                onClick={() => setView('otp')}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl"
              >
                Send Password Reset OTP
              </button>

              <button
                onClick={() => setView('login')}
                className="w-full py-2 bg-slate-800 text-slate-400 rounded-xl text-xs font-semibold"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
