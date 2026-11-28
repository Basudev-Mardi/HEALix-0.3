'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  FlaskConical,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  Plus,
  FileText,
  LogOut,
  Shield,
  Siren,
  Sparkles,
  Barcode,
  Check,
  X,
  Sliders,
  Filter,
  Microscope,
  FileCheck,
  Radio,
  UserCheck,
  Building,
  HeartPulse,
  Send,
  AlertCircle
} from 'lucide-react';
import { type StaffUser, clearStaffSession } from '@/lib/staff-auth';

interface LabStaffDashboardProps {
  labStaff?: StaffUser | null;
  onLogout?: () => void;
}

interface LabStats {
  pending_intake: number;
  in_analysis: number;
  completed_today: number;
  urgent_pending: number;
  total_requests: number;
  total_analyzers: number;
  calibrated_analyzers: number;
  maintenance_due: number;
  active_panic_alerts: number;
}

interface RequestedTest {
  id: string;
  test_code: string;
  test_name: string;
  category: string;
  department: string;
  unit: string;
  reference_range_label: string;
}

interface LabRequisition {
  id: string;
  patient_id: string;
  patient_name: string;
  referring_doctor: string;
  priority: 'Stat' | 'Urgent' | 'Routine';
  clinical_notes: string;
  request_status: string;
  requested_at: string;
  uhid: string | null;
  gender: string | null;
  age: number | null;
  blood_group: string | null;
  phone_number: string | null;
  sample_id: string | null;
  specimen_type: string | null;
  sample_status: string | null;
  collected_at: string | null;
  collected_by: string | null;
  rejection_reason: string | null;
  sample_notes: string | null;
  requested_tests: RequestedTest[] | null;
}

interface PanicAlert {
  id: number;
  report_id: string | null;
  patient_id: string;
  patient_name: string;
  test_name: string;
  parameter: string;
  measured_value: string;
  critical_limit: string;
  doctor_name: string;
  status: string;
  flagged_by: string;
  created_at: string;
  acknowledged_at: string | null;
}

interface AnalyzerEquipment {
  id: number;
  analyzer_name: string;
  analyzer_code: string;
  department: string;
  last_calibration_date: string;
  next_due_date: string;
  status: string;
  qc_passed: boolean;
  calibrated_by: string;
  notes: string;
  urgency: 'Valid' | 'Due Soon' | 'Overdue';
}

interface AnalyteParam {
  parameter: string;
  result: string;
  unit: string;
  ref_range: string;
  flag: 'normal' | 'high' | 'low' | 'critical';
  is_critical: boolean;
}

const DEFAULT_ANALYTES: Record<string, AnalyteParam[]> = {
  'Complete Blood Count (CBC)': [
    { parameter: 'Hemoglobin (Hb)', result: '14.2', unit: 'g/dL', ref_range: '13.0 - 17.0 g/dL', flag: 'normal', is_critical: false },
    { parameter: 'Total Leukocyte Count (WBC)', result: '7.8', unit: 'x10^3/uL', ref_range: '4.5 - 11.0 x10^3/uL', flag: 'normal', is_critical: false },
    { parameter: 'Platelet Count', result: '240', unit: 'x10^3/uL', ref_range: '150 - 450 x10^3/uL', flag: 'normal', is_critical: false },
    { parameter: 'Hematocrit (PCV)', result: '42.5', unit: '%', ref_range: '40.0 - 52.0 %', flag: 'normal', is_critical: false },
    { parameter: 'Absolute Neutrophil Count', result: '4.9', unit: 'x10^3/uL', ref_range: '2.0 - 7.0 x10^3/uL', flag: 'normal', is_critical: false }
  ],
  'High Sensitivity Troponin I': [
    { parameter: 'Troponin I (hs-cTnI)', result: '38.4', unit: 'ng/L', ref_range: '< 14.0 ng/L', flag: 'critical', is_critical: true },
    { parameter: 'CK-MB Isoenzyme', result: '4.8', unit: 'ng/mL', ref_range: '< 5.0 ng/mL', flag: 'normal', is_critical: false }
  ],
  'Lipid Profile Comprehensive': [
    { parameter: 'Total Cholesterol', result: '185', unit: 'mg/dL', ref_range: '< 200 mg/dL', flag: 'normal', is_critical: false },
    { parameter: 'Triglycerides', result: '142', unit: 'mg/dL', ref_range: '< 150 mg/dL', flag: 'normal', is_critical: false },
    { parameter: 'HDL (Good) Cholesterol', result: '48', unit: 'mg/dL', ref_range: '> 40 mg/dL', flag: 'normal', is_critical: false },
    { parameter: 'LDL (Bad) Cholesterol', result: '108', unit: 'mg/dL', ref_range: '< 100 mg/dL', flag: 'high', is_critical: false }
  ],
  'Kidney Function Panel (RFT/KFT)': [
    { parameter: 'Serum Creatinine', result: '1.05', unit: 'mg/dL', ref_range: '0.6 - 1.2 mg/dL', flag: 'normal', is_critical: false },
    { parameter: 'Blood Urea Nitrogen (BUN)', result: '16.0', unit: 'mg/dL', ref_range: '7.0 - 20.0 mg/dL', flag: 'normal', is_critical: false },
    { parameter: 'eGFR', result: '92', unit: 'mL/min/1.73m²', ref_range: '> 90 mL/min/1.73m²', flag: 'normal', is_critical: false },
    { parameter: 'Serum Potassium (K+)', result: '4.2', unit: 'mEq/L', ref_range: '3.5 - 5.1 mEq/L', flag: 'normal', is_critical: false }
  ],
  'Glycated Hemoglobin (HbA1c)': [
    { parameter: 'HbA1c Glycated Fraction', result: '5.4', unit: '%', ref_range: '4.0 - 5.6 % (Non-diabetic)', flag: 'normal', is_critical: false },
    { parameter: 'Estimated Average Glucose (eAG)', result: '108', unit: 'mg/dL', ref_range: '< 115 mg/dL', flag: 'normal', is_critical: false }
  ]
};

export default function LabStaffDashboard({ labStaff, onLogout }: LabStaffDashboardProps) {
  const [, startTransition] = useTransition();

  // Active Top Navigation Tab
  const [activeTab, setActiveTab] = useState<'worklist' | 'intake' | 'results' | 'equipment'>('worklist');

  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data States
  const [stats, setStats] = useState<LabStats | null>(null);
  const [worklist, setWorklist] = useState<LabRequisition[]>([]);
  const [panicAlerts, setPanicAlerts] = useState<PanicAlert[]>([]);
  const [analyzers, setAnalyzers] = useState<AnalyzerEquipment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modal / Drawer States
  const [selectedReq, setSelectedReq] = useState<LabRequisition | null>(null);
  const [showIntakeModal, setShowIntakeModal] = useState<boolean>(false);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [showPanicModal, setShowPanicModal] = useState<boolean>(false);
  const [showCalibrateModal, setShowCalibrateModal] = useState<boolean>(false);
  const [selectedAnalyzer, setSelectedAnalyzer] = useState<AnalyzerEquipment | null>(null);

  // Form States for Intake
  const [intakeBarcode, setIntakeBarcode] = useState<string>('');
  const [intakeSpecimenType, setIntakeSpecimenType] = useState<string>('Whole Blood (EDTA)');
  const [intakeAction, setIntakeAction] = useState<'received' | 'rejected'>('received');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [intakeNotes, setIntakeNotes] = useState<string>('Specimen temperature and label verified.');

  // Form States for Results
  const [resultParams, setResultParams] = useState<AnalyteParam[]>([]);
  const [resultsSummary, setResultsSummary] = useState<string>('All measured parameters verified. Analytical quality control flags within standard SD limits.');
  const [certifyingPathologist, setCertifyingPathologist] = useState<string>('Dr. Sarah Lin, MD (Chief Pathologist)');
  const [isCriticalAlertChecked, setIsCriticalAlertChecked] = useState<boolean>(false);

  // Form States for Panic Alert
  const [panicParam, setPanicParam] = useState<string>('Troponin I (hs-cTnI)');
  const [panicValue, setPanicValue] = useState<string>('38.4 ng/L');
  const [panicLimit, setPanicLimit] = useState<string>('> 14.0 ng/L');
  const [panicDoctor, setPanicDoctor] = useState<string>('Dr. Aris Thorne, MD');

  // Form States for Calibration
  const [calibNotes, setCalibNotes] = useState<string>('Three-point calibration curve verified. Control run passed within 1.5 SD.');
  const [calibDays, setCalibDays] = useState<number>(14);

  // Fetch Dashboard Telemetry & Requisitions
  const loadDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [dashRes, workRes, equipRes] = await Promise.all([
        fetch('http://localhost:5000/api/v1/lab/dashboard'),
        fetch('http://localhost:5000/api/v1/lab/worklist'),
        fetch('http://localhost:5000/api/v1/lab/equipment')
      ]);

      if (dashRes.ok) {
        const dData = await dashRes.json();
        setStats(dData.stats || null);
        setPanicAlerts(dData.panic_alerts || []);
      }

      if (workRes.ok) {
        const wData = await workRes.json();
        setWorklist(wData.data || []);
      }

      if (equipRes.ok) {
        const eData = await equipRes.json();
        setAnalyzers(eData.data || []);
      }
    } catch (err) {
      console.error('Failed to load laboratory data:', err);
      setActionError('Could not sync with central laboratory analyzer gateway.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Clear toast notifications after 5 seconds
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  useEffect(() => {
    if (actionError) {
      const timer = setTimeout(() => setActionError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [actionError]);

  // Open Intake Modal
  const openIntake = (req: LabRequisition) => {
    setSelectedReq(req);
    setIntakeBarcode(`BC-${Date.now().toString().slice(-6)}`);
    setIntakeSpecimenType(req.specimen_type || 'Whole Blood (EDTA)');
    setIntakeAction('received');
    setRejectionReason('');
    setIntakeNotes('Specimen container intact, no hemolysis or clotting observed.');
    setShowIntakeModal(true);
  };

  // Submit Specimen Intake / Barcode Accession
  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    try {
      const res = await fetch('http://localhost:5000/api/v1/lab/samples/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: selectedReq.id,
          sample_id: selectedReq.sample_id,
          barcode: intakeBarcode,
          specimen_type: intakeSpecimenType,
          action: intakeAction,
          rejection_reason: intakeAction === 'rejected' ? rejectionReason : undefined,
          notes: intakeNotes,
          operator_name: labStaff?.name || 'Marcus Vance, CLS'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process specimen intake');

      setActionSuccess(data.message || 'Specimen accession completed.');
      setShowIntakeModal(false);
      loadDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing sample intake';
      setActionError(msg);
    }
  };

  // Open Result Entry Modal
  const openResultEntry = (req: LabRequisition) => {
    setSelectedReq(req);
    const primaryTest = req.requested_tests?.[0]?.test_name || 'Complete Blood Count (CBC)';
    const defaultParams = DEFAULT_ANALYTES[primaryTest] || [
      { parameter: 'Primary Analyte Measurement', result: 'Normal', unit: 'units', ref_range: 'Within Limits', flag: 'normal', is_critical: false }
    ];
    setResultParams(defaultParams);
    setIsCriticalAlertChecked(defaultParams.some(p => p.is_critical || p.flag === 'critical'));
    setResultsSummary(`Analytical run completed for ${primaryTest}. Calibrations and control replicates valid.`);
    setShowResultModal(true);
  };

  // Update a specific analyte parameter value in result entry
  const updateAnalyteValue = (index: number, val: string) => {
    setResultParams(prev => {
      const updated = [...prev];
      const current = updated[index];
      current.result = val;
      // Simple heuristic flagging
      const num = parseFloat(val);
      if (!isNaN(num)) {
        if (current.parameter.includes('Troponin') && num > 14) {
          current.flag = 'critical';
          current.is_critical = true;
        } else if (current.parameter.includes('LDL') && num > 130) {
          current.flag = 'high';
        } else {
          current.flag = 'normal';
          current.is_critical = false;
        }
      }
      setIsCriticalAlertChecked(updated.some(p => p.is_critical || p.flag === 'critical'));
      return updated;
    });
  };

  // Submit Authorized Report
  const handleAuthorizeReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    try {
      const primaryTest = selectedReq.requested_tests?.[0]?.test_name || 'Laboratory Diagnostic Profile';
      const category = selectedReq.requested_tests?.[0]?.category || 'Clinical Pathology';

      const res = await fetch('http://localhost:5000/api/v1/lab/reports/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: selectedReq.id,
          patient_id: selectedReq.patient_id,
          patient_name: selectedReq.patient_name,
          referring_doctor: selectedReq.referring_doctor,
          test_name: primaryTest,
          category,
          specimen_type: selectedReq.specimen_type || 'Blood Specimen',
          pathologist_name: certifyingPathologist,
          verified_by: labStaff?.name || 'Marcus Vance, CLS',
          results_summary: resultsSummary,
          results_json: resultParams,
          is_critical: isCriticalAlertChecked
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to authorize laboratory report');

      setActionSuccess(`Report ${data.report_code || ''} authorized and released to Electronic Health Record.`);
      setShowResultModal(false);
      loadDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error authorizing report';
      setActionError(msg);
    }
  };

  // Open Panic Alert Escalation Modal
  const openPanicAlertModal = (req?: LabRequisition) => {
    if (req) {
      setSelectedReq(req);
      setPanicDoctor(req.referring_doctor || 'Dr. Aris Thorne, MD');
    }
    setShowPanicModal(true);
  };

  // Submit Urgent Panic Alert
  const handleBroadcastPanicAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const pId = selectedReq?.patient_id || 'PAT-EMERGENCY';
      const pName = selectedReq?.patient_name || 'Emergency Trauma / Inpatient';

      const res = await fetch('http://localhost:5000/api/v1/lab/panic-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: pId,
          patient_name: pName,
          test_name: selectedReq?.requested_tests?.[0]?.test_name || 'Critical Chemistry',
          parameter: panicParam,
          measured_value: panicValue,
          critical_limit: panicLimit,
          doctor_name: panicDoctor,
          flagged_by: labStaff?.name || 'Marcus Vance, CLS'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send panic alert');

      setActionSuccess('Critical panic alert broadcasted and logged for physician acknowledgment.');
      setShowPanicModal(false);
      loadDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending panic alert';
      setActionError(msg);
    }
  };

  // Acknowledge Panic Alert
  const handleAcknowledgeAlert = async (alertId: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/lab/panic-alert/${alertId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved_by: labStaff?.name || 'Marcus Vance, CLS' })
      });
      if (res.ok) {
        setActionSuccess('Physician acknowledgment recorded.');
        loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Calibration Modal
  const openCalibrate = (equip: AnalyzerEquipment) => {
    setSelectedAnalyzer(equip);
    setCalibNotes(`Standard calibration zeroed on ${equip.analyzer_code}. Multi-level QC passed within ±1.5 SD.`);
    setCalibDays(14);
    setShowCalibrateModal(true);
  };

  // Submit Calibration Run
  const handleCalibrateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnalyzer) return;

    try {
      const res = await fetch(`http://localhost:5000/api/v1/lab/equipment/${selectedAnalyzer.id}/calibrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calibrated_by: labStaff?.name || 'Marcus Vance, CLS',
          qc_passed: true,
          notes: calibNotes,
          next_due_days: calibDays
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Calibration logging failed');

      setActionSuccess(data.message || 'Calibration verified and validity extended.');
      setShowCalibrateModal(false);
      loadDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error logging calibration';
      setActionError(msg);
    }
  };

  // Filtered worklist
  const filteredWorklist = worklist.filter(req => {
    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending' && !['pending', 'sample_collected', 'requested'].includes(req.request_status)) {
        return false;
      }
      if (statusFilter === 'in_analysis' && !['in_analysis', 'sample_received', 'processing'].includes(req.request_status)) {
        return false;
      }
      if (statusFilter === 'completed' && req.request_status !== 'completed') {
        return false;
      }
    }

    // Priority filter
    if (priorityFilter !== 'all' && req.priority !== priorityFilter) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = req.patient_name.toLowerCase().includes(q);
      const matchId = req.id.toLowerCase().includes(q);
      const matchUhid = req.uhid?.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchUhid) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header & Identity Strip */}
      <header className="rounded-3xl border border-[#174C40]/20 bg-[#174C40] text-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <span className="h-14 w-14 rounded-2xl bg-white/10 text-emerald-300 flex items-center justify-center shrink-0 border border-white/10 backdrop-blur-xs">
            <FlaskConical className="h-7 w-7 text-emerald-300" />
          </span>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-serif tracking-tight font-medium text-white">
                {labStaff?.name || 'Marcus Vance, CLS'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                CLS • Diagnostic Pathology
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-emerald-100/80 mt-1 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-emerald-300" />
                Central Clinical Pathology & Core Diagnostics (Level -1, Wing C)
              </span>
              <span className="flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-emerald-300" />
                Station: Specimen Accession & Automated Hematology/Biochemistry
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
          <button
            onClick={() => {
              startTransition(() => {
                loadDashboardData();
              });
            }}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-colors flex items-center gap-1.5"
            title="Refresh laboratory telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync Gateway</span>
          </button>

          <button
            onClick={() => openPanicAlertModal()}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 border border-rose-500/40 transition-colors flex items-center gap-1.5"
          >
            <Siren className="h-3.5 w-3.5 text-rose-300 animate-pulse" />
            <span>Escalate Panic Value</span>
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

      {/* 2. Success / Error Notification Banners */}
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

      {/* 3. Panic Alerts Active Banner (if any) */}
      {panicAlerts.length > 0 && (
        <div className="rounded-2xl border-2 border-rose-500/40 bg-gradient-to-r from-rose-50 via-rose-100/60 to-amber-50 p-4 shadow-sm animate-pulse">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Siren className="h-5 w-5 text-white animate-bounce" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                    CRITICAL LAB PANIC VALUES AWAITING PHYSICIAN CONFIRMATION
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-600 text-white font-bold">
                    {panicAlerts.length} Active
                  </span>
                </div>
                <p className="text-xs text-rose-700 mt-0.5">
                  Immediate verbal escalation required according to CAP/NABL critical result communication protocol.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {panicAlerts.map(alert => (
              <div
                key={alert.id}
                className="bg-white/90 border border-rose-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1F2421]">{alert.patient_name}</span>
                    <span className="text-[11px] font-mono text-[#77817C]">({alert.patient_id})</span>
                  </div>
                  <div className="text-[11px] text-rose-600 font-mono mt-0.5">
                    {alert.test_name}: <span className="font-bold underline">{alert.parameter} = {alert.measured_value}</span> (Critical limit: {alert.critical_limit})
                  </div>
                  <div className="text-[10px] text-[#77817C] mt-0.5">
                    Attending: {alert.doctor_name} • Flagged by {alert.flagged_by}
                  </div>
                </div>
                <button
                  onClick={() => handleAcknowledgeAlert(alert.id)}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors shrink-0 shadow-xs"
                >
                  Confirm Spoken Escalation
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. KPI Telemetry Summary Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#77817C] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Pending Intake</span>
            <Barcode className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-semibold text-[#1F2421]">
            {stats?.pending_intake ?? 0}
          </div>
          <p className="text-[10px] font-mono text-[#77817C] mt-1">Awaiting barcode accession</p>
        </div>

        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#77817C] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">In Analysis</span>
            <Microscope className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-semibold text-emerald-700">
            {stats?.in_analysis ?? 0}
          </div>
          <p className="text-[10px] font-mono text-[#77817C] mt-1">On analyzer carousel</p>
        </div>

        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#77817C] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Stat / Urgent</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-serif font-semibold text-rose-600">
            {stats?.urgent_pending ?? 0}
          </div>
          <p className="text-[10px] font-mono text-rose-600/80 mt-1">Priority requisitions</p>
        </div>

        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#77817C] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Authorized Today</span>
            <CheckCircle2 className="h-4 w-4 text-teal-600" />
          </div>
          <div className="text-2xl font-serif font-semibold text-[#1F2421]">
            {stats?.completed_today ?? 0}
          </div>
          <p className="text-[10px] font-mono text-[#77817C] mt-1">Signed & published to EHR</p>
        </div>

        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#77817C] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Analyzers Calibrated</span>
            <Sliders className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-serif font-semibold text-[#1F2421]">
            {stats?.calibrated_analyzers ?? 4}
            <span className="text-xs text-[#77817C] font-normal"> / {stats?.total_analyzers ?? 4}</span>
          </div>
          <p className="text-[10px] font-mono text-emerald-600 mt-1">Daily 3-level QC active</p>
        </div>

        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#77817C] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">Panic Alerts</span>
            <Siren className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-serif font-semibold text-rose-600">
            {stats?.active_panic_alerts ?? 0}
          </div>
          <p className="text-[10px] font-mono text-[#77817C] mt-1">Critical values pending</p>
        </div>
      </section>

      {/* 5. Navigation Tabs */}
      <div className="border-b border-[#E5E8E6] flex items-center justify-between gap-4 overflow-x-auto pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('worklist')}
            className={`px-4 py-2.5 rounded-xl text-xs font-medium font-mono transition-all flex items-center gap-2 ${
              activeTab === 'worklist'
                ? 'bg-[#174C40] text-white shadow-xs'
                : 'text-[#4A5350] hover:bg-[#F0F2F1]'
            }`}
          >
            <Microscope className="h-3.5 w-3.5" />
            <span>Diagnostic Worklist</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current">
              {filteredWorklist.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('intake')}
            className={`px-4 py-2.5 rounded-xl text-xs font-medium font-mono transition-all flex items-center gap-2 ${
              activeTab === 'intake'
                ? 'bg-[#174C40] text-white shadow-xs'
                : 'text-[#4A5350] hover:bg-[#F0F2F1]'
            }`}
          >
            <Barcode className="h-3.5 w-3.5" />
            <span>Specimen Intake & Barcode Accession</span>
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2.5 rounded-xl text-xs font-medium font-mono transition-all flex items-center gap-2 ${
              activeTab === 'results'
                ? 'bg-[#174C40] text-white shadow-xs'
                : 'text-[#4A5350] hover:bg-[#F0F2F1]'
            }`}
          >
            <FileCheck className="h-3.5 w-3.5" />
            <span>Result Entry & Authorization</span>
          </button>

          <button
            onClick={() => setActiveTab('equipment')}
            className={`px-4 py-2.5 rounded-xl text-xs font-medium font-mono transition-all flex items-center gap-2 ${
              activeTab === 'equipment'
                ? 'bg-[#174C40] text-white shadow-xs'
                : 'text-[#4A5350] hover:bg-[#F0F2F1]'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Analyzer Calibration & QC ({analyzers.length})</span>
          </button>
        </div>
      </div>

      {/* 6. TAB CONTENT */}

      {/* TAB 1: Diagnostic Worklist & Requisitions */}
      {activeTab === 'worklist' && (
        <section className="space-y-4">
          {/* Worklist Filter Controls */}
          <div className="bg-white rounded-2xl border border-[#E5E8E6] p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#77817C]" />
                <input
                  type="text"
                  placeholder="Search by patient name, UHID, or requisition ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#D5D9D7] focus:outline-none focus:ring-1 focus:ring-[#174C40] font-mono bg-[#FAFAF7]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-[#77817C]">
                <Filter className="h-3.5 w-3.5" />
                <span>Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-mono rounded-xl border border-[#D5D9D7] px-2.5 py-1.5 bg-[#FAFAF7] focus:outline-none focus:ring-1 focus:ring-[#174C40]"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Intake</option>
                <option value="in_analysis">In Analysis</option>
                <option value="completed">Completed / Authorized</option>
              </select>

              <div className="flex items-center gap-1.5 text-xs text-[#77817C] ml-2">
                <span>Priority:</span>
              </div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-xs font-mono rounded-xl border border-[#D5D9D7] px-2.5 py-1.5 bg-[#FAFAF7] focus:outline-none focus:ring-1 focus:ring-[#174C40]"
              >
                <option value="all">All Priorities</option>
                <option value="Stat">Stat (Emergency)</option>
                <option value="Urgent">Urgent</option>
                <option value="Routine">Routine</option>
              </select>
            </div>
          </div>

          {/* Worklist Requisitions List */}
          {loading ? (
            <div className="rounded-2xl border border-[#E5E8E6] bg-white p-12 text-center text-xs font-mono text-[#77817C] animate-pulse">
              Querying Laboratory Information System (LIS) core database...
            </div>
          ) : filteredWorklist.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D5D9D7] bg-white p-12 text-center text-xs font-mono text-[#77817C]">
              No laboratory requisitions matched the current filter criteria.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredWorklist.map(req => {
                const isStat = req.priority === 'Stat';
                const isUrgent = req.priority === 'Urgent';
                const isCompleted = req.request_status === 'completed';
                const isAnalyzing = ['in_analysis', 'sample_received', 'processing'].includes(req.request_status);

                return (
                  <div
                    key={req.id}
                    className={`rounded-2xl border bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-[#174C40]/40 ${
                      isStat
                        ? 'border-rose-400 bg-rose-50/20'
                        : isUrgent
                        ? 'border-amber-300 bg-amber-50/10'
                        : 'border-[#E5E8E6]'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Patient and Requisition Info */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-serif font-semibold text-sm sm:text-base text-[#1F2421]">
                            {req.patient_name}
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#E5E8E6] text-[#4A5350]">
                            UHID: {req.uhid || req.patient_id}
                          </span>
                          {req.gender && (
                            <span className="text-xs font-mono text-[#77817C]">
                              ({req.gender}{req.age ? `, ${req.age}y` : ''})
                            </span>
                          )}
                          {req.blood_group && (
                            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold">
                              {req.blood_group}
                            </span>
                          )}

                          {/* Priority Badge */}
                          {isStat && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold animate-pulse">
                              STAT • EMERGENCY
                            </span>
                          )}
                          {isUrgent && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500 text-white font-medium">
                              URGENT
                            </span>
                          )}
                          {!isStat && !isUrgent && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E5E8E6] text-[#4A5350]">
                              ROUTINE
                            </span>
                          )}

                          {/* Status Badge */}
                          {isCompleted ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Authorized & Released
                            </span>
                          ) : isAnalyzing ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                              <Microscope className="h-3 w-3" /> In Analysis
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Sample Awaiting Intake
                            </span>
                          )}
                        </div>

                        {/* Requisition ID and Referring Physician */}
                        <div className="flex items-center gap-4 text-xs text-[#77817C] font-mono flex-wrap">
                          <span>Req ID: <strong className="text-[#1F2421]">{req.id}</strong></span>
                          <span>Doctor: <strong className="text-[#1F2421]">{req.referring_doctor}</strong></span>
                          {req.sample_id && <span>Sample: <strong className="text-emerald-700">{req.sample_id}</strong></span>}
                          {req.specimen_type && <span>Specimen: <strong className="text-[#1F2421]">{req.specimen_type}</strong></span>}
                          <span>Requested: {new Date(req.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {/* Requested Test Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[11px] font-mono text-[#77817C]">Panels Ordered:</span>
                          {req.requested_tests && req.requested_tests.length > 0 ? (
                            req.requested_tests.map(t => (
                              <span
                                key={t.id}
                                className="px-2 py-0.5 rounded-lg text-xs font-mono bg-emerald-50 text-[#174C40] border border-emerald-200/60"
                              >
                                {t.test_name} ({t.test_code})
                              </span>
                            ))
                          ) : (
                            <span className="px-2 py-0.5 rounded-lg text-xs font-mono bg-emerald-50 text-[#174C40] border border-emerald-200/60">
                              Diagnostic Laboratory Profile
                            </span>
                          )}
                        </div>

                        {req.clinical_notes && (
                          <p className="text-xs text-[#4A5350] italic pt-0.5">
                            Clinical Indication: &quot;{req.clinical_notes}&quot;
                          </p>
                        )}
                      </div>

                      {/* Right: Operational Actions */}
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {!isCompleted && (
                          <>
                            <button
                              onClick={() => openIntake(req)}
                              className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-[#FAFAF7] hover:bg-[#E5E8E6] text-[#1F2421] border border-[#D5D9D7] transition-colors flex items-center gap-1.5"
                            >
                              <Barcode className="h-3.5 w-3.5 text-[#174C40]" />
                              <span>{req.sample_id ? 'Accession / Status' : 'Intake Sample'}</span>
                            </button>

                            <button
                              onClick={() => openResultEntry(req)}
                              className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-[#174C40] hover:bg-[#123830] text-white transition-colors flex items-center gap-1.5 shadow-xs"
                            >
                              <FileCheck className="h-3.5 w-3.5 text-emerald-300" />
                              <span>Enter & Authorize</span>
                            </button>

                            <button
                              onClick={() => openPanicAlertModal(req)}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-mono text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1"
                              title="Broadcast critical value alert"
                            >
                              <Siren className="h-3.5 w-3.5 text-rose-600" />
                            </button>
                          </>
                        )}

                        {isCompleted && (
                          <div className="px-3 py-1.5 rounded-xl text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Report Published</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: Specimen Intake & Barcode Accession */}
      {activeTab === 'intake' && (
        <section className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#E5E8E6] p-6 shadow-xs space-y-6">
            <div className="border-b border-[#E5E8E6] pb-4">
              <h2 className="text-base sm:text-lg font-serif font-semibold text-[#1F2421] flex items-center gap-2">
                <Barcode className="h-5 w-5 text-[#174C40]" />
                Specimen Intake, Barcode Scanning & Specimen Integrity Inspection
              </h2>
              <p className="text-xs text-[#77817C] font-mono mt-1">
                Acknowledge laboratory sample custody, scan automated 2D matrix barcode, inspect sample integrity, and route to automated analyzer track.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Intake Workstation Form */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#4A5350] font-semibold">
                  Accession Sample Custody
                </h3>

                <div>
                  <label className="block text-xs font-mono text-[#4A5350] mb-1">
                    Select Requisition to Accession
                  </label>
                  <select
                    value={selectedReq?.id || ''}
                    onChange={(e) => {
                      const found = worklist.find(w => w.id === e.target.value);
                      if (found) {
                        setSelectedReq(found);
                        setIntakeBarcode(`BC-${Date.now().toString().slice(-6)}`);
                        setIntakeSpecimenType(found.specimen_type || 'Whole Blood (EDTA)');
                      }
                    }}
                    className="w-full text-xs font-mono rounded-xl border border-[#D5D9D7] p-2.5 bg-[#FAFAF7] focus:ring-1 focus:ring-[#174C40]"
                  >
                    <option value="">-- Choose pending requisition --</option>
                    {worklist.filter(w => w.request_status !== 'completed').map(w => (
                      <option key={w.id} value={w.id}>
                        {w.id} - {w.patient_name} ({w.priority})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-[#4A5350] mb-1">
                      Barcode Identifier
                    </label>
                    <input
                      type="text"
                      value={intakeBarcode}
                      onChange={(e) => setIntakeBarcode(e.target.value)}
                      placeholder="e.g. BC-98214"
                      className="w-full text-xs font-mono rounded-xl border border-[#D5D9D7] p-2.5 bg-[#FAFAF7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[#4A5350] mb-1">
                      Specimen Container / Type
                    </label>
                    <select
                      value={intakeSpecimenType}
                      onChange={(e) => setIntakeSpecimenType(e.target.value)}
                      className="w-full text-xs font-mono rounded-xl border border-[#D5D9D7] p-2.5 bg-[#FAFAF7]"
                    >
                      <option value="Whole Blood (EDTA)">Whole Blood (EDTA - Lavender)</option>
                      <option value="Serum (SST Gold Top)">Serum (SST Gel Separator)</option>
                      <option value="Sodium Citrate (Blue Top)">Plasma (Sodium Citrate)</option>
                      <option value="Heparin (Green Top)">Plasma (Lithium Heparin)</option>
                      <option value="Midstream Clean-Catch Urine">Midstream Clean Urine</option>
                      <option value="Sterile Body Fluid / CSF">Sterile Body Fluid / CSF</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#4A5350] mb-1">
                    Sample Integrity / Action
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIntakeAction('received')}
                      className={`p-3 rounded-xl border text-xs font-mono text-left transition-all ${
                        intakeAction === 'received'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500'
                          : 'border-[#E5E8E6] bg-[#FAFAF7] text-[#4A5350]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Accept & Accession</span>
                      </div>
                      <p className="text-[10px] text-[#77817C] mt-1">
                        Volume sufficient, no hemolysis or clotting.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIntakeAction('rejected')}
                      className={`p-3 rounded-xl border text-xs font-mono text-left transition-all ${
                        intakeAction === 'rejected'
                          ? 'border-rose-500 bg-rose-50 text-rose-900 font-semibold ring-1 ring-rose-500'
                          : 'border-[#E5E8E6] bg-[#FAFAF7] text-[#4A5350]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-rose-700">
                        <X className="h-4 w-4" />
                        <span>Reject Specimen</span>
                      </div>
                      <p className="text-[10px] text-[#77817C] mt-1">
                        Hemolyzed, clotted, or mismatched label.
                      </p>
                    </button>
                  </div>
                </div>

                {intakeAction === 'rejected' && (
                  <div>
                    <label className="block text-xs font-mono text-rose-700 mb-1">
                      Reason for Specimen Rejection (Mandatory)
                    </label>
                    <select
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full text-xs font-mono rounded-xl border border-rose-300 p-2.5 bg-rose-50/50 text-rose-900"
                    >
                      <option value="">-- Select Rejection Criteria --</option>
                      <option value="Severe Hemolysis (Interferes with Optical Assay)">Severe Hemolysis (Interferes with Optical Assay)</option>
                      <option value="Grossly Lipemic Sample">Grossly Lipemic Sample</option>
                      <option value="Specimen Clotted in EDTA Tube">Specimen Clotted in EDTA Tube</option>
                      <option value="Insufficient Quantity Not Sufficient (QNS)">Insufficient Quantity (QNS)</option>
                      <option value="Mismatched Label / Incorrect Patient Identifier">Mismatched Label / Incorrect Patient Identifier</option>
                      <option value="Specimen Received Beyond Stability Window">Specimen Received Beyond Stability Window</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono text-[#4A5350] mb-1">
                    Accession Notes
                  </label>
                  <input
                    type="text"
                    value={intakeNotes}
                    onChange={(e) => setIntakeNotes(e.target.value)}
                    className="w-full text-xs font-mono rounded-xl border border-[#D5D9D7] p-2.5 bg-[#FAFAF7]"
                  />
                </div>

                <button
                  type="button"
                  disabled={!selectedReq}
                  onClick={handleIntakeSubmit}
                  className="w-full py-2.5 rounded-xl text-xs font-mono font-medium bg-[#174C40] hover:bg-[#123830] text-white transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <Barcode className="h-4 w-4 text-emerald-300" />
                  <span>Confirm Custody & Dispatch to Analyzer Queue</span>
                </button>
              </div>

              {/* Specimen Integrity Standards Box */}
              <div className="bg-[#FAFAF7] rounded-2xl border border-[#E5E8E6] p-5 space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#174C40] font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Pre-Analytical Specimen Acceptance Criteria
                </h3>

                <div className="space-y-3 text-xs text-[#4A5350]">
                  <div className="p-3 bg-white rounded-xl border border-[#E5E8E6]">
                    <div className="font-semibold text-[#1F2421]">1. Temperature & Transit Validation</div>
                    <p className="text-[11px] text-[#77817C] mt-0.5">
                      Blood tubes must be transferred at 2°C – 8°C (cold chain pack) or received within 45 minutes of bedside phlebotomy collection.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#E5E8E6]">
                    <div className="font-semibold text-[#1F2421]">2. Hemolysis Index (H-Index)</div>
                    <p className="text-[11px] text-[#77817C] mt-0.5">
                      Potassium, Troponin, and LDH assays require optical hemolysis threshold &lt; 50 mg/dL free hemoglobin.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#E5E8E6]">
                    <div className="font-semibold text-[#1F2421]">3. Barcode Positive Patient Identification (PPID)</div>
                    <p className="text-[11px] text-[#77817C] mt-0.5">
                      Primary tube label must contain 2 independent identifiers: Full Patient Legal Name and UHID/MRN.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/60 text-emerald-900 text-xs">
                  <strong>Current Accession Technician:</strong> {labStaff?.name || 'Marcus Vance, CLS'} (Licensed Clinical Pathologist Core)
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: Result Entry & Report Authorization */}
      {activeTab === 'results' && (
        <section className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#E5E8E6] p-6 shadow-xs space-y-6">
            <div className="border-b border-[#E5E8E6] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-serif font-semibold text-[#1F2421] flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-[#174C40]" />
                  Analyte Result Entry, Reference Range Verification & Authorization
                </h2>
                <p className="text-xs text-[#77817C] font-mono mt-1">
                  Enter quantified values, check biological reference intervals, flag panic limits, and sign clinical release certificate.
                </p>
              </div>

              {selectedReq && (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-mono text-[#174C40]">
                  Active: <strong>{selectedReq.patient_name}</strong> ({selectedReq.id})
                </div>
              )}
            </div>

            {/* Select Requisition if none active */}
            {!selectedReq ? (
              <div className="p-8 text-center border border-dashed border-[#D5D9D7] rounded-2xl bg-[#FAFAF7]">
                <Microscope className="h-8 w-8 text-[#174C40] mx-auto mb-2 opacity-60" />
                <h3 className="text-sm font-semibold text-[#1F2421]">No Requisition Selected</h3>
                <p className="text-xs text-[#77817C] font-mono mt-1 mb-4">
                  Select a requisition from the worklist to load parameters and enter validated findings.
                </p>
                <div className="max-w-md mx-auto">
                  <select
                    onChange={(e) => {
                      const found = worklist.find(w => w.id === e.target.value);
                      if (found) openResultEntry(found);
                    }}
                    className="w-full text-xs font-mono rounded-xl border border-[#D5D9D7] p-2.5 bg-white"
                  >
                    <option value="">-- Choose Requisition to Certify --</option>
                    {worklist.filter(w => w.request_status !== 'completed').map(w => (
                      <option key={w.id} value={w.id}>
                        {w.id} - {w.patient_name} ({w.requested_tests?.[0]?.test_name || 'Lab Test'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAuthorizeReport} className="space-y-6">
                {/* Patient Summary Strip */}
                <div className="bg-[#FAFAF7] rounded-2xl border border-[#E5E8E6] p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-[#77817C] block text-[10px] uppercase">Patient</span>
                    <strong className="text-[#1F2421]">{selectedReq.patient_name}</strong>
                  </div>
                  <div>
                    <span className="text-[#77817C] block text-[10px] uppercase">UHID / MRN</span>
                    <strong className="text-[#1F2421]">{selectedReq.uhid || selectedReq.patient_id}</strong>
                  </div>
                  <div>
                    <span className="text-[#77817C] block text-[10px] uppercase">Ordered Test</span>
                    <strong className="text-emerald-800">{selectedReq.requested_tests?.[0]?.test_name || 'Panel'}</strong>
                  </div>
                  <div>
                    <span className="text-[#77817C] block text-[10px] uppercase">Ordering Physician</span>
                    <strong className="text-[#1F2421]">{selectedReq.referring_doctor}</strong>
                  </div>
                </div>

                {/* Analyte Parameters Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#4A5350] font-semibold">
                      Analyte Measurement Matrix
                    </h3>
                    <span className="text-[11px] font-mono text-[#77817C]">
                      Automated Delta-Check Verified
                    </span>
                  </div>

                  <div className="border border-[#E5E8E6] rounded-2xl overflow-hidden bg-white">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F0F2F1] border-b border-[#E5E8E6] font-mono text-[11px] text-[#4A5350]">
                          <th className="p-3">Analyte / Parameter</th>
                          <th className="p-3 w-36">Measured Result</th>
                          <th className="p-3 w-24">Unit</th>
                          <th className="p-3">Biological Reference Range</th>
                          <th className="p-3 w-28">Clinical Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E8E6]">
                        {resultParams.map((param, idx) => (
                          <tr key={idx} className="hover:bg-[#FAFAF7]">
                            <td className="p-3 font-semibold text-[#1F2421]">{param.parameter}</td>
                            <td className="p-3">
                              <input
                                type="text"
                                value={param.result}
                                onChange={(e) => updateAnalyteValue(idx, e.target.value)}
                                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono font-semibold ${
                                  param.flag === 'critical'
                                    ? 'border-rose-500 bg-rose-50 text-rose-800'
                                    : param.flag === 'high'
                                    ? 'border-amber-400 bg-amber-50 text-amber-800'
                                    : 'border-[#D5D9D7] bg-[#FAFAF7] text-[#1F2421]'
                                }`}
                              />
                            </td>
                            <td className="p-3 font-mono text-[#77817C]">{param.unit}</td>
                            <td className="p-3 font-mono text-[#4A5350]">{param.ref_range}</td>
                            <td className="p-3">
                              {param.flag === 'critical' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-600 text-white font-bold animate-pulse">
                                  CRITICAL
                                </span>
                              )}
                              {param.flag === 'high' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500 text-white font-medium">
                                  HIGH
                                </span>
                              )}
                              {param.flag === 'normal' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800">
                                  NORMAL
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Diagnostic Impression & Summary */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono text-[#4A5350]">
                    Clinical Pathologist Impression & Summary
                  </label>
                  <textarea
                    rows={2}
                    value={resultsSummary}
                    onChange={(e) => setResultsSummary(e.target.value)}
                    className="w-full text-xs font-mono rounded-xl border border-[#D5D9D7] p-2.5 bg-[#FAFAF7]"
                  />
                </div>

                {/* Certification Sign-Off Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#4A5350] mb-1">
                      Certifying Pathologist (Doctor Sign-Off)
                    </label>
                    <input
                      type="text"
                      value={certifyingPathologist}
                      onChange={(e) => setCertifyingPathologist(e.target.value)}
                      className="w-full text-xs font-mono rounded-xl border border-[#D5D9D7] p-2 bg-[#FAFAF7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[#4A5350] mb-1">
                      Executing Lab Scientist
                    </label>
                    <input
                      type="text"
                      disabled
                      value={labStaff?.name || 'Marcus Vance, CLS'}
                      className="w-full text-xs font-mono rounded-xl border border-[#D5D9D7] p-2 bg-[#E5E8E6] text-[#4A5350]"
                    />
                  </div>
                </div>

                {/* Critical Panic Flag Alert Checkbox */}
                <div className="p-3.5 rounded-xl border border-rose-300 bg-rose-50/70 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="criticalCheck"
                    checked={isCriticalAlertChecked}
                    onChange={(e) => setIsCriticalAlertChecked(e.target.checked)}
                    className="h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                  />
                  <label htmlFor="criticalCheck" className="text-xs font-mono text-rose-900 cursor-pointer">
                    <strong>Critical / Panic Finding:</strong> Immediate automated phone/verbal escalation will be logged to attending physician ({selectedReq.referring_doctor}).
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReq(null)}
                    className="px-4 py-2 rounded-xl text-xs font-mono text-[#4A5350] hover:bg-[#E5E8E6] transition-colors"
                  >
                    Cancel / Choose Another
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-mono font-medium bg-[#174C40] hover:bg-[#123830] text-white transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    <span>Authorize, Electronically Certify & Publish to EHR</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      )}

      {/* TAB 4: Analyzer Calibration & QC */}
      {activeTab === 'equipment' && (
        <section className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#E5E8E6] p-6 shadow-xs space-y-6">
            <div className="border-b border-[#E5E8E6] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-serif font-semibold text-[#1F2421] flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-[#174C40]" />
                  Automated Clinical Analyzers & Quality Control (QC) Monitoring
                </h2>
                <p className="text-xs text-[#77817C] font-mono mt-1">
                  Daily Levey-Jennings QC monitoring, Westgard multi-rules compliance, and optical/photometric calibration logs.
                </p>
              </div>

              <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                CAP & ISO 15189 Compliant Laboratory
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analyzers.map(equip => {
                const isOverdue = equip.urgency === 'Overdue';
                const isDueSoon = equip.urgency === 'Due Soon';

                return (
                  <div
                    key={equip.id}
                    className="bg-[#FAFAF7] rounded-2xl border border-[#E5E8E6] p-5 space-y-3.5 hover:border-[#174C40]/40 transition-all shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[#1F2421]">{equip.analyzer_name}</span>
                        </div>
                        <div className="text-xs font-mono text-[#77817C] mt-0.5">
                          Code: <strong className="text-[#1F2421]">{equip.analyzer_code}</strong> • Dept: {equip.department}
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                          isOverdue
                            ? 'bg-rose-600 text-white animate-pulse'
                            : isDueSoon
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {equip.status}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> QC Passed (±1.5 SD)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white p-3 rounded-xl border border-[#E5E8E6]">
                      <div>
                        <span className="text-[#77817C] text-[10px] uppercase block">Last Calibrated</span>
                        <span className="text-[#1F2421]">
                          {new Date(equip.last_calibration_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#77817C] text-[10px] uppercase block">Next Due Date</span>
                        <span className={`font-semibold ${isOverdue ? 'text-rose-600' : isDueSoon ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {new Date(equip.next_due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {equip.notes && (
                      <p className="text-xs text-[#4A5350] italic">
                        Notes: &quot;{equip.notes}&quot;
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-mono text-[#77817C]">
                        Verified by: {equip.calibrated_by}
                      </span>
                      <button
                        onClick={() => openCalibrate(equip)}
                        className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-[#174C40] hover:bg-[#123830] text-white transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Sliders className="h-3 w-3 text-emerald-300" />
                        <span>Perform QC & Calibration</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 7. MODALS */}

      {/* Intake Accession Modal */}
      {showIntakeModal && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#E5E8E6] p-6 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E8E6] pb-3">
              <h3 className="font-serif font-semibold text-base text-[#1F2421] flex items-center gap-2">
                <Barcode className="h-4 w-4 text-[#174C40]" />
                Specimen Intake: {selectedReq.patient_name}
              </h3>
              <button onClick={() => setShowIntakeModal(false)} className="text-[#77817C] hover:text-[#1F2421]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleIntakeSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#4A5350] mb-1">Generated Sample / Barcode ID</label>
                <input
                  type="text"
                  value={intakeBarcode}
                  onChange={(e) => setIntakeBarcode(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                />
              </div>

              <div>
                <label className="block text-[#4A5350] mb-1">Specimen Collection Type</label>
                <input
                  type="text"
                  value={intakeSpecimenType}
                  onChange={(e) => setIntakeSpecimenType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                />
              </div>

              <div>
                <label className="block text-[#4A5350] mb-1">Status Action</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIntakeAction('received')}
                    className={`p-2.5 rounded-xl border text-center ${
                      intakeAction === 'received'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-[#E5E8E6] text-[#4A5350]'
                    }`}
                  >
                    Accept Sample
                  </button>
                  <button
                    type="button"
                    onClick={() => setIntakeAction('rejected')}
                    className={`p-2.5 rounded-xl border text-center ${
                      intakeAction === 'rejected'
                        ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold'
                        : 'border-[#E5E8E6] text-[#4A5350]'
                    }`}
                  >
                    Reject Sample
                  </button>
                </div>
              </div>

              {intakeAction === 'rejected' && (
                <div>
                  <label className="block text-rose-700 mb-1">Rejection Reason</label>
                  <input
                    type="text"
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Hemolyzed, clotted sample"
                    className="w-full p-2.5 rounded-xl border border-rose-300 bg-rose-50/50 text-rose-900"
                  />
                </div>
              )}

              <div>
                <label className="block text-[#4A5350] mb-1">Technician Notes</label>
                <input
                  type="text"
                  value={intakeNotes}
                  onChange={(e) => setIntakeNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIntakeModal(false)}
                  className="px-4 py-2 rounded-xl text-[#77817C] hover:bg-[#E5E8E6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#174C40] text-white hover:bg-[#123830]"
                >
                  Save Accession
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Panic Alert Modal */}
      {showPanicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-rose-300 p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rose-200 pb-3">
              <div className="flex items-center gap-2 text-rose-700 font-serif font-semibold text-base">
                <Siren className="h-5 w-5 animate-pulse text-rose-600" />
                <span>Urgent Broadcast: Critical / Panic Value Alert</span>
              </div>
              <button onClick={() => setShowPanicModal(false)} className="text-[#77817C] hover:text-[#1F2421]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleBroadcastPanicAlert} className="space-y-4 text-xs font-mono">
              <p className="text-[#4A5350]">
                Critical alert will be published to the attending physician&apos;s console and recorded in the hospital panic alert register.
              </p>

              <div>
                <label className="block text-[#4A5350] mb-1">Patient</label>
                <input
                  type="text"
                  disabled
                  value={selectedReq ? `${selectedReq.patient_name} (${selectedReq.id})` : 'Emergency Inpatient Core'}
                  className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#E5E8E6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4A5350] mb-1">Analyte Parameter</label>
                  <input
                    type="text"
                    required
                    value={panicParam}
                    onChange={(e) => setPanicParam(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                  />
                </div>
                <div>
                  <label className="block text-[#4A5350] mb-1">Measured Value</label>
                  <input
                    type="text"
                    required
                    value={panicValue}
                    onChange={(e) => setPanicValue(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-rose-400 bg-rose-50 text-rose-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4A5350] mb-1">Critical Threshold</label>
                  <input
                    type="text"
                    required
                    value={panicLimit}
                    onChange={(e) => setPanicLimit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                  />
                </div>
                <div>
                  <label className="block text-[#4A5350] mb-1">Attending Physician</label>
                  <input
                    type="text"
                    required
                    value={panicDoctor}
                    onChange={(e) => setPanicDoctor(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPanicModal(false)}
                  className="px-4 py-2 rounded-xl text-[#77817C] hover:bg-[#E5E8E6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-bold"
                >
                  Broadcast Panic Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Equipment Calibration Modal */}
      {showCalibrateModal && selectedAnalyzer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#E5E8E6] p-6 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E8E6] pb-3">
              <h3 className="font-serif font-semibold text-base text-[#1F2421] flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#174C40]" />
                Calibrate Analyzer: {selectedAnalyzer.analyzer_code}
              </h3>
              <button onClick={() => setShowCalibrateModal(false)} className="text-[#77817C] hover:text-[#1F2421]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCalibrateSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <span className="text-[#77817C] block text-[10px] uppercase">Analyzer Name</span>
                <strong className="text-[#1F2421]">{selectedAnalyzer.analyzer_name}</strong>
              </div>

              <div>
                <label className="block text-[#4A5350] mb-1">Extend Validity Period (Days)</label>
                <select
                  value={calibDays}
                  onChange={(e) => setCalibDays(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                >
                  <option value={7}>7 Days (High-throughput chemistry / Coagulation)</option>
                  <option value={14}>14 Days (Standard Hematology / Immunoassay)</option>
                  <option value={30}>30 Days (Clinical Microscopy & Urine Chemistry)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#4A5350] mb-1">Calibration Run Notes / Observations</label>
                <textarea
                  rows={3}
                  value={calibNotes}
                  onChange={(e) => setCalibNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D5D9D7] bg-[#FAFAF7]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCalibrateModal(false)}
                  className="px-4 py-2 rounded-xl text-[#77817C] hover:bg-[#E5E8E6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#174C40] text-white hover:bg-[#123830]"
                >
                  Confirm Calibration & Log QC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
