import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  Star,
  FileText,
  Heart,
  HelpCircle,
  ShieldCheck,
  Trash2,
  Plus,
  ChevronRight,
  Download,
  AlertCircle,
  Users
} from 'lucide-react';
import {
  submitSupportTicket,
  fetchPreferredChauffeurs,
  removePreferredChauffeur,
  fetchFamilyCircle,
  addFamilyMember,
  removeFamilyMember
} from '../api.js';
import { BRAND } from '../config/branding.js';

export default function CustomerProfileScreen({
  currentUser,
  bookings = [],
  onSelectBooking,
  onOpenInvoice,
  onOpenReview,
  onRebookDriver
}) {
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings', 'addresses', 'favorites', 'family', 'support', 'privacy'
  const [preferredDrivers, setPreferredDrivers] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [famName, setFamName] = useState('');
  const [famPhone, setFamPhone] = useState('');
  const [famRel, setFamRel] = useState('Spouse');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('billing');
  const [ticketMsg, setTicketMsg] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState('');

  const loadPreferred = () => {
    fetchPreferredChauffeurs()
      .then(res => {
        if (res.success) setPreferredDrivers(res.preferredDrivers || []);
      })
      .catch(err => console.error(err));
  };

  const loadFamily = () => {
    fetchFamilyCircle()
      .then(res => {
        if (res.success) setFamilyMembers(res.familyCircle || []);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadPreferred();
    loadFamily();
  }, []);

  const [savedAddresses, setSavedAddresses] = useState([
    {
      id: 'addr_1',
      title: 'Residence (Home)',
      address: 'Tower 4, DLF The Crest, Sector 54, Golf Course Road',
      city: 'Gurugram',
      pinCode: '122002'
    },
    {
      id: 'addr_2',
      title: 'Corporate Office',
      address: 'Cyber City, Building 10, DLF Phase 2',
      city: 'Gurugram',
      pinCode: '122008'
    }
  ]);

  const [showAddAddr, setShowAddAddr] = useState(false);
  const [newAddrTitle, setNewAddrTitle] = useState('');
  const [newAddrText, setNewAddrText] = useState('');

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!newAddrTitle || !newAddrText) return;
    setSavedAddresses([
      ...savedAddresses,
      {
        id: `addr_${Date.now()}`,
        title: newAddrTitle,
        address: newAddrText,
        city: 'Delhi NCR',
        pinCode: '110001'
      }
    ]);
    setNewAddrTitle('');
    setNewAddrText('');
    setShowAddAddr(false);
  };

  const handleDeleteAddress = (id) => {
    setSavedAddresses(savedAddresses.filter(a => a.id !== id));
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMsg) return;
    try {
      const res = await submitSupportTicket({
        category: ticketCategory,
        subject: ticketSubject,
        message: ticketMsg
      });
      if (res.success) {
        setTicketSuccess(res.message);
        setTicketSubject('');
        setTicketMsg('');
        setTimeout(() => setTicketSuccess(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const customerName = currentUser?.fullName || 'Salman Client';
  const customerEmail = currentUser?.email || 'rohan.demo@example.com';

  return (
    <div className="space-y-6">
      
      {/* Profile Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <img
            src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'}
            alt={customerName}
            className="w-20 h-20 rounded-3xl object-cover border-2 border-[#D4AF37]/50 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg text-[#0B1329] font-display">{customerName}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                Aadhaar Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{currentUser?.phone || '+91 98765 43210'}</p>
            <p className="text-[11px] text-slate-400">{customerEmail}</p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 min-w-[90px]">
            <span className="font-mono font-black text-base text-[#0B1329] block">{bookings.length}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Trips</span>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 min-w-[90px]">
            <span className="font-mono font-black text-base text-[#D4AF37] block">{preferredDrivers.length}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Saved</span>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 min-w-[90px]">
            <span className="font-mono font-black text-base text-[#10B981] block">{familyMembers.length}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Family</span>
          </div>
        </div>
      </div>

      {/* Tab Selector Navigation */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 text-xs font-bold">
        {[
          { id: 'bookings', label: `My Trips (${bookings.length})` },
          { id: 'addresses', label: 'Saved Addresses' },
          { id: 'favorites', label: `Preferred Chauffeurs (${preferredDrivers.length})` },
          { id: 'family', label: `Family Circle (${familyMembers.length})` },
          { id: 'support', label: '24x7 Helpdesk' },
          { id: 'privacy', label: 'Privacy & DPDP' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-2xl whitespace-nowrap transition min-h-[44px] flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-[#0B1329] text-white shadow-xs font-extrabold'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Bookings History */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xs space-y-2">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-1" />
              <h3 className="font-bold text-[#0B1329] text-base">No Trips Booked Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Book your first background-verified chauffeur from the home screen.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookings.map(item => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-mono font-bold text-amber-700 text-xs">{item.bookingReference}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        item.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        item.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h4 className="font-extrabold text-sm text-[#0B1329] font-display">{item.serviceTitle}</h4>
                        <p className="text-slate-500 text-xs">Chauffeur: {item.driverName}</p>
                        <p className="text-slate-400 text-[11px]">{item.startDate} at {item.startTime} ({item.durationHours} hrs)</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-lg text-amber-600">₹{item.totalFare}</span>
                        <span className="block text-[10px] text-slate-400 uppercase">{item.paymentStatus}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectBooking(item)}
                      className="px-3.5 py-2 rounded-xl bg-[#0B1329] hover:bg-slate-900 text-white font-bold text-xs transition"
                    >
                      Track Ride Status
                    </button>
                    {item.status === 'completed' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onOpenInvoice(item)}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 border border-slate-200"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>Invoice</span>
                        </button>
                        <button
                          onClick={() => onOpenReview(item)}
                          className="px-3 py-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold text-xs flex items-center gap-1 border border-amber-200"
                        >
                          <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                          <span>Rate</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Saved Addresses */}
      {activeTab === 'addresses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Frequently Visited Locations</h3>
            <button
              onClick={() => setShowAddAddr(!showAddAddr)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0B1329] text-white text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Location</span>
            </button>
          </div>

          {showAddAddr && (
            <form onSubmit={handleAddAddress} className="bg-white border border-slate-200/90 p-5 rounded-3xl space-y-3 shadow-md">
              <input
                type="text"
                placeholder="Title (e.g. In-Laws House, Gym, Parents)"
                value={newAddrTitle}
                onChange={(e) => setNewAddrTitle(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-[#172033] focus:outline-none focus:border-[#0B1329]"
              />
              <textarea
                rows={2}
                placeholder="Full street address & PIN code..."
                value={newAddrText}
                onChange={(e) => setNewAddrText(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-[#172033] focus:outline-none focus:border-[#0B1329] resize-none"
              />
              <div className="flex gap-2">
                <button type="submit" className="py-2.5 px-5 bg-[#0B1329] text-white font-bold text-xs rounded-2xl shadow-sm">
                  Save Address
                </button>
                <button type="button" onClick={() => setShowAddAddr(false)} className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-2xl text-xs font-semibold">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedAddresses.map(addr => (
              <div key={addr.id} className="bg-white border border-slate-200/90 rounded-3xl p-5 flex items-start justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 text-[#D4AF37] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#0B1329]">{addr.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{addr.address}</p>
                    <span className="text-[10px] text-slate-400">{addr.city} - {addr.pinCode}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 transition"
                  title="Delete address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Preferred Chauffeurs */}
      {activeTab === 'favorites' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Your Preferred Chauffeurs ({preferredDrivers.length})
            </h3>
          </div>

          {preferredDrivers.length === 0 ? (
            <div className="p-12 bg-white border border-slate-200/90 rounded-3xl text-center text-xs text-slate-500 space-y-2">
              <Heart className="w-10 h-10 text-slate-300 mx-auto mb-1" />
              <p className="font-bold text-[#0B1329] text-sm">No Preferred Chauffeurs Saved Yet</p>
              <p className="text-xs max-w-sm mx-auto">Open any driver's passport and tap "Add to Preferred" to save them for priority rebooking.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {preferredDrivers.map(pref => {
                const drv = pref.driver || {};
                return (
                  <div key={pref.id} className="bg-white border border-slate-200/90 rounded-3xl p-5 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={drv.photoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80"}
                        alt={drv.fullName || 'Chauffeur'}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-sm text-[#0B1329]">{drv.fullName || 'Chauffeur'}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">Preferred</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">★ {drv.rating || 4.9} • {drv.experienceYears || 5} yrs exp • {drv.primaryCity || 'Bengaluru'}</p>
                        {pref.notes && <p className="text-[10px] text-slate-400 italic mt-0.5">"{pref.notes}"</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRebookDriver(pref.driverId)}
                        className="px-3.5 py-2 rounded-xl bg-[#0B1329] hover:bg-slate-900 text-white font-bold text-xs shadow-xs"
                      >
                        Book
                      </button>
                      <button
                        onClick={async () => {
                          await removePreferredChauffeur(pref.driverId);
                          loadPreferred();
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 transition"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Family Circle */}
      {activeTab === 'family' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Family Circle & Safety Hub ({familyMembers.length})
              </h3>
              <p className="text-xs text-slate-500">Trusted contacts receive live trip traces and automatic emergency SOS alerts.</p>
            </div>
            {!showAddFamily && (
              <button
                onClick={() => setShowAddFamily(true)}
                className="px-3 py-1.5 rounded-xl bg-[#0B1329] text-white font-bold text-xs flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            )}
          </div>

          {showAddFamily && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!famName || !famPhone) return;
                await addFamilyMember({
                  memberName: famName,
                  phone: famPhone,
                  relationship: famRel,
                  isEmergencyContact: true
                });
                setFamName('');
                setFamPhone('');
                setShowAddFamily(false);
                loadFamily();
              }}
              className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-3 text-xs"
            >
              <div className="flex justify-between items-center font-bold text-[#0B1329]">
                <span>Add Family Member</span>
                <button type="button" onClick={() => setShowAddFamily(false)} className="text-slate-400 text-xs">Cancel</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={famName}
                    onChange={(e) => setFamName(e.target.value)}
                    placeholder="e.g. Ananya Verma"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Phone Number (+91)</label>
                  <input
                    type="tel"
                    value={famPhone}
                    onChange={(e) => setFamPhone(e.target.value)}
                    placeholder="+91 98765 11111"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#0B1329] text-white font-bold rounded-2xl shadow-xs"
              >
                Save to Family Circle
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {familyMembers.map(member => (
              <div key={member.id} className="bg-white border border-slate-200/90 rounded-3xl p-5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
                    {member.memberName ? member.memberName[0] : 'F'}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#0B1329]">{member.memberName}</h4>
                    <p className="text-xs text-slate-500 font-mono">{member.phone} • {member.relationship}</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await removeFamilyMember(member.id);
                    loadFamily();
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Helpdesk */}
      {activeTab === 'support' && (
        <div className="space-y-4 max-w-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            24x7 Support & Concierge Assistance
          </h3>

          {ticketSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 font-bold">
              ✓ {ticketSuccess}
            </div>
          )}

          <form onSubmit={handleTicketSubmit} className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs">
            <div>
              <label className="block text-xs font-bold text-[#0B1329] mb-1">Issue Category</label>
              <select
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-[#172033] focus:outline-none focus:border-[#0B1329]"
              >
                <option value="billing">Billing or GST Tax Invoice Inquiry</option>
                <option value="driver_behavior">Chauffeur Quality & Service Feedback</option>
                <option value="lost_item">Lost Personal Item in Car</option>
                <option value="safety">Safety or Emergency Concern</option>
                <option value="app_issue">Application Feedback</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B1329] mb-1">Subject</label>
              <input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Brief summary of your query"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-[#172033] focus:outline-none focus:border-[#0B1329]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B1329] mb-1">Message</label>
              <textarea
                rows={3}
                value={ticketMsg}
                onChange={(e) => setTicketMsg(e.target.value)}
                placeholder="Provide details of your booking or question..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-[#172033] focus:outline-none focus:border-[#0B1329] resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#0B1329] hover:bg-slate-900 text-white font-bold text-xs rounded-2xl shadow-sm transition min-h-[44px]"
            >
              Submit Support Ticket
            </button>
          </form>
        </div>
      )}

      {/* Tab 6: Privacy & DPDP */}
      {activeTab === 'privacy' && (
        <div className="space-y-4 max-w-2xl text-xs">
          <h3 className="font-bold uppercase tracking-wider text-slate-500">
            Indian Digital Personal Data Protection (DPDP Act, 2023)
          </h3>
          
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs">
            <p className="text-slate-600 leading-relaxed text-xs">
              Under the Indian Digital Personal Data Protection Act, you have absolute ownership over your phone number, trip traces, and vehicle details. Sarathi stores your data securely in Indian data centers with 256-bit AES encryption.
            </p>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                onClick={() => alert(`📦 Generating Data Export: A secure link containing all your booking logs, GST invoices and profile details has been emailed to ${customerEmail}.`)}
                className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-[#0B1329] rounded-2xl font-bold flex items-center justify-center gap-2 border border-slate-200 transition min-h-[44px]"
              >
                <Download className="w-4 h-4 text-[#D4AF37]" />
                <span>Export All My Data (JSON / PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
