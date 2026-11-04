import React, { useState, useEffect } from 'react';
import {
  X,
  FileCheck2,
  Gauge,
  Fuel,
  Sparkles,
  Camera,
  AlertCircle,
  CheckCircle2,
  Clock,
  Car
} from 'lucide-react';
import { recordVehicleHandover, fetchVehicleHandovers } from '../api.js';

export default function DigitalVehicleHandoverModal({
  isOpen,
  onClose,
  booking,
  handoverType = 'pre_trip_handover',
  onHandoverComplete
}) {
  const [odometer, setOdometer] = useState(booking?.odometerStart || 42180);
  const [fuelPercent, setFuelPercent] = useState(85);
  const [cleanliness, setCleanliness] = useState(5);
  const [selectedDamages, setSelectedDamages] = useState([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingRecord, setExistingRecord] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const COMMON_INSPECTION_ITEMS = [
    'Front Bumper (Clean)',
    'Rear Bumper Scratch (Minor)',
    'Right Side Minor Dent',
    'Windshield & Wipers (OK)',
    'Spare Wheel & Jack Verified',
    'Dashboard & Valet Tag Verified'
  ];

  useEffect(() => {
    if (isOpen && booking?.id) {
      fetchVehicleHandovers(booking.id)
        .then(res => {
          if (res.success && res.handovers) {
            const match = res.handovers.find(h => h.handoverType === handoverType);
            if (match) setExistingRecord(match);
          }
        })
        .catch(err => console.error(err));
    }
  }, [isOpen, booking?.id, handoverType]);

  if (!isOpen || !booking) return null;

  const toggleDamage = (item) => {
    if (selectedDamages.includes(item)) {
      setSelectedDamages(selectedDamages.filter(d => d !== item));
    } else {
      setSelectedDamages([...selectedDamages, item]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        bookingId: booking.id,
        customerId: booking.customerId,
        driverId: booking.driverId,
        vehicleModel: booking.vehicleType ? `${booking.vehicleType} (${booking.transmissionType || 'Auto'})` : 'Honda City ZX',
        vehicleRegNumber: booking.vehicleRegNumber || 'DL 03 CA 8821',
        handoverType,
        odometerReadingKm: Number(odometer),
        fuelLevelPercent: Number(fuelPercent),
        existingDamages: selectedDamages.map(d => ({ description: d, severity: d.includes('Scratch') ? 'minor' : 'clean' })),
        photoUrls: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'],
        cleanlinessRating: cleanliness,
        handoverNotes: notes,
        customerSignatureToken: `sig_${booking.customerId}_${Date.now()}`
      };

      const res = await recordVehicleHandover(payload);
      if (res.success) {
        setExistingRecord(res.handover);
        setSuccessMessage('Vehicle inspection verified and digitally signed.');
        if (onHandoverComplete) onHandoverComplete(res.handover);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const isPreTrip = handoverType === 'pre_trip_handover';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-sans">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-5 shadow-2xl relative text-[#172033] max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-[#0F1E36]">
                {isPreTrip ? 'Pre-Trip Vehicle Handover' : 'Post-Trip Vehicle Return Handover'}
              </h2>
              <p className="text-[10px] text-slate-500">
                Booking Ref: <span className="font-mono font-bold text-orange-600">{booking.bookingReference}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Existing Confirmed Record Badge */}
        {existingRecord && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Digital Handover Confirmed & Signed</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] mt-2">
              <div>Odometer: <span className="font-mono font-bold">{existingRecord.odometerReadingKm} KM</span></div>
              <div>Fuel Gauge: <span className="font-mono font-bold">{existingRecord.fuelLevelPercent}%</span></div>
              <div>Cleanliness: <span className="font-bold">{existingRecord.cleanlinessRating}/5 ★</span></div>
              <div>Confirmed: <span className="font-mono text-[10px]">{new Date(existingRecord.confirmedAt || existingRecord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Inspection Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Vehicle Model & Registration */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-slate-500" />
              <div>
                <span className="font-bold text-[#0F1E36] block">{booking.vehicleType || 'Sedan'} (Customer Owned)</span>
                <span className="text-[10px] text-slate-500 font-mono">Reg: {booking.vehicleRegNumber || 'DL 03 CA 8821'}</span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold uppercase">
              {isPreTrip ? 'Handover' : 'Return'}
            </span>
          </div>

          {/* Odometer Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-orange-500" />
                Current Odometer Reading
              </span>
              <span className="text-[10px] text-slate-400">Kilometers</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                disabled={Boolean(existingRecord)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-[#0F1E36] focus:outline-none focus:border-orange-500"
                placeholder="e.g. 42180"
              />
              <span className="absolute right-3 top-2 text-[11px] font-bold text-slate-400">KM</span>
            </div>
          </div>

          {/* Fuel Level Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-amber-500" />
                Fuel Gauge / Battery Level
              </span>
              <span className="font-mono text-orange-600 font-extrabold">{fuelPercent}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={fuelPercent}
              onChange={(e) => setFuelPercent(e.target.value)}
              disabled={Boolean(existingRecord)}
              className="w-full accent-orange-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
              <span>E (0%)</span>
              <span>1/4</span>
              <span>1/2 (50%)</span>
              <span>3/4</span>
              <span>F (100%)</span>
            </div>
          </div>

          {/* Condition & Exterior Checklist */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Pre-existing Condition & Scratch Checklist
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {COMMON_INSPECTION_ITEMS.map((item, i) => {
                const isSelected = selectedDamages.includes(item);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={Boolean(existingRecord)}
                    onClick={() => toggleDamage(item)}
                    className={`p-2 rounded-xl text-[10px] text-left font-semibold transition border flex items-center justify-between ${
                      isSelected
                        ? 'bg-orange-50 border-orange-300 text-orange-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{item}</span>
                    <span className="text-[10px]">{isSelected ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cleanliness Rating */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Interior & Valet Cleanliness
            </label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  disabled={Boolean(existingRecord)}
                  onClick={() => setCleanliness(star)}
                  className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition ${
                    cleanliness >= star
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  ★ {star}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Handover Remarks / Valet Instructions
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={Boolean(existingRecord)}
              placeholder="e.g. Fastag on windshield, ignition key handed over"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#172033] focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Action Button */}
          {!existingRecord ? (
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#0F1E36] hover:bg-[#1A2F45] text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-1.5 mt-2"
            >
              <span>{submitting ? 'Signing Inspection Record...' : 'Confirm & Sign Digital Handover'}</span>
              <CheckCircle2 className="w-4 h-4 text-orange-400" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition"
            >
              Close Handover Record
            </button>
          )}

        </form>

      </div>
    </div>
  );
}
