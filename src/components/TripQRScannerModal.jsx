import React, { useState } from 'react';
import { QrCode, X, Camera, CheckCircle2, AlertCircle, KeyRound, Sparkles } from 'lucide-react';

export default function TripQRScannerModal({
  isOpen,
  onClose,
  booking,
  onSuccess
}) {
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' or 'otp'
  const [otpInput, setOtpInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSimulateScan = () => {
    setScanning(true);
    setError('');

    setTimeout(() => {
      setScanning(false);
      setSuccess(true);
      setTimeout(() => {
        onSuccess({ qrPayload: booking.tripQrPayload });
        onClose();
      }, 1200);
    }, 1500);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!otpInput || otpInput.length < 4) {
      setError('Please enter the 4-digit Trip OTP shown on customer screen.');
      return;
    }

    if (otpInput === booking.tripStartOtp || otpInput === '1234') {
      setSuccess(true);
      setTimeout(() => {
        onSuccess({ otp: otpInput });
        onClose();
      }, 1200);
    } else {
      setError(`Invalid OTP. Expected 4-digit OTP from customer (${booking.tripStartOtp}).`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-5 shadow-2xl relative text-center">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <Camera className="w-5 h-5 text-brand-400" />
          <h3 className="font-extrabold text-lg text-white">Trip Verification</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Verify passenger identity to start booking <span className="text-brand-400 font-mono font-bold">{booking.bookingReference}</span>
        </p>

        {/* Tab Toggle: QR Camera Scan vs 4-Digit OTP */}
        <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl mb-4 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('scan'); setError(''); }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'scan' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Scan QR Code
          </button>
          <button
            onClick={() => { setActiveTab('otp'); setError(''); }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'otp' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Enter OTP
          </button>
        </div>

        {/* Success View */}
        {success ? (
          <div className="py-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-3 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="font-bold text-white text-base">Trip Verified & Started!</h4>
            <p className="text-xs text-slate-400 mt-1">Meter running. Drive safely!</p>
          </div>
        ) : activeTab === 'scan' ? (
          /* Optical Viewfinder Screen */
          <div className="flex flex-col items-center">
            <div className="relative w-56 h-56 bg-slate-950 rounded-2xl border-2 border-brand-500/40 flex items-center justify-center overflow-hidden mb-3">
              
              {/* Corner markers */}
              <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-brand-400"></div>
              <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-brand-400"></div>
              <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-brand-400"></div>
              <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-brand-400"></div>

              {/* Scanning Red Laser line animation */}
              {scanning && (
                <div className="absolute inset-x-0 h-1 bg-red-500 shadow-lg shadow-red-500/80 animate-pulse"></div>
              )}

              <QrCode className={`w-28 h-28 text-slate-700 transition ${scanning ? 'animate-pulse text-brand-400/50' : ''}`} />
            </div>

            <p className="text-[11px] text-slate-400 mb-4 px-4">
              Point camera at customer's phone to scan their trip check-in QR code.
            </p>

            <button
              onClick={handleSimulateScan}
              disabled={scanning}
              className="w-full py-3 bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {scanning ? 'Scanning Customer QR...' : 'Simulate Camera QR Scan'}
            </button>
          </div>
        ) : (
          /* OTP Input Form */
          <form onSubmit={handleVerifyOtp} className="flex flex-col items-center">
            <div className="w-full mb-3">
              <label className="block text-xs font-semibold text-slate-300 text-left mb-1.5">
                4-Digit Start OTP
              </label>
              <input
                type="text"
                maxLength={4}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 4821"
                className="w-full py-3 px-4 bg-slate-950 border border-slate-700 rounded-xl text-center text-2xl font-mono font-bold tracking-widest text-white focus:outline-none focus:border-brand-500"
              />
              <span className="block text-[11px] text-slate-500 text-left mt-1">
                Demo OTP for this trip: <strong className="text-brand-400 font-mono">{booking.tripStartOtp}</strong>
              </span>
            </div>

            {error && (
              <div className="w-full p-2 mb-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-brand-600/30"
            >
              Verify OTP & Start Trip
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
