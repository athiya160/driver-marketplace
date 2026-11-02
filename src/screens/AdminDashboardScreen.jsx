import React, { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle,
  XCircle,
  FileText,
  MapPin,
  TrendingUp,
  Settings,
  Users,
  Car,
  Clock,
  Sparkles,
  Search,
  DollarSign,
  AlertTriangle,
  RotateCcw
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
    { id: 'tx_901', ref: 'SRT-2026-8821', user: 'Rohan Verma (Demo)', driver: 'Rajesh Kumar', amount: 567, method: 'UPI (GPay)', status: 'captured', date: '30 Oct 2026' },
    { id: 'tx_902', ref: 'SRT-2026-9044', user: 'Rohan Verma (Demo)', driver: 'Harpreet Singh', amount: 2313, method: 'UPI (PhonePe)', status: 'authorized', date: '29 Oct 2026' },
    { id: 'tx_903', ref: 'SRT-2026-7210', user: 'Rohan Verma (Demo)', driver: 'Rajesh Kumar', amount: 1048, method: 'Card (Visa)', status: 'settled', date: '25 Oct 2026' }
  ]);

  // Support complaints tickets
  const [supportTickets, setSupportTickets] = useState([
    { id: 'tkt_01', ref: 'SRT-2026-7210', user: 'Rohan Verma (Demo)', subject: 'Corporate GST Tax Invoice Copy Request', category: 'billing', status: 'resolved' },
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
        setTimeout(() => setActionSuccess(''), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefund = (txId) => {
    if (confirm('Issue 100% instant UPI / Card refund to customer?')) {
      setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'refunded' } : t));
      setActionSuccess('₹ Refund processed via Razorpay Sandbox Route');
      setTimeout(() => setActionSuccess(''), 3000);
    }
  };

  const toggleCityStatus = (cityId) => {
    setCitiesList(prev => prev.map(c => c.id === cityId ? { ...c, active: !c.active } : c));
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse">
        Loading Salman Driver Admin Center...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pb-20 bg-[#F8FAFC] text-[#172033]">
      
      {/* Admin Top Header */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-[#0F1E36]">Salman Driver Operations Admin</h1>
            <p className="text-[11px] text-slate-500">National Chauffeur Platform Command</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
          SuperAdmin
        </span>
      </div>

      <div className="p-4 space-y-4">
        
        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm">
            <span className="text-[10px] text-slate-500 block font-semibold">Total Gross GMV</span>
            <span className="font-mono text-base font-extrabold text-[#0F1E36]">₹{stats?.totalGMV?.toLocaleString('en-IN') || '8,45,200'}</span>
          </div>
          <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm">
            <span className="text-[10px] text-slate-500 block font-semibold">Platform Revenue (15%)</span>
            <span className="font-mono text-base font-extrabold text-emerald-700">₹{stats?.platformRevenue?.toLocaleString('en-IN') || '1,28,400'}</span>
          </div>
          <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm">
            <span className="text-[10px] text-slate-500 block font-semibold">Total Rides Booked</span>
            <span className="font-mono text-base font-extrabold text-orange-600">{stats?.totalBookings || '3,124'}</span>
          </div>
          <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm">
            <span className="text-[10px] text-slate-500 block font-semibold">Pending Driver KYC</span>
            <span className="font-mono text-base font-extrabold text-amber-600">{stats?.pendingKyc || 2} In Queue</span>
          </div>
        </div>

        {/* Action feedback banner */}
        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 font-bold">
            ✓ {actionSuccess}
          </div>
        )}

        {/* Tab Controls Bar */}
        <div className="flex gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 text-xs font-semibold overflow-x-auto scrollbar-none shadow-sm">
          <button
            onClick={() => setActiveTab('kyc')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'kyc' ? 'bg-[#0F1E36] text-white shadow-sm' : 'text-slate-600 hover:text-[#0F1E36]'
            }`}
          >
            KYC Queue
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'drivers' ? 'bg-[#0F1E36] text-white shadow-sm' : 'text-slate-600 hover:text-[#0F1E36]'
            }`}
          >
            Fleet ({drivers.length})
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'pricing' ? 'bg-[#0F1E36] text-white shadow-sm' : 'text-slate-600 hover:text-[#0F1E36]'
            }`}
          >
            Pricing Rules
          </button>
          <button
            onClick={() => setActiveTab('cities')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'cities' ? 'bg-[#0F1E36] text-white shadow-sm' : 'text-slate-600 hover:text-[#0F1E36]'
            }`}
          >
            Cities ({citiesList.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'transactions' ? 'bg-[#0F1E36] text-white shadow-sm' : 'text-slate-600 hover:text-[#0F1E36]'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'support' ? 'bg-[#0F1E36] text-white shadow-sm' : 'text-slate-600 hover:text-[#0F1E36]'
            }`}
          >
            Tickets ({supportTickets.length})
          </button>
        </div>

        {/* 1. DRIVER KYC DOCUMENT REVIEW QUEUE */}
        {activeTab === 'kyc' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Document Approvals
            </h3>

            {kycDocs.filter(d => d.status === 'pending').length === 0 ? (
              <div className="text-center py-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="font-bold text-[#0F1E36] text-sm">KYC Queue Clear</h4>
                <p className="text-xs text-slate-500 mt-1">All registered driver documents are verified.</p>
              </div>
            ) : (
              kycDocs.filter(d => d.status === 'pending').map(doc => (
                <div
                  key={doc.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#0F1E36]">{doc.driverName}</h4>
                      <p className="text-slate-500 text-[11px]">{doc.docType}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                      Pending Review
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between items-center font-mono">
                    <span className="text-slate-500">Document No:</span>
                    <span className="text-orange-600 font-bold">{doc.docNumber}</span>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-slate-200 h-32 relative bg-slate-100">
                    <img
                      src={doc.fileUrl}
                      alt="KYC Document Preview"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 right-2 px-2 py-1 bg-white/90 rounded-lg text-[10px] text-slate-700 font-mono shadow-sm border border-slate-200">
                      Inspection Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleVerify(doc.driverId, 'reject')}
                      className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Application</span>
                    </button>
                    <button
                      onClick={() => handleVerify(doc.driverId, 'approve')}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1"
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
                className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={drv.photoUrl}
                    alt={drv.fullName}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="font-extrabold text-xs text-[#0F1E36]">{drv.fullName}</h4>
                    <p className="text-[11px] text-slate-500">{drv.primaryCity} • {drv.experienceYears} yrs exp</p>
                    <p className="text-[10px] text-slate-400 font-mono">DL: {drv.drivingLicenceNo}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    drv.verificationStatus === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    drv.verificationStatus === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {drv.verificationStatus}
                  </span>
                  <div className="mt-1">
                    {drv.verificationStatus === 'approved' ? (
                      <button
                        onClick={() => handleVerify(drv.id, 'suspend')}
                        className="text-[10px] text-rose-600 hover:underline font-semibold"
                      >
                        Suspend Account
                      </button>
                    ) : (
                      <button
                        onClick={() => handleVerify(drv.id, 'approve')}
                        className="text-[10px] text-emerald-600 hover:underline font-semibold"
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
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-500 mb-1">
              National Pricing & Commission Slabs
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-700">Base Hourly Rate (Min 2 hrs)</span>
                <span className="font-mono font-bold text-orange-600">₹299</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-700">Full-Day 8 Hours City</span>
                <span className="font-mono font-bold text-orange-600">₹1,199</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-700">Outstation Driver Daily Allowance (DA)</span>
                <span className="font-mono font-bold text-amber-600">₹350 / day</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-700">Night Allowance (10:00 PM - 6:00 AM)</span>
                <span className="font-mono font-bold text-amber-600">₹250</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-700">Platform Convenience Fee</span>
                <span className="font-mono font-bold text-emerald-700">₹49 / ride</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-700">Driver Share vs Platform Margin</span>
                <span className="font-mono font-bold text-[#0F1E36]">85% Driver / 15% Platform</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-700">Road Transport Aggregator GST</span>
                <span className="font-mono font-bold text-slate-500">5.0%</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. CITIES & OPERATING AREAS */}
        {activeTab === 'cities' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="font-bold uppercase tracking-wider text-slate-500">Active Service Cities ({citiesList.length})</span>
              <span className="text-[10px] text-orange-600 font-semibold">+ Add New City</span>
            </div>

            <div className="space-y-2">
              {citiesList.map(city => (
                <div key={city.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <h5 className="font-extrabold text-[#0F1E36] text-xs">{city.name}</h5>
                    <p className="text-[10px] text-slate-500">{city.state} • {city.activeDrivers} Active Chauffeurs</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-orange-600 text-xs">₹{city.baseRate}/hr</span>
                    <button
                      onClick={() => toggleCityStatus(city.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                        city.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
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
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-500 mb-1">
              Razorpay Settlement & Refund Ledger
            </h3>

            <div className="space-y-2">
              {transactions.map(tx => (
                <div key={tx.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-orange-600">{tx.ref}</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">₹{tx.amount}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>{tx.user} → {tx.driver}</span>
                    <span>{tx.method}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-[10px]">
                    <span className={`font-bold uppercase ${tx.status === 'refunded' ? 'text-rose-600' : 'text-emerald-700'}`}>
                      Status: {tx.status}
                    </span>
                    {tx.status !== 'refunded' && (
                      <button
                        onClick={() => handleRefund(tx.id)}
                        className="text-amber-600 hover:underline font-semibold"
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
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-500 mb-1">
              Customer Grievance Redressal
            </h3>

            <div className="space-y-2">
              {supportTickets.map(tkt => (
                <div key={tkt.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-orange-600">{tkt.ref}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      tkt.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {tkt.status}
                    </span>
                  </div>
                  <p className="font-bold text-[#0F1E36] text-xs">{tkt.subject}</p>
                  <p className="text-[10px] text-slate-500">Raised by: {tkt.user} • Category: {tkt.category}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
