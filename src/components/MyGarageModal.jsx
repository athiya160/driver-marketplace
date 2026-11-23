import React, { useState, useEffect } from 'react';
import {
  Car,
  Plus,
  Check,
  Trash2,
  X,
  Sparkles,
  ShieldCheck,
  Zap,
  Fuel,
  Cpu,
  ChevronRight,
  Info
} from 'lucide-react';

const DEFAULT_PRESET_VEHICLES = [
  {
    id: 'veh_creta',
    makeModel: 'Hyundai Creta SX(O)',
    bodyType: 'SUV',
    transmission: 'Automatic',
    fuelType: 'Diesel',
    regNumber: 'KA-01-MJ-4821',
    isDefault: true,
    tag: 'Primary Commuter'
  },
  {
    id: 'veh_nexon_ev',
    makeModel: 'Tata Nexon EV Max',
    bodyType: 'SUV',
    transmission: 'Automatic',
    fuelType: 'Electric',
    regNumber: 'KA-03-EV-2026',
    isDefault: false,
    tag: 'City Eco Drive'
  },
  {
    id: 'veh_city',
    makeModel: 'Honda City i-VTEC',
    bodyType: 'Sedan',
    transmission: 'Manual',
    fuelType: 'Petrol',
    regNumber: 'KA-05-HC-8819',
    isDefault: false,
    tag: 'Family Sedan'
  }
];

export default function MyGarageModal({
  isOpen,
  onClose,
  selectedVehicleId,
  onSelectVehicle
}) {
  const [vehicles, setVehicles] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sarathi_user_garage');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Error reading garage from localStorage', e);
      }
    }
    return DEFAULT_PRESET_VEHICLES;
  });

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCar, setNewCar] = useState({
    makeModel: '',
    bodyType: 'Sedan',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    regNumber: '',
    tag: 'Personal Car'
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sarathi_user_garage', JSON.stringify(vehicles));
      } catch (e) {
        console.error('Error saving garage to localStorage', e);
      }
    }
  }, [vehicles]);

  if (!isOpen) return null;

  const handleAddNew = (e) => {
    e.preventDefault();
    if (!newCar.makeModel.trim()) return;

    const created = {
      id: `veh_${Date.now()}`,
      makeModel: newCar.makeModel.trim(),
      bodyType: newCar.bodyType,
      transmission: newCar.transmission,
      fuelType: newCar.fuelType,
      regNumber: newCar.regNumber.trim().toUpperCase() || 'KA-01-TEMP-0000',
      tag: newCar.tag || 'My Car',
      isDefault: vehicles.length === 0
    };

    setVehicles(prev => [created, ...prev]);
    setIsAddingNew(false);
    setNewCar({
      makeModel: '',
      bodyType: 'Sedan',
      transmission: 'Automatic',
      fuelType: 'Petrol',
      regNumber: '',
      tag: 'Personal Car'
    });
    if (onSelectVehicle) onSelectVehicle(created);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (vehicles.length <= 1) {
      alert('You must have at least one vehicle in your garage.');
      return;
    }
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0B1329] to-[#1E293B] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-[#D4AF37] flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight font-display">My Vehicle Vault</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {vehicles.length} Vehicles
                </span>
              </div>
              <p className="text-xs text-slate-300">Select the vehicle your chauffeur will pilot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Chauffeur Transmission Compatibility Note */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold">Skill Matching Guarantee:</span>
              <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                When you select a car, Sarathi dispatches only chauffeurs verified for that specific transmission (Manual or Automatic) and body style.
              </p>
            </div>
          </div>

          {/* List of Vehicles */}
          {!isAddingNew ? (
            <div className="space-y-2.5">
              {vehicles.map(v => {
                const isSelected = selectedVehicleId === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => {
                      if (onSelectVehicle) onSelectVehicle(v);
                      onClose();
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer relative flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#0B1329] bg-slate-50 ring-2 ring-[#0B1329]/10 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#0B1329] text-[#D4AF37]' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Car className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-[#0B1329] truncate">{v.makeModel}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {v.tag}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1 font-mono">
                          <span className="font-semibold text-slate-700">{v.regNumber}</span>
                          <span>•</span>
                          <span className="capitalize">{v.bodyType}</span>
                          <span>•</span>
                          <span className="font-bold text-[#0B1329]">{v.transmission}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">{v.fuelType}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected ? (
                        <div className="w-7 h-7 rounded-full bg-[#0B1329] text-white flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleDelete(v.id, e)}
                          title="Remove vehicle"
                          className="w-8 h-8 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="w-full py-3.5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#0B1329] text-slate-600 hover:text-[#0B1329] text-xs font-extrabold flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Personal Vehicle</span>
              </button>
            </div>
          ) : (
            /* Add New Vehicle Form */
            <form onSubmit={handleAddNew} className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-extrabold text-xs text-[#0B1329] uppercase tracking-wider">Add Vehicle to Vault</h4>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Car Brand & Model
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hyundai Creta, Toyota Fortuner, Honda City"
                  value={newCar.makeModel}
                  onChange={e => setNewCar(prev => ({ ...prev, makeModel: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B1329]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Transmission
                  </label>
                  <select
                    value={newCar.transmission}
                    onChange={e => setNewCar(prev => ({ ...prev, transmission: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-800"
                  >
                    <option value="Automatic">Automatic (AT / CVT / DCT)</option>
                    <option value="Manual">Manual (MT)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Body Type
                  </label>
                  <select
                    value={newCar.bodyType}
                    onChange={e => setNewCar(prev => ({ ...prev, bodyType: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-800"
                  >
                    <option value="Hatchback">Hatchback</option>
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV / MUV</option>
                    <option value="Luxury">Luxury / German</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Fuel / Powertrain
                  </label>
                  <select
                    value={newCar.fuelType}
                    onChange={e => setNewCar(prev => ({ ...prev, fuelType: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-800"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric (EV)</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Registration No. (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. KA-01-AB-1234"
                    value={newCar.regNumber}
                    onChange={e => setNewCar(prev => ({ ...prev, regNumber: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 uppercase"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#0B1329] hover:bg-slate-900 text-white text-xs font-extrabold transition shadow-md"
              >
                Save Vehicle & Select
              </button>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 text-[11px]">
            Your car details remain private and are only shown to assigned chauffeurs.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition text-xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
