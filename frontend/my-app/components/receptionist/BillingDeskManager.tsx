'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CreditCard,
  DollarSign,
  Receipt,
  Search,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  RotateCcw,
  User,
  Phone,
  Building2,
  Stethoscope,
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  Filter,
} from 'lucide-react';
import { getStaffSession, type StaffUser } from '@/lib/staff-auth';
import PaymentReceiptModal, { type ReceiptData } from './PaymentReceiptModal';

interface PaymentItem {
  payment_id: string;
  visit_id: string;
  fee_type: string;
  amount: number | string;
  payment_method: string;
  payment_status: string;
  transaction_reference?: string;
  receipt_number?: string;
  notes?: string;
  received_by?: string;
  payment_date?: string;
  created_at: string;
  visit_date?: string;
  visit_type?: string;
  visit_status?: string;
  patient_id?: string;
  patient_name?: string;
  patient_phone?: string;
  patient_gender?: string;
  doctor_id?: number;
  doctor_name?: string;
  room_or_cabin?: string;
  department_id?: number;
  department_name?: string;
  token_display?: string;
  token_number?: number;
}

interface BillingSummary {
  total_collected_today: number;
  total_pending_today: number;
  total_refunded_today: number;
  invoices_count_today: number;
  paid_count_today: number;
  pending_count_today: number;
}

interface SuggestedFee {
  fee_type: string;
  amount: number;
  description: string;
  settled: boolean;
}

interface VisitBillingLookup {
  visit: any;
  billing: {
    payments: any[];
    totalBilled: number;
    totalPaid: number;
    totalPending: number;
    isFullySettled: boolean;
    suggestedItems: SuggestedFee[];
    calculatedPayableTotal: number;
  };
}

export default function BillingDeskManager() {
  const [session, setSession] = useState<StaffUser | null>(null);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [summary, setSummary] = useState<BillingSummary>({
    total_collected_today: 0,
    total_pending_today: 0,
    total_refunded_today: 0,
    invoices_count_today: 0,
    paid_count_today: 0,
    pending_count_today: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'pending' | 'paid' | 'refunded'>('today');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFeeType, setSelectedFeeType] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');

  // Collect Payment Modal state
  const [isCollectModalOpen, setIsCollectModalOpen] = useState<boolean>(false);
  const [collectVisitIdInput, setCollectVisitIdInput] = useState<string>('');
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookedUpVisit, setLookedUpVisit] = useState<VisitBillingLookup | null>(null);

  // Payment Form fields inside Collect Modal
  const [selectedFeeToPay, setSelectedFeeToPay] = useState<string>('Consultation Fee');
  const [paymentAmount, setPaymentAmount] = useState<number | string>(50.00);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);

  // Printable Receipt Modal state
  const [activeReceipt, setActiveReceipt] = useState<ReceiptData | null>(null);

  // Refund Modal state
  const [refundTarget, setRefundTarget] = useState<PaymentItem | null>(null);
  const [refundReason, setRefundReason] = useState<string>('Patient consultation cancelled / fee reversed');
  const [submittingRefund, setSubmittingRefund] = useState<boolean>(false);

  // Load Session
  useEffect(() => {
    setSession(getStaffSession());
  }, []);

  // Fetch Billing Transactions
  const fetchBillingData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setRefreshing(true);

    try {
      const params = new URLSearchParams();
      if (activeTab === 'today') {
        params.append('date', 'today');
      } else if (activeTab === 'pending') {
        params.append('status', 'Pending');
      } else if (activeTab === 'paid') {
        params.append('status', 'Paid');
      } else if (activeTab === 'refunded') {
        params.append('status', 'Refunded');
      } else {
        params.append('date', 'all');
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (selectedFeeType !== 'all') {
        params.append('fee_type', selectedFeeType);
      }
      if (selectedMethod !== 'all') {
        params.append('payment_method', selectedMethod);
      }

      const res = await fetch(`/api/v1/reception/billing?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load billing records (HTTP ${res.status})`);
      }

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPayments(json.data);
        if (json.summary) {
          setSummary(json.summary);
        }
      }
    } catch (err: any) {
      console.error('Fetch billing error:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to load billing transactions.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, searchQuery, selectedFeeType, selectedMethod]);

  useEffect(() => {
    fetchBillingData(false);
  }, [fetchBillingData]);

  // Auto-dismiss feedback after 4s
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(t);
  }, [feedback]);

  // Handle Visit Lookup in Collect Modal
  const handleLookupVisit = async (visitIdToLookup?: string) => {
    const vId = (visitIdToLookup || collectVisitIdInput).trim();
    if (!vId) return;

    setLookupLoading(true);
    setLookedUpVisit(null);
    setFeedback(null);

    try {
      const res = await fetch(`/api/v1/reception/billing/visits/${encodeURIComponent(vId)}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Visit record not found.');
      }

      setLookedUpVisit(json);

      // Pre-select first un-settled suggested fee
      if (json.billing?.suggestedItems && json.billing.suggestedItems.length > 0) {
        const first = json.billing.suggestedItems[0];
        setSelectedFeeToPay(first.fee_type);
        setPaymentAmount(first.amount);
      } else {
        setSelectedFeeToPay('Consultation Fee');
        setPaymentAmount(50.00);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Visit not found.' });
    } finally {
      setLookupLoading(false);
    }
  };

  // Handle Submit Payment Collection
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookedUpVisit?.visit?.visit_id) {
      setFeedback({ type: 'error', message: 'Please look up a valid visit record first.' });
      return;
    }

    const numAmt = Number(paymentAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setFeedback({ type: 'error', message: 'Payment amount must be greater than zero.' });
      return;
    }

    if (paymentMethod !== 'Cash' && !transactionRef.trim()) {
      setFeedback({
        type: 'error',
        message: `Please enter transaction reference / auth code for ${paymentMethod} payment.`,
      });
      return;
    }

    setSubmittingPayment(true);
    setFeedback(null);

    try {
      const payload = {
        visit_id: lookedUpVisit.visit.visit_id,
        fee_type: selectedFeeToPay,
        amount: numAmt,
        payment_method: paymentMethod,
        transaction_reference: transactionRef.trim(),
        notes: paymentNotes.trim(),
        staff_name: session?.name || 'Reception Cashier',
        staff_role: session?.role || 'receptionist',
      };

      const res = await fetch('/api/v1/reception/billing/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to collect payment.');
      }

      setFeedback({
        type: 'success',
        message: `Payment of $${numAmt.toFixed(2)} settled! Receipt: ${json.receipt?.receipt_number}`,
      });

      // Close collect modal & show receipt
      setIsCollectModalOpen(false);
      setLookedUpVisit(null);
      setCollectVisitIdInput('');
      setTransactionRef('');
      setPaymentNotes('');

      if (json.receipt) {
        setActiveReceipt(json.receipt);
      }

      fetchBillingData(true);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Payment submission failed.' });
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Handle Submit Refund
  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTarget) return;

    setSubmittingRefund(true);
    setFeedback(null);

    try {
      const payload = {
        reason: refundReason.trim(),
        staff_name: session?.name || 'Reception Cashier',
        staff_role: session?.role || 'receptionist',
      };

      const res = await fetch(`/api/v1/reception/billing/payments/${refundTarget.payment_id}/refund`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to refund payment.');
      }

      setFeedback({
        type: 'success',
        message: `Payment ${refundTarget.receipt_number || refundTarget.payment_id} refunded successfully.`,
      });

      setRefundTarget(null);
      fetchBillingData(true);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Refund failed.' });
    } finally {
      setSubmittingRefund(false);
    }
  };

  // View Receipt helper
  const handleViewReceipt = (p: PaymentItem) => {
    const receiptData: ReceiptData = {
      receipt_number: p.receipt_number || `REC-${p.payment_id}`,
      payment_id: p.payment_id,
      visit_id: p.visit_id,
      patient_id: p.patient_id || 'PAT-001',
      patient_name: p.patient_name || 'Patient',
      patient_phone: p.patient_phone,
      patient_gender: p.patient_gender,
      fee_type: p.fee_type,
      amount: p.amount,
      payment_method: p.payment_method,
      payment_status: p.payment_status,
      transaction_reference: p.transaction_reference,
      received_by: p.received_by || 'Reception Staff',
      payment_date: p.payment_date || p.created_at,
      doctor_name: p.doctor_name,
      room_or_cabin: p.room_or_cabin,
      department_name: p.department_name,
      token_display: p.token_display,
      notes: p.notes,
    };
    setActiveReceipt(receiptData);
  };

  return (
    <div className="w-full space-y-6">
      {/* ========================================================
          1. HEADER & KPI CASHIER REVENUE SUMMARY
      ======================================================== */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#F0F2F0]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                <CreditCard className="h-4 w-4" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2421]">
                Reception Billing &amp; Cashier Desk
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-[#77817C]">
              Collect registration fees, doctor consultation charges, process UPI/Card/Cash, and issue verified receipts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fetchBillingData(false)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E5E8E6] bg-white hover:bg-[#FAFAF7] text-[#1F2421] text-xs font-medium shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[#174C40] ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsCollectModalOpen(true);
                setLookedUpVisit(null);
                setCollectVisitIdInput('');
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Collect Fee / Payment</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            className={`mt-4 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-medium transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-xs opacity-60 hover:opacity-100 cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Live Revenue Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-6">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <span className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider block">
              Total Collected Today
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-950 mt-1 block">
              ${summary.total_collected_today.toFixed(2)}
            </span>
            <span className="text-[10px] text-emerald-700 mt-0.5 block font-mono">
              {summary.paid_count_today} settled transactions
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100">
            <span className="text-[11px] font-medium text-amber-800 uppercase tracking-wider block">
              Pending Invoices
            </span>
            <span className="text-2xl font-bold font-mono text-amber-950 mt-1 block">
              ${summary.total_pending_today.toFixed(2)}
            </span>
            <span className="text-[10px] text-amber-700 mt-0.5 block font-mono">
              {summary.pending_count_today} awaiting payment
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6]">
            <span className="text-[11px] font-medium text-[#77817C] uppercase tracking-wider block">
              Invoices Issued Today
            </span>
            <span className="text-2xl font-bold text-[#1F2421] mt-1 block font-mono">
              {summary.invoices_count_today}
            </span>
            <span className="text-[10px] text-[#77817C] mt-0.5 block">Total billing records</span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100">
            <span className="text-[11px] font-medium text-rose-800 uppercase tracking-wider block">
              Refunds Processed
            </span>
            <span className="text-2xl font-bold font-mono text-rose-950 mt-1 block">
              ${summary.total_refunded_today.toFixed(2)}
            </span>
            <span className="text-[10px] text-rose-700 mt-0.5 block">Reversed payments</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. FILTER & SEARCH CONTROL BAR
      ======================================================== */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-5 sm:p-6 shadow-xs space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#F0F2F0]">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] text-xs font-semibold">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'today'
                  ? 'bg-white text-[#174C40] shadow-xs border border-[#E5E8E6]'
                  : 'text-[#77817C] hover:text-[#1F2421]'
              }`}
            >
              Today&apos;s Revenue
            </button>

            <button
              onClick={() => setActiveTab('paid')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'paid'
                  ? 'bg-white text-emerald-800 shadow-xs border border-[#E5E8E6]'
                  : 'text-[#77817C] hover:text-[#1F2421]'
              }`}
            >
              Paid / Settled
            </button>

            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-white text-amber-800 shadow-xs border border-[#E5E8E6]'
                  : 'text-[#77817C] hover:text-[#1F2421]'
              }`}
            >
              Pending ({summary.pending_count_today})
            </button>

            <button
              onClick={() => setActiveTab('refunded')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'refunded'
                  ? 'bg-white text-rose-800 shadow-xs border border-[#E5E8E6]'
                  : 'text-[#77817C] hover:text-[#1F2421]'
              }`}
            >
              Refunded
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-[#174C40] shadow-xs border border-[#E5E8E6]'
                  : 'text-[#77817C] hover:text-[#1F2421]'
              }`}
            >
              All Records
            </button>
          </div>

          <div className="text-xs text-[#77817C]">
            Showing <span className="font-semibold text-[#1F2421]">{payments.length}</span> payment invoices
          </div>
        </div>

        {/* Input filters row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77817C]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Receipt # (REC-...), Patient Name, Mobile, or Visit ID..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E5E8E6] bg-[#FAFAF7] text-xs text-[#1F2421] focus:outline-none focus:border-[#174C40] focus:bg-white transition-colors"
            />
          </div>

          <div>
            <select
              value={selectedFeeType}
              onChange={(e) => setSelectedFeeType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E5E8E6] bg-[#FAFAF7] text-xs text-[#1F2421] focus:outline-none focus:border-[#174C40] focus:bg-white cursor-pointer"
            >
              <option value="all">All Fee Types</option>
              <option value="Consultation Fee">Consultation Fee</option>
              <option value="Registration Fee">Registration Fee</option>
              <option value="Follow-up Fee">Follow-up Fee</option>
            </select>
          </div>

          <div>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E5E8E6] bg-[#FAFAF7] text-xs text-[#1F2421] focus:outline-none focus:border-[#174C40] focus:bg-white cursor-pointer"
            >
              <option value="all">All Payment Methods</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. PAYMENTS & INVOICES TABLE
      ======================================================== */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-[#77817C] animate-pulse">
            Loading billing transactions...
          </div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Receipt className="h-10 w-10 text-[#77817C] mx-auto opacity-40" />
            <h3 className="text-sm font-semibold text-[#1F2421]">No Payment Records Found</h3>
            <p className="text-xs text-[#77817C] max-w-sm mx-auto">
              No transactions match the selected filters. Click &ldquo;Collect Fee / Payment&rdquo; to process an encounter bill.
            </p>
            <button
              onClick={() => setIsCollectModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#174C40] text-white text-xs font-medium cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Collect Payment</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1F2421]">
              <thead className="bg-[#FAFAF7] border-b border-[#E5E8E6] text-[11px] font-semibold text-[#77817C] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Receipt #</th>
                  <th className="py-3.5 px-4">Date &amp; Time</th>
                  <th className="py-3.5 px-4">Patient &amp; Visit</th>
                  <th className="py-3.5 px-4">Fee Breakdown</th>
                  <th className="py-3.5 px-4">Amount &amp; Method</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F0]">
                {payments.map((p) => {
                  const isPaid = p.payment_status === 'Paid' || p.payment_status === 'Completed';
                  const isRefunded = p.payment_status === 'Refunded';
                  const isPending = p.payment_status === 'Pending';
                  const numAmt = Number(p.amount) || 0;

                  return (
                    <tr key={p.payment_id} className="hover:bg-[#FAFAF7]/70 transition-colors">
                      {/* 1. Receipt */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-xs text-[#174C40]">
                          {p.receipt_number || p.payment_id}
                        </div>
                        <span className="text-[10px] text-[#77817C] block font-mono">
                          ID: {p.payment_id}
                        </span>
                      </td>

                      {/* 2. Date */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#77817C]">
                        <div className="font-medium text-[#1F2421]">
                          {new Date(p.payment_date || p.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <div>
                          {new Date(p.payment_date || p.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* 3. Patient & Visit */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#1F2421]">
                          {p.patient_name || 'Patient'}
                        </div>
                        <div className="text-[11px] text-[#77817C] flex items-center gap-2 mt-0.5">
                          <span className="font-mono">{p.visit_id}</span>
                          {p.token_display && (
                            <span className="font-mono font-bold text-[#174C40] bg-[#E6EFE9] px-1.5 py-0.2 rounded text-[10px]">
                              {p.token_display}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Fee Type */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-[#1F2421] block">{p.fee_type}</span>
                        <span className="text-[10px] text-[#77817C] block">
                          Dr. {p.doctor_name || 'Hospital Clinician'}
                        </span>
                      </td>

                      {/* 5. Amount & Method */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-sm text-[#1F2421]">
                          ${numAmt.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-[#77817C] font-mono flex items-center gap-1 mt-0.5">
                          <span>{p.payment_method}</span>
                          {p.transaction_reference && (
                            <span className="truncate max-w-[90px]" title={p.transaction_reference}>
                              • {p.transaction_reference}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. Status */}
                      <td className="py-3.5 px-4">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            Paid
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                            <Clock className="h-3 w-3 text-amber-600" />
                            Pending
                          </span>
                        ) : isRefunded ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-semibold">
                            <RotateCcw className="h-3 w-3 text-rose-600" />
                            Refunded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-semibold">
                            {p.payment_status}
                          </span>
                        )}
                      </td>

                      {/* 7. Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPaid && (
                            <button
                              type="button"
                              onClick={() => handleViewReceipt(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 text-xs font-medium transition-colors cursor-pointer"
                              title="Print / View Official Receipt"
                            >
                              <Printer className="h-3 w-3" />
                              <span>Receipt</span>
                            </button>
                          )}

                          {isPending && (
                            <button
                              type="button"
                              onClick={() => {
                                setCollectVisitIdInput(p.visit_id);
                                setIsCollectModalOpen(true);
                                handleLookupVisit(p.visit_id);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#174C40] text-white hover:bg-[#123B32] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                              title="Settle this pending payment"
                            >
                              <DollarSign className="h-3 w-3" />
                              <span>Collect</span>
                            </button>
                          )}

                          {isPaid && (
                            <button
                              type="button"
                              onClick={() => {
                                setRefundTarget(p);
                                setRefundReason('Patient requested refund');
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs font-medium transition-colors cursor-pointer"
                              title="Process Refund"
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span>Refund</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          4. MODAL: COLLECT PAYMENT
      ======================================================== */}
      {isCollectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl border border-[#E5E8E6] shadow-xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0F2F0]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <CreditCard className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-[#1F2421]">Collect Hospital Payment</h2>
                  <p className="text-xs text-[#77817C]">Verify encounter visit and process Cash, UPI, or Card fee.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCollectModalOpen(false)}
                className="p-1.5 rounded-lg text-[#77817C] hover:text-[#1F2421] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Visit ID Lookup Step */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#1F2421] block">
                Encounter Visit ID <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={collectVisitIdInput}
                  onChange={(e) => setCollectVisitIdInput(e.target.value)}
                  placeholder="e.g. VST-2026-XXXXXX"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-[#E5E8E6] text-xs font-mono uppercase focus:outline-none focus:border-[#174C40]"
                />
                <button
                  type="button"
                  onClick={() => handleLookupVisit()}
                  disabled={lookupLoading || !collectVisitIdInput.trim()}
                  className="px-4 py-2 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {lookupLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  <span>Verify Visit</span>
                </button>
              </div>
            </div>

            {/* Verified Visit Billing Details */}
            {lookedUpVisit && (
              <form onSubmit={handleSubmitPayment} className="space-y-4 pt-2 border-t border-[#F0F2F0]">
                {/* Patient Summary Card */}
                <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#1F2421] text-sm">
                      {lookedUpVisit.visit.patient_name}
                    </span>
                    <span className="font-mono text-[#174C40] font-semibold">
                      {lookedUpVisit.visit.patient_id}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#77817C] flex justify-between">
                    <span>
                      Dr. {lookedUpVisit.visit.doctor_name} ({lookedUpVisit.visit.department_name})
                    </span>
                    <span>Encounter: {lookedUpVisit.visit.visit_type}</span>
                  </div>
                </div>

                {/* Suggested Unsettled Items */}
                {lookedUpVisit.billing.suggestedItems.length > 0 ? (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-[#1F2421] block">
                      Recommended Payable Fees:
                    </span>
                    <div className="space-y-1.5">
                      {lookedUpVisit.billing.suggestedItems.map((item) => (
                        <div
                          key={item.fee_type}
                          onClick={() => {
                            setSelectedFeeToPay(item.fee_type);
                            setPaymentAmount(item.amount);
                          }}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            selectedFeeToPay === item.fee_type
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium'
                              : 'bg-white border-[#E5E8E6] hover:bg-[#FAFAF7]'
                          }`}
                        >
                          <div>
                            <span className="font-semibold block">{item.fee_type}</span>
                            <span className="text-[10px] text-[#77817C]">{item.description}</span>
                          </div>
                          <span className="font-mono font-bold text-sm text-[#174C40]">
                            ${item.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>All standard fees for this visit appear settled. You can still process add-on fees below.</span>
                  </div>
                )}

                {/* Fee Type & Amount Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#1F2421] block mb-1">Fee Type *</label>
                    <select
                      value={selectedFeeToPay}
                      onChange={(e) => {
                        const ft = e.target.value;
                        setSelectedFeeToPay(ft);
                        if (ft === 'Registration Fee') setPaymentAmount(25.00);
                        else if (ft === 'Follow-up Fee') setPaymentAmount(30.00);
                        else setPaymentAmount(50.00);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E8E6] bg-white text-xs cursor-pointer"
                    >
                      <option value="Consultation Fee">Consultation Fee ($50.00)</option>
                      <option value="Registration Fee">Registration Fee ($25.00)</option>
                      <option value="Follow-up Fee">Follow-up Fee ($30.00)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#1F2421] block mb-1">Payable Amount ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E8E6] bg-white text-xs font-mono font-bold text-[#174C40]"
                    />
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="text-xs font-semibold text-[#1F2421] block mb-1.5">
                    Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Cash', 'UPI', 'Card'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          paymentMethod === method
                            ? 'bg-[#174C40] text-white border-[#174C40] shadow-xs'
                            : 'bg-white border-[#E5E8E6] text-[#1F2421] hover:bg-[#FAFAF7]'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transaction Reference (if UPI or Card) */}
                {paymentMethod !== 'Cash' && (
                  <div>
                    <label className="text-xs font-semibold text-[#1F2421] block mb-1">
                      {paymentMethod === 'UPI' ? 'UPI Transaction Ref / VPA *' : 'Card Auth / Ref Number *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder={paymentMethod === 'UPI' ? 'e.g. UPI-1234567890' : 'e.g. AUTH-987654 (Last 4: 4321)'}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E8E6] bg-white text-xs font-mono"
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="text-xs font-semibold text-[#1F2421] block mb-1">Cashier Remarks (Optional)</label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="e.g. Patient paid exact cash, receipt handed over"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E8E6] bg-white text-xs"
                  />
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0F2F0]">
                  <button
                    type="button"
                    onClick={() => setIsCollectModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#E5E8E6] text-xs font-medium text-[#1F2421] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="px-5 py-2 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {submittingPayment ? 'Processing Payment...' : `Confirm & Issue Receipt ($${Number(paymentAmount || 0).toFixed(2)})`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          5. MODAL: REFUND CONFIRMATION
      ======================================================== */}
      {refundTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl border border-[#E5E8E6] shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <RotateCcw className="h-5 w-5" />
              <h3 className="font-bold text-base text-[#1F2421]">Process Payment Refund</h3>
            </div>

            <p className="text-xs text-[#77817C] leading-relaxed">
              Are you sure you want to refund payment{' '}
              <span className="font-mono font-bold text-[#1F2421]">{refundTarget.receipt_number || refundTarget.payment_id}</span> of{' '}
              <strong className="text-rose-700">${Number(refundTarget.amount).toFixed(2)}</strong> ({refundTarget.fee_type}) to{' '}
              <span className="font-semibold text-[#1F2421]">{refundTarget.patient_name}</span>?
            </p>

            <form onSubmit={handleSubmitRefund} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#1F2421] block mb-1">Reason for Refund *</label>
                <input
                  type="text"
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Doctor unavailable, patient cancellation, billing error"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E8E6] text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0F2F0]">
                <button
                  type="button"
                  onClick={() => setRefundTarget(null)}
                  className="px-4 py-2 rounded-xl border border-[#E5E8E6] text-xs font-medium text-[#1F2421] cursor-pointer"
                >
                  Keep Payment
                </button>
                <button
                  type="submit"
                  disabled={submittingRefund}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submittingRefund ? 'Refunding...' : 'Confirm Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          6. MODAL: PRINTABLE OFFICIAL RECEIPT
      ======================================================== */}
      {activeReceipt && (
        <PaymentReceiptModal
          receipt={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}
    </div>
  );
}
