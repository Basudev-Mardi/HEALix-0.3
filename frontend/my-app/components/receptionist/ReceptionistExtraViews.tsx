'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Stethoscope,
  Users,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  CalendarCheck,
  CreditCard,
  History,
  BarChart3,
  Settings,
  ShieldCheck,
  Tv,
  ExternalLink,
  Languages,
  Check,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Volume2,
  VolumeX,
  FileText,
  Radio,
  ArrowRight,
  Sliders,
  Sparkles,
  Download,
  Printer,
  Lock,
  ShieldAlert,
  DollarSign,
  Activity,
  Filter,
  Calendar,
  ChevronDown,
  UserCheck,
  PieChart,
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { type StaffUser } from '@/lib/staff-auth';
import type { DashboardLanguage } from './ReceptionistDashboard';

// ============================================================================
// 1. DOCTOR AVAILABILITY & WORKLOAD VIEW
// ============================================================================

interface DoctorItem {
  id: number;
  name: string;
  title?: string;
  specialty?: string;
  department_id: number;
  department_name?: string;
  availability_status: 'Available' | 'Busy' | 'On Break' | 'Unavailable';
  room_or_cabin: string;
  waiting_count: number;
}

interface DepartmentItem {
  id: number;
  name: string;
  prefix?: string;
}

export function DoctorAvailabilityView({
  session,
  onAssignDoctor,
}: {
  session: StaffUser | null;
  onAssignDoctor?: (doctorId: number) => void;
}) {
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchDocQuery, setSearchDocQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingDocId, setUpdatingDocId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res: Response;
      try {
        res = await fetch('/api/v1/reception/visits/available-doctors');
      } catch {
        res = await fetch('http://localhost:5000/api/v1/reception/visits/available-doctors');
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setDoctors(json.doctors || []);
        setDepartments(json.departments || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch doctor availability');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleUpdateStatus = async (
    doctorId: number,
    newStatus: 'Available' | 'Busy' | 'On Break' | 'Unavailable'
  ) => {
    setUpdatingDocId(doctorId);
    setFeedback(null);
    try {
      let res: Response;
      try {
        res = await fetch(`/api/v1/reception/doctors/${doctorId}/availability`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            staff_name: session?.name || 'Reception Staff',
          }),
        });
      } catch {
        res = await fetch(`http://localhost:5000/api/v1/reception/doctors/${doctorId}/availability`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            staff_name: session?.name || 'Reception Staff',
          }),
        });
      }
      if (!res.ok) throw new Error(`Status update failed (HTTP ${res.status})`);
      setDoctors((prev) =>
        prev.map((d) => (d.id === doctorId ? { ...d, availability_status: newStatus } : d))
      );
      setFeedback(`Doctor status updated to ${newStatus}.`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update doctor status');
    } finally {
      setUpdatingDocId(null);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const matchesDept =
      selectedDept === 'all' || doc.department_id.toString() === selectedDept;
    const matchesSearch =
      searchDocQuery.trim() === '' ||
      doc.name.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
      (doc.specialty && doc.specialty.toLowerCase().includes(searchDocQuery.toLowerCase())) ||
      doc.room_or_cabin.toLowerCase().includes(searchDocQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || doc.availability_status.toLowerCase() === statusFilter.toLowerCase();
    return matchesDept && matchesSearch && matchesStatus;
  });

  const availableCount = doctors.filter((d) => d.availability_status === 'Available').length;
  const busyCount = doctors.filter((d) => d.availability_status === 'Busy').length;
  const onBreakCount = doctors.filter((d) => d.availability_status === 'On Break').length;
  const unavailableCount = doctors.filter((d) => d.availability_status === 'Unavailable').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Stethoscope className="h-3.5 w-3.5" />
            Clinical Staff Telemetry
          </div>
          <h2 className="text-2xl font-serif text-[#1F2421] tracking-tight mt-1">
            Doctor Availability &amp; Cabin Status
          </h2>
          <p className="text-xs text-[#4A5350]">
            Real-time consultation cabin occupancy, attending physicians, and queue workload.
          </p>
        </div>

        {/* Quick Tally Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
            Available: <strong>{availableCount}</strong>
          </span>
          <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
            Busy: <strong>{busyCount}</strong>
          </span>
          <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-800 border border-blue-200">
            On Break: <strong>{onBreakCount}</strong>
          </span>
          <span className="px-3 py-1 rounded-xl bg-zinc-100 text-zinc-700 border border-zinc-200">
            Off-Duty: <strong>{unavailableCount}</strong>
          </span>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs font-medium text-red-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Controls Bar */}
      <div className="rounded-2xl border border-[#E5E8E6] bg-white p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-auto flex-1 flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-[#77817C]" />
            <input
              type="text"
              placeholder="Search doctor, cabin, specialty..."
              value={searchDocQuery}
              onChange={(e) => setSearchDocQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#E5E8E6] text-xs focus:border-[#174C40] focus:outline-hidden"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-[#E5E8E6] text-xs bg-white focus:outline-hidden"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id.toString()}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-[#E5E8E6] text-xs bg-white focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="on break">On Break</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>

        <button
          onClick={fetchDoctors}
          disabled={loading}
          className="px-4 py-2 rounded-xl border border-[#E5E8E6] bg-[#FAFAF7] hover:bg-[#F0F2F0] text-xs font-semibold text-[#1F2421] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs font-mono text-[#77817C] animate-pulse">
          Loading attending doctors status...
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="p-12 rounded-3xl border border-dashed border-[#E5E8E6] bg-white text-center space-y-2">
          <Stethoscope className="h-10 w-10 text-[#77817C] mx-auto opacity-40" />
          <h3 className="font-semibold text-sm text-[#1F2421]">No Doctors Found</h3>
          <p className="text-xs text-[#77817C]">Try clearing search filters or selecting another department.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((doc) => {
            const isAvailable = doc.availability_status === 'Available';
            const isBusy = doc.availability_status === 'Busy';
            const isOnBreak = doc.availability_status === 'On Break';

            return (
              <div
                key={doc.id}
                className="rounded-3xl border border-[#E5E8E6] bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#174C40]/40 transition-all"
              >
                <div className="space-y-3">
                  {/* Top strip: Cabin & Status Pill */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#FAFAF7] border border-[#E5E8E6] text-[#174C40]">
                      {doc.room_or_cabin}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : isBusy
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : isOnBreak
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                      }`}
                    >
                      {doc.availability_status}
                    </span>
                  </div>

                  {/* Doctor Info */}
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#1F2421]">
                      {doc.name}
                    </h3>
                    <p className="text-xs text-[#77817C]">
                      {doc.specialty || 'General Practitioner'}
                    </p>
                  </div>

                  {/* Waiting Queue Workload */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAF7] border border-[#E5E8E6] text-xs">
                    <span className="text-[#77817C]">Waiting In Line:</span>
                    <span className="font-mono font-bold text-[#1F2421]">
                      {doc.waiting_count} Patient{doc.waiting_count === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                {/* Status Toggle Controls */}
                <div className="pt-3 border-t border-[#F0F2F0] space-y-2">
                  <span className="text-[10px] font-mono uppercase text-[#77817C] block">
                    Update Station Status:
                  </span>
                  <div className="grid grid-cols-4 gap-1 text-[10px] font-medium text-center">
                    {(['Available', 'Busy', 'On Break', 'Unavailable'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        disabled={updatingDocId === doc.id || doc.availability_status === st}
                        onClick={() => handleUpdateStatus(doc.id, st)}
                        className={`py-1 rounded-lg border transition-all cursor-pointer disabled:opacity-40 ${
                          doc.availability_status === st
                            ? 'bg-[#174C40] text-white border-[#174C40] font-bold'
                            : 'bg-white hover:bg-[#F0F2F0] text-[#4A5350] border-[#E5E8E6]'
                        }`}
                      >
                        {st === 'On Break' ? 'Break' : st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 2. VISIT HISTORY & PATIENT PROFILE DIRECTORY VIEW
// ============================================================================

export function VisitHistoryView({
  onOpenPatientProfile,
}: {
  onOpenPatientProfile: (patientId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searched, setSearched] = useState<boolean>(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      let res: Response;
      try {
        res = await fetch(`/api/v1/reception/patients/search?q=${encodeURIComponent(searchQuery.trim())}`);
      } catch {
        res = await fetch(`http://localhost:5000/api/v1/reception/patients/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
      if (res.ok) {
        const json = await res.json();
        setPatients(json.patients || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xs">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
            <History className="h-3.5 w-3.5" />
            Patient Clinical Encounters
          </div>
          <h2 className="text-2xl font-serif text-[#1F2421] tracking-tight">
            Consultation Visit History &amp; Records
          </h2>
          <p className="text-xs text-[#4A5350]">
            Review all chronological patient encounters, previously consulted physicians, and billing histories.
          </p>

          <form onSubmit={handleSearch} className="flex items-center gap-2 pt-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3.5 top-3 text-[#77817C]" />
              <input
                type="text"
                placeholder="Search by Patient ID (PAT-...), Mobile, or Full Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#E5E8E6] text-xs focus:border-[#174C40] focus:outline-hidden"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="px-5 py-2.5 rounded-2xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Searching...' : 'Search Patient'}
            </button>
          </form>
        </div>
      </div>

      {searched && (
        <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-base text-[#1F2421]">
            Patient Records ({patients.length})
          </h3>

          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-[#77817C] animate-pulse">
              Retrieving patient historical charts...
            </div>
          ) : patients.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#77817C]">
              No patients matched &quot;{searchQuery}&quot;. Please verify the Patient ID or mobile number.
            </div>
          ) : (
            <div className="divide-y divide-[#F0F2F0]">
              {patients.map((pat) => (
                <div
                  key={pat.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-sm text-[#1F2421]">
                        {pat.full_name}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#174C40] bg-[#174C40]/10 px-2 py-0.5 rounded">
                        {pat.patient_id}
                      </span>
                    </div>
                    <div className="text-xs text-[#77817C] font-mono">
                      Gender: {pat.gender} • Mobile: {pat.mobile}
                      {pat.registration_date && ` • Registered: ${new Date(pat.registration_date).toLocaleDateString()}`}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenPatientProfile(pat.patient_id || pat.id)}
                    className="px-4 py-2 rounded-xl border border-[#174C40] bg-emerald-50 hover:bg-emerald-100 text-[#174C40] text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>View Chronological Visit History</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. RECEPTION REPORTS & ANALYTICS VIEW
// ============================================================================

export function ReceptionReportsView({
  data,
  session,
}: {
  data?: any;
  session?: StaffUser | null;
}) {
  // Date filter helper
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getNDaysAgoStr = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'custom'>('today');
  const [startDate, setStartDate] = useState<string>(getTodayStr());
  const [endDate, setEndDate] = useState<string>(getTodayStr());
  const [departmentId, setDepartmentId] = useState<string>('all');
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch departments list for filter
  useEffect(() => {
    fetch('/api/v1/reception/departments-and-doctors')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.departments)) {
          setDepartments(json.departments);
        } else if (data?.departmentQueues) {
          setDepartments(
            data.departmentQueues.map((q: any) => ({
              id: q.departmentId,
              name: q.departmentName,
            }))
          );
        }
      })
      .catch(() => {
        if (data?.departmentQueues) {
          setDepartments(
            data.departmentQueues.map((q: any) => ({
              id: q.departmentId,
              name: q.departmentName,
            }))
          );
        }
      });
  }, [data?.departmentQueues]);

  // Handle Preset changes
  const applyPreset = (preset: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days') => {
    setDatePreset(preset);
    const today = getTodayStr();
    if (preset === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'yesterday') {
      const yesterday = getNDaysAgoStr(1);
      setStartDate(yesterday);
      setEndDate(yesterday);
    } else if (preset === 'last_7_days') {
      setStartDate(getNDaysAgoStr(6));
      setEndDate(today);
    } else if (preset === 'last_30_days') {
      setStartDate(getNDaysAgoStr(29));
      setEndDate(today);
    }
  };

  // Fetch report analytics
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const staffRole = session?.role || 'receptionist';
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        department_id: departmentId,
        staff_role: staffRole,
      });

      const res = await fetch(`/api/v1/reception/reports/analytics?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load reports (Status ${res.status})`);
      }
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch analytics report');
      }
      setReportData(json.data || json);
    } catch (err: any) {
      console.error('Reports fetch error:', err);
      setError(err.message || 'Error retrieving report analytics from database');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, departmentId, session?.role]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // CSV Export URL
  const getCsvExportUrl = () => {
    const staffRole = session?.role || 'receptionist';
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      department_id: departmentId,
      staff_role: staffRole,
    });
    return `/api/v1/reception/reports/export?${params.toString()}`;
  };

  const summary = reportData?.summary || {};
  const dailyTrends = reportData?.daily_trends || [];
  const departmentVolume = reportData?.department_volume || [];
  const doctorVolume = reportData?.doctor_volume || [];
  const appointmentStats = reportData?.appointment_statistics || {};
  const emergencyStats = reportData?.emergency_statistics || {};
  const financials = reportData?.financials || {};

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Controls */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6 print:border-none print:p-0">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
            <BarChart3 className="h-3.5 w-3.5" />
            Operational &amp; Clinical Telemetry
          </div>
          <h2 className="text-2xl font-serif text-[#1F2421] tracking-tight mt-1">
            Reception Reports &amp; Inflow Analytics
          </h2>
          <p className="text-xs text-[#4A5350]">
            Database-backed reporting on patient registrations, department volumes, queue velocity, and revenue.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap print:hidden">
          <button
            onClick={() => fetchReports()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E5E8E6] hover:bg-[#FAFAF7] text-xs font-semibold text-[#1F2421] shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh database report"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#77817C] ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <a
            href={getCsvExportUrl()}
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E5E8E6] hover:bg-[#FAFAF7] text-xs font-semibold text-[#1F2421] shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-emerald-700" />
            Export CSV
          </a>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / PDF Report
          </button>
        </div>
      </div>

      {/* 2. Interactive Filter Bar */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-5 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono uppercase text-[#77817C] mr-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Range:
            </span>
            {(
              [
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'last_7_days', label: 'Last 7 Days' },
                { id: 'last_30_days', label: 'Last 30 Days' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  datePreset === p.id
                    ? 'bg-[#174C40] text-white font-semibold shadow-2xs'
                    : 'bg-[#FAFAF7] border border-[#E5E8E6] text-[#4A5350] hover:bg-[#F0F2F0]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase text-[#77817C] flex items-center gap-1">
              <Building2 className="h-3 w-3" /> Dept:
            </span>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#E5E8E6] bg-[#FAFAF7] text-xs font-medium text-[#1F2421] focus:outline-hidden focus:border-[#174C40] cursor-pointer"
            >
              <option value="all">All Departments ({departments.length})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Pickers */}
        <div className="pt-3 border-t border-[#F0F2F0] flex flex-wrap items-center gap-3 text-xs">
          <span className="text-[11px] font-mono uppercase text-[#77817C]">Custom Window:</span>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-[#77817C]">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('custom');
              }}
              className="px-2.5 py-1 rounded-lg border border-[#E5E8E6] bg-[#FAFAF7] text-xs text-[#1F2421] focus:outline-hidden focus:border-[#174C40]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-[#77817C]">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('custom');
              }}
              className="px-2.5 py-1 rounded-lg border border-[#E5E8E6] bg-[#FAFAF7] text-xs text-[#1F2421] focus:outline-hidden focus:border-[#174C40]"
            />
          </div>
          <span className="text-[11px] text-[#77817C] ml-auto">
            Viewing records for <strong className="text-[#1F2421] font-mono">{startDate}</strong> to{' '}
            <strong className="text-[#1F2421] font-mono">{endDate}</strong>
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Eight Primary KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        {/* KPI 1: Patient Registrations */}
        <div className="p-5 rounded-3xl border border-[#E5E8E6] bg-white shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-[#77817C]">Daily Registrations</span>
            <Users className="h-4 w-4 text-[#174C40]" />
          </div>
          <div className="text-3xl font-mono font-bold text-[#174C40]">
            {summary.total_registrations ?? 0}
          </div>
          <span className="text-[10px] text-[#77817C] block">New &amp; returning intakes</span>
        </div>

        {/* KPI 2: Total Consultations */}
        <div className="p-5 rounded-3xl border border-[#E5E8E6] bg-white shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-[#77817C]">Consultations</span>
            <Stethoscope className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="text-3xl font-mono font-bold text-emerald-700">
            {summary.total_consultations ?? 0}
          </div>
          <span className="text-[10px] text-emerald-800 block">Completed clinical visits</span>
        </div>

        {/* KPI 3: Waiting Patients */}
        <div className="p-5 rounded-3xl border border-[#E5E8E6] bg-white shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-[#77817C]">Waiting In Line</span>
            <Clock className="h-4 w-4 text-amber-700" />
          </div>
          <div className="text-3xl font-mono font-bold text-amber-700">
            {summary.waiting_patients ?? 0}
          </div>
          <span className="text-[10px] text-amber-800 block">Queued for doctors</span>
        </div>

        {/* KPI 4: Completed Patients */}
        <div className="p-5 rounded-3xl border border-[#E5E8E6] bg-white shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-[#77817C]">Discharged</span>
            <CheckCircle2 className="h-4 w-4 text-teal-700" />
          </div>
          <div className="text-3xl font-mono font-bold text-teal-700">
            {summary.completed_patients ?? 0}
          </div>
          <span className="text-[10px] text-teal-800 block">Discharged/consulted</span>
        </div>

        {/* KPI 5: Total Visits & Tokens */}
        <div className="p-5 rounded-3xl border border-[#E5E8E6] bg-white shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-[#77817C]">Tokens Generated</span>
            <Radio className="h-4 w-4 text-blue-700" />
          </div>
          <div className="text-3xl font-mono font-bold text-blue-700">
            {summary.total_tokens ?? 0}
          </div>
          <span className="text-[10px] text-blue-800 block">Across all active queues</span>
        </div>

        {/* KPI 6: Emergency Registrations */}
        <div className="p-5 rounded-3xl border border-[#E5E8E6] bg-white shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-[#77817C]">Emergency Cases</span>
            <AlertTriangle className="h-4 w-4 text-rose-700" />
          </div>
          <div className="text-3xl font-mono font-bold text-rose-700">
            {summary.emergency_registrations ?? 0}
          </div>
          <span className="text-[10px] text-rose-800 block">Fast-track emergency intake</span>
        </div>

        {/* KPI 7: Total Appointments */}
        <div className="p-5 rounded-3xl border border-[#E5E8E6] bg-white shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-[#77817C]">Appointments</span>
            <CalendarCheck className="h-4 w-4 text-indigo-700" />
          </div>
          <div className="text-3xl font-mono font-bold text-indigo-700">
            {summary.total_appointments ?? 0}
          </div>
          <span className="text-[10px] text-indigo-800 block">Scheduled on roster</span>
        </div>

        {/* KPI 8: Appointment Check-In Rate */}
        <div className="p-5 rounded-3xl border border-[#E5E8E6] bg-white shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-[#77817C]">Check-In Rate</span>
            <TrendingUp className="h-4 w-4 text-violet-700" />
          </div>
          <div className="text-3xl font-mono font-bold text-violet-700">
            {summary.appointment_checkin_rate ?? 0}%
          </div>
          <span className="text-[10px] text-violet-800 block">
            {summary.checked_in_appointments ?? 0} of {summary.total_appointments ?? 0} arrived
          </span>
        </div>
      </div>

      {/* 4. Department-wise Patient Volume & Share */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-serif font-bold text-base text-[#1F2421]">
              Department-Wise Patient Volume &amp; Inflow Share
            </h3>
            <p className="text-xs text-[#77817C]">
              Distribution of patient tokens, waiting load, and completions by specialty.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#77817C] bg-[#FAFAF7] px-3 py-1 rounded-full border border-[#E5E8E6]">
            {departmentVolume.length} Active Departments
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E8E6] text-[#77817C] font-mono uppercase text-[10px]">
                <th className="pb-3 font-semibold">Department</th>
                <th className="pb-3 font-semibold">Prefix</th>
                <th className="pb-3 font-semibold">Total Intake</th>
                <th className="pb-3 font-semibold">In Waiting</th>
                <th className="pb-3 font-semibold">Completed</th>
                <th className="pb-3 font-semibold">Emergency</th>
                <th className="pb-3 font-semibold w-48">Volume Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F0]">
              {departmentVolume.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[#77817C]">
                    No department volume recorded for the selected window.
                  </td>
                </tr>
              ) : (
                departmentVolume.map((dept: any) => (
                  <tr key={dept.department_id || dept.id} className="hover:bg-[#FAFAF7] transition-colors">
                    <td className="py-3 font-semibold text-[#1F2421]">
                      {dept.department_name || dept.name}
                    </td>
                    <td className="py-3 font-mono text-[#77817C]">
                      <span className="px-2 py-0.5 rounded-md bg-[#FAFAF7] border border-[#E5E8E6] text-[10px] font-bold">
                        {dept.token_prefix || dept.prefix || 'GEN'}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-[#1F2421]">
                      {dept.total_tokens}
                    </td>
                    <td className="py-3 font-mono">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        (dept.waiting_count ?? dept.waiting) > 0 ? 'bg-amber-50 text-amber-800' : 'text-[#77817C]'
                      }`}>
                        {dept.waiting_count ?? dept.waiting ?? 0}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-emerald-700 font-semibold">
                      {dept.completed_count ?? dept.completed ?? 0}
                    </td>
                    <td className="py-3 font-mono">
                      {(dept.emergency_count ?? dept.emergency) > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 font-bold text-[11px]">
                          {dept.emergency_count ?? dept.emergency}
                        </span>
                      ) : (
                        <span className="text-[#77817C]">0</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[#F0F2F0] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#174C40] rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, dept.volume_percentage ?? dept.volume_share_pct ?? 0)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-[#77817C] w-10 text-right">
                          {dept.volume_percentage ?? dept.volume_share_pct ?? 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Doctor-wise Consultation Volume */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-serif font-bold text-base text-[#1F2421]">
              Doctor Consultation Volume &amp; Desk Workload
            </h3>
            <p className="text-xs text-[#77817C]">
              Consultations completed, current consultations, and active queue counts per attending physician.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#77817C] bg-[#FAFAF7] px-3 py-1 rounded-full border border-[#E5E8E6]">
            {doctorVolume.length} Active Doctors
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E8E6] text-[#77817C] font-mono uppercase text-[10px]">
                <th className="pb-3 font-semibold">Doctor Name</th>
                <th className="pb-3 font-semibold">Department &amp; Specialty</th>
                <th className="pb-3 font-semibold">Cabin / Room</th>
                <th className="pb-3 font-semibold">Completed Consults</th>
                <th className="pb-3 font-semibold">Currently Consulting</th>
                <th className="pb-3 font-semibold">Queue Waiting</th>
                <th className="pb-3 font-semibold">Total Assigned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F0]">
              {doctorVolume.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[#77817C]">
                    No doctor consultation activity recorded for this period.
                  </td>
                </tr>
              ) : (
                doctorVolume.map((doc: any) => (
                  <tr key={doc.doctor_id || doc.id} className="hover:bg-[#FAFAF7] transition-colors">
                    <td className="py-3 font-semibold text-[#1F2421]">
                      {doc.doctor_name || doc.name}
                    </td>
                    <td className="py-3 text-[#4A5350]">
                      <div>{doc.department_name}</div>
                      <div className="text-[10px] text-[#77817C]">{doc.specialty}</div>
                    </td>
                    <td className="py-3 font-mono text-[#77817C]">
                      {doc.room_or_cabin || doc.cabin || 'Consulting Room'}
                    </td>
                    <td className="py-3 font-mono font-bold text-emerald-700">
                      {doc.completed_consultations}
                    </td>
                    <td className="py-3 font-mono">
                      {doc.currently_consulting > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold text-[10px] inline-flex items-center gap-1">
                          <Activity className="h-2.5 w-2.5 animate-pulse" />
                          Consulting ({doc.currently_consulting})
                        </span>
                      ) : (
                        <span className="text-[#77817C]">Idle</span>
                      )}
                    </td>
                    <td className="py-3 font-mono">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        doc.waiting_count > 0 ? 'bg-amber-50 text-amber-800' : 'text-[#77817C]'
                      }`}>
                        {doc.waiting_count}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-[#174C40]">
                      {doc.total_assigned_tokens ?? doc.total_assigned ?? 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Appointment Statistics & Emergency Fast-Track Intake (Two Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Statistics */}
        <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-[#1F2421] flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-indigo-700" />
              Appointment Scheduling Statistics
            </h3>
            <span className="text-xs font-mono font-bold text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              {appointmentStats.total || 0} Total
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-[#77817C]">Scheduled</span>
              <div className="text-xl font-mono font-bold text-blue-700">
                {appointmentStats.scheduled || 0}
              </div>
              <span className="text-[10px] text-[#77817C]">Awaiting arrival</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-[#77817C]">Checked-In</span>
              <div className="text-xl font-mono font-bold text-emerald-700">
                {appointmentStats.checked_in || 0}
              </div>
              <span className="text-[10px] text-emerald-800">Converted to visit</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-[#77817C]">Completed</span>
              <div className="text-xl font-mono font-bold text-[#174C40]">
                {appointmentStats.completed || 0}
              </div>
              <span className="text-[10px] text-[#77817C]">Finished consultation</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-[#77817C]">Cancelled / No-Show</span>
              <div className="text-xl font-mono font-bold text-rose-700">
                {appointmentStats.cancelled ?? appointmentStats.cancelled_or_no_show ?? 0}
              </div>
              <span className="text-[10px] text-rose-800">Did not attend</span>
            </div>
          </div>

          {/* Check-In Progress Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#4A5350]">Check-In Arrival Velocity</span>
              <span className="font-mono font-bold text-indigo-700">
                {appointmentStats.checkin_rate_pct ??
                  (appointmentStats.total > 0
                    ? Math.round(((appointmentStats.checked_in || 0) / appointmentStats.total) * 100)
                    : 0)}%
              </span>
            </div>
            <div className="h-2.5 bg-[#F0F2F0] rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-700 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    appointmentStats.checkin_rate_pct ??
                      (appointmentStats.total > 0
                        ? Math.round(((appointmentStats.checked_in || 0) / appointmentStats.total) * 100)
                        : 0)
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Emergency Registrations Breakdown */}
        <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-[#1F2421] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-700" />
              Emergency Intake &amp; Fast-Track Triage
            </h3>
            <span className="text-xs font-mono font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              {emergencyStats.total_emergency || 0} Cases
            </span>
          </div>

          {(!(emergencyStats.recent_arrivals || emergencyStats.recent_emergencies) ||
            (emergencyStats.recent_arrivals || emergencyStats.recent_emergencies).length === 0) ? (
            <div className="py-12 text-center text-xs text-[#77817C]">
              No emergency cases registered in the selected window.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E8E6] text-[#77817C] font-mono uppercase text-[10px]">
                    <th className="pb-2 font-semibold">Patient</th>
                    <th className="pb-2 font-semibold">Triage Level</th>
                    <th className="pb-2 font-semibold">Bay</th>
                    <th className="pb-2 font-semibold">Arrival Mode</th>
                    <th className="pb-2 font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F2F0]">
                  {(emergencyStats.recent_arrivals || emergencyStats.recent_emergencies).slice(0, 5).map((emg: any) => (
                    <tr key={emg.emergency_id} className="hover:bg-[#FAFAF7]">
                      <td className="py-2.5 font-semibold text-[#1F2421]">
                        <div>{emg.patient_name || 'Emergency Patient'}</div>
                        <div className="text-[10px] font-mono text-[#77817C]">{emg.patient_id}</div>
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            (emg.triage_level || emg.triage_priority) === 'Red'
                              ? 'bg-rose-100 text-rose-900 border border-rose-200'
                              : (emg.triage_level || emg.triage_priority) === 'Yellow'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}
                        >
                          {emg.triage_level || emg.triage_priority || 'Triage'}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-[#4A5350]">
                        {emg.assigned_bay || emg.bay_assignment || 'Fast-Track'}
                      </td>
                      <td className="py-2.5 text-[#77817C]">
                        {emg.arrival_mode || 'Walk-In'}
                      </td>
                      <td className="py-2.5 font-mono text-[11px] text-[#77817C]">
                        {(emg.arrival_time || emg.created_at)
                          ? new Date(emg.arrival_time || emg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 7. Daily Patient Inflow & Consultation Trends */}
      {dailyTrends.length > 0 && (
        <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-base text-[#1F2421]">
                Daily Patient Progression &amp; Velocity Trends
              </h3>
              <p className="text-xs text-[#77817C]">
                Day-by-day comparison of patient registrations, completed consultations, and emergency volume.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E8E6] text-[#77817C] font-mono uppercase text-[10px]">
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Day</th>
                  <th className="pb-3 font-semibold">Registrations</th>
                  <th className="pb-3 font-semibold">Consultations Completed</th>
                  <th className="pb-3 font-semibold">In Waiting</th>
                  <th className="pb-3 font-semibold">Emergency Cases</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F0]">
                {dailyTrends.map((d: any) => (
                  <tr key={d.date} className="hover:bg-[#FAFAF7]">
                    <td className="py-2.5 font-mono font-semibold text-[#1F2421]">{d.date}</td>
                    <td className="py-2.5 text-[#77817C]">
                      {d.day_name ||
                        (d.date ? new Date(d.date).toLocaleDateString([], { weekday: 'short' }) : '')}
                    </td>
                    <td className="py-2.5 font-mono font-bold text-[#174C40]">{d.registrations}</td>
                    <td className="py-2.5 font-mono text-emerald-700 font-semibold">
                      {d.completed_consultations ?? d.completed ?? 0}
                    </td>
                    <td className="py-2.5 font-mono">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        (d.waiting_patients ?? d.waiting ?? 0) > 0 ? 'bg-amber-50 text-amber-800' : 'text-[#77817C]'
                      }`}>
                        {d.waiting_patients ?? d.waiting ?? 0}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono">
                      {(d.emergency_cases ?? d.emergency ?? 0) > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 font-bold text-[11px]">
                          {d.emergency_cases ?? d.emergency}
                        </span>
                      ) : (
                        <span className="text-[#77817C]">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. Revenue & Payment Telemetry (RBAC RESTRICTED) */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CreditCard className="h-3.5 w-3.5" />
              Financial &amp; Revenue Telemetry
            </div>
            <h3 className="font-serif font-bold text-lg text-[#1F2421] mt-1">
              Reception Billing &amp; Payment Reconciliation
            </h3>
            <p className="text-xs text-[#77817C]">
              Payment collections, fee-type breakdown, and transaction status reconciliation.
            </p>
          </div>

          <span className="text-xs font-mono text-[#77817C] bg-[#FAFAF7] px-3 py-1 rounded-full border border-[#E5E8E6]">
            Role: <strong className="text-[#1F2421]">{session?.role || 'Receptionist'}</strong>
          </span>
        </div>

        {/* RBAC Verification Check */}
        {!financials?.can_view ? (
          <div className="p-8 rounded-2xl bg-amber-50/50 border border-amber-200 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
              <Lock className="h-6 w-6" />
            </div>
            <h4 className="font-serif font-bold text-base text-[#1F2421]">
              Financial Telemetry Restricted
            </h4>
            <p className="text-xs text-[#4A5350] max-w-md mx-auto">
              {financials?.notice ||
                'Access to detailed financial, billing, and revenue telemetry is restricted under hospital security policy. Billing Desk or Administrative credentials are required.'}
            </p>
            <div className="text-[11px] font-mono text-[#77817C]">
              Your current authenticated role: <strong className="text-[#1F2421]">{session?.role || 'Guest'}</strong>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Financial KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
              <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#77817C]">Total Billed</span>
                <div className="text-2xl font-mono font-bold text-[#1F2421]">
                  ₹{(financials.total_billed || 0).toLocaleString()}
                </div>
                <span className="text-[10px] text-[#77817C]">Invoiced fees</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                <span className="text-[10px] font-mono uppercase text-emerald-800">Total Collected</span>
                <div className="text-2xl font-mono font-bold text-emerald-800">
                  ₹{(financials.total_paid || 0).toLocaleString()}
                </div>
                <span className="text-[10px] text-emerald-700">Verified received</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
                <span className="text-[10px] font-mono uppercase text-amber-800">Pending Dues</span>
                <div className="text-2xl font-mono font-bold text-amber-800">
                  ₹{(financials.total_pending || 0).toLocaleString()}
                </div>
                <span className="text-[10px] text-amber-700">Awaiting clearance</span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-1">
                <span className="text-[10px] font-mono uppercase text-rose-800">Refunded</span>
                <div className="text-2xl font-mono font-bold text-rose-800">
                  ₹{(financials.total_refunded || 0).toLocaleString()}
                </div>
                <span className="text-[10px] text-rose-700">Processed returns</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#77817C]">Collection Rate</span>
                <div className="text-2xl font-mono font-bold text-[#174C40]">
                  {financials.collection_rate_percent ?? financials.collection_rate_pct ?? 0}%
                </div>
                <span className="text-[10px] text-[#77817C]">Settlement velocity</span>
              </div>
            </div>

            {/* Fee Breakdown & Payment Method Split */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Fee Breakdown */}
              <div className="p-4 rounded-2xl border border-[#E5E8E6] bg-white space-y-3">
                <h4 className="text-xs font-mono uppercase font-bold text-[#1F2421]">
                  Fee Category Breakdown
                </h4>
                <div className="space-y-2">
                  {(!financials.fee_breakdown || financials.fee_breakdown.length === 0) ? (
                    <div className="text-xs text-[#77817C]">No fee records.</div>
                  ) : (
                    financials.fee_breakdown.map((f: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-[#4A5350]">
                          {f.fee_type}{' '}
                          <span className="text-[10px] font-mono text-[#77817C]">({f.count})</span>
                        </span>
                        <span className="font-mono font-bold text-[#1F2421]">
                          ₹{Number(f.total_amount).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Payment Method Split */}
              <div className="p-4 rounded-2xl border border-[#E5E8E6] bg-white space-y-3">
                <h4 className="text-xs font-mono uppercase font-bold text-[#1F2421]">
                  Payment Method Distribution
                </h4>
                <div className="space-y-2">
                  {(!financials.method_breakdown || financials.method_breakdown.length === 0) ? (
                    <div className="text-xs text-[#77817C]">No payment records.</div>
                  ) : (
                    financials.method_breakdown.map((m: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-[#4A5350]">
                          {m.payment_method}{' '}
                          <span className="text-[10px] font-mono text-[#77817C]">({m.count})</span>
                        </span>
                        <span className="font-mono font-bold text-emerald-800">
                          ₹{Number(m.total_amount).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Payment Status Split */}
              <div className="p-4 rounded-2xl border border-[#E5E8E6] bg-white space-y-3">
                <h4 className="text-xs font-mono uppercase font-bold text-[#1F2421]">
                  Payment Status Statuses
                </h4>
                <div className="space-y-2">
                  {(!financials.status_breakdown || financials.status_breakdown.length === 0) ? (
                    <div className="text-xs text-[#77817C]">No status records.</div>
                  ) : (
                    financials.status_breakdown.map((s: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-[#4A5350] flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              s.payment_status === 'Paid'
                                ? 'bg-emerald-600'
                                : s.payment_status === 'Pending'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          {s.payment_status}{' '}
                          <span className="text-[10px] font-mono text-[#77817C]">({s.count})</span>
                        </span>
                        <span className="font-mono font-bold text-[#1F2421]">
                          ₹{Number(s.total_amount).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 4. RECEPTION SETTINGS & GATEWAY CONFIGURATION VIEW
// ============================================================================

export function ReceptionSettingsView({
  session,
  currentLang,
  onChangeLang,
  integrationsStatus,
  autoRefreshEnabled,
  onToggleAutoRefresh,
  countdown,
}: {
  session: StaffUser | null;
  currentLang: DashboardLanguage;
  onChangeLang: (lang: DashboardLanguage) => void;
  integrationsStatus: any;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
  countdown: number;
}) {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold uppercase bg-[#174C40]/10 text-[#174C40] border border-[#174C40]/20">
          <Settings className="h-3.5 w-3.5" />
          Front Desk Preferences
        </div>
        <h2 className="text-2xl font-serif text-[#1F2421] tracking-tight mt-1">
          Reception Portal Configuration
        </h2>
        <p className="text-xs text-[#4A5350]">
          Manage station preferences, display screens, language options, and communication gateways.
        </p>
      </div>

      {/* Station Credentials & Permissions Card */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#F0F2F0]">
          <ShieldCheck className="h-5 w-5 text-[#174C40]" />
          <h3 className="font-serif font-bold text-base text-[#1F2421]">
            Active Station Credentials &amp; Role Permissions
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] space-y-1">
            <span className="text-[10px] font-mono text-[#77817C] uppercase block">
              Staff Operator Name
            </span>
            <div className="font-semibold text-[#1F2421] text-sm">
              {session?.name || 'Reception Staff'}
            </div>
            <div className="text-[11px] font-mono text-[#174C40]">
              ID: {session?.staffId || 'REC-4011'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] space-y-1">
            <span className="text-[10px] font-mono text-[#77817C] uppercase block">
              Role &amp; Permission Scope
            </span>
            <div className="font-semibold text-emerald-800 text-sm flex items-center gap-1.5">
              <span>{session?.roleName || 'Receptionist'}</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-[10px] font-mono">
                Standard Desk
              </span>
            </div>
            <div className="text-[11px] text-[#77817C]">
              Access: Registration, Directory, Queue, Billing, Appointments
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
          <strong>HIPAA / Clinical Governance Notice:</strong> Front desk receptionists possess full administrative operational permissions. In compliance with patient privacy policies, clinical diagnoses, medical records, and physician treatment plans are restricted to authorized clinical healthcare practitioners.
        </div>
      </div>

      {/* Language & Localisation */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#F0F2F0]">
          <Languages className="h-5 w-5 text-[#174C40]" />
          <h3 className="font-serif font-bold text-base text-[#1F2421]">
            Multilingual Interface Language
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { code: 'en', label: 'English', sub: 'United States' },
            { code: 'es', label: 'Español', sub: 'España' },
            { code: 'hi', label: 'हिन्दी', sub: 'भारत' },
            { code: 'fr', label: 'Français', sub: 'France' },
          ].map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => onChangeLang(l.code as DashboardLanguage)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                currentLang === l.code
                  ? 'bg-[#174C40] text-white border-[#174C40] shadow-xs'
                  : 'bg-[#FAFAF7] hover:bg-[#F0F2F0] text-[#1F2421] border-[#E5E8E6]'
              }`}
            >
              <div className="font-bold text-sm">{l.label}</div>
              <div
                className={`text-[10px] font-mono ${
                  currentLang === l.code ? 'text-emerald-200' : 'text-[#77817C]'
                }`}
              >
                {l.sub}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Digital TV Queue Screen Link */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Tv className="h-5 w-5 text-[#174C40]" />
            <h3 className="font-serif font-bold text-base text-[#1F2421]">
              Dedicated Public TV Queue Display
            </h3>
          </div>
          <p className="text-xs text-[#77817C]">
            High-contrast digital waiting screen designed for public waiting area monitors and TVs.
          </p>
        </div>

        <a
          href="/display/opd-queue"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <span>Launch TV Queue Screen</span>
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Gateway Telemetry (Strict Real Status) */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#F0F2F0]">
          <Radio className="h-5 w-5 text-[#174C40]" />
          <h3 className="font-serif font-bold text-base text-[#1F2421]">
            External Notification Gateways (Strict Real Verification)
          </h3>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-[#1F2421]">Twilio SMS Gateway</div>
              <div className="text-[11px] text-[#77817C]">
                {integrationsStatus?.twilio_sms?.status ||
                  'Checking environment variable TWILIO_ACCOUNT_SID...'}
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                integrationsStatus?.twilio_sms?.configured
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200'
              }`}
            >
              {integrationsStatus?.twilio_sms?.configured ? 'Active' : 'Unconfigured'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-[#1F2421]">WhatsApp Business API Gateway</div>
              <div className="text-[11px] text-[#77817C]">
                {integrationsStatus?.whatsapp?.status ||
                  'Checking environment variable WHATSAPP_API_KEY...'}
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                integrationsStatus?.whatsapp?.configured
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200'
              }`}
            >
              {integrationsStatus?.whatsapp?.configured ? 'Active' : 'Unconfigured'}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-[#77817C] italic">
          * Per system clinical protocol, simulated fake message delivery is blocked. When gateways are unconfigured, delivery requests return 503 Service Unavailable.
        </p>
      </div>
    </div>
  );
}
