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
  Lock,
  CheckCircle2,
  Phone,
  X
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
    <div className="space-y-6">
      
      {/* Top Navigation Bar */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-100 text-[#0B1329] hover:bg-slate-200 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Back to Driver Selection"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-extrabold text-lg text-[#0B1329] font-display">
              Review & Confirm Booking
            </h1>
            <p className="text-xs text-slate-500">
              Personal Chauffeur for Your Own Car • Step 2 of 2
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>256-Bit SSL Encrypted Handshake</span>
        </div>
      </div>

      {/* Main 2-Column Desktop Grid / 1-Column Mobile Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (7 cols): Journey Details, Vehicle & Notes */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Driver Summary Card */}
          {selectedDriver ? (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex items-center gap-4">
              <img
                src={selectedDriver.photoUrl}
                alt={selectedDriver.fullName}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
              />
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-[#0B1329] truncate font-display">
                    {selectedDriver.fullName}
                  </h3>
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  ★ {selectedDriver.rating} ({selectedDriver.totalTrips} verified rides) • {selectedDriver.experienceYears} Years Experience
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Commercial DL & Police Cleared</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0B1329] text-[#D4AF37] flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#0B1329]">Nearest Top-Rated Chauffeur Allocation</h3>
                <p className="text-xs text-slate-500">Sarathi dispatch engine allocates the closest verified driver for your vehicle type.</p>
              </div>
            </div>
          )}

          {/* Schedule & Route Details */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-extrabold text-xs text-[#0B1329] uppercase tracking-wider">Ride Itinerary</span>
              <span className="font-bold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {bookingForm.transmissionType} • {bookingForm.vehicleType}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <Calendar className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Date & Time</span>
                  <p className="font-bold text-xs text-[#0B1329] mt-0.5">{bookingForm.startDate} at {bookingForm.startTime}</p>
                  <p className="text-[11px] text-slate-500">Duration: {bookingForm.durationHours} Hours Package</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <Car className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Vehicle Specification</span>
                  <p className="font-bold text-xs text-[#0B1329] mt-0.5">{bookingForm.transmissionType} Transmission</p>
                  <p className="text-[11px] text-slate-500">{bookingForm.vehicleType} Category</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  P
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Pickup Location</span>
                  <p className="font-semibold text-xs text-[#0B1329]">{bookingForm.pickupAddress || 'Customer Address'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  D
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Destination</span>
                  <p className="font-semibold text-xs text-[#0B1329]">{bookingForm.dropAddress || 'Local City Travel'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Conflict Error Notice */}
          {conflictError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl text-xs text-rose-700 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-bold">Driver Booking Schedule Conflict</p>
                <p className="text-[11px] mt-0.5">{conflictError}</p>
                <p className="text-[10px] text-slate-500 mt-1">Please select another time slot or chauffeur.</p>
              </div>
            </div>
          )}

          {/* Special Instructions for Driver */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-2">
            <label className="block text-xs font-bold text-[#0B1329]">
              Special Instructions for Chauffeur (Optional)
            </label>
            <input
              type="text"
              value={specialNote}
              onChange={(e) => setSpecialNote(e.target.value)}
              placeholder="e.g., Car is Honda City ZX Automatic, please call 10 mins prior to arrival."
              className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-[#172033] focus:outline-none focus:border-[#0B1329] transition placeholder-slate-400"
            />
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#0B1329]">
              Select Payment Method
            </div>
            <div className="space-y-2">
              {PAYMENT_METHODS.map(method => (
                <label
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                    selectedPayment === method.id
                      ? 'bg-amber-50/60 border-[#D4AF37] text-[#0B1329]'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <p className="font-bold text-xs">{method.name}</p>
                    <p className="text-[11px] text-slate-500">{method.desc}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedPayment === method.id ? 'border-[#0B1329] bg-[#0B1329]' : 'border-slate-300'
                  }`}>
                    {selectedPayment === method.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (5 cols): Itemized Fare Breakdown & Action CTA */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Coupon Code Input */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-xs">
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Promo Code (FIRST50)"
                  className="w-full py-2.5 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-[#0B1329] uppercase focus:outline-none focus:border-[#0B1329]"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#0B1329] hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition"
              >
                Apply
              </button>
            </form>
          </div>

          {/* Indian Fare Breakdown Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-extrabold text-xs uppercase tracking-wider text-[#0B1329]">
                Itemized Fare Breakdown
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                INR (₹) Taxes Included
              </span>
            </div>

            {loadingFare || !fare ? (
              <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
                Calculating Indian Fare & GST Breakdown...
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">{fare.serviceTitle}</span>
                  <span className="font-mono text-[#0B1329] font-bold">₹{fare.baseFare}</span>
                </div>

                {fare.extraHoursCharge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Extra Hours ({fare.extraHours} hrs @ ₹120/hr)</span>
                    <span className="font-mono text-[#0B1329] font-semibold">₹{fare.extraHoursCharge}</span>
                  </div>
                )}

                {fare.nightCharge > 0 && (
                  <div className="flex justify-between text-amber-800 font-semibold">
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
                    <span>Luxury Vehicle Specialization</span>
                    <span className="font-mono">₹{fare.luxurySurcharge}</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">Platform Convenience Fee</span>
                  {fare.platformFee === 0 ? (
                    <span className="font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      ₹0 (Founding Launch Waiver)
                    </span>
                  ) : (
                    <span className="font-mono text-[#0B1329] font-semibold">₹{fare.platformFee}</span>
                  )}
                </div>

                {fare.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Coupon Discount ({fare.couponCode})</span>
                    <span className="font-mono">-₹{fare.discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500 text-[11px] pt-1">
                  <span>Applicable GST (5% Road Transport Rate)</span>
                  <span className="font-mono">₹{fare.gstTax}</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline font-extrabold text-base text-[#0B1329]">
                  <span>Total Payable Amount</span>
                  <span className="font-mono text-2xl text-amber-600 font-black">
                    ₹{fare.totalFare}
                  </span>
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              onClick={handleProceedToPayment}
              disabled={submitting || loadingFare}
              className="w-full min-h-[48px] py-4 bg-[#0B1329] hover:bg-slate-900 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-4"
            >
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>
                {submitting ? 'Confirming with Chauffeur...' : (
                  selectedPayment === 'direct_chauffeur_upi_cash'
                    ? `Confirm Booking • Pay ₹${fare?.totalFare || 0} Directly to Chauffeur`
                    : (selectedPayment === 'cash'
                        ? `Book Chauffeur • Pay ₹${fare?.totalFare || 0} Cash`
                        : `Pay ₹${fare?.totalFare || 0} & Confirm Booking`)
                )}
              </span>
            </button>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>4-Digit OTP Security Protection</span>
              </div>
              <p>Your unique trip code will appear once confirmed. Share it only with your chauffeur upon arrival.</p>
            </div>

          </div>

        </div>

      </div>

      {/* Razorpay Sandbox Payment Modal */}
      {razorpayModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  R
                </div>
                <span className="font-extrabold text-sm text-[#0B1329]">Razorpay Checkout Sandbox</span>
              </div>
              <button onClick={() => setRazorpayModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>Simulated transaction for <strong>₹{fare?.totalFare || 0}</strong>.</p>
              <p className="text-[11px] text-slate-400">Sandbox mode active. No actual bank funds are deducted.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => executeFinalBooking('razorpay_upi')}
                disabled={submitting}
                className="py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
              >
                {submitting ? 'Processing...' : 'Simulate UPI Success'}
              </button>
              <button
                onClick={() => setRazorpayModal(false)}
                className="py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
