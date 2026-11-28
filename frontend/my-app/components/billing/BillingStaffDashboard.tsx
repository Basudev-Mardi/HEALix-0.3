'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  Plus,
  FileText,
  LogOut,
  Shield,
  Sparkles,
  CreditCard,
  DollarSign,
  Check,
  X,
  Building,
  UserCheck,
  Building2,
  FileSpreadsheet,
  BadgePercent,
  Wallet,
  Landmark,
  ArrowUpRight,
  ShieldCheck,
  ClipboardList,
  AlertCircle
} from 'lucide-react';
import { type StaffUser, clearStaffSession } from '@/lib/staff-auth';

interface BillingStaffDashboardProps {
  billingStaff?: StaffUser | null;
  onLogout?: () => void;
}

interface BillingStats {
  total_collected_today: number;
  transactions_today: number;
  pending_invoices: number;
  total_receivables: number;
  paid_invoices: number;
  pending_tpa_claims: number;
  approved_tpa_claims: number;
  discharge_pending: number;
}

interface InvoiceItem {
  item: string;
  category: string;
  unit_price: number;
  qty: number;
  total: number;
}

interface InvoiceRecord {
  id: string;
  bill_number: string;
  patient_id: string;
  patient_name: string;
  category: string;
  items: InvoiceItem[] | string;
  subtotal: string | number;
  discount_percent: string | number;
  discount_amount: string | number;
  tax_percent: string | number;
  tax_amount: string | number;
  total_amount: string | number;
  deposit_applied: string | number;
  paid_amount: string | number;
  outstanding_balance: string | number;
  status: 'Pending' | 'Paid' | 'Partial' | 'Cancelled';
  due_date: string;
  notes: string;
  created_by: string;
  created_at: string;
}

interface InsuranceClaimRecord {
  id: string;
  invoice_id: string;
  patient_id: string;
  patient_name: string;
  provider_name: string;
  policy_number: string;
  coverage_verified: boolean;
  pre_auth_number: string;
  claimed_amount: string | number;
  approved_amount: string | number;
  settled_amount: string | number;
  status: 'Under Review' | 'Query Raised' | 'Approved' | 'Rejected' | 'Settled';
  submitted_by: string;
  created_at: string;
}

interface DischargeClearanceItem {
  admission_id: string;
  patient_id: string;
  patient_name: string;
  ward: string;
  room: string;
  bed_label: string;
  admission_date: string;
  admitting_doctor: string;
  diagnosis: string;
  invoice_id: string | null;
  bill_number: string | null;
  total_amount: number;
  paid_amount: number;
  outstanding_balance: number;
  billing_status: string;
  claim_id: string | null;
  tpa_provider: string | null;
  claim_status: string | null;
  tpa_approved_amount: number | null;
}

interface PaymentRecord {
  id: string;
  invoice_id: string;
  patient_id: string;
  patient_name: string;
  amount: string | number;
  payment_type: string;
  payment_method: string;
  reference_number: string;
  received_by: string;
  notes: string;
  paid_at: string;
}

export default function BillingStaffDashboard({ billingStaff, onLogout }: BillingStaffDashboardProps) {
  const [, startTransition] = useTransition();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'invoices' | 'tpa' | 'discharge' | 'payments'>('invoices');

  // Filter States
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data States
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [claims, setClaims] = useState<InsuranceClaimRecord[]>([]);
  const [dischargeClearances, setDischargeClearances] = useState<DischargeClearanceItem[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Expanded Invoice Details
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  // Modals
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [payAmount, setPayAmount] = useState<string>('0');
  const [payMethod, setPayMethod] = useState<string>('Credit Card (POS)');
  const [payRef, setPayRef] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');

  // Generate Invoice Modal
  const [showGenModal, setShowGenModal] = useState<boolean>(false);
  const [genPatientName, setGenPatientName] = useState<string>('Julian Montgomery');
  const [genPatientId, setGenPatientId] = useState<string>('HX-PT-2026-877648');
  const [genCategory, setGenCategory] = useState<string>('Outpatient (OPD)');
  const [genDiscountPct, setGenDiscountPct] = useState<number>(0);
  const [genTaxPct, setGenTaxPct] = useState<number>(5);
  const [genNotes, setGenNotes] = useState<string>('Clinical outpatient and laboratory services bill.');
  const [genItems, setGenItems] = useState<InvoiceItem[]>([
    { item: 'Specialist Clinical Consultation', category: 'Consultation', unit_price: 180, qty: 1, total: 180 },
    { item: 'Comprehensive Diagnostic Profile', category: 'Diagnostics', unit_price: 120, qty: 1, total: 120 }
  ]);

  // Pre-Auth Modal
  const [showClaimModal, setShowClaimModal] = useState<boolean>(false);
  const [claimPatientName, setClaimPatientName] = useState<string>('Julian Montgomery');
  const [claimPatientId, setClaimPatientId] = useState<string>('HX-PT-2026-877648');
  const [claimProvider, setClaimProvider] = useState<string>('StarHealth Shield TPA');
  const [claimPolicy, setClaimPolicy] = useState<string>('POL-SH-9928174');
  const [claimAmount, setClaimAmount] = useState<string>('1850.00');

  // Load Billing Data
  const loadBillingData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [dashRes, invRes, clmRes, clrRes, payRes] = await Promise.all([
        fetch('http://localhost:5000/api/v1/billing/dashboard'),
        fetch('http://localhost:5000/api/v1/billing/invoices'),
        fetch('http://localhost:5000/api/v1/billing/insurance-claims'),
        fetch('http://localhost:5000/api/v1/billing/discharge-clearances'),
        fetch('http://localhost:5000/api/v1/billing/payments')
      ]);

      if (dashRes.ok) {
        const dData = await dashRes.json();
        setStats(dData.stats || null);
      }

      if (invRes.ok) {
        const iData = await invRes.json();
        setInvoices(iData.data || []);
      }

      if (clmRes.ok) {
        const cData = await clmRes.json();
        setClaims(cData.data || []);
      }

      if (clrRes.ok) {
        const clrData = await clrRes.json();
        setDischargeClearances(clrData.data || []);
      }

      if (payRes.ok) {
        const pData = await payRes.json();
        setPayments(pData.data || []);
      }
    } catch (err) {
      console.error('Failed to load billing data:', err);
      setActionError('Could not sync with central hospital accounts gateway.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  // Toast auto-clear
  useEffect(() => {
    if (actionSuccess) {
      const t = setTimeout(() => setActionSuccess(null), 5000);
      return () => clearTimeout(t);
    }
  }, [actionSuccess]);

  useEffect(() => {
    if (actionError) {
      const t = setTimeout(() => setActionError(null), 6000);
      return () => clearTimeout(t);
    }
  }, [actionError]);

  // Open Payment Modal
  const openPayment = (inv: InvoiceRecord) => {
    setSelectedInvoice(inv);
    setPayAmount(String(inv.outstanding_balance));
    setPayRef(`TXN-${Date.now().toString().slice(-6)}`);
    setPayMethod('Credit Card (POS)');
    setPayNotes(`Settlement for invoice ${inv.bill_number}`);
    setShowPayModal(true);
  };

  // Submit Payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      const res = await fetch(`http://localhost:5000/api/v1/billing/invoices/${selectedInvoice.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(payAmount),
          payment_method: payMethod,
          reference_number: payRef,
          notes: payNotes,
          received_by: billingStaff?.name || 'David Chen, CPA',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed');

      setActionSuccess(data.message || 'Payment successfully recorded and receipt generated.');
      setShowPayModal(false);
      loadBillingData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing payment';
      setActionError(msg);
    }
  };

  // Submit New Invoice Generation
  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/v1/billing/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: genPatientId,
          patient_name: genPatientName,
          category: genCategory,
          items: genItems,
          discount_percent: genDiscountPct,
          tax_percent: genTaxPct,
          notes: genNotes,
          created_by: billingStaff?.name || 'David Chen, CPA',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invoice generation failed');

      setActionSuccess(data.message || 'New invoice generated.');
      setShowGenModal(false);
      loadBillingData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating invoice';
      setActionError(msg);
    }
  };

  // Submit New Pre-Auth Claim
  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/v1/billing/insurance-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: claimPatientId,
          patient_name: claimPatientName,
          provider_name: claimProvider,
          policy_number: claimPolicy,
          claimed_amount: claimAmount,
          submitted_by: billingStaff?.name || 'David Chen, CPA',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Claim submission failed');

      setActionSuccess(data.message || 'Cashless pre-auth claim submitted.');
      setShowClaimModal(false);
      loadBillingData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error submitting claim';
      setActionError(msg);
    }
  };

  // Update Claim Status (Approve Claim)
  const handleApproveClaim = async (claimId: string, claimed: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/billing/insurance-claims/${claimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Approved',
          approved_amount: claimed,
          note: 'Cashless authorization approved in full by TPA medical audit panel.',
          updated_by: billingStaff?.name || 'David Chen, CPA',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');

      setActionSuccess(`Claim ${claimId} approved.`);
      loadBillingData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating claim';
      setActionError(msg);
    }
  };

  // Add line item to invoice creator
  const addGenLineItem = () => {
    setGenItems(prev => [
      ...prev,
      { item: 'Hospital Bed/Clinical Service', category: 'General', unit_price: 100, qty: 1, total: 100 }
    ]);
  };

  const updateGenItem = (idx: number, field: keyof InvoiceItem, val: string | number) => {
    setGenItems(prev => {
      const next = [...prev];
      const target = { ...next[idx], [field]: val };
      target.total = Number(target.unit_price) * Number(target.qty);
      next[idx] = target;
      return next;
    });
  };

  const removeGenItem = (idx: number) => {
    setGenItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Filtered Invoices
  const filteredInvoices = invoices.filter(inv => {
    if (invoiceStatusFilter !== 'all' && inv.status !== invoiceStatusFilter) return false;
    if (categoryFilter !== 'all' && inv.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = inv.patient_name.toLowerCase().includes(q);
      const matchBill = inv.bill_number.toLowerCase().includes(q);
      const matchId = inv.id.toLowerCase().includes(q);
      if (!matchName && !matchBill && !matchId) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header & Identity Strip */}
      <header className="rounded-3xl border border-[#174C40]/20 bg-[#174C40] text-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <span className="h-14 w-14 rounded-2xl bg-white/10 text-emerald-300 flex items-center justify-center shrink-0 border border-white/10 backdrop-blur-xs">
            <Receipt className="h-7 w-7 text-emerald-300" />
          </span>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-serif tracking-tight font-medium text-white">
                {billingStaff?.name || 'David Chen, CPA'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                CPA • Revenue Cycle & TPA Accounts
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-emerald-100/80 mt-1 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-emerald-300" />
                Patient Accounts & Cashless TPA Desk (Level 0, West Wing)
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                Station: Inpatient & OPD Billing, Cashless Insurance & Discharge Financial Clearance
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
          <button
            onClick={() => {
              startTransition(() => {
                loadBillingData();
              });
            }}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-colors flex items-center gap-1.5"
            title="Refresh billing ledger"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync Ledger</span>
          </button>

          <button
            onClick={() => setShowGenModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 border border-emerald-400/30 transition-colors flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-300" />
            <span>Generate Bill</span>
          </button>

          <button
            onClick={() => {
              clearStaffSession();
              onLogout?.();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-rose-600/20 text-rose-200 hover:bg-rose-600/30 border border-rose-500/30 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* 2. Notification Banners */}
      {actionSuccess && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50 text-emerald-900 p-4 text-xs font-mono flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-50 text-rose-900 p-4 text-xs font-mono flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 3. KPI Telemetry Summary Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#77817C] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Collected Today</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-semibold text-emerald-700">
            ${(stats?.total_collected_today ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] font-mono text-[#77817C] mt-1">{stats?.transactions_today ?? 0} transactions processed</p>
        </div>

        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#77817C] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Pending Invoices</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-semibold text-[#1F2421]">
            {stats?.pending_invoices ?? 0}
          </div>
          <p className="text-[10px] font-mono text-[#77817C] mt-1">Unsettled patient bills</p>
        </div>

        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#77817C] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Receivables</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-serif font-semibold text-rose-600">
            ${(stats?.total_receivables ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] font-mono text-rose-600/80 mt-1">Outstanding patient balances</p>
        </div>

        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#77817C] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Paid Invoices</span>
            <CheckCircle2 className="h-4 w-4 text-teal-600" />
          </div>
          <div className="text-2xl font-serif font-semibold text-[#1F2421]">
            {stats?.paid_invoices ?? 0}
          </div>
          <p className="text-[10px] font-mono text-[#77817C] mt-1">Fully reconciled bills</p>
        </div>

        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#77817C] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">TPA Pre-Auth</span>
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-serif font-semibold text-[#1F2421]">
            {stats?.pending_tpa_claims ?? 0}
            <span className="text-xs text-[#77817C] font-normal"> under review</span>
          </div>
          <p className="text-[10px] font-mono text-emerald-600 mt-1">{stats?.approved_tpa_claims ?? 0} approved cashless</p>
        </div>

        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#77817C] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Discharge Desk</span>
            <ClipboardList className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-serif font-semibold text-[#1F2421]">
            {stats?.discharge_pending ?? 0}
          </div>
          <p className="text-[10px] font-mono text-[#77817C] mt-1">Admitted IPD patients</p>
        </div>
      </section>

      {/* 4. Navigation Tabs */}
      <div className="border-b border-[#E5E8E6] flex items-center justify-between gap-4 overflow-x-auto pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveTab('invoices'); setSearchQuery(''); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-medium font-mono transition-all flex items-center gap-2 ${
              activeTab === 'invoices'
                ? 'bg-[#174C40] text-white shadow-xs'
                : 'text-[#4A5350] hover:bg-[#F0F2F1]'
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Invoices & Ledger</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
              {filteredInvoices.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('tpa'); setSearchQuery(''); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-medium font-mono transition-all flex items-center gap-2 ${
              activeTab === 'tpa'
                ? 'bg-[#174C40] text-white shadow-xs'
                : 'text-[#4A5350] hover:bg-[#F0F2F1]'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Cashless Insurance & TPA ({claims.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('discharge')}
            className={`px-4 py-2.5 rounded-xl text-xs font-medium font-mono transition-all flex items-center gap-2 ${
              activeTab === 'discharge'
                ? 'bg-[#174C40] text-white shadow-xs'
                : 'text-[#4A5350] hover:bg-[#F0F2F1]'
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Discharge Financial Clearance ({dischargeClearances.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2.5 rounded-xl text-xs font-medium font-mono transition-all flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'bg-[#174C40] text-white shadow-xs'
                : 'text-[#4A5350] hover:bg-[#F0F2F1]'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Payments & Cash Register ({payments.length})</span>
          </button>
        </div>
      </div>

      {/* 5. TAB CONTENT */}

      {/* TAB 1: Invoices & Ledger */}
      {activeTab === 'invoices' && (
        <section className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E8E6] p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#77817C]" />
              <input
                type="text"
                placeholder="Search patient, bill number, or invoice ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#D5D9D7] focus:outline-none focus:ring-1 focus:ring-[#174C40] font-mono bg-[#FAFAF7]"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#77817C]">
                <span>Status:</span>
                <select
                  value={invoiceStatusFilter}
                  onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                  className="rounded-xl border border-[#D5D9D7] px-2.5 py-1.5 bg-[#FAFAF7]"
                >
                  <option value="all">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-mono text-[#77817C]">
                <span>Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-xl border border-[#D5D9D7] px-2.5 py-1.5 bg-[#FAFAF7]"
                >
                  <option value="all">All Categories</option>
                  <option value="Inpatient (IPD)">Inpatient (IPD)</option>
                  <option value="Outpatient (OPD)">Outpatient (OPD)</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Diagnostics">Diagnostics</option>
                </select>
              </div>
            </div>
          </div>

          {/* Invoices List */}
          {loading ? (
            <div className="rounded-2xl border border-[#E5E8E6] bg-white p-12 text-center text-xs font-mono text-[#77817C] animate-pulse">
              Querying Hospital Financial Ledger & Accounts Receivable...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D5D9D7] bg-white p-12 text-center text-xs font-mono text-[#77817C]">
              No invoices match the selected criteria.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map(inv => {
                const isPending = inv.status === 'Pending' || inv.status === 'Partial';
                const isExpanded = expandedInvoiceId === inv.id;
                let itemsList: InvoiceItem[] = [];
                try {
                  itemsList = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items;
                } catch {
                  itemsList = [];
                }

                return (
                  <div
                    key={inv.id}
                    className={`rounded-2xl border bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-[#174C40]/40 ${
                      isPending ? 'border-amber-300 bg-amber-50/10' : 'border-[#E5E8E6]'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left Details */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-serif font-semibold text-sm sm:text-base text-[#1F2421]">
                            {inv.patient_name}
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#E5E8E6] text-[#4A5350]">
                            UHID: {inv.patient_id}
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#174C40]/10 text-[#174C40] font-semibold">
                            {inv.bill_number}
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded-lg border border-[#D5D9D7] text-[#4A5350]">
                            {inv.category}
                          </span>

                          {inv.status === 'Paid' ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 font-semibold">
                              <CheckCircle2 className="h-3 w-3" /> Fully Settled
                            </span>
                          ) : inv.status === 'Partial' ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1 font-semibold">
                              <Clock className="h-3 w-3" /> Part-Paid
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1 font-semibold">
                              <Clock className="h-3 w-3" /> Payment Pending
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-mono text-[#77817C] flex items-center gap-4 flex-wrap">
                          <span>Total Billed: <strong className="text-[#1F2421]">${Number(inv.total_amount).toFixed(2)}</strong></span>
                          <span>Paid: <strong className="text-emerald-700">${Number(inv.paid_amount).toFixed(2)}</strong></span>
                          <span>Balance: <strong className={Number(inv.outstanding_balance) > 0 ? 'text-rose-600' : 'text-emerald-700'}>${Number(inv.outstanding_balance).toFixed(2)}</strong></span>
                          <span>Due: {new Date(inv.due_date).toLocaleDateString()}</span>
                        </div>

                        {inv.notes && (
                          <p className="text-xs text-[#4A5350] italic pt-0.5">
                            &quot;{inv.notes}&quot;
                          </p>
                        )}
                      </div>

                      {/* Right Actions */}
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <button
                          onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-mono bg-[#FAFAF7] hover:bg-[#E5E8E6] text-[#4A5350] border border-[#D5D9D7] transition-colors"
                        >
                          {isExpanded ? 'Hide Line Items' : `View ${itemsList.length} Items`}
                        </button>

                        {isPending && (
                          <button
                            onClick={() => openPayment(inv)}
                            className="px-4 py-2 rounded-xl text-xs font-mono font-medium bg-[#174C40] hover:bg-[#123830] text-white transition-colors flex items-center gap-1.5 shadow-xs"
                          >
                            <CreditCard className="h-3.5 w-3.5 text-emerald-300" />
                            <span>Collect Payment</span>
                          </button>
                        )}

                        {!isPending && (
                          <div className="px-3 py-1.5 rounded-xl text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Zero Dues</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Collapsible Itemized Line Items */}
                    {isExpanded && (
                      <div className="mt-4 pt-3 border-t border-[#E5E8E6] space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs font-mono text-[#77817C] uppercase">
                          <span>Itemized Clinical Charges</span>
                          <span>Billed By: {inv.created_by}</span>
                        </div>
                        <div className="bg-[#FAFAF7] rounded-xl border border-[#E5E8E6] overflow-hidden">
                          <table className="w-full text-left text-xs font-mono">
                            <thead>
                              <tr className="bg-[#F0F2F1] border-b border-[#E5E8E6] text-[11px] text-[#4A5350]">
                                <th className="p-2.5">Service / Charge Description</th>
                                <th className="p-2.5 w-24">Category</th>
                                <th className="p-2.5 w-24">Rate</th>
                                <th className="p-2.5 w-16 text-center">Qty</th>
                                <th className="p-2.5 w-28 text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E8E6]">
                              {itemsList.map((item, idx) => (
                                <tr key={idx} className="hover:bg-white">
                                  <td className="p-2.5 font-semibold text-[#1F2421]">{item.item}</td>
                                  <td className="p-2.5 text-[#4A5350]">{item.category}</td>
                                  <td className="p-2.5 text-[#4A5350]">${Number(item.unit_price).toFixed(2)}</td>
                                  <td className="p-2.5 text-center text-[#4A5350]">{item.qty}</td>
                                  <td className="p-2.5 text-right font-bold text-[#1F2421]">${Number(item.total).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: Cashless Insurance & TPA Pre-Auth Desk */}
      {activeTab === 'tpa' && (
        <section className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E8E6] p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <h2 className="text-sm sm:text-base font-serif font-semibold text-[#1F2421] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#174C40]" />
                Cashless Third-Party Administrator (TPA) & Insurance Claims
              </h2>
              <p className="text-xs text-[#77817C] font-mono mt-0.5">
                Pre-authorization desk for empaneled cashless insurers (StarHealth, MediAssist, ICICI Lombard).
              </p>
            </div>

            <button
              onClick={() => setShowClaimModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-[#174C40] hover:bg-[#123830] text-white transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-300" />
              <span>Raise Pre-Auth Claim</span>
            </button>
          </div>

          <div className="border border-[#E5E8E6] rounded-2xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F0F2F1] border-b border-[#E5E8E6] font-mono text-[11px] text-[#4A5350]">
                  <th className="p-3">Claim ID / Patient</th>
                  <th className="p-3">TPA Insurer</th>
                  <th className="p-3">Policy & Pre-Auth No.</th>
                  <th className="p-3">Claimed Amount</th>
                  <th className="p-3">Approved Limit</th>
                  <th className="p-3">Claim Status</th>
                  <th className="p-3 w-32 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E8E6]">
                {claims.map(claim => {
                  const isUnderReview = claim.status === 'Under Review' || claim.status === 'Query Raised';

                  return (
                    <tr key={claim.id} className="hover:bg-[#FAFAF7]">
                      <td className="p-3 font-mono">
                        <div className="font-semibold text-[#1F2421]">{claim.patient_name}</div>
                        <div className="text-[10px] text-[#77817C]">{claim.id} • {claim.patient_id}</div>
                      </td>
                      <td className="p-3 font-semibold text-[#1F2421]">{claim.provider_name}</td>
                      <td className="p-3 font-mono text-[#4A5350]">
                        <div>{claim.policy_number}</div>
                        <div className="text-[10px] text-emerald-700 font-bold">{claim.pre_auth_number}</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-[#1F2421]">${Number(claim.claimed_amount).toFixed(2)}</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">${Number(claim.approved_amount).toFixed(2)}</td>
                      <td className="p-3 font-mono">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          claim.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : claim.status === 'Under Review'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {claim.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {isUnderReview && (
                          <button
                            onClick={() => handleApproveClaim(claim.id, Number(claim.claimed_amount))}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                          >
                            Approve Pre-Auth
                          </button>
                        )}
                        {!isUnderReview && (
                          <span className="text-[11px] font-mono text-emerald-700 flex items-center justify-end gap-1">
                            <Check className="h-3 w-3" /> Cashless Active
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: Discharge Financial Clearance Desk */}
      {activeTab === 'discharge' && (
        <section className="bg-white rounded-3xl border border-[#E5E8E6] p-6 shadow-xs space-y-4">
          <div className="border-b border-[#E5E8E6] pb-3">
            <h2 className="text-base font-serif font-semibold text-[#1F2421] flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[#174C40]" />
              Inpatient Discharge Financial Settlement Desk
            </h2>
            <p className="text-xs text-[#77817C] font-mono mt-0.5">
              Review admitted ward patients, reconcile pharmacy & laboratory orders, apply cashless authorizations, and issue discharge clearance slips.
            </p>
          </div>

          <div className="border border-[#E5E8E6] rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F0F2F1] border-b border-[#E5E8E6] font-mono text-[11px] text-[#4A5350]">
                  <th className="p-3">Patient / Admission</th>
                  <th className="p-3">Ward / Bed</th>
                  <th className="p-3">Admitting Physician</th>
                  <th className="p-3">Total Billed</th>
                  <th className="p-3">Insurance / Paid</th>
                  <th className="p-3">Outstanding Due</th>
                  <th className="p-3 w-36 text-right">Clearance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E8E6]">
                {dischargeClearances.map(item => {
                  const hasDue = Number(item.outstanding_balance) > 0;

                  return (
                    <tr key={item.admission_id} className="hover:bg-[#FAFAF7]">
                      <td className="p-3 font-mono">
                        <div className="font-semibold text-[#1F2421]">{item.patient_name}</div>
                        <div className="text-[10px] text-[#77817C]">{item.admission_id} • {item.diagnosis}</div>
                      </td>
                      <td className="p-3 font-mono text-[#4A5350]">
                        <div>{item.ward} ({item.bed_label})</div>
                        <div className="text-[10px] text-[#77817C]">{item.room}</div>
                      </td>
                      <td className="p-3 font-mono text-[#1F2421]">{item.admitting_doctor}</td>
                      <td className="p-3 font-mono font-bold text-[#1F2421]">${Number(item.total_amount).toFixed(2)}</td>
                      <td className="p-3 font-mono text-emerald-700">
                        <div>Paid: ${Number(item.paid_amount).toFixed(2)}</div>
                        {item.tpa_approved_amount && (
                          <div className="text-[10px] text-blue-700 font-semibold">TPA: ${Number(item.tpa_approved_amount).toFixed(2)}</div>
                        )}
                      </td>
                      <td className="p-3 font-mono font-bold">
                        <span className={hasDue ? 'text-rose-600' : 'text-emerald-700'}>
                          ${Number(item.outstanding_balance).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {hasDue ? (
                          <button
                            onClick={() => {
                              const found = invoices.find(i => i.id === item.invoice_id);
                              if (found) openPayment(found);
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100 transition-colors"
                          >
                            Collect Balance
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                            ✓ Cleared for Discharge
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 4: Payments & Cash Counter Receipts Log */}
      {activeTab === 'payments' && (
        <section className="bg-white rounded-3xl border border-[#E5E8E6] p-6 shadow-xs space-y-4">
          <div className="border-b border-[#E5E8E6] pb-3">
            <h2 className="text-base font-serif font-semibold text-[#1F2421] flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#174C40]" />
              Hospital Payments & Cash Register Audit Trail
            </h2>
            <p className="text-xs text-[#77817C] font-mono mt-0.5">
              Live transaction ledger across POS credit cards, UPI QR, cash counter, and third-party payer settlements.
            </p>
          </div>

          <div className="border border-[#E5E8E6] rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F0F2F1] border-b border-[#E5E8E6] font-mono text-[11px] text-[#4A5350]">
                  <th className="p-3">Transaction ID / Time</th>
                  <th className="p-3">Patient & Invoice</th>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3">Reference / Txn No.</th>
                  <th className="p-3">Amount Received</th>
                  <th className="p-3">Cashier / Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E8E6]">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-[#FAFAF7]">
                    <td className="p-3 font-mono">
                      <div className="font-semibold text-[#1F2421]">{p.id}</div>
                      <div className="text-[10px] text-[#77817C]">{new Date(p.paid_at).toLocaleString()}</div>
                    </td>
                    <td className="p-3 font-mono">
                      <div className="font-semibold text-[#1F2421]">{p.patient_name}</div>
                      <div className="text-[10px] text-[#77817C]">Inv: {p.invoice_id}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-emerald-50 text-[#174C40] border border-emerald-200">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[#4A5350]">{p.reference_number}</td>
                    <td className="p-3 font-mono font-bold text-emerald-700 text-sm">
                      ${Number(p.amount).toFixed(2)}
                    </td>
                    <td className="p-3 font-mono text-[#4A5350]">{p.received_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 6. MODALS */}

      {/* Collect Payment Modal */}
      {showPayModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#E5E8E6] p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E8E6] pb-3">
              <h3 className="font-serif font-semibold text-base text-[#1F2421] flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#174C40]" />
                Collect Payment: {selectedInvoice.bill_number}
              </h3>
              <button onClick={() => setShowPayModal(false)} className="text-[#77817C] hover:text-[#1F2421]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs font-mono">
              <div className="bg-[#FAFAF7] p-3 rounded-xl border border-[#E5E8E6] grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-[#77817C] uppercase block">Patient</span>
                  <strong className="text-[#1F2421]">{selectedInvoice.patient_name}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#77817C] uppercase block">Outstanding Due</span>
                  <strong className="text-rose-600 font-bold">${Number(selectedInvoice.outstanding_balance).toFixed(2)}</strong>
                </div>
              </div>

              <div>
                <label className="block text-[#4A5350] mb-1 font-semibold">Payment Amount to Collect ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7] font-bold text-sm text-[#1F2421]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4A5350] mb-1">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                  >
                    <option value="Credit Card (POS)">Credit Card (POS Terminal)</option>
                    <option value="UPI / QR">UPI / Static QR Code</option>
                    <option value="Cash Counter">Cash Counter</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="TPA Cashless Settlement">TPA Cashless Settlement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#4A5350] mb-1">Reference / Transaction No.</label>
                  <input
                    type="text"
                    required
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#4A5350] mb-1">Cashier Notes</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 rounded-xl text-[#77817C] hover:bg-[#E5E8E6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#174C40] text-white hover:bg-[#123830] font-medium shadow-xs"
                >
                  Record Payment & Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Invoice Modal */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#E5E8E6] p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E5E8E6] pb-3">
              <h3 className="font-serif font-semibold text-base text-[#1F2421] flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#174C40]" />
                Generate New Itemized Hospital Bill
              </h3>
              <button onClick={() => setShowGenModal(false)} className="text-[#77817C] hover:text-[#1F2421]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateInvoice} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4A5350] mb-1">Patient Name</label>
                  <input
                    type="text"
                    required
                    value={genPatientName}
                    onChange={(e) => setGenPatientName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                  />
                </div>
                <div>
                  <label className="block text-[#4A5350] mb-1">Patient UHID / ID</label>
                  <input
                    type="text"
                    required
                    value={genPatientId}
                    onChange={(e) => setGenPatientId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#4A5350] mb-1">Billing Category</label>
                  <select
                    value={genCategory}
                    onChange={(e) => setGenCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                  >
                    <option value="Outpatient (OPD)">Outpatient (OPD)</option>
                    <option value="Inpatient (IPD)">Inpatient (IPD)</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Diagnostics">Diagnostics</option>
                    <option value="Emergency (ER)">Emergency (ER)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#4A5350] mb-1">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={genDiscountPct}
                    onChange={(e) => setGenDiscountPct(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                  />
                </div>
                <div>
                  <label className="block text-[#4A5350] mb-1">Applicable Tax (%)</label>
                  <input
                    type="number"
                    min="0"
                    value={genTaxPct}
                    onChange={(e) => setGenTaxPct(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#4A5350] uppercase text-[11px]">Itemized Clinical Charges</span>
                  <button
                    type="button"
                    onClick={addGenLineItem}
                    className="px-2 py-1 rounded-lg text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300"
                  >
                    + Add Charge Item
                  </button>
                </div>

                <div className="space-y-2">
                  {genItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-[#FAFAF7] p-2 rounded-xl border border-[#E5E8E6]">
                      <input
                        type="text"
                        required
                        placeholder="Description"
                        value={item.item}
                        onChange={(e) => updateGenItem(idx, 'item', e.target.value)}
                        className="flex-1 p-1.5 rounded-lg border border-[#D5D9D7] bg-white text-xs"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Rate"
                        value={item.unit_price}
                        onChange={(e) => updateGenItem(idx, 'unit_price', Number(e.target.value))}
                        className="w-20 p-1.5 rounded-lg border border-[#D5D9D7] bg-white text-xs"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.qty}
                        onChange={(e) => updateGenItem(idx, 'qty', Number(e.target.value))}
                        className="w-14 p-1.5 rounded-lg border border-[#D5D9D7] bg-white text-xs"
                      />
                      <span className="w-20 text-right font-bold text-[#1F2421]">
                        ${item.total.toFixed(2)}
                      </span>
                      {genItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeGenItem(idx)}
                          className="text-rose-600 hover:text-rose-800 px-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#4A5350] mb-1">Billing Remarks / Clinical Order Reference</label>
                <input
                  type="text"
                  value={genNotes}
                  onChange={(e) => setGenNotes(e.target.value)}
                  className="w-full p-2 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="px-4 py-2 rounded-xl text-[#77817C] hover:bg-[#E5E8E6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#174C40] text-white hover:bg-[#123830]"
                >
                  Generate Official Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pre-Auth Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#E5E8E6] p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E8E6] pb-3">
              <h3 className="font-serif font-semibold text-base text-[#1F2421] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#174C40]" />
                Submit Cashless TPA Pre-Authorization Request
              </h3>
              <button onClick={() => setShowClaimModal(false)} className="text-[#77817C] hover:text-[#1F2421]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleClaimSubmit} className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4A5350] mb-1">Patient Name</label>
                  <input
                    type="text"
                    required
                    value={claimPatientName}
                    onChange={(e) => setClaimPatientName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                  />
                </div>
                <div>
                  <label className="block text-[#4A5350] mb-1">Patient UHID</label>
                  <input
                    type="text"
                    required
                    value={claimPatientId}
                    onChange={(e) => setClaimPatientId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#4A5350] mb-1">Empaneled TPA / Insurer</label>
                <select
                  value={claimProvider}
                  onChange={(e) => setClaimProvider(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                >
                  <option value="StarHealth Shield TPA">StarHealth Shield TPA</option>
                  <option value="MediAssist Prime Care">MediAssist Prime Care</option>
                  <option value="ICICI Lombard Health Care">ICICI Lombard Health Care</option>
                  <option value="HDFC ERGO General Insurance">HDFC ERGO General Insurance</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4A5350] mb-1">Policy / Card Number</label>
                  <input
                    type="text"
                    required
                    value={claimPolicy}
                    onChange={(e) => setClaimPolicy(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                  />
                </div>
                <div>
                  <label className="block text-[#4A5350] mb-1">Estimated Claim Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7] font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="px-4 py-2 rounded-xl text-[#77817C] hover:bg-[#E5E8E6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#174C40] text-white hover:bg-[#123830]"
                >
                  Submit Pre-Auth Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
