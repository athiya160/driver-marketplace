import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Car,
  TrendingUp,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  MapPin,
  Settings,
  DollarSign,
  CreditCard,
  MessageSquare,
  RefreshCw,
  Plus
} from 'lucide-react';
import { fetchAdminStats, fetchAdminKycQueue, verifyDriverKyc } from '../api.js';

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState(null);
  const [kycDocs, setKycDocs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('kyc'); // 'kyc', 'drivers', 'pricing', 'cities', 'transactions', 'support'
  const [actionSuccess, setActionSuccess] = useState('');

  // Service Cities state
  const [citiesList, setCitiesList] = useState([
    { id: 'c1', name: 'Delhi NCR', state: 'Delhi', active: true, baseRate: 149, activeDrivers: 420 },
    { id: 'c2', name: 'Mumbai', state: 'Maharashtra', active: true, baseRate: 169, activeDrivers: 380 },
    { id: 'c3', name: 'Bengaluru', state: 'Karnataka', active: true, baseRate: 159, activeDrivers: 310 },
    { id: 'c4', name: 'Hyderabad', state: 'Telangana', active: true, baseRate: 139, activeDrivers: 240 },
    { id: 'c5', name: 'Chennai', state: 'Tamil Nadu', active: true, baseRate: 149, activeDrivers: 190 },
    { id: 'c6', name: 'Pune', state: 'Maharashtra', active: true, baseRate: 139, activeDrivers: 175 },
    { id: 'c7', name: 'Kolkata', state: 'West Bengal', active: true, baseRate: 129, activeDrivers: 160 },
    { id: 'c8', name: 'Jaipur', state: 'Rajasthan', active: true, baseRate: 129, activeDrivers: 120 }
  ]);

  // Transactions ledger state
  const [transactions, setTransactions] = useState([
    { id: 'tx_901', ref: 'SRT-2026-8821', user: 'Athiya Tabassum', driver: 'Rajesh Kumar', amount: 567, method: 'UPI (GPay)', status: 'captured', date: '30 Oct 2026' },
    { id: 'tx_902', ref: 'SRT-2026-9044', user: 'Athiya Tabassum', driver: 'Harpreet Singh', amount: 2313, method: 'UPI (PhonePe)', status: 'authorized', date: '29 Oct 2026' },
    { id: 'tx_903', ref: 'SRT-2026-7210', user: 'Athiya Tabassum', driver: 'Rajesh Kumar', amount: 1048, method: 'Card (Visa)', status: 'settled', date: '25 Oct 2026' }
  ]);

  // Support complaints tickets
  const [supportTickets, setSupportTickets] = useState([
    { id: 'tkt_01', ref: 'SRT-2026-7210', user: 'Athiya Tabassum', subject: 'Corporate GST Tax Invoice Copy Request', category: 'billing', status: 'resolved' },
    { id: 'tkt_02', ref: 'SRT-2026-9122', user: 'Rohan Mehra', subject: 'Inquiry regarding outstation driver stay allowance', category: 'general', status: 'open' }
  ]);

  const loadData = () => {
    setLoading(true);
    Promise.all([fetchAdminStats(), fetchAdminKycQueue()])
      .then(([statsRes, kycRes]) => {
        if (statsRes.success) setStats(statsRes.metrics);
        if (kycRes.success) {
          setKycDocs(kycRes.documents || []);
          setDrivers(kycRes.drivers || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerify = async (driverId, action) => {
    try {
      const res = await verifyDriverKyc(driverId, action);
      if (res.success) {
        setActionSuccess(res.message);
        loadData();
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCityStatus = (cityId) => {
    setCitiesList(prev => prev.map(c => c.id === cityId ? { ...c, active: !c.active } : c));
  };

  const handleRefund = (txId) => {
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'refunded' } : t));
    alert(`Refund of transaction ${txId} initiated via Razorpay sandbox payment gateway!`);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 animate-pulse">
        Loading Admin Operations Control Center...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pb-20 bg-slate-950 text-slate-100">
      
      {/* Admin Top Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white">Sarathi Operations Admin</h1>
            <p className="text-[11px] text-slate-400">National Chauffeur Platform Command</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
          SuperAdmin
        </span>
      </div>

      <div className="p-4 space-y-4">
        
        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 block font-semibold">Total Gross GMV</span>
            <span className="font-mono text-base font-extrabold text-white">₹{stats?.totalGMV?.toLocaleString('en-IN') || '8,45,200'}</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 block font-semibold">Platform Revenue (15%)</span>
            <span className="font-mono text-base font-extrabold text-emerald-400">₹{stats?.platformRevenue?.toLocaleString('en-IN') || '1,28,400'}</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 block font-semibold">Total Rides Booked</span>
            <span className="font-mono text-base font-extrabold text-brand-400">{stats?.totalBookings || '3,124'}</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 block font-semibold">Pending Driver KYC</span>
            <span className="font-mono text-base font-extrabold text-amber-400">{stats?.pendingKyc || 2} In Queue</span>
          </div>
        </div>

        {/* Action feedback banner */}
        {actionSuccess && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 font-bold">
            ✓ {actionSuccess}
          </div>
        )}

        {/* Tab Controls Bar */}
        <div className="flex gap-1.5 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs font-semibold overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('kyc')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'kyc' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            KYC Queue
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'drivers' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Fleet ({drivers.length})
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'pricing' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pricing Rules
          </button>
          <button
            onClick={() => setActiveTab('cities')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'cities' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cities ({citiesList.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'transactions' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'support' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tickets ({supportTickets.length})
          </button>
        </div>

        {/* 1. DRIVER KYC DOCUMENT REVIEW QUEUE */}
        {activeTab === 'kyc' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pending Document Approvals
            </h3>

            {kycDocs.filter(d => d.status === 'pending').length === 0 ? (
              <div className="text-center py-8 bg-slate-900 rounded-3xl p-6 border border-slate-800">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <h4 className="font-bold text-white text-sm">KYC Queue Clear</h4>
                <p className="text-xs text-slate-400 mt-1">All registered driver documents are verified.</p>
              </div>
            ) : (
              kycDocs.filter(d => d.status === 'pending').map(doc => (
                <div
                  key={doc.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl text-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-white">{doc.driverName}</h4>
                      <p className="text-slate-400 text-[11px]">{doc.docType}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                      Pending Review
                    </span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center font-mono">
                    <span className="text-slate-500">Document No:</span>
                    <span className="text-brand-400 font-bold">{doc.docNumber}</span>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-slate-800 h-32 relative bg-slate-950">
                    <img
                      src={doc.fileUrl}
                      alt="KYC Document Preview"
                      className="w-full h-full object-cover opacity-80 hover:opacity-100 transition"
                    />
                    <span className="absolute bottom-2 right-2 px-2 py-1 bg-slate-950/80 rounded-lg text-[10px] text-slate-300 font-mono">
                      Inspection Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleVerify(doc.driverId, 'reject')}
                      className="py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/30 transition flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Application</span>
                    </button>
                    <button
                      onClick={() => handleVerify(doc.driverId, 'approve')}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve Chauffeur</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 2. FLEET MANAGER */}
        {activeTab === 'drivers' && (
          <div className="space-y-3">
            {drivers.map(drv => (
              <div
                key={drv.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-3.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={drv.photoUrl}
                    alt={drv.fullName}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-700"
                  />
                  <div>
                    <h4 className="font-extrabold text-xs text-white">{drv.fullName}</h4>
                    <p className="text-[11px] text-slate-400">{drv.primaryCity} • {drv.experienceYears} yrs exp</p>
                    <p className="text-[10px] text-slate-500 font-mono">DL: {drv.drivingLicenceNo}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    drv.verificationStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                    drv.verificationStatus === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {drv.verificationStatus}
                  </span>
                  <div className="mt-1">
                    {drv.verificationStatus === 'approved' ? (
                      <button
                        onClick={() => handleVerify(drv.id, 'suspend')}
                        className="text-[10px] text-rose-400 hover:underline font-semibold"
                      >
                        Suspend Account
                      </button>
                    ) : (
                      <button
                        onClick={() => handleVerify(drv.id, 'approve')}
                        className="text-[10px] text-emerald-400 hover:underline font-semibold"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. PRICING RULES */}
        {activeTab === 'pricing' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-400 mb-1">
              National Pricing & Commission Slabs
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-300">Base Hourly Rate (Min 2 hrs)</span>
                <span className="font-mono font-bold text-brand-400">₹299</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-300">Full-Day 8 Hours City</span>
                <span className="font-mono font-bold text-brand-400">₹1,199</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-300">Outstation Driver Daily Allowance (DA)</span>
                <span className="font-mono font-bold text-amber-400">₹350 / day</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-300">Night Allowance (10:00 PM - 6:00 AM)</span>
                <span className="font-mono font-bold text-amber-400">₹250</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-300">Platform Convenience Fee</span>
                <span className="font-mono font-bold text-emerald-400">₹49 / ride</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-300">Driver Share vs Platform Margin</span>
                <span className="font-mono font-bold text-purple-400">85% Driver / 15% Platform</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-300">Road Transport Aggregator GST</span>
                <span className="font-mono font-bold text-slate-400">5.0%</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. CITIES & OPERATING AREAS */}
        {activeTab === 'cities' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-bold uppercase tracking-wider text-slate-400">Active Service Cities ({citiesList.length})</span>
              <span className="text-[10px] text-brand-400 font-semibold">+ Add New City</span>
            </div>

            <div className="space-y-2">
              {citiesList.map(city => (
                <div key={city.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h5 className="font-extrabold text-white text-xs">{city.name}</h5>
                    <p className="text-[10px] text-slate-400">{city.state} • {city.activeDrivers} Active Chauffeurs</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-brand-400 text-xs">₹{city.baseRate}/hr</span>
                    <button
                      onClick={() => toggleCityStatus(city.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                        city.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {city.active ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. TRANSACTIONS & REFUNDS */}
        {activeTab === 'transactions' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-400 mb-1">
              Razorpay Settlement & Refund Ledger
            </h3>

            <div className="space-y-2">
              {transactions.map(tx => (
                <div key={tx.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-brand-400">{tx.ref}</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">₹{tx.amount}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{tx.user} → {tx.driver}</span>
                    <span>{tx.method}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-[10px]">
                    <span className={`font-bold uppercase ${tx.status === 'refunded' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      Status: {tx.status}
                    </span>
                    {tx.status !== 'refunded' && (
                      <button
                        onClick={() => handleRefund(tx.id)}
                        className="text-amber-400 hover:underline font-semibold"
                      >
                        Issue Refund
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. SUPPORT COMPLAINTS & TICKETS */}
        {activeTab === 'support' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-400 mb-1">
              Customer Grievance Redressal
            </h3>

            <div className="space-y-2">
              {supportTickets.map(tkt => (
                <div key={tkt.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-brand-400">{tkt.ref}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      tkt.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {tkt.status}
                    </span>
                  </div>
                  <p className="font-bold text-white text-xs">{tkt.subject}</p>
                  <p className="text-[10px] text-slate-400">Raised by: {tkt.user} • Category: {tkt.category}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
