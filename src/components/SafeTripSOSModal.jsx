import React, { useState } from 'react';
import {
  ShieldAlert,
  PhoneCall,
  Share2,
  Copy,
  Check,
  X,
  AlertTriangle,
  Send,
  Navigation,
  KeyRound,
  ShieldCheck,
  Lock
} from 'lucide-react';

export default function SafeTripSOSModal({
  isOpen,
  onClose,
  booking = {}
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const driverName = booking.driverName || 'Assigned Chauffeur';
  const vehicle = booking.vehicleModel || booking.vehicleType || 'Personal Car';
  const bookingRef = booking.bookingReference || 'SRT-LIVE-SAFE';
  const pickupCity = booking.pickupCity || 'Bengaluru';

  const shareText = `🛡️ *Sarathi SafeTrip Alert* 🛡️\nI am currently traveling in my ${vehicle} driven by verified chauffeur *${driverName}* (Commercial DL & Aadhaar Verified).\nBooking Ref: ${bookingRef}\nCity: ${pickupCity}\nLive GPS telemetry active. Emergency Contact: 112 / 1800-200-8821.`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-red-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight font-display">SafeTrip™ 24x7 Safety Hub</h3>
              <p className="text-xs text-rose-100">Instant Live Share & Emergency Response</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Active Ride Safety Status */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Trip Safety Status</span>
              <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                GPS Active
              </span>
            </div>
            <div className="text-xs text-[#0B1329] font-medium space-y-1">
              <div><span className="text-slate-500">Chauffeur:</span> <span className="font-bold">{driverName}</span></div>
              <div><span className="text-slate-500">Vehicle:</span> <span className="font-mono">{vehicle}</span></div>
              <div><span className="text-slate-500">Booking Ref:</span> <span className="font-mono font-bold">{bookingRef}</span></div>
            </div>
          </div>

          {/* WhatsApp Live Share Button */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Family & Friend Live Share
            </label>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition shadow-md"
            >
              <Send className="w-4 h-4" />
              <span>Share Live Trip via WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className="w-full mt-2 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Trip Details & Safety Link'}</span>
            </button>
          </div>

          {/* Immediate Emergency Hotlines */}
          <div className="pt-2 border-t border-slate-100">
            <label className="text-[11px] font-bold uppercase tracking-wider text-red-600 flex items-center gap-1 mb-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Immediate Emergency Hotlines</span>
            </label>
            
            <div className="grid grid-cols-2 gap-2">
              <a
                href="tel:112"
                className="p-3 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 flex flex-col items-center justify-center gap-1 transition text-center"
              >
                <PhoneCall className="w-5 h-5 text-red-600" />
                <span className="text-xs font-black">Call 112</span>
                <span className="text-[10px] text-red-500">National Emergency</span>
              </a>

              <a
                href="tel:1091"
                className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 flex flex-col items-center justify-center gap-1 transition text-center"
              >
                <ShieldCheck className="w-5 h-5 text-rose-600" />
                <span className="text-xs font-black">Call 1091</span>
                <span className="text-[10px] text-rose-500">Women Safety</span>
              </a>
            </div>

            <a
              href="tel:18002008821"
              className="mt-2 w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span>Sarathi 24x7 Safety Desk: 1800-200-8821</span>
            </a>
          </div>

          {/* Safety Protocols */}
          <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Lock className="w-3 h-3 text-slate-500" />
              <span>Sarathi Safety Pillars</span>
            </div>
            <p className="leading-relaxed">
              • Chauffeur commercial DL & Aadhaar identities are recorded.<br/>
              • Trip cannot start without your verbal 4-digit OTP.<br/>
              • Virtual masked call system protects your phone number.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition text-xs"
          >
            Close Safety Hub
          </button>
        </div>

      </div>
    </div>
  );
}
