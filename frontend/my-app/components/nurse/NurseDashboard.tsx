'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  HeartPulse,
  Activity,
  Bed,
  Pill,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Plus,
  FileText,
  LogOut,
  Users,
  Building,
  UserCheck,
  Shield,
  Siren,
  Sparkles,
  Thermometer,
  Gauge,
  Droplet,
  Send,
  X,
  Calendar,
  Check,
  ArrowRight
} from 'lucide-react';
import { type StaffUser, clearStaffSession } from '@/lib/staff-auth';

interface NurseDashboardProps {
  nurse?: StaffUser | null;
  onLogout?: () => void;
}

interface BedItem {
  bed_id: string;
  bed_number: string;
  bed_type: string;
  bed_status: 'Available' | 'Occupied' | 'Maintenance' | 'Dirty';
  room: string;
  ward: string;
  cleaning_status: string;
  is_isolation: boolean;
  admission_id: string | null;
  admission_date: string | null;
  admitting_doctor: string | null;
  diagnosis: string | null;
  patient_id: string | null;
  patient_code: string | null;
  patient_name: string | null;
  gender: string | null;
  dob: string | null;
  blood_group: string | null;
  allergies: string | null;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  pulse: number | null;
  temperature: number | null;
  spo2: number | null;
  resp_rate: number | null;
  pain_scale: number | null;
  last_vitals_at: string | null;
}

interface MarItem {
  id: number;
  bed_id: string;
  patient_id: string;
  patient_name: string;
  bed_number: string;
  room: string;
  medication_name: string;
  dosage: string;
  route: string;
  scheduled_time: string;
  status: 'Pending' | 'Administered' | 'Held' | 'Refused';
  administered_by: string | null;
  administered_at: string | null;
  notes: string | null;
  blood_group: string | null;
  allergies: string | null;
}

interface WardStats {
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  dirty_maintenance_beds: number;
  occupancy_rate: number;
  pending_meds: number;
  administered_meds: number;
  active_codes: number;
  emergency_triage_waiting: number;
}

export default function NurseDashboard({ nurse, onLogout }: NurseDashboardProps) {
  const [activeTab, setActiveTab] = useState<'beds' | 'vitals' | 'mar' | 'handover'>('beds');
  const [beds, setBeds] = useState<BedItem[]>([]);
  const [marList, setMarList] = useState<MarItem[]>([]);
  const [stats, setStats] = useState<WardStats>({
    total_beds: 0,
    occupied_beds: 0,
    available_beds: 0,
    dirty_maintenance_beds: 0,
    occupancy_rate: 0,
    pending_meds: 0,
    administered_meds: 0,
    active_codes: 0,
    emergency_triage_waiting: 0,
  });
  const [activeCodes, setActiveCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Selected Bed for Vitals Entry Modal / Form
  const [selectedBedForVitals, setSelectedBedForVitals] = useState<BedItem | null>(null);
  const [vitalsForm, setVitalsForm] = useState({
    bpSystolic: '120',
    bpDiastolic: '80',
    pulse: '76',
    temperature: '98.4',
    spo2: '99',
    respRate: '16',
    painScale: '0',
    bloodGlucose: '',
    notes: '',
  });

  // Shift Handover State
  const [handovers, setHandovers] = useState<any[]>([]);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [highRiskPatients, setHighRiskPatients] = useState('');
  const [pendingTasks, setPendingTasks] = useState('');

  // Code Alert Modal State
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [codeType, setCodeType] = useState('Rapid Response');
  const [codeBed, setCodeBed] = useState('');

  // Filter Search
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [dashRes, bedsRes, marRes, handoversRes] = await Promise.all([
        fetch('/api/v1/nurse/dashboard'),
        fetch('/api/v1/nurse/beds'),
        fetch('/api/v1/nurse/mar'),
        fetch('/api/v1/nurse/handovers'),
      ]);

      const [dashData, bedsData, marData, handoversData] = await Promise.all([
        dashRes.json(),
        bedsRes.json(),
        marRes.json(),
        handoversRes.json(),
      ]);

      if (dashData.success) {
        setStats(dashData.stats);
        setActiveCodes(dashData.active_codes || []);
      }
      if (bedsData.success) {
        setBeds(bedsData.beds || []);
      }
      if (marData.success) {
        setMarList(marData.mar || []);
      }
      if (handoversData.success) {
        setHandovers(handoversData.handovers || []);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Failed to synchronize inpatient ward telemetry.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(true), 15000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Handle Log Vitals
  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBedForVitals || !selectedBedForVitals.patient_id) {
      setFeedback({ type: 'error', text: 'No patient selected for observation chart.' });
      return;
    }

    try {
      const res = await fetch('/api/v1/nurse/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bed_id: selectedBedForVitals.bed_id,
          patient_id: selectedBedForVitals.patient_id,
          recorded_by: nurse?.name || 'Sister Claire Bennett, RN',
          bp_systolic: vitalsForm.bpSystolic,
          bp_diastolic: vitalsForm.bpDiastolic,
          pulse: vitalsForm.pulse,
          temperature: vitalsForm.temperature,
          spo2: vitalsForm.spo2,
          resp_rate: vitalsForm.respRate,
          pain_scale: vitalsForm.painScale,
          blood_glucose: vitalsForm.bloodGlucose,
          notes: vitalsForm.notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: `Vitals recorded for ${selectedBedForVitals.patient_name} (${selectedBedForVitals.bed_number}).` });
        setSelectedBedForVitals(null);
        fetchDashboardData(true);
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to record vitals.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error saving vitals' });
    }
  };

  // Handle Administer Medication
  const handleAdministerMed = async (id: number, status: 'Administered' | 'Held' | 'Refused') => {
    try {
      const res = await fetch(`/api/v1/nurse/mar/${id}/administer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          administered_by: nurse?.name || 'Sister Claire Bennett, RN',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: `MAR order signed as ${status}.` });
        fetchDashboardData(true);
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to update MAR' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Action failed' });
    }
  };

  // Handle Bed Cleaning Status
  const handleCleanBed = async (bedId: string) => {
    try {
      const res = await fetch(`/api/v1/nurse/beds/${bedId}/clean`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleaning_status: 'Cleaned' }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: 'Bed marked as sanitized & cleaned.' });
        fetchDashboardData(true);
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      // Non-blocking
    }
  };

  // Handle Submit Handover
  const handleSubmitHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverNotes.trim()) return;

    try {
      const res = await fetch('/api/v1/nurse/handovers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ward_id: 'WRD-002',
          shift_name: nurse?.shift || 'Day Nursing Shift (08:00 - 16:00)',
          nurse_name: nurse?.name || 'Sister Claire Bennett, RN',
          handover_notes: handoverNotes,
          high_risk_patients: highRiskPatients,
          pending_tasks: pendingTasks,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: 'Shift handover summary recorded.' });
        setHandoverNotes('');
        setHighRiskPatients('');
        setPendingTasks('');
        fetchDashboardData(true);
        setTimeout(() => setFeedback(null), 3500);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Handover failed' });
    }
  };

  // Handle Trigger Code Alert
  const handleTriggerCode = async () => {
    try {
      const res = await fetch('/api/v1/nurse/code-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code_type: codeType,
          ward: 'Ward B (Cardiac Inpatient)',
          bed_number: codeBed,
          initiator: nurse?.name || 'Sister Claire Bennett, RN',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: `EMERGENCY ALERT: ${codeType} broadcasted!` });
        setCodeModalOpen(false);
        fetchDashboardData(true);
        setTimeout(() => setFeedback(null), 5000);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Code trigger failed' });
    }
  };

  // Handle Resolve Code Alert
  const handleResolveCode = async (id: number) => {
    try {
      await fetch(`/api/v1/nurse/code-alert/${id}/resolve`, { method: 'POST' });
      fetchDashboardData(true);
      setFeedback({ type: 'success', text: 'Emergency Code marked as resolved.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch {}
  };

  const handleSignOut = () => {
    clearStaffSession();
    onLogout?.();
  };

  const filteredBeds = beds.filter((b) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      b.bed_number.toLowerCase().includes(term) ||
      b.patient_name?.toLowerCase().includes(term) ||
      b.diagnosis?.toLowerCase().includes(term) ||
      b.room.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#1F2421] pb-24">
      {/* 1. TOP NURSE STATION & SHIFT STATUS BAR */}
      <header className="sticky top-0 z-40 bg-[#174C40] text-white border-b border-[#113a31] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-emerald-300 border border-white/10 shadow-xs">
              <HeartPulse className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-editorial text-xl font-semibold tracking-wide text-white">
                  {nurse?.name || 'Sister Claire Bennett, RN'}
                </h1>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  Charge Nurse &bull; Ward B
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 font-light flex items-center gap-2 mt-0.5">
                <span>Cardiac Inpatient Ward 4B</span>
                <span>&bull;</span>
                <span>{nurse?.shift || 'Day Shift (08:00 - 16:00)'}</span>
                <span>&bull;</span>
                <span className="font-mono text-emerald-200">ID: {nurse?.staffId || 'NUR-3088'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Rapid Response / Code Alert Trigger */}
            <button
              onClick={() => setCodeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer animate-pulse"
            >
              <Siren className="h-4 w-4" />
              <span>Trigger Code</span>
            </button>

            {/* Quick Link to Reception */}
            <a
              href="/reception"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 text-xs font-medium transition-colors"
            >
              <Users className="h-3.5 w-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Reception</span>
            </a>

            {/* Quick Link to Doctor Desk */}
            <a
              href="/doctor"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 text-xs font-medium transition-colors"
            >
              <Activity className="h-3.5 w-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Doctor Desk</span>
            </a>

            {/* Sync */}
            <button
              onClick={() => fetchDashboardData()}
              disabled={refreshing}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 cursor-pointer"
              title="Refresh Ward Status"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 text-xs transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* SUB NAVIGATION TABS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 border-t border-white/10 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('beds')}
            className={`px-4 py-2.5 text-xs font-medium transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'beds'
                ? 'border-emerald-300 text-white font-semibold bg-white/5'
                : 'border-transparent text-emerald-100/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bed className="h-3.5 w-3.5" />
            <span>Ward Bed Board</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-400 text-[#174C40] font-bold">
              {stats.occupied_beds}/{stats.total_beds}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('mar')}
            className={`px-4 py-2.5 text-xs font-medium transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'mar'
                ? 'border-emerald-300 text-white font-semibold bg-white/5'
                : 'border-transparent text-emerald-100/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Pill className="h-3.5 w-3.5" />
            <span>Medication Administration (MAR)</span>
            {stats.pending_meds > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-400 text-amber-950 font-bold">
                {stats.pending_meds} Due
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('vitals')}
            className={`px-4 py-2.5 text-xs font-medium transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'vitals'
                ? 'border-emerald-300 text-white font-semibold bg-white/5'
                : 'border-transparent text-emerald-100/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Observation &amp; Vitals Chart</span>
          </button>

          <button
            onClick={() => setActiveTab('handover')}
            className={`px-4 py-2.5 text-xs font-medium transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'handover'
                ? 'border-emerald-300 text-white font-semibold bg-white/5'
                : 'border-transparent text-emerald-100/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Shift Handovers</span>
            {handovers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20 text-white">
                {handovers.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ACTIVE CLINICAL CODE BANNER */}
      {activeCodes.length > 0 && (
        <div className="bg-rose-700 text-white p-3 text-xs shadow-md">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold animate-pulse">
              <Siren className="h-5 w-5" />
              <span>ACTIVE CLINICAL ALERT: {activeCodes[0].code_type} at {activeCodes[0].ward} ({activeCodes[0].bed_number || 'Room'})</span>
            </div>
            <button
              onClick={() => handleResolveCode(activeCodes[0].id)}
              className="px-3 py-1 rounded-lg bg-white text-rose-800 text-xs font-semibold hover:bg-rose-100 transition-colors"
            >
              Acknowledge &amp; Resolve
            </button>
          </div>
        </div>
      )}

      {/* NOTIFICATION FEEDBACK TOAST */}
      {feedback && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center justify-between border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{feedback.text}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-zinc-700">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* ========================================================================= */}
        {/* TAB 1: WARD BED BOARD */}
        {/* ========================================================================= */}
        {activeTab === 'beds' && (
          <div className="space-y-6">
            {/* KPI METRIC CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-[#E5E8E6] shadow-xs">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#77817C] block mb-1">
                  Bed Occupancy
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-editorial text-3xl font-semibold text-[#174C40]">
                    {stats.occupied_beds} / {stats.total_beds}
                  </span>
                  <span className="text-xs font-mono font-semibold text-emerald-700">
                    ({stats.occupancy_rate}%)
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E5E8E6] shadow-xs">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#77817C] block mb-1">
                  Available Beds
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-editorial text-3xl font-semibold text-emerald-700">
                    {stats.available_beds}
                  </span>
                  <span className="text-xs text-[#77817C]">Ready for intake</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E5E8E6] shadow-xs">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#77817C] block mb-1">
                  Pending MAR Meds
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-editorial text-3xl font-semibold text-amber-700">
                    {stats.pending_meds}
                  </span>
                  <span className="text-xs text-[#77817C]">Scheduled doses</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E5E8E6] shadow-xs">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#77817C] block mb-1">
                  Emergency Triage
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-editorial text-3xl font-semibold text-[#242A28]">
                    {stats.emergency_triage_waiting}
                  </span>
                  <span className="text-xs text-[#77817C]">ER triage queue</span>
                </div>
              </div>
            </div>

            {/* BED GRID & SEARCH BAR */}
            <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E8E6] pb-4">
                <div>
                  <h2 className="font-editorial text-2xl font-semibold text-[#242A28]">
                    Ward B Inpatient Bed Board
                  </h2>
                  <p className="text-xs text-[#77817C] font-light">
                    Real-time inpatient status, vital signs monitoring, and bed sanitation controls.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="h-4 w-4 text-[#77817C] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search bed, patient, room..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E5E8E6] text-xs focus:border-[#174C40] outline-hidden"
                  />
                </div>
              </div>

              {filteredBeds.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#77817C] italic">
                  No beds match the filter criteria.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredBeds.map((bed) => {
                    const isOccupied = bed.bed_status === 'Occupied';
                    const isAvailable = bed.bed_status === 'Available';

                    return (
                      <div
                        key={bed.bed_id}
                        className={`rounded-3xl border p-5 space-y-4 transition-all shadow-xs ${
                          isOccupied
                            ? 'bg-white border-[#E5E8E6] hover:border-emerald-600/40'
                            : 'bg-[#FAFAF7] border-dashed border-[#d2d6d4]'
                        }`}
                      >
                        {/* Bed Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-9 w-9 rounded-xl bg-emerald-50 text-[#174C40] flex items-center justify-center font-mono font-bold text-xs">
                              {bed.bed_number}
                            </span>
                            <div>
                              <span className="font-mono text-xs font-bold text-[#174C40] block">
                                {bed.room}
                              </span>
                              <span className="text-[10px] text-[#77817C]">{bed.bed_type}</span>
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                              isOccupied
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-zinc-100 text-zinc-600'
                            }`}
                          >
                            ● {bed.bed_status}
                          </span>
                        </div>

                        {/* Patient Information if Occupied */}
                        {isOccupied && (
                          <div className="space-y-2 text-xs pt-2 border-t border-[#F0F2F1]">
                            <div>
                              <p className="font-medium text-[#242A28] text-sm">{bed.patient_name}</p>
                              <p className="text-[11px] text-[#77817C]">
                                MRN: <span className="font-mono text-[#242A28]">{bed.patient_code}</span> &bull; {bed.gender || 'Unknown'} &bull; Blood: <span className="text-rose-700 font-bold">{bed.blood_group || '—'}</span>
                              </p>
                            </div>

                            <div className="p-2.5 rounded-xl bg-[#FAFAF7] border border-[#E5E8E6] text-[11px]">
                              <span className="text-[#77817C] block text-[10px] uppercase font-mono">Admission Diagnosis</span>
                              <span className="font-medium text-[#242A28]">{bed.diagnosis || 'Clinical Inpatient Care'}</span>
                              <span className="text-[#77817C] block mt-0.5">Attending: {bed.admitting_doctor || 'Dr. Aris Thorne'}</span>
                            </div>

                            {/* Allergies Notice */}
                            {bed.allergies && (
                              <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5 font-medium">
                                <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                                <span>Allergy: {bed.allergies}</span>
                              </div>
                            )}

                            {/* Latest Vitals Strip */}
                            <div className="pt-2">
                              <span className="text-[10px] font-mono uppercase text-[#77817C] block mb-1">
                                Latest Observations
                              </span>
                              {bed.bp_systolic ? (
                                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono bg-emerald-50/50 p-2 rounded-xl border border-emerald-100">
                                  <div>
                                    <span className="text-[#77817C] block">BP</span>
                                    <span className="font-bold text-[#174C40]">{bed.bp_systolic}/{bed.bp_diastolic}</span>
                                  </div>
                                  <div>
                                    <span className="text-[#77817C] block">HR</span>
                                    <span className="font-bold text-[#174C40]">{bed.pulse}</span>
                                  </div>
                                  <div>
                                    <span className="text-[#77817C] block">SpO2</span>
                                    <span className="font-bold text-[#174C40]">{bed.spo2}%</span>
                                  </div>
                                  <div>
                                    <span className="text-[#77817C] block">Temp</span>
                                    <span className="font-bold text-[#174C40]">{bed.temperature}°F</span>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[11px] text-[#77817C] italic">No vitals logged yet today.</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Bed Actions */}
                        <div className="pt-3 border-t border-[#F0F2F1] flex items-center gap-2">
                          {isOccupied ? (
                            <>
                              <button
                                onClick={() => setSelectedBedForVitals(bed)}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#174C40] hover:bg-[#123830] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                              >
                                <Activity className="h-3.5 w-3.5" />
                                <span>Record Vitals</span>
                              </button>
                              <button
                                onClick={() => setActiveTab('mar')}
                                className="px-3 py-2 rounded-xl border border-[#E5E8E6] hover:bg-white text-xs text-[#242A28] font-medium transition-colors cursor-pointer"
                              >
                                View MAR
                              </button>
                            </>
                          ) : (
                            <div className="w-full flex items-center justify-between text-xs text-[#77817C]">
                              <span>Sanitation: {bed.cleaning_status}</span>
                              {bed.cleaning_status === 'Dirty' ? (
                                <button
                                  onClick={() => handleCleanBed(bed.bed_id)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold"
                                >
                                  Sanitize
                                </button>
                              ) : (
                                <span className="text-emerald-700 font-mono text-[11px]">Ready</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MEDICATION ADMINISTRATION RECORD (MAR) */}
        {/* ========================================================================= */}
        {activeTab === 'mar' && (
          <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E8E6] pb-4">
              <div>
                <h2 className="font-editorial text-2xl font-semibold text-[#242A28]">
                  Medication Administration Record (MAR)
                </h2>
                <p className="text-xs text-[#77817C] font-light">
                  Physician medication orders, dosage verification, and nursing administration sign-offs.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-mono bg-amber-50 border border-amber-200 text-amber-900 font-semibold">
                {stats.pending_meds} Doses Due
              </span>
            </div>

            {marList.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#77817C] italic">
                No active medication administration orders for this ward shift.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E8E6] text-[#77817C] font-mono uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3">Scheduled Time</th>
                      <th className="py-3 px-3">Bed / Room</th>
                      <th className="py-3 px-3">Patient</th>
                      <th className="py-3 px-3">Medication &amp; Dosage</th>
                      <th className="py-3 px-3">Route</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Action Sign-off</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F2F1]">
                    {marList.map((m) => {
                      const isPending = m.status === 'Pending';

                      return (
                        <tr key={m.id} className="hover:bg-[#FAFAF7]">
                          <td className="py-3.5 px-3 font-mono font-semibold text-[#174C40]">
                            {m.scheduled_time}
                          </td>
                          <td className="py-3.5 px-3 font-mono">
                            <span className="font-bold text-[#242A28]">{m.bed_number}</span>
                            <span className="text-[10px] text-[#77817C] block">{m.room}</span>
                          </td>
                          <td className="py-3.5 px-3 font-medium text-[#242A28]">
                            {m.patient_name}
                            {m.allergies && (
                              <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] bg-rose-100 text-rose-700">
                                Allergy Alert
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-semibold text-[#174C40] block">{m.medication_name}</span>
                            <span className="text-[11px] text-[#4A5350]">{m.dosage}</span>
                          </td>
                          <td className="py-3.5 px-3 text-[#4A5350] font-mono">{m.route}</td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                                m.status === 'Administered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : m.status === 'Pending'
                                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                                  : 'bg-zinc-100 text-zinc-700'
                              }`}
                            >
                              {m.status}
                            </span>
                            {m.administered_by && (
                              <span className="text-[9px] text-[#77817C] block mt-0.5">By {m.administered_by}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleAdministerMed(m.id, 'Administered')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                                >
                                  Administer
                                </button>
                                <button
                                  onClick={() => handleAdministerMed(m.id, 'Held')}
                                  className="px-2 py-1 rounded-lg border border-zinc-300 hover:bg-zinc-100 text-zinc-700 text-[11px] font-medium transition-colors cursor-pointer"
                                >
                                  Hold
                                </button>
                              </div>
                            ) : (
                              <span className="text-emerald-700 font-mono text-[11px]">Completed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: OBSERVATION & VITALS CHART */}
        {/* ========================================================================= */}
        {activeTab === 'vitals' && (
          <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-[#E5E8E6] pb-4">
              <h2 className="font-editorial text-2xl font-semibold text-[#242A28]">
                Inpatient Observation &amp; Vitals Chart
              </h2>
              <p className="text-xs text-[#77817C] font-light">
                Select an admitted patient to record vital parameters, pain score, and nursing progress notes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Select Admitted Patient */}
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#77817C] block">
                  Select Admitted Patient
                </span>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {beds.filter((b) => b.bed_status === 'Occupied').map((b) => (
                    <div
                      key={b.bed_id}
                      onClick={() => setSelectedBedForVitals(b)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        selectedBedForVitals?.bed_id === b.bed_id
                          ? 'border-[#174C40] bg-[#E6EFE9]/40 shadow-xs'
                          : 'border-[#E5E8E6] bg-white hover:bg-[#FAFAF7]'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-xs text-[#242A28]">{b.patient_name}</span>
                        <span className="font-mono text-[11px] font-bold text-[#174C40]">{b.bed_number}</span>
                      </div>
                      <p className="text-[11px] text-[#77817C] mt-0.5">{b.diagnosis}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vitals Input Form */}
              <div className="md:col-span-2">
                {selectedBedForVitals ? (
                  <form onSubmit={handleSaveVitals} className="space-y-5 p-5 rounded-3xl bg-[#FAFAF7] border border-[#E5E8E6]">
                    <div className="flex items-center justify-between border-b border-[#E5E8E6] pb-3">
                      <div>
                        <h3 className="font-editorial text-lg font-semibold text-[#242A28]">
                          Observation Entry for {selectedBedForVitals.patient_name}
                        </h3>
                        <p className="text-xs text-[#77817C]">
                          Bed {selectedBedForVitals.bed_number} &bull; Room {selectedBedForVitals.room} &bull; MRN: {selectedBedForVitals.patient_code}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-100 text-emerald-800 font-semibold">
                        Chart Entry
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#77817C] block mb-1">
                          BP Systolic
                        </label>
                        <input
                          type="number"
                          value={vitalsForm.bpSystolic}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, bpSystolic: e.target.value })}
                          className="w-full p-2 rounded-xl border border-[#E5E8E6] bg-white text-xs font-mono text-center outline-hidden"
                          placeholder="120"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#77817C] block mb-1">
                          BP Diastolic
                        </label>
                        <input
                          type="number"
                          value={vitalsForm.bpDiastolic}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, bpDiastolic: e.target.value })}
                          className="w-full p-2 rounded-xl border border-[#E5E8E6] bg-white text-xs font-mono text-center outline-hidden"
                          placeholder="80"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#77817C] block mb-1">
                          Pulse (bpm)
                        </label>
                        <input
                          type="number"
                          value={vitalsForm.pulse}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, pulse: e.target.value })}
                          className="w-full p-2 rounded-xl border border-[#E5E8E6] bg-white text-xs font-mono text-center outline-hidden"
                          placeholder="76"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#77817C] block mb-1">
                          Temp (°F)
                        </label>
                        <input
                          type="text"
                          value={vitalsForm.temperature}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                          className="w-full p-2 rounded-xl border border-[#E5E8E6] bg-white text-xs font-mono text-center outline-hidden"
                          placeholder="98.4"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#77817C] block mb-1">
                          SpO2 (%)
                        </label>
                        <input
                          type="number"
                          value={vitalsForm.spo2}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: e.target.value })}
                          className="w-full p-2 rounded-xl border border-[#E5E8E6] bg-white text-xs font-mono text-center outline-hidden"
                          placeholder="99"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#77817C] block mb-1">
                          Resp Rate
                        </label>
                        <input
                          type="number"
                          value={vitalsForm.respRate}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, respRate: e.target.value })}
                          className="w-full p-2 rounded-xl border border-[#E5E8E6] bg-white text-xs font-mono text-center outline-hidden"
                          placeholder="16"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#77817C] block mb-1">
                          Pain Scale (0-10)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={vitalsForm.painScale}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, painScale: e.target.value })}
                          className="w-full p-2 rounded-xl border border-[#E5E8E6] bg-white text-xs font-mono text-center outline-hidden"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#77817C] block mb-1">
                          Blood Sugar (mg/dL)
                        </label>
                        <input
                          type="number"
                          value={vitalsForm.bloodGlucose}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, bloodGlucose: e.target.value })}
                          className="w-full p-2 rounded-xl border border-[#E5E8E6] bg-white text-xs font-mono text-center outline-hidden"
                          placeholder="e.g. 110"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[#242A28] block mb-1">
                        Nursing Assessment &amp; Fluid Balance Notes
                      </label>
                      <textarea
                        rows={3}
                        value={vitalsForm.notes}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
                        placeholder="e.g. Normal peripheral perfusion, IV line patent in left forearm, patient tolerating diet..."
                        className="w-full p-3 rounded-xl border border-[#E5E8E6] bg-white text-xs text-[#242A28] outline-hidden"
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#174C40] hover:bg-[#123830] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <Check className="h-4 w-4" />
                        <span>Save Vitals to Chart</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="py-24 text-center border-2 border-dashed border-[#E5E8E6] rounded-3xl space-y-2">
                    <Activity className="h-10 w-10 text-[#77817C] mx-auto opacity-40" />
                    <h4 className="font-editorial text-lg text-[#242A28]">Select a Patient to Chart Vitals</h4>
                    <p className="text-xs text-[#77817C] max-w-sm mx-auto font-light">
                      Click any admitted patient from the list on the left to begin entering observation parameters.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SHIFT HANDOVERS */}
        {/* ========================================================================= */}
        {activeTab === 'handover' && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xs space-y-5">
              <div className="border-b border-[#E5E8E6] pb-4">
                <h2 className="font-editorial text-2xl font-semibold text-[#242A28]">
                  Nursing Shift Handover Log
                </h2>
                <p className="text-xs text-[#77817C] font-light">
                  Structured inter-shift clinical handovers (SBAR format) ensuring patient safety and continuity of care.
                </p>
              </div>

              {/* Handover Submission Form */}
              <form onSubmit={handleSubmitHandover} className="space-y-4 p-5 rounded-3xl bg-[#FAFAF7] border border-[#E5E8E6]">
                <h3 className="font-editorial text-lg font-semibold text-[#242A28]">
                  Record Shift Handover Note ({nurse?.shift || 'Day Shift'})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-[#242A28] block mb-1">
                      High-Risk / Critical Patients Summary
                    </label>
                    <textarea
                      rows={3}
                      value={highRiskPatients}
                      onChange={(e) => setHighRiskPatients(e.target.value)}
                      placeholder="e.g. Bed B-201 (Post-PTCA, check puncture site regularly), Bed B-202 (oxygen dependent)..."
                      className="w-full p-3 rounded-xl border border-[#E5E8E6] bg-white text-xs outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#242A28] block mb-1">
                      Pending Tasks for Incoming Shift
                    </label>
                    <textarea
                      rows={3}
                      value={pendingTasks}
                      onChange={(e) => setPendingTasks(e.target.value)}
                      placeholder="e.g. Fasting blood draw for Bed B-201 tomorrow 06:00 AM, review ECG with Dr. Thorne..."
                      className="w-full p-3 rounded-xl border border-[#E5E8E6] bg-white text-xs outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#242A28] block mb-1">
                    General Ward Observations &amp; Equipment State *
                  </label>
                  <textarea
                    rows={3}
                    value={handoverNotes}
                    onChange={(e) => setHandoverNotes(e.target.value)}
                    placeholder="e.g. 10/10 beds operational, crash cart checked and sealed, defibrillator battery 100%, narcotics log verified."
                    className="w-full p-3 rounded-xl border border-[#E5E8E6] bg-white text-xs outline-hidden"
                    required
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#174C40] hover:bg-[#123830] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    <span>Submit Shift Handover</span>
                  </button>
                </div>
              </form>

              {/* Handover History List */}
              <div className="space-y-3 pt-4">
                <span className="text-xs font-mono uppercase tracking-wider text-[#77817C] block">
                  Past Shift Handovers
                </span>

                {handovers.length === 0 ? (
                  <p className="text-xs text-[#77817C] italic">No handover records yet.</p>
                ) : (
                  <div className="space-y-3">
                    {handovers.map((h) => (
                      <div key={h.id} className="p-4 rounded-2xl bg-white border border-[#E5E8E6] space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-[#174C40]">{h.nurse_name} &bull; {h.shift_name}</span>
                          <span className="text-mono text-[11px] text-[#77817C]">
                            {new Date(h.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p className="text-xs text-[#242A28] leading-relaxed">{h.handover_notes}</p>
                        {h.high_risk_patients && (
                          <div className="text-[11px] text-rose-800 bg-rose-50 p-2 rounded-xl">
                            <strong>High Risk:</strong> {h.high_risk_patients}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CODE TRIGGER MODAL */}
      {codeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#242A28]/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5E8E6] p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setCodeModalOpen(false)}
              className="absolute top-5 right-5 text-[#77817C] hover:text-[#242A28]"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <span className="h-11 w-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <Siren className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-editorial text-xl font-bold text-rose-800">
                  Broadcast Clinical Emergency Code
                </h3>
                <p className="text-xs text-[#77817C]">
                  Triggers audio-visual alarm to crash team &amp; ICU registrars.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-mono uppercase text-[#77817C] block mb-1">
                  Code Alert Protocol
                </label>
                <select
                  value={codeType}
                  onChange={(e) => setCodeType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E5E8E6] text-xs font-semibold"
                >
                  <option value="Rapid Response">Rapid Response (Clinical Deterioration)</option>
                  <option value="Code Blue">Code Blue (Cardiac / Respiratory Arrest)</option>
                  <option value="Code Red">Code Red (Fire / Smoke Hazard)</option>
                  <option value="Code Pink">Code Pink (Infant / Pediatric Alert)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-[#77817C] block mb-1">
                  Bed / Location
                </label>
                <input
                  type="text"
                  value={codeBed}
                  onChange={(e) => setCodeBed(e.target.value)}
                  placeholder="e.g. Bed B-201 or Room 201"
                  className="w-full p-2.5 rounded-xl border border-[#E5E8E6] text-xs"
                />
              </div>
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setCodeModalOpen(false)}
                className="w-1/2 py-2.5 rounded-xl border border-[#E5E8E6] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTriggerCode}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Broadcast Code Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
