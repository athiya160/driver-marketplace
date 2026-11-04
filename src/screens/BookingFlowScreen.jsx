import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Clock,
  Car,
  MapPin,
  Tag,
  AlertCircle,
  Sparkles,
  Lock
} from 'lucide-react';
import { PAYMENT_METHODS } from '../constants.js';
import { BRAND } from '../config/branding.js';
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
  const [selectedPayment, setSelectedPayment] = useState('direct_chauffeur_upi_cash');
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
  };

  const handleProceedToPayment = () => {
    setConflictError(null);
    if (selectedPayment === 'cash' || selectedPayment === 'direct_chauffeur_upi_cash') {
      executeFinalBooking(selectedPayment);
    } else {
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
    <div className="flex flex-col min-h-full pb-20 bg-[#F8FAFC] text-[#172033]">
      
      {/* Top Navigation */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 text-[#0F1E36] hover:bg-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-extrabold text-sm text-[#0F1E36]">Review & Pay</h1>
            <p className="text-[11px] text-slate-500">Step 2 of 2 • Indian Rupee Fare</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>256-Bit SSL</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        
        {/* Driver Summary Card */}
        {selectedDriver ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <img
              src={selectedDriver.photoUrl}
              alt={selectedDriver.fullName}
              className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
            />
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-[#0F1E36] truncate">{selectedDriver.fullName}</h3>
                <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px] font-bold">✓</span>
              </div>
              <p className="text-xs text-slate-500">
                ★ {selectedDriver.rating} ({selectedDriver.totalTrips} rides) • {selectedDriver.experienceYears} yrs exp
              </p>
              <p className="text-[10px] text-orange-600 font-semibold mt-0.5">
                DL: {selectedDriver.drivingLicenceNo}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              ⚡
            </div>
            <div>
              <h3 className="font-bold text-xs text-[#0F1E36]">Nearest Chauffeur Auto-Dispatch</h3>
              <p className="text-[11px] text-slate-500">{BRAND.appName} AI will allocate the highest rated driver nearby.</p>
            </div>
          </div>
        )}

        {/* Schedule & Route Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Ride Details</span>
            <span className="font-semibold text-orange-600">{bookingForm.transmissionType} • {bookingForm.vehicleType}</span>
          </div>

          <div className="flex items-start gap-2.5">
            <Calendar className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#0F1E36]">{bookingForm.startDate} at {bookingForm.startTime}</p>
              <p className="text-slate-500 text-[11px]">Duration: {bookingForm.durationHours} Hours</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#0F1E36] truncate">{bookingForm.pickupAddress || 'Pickup Location'}</p>
              <p className="text-slate-500 text-[11px] truncate">Drop: {bookingForm.dropAddress || 'Local Travel'}</p>
            </div>
          </div>
        </div>

        {/* Conflict Warning Box (If any conflict detected) */}
        {conflictError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <div>
              <p className="font-bold">Driver Booking Conflict Detected</p>
              <p className="text-[11px] mt-0.5">{conflictError}</p>
              <p className="text-[10px] text-slate-500 mt-1">Please select another time slot or driver.</p>
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
              className="w-full py-2.5 pl-9 pr-3 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-[#0F1E36] uppercase focus:outline-none focus:border-orange-500 shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#0F1E36] font-bold text-xs rounded-xl border border-slate-200 transition"
          >
            Apply
          </button>
        </form>

        {/* Indian Fare Breakdown Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Fare Breakdown (INR ₹)</span>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Taxes Included</span>
          </div>

          {loadingFare || !fare ? (
            <div className="py-6 text-center text-xs text-slate-400 animate-pulse">
              Calculating Indian Fare & GST...
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">{fare.serviceTitle} (Base)</span>
                <span className="font-mono text-[#0F1E36] font-semibold">₹{fare.baseFare}</span>
              </div>

              {fare.extraHoursCharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Extra Hours ({fare.extraHours} hrs @ ₹120/hr)</span>
                  <span className="font-mono text-[#0F1E36] font-semibold">₹{fare.extraHoursCharge}</span>
                </div>
              )}

              {fare.nightCharge > 0 && (
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Night Allowance (10:00 PM - 6:00 AM)</span>
                  <span className="font-mono">₹{fare.nightCharge}</span>
                </div>
              )}

              {fare.outstationDA > 0 && (
                <div className="flex justify-between text-blue-700 font-semibold">
                  <span>Outstation Driver Daily Allowance (DA)</span>
                  <span className="font-mono">₹{fare.outstationDA}</span>
                </div>
              )}

              {fare.luxurySurcharge > 0 && (
                <div className="flex justify-between text-purple-700 font-semibold">
                  <span>Luxury Chauffeur Certification</span>
                  <span className="font-mono">₹{fare.luxurySurcharge}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-slate-600">Platform Convenience Fee</span>
                {fare.platformFee === 0 ? (
                  <span className="font-mono text-emerald-600 font-bold">₹0 (Founding Launch Waiver)</span>
                ) : (
                  <span className="font-mono text-[#0F1E36] font-semibold">₹{fare.platformFee}</span>
                )}
              </div>

              {fare.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Discount ({fare.couponCode})</span>
                  <span className="font-mono">-₹{fare.discountAmount}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Applicable GST (5% Road Transport Rate)</span>
                <span className="font-mono">₹{fare.gstTax}</span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline font-extrabold text-sm text-[#0F1E36]">
                <span>Total Amount to Pay</span>
                <span className="font-mono text-lg text-orange-600">₹{fare.totalFare}</span>
              </div>
            </div>
          )}
        </div>

        {/* Payment Method Selector */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Select Payment Method
          </div>
          <div className="space-y-2">
            {PAYMENT_METHODS.map(method => (
              <label
                key={method.id}
                onClick={() => setSelectedPayment(method.id)}
                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                  selectedPayment === method.id
                    ? 'bg-orange-50/70 border-orange-500 text-[#0F1E36]'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <p className="font-bold text-xs">{method.name}</p>
                  <p className="text-[10px] text-slate-500">{method.desc}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  selectedPayment === method.id ? 'border-orange-500 bg-orange-500' : 'border-slate-300'
                }`}>
                  {selectedPayment === method.id && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Special Instructions for Driver */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Special Notes for Chauffeur (Optional)
          </label>
          <input
            type="text"
            value={specialNote}
            onChange={(e) => setSpecialNote(e.target.value)}
            placeholder="e.g., Car is Honda City ZX Automatic, please call upon arrival."
            className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs text-[#172033] placeholder-slate-400 focus:outline-none focus:border-orange-500 shadow-sm"
          />
        </div>

        {/* Primary Booking / Payment CTA */}
        <button
          onClick={handleProceedToPayment}
          disabled={submitting || loadingFare}
          className="w-full min-h-[48px] py-4 bg-[#0B1329] hover:bg-[#152347] text-white font-extrabold text-sm rounded-2xl shadow-lg border border-[#D4AF37]/40 flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-[0.99]"
        >
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span>
            {submitting ? 'Confirming with Chauffeur...' : (
              selectedPayment === 'direct_chauffeur_upi_cash'
                ? `Confirm Booking • Pay ₹${fare?.totalFare || 0} Directly to Chauffeur`
                : (selectedPayment === 'cash'
                    ? `Book Driver • Pay ₹${fare?.totalFare || 0} Cash`
                    : `Pay ₹${fare?.totalFare || 0} & Book Driver`)
            )}
          </span>
        </button>

      </div>

      {/* Razorpay Indian Payment Gateway Sandbox Modal */}
      {razorpayModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl p-5 shadow-2xl relative text-[#172033]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  R
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-[#0F1E36]">Razorpay Sandbox Gateway</h3>
                  <p className="text-[10px] text-slate-500">{BRAND.companyLegalName}</p>
                </div>
              </div>
              <span className="font-mono font-bold text-sm text-orange-600">₹{fare?.totalFare}</span>
            </div>

            <div className="text-xs text-slate-600 mb-4">
              Select Indian payment method to complete sandbox transaction:
            </div>

            {/* UPI Options */}
            <div className="space-y-2 mb-4">
              <button
                onClick={() => executeFinalBooking('upi')}
                disabled={submitting}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-orange-500 flex items-center justify-between text-xs font-semibold text-left transition"
              >
                <span>Google Pay / PhonePe / Paytm UPI</span>
                <span className="text-[10px] text-emerald-600 font-bold">Fastest</span>
              </button>
              <button
                onClick={() => executeFinalBooking('card')}
                disabled={submitting}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-orange-500 flex items-center justify-between text-xs font-semibold text-left transition"
              >
                <span>Credit / Debit Card (Visa, RuPay, MC)</span>
                <span className="text-[10px] text-slate-500">Cards</span>
              </button>
              <button
                onClick={() => executeFinalBooking('netbanking')}
                disabled={submitting}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-orange-500 flex items-center justify-between text-xs font-semibold text-left transition"
              >
                <span>Net Banking (SBI, HDFC, ICICI)</span>
                <span className="text-[10px] text-slate-500">Banks</span>
              </button>
            </div>

            <button
              onClick={() => setRazorpayModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
