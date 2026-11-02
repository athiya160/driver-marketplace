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
  RotateCcw,
  Percent,
  Tag,
  MessageSquare,
  HelpCircle,
  Check,
  Ban,
  Filter,
  Lock,
  Unlock,
  Eye,
  Plus,
  RefreshCw,
  LogOut,
  Calendar,
  Phone,
  ShieldCheck,
  Award
} from 'lucide-react';
import {
  adminLogin,
  fetchAdminStats,
  fetchAdminDrivers,
  fetchAdminKycQueue,
  verifyDriverKyc,
  fetchAdminCustomers,
  updateCustomerStatus,
  fetchAdminBookings,
  cancelAdminBooking,
  issueAdminRefund,
  fetchAdminTransactions,
  fetchAdminCities,
  createAdminCity,
  updateAdminCity,
  fetchAdminPricingRules,
  updateAdminPricingRules,
  fetchAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  fetchAdminSupportTickets,
  resolveAdminSupportTicket,
  fetchAdminReviews,
  fetchAdminAuditLogs
} from '../api.js';

export default function AdminDashboardScreen({ onSwitchRole }) {
  // Authentication & Access Control state
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [adminPin, setAdminPin] = useState('1234');
  const [loginError, setLoginError] = useState('');
  const [currentAdmin, setCurrentAdmin] = useState({
    name: 'Operations Admin (Console)',
    role: 'SuperAdmin',
    email: 'admin.ops@example.com'
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('overview'); 
  // 'overview', 'kyc', 'drivers', 'customers', 'bookings', 'pricing', 'cities', 'coupons', 'support', 'audit'

  // Global loading & notifications
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Domain states
  const [stats, setStats] = useState(null);
  const [kycDocs, setKycDocs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const [pricingRules, setPricingRules] = useState(null);
  const [couponsList, setCouponsList] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Search & Filter controls
  const [driverSearch, setDriverSearch] = useState('');
  const [driverStatusFilter, setDriverStatusFilter] = useState('all');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');

  // Modals / Dialog state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedDriverForAction, setSelectedDriverForAction] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedBookingForRefund, setSelectedBookingForRefund] = useState(null);
  const [refundAmountInput, setRefundAmountInput] = useState('');
  const [refundReasonInput, setRefundReasonInput] = useState('Customer satisfaction dispute resolution');

  const [addCityModalOpen, setAddCityModalOpen] = useState(false);
  const [newCityForm, setNewCityForm] = useState({ name: '', state: '', baseRate: 139 });

  const [addCouponModalOpen, setAddCouponModalOpen] = useState(false);
  const [newCouponForm, setNewCouponForm] = useState({
    code: '',
    discountType: 'flat',
    discountValue: 50,
    maxDiscount: 150,
    minBookingAmount: 299,
    description: '',
    expiresAt: '2026-12-31'
  });

  const [ticketResolveModalOpen, setTicketResolveModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolutionNotesInput, setResolutionNotesInput] = useState('');

  // Interactive Live Commission Simulator
  const [simBookingAmount, setSimBookingAmount] = useState(1200);

  // Load all operations data from backend
  const loadOperationsData = async () => {
    setLoading(true);
    try {
      const [
        statsRes,
        kycRes,
        driversRes,
        customersRes,
        bookingsRes,
        transRes,
        citiesRes,
        pricingRes,
        couponsRes,
        ticketsRes,
        auditRes
      ] = await Promise.all([
        fetchAdminStats(),
        fetchAdminKycQueue(),
        fetchAdminDrivers(),
        fetchAdminCustomers(),
        fetchAdminBookings(),
        fetchAdminTransactions(),
        fetchAdminCities(),
        fetchAdminPricingRules(),
        fetchAdminCoupons(),
        fetchAdminSupportTickets(),
        fetchAdminAuditLogs()
      ]);

      if (statsRes.success) setStats(statsRes.metrics);
      if (kycRes.success) setKycDocs(kycRes.documents || []);
      if (driversRes.success) setDrivers(driversRes.drivers || []);
      if (customersRes.success) setCustomers(customersRes.customers || []);
      if (bookingsRes.success) setBookingsList(bookingsRes.bookings || []);
      if (transRes.success) setTransactions(transRes.transactions || []);
      if (citiesRes.success) setCitiesList(citiesRes.cities || []);
      if (pricingRes.success) setPricingRules(pricingRes.pricingConfig);
      if (couponsRes.success) setCouponsList(couponsRes.coupons || []);
      if (ticketsRes.success) setSupportTickets(ticketsRes.tickets || []);
      if (auditRes.success) setAuditLogs(auditRes.logs || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setActionError('Network error loading operations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOperationsData();
  }, []);

  const triggerSuccessBanner = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  const triggerErrorBanner = (msg) => {
    setActionError(msg);
    setTimeout(() => setActionError(''), 4000);
  };

  // 1. ADMIN AUTHENTICATION
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await adminLogin({ pin: adminPin });
      if (res.success) {
        setIsAuthenticated(true);
        setCurrentAdmin(res.user);
        loadOperationsData();
        triggerSuccessBanner('Admin session authorized successfully');
      } else {
        setLoginError(res.message || 'Access denied');
      }
    } catch (err) {
      setLoginError('Error connecting to auth service');
    }
  };

  // 2. KYC VERIFICATION ACTIONS
  const handleVerifyDriver = async (driverId, action, reason = '') => {
    try {
      const res = await verifyDriverKyc(driverId, action, reason);
      if (res.success) {
        triggerSuccessBanner(res.message);
        loadOperationsData();
        setRejectModalOpen(false);
        setSelectedDriverForAction(null);
        setRejectionReasonInput('');
      } else {
        triggerErrorBanner(res.message || 'Verification update failed');
      }
    } catch (err) {
      triggerErrorBanner('Error processing driver KYC status');
    }
  };

  // 3. CUSTOMER STATUS TOGGLE
  const handleToggleCustomerStatus = async (customerId, currentStatus) => {
    const action = currentStatus === 'suspended' ? 'activate' : 'suspend';
    try {
      const res = await updateCustomerStatus(customerId, action, `Admin manual ${action}`);
      if (res.success) {
        triggerSuccessBanner(res.message);
        loadOperationsData();
      }
    } catch (err) {
      triggerErrorBanner('Failed to update customer status');
    }
  };

  // 4. BOOKINGS CANCELLATION & REFUNDS
  const handleCancelBooking = async (bookingId, reference) => {
    const reason = prompt(`Enter cancellation reason for ${reference}:`, 'Operational dispatch cancellation');
    if (!reason) return;

    try {
      const res = await cancelAdminBooking(bookingId, reason);
      if (res.success) {
        triggerSuccessBanner(res.message);
        loadOperationsData();
      }
    } catch (err) {
      triggerErrorBanner('Failed to cancel booking');
    }
  };

  const handleOpenRefundModal = (booking) => {
    setSelectedBookingForRefund(booking);
    setRefundAmountInput(booking.totalFare);
    setRefundModalOpen(true);
  };

  const handleProcessRefund = async () => {
    if (!selectedBookingForRefund) return;
    try {
      const res = await issueAdminRefund(selectedBookingForRefund.id, {
        amount: Number(refundAmountInput),
        reason: refundReasonInput
      });
      if (res.success) {
        triggerSuccessBanner(res.message);
        setRefundModalOpen(false);
        setSelectedBookingForRefund(null);
        loadOperationsData();
      }
    } catch (err) {
      triggerErrorBanner('Failed to process refund');
    }
  };

  // 5. CITIES MANAGEMENT
  const handleToggleCityStatus = async (city) => {
    try {
      const res = await updateAdminCity(city.id, { active: !city.active });
      if (res.success) {
        triggerSuccessBanner(`Updated ${city.name} active state`);
        loadOperationsData();
      }
    } catch (err) {
      triggerErrorBanner('Failed to update city status');
    }
  };

  const handleUpdateCityRate = async (city, newRate) => {
    if (!newRate || isNaN(newRate)) return;
    try {
      const res = await updateAdminCity(city.id, { baseRate: Number(newRate) });
      if (res.success) {
        triggerSuccessBanner(`Updated ${city.name} base rate to ₹${newRate}/hr`);
        loadOperationsData();
      }
    } catch (err) {
      triggerErrorBanner('Failed to update rate');
    }
  };

  const handleCreateCity = async (e) => {
    e.preventDefault();
    if (!newCityForm.name || !newCityForm.state) return;
    try {
      const res = await createAdminCity(newCityForm);
      if (res.success) {
        triggerSuccessBanner(res.message);
        setAddCityModalOpen(false);
        setNewCityForm({ name: '', state: '', baseRate: 139 });
        loadOperationsData();
      }
    } catch (err) {
      triggerErrorBanner('Failed to add city');
    }
  };

  // 6. PRICING RULES UPDATE
  const handleSavePricingRules = async () => {
    if (!pricingRules) return;
    try {
      const res = await updateAdminPricingRules(pricingRules);
      if (res.success) {
        triggerSuccessBanner('National pricing and platform commission updated');
        loadOperationsData();
      }
    } catch (err) {
      triggerErrorBanner('Failed to update pricing rules');
    }
  };

  // 7. COUPONS MANAGEMENT
  const handleToggleCoupon = async (coupon) => {
    try {
      const res = await updateAdminCoupon(coupon.id, { isActive: !coupon.isActive });
      if (res.success) {
        triggerSuccessBanner(`Coupon ${coupon.code} ${!coupon.isActive ? 'activated' : 'deactivated'}`);
        loadOperationsData();
      }
    } catch (err) {
      triggerErrorBanner('Failed to toggle coupon');
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCouponForm.code || !newCouponForm.discountValue) return;
    try {
      const res = await createAdminCoupon(newCouponForm);
      if (res.success) {
        triggerSuccessBanner(res.message);
        setAddCouponModalOpen(false);
        setNewCouponForm({
          code: '',
          discountType: 'flat',
          discountValue: 50,
          maxDiscount: 150,
          minBookingAmount: 299,
          description: '',
          expiresAt: '2026-12-31'
        });
        loadOperationsData();
      }
    } catch (err) {
      triggerErrorBanner('Failed to create coupon');
    }
  };

  // 8. SUPPORT TICKETS RESOLUTION
  const handleOpenTicketResolveModal = (ticket) => {
    setSelectedTicket(ticket);
    setResolutionNotesInput(ticket.resolutionNotes || 'Grievance investigated and resolved per platform standards.');
    setTicketResolveModalOpen(true);
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket) return;
    try {
      const res = await resolveAdminSupportTicket(selectedTicket.id, {
        status: 'resolved',
        resolutionNotes: resolutionNotesInput
      });
      if (res.success) {
        triggerSuccessBanner(res.message);
        setTicketResolveModalOpen(false);
        setSelectedTicket(null);
        loadOperationsData();
      }
    } catch (err) {
      triggerErrorBanner('Failed to resolve support ticket');
    }
  };

  // --- ACCESS GATE IF NOT AUTHENTICATED ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-full flex items-center justify-center p-6 bg-[#0B1527] text-white">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 text-orange-400 mx-auto flex items-center justify-center font-bold border border-orange-500/30">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">Marketplace Operations Center</h2>
            <p className="text-xs text-slate-400">Restricted Executive Control Panel</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                SuperAdmin PIN / Passkey
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="Enter 4-digit PIN (default: 1234)"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                For administrative testing, use PIN <span className="text-orange-400 font-bold">1234</span>
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Sign In to Operations Console</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filtered views
  const pendingKycCount = kycDocs.filter(d => d.status === 'pending').length;
  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = !driverSearch ||
      d.fullName.toLowerCase().includes(driverSearch.toLowerCase()) ||
      d.phone.includes(driverSearch) ||
      (d.drivingLicenceNo && d.drivingLicenceNo.toLowerCase().includes(driverSearch.toLowerCase()));
    const matchesStatus = driverStatusFilter === 'all' || d.verificationStatus === driverStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredBookings = bookingsList.filter(b => {
    const matchesSearch = !bookingSearch ||
      b.bookingReference.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      (b.customerName && b.customerName.toLowerCase().includes(bookingSearch.toLowerCase())) ||
      (b.driverName && b.driverName.toLowerCase().includes(bookingSearch.toLowerCase()));
    const matchesStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTickets = supportTickets.filter(t => {
    return ticketStatusFilter === 'all' || t.status === ticketStatusFilter;
  });

  // Commission Simulator Calculation
  const simCommissionRate = pricingRules?.platformCommissionPercent || 15;
  const simPlatformCut = Math.round(simBookingAmount * (simCommissionRate / 100));
  const simDriverCut = simBookingAmount - simPlatformCut;
  const simConvenience = pricingRules?.platformConvenienceFee || 49;
  const simGst = Math.round((simBookingAmount + simConvenience) * 0.05);

  return (
    <div className="flex flex-col min-h-full pb-24 bg-[#F8FAFC] text-[#172033]">
      
      {/* 1. TOP HEADER & OPERATIONAL BAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0F1E36] text-orange-400 flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm text-[#0F1E36] tracking-tight">Marketplace Operations Center</h1>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Metros: {citiesList.filter(c => c.active).length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Pan-India Personal Chauffeur Platform Command</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadOperationsData}
              title="Refresh Real-Time Data"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-[#0F1E36]">{currentAdmin.name}</span>
              <span className="text-[10px] text-orange-600 font-semibold font-mono">Platform Admin</span>
            </div>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock Session</span>
            </button>
          </div>
        </div>

        {/* Global Action Banners */}
        {actionSuccess && (
          <div className="bg-emerald-50 border-t border-emerald-200 px-4 py-2 text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="bg-rose-50 border-t border-rose-200 px-4 py-2 text-xs text-rose-800 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="flex gap-1 px-4 py-2 overflow-x-auto scrollbar-none border-t border-slate-100 text-xs font-semibold bg-slate-50/80">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'kyc', label: 'KYC Queue', icon: ShieldCheck, badge: pendingKycCount },
            { id: 'drivers', label: 'Fleet Directory', icon: Car, count: drivers.length },
            { id: 'customers', label: 'Customers', icon: Users, count: customers.length },
            { id: 'bookings', label: 'Bookings & Dispatch', icon: Clock, count: bookingsList.length },
            { id: 'pricing', label: 'Pricing & Slabs', icon: Percent },
            { id: 'cities', label: 'Operating Cities', icon: MapPin, count: citiesList.length },
            { id: 'coupons', label: 'Promotions', icon: Tag, count: couponsList.length },
            { id: 'support', label: 'Grievances', icon: HelpCircle, badge: supportTickets.filter(t => t.status === 'open').length },
            { id: 'audit', label: 'Audit Trail', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#0F1E36] text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:text-[#0F1E36] hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
                {tab.count !== undefined && (
                  <span className={`text-[10px] opacity-75 font-mono ${isActive ? 'text-white' : 'text-slate-400'}`}>
                    ({tab.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* 2. TAB CONTENT VIEWPORT */}
      <main className="p-4 space-y-4 max-w-7xl mx-auto w-full">

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: OVERVIEW & ANALYTICS DASHBOARD */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Top KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Gross Booking GMV</span>
                  <DollarSign className="w-4 h-4 text-orange-500" />
                </div>
                <div className="text-xl font-extrabold font-mono text-[#0F1E36]">
                  ₹{stats?.totalGMV?.toLocaleString('en-IN') || '8,45,200'}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Total customer bookings processed</p>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Platform Take (15% Net)</span>
                  <Percent className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl font-extrabold font-mono text-emerald-700">
                  ₹{stats?.platformRevenue?.toLocaleString('en-IN') || '1,28,400'}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Platform commission + ₹49 convenience</p>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Driver Payouts (85% + DA)</span>
                  <Award className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-xl font-extrabold font-mono text-[#0F1E36]">
                  ₹{stats?.driverPayoutsTotal?.toLocaleString('en-IN') || '7,16,800'}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Settled & accrued chauffeur payouts</p>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Active Rides Right Now</span>
                  <Clock className="w-4 h-4 text-orange-600 animate-pulse" />
                </div>
                <div className="text-xl font-extrabold font-mono text-orange-600">
                  {stats?.activeTripsNow || 1} Rides
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Chauffeurs on active meter</p>
              </div>
            </div>

            {/* Middle Section: Service Category Breakdown & City Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Category Breakdown */}
              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3">
                <h3 className="text-xs font-extrabold text-[#0F1E36] uppercase tracking-wider flex items-center justify-between">
                  <span>Chauffeur Service Mix</span>
                  <span className="text-[10px] text-slate-400 font-normal">All-Time Bookings</span>
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Hourly Driver Rentals (City Trips)</span>
                      <span className="font-mono text-orange-600">{stats?.serviceBreakdown?.hourly || 1850} bookings</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Outstation Highway Chauffeurs</span>
                      <span className="font-mono text-blue-600">{stats?.serviceBreakdown?.outstation || 720} bookings</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Airport Flight-Safe Drop/Pickup</span>
                      <span className="font-mono text-emerald-600">{stats?.serviceBreakdown?.airport || 420} bookings</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '12%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Full-Day Corporate & Events (8+ hrs)</span>
                      <span className="font-mono text-purple-600">{stats?.serviceBreakdown?.daily || 130} bookings</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '8%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Operating Metros Quick Glance */}
              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-[#0F1E36] uppercase tracking-wider">
                    Operational Metros Fleet
                  </h3>
                  <button
                    onClick={() => setActiveTab('cities')}
                    className="text-[11px] text-orange-600 font-bold hover:underline"
                  >
                    Manage Cities →
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {citiesList.slice(0, 6).map(city => (
                    <div key={city.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#0F1E36]">{city.name}</div>
                        <div className="text-[10px] text-slate-500">{city.activeDrivers} Chauffeurs</div>
                      </div>
                      <span className="font-mono font-bold text-orange-600 text-[11px]">
                        ₹{city.baseRate}/hr
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: KYC VERIFICATION QUEUE */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'kyc' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-[#0F1E36] uppercase tracking-wider">
                  Chauffeur KYC Verification Queue
                </h2>
                <p className="text-xs text-slate-500">
                  Review Commercial Driving Licenses, Masked Aadhaar and Police Clearance Certificates (PCC)
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-xs font-bold font-mono">
                {pendingKycCount} Pending Review
              </span>
            </div>

            {pendingKycCount === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-2">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-sm text-[#0F1E36]">KYC Queue Completely Clear</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  All registered driver documents have been reviewed. Approved drivers are immediately discoverable in public search.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kycDocs.filter(d => d.status === 'pending').map(doc => {
                  const driverProfile = drivers.find(drv => drv.id === doc.driverId);
                  return (
                    <div
                      key={doc.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs text-xs space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          {driverProfile && (
                            <img
                              src={driverProfile.photoUrl}
                              alt={driverProfile.fullName}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                            />
                          )}
                          <div>
                            <h4 className="font-extrabold text-sm text-[#0F1E36]">{doc.driverName}</h4>
                            <p className="text-slate-500 text-[11px]">{doc.docType}</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                          Pending Approval
                        </span>
                      </div>

                      {/* Document Details Grid */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 font-mono text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Government ID / DL No:</span>
                          <span className="text-orange-600 font-bold">{doc.docNumber}</span>
                        </div>
                        {driverProfile && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-slate-500">City / Experience:</span>
                              <span className="text-slate-700">{driverProfile.primaryCity} • {driverProfile.experienceYears} yrs</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Transmissions Handled:</span>
                              <span className="text-slate-700">{driverProfile.transmissionSkills?.join(', ') || 'Manual, Automatic'}</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Document Scan Preview */}
                      <div className="rounded-xl overflow-hidden border border-slate-200 h-40 relative bg-slate-900 group">
                        <img
                          src={doc.fileUrl}
                          alt="Government Document Scan Preview"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2.5 justify-between">
                          <span className="px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white rounded text-[10px] font-mono">
                            Encrypted ID Proof
                          </span>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 bg-white/90 hover:bg-white text-slate-800 rounded text-[10px] font-bold shadow-xs flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Full Scan</span>
                          </a>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => {
                            setSelectedDriverForAction({ id: doc.driverId, name: doc.driverName });
                            setRejectionReasonInput('Commercial driving license photo unreadable or expired');
                            setRejectModalOpen(true);
                          }}
                          className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject Application</span>
                        </button>
                        <button
                          onClick={() => handleVerifyDriver(doc.driverId, 'approve')}
                          className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve & Make Searchable</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: DRIVER FLEET DIRECTORY */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'drivers' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-2.5 items-center justify-between shadow-xs">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search driver by name, phone, or DL..."
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#0F1E36]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Filter Status:</span>
                <select
                  value={driverStatusFilter}
                  onChange={(e) => setDriverStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-[#0F1E36] focus:outline-none"
                >
                  <option value="all">All Chauffeurs ({drivers.length})</option>
                  <option value="approved">Approved & Active</option>
                  <option value="pending">Pending KYC</option>
                  <option value="suspended">Suspended Accounts</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Drivers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredDrivers.map(drv => (
                <div
                  key={drv.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs text-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={drv.photoUrl}
                          alt={drv.fullName}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                        />
                        <div>
                          <h4 className="font-extrabold text-sm text-[#0F1E36]">{drv.fullName}</h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {drv.primaryCity} • {drv.experienceYears} yrs experience
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-amber-600 font-bold font-mono">
                              ★ {drv.rating || '5.0'}
                            </span>
                            <span className="text-[10px] text-slate-400">({drv.totalTrips || 0} trips)</span>
                          </div>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        drv.verificationStatus === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        drv.verificationStatus === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        drv.verificationStatus === 'suspended' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {drv.verificationStatus}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 font-mono text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Commercial DL:</span>
                        <span className="text-slate-800 font-bold">{drv.drivingLicenceNo || 'DL-PENDING'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Transmissions:</span>
                        <span className="text-slate-800">{drv.transmissionSkills?.join(', ') || 'Manual, Auto'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Payout UPI ID:</span>
                        <span className="text-emerald-700 font-bold">{drv.payoutUpiId || 'driver@upi'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-mono font-bold text-orange-600 text-xs">
                      ₹{drv.hourlyRate}/hr
                    </span>
                    <div className="flex items-center gap-1.5">
                      {drv.verificationStatus === 'approved' ? (
                        <button
                          onClick={() => handleVerifyDriver(drv.id, 'suspend')}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold border border-rose-200 transition"
                        >
                          Suspend
                        </button>
                      ) : drv.verificationStatus === 'suspended' ? (
                        <button
                          onClick={() => handleVerifyDriver(drv.id, 'reactivate')}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold border border-emerald-200 transition"
                        >
                          Re-activate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerifyDriver(drv.id, 'approve')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition"
                        >
                          Approve KYC
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: CUSTOMER DIRECTORY */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-[#0F1E36] uppercase tracking-wider">
                  Customer Accounts & Spend
                </h2>
                <p className="text-xs text-slate-500">Manage customer accounts, trip frequency, and account status</p>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                Total Customers: {customers.length}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Total Rides</th>
                    <th className="p-3">Total Spent</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map(cust => (
                    <tr key={cust.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3">
                        <div className="font-extrabold text-[#0F1E36]">{cust.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {cust.id}</div>
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        <div>{cust.phone}</div>
                        <div className="text-slate-400 text-[10px]">{cust.email}</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-700">
                        {cust.totalBookingsCount || 0} rides
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-700">
                        ₹{cust.totalSpent?.toLocaleString('en-IN') || 0}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          cust.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {cust.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleCustomerStatus(cust.id, cust.status)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                            cust.status === 'active'
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {cust.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: BOOKINGS & DISPATCH MANAGEMENT */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-2.5 items-center justify-between shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by SRT Reference, Customer or Chauffeur..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#0F1E36]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Filter Status:</span>
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-[#0F1E36] focus:outline-none"
                >
                  <option value="all">All Statuses ({bookingsList.length})</option>
                  <option value="in_progress">In Progress (Active)</option>
                  <option value="accepted">Accepted / Upcoming</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Bookings Ledger */}
            <div className="space-y-3">
              {filteredBookings.map(b => (
                <div
                  key={b.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs text-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-extrabold text-sm text-orange-600">
                        {b.bookingReference}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        b.status === 'in_progress' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                        b.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        b.status === 'cancelled' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {b.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div className="font-mono text-base font-extrabold text-[#0F1E36]">
                        ₹{b.totalFare}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                        b.paymentStatus === 'refunded' ? 'bg-rose-100 text-rose-800' :
                        b.paymentStatus === 'captured' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        Payment: {b.paymentStatus || 'authorized'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Customer:</span>
                      <span className="font-bold text-[#0F1E36]">{b.customerName}</span>
                      <span className="text-slate-500 block text-[10px]">{b.customerPhone}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Assigned Chauffeur:</span>
                      <span className="font-bold text-[#0F1E36]">{b.driverName}</span>
                      <span className="text-slate-500 block text-[10px]">{b.driverPhone}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Service & Transmission:</span>
                      <span className="font-bold text-[#0F1E36]">{b.serviceTitle || b.serviceType}</span>
                      <span className="text-slate-500 block text-[10px]">{b.vehicleType} • {b.transmissionType}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Trip Verification OTP:</span>
                      <span className="font-mono font-extrabold text-orange-600 text-xs">
                        {b.tripStartOtp || '4821'}
                      </span>
                      <span className="text-slate-500 block text-[10px]">{b.startDate} at {b.startTime}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-md">{b.pickupAddress} → {b.dropAddress}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {b.status !== 'cancelled' && b.status !== 'completed' && (
                        <button
                          onClick={() => handleCancelBooking(b.id, b.bookingReference)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-lg border border-rose-200 transition"
                        >
                          Cancel Booking
                        </button>
                      )}
                      {b.paymentStatus !== 'refunded' && (
                        <button
                          onClick={() => handleOpenRefundModal(b)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] rounded-lg border border-amber-200 transition"
                        >
                          Issue Refund
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 6: PRICING & COMMISSION CONFIGURATION */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'pricing' && pricingRules && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-[#0F1E36] uppercase tracking-wider">
                  National Pricing, Allowances & Commission Configuration
                </h2>
                <p className="text-xs text-slate-500">
                  Configure driver compensation guardrails, aggregator commission take, and night allowances
                </p>
              </div>
              <button
                onClick={handleSavePricingRules}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Pricing Changes</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Form Controls */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5 text-xs">
                <h3 className="font-extrabold text-[#0F1E36] uppercase tracking-wider text-xs border-b border-slate-100 pb-2">
                  Base Rates & Slabs
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Minimum 2-Hour Base Fare (₹)
                    </label>
                    <input
                      type="number"
                      value={pricingRules.baseHourlyRate}
                      onChange={(e) => setPricingRules({ ...pricingRules, baseHourlyRate: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-[#0F1E36] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Extra Hours Rate (₹/hr)
                    </label>
                    <input
                      type="number"
                      value={pricingRules.extraHourlyRate}
                      onChange={(e) => setPricingRules({ ...pricingRules, extraHourlyRate: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-[#0F1E36] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Full-Day 8 Hours Package (₹)
                    </label>
                    <input
                      type="number"
                      value={pricingRules.fullDay8Hours}
                      onChange={(e) => setPricingRules({ ...pricingRules, fullDay8Hours: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-[#0F1E36] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Outstation Daily Allowance (DA) (₹/day)
                    </label>
                    <input
                      type="number"
                      value={pricingRules.outstationDriverDA}
                      onChange={(e) => setPricingRules({ ...pricingRules, outstationDriverDA: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-[#0F1E36] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Night Allowance (10 PM - 6 AM) (₹)
                    </label>
                    <input
                      type="number"
                      value={pricingRules.nightAllowance}
                      onChange={(e) => setPricingRules({ ...pricingRules, nightAllowance: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-[#0F1E36] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Platform Convenience Fee (₹/ride)
                    </label>
                    <input
                      type="number"
                      value={pricingRules.platformConvenienceFee}
                      onChange={(e) => setPricingRules({ ...pricingRules, platformConvenienceFee: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-[#0F1E36] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Platform Commission Rate: <span className="text-orange-600 font-mono text-sm">{pricingRules.platformCommissionPercent}%</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Driver Retains {100 - pricingRules.platformCommissionPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={pricingRules.platformCommissionPercent}
                    onChange={(e) => setPricingRules({ ...pricingRules, platformCommissionPercent: Number(e.target.value) })}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Commission Simulator */}
              <div className="bg-[#0F1E36] text-white rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Real-Time Payout Simulator</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">Dynamic Model</span>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1.5">Test Trip Base Fare (₹)</label>
                  <input
                    type="number"
                    value={simBookingAmount}
                    onChange={(e) => setSimBookingAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-2 bg-slate-800/60 p-3.5 rounded-xl border border-slate-700 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Chauffeur Net Payout ({100 - simCommissionRate}%):</span>
                    <span className="font-mono font-bold text-emerald-400">₹{simDriverCut}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Platform Commission Take ({simCommissionRate}%):</span>
                    <span className="font-mono font-bold text-orange-400">₹{simPlatformCut}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Platform Convenience Fee:</span>
                    <span className="font-mono text-slate-300">₹{simConvenience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Aggregator GST (5.0%):</span>
                    <span className="font-mono text-slate-300">₹{simGst}</span>
                  </div>
                  <div className="border-t border-slate-700 pt-2 flex justify-between font-bold text-sm">
                    <span className="text-white">Customer Total Billed:</span>
                    <span className="font-mono text-emerald-400">₹{simBookingAmount + simConvenience + simGst}</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400">
                  * Note: 100% of Outstation Daily Allowance (DA ₹350) and Night Allowance (₹250) are directly passed through to the chauffeur without platform commission deduction.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 7: CITIES & OPERATING AREAS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'cities' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-[#0F1E36] uppercase tracking-wider">
                  Operating Cities & Service Areas ({citiesList.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Enable or disable service zones across Indian metropolitan hubs and edit base hourly rates
                </p>
              </div>
              <button
                onClick={() => setAddCityModalOpen(true)}
                className="px-3 py-1.5 bg-[#0F1E36] hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New City</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {citiesList.map(city => (
                <div
                  key={city.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs text-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#0F1E36]">{city.name}</h4>
                      <p className="text-[10px] text-slate-500">{city.state}</p>
                    </div>
                    <button
                      onClick={() => handleToggleCityStatus(city)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition ${
                        city.active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {city.active ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-500 text-[11px]">Active Fleet:</span>
                    <span className="font-mono font-bold text-slate-700">{city.activeDrivers} Chauffeurs</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">Base Hourly Rate:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-bold text-[#0F1E36]">₹</span>
                      <input
                        type="number"
                        defaultValue={city.baseRate}
                        onBlur={(e) => handleUpdateCityRate(city, e.target.value)}
                        className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono font-bold text-orange-600 text-right focus:outline-none focus:border-[#0F1E36]"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">/hr</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 8: PROMOTIONS & COUPONS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'coupons' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-[#0F1E36] uppercase tracking-wider">
                  Promotions & Coupon Codes
                </h2>
                <p className="text-xs text-slate-500">
                  Manage customer discount coupons, flat and percentage promotional codes
                </p>
              </div>
              <button
                onClick={() => setAddCouponModalOpen(true)}
                className="px-3 py-1.5 bg-[#0F1E36] hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Promo Code</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {couponsList.map(cpn => (
                <div
                  key={cpn.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs text-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-orange-100 text-orange-800 rounded-lg font-mono font-extrabold text-sm border border-orange-200">
                        {cpn.code}
                      </span>
                      <button
                        onClick={() => handleToggleCoupon(cpn)}
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase transition ${
                          cpn.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {cpn.isActive ? 'Active' : 'Expired'}
                      </button>
                    </div>

                    <p className="text-slate-600 text-xs font-medium">{cpn.description}</p>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 font-mono text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Discount:</span>
                        <span className="font-bold text-orange-600">
                          {cpn.discountType === 'flat' ? `₹${cpn.discountValue} Flat` : `${cpn.discountValue}% (Max ₹${cpn.maxDiscount})`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Min Order:</span>
                        <span className="text-slate-700">₹{cpn.minBookingAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Expires:</span>
                        <span className="text-slate-700">{cpn.expiresAt}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 9: CUSTOMER COMPLAINTS & GRIEVANCES */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'support' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-[#0F1E36] uppercase tracking-wider">
                  Customer & Chauffeur Grievance Redressal
                </h2>
                <p className="text-xs text-slate-500">
                  Track billing disputes, GST invoice requests, and ride behavior feedback
                </p>
              </div>

              <select
                value={ticketStatusFilter}
                onChange={(e) => setTicketStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#0F1E36] focus:outline-none"
              >
                <option value="all">All Grievances ({supportTickets.length})</option>
                <option value="open">Open Tickets</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredTickets.map(tkt => (
                <div
                  key={tkt.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs text-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-orange-600">{tkt.bookingReference}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">
                        {tkt.category}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      tkt.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {tkt.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-[#0F1E36]">{tkt.subject}</h4>
                    <p className="text-slate-600 mt-1 text-xs">{tkt.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Raised by: {tkt.userName}</p>
                  </div>

                  {tkt.resolutionNotes && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800">
                      <span className="font-bold">Admin Resolution: </span>
                      <span>{tkt.resolutionNotes}</span>
                    </div>
                  )}

                  {tkt.status !== 'resolved' && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => handleOpenTicketResolveModal(tkt)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Add Resolution & Close Ticket</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 10: IMMUTABLE AUDIT TRAIL */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-extrabold text-[#0F1E36] uppercase tracking-wider">
                Platform Security & Administrative Audit Trail
              </h2>
              <p className="text-xs text-slate-500">
                Tamper-evident chronological log of sensitive admin operations, KYC approvals, refunds, and pricing modifications
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Admin</th>
                    <th className="p-3">Action Type</th>
                    <th className="p-3">Target Entity</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3 text-slate-400 whitespace-nowrap text-[10px]">
                        {new Date(log.timestamp).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 font-sans font-bold text-[#0F1E36] whitespace-nowrap">
                        {log.adminName}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-orange-600 font-bold text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 font-sans font-semibold">
                        {log.target}
                      </td>
                      <td className="p-3 text-slate-500 font-sans text-xs">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* ------------------------------------------------------------- */}
      {/* GLOBAL MODALS */}
      {/* ------------------------------------------------------------- */}

      {/* Rejection Reason Modal */}
      {rejectModalOpen && selectedDriverForAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-[#0F1E36]">Reject Chauffeur Application</h3>
            <p className="text-xs text-slate-500">
              Please specify the compliance reason for rejecting {selectedDriverForAction.name}. This will be communicated to the driver.
            </p>

            <textarea
              rows="3"
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-[#0F1E36]"
              placeholder="e.g. Expired commercial badge, blurry photograph..."
            />

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerifyDriver(selectedDriverForAction.id, 'reject', rejectionReasonInput)}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Processor Modal */}
      {refundModalOpen && selectedBookingForRefund && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-[#0F1E36]">
              Issue Instant Razorpay Refund
            </h3>
            <p className="text-xs text-slate-500">
              Ref: <span className="font-mono font-bold text-orange-600">{selectedBookingForRefund.bookingReference}</span> • Customer: {selectedBookingForRefund.customerName}
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Refund Amount (₹)
                </label>
                <input
                  type="number"
                  value={refundAmountInput}
                  onChange={(e) => setRefundAmountInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-lg text-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Refund Reason / Ledger Note
                </label>
                <input
                  type="text"
                  value={refundReasonInput}
                  onChange={(e) => setRefundReasonInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setRefundModalOpen(false)}
                className="py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessRefund}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Process 100% Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New City Modal */}
      {addCityModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-[#0F1E36]">Add New Operating City</h3>
            
            <form onSubmit={handleCreateCity} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">City Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ahmedabad"
                  value={newCityForm.name}
                  onChange={(e) => setNewCityForm({ ...newCityForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">State / Region</label>
                <input
                  type="text"
                  placeholder="e.g. Gujarat"
                  value={newCityForm.state}
                  onChange={(e) => setNewCityForm({ ...newCityForm, state: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Base Hourly Rate (₹/hr)</label>
                <input
                  type="number"
                  value={newCityForm.baseRate}
                  onChange={(e) => setNewCityForm({ ...newCityForm, baseRate: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddCityModalOpen(false)}
                  className="py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 bg-[#0F1E36] hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Save City
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Coupon Modal */}
      {addCouponModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-[#0F1E36]">Create Promotional Coupon</h3>

            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Coupon Code</label>
                <input
                  type="text"
                  placeholder="e.g. FESTIVE200"
                  value={newCouponForm.code}
                  onChange={(e) => setNewCouponForm({ ...newCouponForm, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Discount Type</label>
                  <select
                    value={newCouponForm.discountType}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, discountType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                  >
                    <option value="flat">Flat ₹ Off</option>
                    <option value="percentage">% Percentage</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Discount Value</label>
                  <input
                    type="number"
                    value={newCouponForm.discountValue}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, discountValue: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Flat ₹200 off on festive family trips"
                  value={newCouponForm.description}
                  onChange={(e) => setNewCouponForm({ ...newCouponForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddCouponModalOpen(false)}
                  className="py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 bg-[#0F1E36] hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Create Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Resolve Modal */}
      {ticketResolveModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-[#0F1E36]">Resolve Grievance Ticket</h3>
            <p className="text-xs text-slate-500">
              Ticket: <span className="font-mono font-bold text-orange-600">{selectedTicket.id}</span> • User: {selectedTicket.userName}
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Resolution Notes (Visible to Customer)
              </label>
              <textarea
                rows="3"
                value={resolutionNotesInput}
                onChange={(e) => setResolutionNotesInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setTicketResolveModalOpen(false)}
                className="py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveTicket}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Mark As Resolved
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
