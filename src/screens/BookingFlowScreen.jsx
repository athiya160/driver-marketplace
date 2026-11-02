import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Car,
  MapPin,
  CreditCard,
  Tag,
  AlertCircle,
  Sparkles,
  Lock
} from 'lucide-react';
import { PAYMENT_METHODS } from '../constants.js';
import { estimateFare, createBooking } from '../api.js';

export default function BookingFlowScreen({
  onBack,
  onBookingSuccess,
  selectedDriver,
  bookingForm,
  currentUser
}) {
  const [fare, setFare] = useState(null);
  const [loadingFare, setLoadingFare] = useState(true);
  const [couponInput, setCouponInput] = useState(bookingForm.couponCode || '');
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [specialNote, setSpecialNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState(null);
  const [razorpayModal, setRazorpayModal] = useState(false);

  // Fetch fare estimation on mount or coupon change
  useEffect(() => {
    let isMounted = true;
    setLoadingFare(true);
    estimateFare({
      serviceType: bookingForm.serviceType,
      durationHours: bookingForm.durationHours,
      startTime: bookingForm.startTime,
      couponCode: couponInput,
      luxuryCar: bookingForm.vehicleType === 'Luxury'
    })
      .then(res => {
        if (isMounted && res.success) {
          setFare(res.fare);
        }
      })
      .catch(err => console.error('Fare estimation error:', err))
      .finally(() => {
        if (isMounted) setLoadingFare(false);
      });

    return () => { isMounted = false; };
  }, [bookingForm.serviceType, bookingForm.durationHours, bookingForm.startTime, couponInput, bookingForm.vehicleType]);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    // Handled by state triggering useEffect
  };

  const handleProceedToPayment = () => {
    setConflictError(null);
    if (selectedPayment === 'cash') {
      executeFinalBooking('cash');
    } else {
      // Launch Razorpay Simulator Modal
      setRazorpayModal(true);
    }
  };

  const executeFinalBooking = async (paymentMethod = 'upi') => {
    setSubmitting(true);
    setConflictError(null);

    try {
      const res = await createBooking({
        driverId: selectedDriver ? selectedDriver.id : null,
        serviceType: bookingForm.serviceType,
        transmissionType: bookingForm.transmissionType,
        vehicleType: bookingForm.vehicleType,
        pickupAddress: bookingForm.pickupAddress || 'Customer Address',
        pickupCity: bookingForm.pickupCity || 'Delhi NCR',
        dropAddress: bookingForm.dropAddress || 'Local Travel',
        startDate: bookingForm.startDate || new Date().toISOString().split('T')[0],
        startTime: bookingForm.startTime || '10:00',
        durationHours: bookingForm.durationHours || 4,
        couponCode: fare?.couponCode || null,
        paymentMethod,
        specialInstructions: specialNote
      });

      if (res.success) {
        setRazorpayModal(false);
        onBookingSuccess(res.booking);
      } else if (res.conflict) {
        setRazorpayModal(false);
        setConflictError(res.message);
      } else {
        alert(res.message || 'Booking failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network or server error while placing booking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-20 bg-slate-950 text-slate-100">
      
      {/* Top Navigation */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-extrabold text-sm text-white">Review & Pay</h1>
            <p className="text-[11px] text-slate-400">Step 2 of 2 • Indian Rupee Fare</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>256-Bit SSL</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        
        {/* Driver Summary Card */}
        {selectedDriver ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-center gap-3 shadow-xl">
            <img
              src={selectedDriver.photoUrl}
              alt={selectedDriver.fullName}
              className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
            />
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-white truncate">{selectedDriver.fullName}</h3>
                <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px] font-bold">✓</span>
              </div>
              <p className="text-xs text-slate-400">
                ★ {selectedDriver.rating} ({selectedDriver.totalTrips} rides) • {selectedDriver.experienceYears} yrs exp
              </p>
              <p className="text-[10px] text-brand-400 font-semibold mt-0.5">
                DL: {selectedDriver.drivingLicenceNo}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600/20 text-brand-400 flex items-center justify-center font-bold">
              ⚡
            </div>
            <div>
              <h3 className="font-bold text-xs text-white">Nearest Chauffeur Auto-Dispatch</h3>
              <p className="text-[11px] text-slate-400">Sarathi AI will allocate the highest rated driver nearby.</p>
            </div>
          </div>
        )}

        {/* Schedule & Route Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl text-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Ride Details</span>
            <span className="font-semibold text-brand-400">{bookingForm.transmissionType} • {bookingForm.vehicleType}</span>
          </div>

          <div className="flex items-start gap-2.5">
            <Calendar className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">{bookingForm.startDate} at {bookingForm.startTime}</p>
              <p className="text-slate-400 text-[11px]">Duration: {bookingForm.durationHours} Hours</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white truncate">{bookingForm.pickupAddress || 'Pickup Location'}</p>
              <p className="text-slate-400 text-[11px] truncate">Drop: {bookingForm.dropAddress || 'Local Travel'}</p>
            </div>
          </div>
        </div>

        {/* Conflict Warning Box (If any conflict detected) */}
        {conflictError && (
          <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-2xl text-xs text-red-400 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Driver Booking Conflict Detected</p>
              <p className="text-[11px] mt-0.5">{conflictError}</p>
              <p className="text-[10px] text-slate-400 mt-1">Please select another time slot or driver.</p>
            </div>
          </div>
        )}

        {/* Coupon Code Input */}
        <form onSubmit={handleApplyCoupon} className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="Promo Code (FIRST50, WEEKEND100)"
              className="w-full py-2.5 pl-9 pr-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-brand-400 font-bold text-xs rounded-xl border border-slate-700 transition"
          >
            Apply
          </button>
        </form>

        {/* Indian Fare Breakdown Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Fare Breakdown (INR ₹)</span>
            <span className="text-[10px] text-emerald-400 font-semibold">Taxes Included</span>
          </div>

          {loadingFare || !fare ? (
            <div className="py-6 text-center text-xs text-slate-400 animate-pulse">
              Calculating Indian Fare & GST...
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">{fare.serviceTitle} (Base)</span>
                <span className="font-mono text-slate-200">₹{fare.baseFare}</span>
              </div>

              {fare.extraHoursCharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Extra Hours ({fare.extraHours} hrs @ ₹120/hr)</span>
                  <span className="font-mono text-slate-200">₹{fare.extraHoursCharge}</span>
                </div>
              )}

              {fare.nightCharge > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Night Allowance (10:00 PM - 6:00 AM)</span>
                  <span className="font-mono">₹{fare.nightCharge}</span>
                </div>
              )}

              {fare.outstationDA > 0 && (
                <div className="flex justify-between text-cyan-400">
                  <span>Outstation Driver Daily Allowance (DA)</span>
                  <span className="font-mono">₹{fare.outstationDA}</span>
                </div>
              )}

              {fare.luxurySurcharge > 0 && (
                <div className="flex justify-between text-purple-400">
                  <span>Luxury Chauffeur Certification</span>
                  <span className="font-mono">₹{fare.luxurySurcharge}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-slate-400">Platform Convenience Fee</span>
                <span className="font-mono text-slate-200">₹{fare.platformFee}</span>
              </div>

              {fare.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Coupon Discount ({fare.couponCode})</span>
                  <span className="font-mono">-₹{fare.discountAmount}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Applicable GST (5% Road Transport Rate)</span>
                <span className="font-mono">₹{fare.gstTax}</span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline font-extrabold text-sm text-white">
                <span>Total Amount to Pay</span>
                <span className="font-mono text-lg text-brand-400">₹{fare.totalFare}</span>
              </div>
            </div>
          )}
        </div>

        {/* Payment Method Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Select Payment Method
          </div>
          <div className="space-y-2">
            {PAYMENT_METHODS.map(method => (
              <label
                key={method.id}
                onClick={() => setSelectedPayment(method.id)}
                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                  selectedPayment === method.id
                    ? 'bg-brand-600/15 border-brand-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <p className="font-bold text-xs">{method.name}</p>
                  <p className="text-[10px] text-slate-400">{method.desc}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  selectedPayment === method.id ? 'border-brand-400 bg-brand-500' : 'border-slate-600'
                }`}>
                  {selectedPayment === method.id && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Special Instructions for Driver */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Special Notes for Chauffeur (Optional)
          </label>
          <input
            type="text"
            value={specialNote}
            onChange={(e) => setSpecialNote(e.target.value)}
            placeholder="e.g., Car is Honda City ZX Automatic, please call upon arrival."
            className="w-full py-2.5 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Big Action Button */}
        <button
          onClick={handleProceedToPayment}
          disabled={submitting || loadingFare}
          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {submitting ? 'Confirming with Chauffeur...' : `Pay ₹${fare?.totalFare || 0} & Book Driver`}
          </span>
        </button>

      </div>

      {/* Razorpay Indian Payment Gateway Sandbox Modal */}
      {razorpayModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-5 shadow-2xl relative text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  R
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-white">Razorpay Sandbox Gateway</h3>
                  <p className="text-[10px] text-slate-400">Sarathi Mobility Technologies</p>
                </div>
              </div>
              <span className="font-mono font-bold text-sm text-brand-400">₹{fare?.totalFare}</span>
            </div>

            <div className="text-xs text-slate-300 mb-4">
              Select Indian payment method to complete sandbox transaction:
            </div>

            {/* UPI Options */}
            <div className="space-y-2 mb-4">
              <button
                onClick={() => executeFinalBooking('upi')}
                disabled={submitting}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-brand-500 flex items-center justify-between text-xs font-semibold text-left transition"
              >
                <span>Google Pay / PhonePe / Paytm UPI</span>
                <span className="text-[10px] text-emerald-400 font-bold">Fastest</span>
              </button>
              <button
                onClick={() => executeFinalBooking('card')}
                disabled={submitting}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-brand-500 flex items-center justify-between text-xs font-semibold text-left transition"
              >
                <span>Credit / Debit Card (Visa, RuPay, MC)</span>
                <span className="text-[10px] text-slate-400">Cards</span>
              </button>
              <button
                onClick={() => executeFinalBooking('netbanking')}
                disabled={submitting}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-brand-500 flex items-center justify-between text-xs font-semibold text-left transition"
              >
                <span>Net Banking (SBI, HDFC, ICICI)</span>
                <span className="text-[10px] text-slate-400">Banks</span>
              </button>
            </div>

            <button
              onClick={() => setRazorpayModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
