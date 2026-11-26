'use client';

import React, { useState } from 'react';
import {
  Siren,
  X,
  AlertTriangle,
  ShieldAlert,
  User,
  HeartPulse,
  Clock,
  Radio,
  CheckCircle2,
  Lock,
  Printer,
  ChevronRight,
  Flame,
  Activity,
} from 'lucide-react';
import TokenSlipPrintModal, { type GeneratedTokenData } from './TokenSlipPrintModal';

interface EmergencyIntakeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function EmergencyIntakeModal({
  onClose,
  onSuccess,
}: EmergencyIntakeModalProps) {
  const [activeTab, setActiveTab] = useState<'register' | 'alert'>('register');

  // Registration Form State
  const [isUnknownPatient, setIsUnknownPatient] = useState<boolean>(true);
  const [patientId, setPatientId] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [estimatedAge, setEstimatedAge] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [assignedBay, setAssignedBay] = useState<string>('Emergency Resuscitation Bay 1');
  const [emergencyNotes, setEmergencyNotes] = useState<string>('');

  // Emergency Alert Form State
  const [alertType, setAlertType] = useState<
    'Code Blue - Cardiac Arrest' | 'Trauma Influx' | 'Acute Stroke Protocol' | 'Mass Casualty Incident'
  >('Code Blue - Cardiac Arrest');
  const [alertLocation, setAlertLocation] = useState<string>('Emergency Triage & Resuscitation Area');
  const [alertSeverity, setAlertSeverity] = useState<'Critical' | 'Severe' | 'Urgent'>('Critical');
  const [alertConditionSummary, setAlertConditionSummary] = useState<string>('');

  // UI Flow & Feedback State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<GeneratedTokenData | null>(null);
  const [alertBroadcastResult, setAlertBroadcastResult] = useState<{
    alert_type: string;
    location: string;
    notified_groups: string[];
    triggered_at: string;
  } | null>(null);
  const [showPrintSlip, setShowPrintSlip] = useState<boolean>(false);

  // Handle Emergency Patient Registration
  const handleRegisterEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        is_unknown_patient: isUnknownPatient,
        patient_id: isUnknownPatient ? null : patientId.trim(),
        full_name: isUnknownPatient ? (fullName.trim() || 'Unknown Trauma Arrival') : fullName.trim(),
        gender,
        estimated_age: estimatedAge.trim(),
        mobile: mobile.trim(),
        assigned_bay: assignedBay,
        emergency_notes: emergencyNotes.trim(),
        staff_role: 'receptionist',
        // Note: Even if requested_triage_level was passed, the backend strictly rejects / ignores it.
      };

      let res: Response;
      try {
        res = await fetch('/api/v1/reception/emergency/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        res = await fetch('http://localhost:5000/api/v1/reception/emergency/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `Emergency registration failed (${res.status})`);
      }

      setSuccessResult({
        visit: json.visit,
        token: json.token,
        patient: json.patient,
        department: {
          id: json.visit.department_id || 1,
          name: 'Emergency & Trauma Pavilion',
          prefix: 'EMR',
        },
        doctor: {
          id: json.visit.doctor_id || 1,
          name: json.doctor?.name || 'Emergency On-Duty Physician',
          cabin: json.assigned_bay || assignedBay,
        },
      });

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register emergency arrival');
    } finally {
      setLoading(false);
    }
  };

  // Handle Emergency Alert Broadcast
  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        alert_type: alertType,
        location: alertLocation.trim() || 'Emergency Reception Pavilion',
        severity: alertSeverity,
        condition_summary: alertConditionSummary.trim() || 'Urgent physician & crash team attendance required immediately.',
        staff_name: 'Reception Front Desk',
      };

      let res: Response;
      try {
        res = await fetch('/api/v1/reception/emergency/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        res = await fetch('http://localhost:5000/api/v1/reception/emergency/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `Emergency alert broadcast failed (${res.status})`);
      }

      setAlertBroadcastResult({
        alert_type: json.alert.alert_type,
        location: json.alert.location,
        notified_groups: json.alert.notified_groups || ['Trauma Response Team', 'Crash Cart Unit', 'Attending ER Physician'],
        triggered_at: json.alert.triggered_at,
      });

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to broadcast emergency alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
        <div className="relative w-full max-w-2xl rounded-3xl border border-red-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-[#77817C] hover:text-[#1F2421] hover:bg-[#FAFAF7] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase bg-red-100 text-red-800 border border-red-200">
                <Siren className="h-3.5 w-3.5 text-red-600 animate-bounce" />
                Emergency Department Intake
              </span>
              <span className="text-xs font-mono text-red-600 font-semibold">Priority Protocol Active</span>
            </div>
            <h2 className="text-2xl font-serif text-[#1F2421] tracking-tight">
              Rapid Emergency Intake &amp; Hospital Alerts
            </h2>
            <p className="text-xs text-[#4A5350]">
              Immediate intake for trauma arrivals and emergency code activation for clinical teams.
            </p>
          </div>

          {/* Clinical Restriction Notice (NON-NEGOTIABLE POLICY) */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
            <Lock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold uppercase tracking-wider text-[11px] text-amber-800 flex items-center gap-1.5">
                <span>Clinical Triage Restriction Policy</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-900 font-mono text-[10px]">
                  Pending Clinical Triage
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Receptionists must <strong>NOT</strong> assign or modify clinical triage priority (ESI-1 through ESI-5). All emergency visit records are permanently initialized to <strong>Pending Clinical Triage</strong> and can only be evaluated and assigned by attending emergency physicians and triage nurses upon clinical examination.
              </p>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setError(null);
              }}
              className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'register'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-[#77817C] hover:text-[#1F2421]'
              }`}
            >
              <HeartPulse className="h-4 w-4" />
              <span>Emergency Patient Intake</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('alert');
                setError(null);
              }}
              className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'alert'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-[#77817C] hover:text-[#1F2421]'
              }`}
            >
              <Siren className="h-4 w-4" />
              <span>Raise Emergency Alert (Code)</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SUCCESS STATE 1: Patient Registered */}
          {successResult ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-serif font-bold text-[#1F2421]">
                  Emergency Patient Intake Registered
                </h3>
                <p className="text-xs text-[#4A5350]">
                  Immediate priority token generated and clinical trauma unit alerted.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-emerald-100 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-[#77817C] block uppercase">Token Number</span>
                  <span className="text-2xl font-mono font-bold text-red-600">
                    {successResult.token.token_display}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#77817C] block uppercase">Patient</span>
                  <span className="font-semibold text-[#1F2421] truncate block">
                    {successResult.patient.full_name}
                  </span>
                  <span className="text-[10px] font-mono text-[#77817C]">
                    {successResult.patient.patient_id}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#77817C] block uppercase">Clinical Triage</span>
                  <span className="inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Pending MD Triage
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPrintSlip(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Emergency Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessResult(null);
                    onClose();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#E5E8E6] text-xs font-medium text-[#4A5350] hover:bg-white transition-colors cursor-pointer"
                >
                  Done &amp; Close
                </button>
              </div>
            </div>
          ) : alertBroadcastResult ? (
            /* SUCCESS STATE 2: Alert Broadcast */
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
                <Siren className="h-6 w-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-serif font-bold text-red-900">
                  {alertBroadcastResult.alert_type} Activated
                </h3>
                <p className="text-xs text-red-700">
                  Location: <strong>{alertBroadcastResult.location}</strong>
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-red-100 text-xs text-left space-y-2">
                <span className="text-[10px] font-mono text-[#77817C] block uppercase">
                  Teams Broadcasted via Hospital Paging &amp; Station Display:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {alertBroadcastResult.notified_groups.map((grp, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md bg-red-100 text-red-800 font-mono text-[11px] font-medium"
                    >
                      ✓ {grp}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAlertBroadcastResult(null);
                  onClose();
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Acknowledge &amp; Return to Dashboard
              </button>
            </div>
          ) : activeTab === 'register' ? (
            /* TAB 1: EMERGENCY PATIENT REGISTRATION */
            <form onSubmit={handleRegisterEmergency} className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAF7] border border-[#E5E8E6]">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-[#1F2421]">Unknown / Unconscious Patient</div>
                  <div className="text-[11px] text-[#77817C]">
                    Check if patient is unidentified or unable to provide identity.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isUnknownPatient}
                    onChange={(e) => setIsUnknownPatient(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {!isUnknownPatient ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-[#1F2421]">
                      Patient ID (if known)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PAT-2026-0045"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E5E8E6] text-xs font-mono focus:border-red-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-[#1F2421]">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Patient Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E5E8E6] text-xs focus:border-red-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-[#1F2421]">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | 'Other')}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E5E8E6] text-xs bg-white focus:border-red-500 focus:outline-hidden"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other / Unknown</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-[#1F2421]">Estimated Age</label>
                    <input
                      type="number"
                      placeholder="e.g. 35"
                      value={estimatedAge}
                      onChange={(e) => setEstimatedAge(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E5E8E6] text-xs focus:border-red-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-[#1F2421]">Contact / Escort Mobile</label>
                    <input
                      type="tel"
                      placeholder="Escort / EMS Mobile"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E5E8E6] text-xs focus:border-red-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#1F2421]">
                    Assigned Resuscitation / Trauma Bay
                  </label>
                  <select
                    value={assignedBay}
                    onChange={(e) => setAssignedBay(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E8E6] text-xs bg-white focus:border-red-500 focus:outline-hidden"
                  >
                    <option value="Emergency Resuscitation Bay 1">Emergency Resuscitation Bay 1 (Level 1 Trauma)</option>
                    <option value="Emergency Resuscitation Bay 2">Emergency Resuscitation Bay 2 (Cardiac / Stroke)</option>
                    <option value="Critical Care Pod A">Critical Care Pod A</option>
                    <option value="Critical Care Pod B">Critical Care Pod B</option>
                    <option value="Acute Minor Trauma Cubicle 1">Acute Minor Trauma Cubicle 1</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#1F2421]">
                    Clinical Triage Priority
                  </label>
                  <div className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 bg-zinc-100 text-xs font-medium text-zinc-600 flex items-center justify-between">
                    <span>Pending Clinical Triage</span>
                    <Lock className="h-3.5 w-3.5 text-zinc-400" />
                  </div>
                  <span className="text-[10px] text-[#77817C] block">
                    Locked per Clinical Protocol: Assigned exclusively by attending physician.
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#1F2421]">
                  Emergency Condition Notes / Physical Distinguishing Marks
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Unconscious road traffic collision arrival via 108 ambulance, laceration on forehead, tattoo on right forearm..."
                  value={emergencyNotes}
                  onChange={(e) => setEmergencyNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E8E6] text-xs focus:border-red-500 focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0F2F0]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl border border-[#E5E8E6] text-xs font-medium text-[#4A5350] hover:bg-[#FAFAF7] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  <HeartPulse className="h-4 w-4" />
                  <span>{loading ? 'Creating Emergency Intake...' : 'Admit & Generate Priority Token'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* TAB 2: EMERGENCY CODE BROADCAST */
            <form onSubmit={handleBroadcastAlert} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#1F2421]">Emergency Alert Type</label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-red-300 bg-red-50/50 text-xs font-semibold text-red-900 focus:outline-hidden"
                >
                  <option value="Code Blue - Cardiac Arrest">Code Blue - Cardiac / Respiratory Arrest</option>
                  <option value="Trauma Influx">Trauma Influx (Level 1 Multi-Trauma Arrival)</option>
                  <option value="Acute Stroke Protocol">Acute Stroke Protocol (Window Period Thrombolysis Alert)</option>
                  <option value="Mass Casualty Incident">Mass Casualty Incident (Disaster Intake Protocol)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#1F2421]">Incident Location</label>
                  <input
                    type="text"
                    value={alertLocation}
                    onChange={(e) => setAlertLocation(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E8E6] text-xs focus:border-red-500 focus:outline-hidden"
                    placeholder="e.g. Resuscitation Bay 1, Reception Hall"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#1F2421]">Alert Severity</label>
                  <select
                    value={alertSeverity}
                    onChange={(e) => setAlertSeverity(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E8E6] text-xs bg-white focus:border-red-500 focus:outline-hidden"
                  >
                    <option value="Critical">Critical (Immediate Response &lt; 2 mins)</option>
                    <option value="Severe">Severe (Response &lt; 5 mins)</option>
                    <option value="Urgent">Urgent (Team Standby)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#1F2421]">
                  Alert Description / Clinical Instructions
                </label>
                <textarea
                  rows={3}
                  value={alertConditionSummary}
                  onChange={(e) => setAlertConditionSummary(e.target.value)}
                  placeholder="Detail the clinical situation, patient status, or EMS notification..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E8E6] text-xs focus:border-red-500 focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0F2F0]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl border border-[#E5E8E6] text-xs font-medium text-[#4A5350] hover:bg-[#FAFAF7] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  <Siren className="h-4 w-4 animate-bounce" />
                  <span>{loading ? 'Broadcasting Alert...' : 'Broadcast Emergency Code'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Slip Modal */}
      {showPrintSlip && successResult && (
        <TokenSlipPrintModal
          data={successResult}
          onClose={() => {
            setShowPrintSlip(false);
            setSuccessResult(null);
            onClose();
          }}
        />
      )}
    </>
  );
}
