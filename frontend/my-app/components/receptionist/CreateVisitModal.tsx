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
} from 'lucide-react';
import type { PatientProfileData } from './PatientProfileModal';

interface CreateVisitModalProps {
  patient: PatientProfileData;
  onClose: () => void;
  onVisitCreated?: (visit: any) => void;
}

interface DepartmentOption {
  id: number;
  name: string;
}

interface DoctorOption {
  id: number;
  name: string;
  department_id: number;
  specialty?: string;
  availability_status?: string;
}

const VISIT_TYPES = [
  'OPD Consultation',
  'Follow-up',
  'Emergency',
  'Walk-in',
  'Diagnostics',
  'Specialist',
];

export default function CreateVisitModal({
  patient,
  onClose,
  onVisitCreated,
}: CreateVisitModalProps) {
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number>(1);
  const [selectedDocId, setSelectedDocId] = useState<number>(1);
  const [visitType, setVisitType] = useState<string>('OPD Consultation');
  const [reason, setReason] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  // Fetch departments and doctors list
  useEffect(() => {
    async function loadOptions() {
      try {
        const res = await fetch('/api/v1/reception/dashboard');
        if (res.ok) {
          const json = await res.json();
          if (json.departmentQueues) {
            setDepartments(
              json.departmentQueues.map((d: any) => ({
                id: d.departmentId,
                name: d.departmentName,
              }))
            );
          }
        }
      } catch {
        // Fallback departments
        setDepartments([
          { id: 1, name: 'Cardiology & Heart Institute' },
          { id: 2, name: 'Neurology & Neurosciences' },
          { id: 3, name: 'Orthopedics & Joint Reconstruction' },
          { id: 4, name: 'Comprehensive Oncology' },
          { id: 5, name: 'Pediatrics & Neonatology' },
          { id: 6, name: 'Emergency & Critical Care' },
        ]);
      }
    }
    loadOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        patient_id: patient.patient_id || patient.id,
        department_id: selectedDeptId,
        doctor_id: selectedDocId,
        visit_type: visitType,
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
        throw new Error(json.error || 'Failed to create hospital visit');
      }

      if (json.success && json.visit) {
        setSuccessResult(json.visit);
        if (onVisitCreated) {
          onVisitCreated(json.visit);
        }
      } else {
        throw new Error('Unexpected response from server');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create encounter');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#77817C] hover:text-[#1F2421] hover:bg-[#FAFAF7] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {successResult ? (
          <div className="space-y-6 text-center py-4">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-serif font-bold text-[#1F2421]">
                Encounter Visit Created!
              </h3>
              <p className="text-xs text-[#77817C]">
                New hospital visit registered for returning patient without duplicate registration.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#77817C]">Visit ID:</span>
                <span className="font-mono font-bold text-[#174C40]">{successResult.visit_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77817C]">Patient:</span>
                <span className="font-semibold text-[#1F2421]">{successResult.patient_name || patient.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77817C]">Department:</span>
                <span className="font-medium">{successResult.department_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77817C]">Visit Type:</span>
                <span className="font-mono">{successResult.visit_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77817C]">Status:</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-[10px] font-semibold">
                  {successResult.status}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#174C40] text-white text-xs font-semibold hover:bg-[#123B32] transition-colors cursor-pointer"
            >
              Done &amp; Return to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-[#174C40]/10 text-[#174C40] border border-[#174C40]/20">
                  Returning Patient Intake
                </span>
              </div>
              <h2 className="text-xl font-serif font-bold text-[#1F2421] mt-1">
                Create New Hospital Visit
              </h2>
              <p className="text-xs text-[#77817C] mt-0.5">
                Register a new OPD encounter for <strong className="text-[#1F2421]">{patient.full_name}</strong> ({patient.patient_id}).
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Department Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1F2421]">
                Target Clinical Department <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77817C]" />
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E8E6] text-xs text-[#1F2421] bg-white focus:outline-none focus:border-[#174C40]"
                  disabled={isSubmitting}
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Visit Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1F2421]">
                Visit Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {VISIT_TYPES.slice(0, 3).map((vt) => (
                  <button
                    key={vt}
                    type="button"
                    onClick={() => setVisitType(vt)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      visitType === vt
                        ? 'border-[#174C40] bg-[#174C40] text-white shadow-xs'
                        : 'border-[#E5E8E6] bg-[#FAFAF7] text-[#4A5350] hover:bg-white'
                    }`}
                  >
                    {vt}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason / Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1F2421]">
                Chief Complaint / Visit Reason <span className="text-[11px] font-normal text-[#77817C]">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Chest pain follow-up, routine checkup, prescription renewal"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E8E6] text-xs text-[#1F2421] bg-white focus:outline-none focus:border-[#174C40]"
                disabled={isSubmitting}
              />
            </div>

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
                className="px-6 py-2 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <span>Checking in...</span>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4" />
                    <span>Create Visit &amp; Queue</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
