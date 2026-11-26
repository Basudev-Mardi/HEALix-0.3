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
import PatientSearchLookup from './PatientSearchLookup';
import PatientProfileModal from './PatientProfileModal';
import LiveQueueManager from './LiveQueueManager';

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
  const [activeView, setActiveView] = useState<'queue' | 'search' | 'registration'>('queue');
  const [selectedQueuePatientId, setSelectedQueuePatientId] = useState<string | null>(null);

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
              onClick={() => setActiveView('search')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'search'
                  ? 'bg-white text-[#174C40] shadow-xs border border-[#E5E8E6]'
                  : 'text-[#77817C] hover:text-[#1F2421]'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              <span>Patient Search &amp; Returning Directory</span>
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

          <div className="flex items-center gap-2">
            {activeView !== 'search' && (
              <button
                onClick={() => setActiveView('search')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E5E8E6] bg-white hover:bg-[#FAFAF7] text-[#1F2421] text-xs font-medium shadow-2xs transition-colors cursor-pointer"
              >
                <Search className="h-3.5 w-3.5 text-[#174C40]" />
                <span>Search Patient</span>
              </button>
            )}

            {activeView !== 'registration' && (
              <button
                onClick={() => setActiveView('registration')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>New Registration</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {activeView === 'registration' ? (
        <PatientRegistrationForm
          onCancel={() => setActiveView('queue')}
          onSuccess={() => {
            fetchDashboardData(true);
          }}
        />
      ) : activeView === 'search' ? (
        <PatientSearchLookup
          onNavigateRegister={() => setActiveView('registration')}
          onVisitCreated={() => {
            fetchDashboardData(true);
            setActiveView('queue');
          }}
        />
      ) : (
        <LiveQueueManager />
      )}

      {/* Patient Profile Modal for Table Rows */}
      {selectedQueuePatientId && (
        <PatientProfileModal
          patientId={selectedQueuePatientId}
          onClose={() => setSelectedQueuePatientId(null)}
        />
      )}
    </div>
  );
}
