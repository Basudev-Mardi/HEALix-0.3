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
}: {
  data: any;
}) {
  const stats = data?.stats || {};
  const queues = data?.departmentQueues || [];
  const hourly = data?.hourlyProgression || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
            <BarChart3 className="h-3.5 w-3.5" />
            Executive Clinical Telemetry
          </div>
          <h2 className="text-2xl font-serif text-[#1F2421] tracking-tight mt-1">
            Reception Operations &amp; Inflow Reports
          </h2>
          <p className="text-xs text-[#4A5350]">
            Comprehensive statistics on patient intake, department volumes, and queue velocity.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          Print Daily Summary Report
        </button>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl border border-[#E5E8E6] bg-white shadow-xs space-y-1">
          <span className="text-[11px] font-mono uppercase text-[#77817C] block">
            Total Patients Intake
          </span>
          <div className="text-3xl font-mono font-bold text-[#174C40]">
            {stats.patientsRegisteredToday || 0}
          </div>
          <span className="text-[10px] text-emerald-700 block">Registered today</span>
        </div>

        <div className="p-5 rounded-3xl border border-[#E5E8E6] bg-white shadow-xs space-y-1">
          <span className="text-[11px] font-mono uppercase text-[#77817C] block">
            Patients Currently In Line
          </span>
          <div className="text-3xl font-mono font-bold text-amber-700">
            {stats.patientsCurrentlyWaiting || 0}
          </div>
          <span className="text-[10px] text-amber-800 block">Awaiting doctor call</span>
        </div>

        <div className="p-5 rounded-3xl border border-[#E5E8E6] bg-white shadow-xs space-y-1">
          <span className="text-[11px] font-mono uppercase text-[#77817C] block">
            Consultations Completed
          </span>
          <div className="text-3xl font-mono font-bold text-emerald-700">
            {stats.completedConsultations || 0}
          </div>
          <span className="text-[10px] text-emerald-800 block">Discharged today</span>
        </div>

        <div className="p-5 rounded-3xl border border-[#E5E8E6] bg-white shadow-xs space-y-1">
          <span className="text-[11px] font-mono uppercase text-[#77817C] block">
            Scheduled Appointments
          </span>
          <div className="text-3xl font-mono font-bold text-blue-700">
            {stats.upcomingAppointments || 0}
          </div>
          <span className="text-[10px] text-blue-800 block">Scheduled on roster</span>
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-base text-[#1F2421]">
          Department Patient Distribution &amp; Wait Telemetry
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E8E6] text-[#77817C] font-mono uppercase text-[10px]">
                <th className="pb-3 font-semibold">Department</th>
                <th className="pb-3 font-semibold">Waiting Count</th>
                <th className="pb-3 font-semibold">Serving Token</th>
                <th className="pb-3 font-semibold">Attending Doctor</th>
                <th className="pb-3 font-semibold">Est. Avg Wait</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F0]">
              {queues.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#77817C]">
                    No department data available.
                  </td>
                </tr>
              ) : (
                queues.map((q: any) => (
                  <tr key={q.departmentId} className="hover:bg-[#FAFAF7]">
                    <td className="py-3 font-semibold text-[#1F2421]">
                      {q.departmentName}
                    </td>
                    <td className="py-3 font-mono">
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold">
                        {q.waitingCount}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-[#174C40]">
                      {q.currentToken ? `#${q.currentToken}` : 'None'}
                    </td>
                    <td className="py-3 text-[#4A5350]">
                      {q.doctorName || 'Assigned on call'}
                    </td>
                    <td className="py-3 font-mono text-[#77817C]">
                      ~{q.avgWaitMins || 10} mins
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hourly Inflow Table */}
      {hourly.length > 0 && (
        <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-base text-[#1F2421]">
            Hourly Patient Intake Progression
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {hourly.map((h: any, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] text-center space-y-1"
              >
                <div className="text-[10px] font-mono text-[#77817C] uppercase">{h.hour}</div>
                <div className="text-xl font-mono font-bold text-[#174C40]">{h.registered}</div>
                <div className="text-[10px] text-[#77817C]">Intakes</div>
              </div>
            ))}
          </div>
        </div>
      )}
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
