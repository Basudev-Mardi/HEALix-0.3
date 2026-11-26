'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Calendar,
  Phone,
  MapPin,
  Droplet,
  ShieldAlert,
  HeartHandshake,
  Clock,
  Stethoscope,
  Building2,
  CheckCircle2,
  PlusCircle,
  FileText,
  AlertCircle,
  Activity,
} from 'lucide-react';

interface PatientVisit {
  visit_id: string;
  visit_date: string;
  visit_type: string;
  status: string;
  created_at: string;
  department_id?: number;
  department_name?: string;
  doctor_id?: number;
  doctor_name?: string;
  token_number?: number;
  token_status?: string;
  fee_amount?: string | number;
  payment_status?: string;
}

export interface PatientProfileData {
  id: string;
  patient_id: string;
  patient_number: string;
  full_name: string;
  dob?: string;
  age?: {
    years: number;
    months: number;
    formatted: string;
  } | null;
  gender: string;
  mobile: string;
  address: string;
  blood_group?: string;
  allergies?: string;
  emergency_contact?: string;
  photo?: string;
  registration_date: string;
  totalVisits?: number;
  visits?: PatientVisit[];
}

interface PatientProfileModalProps {
  patientId: string;
  onClose: () => void;
  onCreateVisit?: (patient: PatientProfileData) => void;
}

export default function PatientProfileModal({
  patientId,
  onClose,
  onCreateVisit,
}: PatientProfileModalProps) {
  const [patient, setPatient] = useState<PatientProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      setLoading(true);
      setError(null);
      try {
        let res = await fetch(`/api/v1/reception/patients/${patientId}`);
        if (!res.ok) {
          res = await fetch(`http://localhost:5000/api/v1/reception/patients/${patientId}`);
        }
        if (!res.ok) {
          throw new Error(`Failed to load patient record (HTTP ${res.status})`);
        }
        const json = await res.json();
        if (isMounted) {
          if (json.success && json.patient) {
            setPatient(json.patient);
          } else {
            throw new Error(json.error || 'Failed to retrieve patient profile');
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Network error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [patientId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#77817C] hover:text-[#1F2421] hover:bg-[#FAFAF7] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="h-8 w-8 border-2 border-[#174C40] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#77817C] font-mono">Loading patient medical profile...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-600" />
              <h3 className="font-semibold text-sm">Failed to Load Profile</h3>
            </div>
            <p className="text-xs text-rose-800">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 transition-colors"
            >
              Close
            </button>
          </div>
        ) : patient ? (
          <>
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F0F2F0]">
              <div className="flex items-center gap-4">
                {patient.photo ? (
                  <img
                    src={patient.photo}
                    alt={patient.full_name}
                    className="h-16 w-16 rounded-2xl object-cover border border-[#E5E8E6]"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-2xl bg-[#174C40]/10 text-[#174C40] flex items-center justify-center font-serif text-2xl font-bold">
                    {patient.full_name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                      Returning Patient Record
                    </span>
                    <span className="text-xs font-mono text-[#77817C]">
                      ID: <strong className="text-[#174C40]">{patient.patient_id}</strong>
                    </span>
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-[#1F2421] mt-0.5">
                    {patient.full_name}
                  </h2>
                  <div className="text-xs text-[#77817C] font-mono mt-0.5">
                    MRN: {patient.patient_number} • Registered on {new Date(patient.registration_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Quick Action: Create New Visit */}
              {onCreateVisit && (
                <button
                  onClick={() => onCreateVisit(patient)}
                  className="px-5 py-2.5 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Create New Visit</span>
                </button>
              )}
            </div>

            {/* Basic Information Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] space-y-1">
                <span className="text-[10px] font-mono text-[#77817C] uppercase block flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-[#174C40]" /> Age &amp; Gender
                </span>
                <span className="font-semibold text-[#1F2421] text-sm block">
                  {patient.age?.formatted || 'DOB on record'} • {patient.gender}
                </span>
                <span className="text-[11px] text-[#77817C] font-mono block">DOB: {patient.dob || 'N/A'}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] space-y-1">
                <span className="text-[10px] font-mono text-[#77817C] uppercase block flex items-center gap-1">
                  <Phone className="h-3 w-3 text-[#174C40]" /> Contact Number
                </span>
                <span className="font-mono font-semibold text-[#1F2421] text-sm block">
                  {patient.mobile}
                </span>
                <span className="text-[11px] text-emerald-700 block">Verified for OPD check-in</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] space-y-1">
                <span className="text-[10px] font-mono text-[#77817C] uppercase block flex items-center gap-1">
                  <Droplet className="h-3 w-3 text-rose-600" /> Blood Group
                </span>
                <span className="font-bold text-rose-700 text-sm block font-mono">
                  {patient.blood_group || 'Unknown'}
                </span>
                <span className="text-[11px] text-[#77817C] block">Clinical reference flag</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] space-y-1 sm:col-span-2">
                <span className="text-[10px] font-mono text-[#77817C] uppercase block flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-[#174C40]" /> Residential Address
                </span>
                <span className="font-medium text-[#1F2421] block">
                  {patient.address}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] space-y-1">
                <span className="text-[10px] font-mono text-[#77817C] uppercase block flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3 text-amber-600" /> Allergies
                </span>
                <span className="font-medium text-amber-800 block">
                  {patient.allergies || 'None Reported'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] space-y-1 sm:col-span-3">
                <span className="text-[10px] font-mono text-[#77817C] uppercase block flex items-center gap-1">
                  <HeartHandshake className="h-3 w-3 text-[#174C40]" /> Emergency Contact
                </span>
                <span className="font-semibold text-[#1F2421] block">
                  {patient.emergency_contact || 'No emergency contact on file'}
                </span>
              </div>
            </div>

            {/* Visit History Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#174C40]" />
                  <h3 className="font-serif font-bold text-base text-[#1F2421]">
                    Hospital Visit Encounters ({patient.visits?.length || 0})
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-[#77817C]">
                  One patient can have multiple visits
                </span>
              </div>

              {patient.visits && patient.visits.length > 0 ? (
                <div className="divide-y divide-[#F0F2F0] border border-[#E5E8E6] rounded-2xl overflow-hidden text-xs">
                  {patient.visits.map((v) => (
                    <div
                      key={v.visit_id}
                      className="p-3.5 bg-white hover:bg-[#FAFAF7] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-[#174C40]">
                            {v.visit_id}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-700">
                            {v.visit_type}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                              v.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : v.status === 'In-Queue'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {v.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#4A5350] flex flex-wrap items-center gap-2">
                          <span>Dept: <strong>{v.department_name || 'Central OPD'}</strong></span>
                          <span>•</span>
                          <span>Doctor: <strong>{v.doctor_name || 'Staff Doctor'}</strong></span>
                          {v.token_number && (
                            <>
                              <span>•</span>
                              <span className="text-[#174C40] font-mono font-bold">Token #{v.token_number}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-left sm:text-right text-[11px] text-[#77817C] font-mono">
                        <div>{new Date(v.visit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        {v.fee_amount && <div>Fee: ${Number(v.fee_amount).toFixed(2)} ({v.payment_status || 'Paid'})</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] text-center text-xs text-[#77817C]">
                  No prior visits recorded for this patient. Click &ldquo;Create New Visit&rdquo; to register their first hospital encounter.
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
