'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  Building2,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Activity,
  Layers,
  Sparkles,
  Printer,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import type { PatientProfileData } from './PatientProfileModal';
import TokenSlipPrintModal, { type GeneratedTokenData } from './TokenSlipPrintModal';

interface CreateVisitModalProps {
  patient: PatientProfileData;
  onClose: () => void;
  onVisitCreated?: (data: GeneratedTokenData) => void;
}

interface DepartmentOption {
  id: number;
  name: string;
  token_prefix?: string;
}

interface DoctorOption {
  id: number;
  name: string;
  department_id: number;
  specialty?: string;
  availability_status?: string;
  waiting_count?: number;
}

const VISIT_TYPES = [
  'Walk-in',
  'OPD Consultation',
  'Follow-up',
  'Emergency',
  'Diagnostics',
  'Specialist',
];

export default function CreateVisitModal({
  patient,
  onClose,
  onVisitCreated,
}: CreateVisitModalProps) {
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [allDoctors, setAllDoctors] = useState<DoctorOption[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number>(1);
  const [selectedDocMode, setSelectedDocMode] = useState<'auto' | 'specific'>('auto');
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [visitType, setVisitType] = useState<string>('Walk-in');
  const [priority, setPriority] = useState<string>('Standard');
  const [reason, setReason] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedTokenSlip, setGeneratedTokenSlip] = useState<GeneratedTokenData | null>(null);

  // Fetch departments and doctors list
  useEffect(() => {
    async function loadOptions() {
      try {
        let res = await fetch('/api/v1/reception/departments-and-doctors');
        if (!res.ok) {
          res = await fetch('http://localhost:5000/api/v1/reception/departments-and-doctors');
        }
        if (res.ok) {
          const json = await res.json();
          if (json.departments && json.departments.length > 0) {
            setDepartments(json.departments);
            setSelectedDeptId(json.departments[0].id);
          }
          if (json.doctors) {
            setAllDoctors(json.doctors);
          }
        }
      } catch {
        // Fallback
        setDepartments([
          { id: 1, name: 'Cardiology & Heart Institute', token_prefix: 'C' },
          { id: 2, name: 'Neurology & Neurosciences', token_prefix: 'N' },
          { id: 3, name: 'Orthopedics & Joint Reconstruction', token_prefix: 'O' },
          { id: 4, name: 'Comprehensive Oncology', token_prefix: 'ON' },
          { id: 5, name: 'Pediatrics & Neonatology', token_prefix: 'P' },
          { id: 6, name: 'Emergency & Critical Care', token_prefix: 'E' },
        ]);
      }
    }
    loadOptions();
  }, []);

  // Filter doctors by selected department
  const departmentDoctors = allDoctors.filter(
    (doc) => doc.department_id === selectedDeptId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        patient_id: patient.patient_id || patient.id,
        department_id: selectedDeptId,
        doctor_id: selectedDocMode === 'specific' ? selectedDocId : 'auto',
        visit_type: visitType,
        priority: visitType === 'Emergency' ? 'Emergency' : priority,
        reason: reason.trim(),
      };

      let res = await fetch('/api/v1/reception/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        res = await fetch('http://localhost:5000/api/v1/reception/visits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to create hospital visit and token');
      }

      if (json.success && json.token && json.visit) {
        setGeneratedTokenSlip(json);
        if (onVisitCreated) {
          onVisitCreated(json);
        }
      } else {
        throw new Error('Unexpected response from server');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create visit and token');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If token is generated, show the printable token slip modal!
  if (generatedTokenSlip) {
    return (
      <TokenSlipPrintModal
        data={generatedTokenSlip}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#77817C] hover:text-[#1F2421] hover:bg-[#FAFAF7] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-[#174C40]/10 text-[#174C40] border border-[#174C40]/20">
                OPD Queue Intake
              </span>
              <span className="text-xs font-mono text-[#77817C]">
                • Auto Token Generator
              </span>
            </div>
            <h2 className="text-xl font-serif font-bold text-[#1F2421] mt-1">
              Create Visit &amp; Generate OPD Token
            </h2>
            <p className="text-xs text-[#77817C] mt-0.5">
              Patient: <strong className="text-[#1F2421]">{patient.full_name}</strong> ({patient.patient_id})
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2 shadow-xs">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Clinical Department */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#1F2421]">
                1. Select Clinical Department <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-mono text-[#174C40] font-semibold">
                Prefix: {departments.find((d) => d.id === selectedDeptId)?.token_prefix || 'G'}
              </span>
            </div>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77817C]" />
              <select
                value={selectedDeptId}
                onChange={(e) => {
                  setSelectedDeptId(Number(e.target.value));
                  setSelectedDocId(null);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E8E6] text-xs text-[#1F2421] bg-white focus:outline-none focus:border-[#174C40]"
                disabled={isSubmitting}
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} (Prefix: {dept.token_prefix || 'G'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Doctor Assignment (Auto vs Specific) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#1F2421]">
              2. Doctor Assignment Mode <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedDocMode('auto');
                  setSelectedDocId(null);
                }}
                className={`p-3 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                  selectedDocMode === 'auto'
                    ? 'border-[#174C40] bg-[#174C40]/5 text-[#174C40] font-semibold shadow-2xs'
                    : 'border-[#E5E8E6] bg-[#FAFAF7] text-[#4A5350]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="h-3.5 w-3.5 text-[#174C40]" />
                  <span>Automatic Assignment</span>
                </div>
                <div className="text-[10px] text-[#77817C] font-normal mt-0.5">
                  Routes to least-loaded available doctor
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedDocMode('specific');
                  if (!selectedDocId && departmentDoctors.length > 0) {
                    setSelectedDocId(departmentDoctors[0].id);
                  }
                }}
                className={`p-3 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                  selectedDocMode === 'specific'
                    ? 'border-[#174C40] bg-[#174C40]/5 text-[#174C40] font-semibold shadow-2xs'
                    : 'border-[#E5E8E6] bg-[#FAFAF7] text-[#4A5350]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <Stethoscope className="h-3.5 w-3.5 text-[#174C40]" />
                  <span>Select Specific Doctor</span>
                </div>
                <div className="text-[10px] text-[#77817C] font-normal mt-0.5">
                  Pick clinician cabin manually
                </div>
              </button>
            </div>

            {/* If specific doctor chosen */}
            {selectedDocMode === 'specific' && (
              <div className="pt-1.5">
                <select
                  value={selectedDocId || ''}
                  onChange={(e) => setSelectedDocId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E8E6] text-xs text-[#1F2421] bg-white focus:outline-none focus:border-[#174C40]"
                  disabled={isSubmitting}
                >
                  {departmentDoctors.length > 0 ? (
                    departmentDoctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} • {doc.availability_status || 'Available'} ({doc.waiting_count ?? 0} waiting)
                      </option>
                    ))
                  ) : (
                    <option value="">No dedicated doctor in this department (Auto-route)</option>
                  )}
                </select>
              </div>
            )}
          </div>

          {/* 3. Visit Type (Supports Walk-In) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#1F2421]">
                3. Visit Intake Type <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                Walk-ins Supported
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {VISIT_TYPES.map((vt) => (
                <button
                  key={vt}
                  type="button"
                  onClick={() => setVisitType(vt)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    visitType === vt
                      ? 'border-[#174C40] bg-[#174C40] text-white shadow-xs font-semibold'
                      : 'border-[#E5E8E6] bg-[#FAFAF7] text-[#4A5350] hover:bg-white'
                  }`}
                >
                  {vt}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Chief Complaint / Visit Reason */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1F2421]">
              Chief Complaint / Clinical Notes <span className="text-[11px] font-normal text-[#77817C]">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Chest tightness, blood pressure review, walk-in consultation"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E8E6] text-xs text-[#1F2421] bg-white focus:outline-none focus:border-[#174C40]"
              disabled={isSubmitting}
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#F0F2F0] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-[#E5E8E6] text-xs font-medium text-[#4A5350] hover:bg-[#FAFAF7] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating Token...</span>
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4" />
                  <span>Generate OPD Token &amp; Slip</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
