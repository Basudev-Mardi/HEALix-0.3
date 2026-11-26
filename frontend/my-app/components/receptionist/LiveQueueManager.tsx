'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Clock,
  Stethoscope,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
  CircleDot,
  RefreshCw,
  Search,
  Megaphone,
  UserCheck,
  Siren,
  Filter,
  Layers,
  Radio,
  Timer,
  Check,
  X,
  Building2,
  Calendar,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { getStaffSession, type StaffUser } from '@/lib/staff-auth';
import PatientProfileModal from './PatientProfileModal';

export interface QueueTokenItem {
  token_id: string;
  token_display: string;
  token_number: number;
  status: 'Waiting' | 'Now Serving' | 'Consulting' | 'Completed' | 'Cancelled';
  priority: string;
  called_at: string | null;
  consultation_start_at: string | null;
  consultation_end_at: string | null;
  cancellation_reason: string | null;
  queue_date: string;
  created_at: string;
  updated_at: string;
  visit_id: string;
  visit_type: string;
  reason: string;
  patient_id: string;
  patient_code: string;
  patient_name: string;
  mobile: string;
  gender: string;
  dob: string;
  blood_group: string;
  allergies: string;
  doctor_id: number;
  doctor_name: string;
  doctor_cabin: string;
  specialty?: string;
  department_id: number;
  department_name: string;
  token_prefix: string;
  queue_position: number | null;
  estimated_wait_mins: number | null;
  age?: {
    years: number;
    months: number;
    formatted: string;
  } | null;
  elapsed_seconds?: number;
}

interface DepartmentSummary {
  department_id: number;
  department_name: string;
  department_slug: string;
  token_prefix: string;
  waiting_count: number;
  serving_count: number;
  completed_count: number;
  current_serving_token: string | null;
}

interface DoctorSummary {
  doctor_id: number;
  doctor_name: string;
  department_id: number;
  department_name: string;
  room_or_cabin: string;
  availability_status: string;
  waiting_count: number;
  current_serving_token: string | null;
}

interface QueueStats {
  totalToday: number;
  waitingCount: number;
  nowServingCount: number;
  consultingCount: number;
  completedCount: number;
  cancelledCount: number;
  emergencyWaitingCount: number;
  avgConsultationMins: number;
}

const AUTO_SYNC_SECONDS = 10;

export default function LiveQueueManager() {
  const [session, setSession] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Live telemetry & Auto-refresh state
  const [autoSync, setAutoSync] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(AUTO_SYNC_SECONDS);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Queue Data
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [nowServing, setNowServing] = useState<QueueTokenItem[]>([]);
  const [queue, setQueue] = useState<QueueTokenItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);

  // Filters
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [selectedDocId, setSelectedDocId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Actions
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [actionTargetToken, setActionTargetToken] = useState<QueueTokenItem | null>(null);
  const [actionType, setActionType] = useState<'cancel' | 'call' | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load Session
  useEffect(() => {
    setSession(getStaffSession());
  }, []);

  // Live Clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Live Queue Data
  const fetchLiveQueue = useCallback(async (isBackground = false) => {
    if (!isBackground) setRefreshing(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedDeptId !== 'all') params.set('department_id', selectedDeptId);
      if (selectedDocId !== 'all') params.set('doctor_id', selectedDocId);
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const url = `/api/v1/reception/queue/live?${params.toString()}`;
      let res: Response;
      try {
        res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
      } catch {
        res = await fetch(`http://localhost:5000${url}`, { headers: { Accept: 'application/json' }, cache: 'no-store' });
      }

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json && json.success) {
        setStats(json.stats);
        setNowServing(json.nowServing || []);
        setQueue(json.queue || []);
        setDepartments(json.departments || []);
        setDoctors(json.doctors || []);
      } else {
        throw new Error(json.error || 'Failed to parse live queue payload');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Live Queue API');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCountdown(AUTO_SYNC_SECONDS);
    }
  }, [selectedDeptId, selectedDocId, selectedStatus, searchQuery]);

  // Initial and reactive fetch on filter change
  useEffect(() => {
    fetchLiveQueue(false);
  }, [fetchLiveQueue]);

  // Auto-refresh countdown
  useEffect(() => {
    if (!autoSync) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchLiveQueue(true);
          return AUTO_SYNC_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoSync, fetchLiveQueue]);

  // Dismiss feedback toast after 4s
  useEffect(() => {
    if (!feedbackMessage) return;
    const t = setTimeout(() => setFeedbackMessage(null), 4000);
    return () => clearTimeout(t);
  }, [feedbackMessage]);

  // Action: Call Next Patient or Specific Token
  const handleCallNext = async (tokenId?: string, specificDeptId?: number, specificDocId?: number) => {
    setActionLoading(true);
    setFeedbackMessage(null);

    try {
      const payload = {
        token_id: tokenId || undefined,
        department_id: specificDeptId || (selectedDeptId !== 'all' ? Number(selectedDeptId) : undefined),
        doctor_id: specificDocId || (selectedDocId !== 'all' ? Number(selectedDocId) : undefined),
        staff_name: session?.name || 'Reception Staff',
        staff_role: session?.role || 'receptionist',
      };

      let res = await fetch('/api/v1/reception/queue/call-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        res = await fetch('http://localhost:5000/api/v1/reception/queue/call-next', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to call token');
      }

      setFeedbackMessage({
        type: 'success',
        text: json.message || 'Patient called to cabin successfully!',
      });
      fetchLiveQueue(true);
    } catch (err: unknown) {
      setFeedbackMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error calling token',
      });
    } finally {
      setActionLoading(false);
      setActionTargetToken(null);
      setActionType(null);
    }
  };

  // Action: Update Consultation Status (Now Serving -> Consulting -> Completed / Cancelled)
  const handleUpdateStatus = async (
    tokenId: string,
    newStatus: 'Waiting' | 'Now Serving' | 'Consulting' | 'Completed' | 'Cancelled',
    reason = ''
  ) => {
    setActionLoading(true);
    setFeedbackMessage(null);

    try {
      const payload = {
        status: newStatus,
        cancellation_reason: reason,
        staff_name: session?.name || 'Staff Member',
        staff_role: session?.role || 'staff',
      };

      let res = await fetch(`/api/v1/reception/queue/tokens/${tokenId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        res = await fetch(`http://localhost:5000/api/v1/reception/queue/tokens/${tokenId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed to update status to ${newStatus}`);
      }

      setFeedbackMessage({
        type: 'success',
        text: json.message || `Token updated to ${newStatus}`,
      });
      fetchLiveQueue(true);
    } catch (err: unknown) {
      setFeedbackMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Status update error',
      });
    } finally {
      setActionLoading(false);
      setActionTargetToken(null);
      setActionType(null);
      setCancelReason('');
    }
  };

  // Action: Recall / Re-announce Token
  const handleRecallToken = async (tokenId: string) => {
    setActionLoading(true);
    try {
      const payload = {
        token_id: tokenId,
        staff_name: session?.name || 'Front Desk',
      };

      let res = await fetch('/api/v1/reception/queue/recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        res = await fetch('http://localhost:5000/api/v1/reception/queue/recall', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to recall token');
      }

      setFeedbackMessage({
        type: 'success',
        text: json.message || 'Token re-announced across OPD monitors!',
      });
      fetchLiveQueue(true);
    } catch (err: unknown) {
      setFeedbackMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Recall error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Helper: Status Badge Renderer
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Now Serving':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-sky-100 text-sky-800 border border-sky-300 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-ping" />
            Now Serving
          </span>
        );
      case 'Consulting':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Consulting
          </span>
        );
      case 'Waiting':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-amber-100 text-amber-900 border border-amber-200">
            <Clock className="h-3 w-3 text-amber-600" />
            Waiting
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-teal-50 text-teal-800 border border-teal-200">
            <Check className="h-3 w-3 text-teal-600" />
            Completed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
            <X className="h-3 w-3 text-zinc-400" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-100 text-zinc-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* ========================================================
          1. HEADER TELEMETRY & OPERATIONS BAR
      ======================================================== */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold uppercase bg-emerald-50 text-[#174C40] border border-emerald-200">
                <Radio className="h-3 w-3 text-emerald-600 animate-pulse" />
                Live Synchronization Engine
              </span>
              <span className="text-xs font-mono text-[#77817C] hidden sm:inline">
                • Synchronized Doctor &amp; Reception Queue
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#1F2421] tracking-tight">
              Live OPD Queue Management
            </h1>
            <p className="text-xs sm:text-sm text-[#4A5350]">
              Real-time token calling, cabin consultation progression, waiting time estimates, and queue history.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Live Clock */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] text-xs font-mono text-[#1F2421]">
              <Clock className="h-3.5 w-3.5 text-[#174C40]" />
              <span className="font-semibold">{currentTime || '--:--:--'}</span>
            </div>

            {/* Auto-sync Toggle */}
            <button
              onClick={() => setAutoSync(!autoSync)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-medium transition-all cursor-pointer ${
                autoSync
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              <CircleDot className={`h-3.5 w-3.5 ${autoSync ? 'text-emerald-600 animate-pulse' : 'text-zinc-400'}`} />
              <span>{autoSync ? `Auto-sync: ${countdown}s` : 'Paused'}</span>
            </button>

            {/* Manual Refresh */}
            <button
              onClick={() => fetchLiveQueue(false)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-[#E5E8E6] bg-white hover:bg-[#FAFAF7] text-xs font-medium text-[#1F2421] shadow-2xs transition-colors disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Sync Now</span>
            </button>

            {/* Global Call Next Patient Button */}
            <button
              onClick={() => handleCallNext()}
              disabled={actionLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Megaphone className="h-4 w-4" />
              <span>Call Next in Line</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackMessage && (
          <div
            className={`mt-4 p-3.5 rounded-2xl text-xs flex items-center justify-between border ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{feedbackMessage.text}</span>
            </div>
            <button onClick={() => setFeedbackMessage(null)} className="text-zinc-400 hover:text-zinc-700">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Global Error Notice */}
        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold">Queue Synchronization Interrupted: </span>
                <span>{error}</span>
              </div>
            </div>
            <button
              onClick={() => fetchLiveQueue(false)}
              className="px-3 py-1 rounded-xl bg-rose-600 text-white text-[11px] font-semibold hover:bg-rose-700"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          2. FIVE LIVE STATUS METRIC CARDS
      ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Metric 1: Total Queue */}
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#77817C] mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Today's Intake</span>
            <Layers className="h-3.5 w-3.5 text-[#174C40]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#1F2421]">
            {loading ? '--' : stats?.totalToday ?? 0}
          </div>
          <span className="text-[10px] text-[#77817C] block mt-1">Total tokens issued</span>
        </div>

        {/* Metric 2: Currently Waiting */}
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-amber-900 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Waiting</span>
            <Clock className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-amber-950 flex items-baseline gap-2">
            <span>{loading ? '--' : stats?.waitingCount ?? 0}</span>
            {stats && stats.emergencyWaitingCount > 0 && (
              <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                {stats.emergencyWaitingCount} ER
              </span>
            )}
          </div>
          <span className="text-[10px] text-amber-800/80 block mt-1">In OPD lounge</span>
        </div>

        {/* Metric 3: Now Serving */}
        <div className="rounded-2xl border border-sky-200 bg-sky-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-sky-900 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Now Serving</span>
            <Megaphone className="h-3.5 w-3.5 text-sky-600 animate-pulse" />
          </div>
          <div className="text-2xl font-serif font-bold text-sky-950">
            {loading ? '--' : stats?.nowServingCount ?? 0}
          </div>
          <span className="text-[10px] text-sky-800/80 block mt-1">Called to cabin</span>
        </div>

        {/* Metric 4: Consulting */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-900 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Consulting</span>
            <Stethoscope className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-950">
            {loading ? '--' : stats?.consultingCount ?? 0}
          </div>
          <span className="text-[10px] text-emerald-800/80 block mt-1">With doctors</span>
        </div>

        {/* Metric 5: Completed */}
        <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-teal-900 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Completed</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-teal-950">
            {loading ? '--' : stats?.completedCount ?? 0}
          </div>
          <span className="text-[10px] text-teal-800/80 block mt-1">Consulted today</span>
        </div>

        {/* Metric 6: Avg Consultation Duration */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-700 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Avg Duration</span>
            <Timer className="h-3.5 w-3.5 text-zinc-500" />
          </div>
          <div className="text-2xl font-serif font-bold text-zinc-900 flex items-baseline gap-1">
            <span>{loading ? '--' : stats?.avgConsultationMins ?? 12}</span>
            <span className="text-xs font-mono font-normal text-zinc-500">mins</span>
          </div>
          <span className="text-[10px] text-zinc-500 block mt-1">Based on today's logs</span>
        </div>
      </div>

      {/* ========================================================
          3. HERO: CURRENTLY SERVING CABIN SHOWCASE
      ======================================================== */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-lg font-serif font-bold text-[#1F2421]">
              Currently Serving Tokens &amp; Active Cabins
            </h2>
          </div>
          <span className="text-xs font-mono text-[#77817C] bg-[#FAFAF7] px-3 py-1 rounded-xl border border-[#E5E8E6] self-start sm:self-auto">
            {nowServing.length} Active Consultations
          </span>
        </div>

        {nowServing.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-[#E5E8E6] bg-[#FAFAF7] space-y-3">
            <Megaphone className="h-8 w-8 text-[#A3ABA7] mx-auto stroke-1" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#1F2421]">No tokens currently in consultation</h3>
              <p className="text-xs text-[#77817C]">
                Click "Call Next in Line" or select a waiting patient below to announce them to a cabin.
              </p>
            </div>
            <button
              onClick={() => handleCallNext()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs"
            >
              <Megaphone className="h-3.5 w-3.5" />
              <span>Call Next Patient</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nowServing.map((item) => (
              <div
                key={item.token_id}
                className={`p-5 rounded-2xl border shadow-xs transition-all space-y-4 ${
                  item.status === 'Now Serving'
                    ? 'border-sky-300 bg-gradient-to-br from-sky-50/50 via-white to-white'
                    : 'border-emerald-300 bg-gradient-to-br from-emerald-50/40 via-white to-white'
                }`}
              >
                {/* Top Strip: Big Token Display & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#77817C] block">
                      {item.department_name}
                    </span>
                    <span className="text-2xl sm:text-3xl font-mono font-bold text-[#174C40] tracking-tight">
                      {item.token_display || `#${item.token_number}`}
                    </span>
                  </div>
                  <div className="text-right">
                    {renderStatusBadge(item.status)}
                    <span className="text-[10px] font-mono text-[#77817C] block mt-1">
                      {item.doctor_cabin}
                    </span>
                  </div>
                </div>

                {/* Patient & Doctor Demographics */}
                <div className="p-3 rounded-xl bg-white border border-[#E5E8E6] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedProfileId(item.patient_id)}
                      className="font-bold text-[#1F2421] hover:text-[#174C40] hover:underline truncate max-w-[160px] text-left cursor-pointer"
                    >
                      {item.patient_name}
                    </button>
                    <span className="text-[10px] font-mono text-[#77817C]">{item.gender} • {item.age?.formatted || 'Adult'}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#4A5350] pt-1 border-t border-[#F0F2F0]">
                    <span className="text-[#77817C]">Attending Doctor:</span>
                    <span className="font-semibold text-[#1F2421]">{item.doctor_name}</span>
                  </div>

                  {item.reason && (
                    <div className="text-[11px] text-[#77817C] truncate italic">
                      Notes: {item.reason}
                    </div>
                  )}
                </div>

                {/* Cabin Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {item.status === 'Now Serving' ? (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(item.token_id, 'Consulting')}
                        disabled={actionLoading}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Stethoscope className="h-3.5 w-3.5" />
                        <span>Start Consultation</span>
                      </button>

                      <button
                        onClick={() => handleRecallToken(item.token_id)}
                        disabled={actionLoading}
                        title="Re-announce patient on audio & displays"
                        className="p-2 rounded-xl border border-[#E5E8E6] bg-white hover:bg-[#FAFAF7] text-[#1F2421] transition-colors cursor-pointer"
                      >
                        <Megaphone className="h-3.5 w-3.5 text-[#174C40]" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(item.token_id, 'Completed')}
                      disabled={actionLoading}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Complete Consultation</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setActionTargetToken(item);
                      setActionType('cancel');
                    }}
                    disabled={actionLoading}
                    className="py-2 px-3 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================
          4. MAIN LIVE OPD QUEUE TABLE & CONTROLS
      ======================================================== */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xs space-y-6">
        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#174C40]" />
              <h2 className="text-lg font-serif font-bold text-[#1F2421]">
                Today's Complete OPD Queue ({queue.length})
              </h2>
            </div>
            <p className="text-xs text-[#77817C] mt-0.5">
              Live sequential order with queue position, estimated wait times, and status transitions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#77817C]" />
              <input
                type="text"
                placeholder="Search token, patient, doctor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E5E8E6] text-xs text-[#1F2421] bg-[#FAFAF7] focus:bg-white focus:outline-none focus:border-[#174C40] transition-colors"
              />
            </div>

            {/* Department Filter */}
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#E5E8E6] text-xs text-[#1F2421] bg-[#FAFAF7] focus:bg-white focus:outline-none focus:border-[#174C40]"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.department_id} value={d.department_id}>
                  {d.department_name} ({d.waiting_count} waiting)
                </option>
              ))}
            </select>

            {/* Doctor Filter */}
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#E5E8E6] text-xs text-[#1F2421] bg-[#FAFAF7] focus:bg-white focus:outline-none focus:border-[#174C40]"
            >
              <option value="all">All Physicians</option>
              {doctors.map((doc) => (
                <option key={doc.doctor_id} value={doc.doctor_id}>
                  {doc.doctor_name} ({doc.room_or_cabin})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#E5E8E6] text-xs text-[#1F2421] bg-[#FAFAF7] focus:bg-white focus:outline-none focus:border-[#174C40]"
            >
              <option value="all">All Statuses</option>
              <option value="Waiting">Waiting</option>
              <option value="Now Serving">Now Serving</option>
              <option value="Consulting">Consulting</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Live Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E8E6] bg-[#FAFAF7] text-[#77817C] font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3.5 font-semibold text-center w-16">Pos</th>
                <th className="py-3 px-4 font-semibold">Token</th>
                <th className="py-3 px-4 font-semibold">Patient Information</th>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold">Assigned Doctor</th>
                <th className="py-3 px-3 font-semibold">Wait Est.</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F0]">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-3 text-center"><div className="h-4 w-6 bg-zinc-200 rounded mx-auto" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-14 bg-zinc-200 rounded" /></td>
                    <td className="py-4 px-4 space-y-1"><div className="h-4 w-32 bg-zinc-200 rounded" /><div className="h-3 w-20 bg-zinc-100 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-28 bg-zinc-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-zinc-200 rounded" /></td>
                    <td className="py-4 px-3"><div className="h-4 w-16 bg-zinc-100 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-20 bg-zinc-200 rounded" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-6 w-24 bg-zinc-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : queue.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#77817C] space-y-2">
                    <Clock className="h-8 w-8 text-[#A3ABA7] mx-auto stroke-1" />
                    <div>No tokens matching the selected filter criteria.</div>
                  </td>
                </tr>
              ) : (
                queue.map((item) => {
                  const isEmergency = item.priority === 'Emergency';
                  return (
                    <tr
                      key={item.token_id}
                      className={`hover:bg-[#FAFAF7]/90 transition-colors ${
                        item.status === 'Now Serving'
                          ? 'bg-sky-50/20'
                          : item.status === 'Consulting'
                          ? 'bg-emerald-50/20'
                          : ''
                      }`}
                    >
                      {/* Queue Position */}
                      <td className="py-3.5 px-3 text-center font-mono">
                        {item.queue_position ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.queue_position === 1
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-zinc-100 text-zinc-700'
                            }`}
                          >
                            #{item.queue_position}
                          </span>
                        ) : (
                          <span className="text-[#A3ABA7] text-[10px] font-mono">—</span>
                        )}
                      </td>

                      {/* Token Display */}
                      <td className="py-3.5 px-4 font-mono font-bold text-sm text-[#174C40]">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-[#174C40]/10 border border-[#174C40]/20">
                            {item.token_display || `#${item.token_number}`}
                          </span>
                          {isEmergency && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 font-bold animate-pulse">
                              ER
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Patient Details */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => setSelectedProfileId(item.patient_id)}
                          className="font-semibold text-[#1F2421] hover:text-[#174C40] hover:underline text-left cursor-pointer"
                        >
                          {item.patient_name}
                        </button>
                        <div className="text-[11px] font-mono text-[#77817C] flex items-center gap-2 mt-0.5">
                          <span>{item.patient_code}</span>
                          {item.blood_group && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-rose-700">{item.blood_group}</span>
                            </>
                          )}
                          {item.mobile && (
                            <>
                              <span>•</span>
                              <span>{item.mobile}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 text-[#4A5350]">
                        <span className="font-medium text-[#1F2421]">{item.department_name}</span>
                        <span className="text-[10px] font-mono text-[#77817C] block">{item.visit_type}</span>
                      </td>

                      {/* Doctor & Cabin */}
                      <td className="py-3.5 px-4 text-[#4A5350]">
                        <span className="font-medium text-[#1F2421]">{item.doctor_name}</span>
                        <span className="text-[10px] font-mono text-[#174C40] font-semibold block">
                          {item.doctor_cabin}
                        </span>
                      </td>

                      {/* Estimated Wait */}
                      <td className="py-3.5 px-3 font-mono text-xs text-[#4A5350]">
                        {item.status === 'Waiting' && item.estimated_wait_mins ? (
                          <div className="flex items-center gap-1 text-amber-900 font-semibold">
                            <Clock className="h-3 w-3 text-amber-600 shrink-0" />
                            <span>~{item.estimated_wait_mins}m</span>
                          </div>
                        ) : item.status === 'Now Serving' || item.status === 'Consulting' ? (
                          <span className="text-emerald-700 font-medium text-[11px]">In Cabin</span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {renderStatusBadge(item.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === 'Waiting' && (
                            <button
                              onClick={() => handleCallNext(item.token_id)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 rounded-lg bg-[#174C40] hover:bg-[#123B32] text-white text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Call this patient into doctor cabin"
                            >
                              <Megaphone className="h-3 w-3" />
                              <span>Call</span>
                            </button>
                          )}

                          {item.status === 'Now Serving' && (
                            <button
                              onClick={() => handleUpdateStatus(item.token_id, 'Consulting')}
                              disabled={actionLoading}
                              className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Transition into active clinical consultation"
                            >
                              <Stethoscope className="h-3 w-3" />
                              <span>Consult</span>
                            </button>
                          )}

                          {item.status === 'Consulting' && (
                            <button
                              onClick={() => handleUpdateStatus(item.token_id, 'Completed')}
                              disabled={actionLoading}
                              className="px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Mark consultation completed"
                            >
                              <Check className="h-3 w-3" />
                              <span>Complete</span>
                            </button>
                          )}

                          {(item.status === 'Waiting' || item.status === 'Now Serving' || item.status === 'Consulting') && (
                            <button
                              onClick={() => {
                                setActionTargetToken(item);
                                setActionType('cancel');
                              }}
                              disabled={actionLoading}
                              className="p-1 rounded-lg text-[#77817C] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Cancel token"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedProfileId(item.patient_id)}
                            className="p-1 rounded-lg text-[#77817C] hover:text-[#174C40] hover:bg-[#FAFAF7] transition-colors cursor-pointer"
                            title="View patient electronic medical record"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          5. CANCEL TOKEN MODAL
      ======================================================== */}
      {actionType === 'cancel' && actionTargetToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#E5E8E6] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-rose-600" />
                <h3 className="font-serif font-bold text-base text-[#1F2421]">Cancel Token</h3>
              </div>
              <button
                onClick={() => {
                  setActionType(null);
                  setActionTargetToken(null);
                }}
                className="text-zinc-400 hover:text-zinc-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[#4A5350]">
              Are you sure you want to cancel token{' '}
              <strong className="text-[#1F2421]">
                {actionTargetToken.token_display || `#${actionTargetToken.token_number}`}
              </strong>{' '}
              for <strong className="text-[#1F2421]">{actionTargetToken.patient_name}</strong>?
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#1F2421] block">
                Cancellation Reason <span className="text-[#77817C]">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Patient left premises, duplicate registration, reschedule"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E8E6] text-xs text-[#1F2421] focus:outline-none focus:border-rose-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActionType(null);
                  setActionTargetToken(null);
                }}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl border border-[#E5E8E6] text-xs font-medium text-[#4A5350] hover:bg-[#FAFAF7]"
              >
                Keep in Queue
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(actionTargetToken.token_id, 'Cancelled', cancelReason)}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Profile Modal */}
      {selectedProfileId && (
        <PatientProfileModal
          patientId={selectedProfileId}
          onClose={() => setSelectedProfileId(null)}
        />
      )}
    </div>
  );
}
