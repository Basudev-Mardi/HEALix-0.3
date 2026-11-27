'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  Stethoscope,
  Activity,
  Users,
  Clock,
  Calendar,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  PhoneCall,
  Search,
  FileText,
  Plus,
  Trash2,
  RefreshCw,
  LogOut,
  ChevronRight,
  Shield,
  Heart,
  Droplet,
  Thermometer,
  Gauge,
  Weight,
  Sparkles,
  ArrowRight,
  X,
  Printer,
  History,
  Check,
  Building,
  UserCheck
} from 'lucide-react';
import { type StaffUser, clearStaffSession } from '@/lib/staff-auth';

interface DoctorDashboardProps {
  doctor?: StaffUser | null;
  onLogout?: () => void;
}

interface ActiveToken {
  token_id: number;
  token_display: string;
  token_number: number;
  status: 'Waiting' | 'Now Serving' | 'Consulting' | 'Completed' | 'Cancelled';
  priority: 'Normal' | 'Urgent' | 'Emergency';
  called_at: string | null;
  consultation_start_at: string | null;
  visit_id: number;
  visit_type: string;
  triage_level: string;
  patient_id: string;
  patient_code: string;
  patient_name: string;
  mobile: string;
  gender: string;
  dob: string;
  blood_group: string;
  allergies: string;
  department_name: string;
  doctor_cabin: string;
  elapsed_seconds: number;
}

interface WaitingPatient {
  token_id: number;
  token_display: string;
  token_number: number;
  status: string;
  priority: string;
  created_at: string;
  visit_id: number;
  visit_type: string;
  patient_id: string;
  patient_code: string;
  patient_name: string;
  gender: string;
  dob: string;
  blood_group: string;
  allergies: string;
  queue_pos: number;
}

interface TelemetryStats {
  waiting_count: number;
  consulting_count: number;
  completed_count: number;
  total_assigned_today: number;
  emergency_waiting_count: number;
  avg_consultation_mins: number;
}

interface PrescriptionItem {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface LabOrderItem {
  id: string;
  test_name: string;
  category: string;
  urgency: 'Routine' | 'Urgent' | 'Stat';
}

export default function DoctorDashboard({ doctor, onLogout }: DoctorDashboardProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState<number>(1);
  const [availableDoctorsList, setAvailableDoctorsList] = useState<any[]>([]);
  const [currentDoctorProfile, setCurrentDoctorProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'consultation' | 'appointments' | 'history'>('queue');
  const [availability, setAvailability] = useState<'Available' | 'Busy' | 'On Break' | 'Unavailable'>('Available');
  const [activeToken, setActiveToken] = useState<ActiveToken | null>(null);
  const [stats, setStats] = useState<TelemetryStats>({
    waiting_count: 0,
    consulting_count: 0,
    completed_count: 0,
    total_assigned_today: 0,
    emergency_waiting_count: 0,
    avg_consultation_mins: 10
  });
  const [upcomingWaiting, setUpcomingWaiting] = useState<WaitingPatient[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [completedHistory, setCompletedHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Consultation Desk Form State
  const [vitals, setVitals] = useState({
    bpSystolic: '120',
    bpDiastolic: '80',
    pulse: '72',
    temperature: '98.6',
    spo2: '99',
    respRate: '16',
    weight: '68'
  });
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [examinationFindings, setExaminationFindings] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalAssessment, setClinicalAssessment] = useState('');
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
    {
      id: '1',
      medication_name: 'Paracetamol 650mg',
      dosage: '1 tab',
      frequency: 'TDS (Thrice daily)',
      duration: '3 days',
      instructions: 'Post meals with water'
    }
  ]);
  const [labOrders, setLabOrders] = useState<LabOrderItem[]>([]);
  const [followUpAdvice, setFollowUpAdvice] = useState('Review in OPD if symptoms persist after 5 days.');
  const [followUpDays, setFollowUpDays] = useState('7');

  // Clinical Summary Lookup for Active Patient
  const [patientHistorySummary, setPatientHistorySummary] = useState<any | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Search in History
  const [historySearch, setHistorySearch] = useState('');

  // Parse doctor_id from URL query if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const docIdParam = urlParams.get('doctor_id');
      if (docIdParam && !isNaN(Number(docIdParam))) {
        setSelectedDoctorId(Number(docIdParam));
      }
    }
  }, []);

  // Fetch list of doctors from reception directory for seamless cabin switching
  useEffect(() => {
    fetch('/api/v1/reception/doctors')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.doctors) {
          setAvailableDoctorsList(data.doctors);
        }
      })
      .catch(() => {});
  }, []);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/doctor/dashboard?doctor_id=${selectedDoctorId}`);
      const data = await res.json();
      if (data.success) {
        if (data.doctor) {
          setCurrentDoctorProfile(data.doctor);
          if (data.doctor.availability_status) {
            setAvailability(data.doctor.availability_status);
          }
        }
        setActiveToken(data.active_token);
        setStats(data.telemetry);
        setUpcomingWaiting(data.upcoming_waiting || []);

        // Pre-fill consultation form if active token exists
        if (data.active_token && data.active_token.token_id !== activeToken?.token_id) {
          setChiefComplaint('');
          setExaminationFindings('');
          setDiagnosis('');
          setClinicalAssessment('');
        }
      } else {
        setActionError(data.error || 'Failed to load doctor dashboard telemetry.');
      }
    } catch (err: any) {
      setActionError('Network error connecting to Clinical API: ' + (err.message || 'Server unreachable'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDoctorId, activeToken?.token_id]);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/doctor/appointments?doctor_id=${selectedDoctorId}`);
      const data = await res.json();
      if (data.success) {
        setTodayAppointments(data.appointments || []);
      }
    } catch {
      // Ignore background error
    }
  }, [selectedDoctorId]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/doctor/history?doctor_id=${selectedDoctorId}`);
      const data = await res.json();
      if (data.success) {
        setCompletedHistory(data.history || []);
      }
    } catch {
      // Ignore background error
    }
  }, [selectedDoctorId]);

  useEffect(() => {
    fetchDashboardData();
    fetchAppointments();
    fetchHistory();

    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 12000);

    return () => clearInterval(interval);
  }, [fetchDashboardData, fetchAppointments, fetchHistory]);

  // Load Patient Clinical EHR when activeToken changes or Tab switches to consultation
  useEffect(() => {
    if (activeToken && (activeTab === 'consultation' || activeTab === 'queue')) {
      setLoadingHistory(true);
      fetch(`/api/v1/doctor/patients/${activeToken.patient_id}/clinical-summary?doctor_id=1`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setPatientHistorySummary(data);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingHistory(false));
    }
  }, [activeToken, activeTab]);

  // Handle Availability Toggle
  const handleAvailabilityChange = async (newStatus: 'Available' | 'Busy' | 'On Break' | 'Unavailable') => {
    setAvailability(newStatus);
    try {
      const res = await fetch('/api/v1/doctor/availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_id: selectedDoctorId, availability_status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Cabin availability updated to "${newStatus}".`);
        setTimeout(() => setActionSuccess(null), 3500);
      } else {
        setActionError(data.error || 'Failed to update availability.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error updating availability');
    }
  };

  // Call Next Patient
  const handleCallNext = async () => {
    setActionError(null);
    setActionSuccess(null);
    const cabinLabel = currentDoctorProfile?.room_or_cabin || `Cabin ${selectedDoctorId}`;
    try {
      const res = await fetch('/api/v1/doctor/call-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_id: selectedDoctorId, cabin: cabinLabel })
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Calling ${data.token.token_display} (${data.token.patient_name}) to ${cabinLabel}.`);
        setActiveToken(data.token);
        fetchDashboardData(true);
        setActiveTab('queue');
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setActionError(data.error || 'No patients currently waiting in queue.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Call next failed');
    }
  };

  // Update Active Token Status (e.g. start consultation)
  const handleUpdateTokenStatus = async (tokenId: number, newStatus: 'Consulting' | 'Completed' | 'Waiting') => {
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/doctor/tokens/${tokenId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_id: selectedDoctorId, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        if (newStatus === 'Consulting') {
          setActiveTab('consultation');
          setActionSuccess(`Consultation in progress for ${activeToken?.token_display}.`);
        } else {
          setActionSuccess(`Token ${activeToken?.token_display} updated to ${newStatus}.`);
        }
        fetchDashboardData(true);
        setTimeout(() => setActionSuccess(null), 3500);
      } else {
        setActionError(data.error || 'Failed to update token status.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Update failed');
    }
  };

  // Add prescription item
  const handleAddPrescription = () => {
    setPrescriptions((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        medication_name: '',
        dosage: '1 tab',
        frequency: 'BD (Twice daily)',
        duration: '5 days',
        instructions: 'After food'
      }
    ]);
  };

  // Remove prescription item
  const handleRemovePrescription = (id: string) => {
    setPrescriptions((prev) => prev.filter((p) => p.id !== id));
  };

  // Add Lab Order
  const handleAddLabOrder = (testName: string, category: string) => {
    if (labOrders.some((l) => l.test_name === testName)) return;
    setLabOrders((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        test_name: testName,
        category,
        urgency: 'Routine'
      }
    ]);
  };

  const handleRemoveLabOrder = (id: string) => {
    setLabOrders((prev) => prev.filter((l) => l.id !== id));
  };

  // Complete Consultation & Finalize EHR
  const handleFinalizeConsultation = async () => {
    if (!activeToken) {
      setActionError('No active patient consultation currently in session.');
      return;
    }

    if (!diagnosis.trim()) {
      setActionError('Primary diagnosis or clinical assessment is required before finalizing.');
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + (parseInt(followUpDays, 10) || 7));

    const payload = {
      doctor_id: selectedDoctorId,
      token_id: activeToken.token_id,
      visit_id: activeToken.visit_id,
      patient_id: activeToken.patient_id,
      chief_complaint: chiefComplaint.trim() || 'General OPD Consultation',
      vitals: {
        bp: `${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg`,
        pulse: `${vitals.pulse} bpm`,
        temperature: `${vitals.temperature} °F`,
        spo2: `${vitals.spo2} %`,
        resp_rate: `${vitals.respRate} /min`,
        weight: `${vitals.weight} kg`
      },
      examination_findings: examinationFindings.trim(),
      diagnosis: diagnosis.trim(),
      clinical_assessment: clinicalAssessment.trim(),
      treatment_plan: `Prescribed medications & routine clinical advice. ${followUpAdvice}`,
      follow_up_advice: followUpAdvice.trim(),
      follow_up_date: followUpDate.toISOString().split('T')[0],
      prescriptions: prescriptions.filter((p) => p.medication_name.trim().length > 0),
      lab_orders: labOrders.map((o) => ({
        test_name: o.test_name,
        category: o.category,
        urgency: o.urgency
      }))
    };

    try {
      const res = await fetch('/api/v1/doctor/consultations/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Consultation finalized successfully for ${activeToken.patient_name} (${activeToken.token_display})!`);
        setActiveToken(null);
        setActiveTab('queue');
        fetchDashboardData(true);
        fetchHistory();
        setTimeout(() => setActionSuccess(null), 5000);
      } else {
        setActionError(data.error || 'Failed to complete consultation.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error completing consultation');
    }
  };

  const handleSignOut = () => {
    clearStaffSession();
    onLogout?.();
  };

  const filteredHistory = completedHistory.filter((item) => {
    if (!historySearch.trim()) return true;
    const term = historySearch.toLowerCase();
    return (
      item.patient_name?.toLowerCase().includes(term) ||
      item.token_display?.toLowerCase().includes(term) ||
      item.diagnosis?.toLowerCase().includes(term) ||
      item.patient_code?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#1F2421] pb-24">
      {/* 1. DOCTOR TOP IDENTITY & CABIN STATUS BAR */}
      <header className="sticky top-0 z-40 bg-[#174C40] text-white border-b border-[#113a31] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-emerald-300 border border-white/10 shadow-xs">
              <Stethoscope className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-editorial text-xl font-semibold tracking-wide text-white">
                  {currentDoctorProfile?.name || doctor?.name || 'Dr. Aris Thorne, MD'}
                </h1>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  {currentDoctorProfile?.room_or_cabin || `Cabin ${selectedDoctorId}`}
                </span>

                {/* Doctor Switcher Dropdown */}
                {availableDoctorsList.length > 0 && (
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => {
                      const newId = Number(e.target.value);
                      setSelectedDoctorId(newId);
                      setActiveToken(null);
                    }}
                    className="ml-2 text-[11px] font-mono bg-white/10 text-white rounded-lg px-2 py-0.5 border border-white/20 focus:outline-hidden cursor-pointer"
                    title="Switch doctor profile or cabin"
                  >
                    {availableDoctorsList.map((doc) => (
                      <option key={doc.id} value={doc.id} className="text-zinc-900">
                        {doc.name} ({doc.room_or_cabin || `Cabin ${doc.id}`})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <p className="text-xs text-emerald-100/80 font-light flex items-center gap-2 mt-0.5">
                <span>{currentDoctorProfile?.department_name || currentDoctorProfile?.specialty || 'Cardiology & Internal Medicine'}</span>
                <span>&bull;</span>
                <span>{currentDoctorProfile?.room_or_cabin || `Cabin ${selectedDoctorId}`}</span>
                <span>&bull;</span>
                <span className="font-mono text-emerald-200">ID: {doctor?.staffId || `DOC-${selectedDoctorId.toString().padStart(3, '0')}`}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Switch to Reception Portal */}
            <a
              href="/staff/receptionist"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 text-xs font-medium transition-colors"
              title="Switch to Reception Portal"
            >
              <Users className="h-3.5 w-3.5 text-emerald-300" />
              <span className="hidden md:inline">Reception Front Desk</span>
            </a>

            {/* Availability Selector */}
            <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/10">
              <label htmlFor="availability-select" className="text-[11px] font-mono text-emerald-200 px-2 uppercase tracking-wider">
                Status:
              </label>
              <select
                id="availability-select"
                aria-label="Doctor cabin availability status"
                value={availability}
                onChange={(e) => handleAvailabilityChange(e.target.value as any)}
                className={`text-xs font-medium rounded-lg px-2.5 py-1 transition-all outline-hidden cursor-pointer ${
                  availability === 'Available'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : availability === 'Busy'
                    ? 'bg-amber-600 text-white font-semibold'
                    : availability === 'On Break'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-600 text-white'
                }`}
              >
                <option value="Available">Available (Accepting)</option>
                <option value="Busy">In Consultation (Busy)</option>
                <option value="On Break">On Break</option>
                <option value="Unavailable">Off Duty</option>
              </select>
            </div>

            {/* Manual Sync */}
            <button
              onClick={() => fetchDashboardData()}
              disabled={refreshing}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 cursor-pointer"
              title="Refresh Queue Telemetry"
              aria-label="Refresh Queue Telemetry"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Logout */}
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
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2.5 text-xs font-medium transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'queue'
                ? 'border-emerald-300 text-white font-semibold bg-white/5'
                : 'border-transparent text-emerald-100/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Cabin OPD Queue</span>
            {stats.waiting_count > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-400 text-[#174C40] font-bold">
                {stats.waiting_count}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('consultation')}
            className={`px-4 py-2.5 text-xs font-medium transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'consultation'
                ? 'border-emerald-300 text-white font-semibold bg-white/5'
                : 'border-transparent text-emerald-100/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Clinical Consultation (EHR)</span>
            {activeToken && (
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('appointments');
              fetchAppointments();
            }}
            className={`px-4 py-2.5 text-xs font-medium transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'appointments'
                ? 'border-emerald-300 text-white font-semibold bg-white/5'
                : 'border-transparent text-emerald-100/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Today&apos;s Appointments</span>
            {todayAppointments.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20 text-white">
                {todayAppointments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              fetchHistory();
            }}
            className={`px-4 py-2.5 text-xs font-medium transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'border-emerald-300 text-white font-semibold bg-white/5'
                : 'border-transparent text-emerald-100/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Consultation History</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20 text-white">
              {stats.completed_count}
            </span>
          </button>
        </div>
      </header>

      {/* NOTIFICATION FEEDBACK BANNERS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 space-y-2">
        {actionError && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-800 flex items-start justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span className="font-medium">{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-500 hover:text-rose-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {actionSuccess && (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-start justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* ========================================================================= */}
        {/* TAB 1: CABIN OPD QUEUE & PATIENT CALLING */}
        {/* ========================================================================= */}
        {activeTab === 'queue' && (
          <div className="space-y-6">
            {/* KPI METRIC STRIP */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-[#E5E8E6] shadow-xs">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#77817C] block mb-1">
                  Patients Waiting
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-editorial text-3xl font-semibold text-[#174C40]">
                    {stats.waiting_count}
                  </span>
                  {stats.emergency_waiting_count > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-100 text-rose-700 font-bold animate-pulse">
                      {stats.emergency_waiting_count} Emergency
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E5E8E6] shadow-xs">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#77817C] block mb-1">
                  Now In Cabin
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-editorial text-3xl font-semibold text-[#242A28]">
                    {stats.consulting_count}
                  </span>
                  <span className="text-xs text-[#77817C]">Active Session</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E5E8E6] shadow-xs">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#77817C] block mb-1">
                  Completed Today
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-editorial text-3xl font-semibold text-emerald-700">
                    {stats.completed_count}
                  </span>
                  <span className="text-xs text-[#77817C]">Consulted</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E5E8E6] shadow-xs">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#77817C] block mb-1">
                  Avg Time / Patient
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-editorial text-3xl font-semibold text-[#242A28]">
                    {stats.avg_consultation_mins}
                  </span>
                  <span className="text-xs text-[#77817C]">mins / visit</span>
                </div>
              </div>
            </div>

            {/* ACTIVE SERVING PATIENT CARD */}
            <div className="rounded-3xl border-2 border-emerald-600/30 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E5E8E6]">
                <div className="flex items-center gap-3">
                  <span className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#174C40]">
                    <Activity className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#174C40] font-semibold">
                      Cabin 1 &bull; Active Patient Desk
                    </span>
                    <h2 className="font-editorial text-2xl font-semibold text-[#242A28]">
                      {activeToken ? `Serving: ${activeToken.patient_name}` : 'Cabin Currently Empty'}
                    </h2>
                  </div>
                </div>

                {/* Main Action: One-Click Call Next Patient */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCallNext}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#174C40] hover:bg-[#123830] text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <PhoneCall className="h-4 w-4" />
                    <span>Call Next Patient</span>
                  </button>
                </div>
              </div>

              {activeToken ? (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Column 1: Patient Identity */}
                  <div className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-mono font-bold text-[#174C40]">
                        {activeToken.token_display}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold font-mono ${
                          activeToken.status === 'Consulting'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                        }`}
                      >
                        {activeToken.status === 'Consulting' ? '● In Consultation' : '● Called to Cabin'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#4A5350]">
                      <p className="font-medium text-sm text-[#242A28]">{activeToken.patient_name}</p>
                      <p>MRN: <span className="font-mono text-[#242A28]">{activeToken.patient_code}</span></p>
                      <p>Gender / DOB: <span className="text-[#242A28]">{activeToken.gender || 'Unknown'} &bull; {activeToken.dob || 'N/A'}</span></p>
                      <p>Blood Group: <span className="font-mono font-bold text-rose-700">{activeToken.blood_group || 'Unknown'}</span></p>
                      <p>Mobile: <span className="font-mono">{activeToken.mobile || 'N/A'}</span></p>
                    </div>

                    {/* Allergies Highlight */}
                    {activeToken.allergies && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                        <span className="font-semibold block uppercase text-[10px] tracking-wider text-rose-700">
                          Critical Allergy Alert:
                        </span>
                        <span>{activeToken.allergies}</span>
                      </div>
                    )}
                  </div>

                  {/* Column 2: Visit & Triage */}
                  <div className="space-y-3 lg:border-l lg:border-r border-[#E5E8E6] lg:px-6">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#77817C] block">
                      Encounter Details
                    </span>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-[#F0F2F1]">
                        <span className="text-[#77817C]">Encounter Type:</span>
                        <span className="font-medium text-[#242A28]">{activeToken.visit_type}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#F0F2F1]">
                        <span className="text-[#77817C]">Triage Category:</span>
                        <span className={`font-semibold ${activeToken.priority === 'Emergency' ? 'text-rose-600' : 'text-[#174C40]'}`}>
                          {activeToken.triage_level} ({activeToken.priority})
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#F0F2F1]">
                        <span className="text-[#77817C]">Cabin Location:</span>
                        <span className="font-medium text-[#242A28]">{activeToken.doctor_cabin}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#77817C]">Time Elapsed:</span>
                        <span className="font-mono font-semibold text-[#242A28]">
                          {Math.floor((activeToken.elapsed_seconds || 0) / 60)}m {((activeToken.elapsed_seconds || 0) % 60)}s
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Cabin Actions */}
                  <div className="space-y-3 flex flex-col justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#77817C] block">
                      Cabin Workflow Actions
                    </span>

                    <div className="space-y-2.5">
                      {activeToken.status === 'Now Serving' ? (
                        <button
                          onClick={() => handleUpdateTokenStatus(activeToken.token_id, 'Consulting')}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          <Activity className="h-4 w-4" />
                          <span>Begin Consultation (Enter EHR)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveTab('consultation')}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          <FileText className="h-4 w-4" />
                          <span>Open Consultation Desk (EHR)</span>
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleUpdateTokenStatus(activeToken.token_id, 'Waiting')}
                          className="px-3 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-50 text-xs text-zinc-700 font-medium transition-colors cursor-pointer text-center"
                        >
                          Send Back to Waiting
                        </button>

                        <button
                          onClick={() => handleFinalizeConsultation()}
                          className="px-3 py-2 rounded-xl bg-[#174C40] hover:bg-[#11392f] text-xs text-white font-medium transition-colors cursor-pointer text-center"
                        >
                          Fast Complete Visit
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#77817C] font-light italic">
                      Clicking &quot;Begin Consultation&quot; opens the clinical prescription desk and locks the patient record.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <h3 className="font-editorial text-lg text-[#242A28]">No patient currently in Cabin 1</h3>
                  <p className="text-xs text-[#77817C] max-w-md mx-auto font-light">
                    Click &quot;Call Next Patient&quot; to notify the next waiting patient in line on digital displays and start consultation.
                  </p>
                </div>
              )}
            </div>

            {/* WAITING QUEUE TABLE */}
            <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-editorial text-xl font-semibold text-[#242A28]">
                    Live OPD Waiting Queue (Cabin 1)
                  </h3>
                  <p className="text-xs text-[#77817C] font-light">
                    Chronologically prioritized list of patients waiting for consultation.
                  </p>
                </div>
                <span className="text-xs font-mono text-[#77817C]">
                  {upcomingWaiting.length} patients in line
                </span>
              </div>

              {upcomingWaiting.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#77817C] italic">
                  No patients are currently waiting in this department queue.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E8E6] text-[#77817C] font-mono uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-3">Position</th>
                        <th className="py-3 px-3">Token</th>
                        <th className="py-3 px-3">Patient Name</th>
                        <th className="py-3 px-3">MRN</th>
                        <th className="py-3 px-3">Priority / Triage</th>
                        <th className="py-3 px-3">Blood Group</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F2F1]">
                      {upcomingWaiting.map((pat) => (
                        <tr key={pat.token_id} className="hover:bg-[#FAFAF7] transition-colors">
                          <td className="py-3 px-3 font-mono text-[#77817C]">#{pat.queue_pos}</td>
                          <td className="py-3 px-3 font-mono font-bold text-[#174C40]">{pat.token_display}</td>
                          <td className="py-3 px-3 font-medium text-[#242A28]">
                            {pat.patient_name}
                            {pat.allergies && (
                              <span className="ml-2 px-1.5 py-0.5 rounded-full text-[9px] bg-rose-100 text-rose-700 font-normal">
                                Allergy
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-[#77817C]">{pat.patient_code}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                pat.priority === 'Emergency'
                                  ? 'bg-rose-100 text-rose-700 animate-pulse font-bold'
                                  : pat.priority === 'Urgent'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-50 text-emerald-800'
                              }`}
                            >
                              {pat.priority}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-rose-700">{pat.blood_group || '—'}</td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/v1/doctor/tokens/${pat.token_id}/status`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ doctor_id: 1, status: 'Now Serving' })
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    setActionSuccess(`Called ${pat.token_display} to Cabin 1.`);
                                    fetchDashboardData(true);
                                    setTimeout(() => setActionSuccess(null), 3500);
                                  }
                                } catch (e: any) {
                                  setActionError(e.message || 'Call failed');
                                }
                              }}
                              className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#174C40] border border-emerald-200 text-xs font-medium transition-colors cursor-pointer"
                            >
                              Call In
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ACTIVE CLINICAL CONSULTATION (EHR WORKSPACE) */}
        {/* ========================================================================= */}
        {activeTab === 'consultation' && (
          <div className="space-y-6">
            {!activeToken ? (
              <div className="p-12 text-center rounded-3xl border border-[#E5E8E6] bg-white space-y-4 shadow-xs">
                <div className="h-14 w-14 rounded-full bg-emerald-50 text-[#174C40] flex items-center justify-center mx-auto">
                  <Stethoscope className="h-7 w-7" />
                </div>
                <h3 className="font-editorial text-2xl font-semibold text-[#242A28]">
                  No Active Patient in Cabin
                </h3>
                <p className="text-xs text-[#77817C] max-w-md mx-auto font-light">
                  To open the Clinical Consultation &amp; EHR Desk, please call a waiting patient into Cabin 1 from the Cabin OPD Queue tab.
                </p>
                <button
                  onClick={handleCallNext}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#174C40] text-white text-xs font-semibold shadow-xs hover:bg-[#123930] transition-colors cursor-pointer"
                >
                  <PhoneCall className="h-4 w-4" />
                  <span>Call Next Patient to Start</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT 2 COLS: CLINICAL NOTE & RX BUILDER */}
                <div className="lg:col-span-2 space-y-6">
                  {/* PATIENT HEADER BANNER */}
                  <div className="p-5 rounded-3xl bg-white border border-[#E5E8E6] shadow-xs flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-[#174C40] text-white flex items-center justify-center font-mono font-bold text-lg">
                        {activeToken.patient_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-editorial text-2xl font-semibold text-[#242A28]">
                            {activeToken.patient_name}
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#E6EFE9] text-[#174C40]">
                            {activeToken.token_display}
                          </span>
                        </div>
                        <p className="text-xs text-[#77817C] mt-0.5 font-light">
                          MRN: <span className="font-mono text-[#242A28]">{activeToken.patient_code}</span> &bull; {activeToken.gender || 'Unknown'} &bull; Blood: <span className="text-rose-700 font-mono font-bold">{activeToken.blood_group || '—'}</span> &bull; Age/DOB: {activeToken.dob || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {activeToken.allergies && (
                      <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                        <span className="font-semibold">Allergy:</span>
                        <span>{activeToken.allergies}</span>
                      </div>
                    )}
                  </div>

                  {/* 1. VITALS ENTRY */}
                  <div className="p-6 rounded-3xl bg-white border border-[#E5E8E6] shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-editorial text-lg font-semibold text-[#242A28] flex items-center gap-2">
                        <Activity className="h-4 w-4 text-[#174C40]" />
                        <span>Encounter Vitals</span>
                      </h3>
                      <span className="text-[11px] font-mono text-[#77817C]">OPD Screening</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#77817C] block mb-1">
                          BP Sys/Dia
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={vitals.bpSystolic}
                            onChange={(e) => setVitals({ ...vitals, bpSystolic: e.target.value })}
                            className="w-full px-2 py-1.5 rounded-lg border border-[#E5E8E6] text-xs font-mono text-center focus:border-[#174C40] outline-hidden"
                            placeholder="120"
                          />
                          <span className="text-xs text-[#77817C]">/</span>
                          <input
                            type="text"
                            value={vitals.bpDiastolic}
                            onChange={(e) => setVitals({ ...vitals, bpDiastolic: e.target.value })}
                            className="w-full px-2 py-1.5 rounded-lg border border-[#E5E8E6] text-xs font-mono text-center focus:border-[#174C40] outline-hidden"
                            placeholder="80"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#77817C] block mb-1">
                          Pulse (bpm)
                        </label>
                        <input
                          type="text"
                          value={vitals.pulse}
                          onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                          className="w-full px-2 py-1.5 rounded-lg border border-[#E5E8E6] text-xs font-mono text-center focus:border-[#174C40] outline-hidden"
                          placeholder="72"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#77817C] block mb-1">
                          Temp (°F)
                        </label>
                        <input
                          type="text"
                          value={vitals.temperature}
                          onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                          className="w-full px-2 py-1.5 rounded-lg border border-[#E5E8E6] text-xs font-mono text-center focus:border-[#174C40] outline-hidden"
                          placeholder="98.6"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#77817C] block mb-1">
                          SpO2 (%)
                        </label>
                        <input
                          type="text"
                          value={vitals.spo2}
                          onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                          className="w-full px-2 py-1.5 rounded-lg border border-[#E5E8E6] text-xs font-mono text-center focus:border-[#174C40] outline-hidden"
                          placeholder="99"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#77817C] block mb-1">
                          Resp Rate
                        </label>
                        <input
                          type="text"
                          value={vitals.respRate}
                          onChange={(e) => setVitals({ ...vitals, respRate: e.target.value })}
                          className="w-full px-2 py-1.5 rounded-lg border border-[#E5E8E6] text-xs font-mono text-center focus:border-[#174C40] outline-hidden"
                          placeholder="16"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#77817C] block mb-1">
                          Weight (kg)
                        </label>
                        <input
                          type="text"
                          value={vitals.weight}
                          onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                          className="w-full px-2 py-1.5 rounded-lg border border-[#E5E8E6] text-xs font-mono text-center focus:border-[#174C40] outline-hidden"
                          placeholder="68"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. CHIEF COMPLAINT & EXAMINATION */}
                  <div className="p-6 rounded-3xl bg-white border border-[#E5E8E6] shadow-xs space-y-4">
                    <h3 className="font-editorial text-lg font-semibold text-[#242A28]">
                      Clinical Examination &amp; Notes
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-[#242A28] block mb-1">
                          Chief Complaints (Reported Symptoms)
                        </label>
                        <textarea
                          rows={3}
                          value={chiefComplaint}
                          onChange={(e) => setChiefComplaint(e.target.value)}
                          placeholder="e.g. Chest tightness radiating to left shoulder for 2 days; exertional dyspnea..."
                          className="w-full p-3 rounded-xl border border-[#E5E8E6] text-xs text-[#242A28] focus:border-[#174C40] outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-[#242A28] block mb-1">
                          Physical Examination Findings
                        </label>
                        <textarea
                          rows={3}
                          value={examinationFindings}
                          onChange={(e) => setExaminationFindings(e.target.value)}
                          placeholder="e.g. S1/S2 heard, no murmurs. Chest clear on auscultation. Bilateral pedal edema absent..."
                          className="w-full p-3 rounded-xl border border-[#E5E8E6] text-xs text-[#242A28] focus:border-[#174C40] outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="text-xs font-semibold text-[#174C40] block mb-1">
                          Primary Clinical Diagnosis *
                        </label>
                        <input
                          type="text"
                          value={diagnosis}
                          onChange={(e) => setDiagnosis(e.target.value)}
                          placeholder="e.g. Essential Hypertension (ICD-10 I10), Stable Angina"
                          className="w-full px-3 py-2 rounded-xl border-2 border-emerald-600/30 text-xs font-medium text-[#242A28] focus:border-[#174C40] outline-hidden bg-[#FAFAF7]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-[#242A28] block mb-1">
                          Clinical Assessment &amp; Prognosis
                        </label>
                        <input
                          type="text"
                          value={clinicalAssessment}
                          onChange={(e) => setClinicalAssessment(e.target.value)}
                          placeholder="e.g. Stable hemodynamic parameters. Low risk of acute coronary syndrome."
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E8E6] text-xs text-[#242A28] focus:border-[#174C40] outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. MULTI-DRUG PRESCRIPTION BUILDER */}
                  <div className="p-6 rounded-3xl bg-white border border-[#E5E8E6] shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-editorial text-lg font-semibold text-[#242A28]">
                          Digital Prescription (Rx)
                        </h3>
                        <p className="text-xs text-[#77817C] font-light">
                          Formulate medications with dosage, frequency, and pharmacy instructions.
                        </p>
                      </div>

                      <button
                        onClick={handleAddPrescription}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-[#174C40] border border-emerald-200 text-xs font-medium hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Medication</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {prescriptions.map((rx, idx) => (
                        <div key={rx.id} className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <div className="sm:col-span-2">
                              <label className="text-[10px] font-mono text-[#77817C] block mb-0.5">
                                Medication Name &amp; Strength #{idx + 1}
                              </label>
                              <input
                                type="text"
                                value={rx.medication_name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPrescriptions((prev) =>
                                    prev.map((p) => (p.id === rx.id ? { ...p, medication_name: val } : p))
                                  );
                                }}
                                placeholder="e.g. Amlodipine 5mg or Metoprolol 25mg"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5E8E6] text-xs font-medium text-[#242A28] focus:border-[#174C40] outline-hidden bg-white"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-mono text-[#77817C] block mb-0.5">
                                Dosage &amp; Route
                              </label>
                              <input
                                type="text"
                                value={rx.dosage}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPrescriptions((prev) =>
                                    prev.map((p) => (p.id === rx.id ? { ...p, dosage: val } : p))
                                  );
                                }}
                                placeholder="e.g. 1 tablet oral"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5E8E6] text-xs text-[#242A28] focus:border-[#174C40] outline-hidden bg-white"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-mono text-[#77817C] block mb-0.5">
                                Frequency
                              </label>
                              <select
                                value={rx.frequency}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPrescriptions((prev) =>
                                    prev.map((p) => (p.id === rx.id ? { ...p, frequency: val } : p))
                                  );
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5E8E6] text-xs text-[#242A28] focus:border-[#174C40] outline-hidden bg-white"
                              >
                                <option value="OD (Once daily)">OD (Once daily)</option>
                                <option value="BD (Twice daily)">BD (Twice daily)</option>
                                <option value="TDS (Thrice daily)">TDS (Thrice daily)</option>
                                <option value="QID (4 times daily)">QID (4 times daily)</option>
                                <option value="SOS (As needed)">SOS (As needed)</option>
                                <option value="HS (At bedtime)">HS (At bedtime)</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <div className="w-1/3">
                              <input
                                type="text"
                                value={rx.duration}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPrescriptions((prev) =>
                                    prev.map((p) => (p.id === rx.id ? { ...p, duration: val } : p))
                                  );
                                }}
                                placeholder="Duration (e.g. 14 days)"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5E8E6] text-xs text-[#242A28] focus:border-[#174C40] outline-hidden bg-white"
                              />
                            </div>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={rx.instructions}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPrescriptions((prev) =>
                                    prev.map((p) => (p.id === rx.id ? { ...p, instructions: val } : p))
                                  );
                                }}
                                placeholder="Instructions (e.g. After breakfast with warm water)"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5E8E6] text-xs text-[#242A28] focus:border-[#174C40] outline-hidden bg-white"
                              />
                            </div>
                            {prescriptions.length > 1 && (
                              <button
                                onClick={() => handleRemovePrescription(rx.id)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                                title="Remove medication"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4. LAB & RADIOLOGY ORDERS */}
                  <div className="p-6 rounded-3xl bg-white border border-[#E5E8E6] shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-editorial text-lg font-semibold text-[#242A28]">
                          Diagnostic &amp; Lab Orders
                        </h3>
                        <p className="text-xs text-[#77817C] font-light">
                          Select investigative tests to route directly to hospital laboratory &amp; imaging departments.
                        </p>
                      </div>
                    </div>

                    {/* Quick selection chips */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: '12-Lead Electrocardiogram (ECG)', cat: 'Cardiology' },
                        { name: '2D Echocardiography', cat: 'Imaging' },
                        { name: 'Complete Blood Count (CBC)', cat: 'Hematology' },
                        { name: 'Lipid Profile', cat: 'Biochemistry' },
                        { name: 'Serum Creatinine & BUN', cat: 'Biochemistry' },
                        { name: 'Troponin I (High Sensitivity)', cat: 'Biochemistry' },
                        { name: 'HbA1c Glycated Hemoglobin', cat: 'Biochemistry' }
                      ].map((test) => (
                        <button
                          key={test.name}
                          onClick={() => handleAddLabOrder(test.name, test.cat)}
                          className="px-2.5 py-1 rounded-full border border-[#E5E8E6] hover:border-[#174C40] bg-white text-[11px] text-[#4A5350] hover:text-[#174C40] transition-colors cursor-pointer"
                        >
                          + {test.name}
                        </button>
                      ))}
                    </div>

                    {labOrders.length > 0 && (
                      <div className="divide-y divide-[#E5E8E6] border border-[#E5E8E6] rounded-2xl overflow-hidden bg-[#FAFAF7]">
                        {labOrders.map((ord) => (
                          <div key={ord.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                            <div>
                              <span className="font-medium text-[#242A28]">{ord.test_name}</span>
                              <span className="text-[10px] text-[#77817C] font-mono ml-2">
                                ({ord.category})
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                value={ord.urgency}
                                onChange={(e) => {
                                  const val = e.target.value as any;
                                  setLabOrders((prev) =>
                                    prev.map((o) => (o.id === ord.id ? { ...o, urgency: val } : o))
                                  );
                                }}
                                className="px-2 py-1 rounded-lg border border-[#E5E8E6] text-[11px] bg-white font-mono"
                              >
                                <option value="Routine">Routine</option>
                                <option value="Urgent">Urgent</option>
                                <option value="Stat">Stat (Immediate)</option>
                              </select>

                              <button
                                onClick={() => handleRemoveLabOrder(ord.id)}
                                className="p-1 text-rose-500 hover:text-rose-700"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 5. FOLLOW-UP & FINAL ACTIONS */}
                  <div className="p-6 rounded-3xl bg-white border border-[#E5E8E6] shadow-xs space-y-4">
                    <h3 className="font-editorial text-lg font-semibold text-[#242A28]">
                      Follow-up &amp; Discharge Advice
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-[#242A28] block mb-1">
                          Doctor Advice &amp; Lifestyle Precautions
                        </label>
                        <input
                          type="text"
                          value={followUpAdvice}
                          onChange={(e) => setFollowUpAdvice(e.target.value)}
                          placeholder="e.g. Low salt diet, regular brisk walking 30 mins/day, SOS review."
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E8E6] text-xs text-[#242A28] focus:border-[#174C40] outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-[#242A28] block mb-1">
                          Follow-up In (Days)
                        </label>
                        <input
                          type="number"
                          value={followUpDays}
                          onChange={(e) => setFollowUpDays(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E8E6] text-xs font-mono text-[#242A28] focus:border-[#174C40] outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#E5E8E6] flex flex-wrap items-center justify-between gap-4">
                      <div className="text-xs text-[#77817C] font-light">
                        Finalizing will save the diagnosis, record medical history, create digital prescriptions, and release the cabin for the next patient.
                      </div>

                      <button
                        onClick={handleFinalizeConsultation}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#174C40] hover:bg-[#123830] text-white text-xs font-semibold shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Complete &amp; Finalize Consultation</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT 1 COL: PATIENT CLINICAL HISTORY EHR SIDEBAR */}
                <div className="space-y-6">
                  <div className="p-6 rounded-3xl bg-white border border-[#E5E8E6] shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E5E8E6] pb-3">
                      <h3 className="font-editorial text-lg font-semibold text-[#242A28] flex items-center gap-2">
                        <History className="h-4 w-4 text-[#174C40]" />
                        <span>Patient EHR History</span>
                      </h3>
                      {loadingHistory && (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#77817C]" />
                      )}
                    </div>

                    {patientHistorySummary ? (
                      <div className="space-y-4 text-xs">
                        {/* Allergies Block */}
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#77817C] block mb-1">
                            Documented Allergies
                          </span>
                          {patientHistorySummary.allergies ? (
                            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-medium">
                              {patientHistorySummary.allergies}
                            </div>
                          ) : (
                            <span className="text-zinc-500 italic">No allergies documented.</span>
                          )}
                        </div>

                        {/* Past Diagnoses */}
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#77817C] block mb-1">
                            Past Medical Conditions ({patientHistorySummary.medical_history?.length || 0})
                          </span>
                          {patientHistorySummary.medical_history?.length > 0 ? (
                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                              {patientHistorySummary.medical_history.map((h: any, i: number) => (
                                <div key={i} className="p-2 rounded-xl bg-[#FAFAF7] border border-[#E5E8E6]">
                                  <p className="font-medium text-[#242A28]">{h.title || h.record_type}</p>
                                  <p className="text-[10px] text-[#77817C]">{h.recorded_date} &bull; Dr. {h.doctor_name || 'Staff'}</p>
                                  {h.summary && <p className="text-[11px] text-[#4A5350] mt-0.5">{h.summary}</p>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-zinc-500 italic">No prior clinical history records.</span>
                          )}
                        </div>

                        {/* Prior Prescriptions */}
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#77817C] block mb-1">
                            Active / Past Prescriptions ({patientHistorySummary.prescriptions?.length || 0})
                          </span>
                          {patientHistorySummary.prescriptions?.length > 0 ? (
                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                              {patientHistorySummary.prescriptions.map((p: any, i: number) => (
                                <div key={i} className="p-2 rounded-xl bg-[#FAFAF7] border border-[#E5E8E6]">
                                  <p className="font-semibold text-[#174C40]">{p.medication_name}</p>
                                  <p className="text-[10px] text-[#77817C]">{p.dosage} &bull; {p.frequency} &bull; {p.duration}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-zinc-500 italic">No active medications recorded.</span>
                          )}
                        </div>

                        {/* Recent Diagnostic Reports */}
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#77817C] block mb-1">
                            Recent Lab &amp; Imaging Reports
                          </span>
                          {patientHistorySummary.lab_reports?.length > 0 ? (
                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                              {patientHistorySummary.lab_reports.map((r: any, i: number) => (
                                <div key={i} className="p-2 rounded-xl bg-[#FAFAF7] border border-[#E5E8E6] flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-[#242A28]">{r.test_name}</p>
                                    <p className="text-[10px] text-[#77817C]">{r.collected_date} &bull; {r.category}</p>
                                  </div>
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-50 text-[#174C40] border border-emerald-200">
                                    {r.status || 'Ready'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-zinc-500 italic">No past diagnostic lab reports.</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-[#77817C]">
                        Loading patient clinical profile...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: TODAY'S APPOINTMENTS ROSTER */}
        {/* ========================================================================= */}
        {activeTab === 'appointments' && (
          <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E8E6] pb-5">
              <div>
                <h2 className="font-editorial text-2xl font-semibold text-[#242A28]">
                  Today&apos;s Appointments Roster
                </h2>
                <p className="text-xs text-[#77817C] font-light">
                  Scheduled OPD consultations assigned to Dr. Aris Thorne.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-mono bg-[#E6EFE9] text-[#174C40] font-semibold">
                {todayAppointments.length} Scheduled Today
              </span>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Calendar className="h-10 w-10 text-[#77817C] mx-auto opacity-40" />
                <h3 className="font-editorial text-lg text-[#242A28]">No Appointments Scheduled Today</h3>
                <p className="text-xs text-[#77817C] max-w-sm mx-auto font-light">
                  Walk-in OPD tokens can still be called directly through the Cabin OPD Queue.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E8E6] text-[#77817C] font-mono uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3">Slot Time</th>
                      <th className="py-3 px-3">Appointment ID</th>
                      <th className="py-3 px-3">Patient Name</th>
                      <th className="py-3 px-3">Contact</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F2F1]">
                    {todayAppointments.map((appt) => (
                      <tr key={appt.appointment_id || appt.id} className="hover:bg-[#FAFAF7]">
                        <td className="py-3.5 px-3 font-mono font-semibold text-[#174C40]">
                          {appt.appointment_time || appt.slot || 'OPD Slot'}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-[#77817C]">{appt.appointment_id || appt.id}</td>
                        <td className="py-3.5 px-3 font-medium text-[#242A28]">
                          {appt.patient_name || appt.name}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-[#77817C]">{appt.patient_phone || appt.mobile || '—'}</td>
                        <td className="py-3.5 px-3 text-[#4A5350]">{appt.consultation_type || 'Regular Visit'}</td>
                        <td className="py-3.5 px-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 text-[#174C40] border border-emerald-200">
                            {appt.status || 'Confirmed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CONSULTATION HISTORY */}
        {/* ========================================================================= */}
        {activeTab === 'history' && (
          <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E8E6] pb-5">
              <div>
                <h2 className="font-editorial text-2xl font-semibold text-[#242A28]">
                  Completed Consultations (Today)
                </h2>
                <p className="text-xs text-[#77817C] font-light">
                  Audit trail and clinical records of patients consulted in Cabin 1.
                </p>
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:w-72">
                <Search className="h-4 w-4 text-[#77817C] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Filter by name, token or diagnosis..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E5E8E6] text-xs focus:border-[#174C40] outline-hidden"
                />
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <ClipboardList className="h-10 w-10 text-[#77817C] mx-auto opacity-40" />
                <h3 className="font-editorial text-lg text-[#242A28]">No Completed Consultations Found</h3>
                <p className="text-xs text-[#77817C] font-light">
                  Consultations finalized during today&apos;s shift will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E8E6] text-[#77817C] font-mono uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3">Completed At</th>
                      <th className="py-3 px-3">Token</th>
                      <th className="py-3 px-3">Patient Name</th>
                      <th className="py-3 px-3">Diagnosis</th>
                      <th className="py-3 px-3">Prescriptions</th>
                      <th className="py-3 px-3">Lab Orders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F2F1]">
                    {filteredHistory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#FAFAF7]">
                        <td className="py-3.5 px-3 font-mono text-[#77817C]">
                          {item.consultation_end_at ? new Date(item.consultation_end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-[#174C40]">{item.token_display}</td>
                        <td className="py-3.5 px-3 font-medium text-[#242A28]">
                          {item.patient_name}
                          <span className="block text-[10px] font-mono text-[#77817C]">{item.patient_code}</span>
                        </td>
                        <td className="py-3.5 px-3 text-[#242A28] max-w-xs truncate font-medium">
                          {item.diagnosis || 'General OPD Evaluation'}
                        </td>
                        <td className="py-3.5 px-3 text-[#4A5350]">
                          {item.prescriptions_summary ? (
                            <span className="text-[11px] font-mono">{item.prescriptions_summary}</span>
                          ) : (
                            <span className="text-[#77817C] italic">None</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-[#4A5350]">
                          {item.lab_orders_summary ? (
                            <span className="text-[11px] font-mono text-emerald-800">{item.lab_orders_summary}</span>
                          ) : (
                            <span className="text-[#77817C] italic">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
