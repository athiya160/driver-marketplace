import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Shield,
  Heart,
  Phone,
  Share2,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { fetchFamilyCircle, addFamilyMember, removeFamilyMember, notifyFamilyCircle } from '../api.js';

export default function FamilyCircleModal({
  isOpen,
  onClose,
  booking = null
}) {
  const [members, setMembers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('Spouse');
  const [isEmergency, setIsEmergency] = useState(true);
  const [loading, setLoading] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(null);

  const loadFamilyMembers = () => {
    fetchFamilyCircle()
      .then(res => {
        if (res.success && res.familyMembers) {
          setMembers(res.familyMembers);
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    if (isOpen) {
      loadFamilyMembers();
      setAlertSuccess(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!name || !phone) return;
    setLoading(true);
    try {
      const res = await addFamilyMember({
        memberName: name,
        phone,
        relationship,
        isEmergencyContact: isEmergency,
        permissions: { liveTracking: true, tripAlerts: true, sosEmergency: true }
      });
      if (res.success) {
        setName('');
        setPhone('');
        setShowAddForm(false);
        loadFamilyMembers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (memberId) => {
    try {
      const res = await removeFamilyMember(memberId);
      if (res.success) {
        loadFamilyMembers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBroadcastTrip = async (alertType = 'LIVE_TRIP_SHARE') => {
    setLoading(true);
    try {
      const message = alertType === 'SOS_EMERGENCY'
        ? `EMERGENCY ALERT: Immediate assistance requested. Booking Ref: ${booking?.bookingReference || 'SRT-2026-ACTIVE'}. Driver: ${booking?.driverName || 'Chauffeur'}.`
        : `Trip update: Your family member is traveling safely with verified chauffeur ${booking?.driverName || 'Chauffeur'}. Booking Ref: ${booking?.bookingReference || 'SRT-2026-ACTIVE'}.`;

      const res = await notifyFamilyCircle({
        bookingId: booking?.id || 'bk_demo_active',
        alertType,
        message
      });

      if (res.success) {
        setAlertSuccess(
          alertType === 'SOS_EMERGENCY'
            ? 'Emergency SOS alert dispatched to all Family Circle emergency contacts.'
            : 'Live trip status & tracking link broadcast to Family Circle members.'
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-sans">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-5 shadow-2xl relative text-[#172033] max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-[#0F1E36]">Family Circle & Safety Hub</h2>
              <p className="text-[10px] text-slate-500">Live Trip Visibility & Emergency Contacts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Trip Sharing Card if active trip */}
        {booking && (
          <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-purple-900">Active Ride Sharing</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 font-mono font-bold">
                {booking.bookingReference}
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              One-click broadcast: Send live GPS route, chauffeur details ({booking.driverName}) and trip updates to your family members.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleBroadcastTrip('LIVE_TRIP_SHARE')}
                disabled={loading || members.length === 0}
                className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share with Family</span>
              </button>
              <button
                onClick={() => handleBroadcastTrip('SOS_EMERGENCY')}
                disabled={loading || members.length === 0}
                className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                title="Send Emergency SOS Alert to Family"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>SOS Alert</span>
              </button>
            </div>
          </div>
        )}

        {alertSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{alertSuccess}</span>
          </div>
        )}

        {/* Family Members List */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Trusted Family Members ({members.length})
            </h3>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            )}
          </div>

          {members.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
              No family members added yet. Add trusted contacts to share trips and emergency updates.
            </div>
          ) : (
            members.map(member => (
              <div
                key={member.id}
                className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                    {member.memberName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-[#0F1E36]">{member.memberName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                        {member.relationship}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">{member.phone}</span>
                    {member.isEmergencyContact && (
                      <span className="ml-2 text-[9px] text-rose-600 font-bold uppercase">Emergency Contact</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleRemove(member.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Remove from Family Circle"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Family Member Form */}
        {showAddForm && (
          <form onSubmit={handleAddMember} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#0F1E36]">Add Family Member</span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-[#172033] focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mobile (+91)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-[#172033] focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Relationship</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-[#172033] focus:outline-none focus:border-purple-500"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Child">Child</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="emergencyContact"
                checked={isEmergency}
                onChange={(e) => setIsEmergency(e.target.checked)}
                className="accent-purple-600 rounded"
              />
              <label htmlFor="emergencyContact" className="text-xs text-slate-600 select-none font-semibold">
                Set as Primary Emergency SOS Contact
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              {loading ? 'Adding...' : 'Save to Family Circle'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
