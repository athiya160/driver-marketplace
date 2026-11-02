import React, { useState } from 'react';
import { ArrowLeft, QrCode, Smartphone, ExternalLink, Check, Copy, Sparkles, ShieldCheck } from 'lucide-react';

export default function AppScannerScreen({ onBack }) {
  const [copied, setCopied] = useState(false);
  const expoUrl = 'exp://10.221.98.204:8081';
  const webUrl = 'http://10.221.98.204:5173';

  const handleCopy = () => {
    navigator.clipboard?.writeText(expoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-full pb-20 bg-slate-950 text-slate-100">
      
      {/* Top Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-extrabold text-sm text-white">App Scanner & Mobile Connect</h1>
            <p className="text-[11px] text-slate-400">Scan QR Code with Phone</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
          Expo Go Ready
        </span>
      </div>

      <div className="p-4 space-y-4">
        
        {/* Main QR Code Frame */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs font-bold uppercase tracking-wider mb-2">
            📱 Official Expo Mobile QR
          </div>
          <h2 className="font-extrabold text-base text-white">
            Run Sarathi on Your Android or iPhone
          </h2>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Point your phone camera or Expo Go scanner at this QR code:
          </p>

          {/* QR Code Container */}
          <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl mx-auto mb-4 border-4 border-slate-800">
            <img
              src="/public/expo_qr_code.png"
              alt="Sarathi Expo Go QR Code"
              className="w-56 h-56 object-contain block"
              onError={(e) => {
                // Fallback to inline SVG if image loading
                e.target.style.display = 'none';
              }}
            />
          </div>

          {/* Connection URL with copy pill */}
          <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-2 max-w-xs mx-auto mb-3">
            <span className="font-mono text-[11px] text-brand-400 truncate">{expoUrl}</span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white shrink-0"
              title="Copy Expo URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 text-left text-xs space-y-2 text-slate-300">
            <p className="font-bold text-white text-[11px] uppercase tracking-wider">How to scan with phone:</p>
            <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-400">
              <li>Open <strong>Play Store</strong> (Android) or <strong>App Store</strong> (iOS) and install <strong>Expo Go</strong>.</li>
              <li><strong>Android:</strong> Open Expo Go and tap "Scan QR code".</li>
              <li><strong>iOS:</strong> Open the built-in iOS Camera app and tap the detected Expo banner.</li>
              <li>Ensure your phone and computer are connected to the same local Wi-Fi.</li>
            </ol>
          </div>
        </div>

        {/* In-App Trip Verification QR Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            🛡️ Security Trip Check-in QR
          </div>
          <h3 className="font-extrabold text-sm text-white">
            Customer Trip Check-in QR Code
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            When customer books a driver, this scannable token is presented to the chauffeur for instant verification:
          </p>

          <div className="bg-white p-3 rounded-2xl inline-block shadow-lg mx-auto mb-3">
            <img
              src="/public/trip_sample_qr.png"
              alt="Trip Sample QR"
              className="w-36 h-36 object-contain block"
            />
          </div>

          <div className="font-mono text-xs text-slate-400 font-semibold">
            Payload: SARATHI:TRIP:SRT-2026-8821:OTP-4821
          </div>
        </div>

      </div>
    </div>
  );
}
