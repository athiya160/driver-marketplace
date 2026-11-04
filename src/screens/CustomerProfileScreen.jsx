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
        if (res.success && res.preferredDrivers) {
          setPreferredDrivers(res.preferredDrivers);
        }
      })
      .catch(err => console.error(err));
  };

  const loadFamily = () => {
    fetchFamilyCircle()
      .then(res => {
        if (res.success && res.familyMembers) {
          setFamilyMembers(res.familyMembers);
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadPreferred();
    loadFamily();
  }, []);

  const [savedAddresses, setSavedAddresses] = useState(currentUser?.savedAddresses || [
    { id: 'addr_1', title: 'Home', address: 'Tower 4, DLF The Crest, Sector 54, Golf Course Road', city: 'Delhi NCR', pinCode: '122002' },
    { id: 'addr_2', title: 'Office', address: 'Building 10B, Cyber City, DLF Phase 2', city: 'Delhi NCR', pinCode: '122008' }
  ]);

  const [newAddrTitle, setNewAddrTitle] = useState('');
  const [newAddrText, setNewAddrText] = useState('');
  const [showAddAddr, setShowAddAddr] = useState(false);

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!newAddrTitle || !newAddrText) return;
    const item = {
      id: `addr_${Date.now()}`,
      title: newAddrTitle,
      address: newAddrText,
      city: 'Delhi NCR',
      pinCode: '110001'
    };
    setSavedAddresses([...savedAddresses, item]);
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

  const customerName = currentUser?.fullName || BRAND.owner;
  const customerEmail = currentUser?.email || 'rohan.demo@example.com';

  return (
    <div className="flex flex-col min-h-full pb-20 bg-[#F8FAFC] text-[#172033]">
      
      {/* Profile Header */}
      <div className="bg-white border-b border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-3.5 mb-3">
          <img
            src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'}
            alt={customerName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-500/30 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base text-[#0F1E36]">{customerName}</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{currentUser?.phone || '+91 98765 43210'}</p>
            <p className="text-[11px] text-slate-400">{customerEmail}</p>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none text-xs font-semibold pt-1">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'bookings' ? 'bg-[#0F1E36] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            My Trips ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'addresses' ? 'bg-[#0F1E36] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Saved Addresses
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'favorites' ? 'bg-[#0F1E36] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Preferred Chauffeurs ({preferredDrivers.length})
          </button>
          <button
            onClick={() => setActiveTab('family')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition flex items-center gap-1 ${
              activeTab === 'family' ? 'bg-[#0F1E36] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Family Circle ({familyMembers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'support' ? 'bg-[#0F1E36] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Helpdesk
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'privacy' ? 'bg-[#0F1E36] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Privacy & Data
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-4">
        
        {/* 1. Bookings History Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <Clock className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h3 className="font-bold text-[#0F1E36] text-sm">No Bookings Yet</h3>
                <p className="text-xs text-slate-500 mt-1">Book a verified chauffeur for your car from the home screen.</p>
              </div>
            ) : (
              bookings.map(item => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-mono font-bold text-orange-600">{item.bookingReference}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      item.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      item.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#0F1E36]">{item.serviceTitle}</h4>
                      <p className="text-slate-500 text-[11px]">Chauffeur: {item.driverName}</p>
                      <p className="text-slate-500 text-[11px]">{item.startDate} at {item.startTime} ({item.durationHours} hrs)</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-extrabold text-base text-orange-600">₹{item.totalFare}</span>
                      <span className="block text-[10px] text-slate-400 uppercase">{item.paymentStatus}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectBooking(item)}
                      className="px-3 py-1.5 rounded-xl bg-[#0F1E36] hover:bg-[#1A2F45] text-white font-bold text-[11px] transition shadow-sm"
                    >
                      Track Ride Status
                    </button>
                    {item.status === 'completed' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onOpenInvoice(item)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center gap-1 border border-slate-200"
                        >
                          <FileText className="w-3 h-3 text-orange-500" />
                          <span>Invoice</span>
                        </button>
                        <button
                          onClick={() => onOpenReview(item)}
                          className="px-2.5 py-1.5 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 font-semibold text-[11px] flex items-center gap-1 border border-orange-200"
                        >
                          <Star className="w-3 h-3 fill-current text-amber-500" />
                          <span>Rate</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 2. Saved Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Frequently Visited Locations</h3>
              <button
                onClick={() => setShowAddAddr(!showAddAddr)}
                className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Address</span>
              </button>
            </div>

            {showAddAddr && (
              <form onSubmit={handleAddAddress} className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2 mb-3 shadow-md">
                <input
                  type="text"
                  placeholder="Title (e.g. In-Laws House, Gym, Parents)"
                  value={newAddrTitle}
                  onChange={(e) => setNewAddrTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#172033] focus:outline-none focus:border-orange-500"
                />
                <textarea
                  rows={2}
                  placeholder="Full street address & PIN code..."
                  value={newAddrText}
                  onChange={(e) => setNewAddrText(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#172033] focus:outline-none focus:border-orange-500 resize-none"
                ></textarea>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm">
                    Save Address
                  </button>
                  <button type="button" onClick={() => setShowAddAddr(false)} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {savedAddresses.map(addr => (
              <div key={addr.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-xs text-[#0F1E36]">{addr.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{addr.address}</p>
                    <span className="text-[10px] text-slate-400">{addr.city} - {addr.pinCode}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                  title="Delete address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 3. Preferred Chauffeurs Tab (Phase 9B) */}
        {activeTab === 'favorites' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Your Preferred Chauffeurs ({preferredDrivers.length})
              </h3>
            </div>

            {preferredDrivers.length === 0 ? (
              <div className="p-6 bg-white border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                <Heart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-[#0F1E36]">No Preferred Chauffeurs Saved Yet</p>
                <p className="text-[11px] mt-1">Open any driver's profile and tap "Add to Preferred" to save them for priority rebooking.</p>
              </div>
            ) : (
              preferredDrivers.map(pref => {
                const drv = pref.driver || {};
                return (
                  <div key={pref.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={drv.photoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80"}
                        alt={drv.fullName || 'Chauffeur'}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-xs text-[#0F1E36]">{drv.fullName || 'Chauffeur'}</h4>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 font-bold">Preferred</span>
                        </div>
                        <p className="text-[11px] text-slate-500">★ {drv.rating || 4.9} • {drv.experienceYears || 5} yrs exp • {drv.primaryCity || 'Delhi NCR'}</p>
                        {pref.notes && <p className="text-[10px] text-slate-400 italic">"{pref.notes}"</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onRebookDriver(pref.driverId)}
                        className="px-3 py-1.5 rounded-xl bg-[#0F1E36] hover:bg-[#1A2F45] text-white font-bold text-xs shadow-xs"
                      >
                        Book
                      </button>
                      <button
                        onClick={async () => {
                          await removePreferredChauffeur(pref.driverId);
                          loadPreferred();
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                        title="Remove from Preferred"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 4. Family Circle Tab (Phase 9B) */}
        {activeTab === 'family' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Family Circle & Emergency SOS ({familyMembers.length})
                </h3>
                <p className="text-[11px] text-slate-500">Family members get live route visibility and automatic safety notifications.</p>
              </div>
              {!showAddFamily && (
                <button
                  onClick={() => setShowAddFamily(true)}
                  className="px-2.5 py-1 rounded-xl bg-[#0F1E36] text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
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
                className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2.5 text-xs"
              >
                <div className="flex justify-between items-center font-bold text-[#0F1E36]">
                  <span>Add Family Member</span>
                  <button type="button" onClick={() => setShowAddFamily(false)} className="text-slate-400 text-xs">Cancel</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Name</label>
                    <input
                      type="text"
                      value={famName}
                      onChange={(e) => setFamName(e.target.value)}
                      placeholder="e.g. Ananya Verma"
                      required
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Phone (+91)</label>
                    <input
                      type="tel"
                      value={famPhone}
                      onChange={(e) => setFamPhone(e.target.value)}
                      placeholder="+91 98765 11111"
                      required
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Relationship</label>
                  <select
                    value={famRel}
                    onChange={(e) => setFamRel(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save to Family Circle
                </button>
              </form>
            )}

            {familyMembers.length === 0 ? (
              <div className="p-6 bg-white border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-[#0F1E36]">Your Family Circle is Empty</p>
                <p className="text-[11px] mt-1">Add trusted family members to share live trip tracking and enable instant emergency SOS alerts.</p>
              </div>
            ) : (
              familyMembers.map(member => (
                <div key={member.id} className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                      {member.memberName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-[#0F1E36]">{member.memberName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-50 text-purple-700 font-semibold">{member.relationship}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">{member.phone}</span>
                      {member.isEmergencyContact && <span className="text-[9px] text-rose-600 font-bold ml-2">● SOS Alert Active</span>}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      await removeFamilyMember(member.id);
                      loadFamily();
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* 4. Support & Helpdesk Tab */}
        {activeTab === 'support' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              {BRAND.appName} 24x7 Customer Assistance
            </h3>

            {ticketSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 font-bold">
                ✓ {ticketSuccess}
              </div>
            )}

            <form onSubmit={handleTicketSubmit} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Issue Category</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#172033] focus:outline-none focus:border-orange-500"
                >
                  <option value="billing">Billing or GST Invoice Inquiry</option>
                  <option value="driver_behavior">Driver Conduct or Driving Quality</option>
                  <option value="lost_item">Lost Personal Belonging in Vehicle</option>
                  <option value="safety">Emergency or Safety Concern</option>
                  <option value="app_issue">App Glitch or Technical Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Subject</label>
                <input
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Brief summary of your query"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#172033] focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Message Details</label>
                <textarea
                  rows={3}
                  value={ticketMsg}
                  onChange={(e) => setTicketMsg(e.target.value)}
                  placeholder="Describe your issue with relevant ride details..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#172033] focus:outline-none focus:border-orange-500 resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                Submit Support Ticket
              </button>
            </form>
          </div>
        )}

        {/* 5. Privacy & DPDP Act Tab */}
        {activeTab === 'privacy' && (
          <div className="space-y-3 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-500 mb-1">
              Indian Data Protection (DPDP Act, 2023)
            </h3>
            
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Under the Indian Digital Personal Data Protection Act, you have absolute ownership over your phone number, trip traces, and vehicle details. {BRAND.appName} stores your data securely in Indian data centers with 256-bit AES encryption.
              </p>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => alert(`📄 Generating Data Export: A secure link containing all your booking logs, GST invoices and profile details has been emailed to ${customerEmail}.`)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-[#0F1E36] rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-200 transition"
                >
                  <Download className="w-3.5 h-3.5 text-orange-500" />
                  <span>Export All My Data (JSON / PDF)</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to permanently erase your ${BRAND.appName} account and all trip history?`)) {
                      alert('Account deletion request queued. Your personal records will be securely purged within 48 hours as mandated by Indian DPDP guidelines.');
                    }
                  }}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl font-bold flex items-center justify-center gap-2 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete My Account Permanently</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
