'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Clock,
  Stethoscope,
  CheckCircle2,
  CalendarCheck,
  Siren,
  UserCheck,
  RefreshCw,
  Search,
  AlertCircle,
  Activity,
  CircleDot,
  Radio,
  Layers,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import { getStaffSession, type StaffUser } from '@/lib/staff-auth';
import PatientRegistrationForm from './PatientRegistrationForm';

interface DashboardStats {
  patientsRegisteredToday: number;
  patientsCurrentlyWaiting: number;
  patientsCurrentlyConsulting: number;
  completedConsultations: number;
  upcomingAppointments: number;
  emergencyPatients: number;
  availableDoctors: number;
  totalDoctors: number;
}

interface DepartmentQueue {
  departmentId: number;
  departmentName: string;
  departmentSlug: string;
  waitingCount: number;
  currentToken: number | null;
  servingTokenId?: string | null;
  doctorName?: string | null;
  patientName?: string | null;
  servingStatus?: string | null;
  avgWaitMins: number;
}

interface ActiveServingToken {
  tokenId: string;
  tokenNumber: number;
  status: string;
  patientId: string;
  patientName: string;
  mobile: string;
  gender: string;
  bloodGroup: string;
  doctorId: number;
  doctorName: string;
  roomOrCabin: string;
  departmentId: number;
  departmentName: string;
  visitType: string;
  createdAt: string;
}

interface UpcomingQueueEntry {
  tokenId: string;
  tokenNumber: number;
  status: string;
  patientId: string;
  patientName: string;
  mobile: string;
  bloodGroup: string;
  doctorId: number;
  doctorName: string;
  departmentId: number;
  departmentName: string;
  visitType: string;
  checkInTime: string;
}

interface HourlyProgression {
  hour: string;
  registered: number;
  waiting: number;
  completed: number;
}

interface ReceptionDashboardData {
  stats: DashboardStats;
  departmentQueues: DepartmentQueue[];
  activeServing: ActiveServingToken[];
  upcomingQueue: UpcomingQueueEntry[];
  hourlyProgression: HourlyProgression[];
  timestamp: string;
}

const AUTO_REFRESH_INTERVAL_SECONDS = 20;

export default function ReceptionistDashboard() {
  const [session, setSession] = useState<StaffUser | null>(null);
  const [data, setData] = useState<ReceptionDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(AUTO_REFRESH_INTERVAL_SECONDS);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [activeView, setActiveView] = useState<'queue' | 'registration'>('queue');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Load session
  useEffect(() => {
    setSession(getStaffSession());
  }, []);

  // Live Clock updater
  useEffect(() => {
    const updateTime = () => {
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
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Dashboard Data from Backend
  const fetchDashboardData = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setRefreshing(true);
    }
    setError(null);

    try {
      // Try relative rewritten route first, fallback to direct localhost:5000
      let res: Response;
      try {
        res = await fetch('/api/v1/reception/dashboard', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
      } catch {
        res = await fetch('http://localhost:5000/api/v1/reception/dashboard', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
      }

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      if (json && json.stats) {
        setData(json);
      } else {
        throw new Error('Unexpected response format from reception API');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to Reception API';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCountdown(AUTO_REFRESH_INTERVAL_SECONDS);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  // Auto-refresh countdown interval
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchDashboardData(true);
          return AUTO_REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshEnabled, fetchDashboardData]);

  // Filtered upcoming queue
  const filteredQueue = useMemo(() => {
    if (!data?.upcomingQueue) return [];
    return data.upcomingQueue.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tokenNumber.toString().includes(searchQuery) ||
        item.doctorName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept =
        selectedDeptFilter === 'all' ||
        item.departmentName.toLowerCase() === selectedDeptFilter.toLowerCase() ||
        item.departmentId.toString() === selectedDeptFilter;

      const matchesStatus =
        selectedStatusFilter === 'all' ||
        item.status.toLowerCase() === selectedStatusFilter.toLowerCase();

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [data?.upcomingQueue, searchQuery, selectedDeptFilter, selectedStatusFilter]);

  // Unique departments for filter dropdown
  const uniqueDepartments = useMemo(() => {
    if (!data?.departmentQueues) return [];
    return data.departmentQueues.map((d) => ({
      id: d.departmentId,
      name: d.departmentName,
    }));
  }, [data?.departmentQueues]);

  return (
    <div className="w-full space-y-8">
      {/* ========================================================
          1. RECEPTION HEADER & OPERATIONS CONTROL BAR
      ======================================================== */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Title and Identification */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold tracking-wider uppercase bg-[#174C40]/10 text-[#174C40] border border-[#174C40]/20">
                <Radio className="h-3 w-3 text-emerald-600 animate-pulse" />
                Live Front Desk
              </span>
              <span className="text-xs font-mono text-[#77817C] hidden sm:inline">
                Central OPD &amp; Emergency Reception
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#1F2421] tracking-tight">
              Reception Operations &amp; Queue Control
            </h1>
            <p className="text-sm text-[#4A5350]">
              Real-time patient intake, doctor cabin availability, and live queue status.
            </p>
          </div>

          {/* Live Controls & Telemetry */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Clock */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] text-xs font-mono text-[#1F2421]">
              <Clock className="h-3.5 w-3.5 text-[#174C40]" />
              <span className="font-semibold">{currentTime || '--:--:--'}</span>
            </div>

            {/* Auto Refresh Toggle & Progress */}
            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              title={autoRefreshEnabled ? 'Click to pause auto-refresh' : 'Click to resume auto-refresh'}
              className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-medium transition-all cursor-pointer ${
                autoRefreshEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              <CircleDot
                className={`h-3.5 w-3.5 ${
                  autoRefreshEnabled ? 'text-emerald-600 animate-pulse' : 'text-zinc-400'
                }`}
              />
              <span>
                {autoRefreshEnabled ? `Auto-sync: ${countdown}s` : 'Auto-sync Paused'}
              </span>
            </button>

            {/* Manual Refresh Button */}
            <button
              onClick={() => fetchDashboardData(false)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-medium shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Staff Identity Strip */}
        {session && (
          <div className="mt-5 pt-4 border-t border-[#F0F2F0] flex flex-wrap items-center justify-between gap-3 text-xs text-[#77817C]">
            <div className="flex items-center gap-3">
              <span className="font-medium text-[#1F2421]">Active Station:</span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#FAFAF7] border border-[#E5E8E6] text-[#174C40] font-mono font-medium">
                {session.name} ({session.staffId})
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">{session.department}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Database Real-time Stream Online
            </div>
          </div>
        )}

        {/* View Selection Tabs */}
        <div className="mt-6 pt-4 border-t border-[#F0F2F0] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6]">
            <button
              onClick={() => setActiveView('queue')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'queue'
                  ? 'bg-white text-[#174C40] shadow-xs border border-[#E5E8E6]'
                  : 'text-[#77817C] hover:text-[#1F2421]'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Live Queue &amp; Overview</span>
            </button>
            <button
              onClick={() => setActiveView('registration')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'registration'
                  ? 'bg-[#174C40] text-white shadow-xs'
                  : 'text-[#77817C] hover:text-[#1F2421]'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>+ Register New Patient</span>
            </button>
          </div>

          {activeView === 'queue' && (
            <button
              onClick={() => setActiveView('registration')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>New Patient Registration</span>
            </button>
          )}
        </div>
      </div>

      {activeView === 'registration' ? (
        <PatientRegistrationForm
          onCancel={() => setActiveView('queue')}
          onSuccess={() => {
            fetchDashboardData(true);
          }}
        />
      ) : (
        <>
          {/* ========================================================
              ERROR STATE BANNER
          ======================================================== */}
          {error && (
            <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-900 flex items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-rose-950">Unable to load live reception metrics</h3>
                  <p className="text-xs text-rose-800 mt-0.5">{error}</p>
                  <p className="text-[11px] text-rose-700 mt-1">
                    Ensure the backend server is running on port 5000 and PostgreSQL is accessible.
                  </p>
                </div>
              </div>
              <button
                onClick={() => fetchDashboardData(false)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 transition-colors shrink-0 cursor-pointer"
              >
                Retry Connection
              </button>
            </div>
          )}

      {/* ========================================================
          2. SEVEN LIVE STATISTIC CARDS
      ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {/* Stat 1: Registered Today */}
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-5 shadow-xs hover:border-[#174C40]/30 transition-all">
          <div className="flex items-center justify-between text-[#77817C] mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
              Registered Today
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-[#174C40] flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#1F2421]">
            {loading ? (
              <span className="inline-block w-12 h-7 bg-zinc-200 animate-pulse rounded-md" />
            ) : (
              data?.stats.patientsRegisteredToday ?? 0
            )}
          </div>
          <div className="mt-2 text-[11px] text-[#77817C] flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Intake &amp; check-ins
          </div>
        </div>

        {/* Stat 2: Currently Waiting */}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/30 p-5 shadow-xs hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between text-amber-900/80 mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
              Currently Waiting
            </span>
            <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-950">
            {loading ? (
              <span className="inline-block w-12 h-7 bg-amber-200 animate-pulse rounded-md" />
            ) : (
              data?.stats.patientsCurrentlyWaiting ?? 0
            )}
          </div>
          <div className="mt-2 text-[11px] text-amber-800/80 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            In waiting lounge
          </div>
        </div>

        {/* Stat 3: Currently Consulting */}
        <div className="rounded-2xl border border-sky-200/80 bg-sky-50/30 p-5 shadow-xs hover:border-sky-400 transition-all">
          <div className="flex items-center justify-between text-sky-900/80 mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
              Consulting Now
            </span>
            <div className="h-8 w-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
              <Stethoscope className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-sky-950">
            {loading ? (
              <span className="inline-block w-12 h-7 bg-sky-200 animate-pulse rounded-md" />
            ) : (
              data?.stats.patientsCurrentlyConsulting ?? 0
            )}
          </div>
          <div className="mt-2 text-[11px] text-sky-800/80 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
            Inside doctor cabins
          </div>
        </div>

        {/* Stat 4: Completed Consultations */}
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-5 shadow-xs hover:border-[#174C40]/30 transition-all">
          <div className="flex items-center justify-between text-[#77817C] mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
              Completed
            </span>
            <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#1F2421]">
            {loading ? (
              <span className="inline-block w-12 h-7 bg-zinc-200 animate-pulse rounded-md" />
            ) : (
              data?.stats.completedConsultations ?? 0
            )}
          </div>
          <div className="mt-2 text-[11px] text-[#77817C] flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            Discharged / pharmacy
          </div>
        </div>

        {/* Stat 5: Upcoming Appointments */}
        <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/20 p-5 shadow-xs hover:border-indigo-400 transition-all">
          <div className="flex items-center justify-between text-indigo-900/80 mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
              Appointments
            </span>
            <div className="h-8 w-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-indigo-950">
            {loading ? (
              <span className="inline-block w-12 h-7 bg-indigo-200 animate-pulse rounded-md" />
            ) : (
              data?.stats.upcomingAppointments ?? 0
            )}
          </div>
          <div className="mt-2 text-[11px] text-indigo-800/80 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Scheduled for today
          </div>
        </div>

        {/* Stat 6: Emergency Patients */}
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/30 p-5 shadow-xs hover:border-rose-400 transition-all">
          <div className="flex items-center justify-between text-rose-900/80 mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
              Emergency
            </span>
            <div className="h-8 w-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <Siren className="h-4 w-4 animate-pulse" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-rose-950 flex items-baseline gap-2">
            {loading ? (
              <span className="inline-block w-12 h-7 bg-rose-200 animate-pulse rounded-md" />
            ) : (
              data?.stats.emergencyPatients ?? 0
            )}
            <span className="text-xs font-sans font-normal text-rose-700">Triage</span>
          </div>
          <div className="mt-2 text-[11px] text-rose-800/80 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
            High priority alerts
          </div>
        </div>

        {/* Stat 7: Available Doctors */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-5 shadow-xs hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between text-emerald-900/80 mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
              Available Doctors
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-950 flex items-baseline gap-1.5">
            {loading ? (
              <span className="inline-block w-12 h-7 bg-emerald-200 animate-pulse rounded-md" />
            ) : (
              <>
                <span>{data?.stats.availableDoctors ?? 0}</span>
                <span className="text-sm font-sans font-normal text-[#77817C]">
                  / {data?.stats.totalDoctors || 6}
                </span>
              </>
            )}
          </div>
          <div className="mt-2 text-[11px] text-emerald-800/80 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            In consultation rooms
          </div>
        </div>
      </div>

      {/* ========================================================
          3. DEPARTMENT-WISE QUEUE STATUS CAROUSEL / GRID
      ======================================================== */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#174C40]" />
              <h2 className="text-lg font-serif font-bold text-[#1F2421]">
                Department OPD Queues &amp; Calling Status
              </h2>
            </div>
            <p className="text-xs text-[#77817C] mt-0.5">
              Live token being called, doctor in attendance, and waiting volume per specialty.
            </p>
          </div>
          <span className="text-xs font-mono text-[#77817C] bg-[#FAFAF7] px-3 py-1.5 rounded-xl border border-[#E5E8E6] self-start sm:self-auto">
            {data?.departmentQueues.length || 0} Clinical Departments
          </span>
        </div>

        {/* Department Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 rounded-2xl border border-zinc-100 bg-zinc-50 animate-pulse space-y-3">
                <div className="h-4 bg-zinc-200 rounded w-1/2" />
                <div className="h-8 bg-zinc-200 rounded w-3/4" />
                <div className="h-4 bg-zinc-200 rounded w-1/3" />
              </div>
            ))
          ) : data?.departmentQueues && data.departmentQueues.length > 0 ? (
            data.departmentQueues.map((dept) => {
              const hasActive = dept.currentToken !== null;
              return (
                <div
                  key={dept.departmentId}
                  className={`rounded-2xl border p-4.5 transition-all ${
                    hasActive
                      ? 'border-[#174C40]/20 bg-gradient-to-br from-white to-[#FAFAF7]'
                      : 'border-[#E5E8E6] bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono text-[#77817C] uppercase tracking-wider block">
                        Dept #{dept.departmentId}
                      </span>
                      <h3 className="text-sm font-semibold text-[#1F2421] line-clamp-1">
                        {dept.departmentName}
                      </h3>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-medium ${
                        dept.waitingCount > 0
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {dept.waitingCount} Waiting
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#F0F2F0] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-[#77817C] uppercase">
                        Current Token Being Served
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {hasActive ? (
                          <>
                            <span className="text-xl font-mono font-bold text-[#174C40]">
                              #{dept.currentToken}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800 animate-pulse">
                              {dept.servingStatus || 'In Cabin'}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs font-mono text-[#77817C] italic">
                            No Active Token
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-mono text-[#77817C] uppercase">
                        Doctor &amp; Est. Wait
                      </div>
                      <div className="text-xs font-medium text-[#1F2421] mt-0.5 truncate max-w-[130px]">
                        {dept.doctorName || 'Assigned Clinician'}
                      </div>
                      <div className="text-[10px] font-mono text-[#77817C]">
                        ~{dept.avgWaitMins} mins wait
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-8 text-center text-xs text-[#77817C]">
              No department queues currently registered.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          4. ACTIVE CONSULTATIONS SHOWCASE (CURRENTLY SERVING)
      ======================================================== */}
      {data?.activeServing && data.activeServing.length > 0 && (
        <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/40 via-white to-white p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-base sm:text-lg font-serif font-bold text-[#1F2421]">
                Active Cabin Consultations ({data.activeServing.length})
              </h2>
            </div>
            <span className="text-xs font-mono text-[#174C40] bg-emerald-100/70 px-3 py-1 rounded-full font-medium">
              Live In-Progress
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.activeServing.map((item) => (
              <div
                key={item.tokenId}
                className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-mono font-bold text-[#174C40] bg-[#174C40]/10 px-2.5 py-1 rounded-lg">
                      #{item.tokenNumber}
                    </span>
                    <span className="text-xs font-semibold text-[#1F2421]">
                      {item.patientName}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800">
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-[#4A5350] pt-2 border-t border-[#F0F2F0]">
                  <div>
                    <span className="text-[10px] text-[#77817C] block">Clinician</span>
                    <span className="font-medium text-[#1F2421]">{item.doctorName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#77817C] block">Cabin / Location</span>
                    <span className="font-mono text-[#174C40] font-medium">{item.roomOrCabin}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#77817C] block">Department</span>
                    <span className="truncate block">{item.departmentName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#77817C] block">Encounter Type</span>
                    <span className="font-mono text-[11px]">{item.visitType}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          5. LIVE QUEUE FEED & UPCOMING QUEUE ENTRIES
      ======================================================== */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xs">
        {/* Header & Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#174C40]" />
              <h2 className="text-lg font-serif font-bold text-[#1F2421]">
                Live OPD Queue Entries
              </h2>
            </div>
            <p className="text-xs text-[#77817C] mt-0.5">
              Live token list with patient demographics, assigned physician, and queue status.
            </p>
          </div>

          {/* Search & Department Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#77817C]" />
              <input
                type="text"
                placeholder="Search patient, token, MRN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E5E8E6] text-xs text-[#1F2421] bg-[#FAFAF7] focus:bg-white focus:outline-none focus:border-[#174C40] transition-colors"
              />
            </div>

            {/* Department Filter */}
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#E5E8E6] text-xs text-[#1F2421] bg-[#FAFAF7] focus:bg-white focus:outline-none focus:border-[#174C40]"
            >
              <option value="all">All Departments</option>
              {uniqueDepartments.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#E5E8E6] text-xs text-[#1F2421] bg-[#FAFAF7] focus:bg-white focus:outline-none focus:border-[#174C40]"
            >
              <option value="all">All Statuses</option>
              <option value="Waiting">Waiting</option>
              <option value="Called">Called</option>
              <option value="In-Consultation">In-Consultation</option>
            </select>
          </div>
        </div>

        {/* Live Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E8E6] bg-[#FAFAF7] text-[#77817C] font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Token</th>
                <th className="py-3 px-4 font-semibold">Patient Demographics</th>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold">Consulting Doctor</th>
                <th className="py-3 px-4 font-semibold">Visit Type</th>
                <th className="py-3 px-4 font-semibold">Check-in Time</th>
                <th className="py-3 px-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F0]">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="h-6 w-10 bg-zinc-200 rounded" />
                    </td>
                    <td className="py-4 px-4 space-y-1">
                      <div className="h-4 w-32 bg-zinc-200 rounded" />
                      <div className="h-3 w-20 bg-zinc-100 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-28 bg-zinc-200 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-24 bg-zinc-200 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-20 bg-zinc-100 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-16 bg-zinc-100 rounded" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-5 w-16 bg-zinc-200 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredQueue.length > 0 ? (
                filteredQueue.map((entry) => {
                  const isEmergency = entry.visitType === 'Emergency';
                  return (
                    <tr
                      key={entry.tokenId}
                      className="hover:bg-[#FAFAF7]/80 transition-colors group"
                    >
                      {/* Token # */}
                      <td className="py-3.5 px-4 font-mono font-bold text-sm text-[#174C40]">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-[#174C40]/10 border border-[#174C40]/20">
                          #{entry.tokenNumber}
                        </span>
                      </td>

                      {/* Patient Name & MRN */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#1F2421] text-xs">
                          {entry.patientName}
                        </div>
                        <div className="text-[11px] font-mono text-[#77817C] flex items-center gap-2 mt-0.5">
                          <span>{entry.patientId}</span>
                          {entry.bloodGroup && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-rose-700">
                                {entry.bloodGroup}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 text-[#4A5350]">
                        <span className="font-medium text-[#1F2421]">
                          {entry.departmentName}
                        </span>
                      </td>

                      {/* Doctor */}
                      <td className="py-3.5 px-4 text-[#4A5350]">
                        <span className="text-[#1F2421]">{entry.doctorName}</span>
                      </td>

                      {/* Visit Type */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium font-mono ${
                            isEmergency
                              ? 'bg-rose-100 text-rose-900 border border-rose-200 font-bold'
                              : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {entry.visitType}
                        </span>
                      </td>

                      {/* Check-in Time */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#77817C]">
                        {new Date(entry.checkInTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold ${
                            entry.status === 'Waiting'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : entry.status === 'Called'
                              ? 'bg-sky-100 text-sky-900 border border-sky-200'
                              : entry.status === 'In-Consultation'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              entry.status === 'Waiting'
                                ? 'bg-amber-500 animate-pulse'
                                : entry.status === 'In-Consultation'
                                ? 'bg-emerald-500 animate-pulse'
                                : 'bg-sky-500'
                            }`}
                          />
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#77817C]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="h-8 w-8 text-[#A3ABA7] stroke-1" />
                      <div className="text-sm font-medium text-[#1F2421]">No patients in queue</div>
                      <p className="text-xs text-[#77817C] max-w-sm">
                        {searchQuery || selectedDeptFilter !== 'all' || selectedStatusFilter !== 'all'
                          ? 'No queue entries matched your search criteria. Try resetting the filters.'
                          : 'The waiting queue is currently clear for today.'}
                      </p>
                      {(searchQuery || selectedDeptFilter !== 'all' || selectedStatusFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedDeptFilter('all');
                            setSelectedStatusFilter('all');
                          }}
                          className="mt-2 text-xs text-[#174C40] underline hover:text-[#123B32] cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          6. PROFESSIONAL VISUAL CHART: PATIENT FLOW PROGRESSION
      ======================================================== */}
      {data?.hourlyProgression && data.hourlyProgression.length > 0 && (
        <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#174C40]" />
                <h2 className="text-lg font-serif font-bold text-[#1F2421]">
                  Hourly Patient Flow &amp; Queue Progression
                </h2>
              </div>
              <p className="text-xs text-[#77817C] mt-0.5">
                Intake volume vs completed consultations through daily OPD hours.
              </p>
            </div>
            {/* Chart Legend */}
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-[#174C40]" />
                <span className="text-[#4A5350]">Registered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-amber-400" />
                <span className="text-[#4A5350]">Waiting</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-emerald-400" />
                <span className="text-[#4A5350]">Consulted</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="grid grid-cols-8 gap-2 sm:gap-4 pt-6 pb-2 items-end min-h-[160px] border-b border-[#E5E8E6]">
            {data.hourlyProgression.map((item, idx) => {
              const maxVal = 14;
              const regHeight = Math.min(100, Math.round((item.registered / maxVal) * 100));
              const waitHeight = Math.min(100, Math.round((item.waiting / maxVal) * 100));
              const compHeight = Math.min(100, Math.round((item.completed / maxVal) * 100));

              return (
                <div key={idx} className="flex flex-col items-center gap-2 group">
                  {/* Tooltip on hover */}
                  <div className="text-[10px] font-mono text-[#77817C] opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.registered} reg
                  </div>

                  {/* Bars grouped */}
                  <div className="h-32 flex items-end gap-1 sm:gap-1.5 w-full justify-center">
                    {/* Registered Bar */}
                    <div
                      style={{ height: `${regHeight}%` }}
                      className="w-2.5 sm:w-4 bg-[#174C40] rounded-t-sm transition-all duration-500 hover:opacity-80"
                      title={`${item.registered} registered at ${item.hour}`}
                    />
                    {/* Waiting Bar */}
                    <div
                      style={{ height: `${waitHeight}%` }}
                      className="w-2.5 sm:w-4 bg-amber-400 rounded-t-sm transition-all duration-500 hover:opacity-80"
                      title={`${item.waiting} waiting at ${item.hour}`}
                    />
                    {/* Completed Bar */}
                    <div
                      style={{ height: `${compHeight}%` }}
                      className="w-2.5 sm:w-4 bg-emerald-400 rounded-t-sm transition-all duration-500 hover:opacity-80"
                      title={`${item.completed} completed at ${item.hour}`}
                    />
                  </div>

                  {/* X-Axis Hour Label */}
                  <span className="text-[10px] font-mono text-[#77817C] group-hover:text-[#174C40] font-medium">
                    {item.hour}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-[#77817C] font-mono">
            <span>Morning OPD Peak: 10:00 - 11:30</span>
            <span>Refreshed live with database transactions</span>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
