import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { submitSupportTicket } from '../api.js';

export default function CustomerProfileScreen({
  currentUser,
  bookings = [],
  onSelectBooking,
  onOpenInvoice,
  onOpenReview,
  onRebookDriver
}) {
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings', 'addresses', 'favorites', 'support', 'privacy'
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('billing');
  const [ticketMsg, setTicketMsg] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState('');

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

  return (
    <div className="flex flex-col min-h-full pb-20 bg-slate-950 text-slate-100">
      
      {/* Profile Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-5">
        <div className="flex items-center gap-3.5 mb-3">
          <img
            src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80'}
            alt={currentUser?.fullName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-500/40 shadow-lg"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base text-white">{currentUser?.fullName || 'Athiya Tabassum'}</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                Verified
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{currentUser?.phone || '+91 98765 43210'}</p>
            <p className="text-[11px] text-slate-500">{currentUser?.email || 'athiya@sarathi.in'}</p>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none text-xs font-semibold pt-1">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'bookings' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            My Trips ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'addresses' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Saved Addresses
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'favorites' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Favorite Drivers
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'support' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Helpdesk
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'privacy' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
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
              <div className="text-center py-10 bg-slate-900 rounded-3xl p-6 border border-slate-800">
                <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <h3 className="font-bold text-white text-sm">No Bookings Yet</h3>
                <p className="text-xs text-slate-400 mt-1">Book a verified chauffeur for your car from the home screen.</p>
              </div>
            ) : (
              bookings.map(item => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl text-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono font-bold text-brand-400">{item.bookingReference}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      item.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      item.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-sm text-white">{item.serviceTitle}</h4>
                      <p className="text-slate-400 text-[11px]">Chauffeur: {item.driverName}</p>
                      <p className="text-slate-400 text-[11px]">{item.startDate} at {item.startTime} ({item.durationHours} hrs)</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-extrabold text-base text-brand-400">₹{item.totalFare}</span>
                      <span className="block text-[10px] text-slate-500 uppercase">{item.paymentStatus}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectBooking(item)}
                      className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-[11px] transition"
                    >
                      Track Ride Status
                    </button>
                    {item.status === 'completed' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onOpenInvoice(item)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3 text-brand-400" />
                          <span>Invoice</span>
                        </button>
                        <button
                          onClick={() => onOpenReview(item)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 font-semibold text-[11px] flex items-center gap-1"
                        >
                          <Star className="w-3 h-3 fill-current" />
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Frequently Visited Locations</h3>
              <button
                onClick={() => setShowAddAddr(!showAddAddr)}
                className="flex items-center gap-1 text-xs font-bold text-brand-400 hover:text-brand-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Address</span>
              </button>
            </div>

            {showAddAddr && (
              <form onSubmit={handleAddAddress} className="bg-slate-900 border border-slate-700 p-4 rounded-3xl space-y-2 mb-3 shadow-xl">
                <input
                  type="text"
                  placeholder="Title (e.g. In-Laws House, Gym, Parents)"
                  value={newAddrTitle}
                  onChange={(e) => setNewAddrTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                />
                <textarea
                  rows={2}
                  placeholder="Full street address & PIN code..."
                  value={newAddrText}
                  onChange={(e) => setNewAddrText(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none resize-none"
                ></textarea>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl">
                    Save Address
                  </button>
                  <button type="button" onClick={() => setShowAddAddr(false)} className="px-3 py-2 bg-slate-800 text-slate-400 rounded-xl text-xs">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {savedAddresses.map(addr => (
              <div key={addr.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-start justify-between gap-3 shadow-md">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-xs text-white">{addr.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{addr.address}</p>
                    <span className="text-[10px] text-slate-500">{addr.city} - {addr.pinCode}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition"
                  title="Delete address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 3. Favorite Drivers Tab */}
        {activeTab === 'favorites' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Your Preferred Chauffeurs
            </h3>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80"
                  alt="Rajesh"
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
                />
                <div>
                  <h4 className="font-extrabold text-xs text-white">Rajesh Kumar Sharma</h4>
                  <p className="text-[11px] text-slate-400">★ 4.9 • 1,420 Trips • German Car Specialist</p>
                  <span className="text-[10px] text-emerald-400 font-semibold">Available for Rehire</span>
                </div>
              </div>
              <button
                onClick={() => onRebookDriver('drv_delhi_1')}
                className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md"
              >
                Book Again
              </button>
            </div>
          </div>
        )}

        {/* 4. Support & Helpdesk Tab */}
        {activeTab === 'support' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Sarathi 24x7 Customer Assistance
            </h3>

            {ticketSuccess && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 font-bold">
                ✓ {ticketSuccess}
              </div>
            )}

            <form onSubmit={handleTicketSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Issue Category</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="billing">Billing or GST Invoice Inquiry</option>
                  <option value="driver_behavior">Driver Conduct or Driving Quality</option>
                  <option value="lost_item">Lost Personal Belonging in Vehicle</option>
                  <option value="safety">Emergency or Safety Concern</option>
                  <option value="app_issue">App Glitch or Technical Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Subject</label>
                <input
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Brief summary of your query"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Message Details</label>
                <textarea
                  rows={3}
                  value={ticketMsg}
                  onChange={(e) => setTicketMsg(e.target.value)}
                  placeholder="Describe your issue with relevant ride details..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
              >
                Submit Support Ticket
              </button>
            </form>
          </div>
        )}

        {/* 5. Privacy & DPDP Act Tab */}
        {activeTab === 'privacy' && (
          <div className="space-y-3 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-400 mb-1">
              Indian Data Protection (DPDP Act, 2023)
            </h3>
            
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Under the Indian Digital Personal Data Protection Act, you have absolute ownership over your phone number, trip traces, and vehicle details. Sarathi stores your data securely in Indian data centers with 256-bit AES encryption.
              </p>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <button
                  onClick={() => alert('📄 Generating Data Export: A secure link containing all your booking logs, GST invoices and profile details has been emailed to athiya@sarathi.in.')}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-brand-400" />
                  <span>Export All My Data (JSON / PDF)</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to permanently erase your Sarathi account and all trip history?')) {
                      alert('Account deletion request queued. Your personal records will be securely purged within 48 hours as mandated by Indian DPDP guidelines.');
                    }
                  }}
                  className="w-full py-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 rounded-xl font-bold flex items-center justify-center gap-2"
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
