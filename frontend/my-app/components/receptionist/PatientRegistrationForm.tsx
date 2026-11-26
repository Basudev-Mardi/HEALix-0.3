'use client';

import React, { useState, useEffect, useId, useCallback } from 'react';
import {
  User,
  Calendar,
  Phone,
  MapPin,
  AlertTriangle,
  HeartHandshake,
  Droplet,
  Camera,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  X,
  Upload,
  UserCheck,
  ShieldAlert,
  Users,
  PlusCircle,
  FileText,
} from 'lucide-react';
import PatientProfileModal from './PatientProfileModal';
import CreateVisitModal from './CreateVisitModal';

interface PatientRegistrationFormProps {
  onSuccess?: (patient: RegisteredPatient) => void;
  onCancel?: () => void;
}

export interface RegisteredPatient {
  id: string;
  patient_id: string;
  patient_number: string;
  full_name: string;
  dob: string;
  age?: {
    years: number;
    months: number;
    formatted: string;
  };
  gender: string;
  mobile: string;
  address: string;
  blood_group?: string;
  allergies?: string;
  emergency_contact: string;
  photo?: string;
  registration_date: string;
}

interface FormErrors {
  full_name?: string;
  dob?: string;
  gender?: string;
  mobile?: string;
  address?: string;
  emergency_contact?: string;
  blood_group?: string;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
const COMMON_ALLERGIES = ['Penicillin', 'Sulfa Drugs', 'Aspirin', 'Latex', 'Peanuts', 'None'];

export default function PatientRegistrationForm({
  onSuccess,
  onCancel,
}: PatientRegistrationFormProps) {
  // Pre-allocated / Auto-generated ID preview
  const [patientIdPreview, setPatientIdPreview] = useState<string>('Generating...');
  const [currentRegDate, setCurrentRegDate] = useState<string>('');

  // Form Fields
  const [fullName, setFullName] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [calculatedAge, setCalculatedAge] = useState<{
    years: number;
    months: number;
    formatted: string;
  } | null>(null);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [mobile, setMobile] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [bloodGroup, setBloodGroup] = useState<string>('');
  const [allergies, setAllergies] = useState<string>('');
  const [emergencyContact, setEmergencyContact] = useState<string>('');
  const [photo, setPhoto] = useState<string>('');

  // Submission & Validation State
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [registeredPatient, setRegisteredPatient] = useState<RegisteredPatient | null>(null);

  // Live Duplicate Detection State
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [duplicateDismissed, setDuplicateDismissed] = useState<boolean>(false);
  const [inspectPatientId, setInspectPatientId] = useState<string | null>(null);
  const [visitTargetPatient, setVisitTargetPatient] = useState<any | null>(null);

  // Today's ISO date string for input max attribute
  const todayIso = new Date().toISOString().split('T')[0];

  // Fetch next unique Patient ID preview
  const fetchNextId = useCallback(async () => {
    try {
      let res = await fetch('/api/v1/reception/patients/next-id');
      if (!res.ok) {
        res = await fetch('http://localhost:5000/api/v1/reception/patients/next-id');
      }
      if (res.ok) {
        const json = await res.json();
        if (json.nextId) {
          setPatientIdPreview(json.nextId);
        }
      }
    } catch {
      // Fallback preview
      const yr = new Date().getFullYear();
      setPatientIdPreview(`HX-PT-${yr}-${Math.floor(100000 + Math.random() * 900000)}`);
    }
  }, []);

  useEffect(() => {
    fetchNextId();
    setCurrentRegDate(
      new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    );
  }, [fetchNextId]);

  // Live Age Calculation from DOB
  useEffect(() => {
    if (!dob) {
      setCalculatedAge(null);
      return;
    }

    const birth = new Date(dob);
    const today = new Date();

    if (isNaN(birth.getTime()) || birth > today) {
      setCalculatedAge(null);
      return;
    }

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    if (days < 0) {
      months -= 1;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const formatted =
      years === 0
        ? `${months} month${months === 1 ? '' : 's'}`
        : `${years} yr${years === 1 ? '' : 's'}${months > 0 ? ` ${months}m` : ''}`;

    setCalculatedAge({
      years: Math.max(0, years),
      months: Math.max(0, months),
      formatted,
    });
  }, [dob]);

  // Live Duplicate Detection Debounce Effect
  useEffect(() => {
    const trimmedName = fullName.trim();
    const cleanDigits = mobile.replace(/[^0-9]/g, '');

    if (trimmedName.length < 3 && cleanDigits.length < 7) {
      setDuplicateMatches([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (trimmedName.length >= 3) params.set('name', trimmedName);
        if (cleanDigits.length >= 7) params.set('mobile', mobile.trim());

        let res = await fetch(`/api/v1/reception/patients/check-duplicates?${params.toString()}`);
        if (!res.ok) {
          res = await fetch(`http://localhost:5000/api/v1/reception/patients/check-duplicates?${params.toString()}`);
        }
        if (res.ok) {
          const json = await res.json();
          if (json.hasPossibleDuplicates && Array.isArray(json.matches)) {
            setDuplicateMatches(json.matches);
            setDuplicateDismissed(false);
          } else {
            setDuplicateMatches([]);
          }
        }
      } catch {
        // silent catch for live background duplicate check
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [fullName, mobile]);

  // Validate fields on change
  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'full_name':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Full name must be at least 2 characters';
        return undefined;

      case 'dob':
        if (!value) return 'Date of birth is required';
        const d = new Date(value);
        if (isNaN(d.getTime())) return 'Invalid date';
        if (d > new Date()) return 'Date of birth cannot be in the future';
        if (new Date().getFullYear() - d.getFullYear() > 130) return 'Verify date of birth (>130 yrs)';
        return undefined;

      case 'mobile':
        if (!value.trim()) return 'Mobile number is required';
        const digits = value.replace(/[^0-9]/g, '');
        if (digits.length < 10) return 'Mobile number must have at least 10 digits';
        if (digits.length > 15) return 'Mobile number is too long (max 15 digits)';
        return undefined;

      case 'address':
        if (!value.trim()) return 'Residential address is required';
        if (value.trim().length < 5) return 'Please provide full address details (min 5 chars)';
        return undefined;

      case 'emergency_contact':
        if (!value.trim()) return 'Emergency contact is required';
        if (value.trim().length < 3) return 'Enter emergency contact name and phone number';
        return undefined;

      default:
        return undefined;
    }
  };

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  // Quick allergy tag appender
  const handleAddAllergy = (tag: string) => {
    if (tag === 'None') {
      setAllergies('None Reported');
      return;
    }
    if (!allergies || allergies === 'None Reported') {
      setAllergies(tag);
    } else if (!allergies.toLowerCase().includes(tag.toLowerCase())) {
      setAllergies(`${allergies}, ${tag}`);
    }
  };

  // Photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Photo must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all as touched
    setTouched({
      full_name: true,
      dob: true,
      mobile: true,
      address: true,
      emergency_contact: true,
    });

    const newErrors: FormErrors = {
      full_name: validateField('full_name', fullName),
      dob: validateField('dob', dob),
      mobile: validateField('mobile', mobile),
      address: validateField('address', address),
      emergency_contact: validateField('emergency_contact', emergencyContact),
    };

    setErrors(newErrors);

    // If any error exists, prevent submission
    if (Object.values(newErrors).some(Boolean)) {
      setServerError('Please correct the highlighted fields before submitting.');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        full_name: fullName.trim(),
        dob,
        gender,
        mobile: mobile.trim(),
        address: address.trim(),
        blood_group: bloodGroup || '',
        allergies: allergies.trim() || '',
        emergency_contact: emergencyContact.trim(),
        photo: photo || '',
      };

      let res: Response;
      try {
        res = await fetch('/api/v1/reception/patients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } catch {
        res = await fetch('http://localhost:5000/api/v1/reception/patients', {
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
        if (res.status === 409 && json.duplicate) {
          throw new Error(
            `Duplicate Patient Detected: A record for '${json.duplicate.fullName}' with phone '${json.duplicate.mobile}' is already registered as ${json.duplicate.patientId}.`
          );
        }
        throw new Error(json.error || json.message || 'Failed to register patient');
      }

      if (json.success && json.patient) {
        setRegisteredPatient(json.patient);
        if (onSuccess) {
          onSuccess(json.patient);
        }
      } else {
        throw new Error('Unexpected response received from server.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form to register another patient
  const handleResetForm = () => {
    setFullName('');
    setDob('');
    setCalculatedAge(null);
    setGender('Male');
    setMobile('');
    setAddress('');
    setBloodGroup('');
    setAllergies('');
    setEmergencyContact('');
    setPhoto('');
    setErrors({});
    setTouched({});
    setServerError(null);
    setRegisteredPatient(null);
    fetchNextId();
  };

  // ==========================================================
  // SUCCESS STATE: REGISTRATION CONFIRMATION CARD
  // ==========================================================
  if (registeredPatient) {
    return (
      <div className="w-full max-w-3xl mx-auto rounded-3xl border border-emerald-200 bg-white p-6 sm:p-10 shadow-xs space-y-6">
        <div className="flex items-center gap-3 text-emerald-800 bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-200">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
          <div>
            <h3 className="font-semibold text-emerald-950 text-sm">
              Patient Registered Successfully
            </h3>
            <p className="text-xs text-emerald-800">
              The record has been permanently saved to the hospital database and assigned a unique MRN.
            </p>
          </div>
        </div>

        {/* Official Patient Intake Summary Card */}
        <div className="rounded-2xl border border-[#E5E8E6] bg-gradient-to-br from-white to-[#FAFAF7] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E8E6]">
            <div className="flex items-center gap-4">
              {registeredPatient.photo ? (
                <img
                  src={registeredPatient.photo}
                  alt={registeredPatient.full_name}
                  className="h-16 w-16 rounded-2xl object-cover border border-[#E5E8E6] shadow-2xs"
                />
              ) : (
                <div className="h-16 w-16 rounded-2xl bg-[#174C40]/10 text-[#174C40] flex items-center justify-center font-serif text-2xl font-bold">
                  {registeredPatient.full_name.charAt(0)}
                </div>
              )}
              <div>
                <span className="text-[11px] font-mono font-bold text-[#174C40] uppercase tracking-wider block">
                  Official Medical Record
                </span>
                <h2 className="text-2xl font-serif font-bold text-[#1F2421]">
                  {registeredPatient.full_name}
                </h2>
                <div className="text-xs text-[#77817C] font-mono mt-0.5">
                  ID: <span className="font-bold text-[#174C40]">{registeredPatient.patient_id}</span> • MRN: {registeredPatient.patient_number}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-mono text-[#77817C] uppercase block">
                Registration Timestamp
              </span>
              <span className="text-xs font-mono font-medium text-[#1F2421]">
                {new Date(registeredPatient.registration_date).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-white border border-[#E5E8E6]">
              <span className="text-[10px] font-mono text-[#77817C] uppercase block">Age &amp; Gender</span>
              <span className="font-semibold text-[#1F2421]">
                {registeredPatient.age?.formatted || 'DOB recorded'} • {registeredPatient.gender}
              </span>
              <span className="text-[10px] text-[#77817C] block font-mono">DOB: {registeredPatient.dob}</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#E5E8E6]">
              <span className="text-[10px] font-mono text-[#77817C] uppercase block">Mobile Phone</span>
              <span className="font-mono font-semibold text-[#1F2421]">{registeredPatient.mobile}</span>
              <span className="text-[10px] text-emerald-700 block font-mono">Verified for SMS updates</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#E5E8E6]">
              <span className="text-[10px] font-mono text-[#77817C] uppercase block">Blood Group</span>
              <span className="font-bold text-rose-700 font-mono">
                {registeredPatient.blood_group || 'Unknown'}
              </span>
              <span className="text-[10px] text-[#77817C] block">Clinical reference</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#E5E8E6] sm:col-span-2">
              <span className="text-[10px] font-mono text-[#77817C] uppercase block">Residential Address</span>
              <span className="font-medium text-[#1F2421]">{registeredPatient.address}</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#E5E8E6]">
              <span className="text-[10px] font-mono text-[#77817C] uppercase block">Known Allergies</span>
              <span className="font-medium text-amber-800">
                {registeredPatient.allergies || 'None Reported'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#E5E8E6] sm:col-span-3">
              <span className="text-[10px] font-mono text-[#77817C] uppercase block">Emergency Contact</span>
              <span className="font-semibold text-[#1F2421]">{registeredPatient.emergency_contact}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border border-[#E5E8E6] text-xs font-medium text-[#4A5350] hover:bg-[#FAFAF7] transition-colors cursor-pointer"
            >
              Back to Live Queue Dashboard
            </button>
          )}
          <button
            onClick={handleResetForm}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 ml-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Register Another Patient</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // REGISTRATION FORM
  // ==========================================================
  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-10 shadow-xs space-y-8">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F0F2F0]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-[#174C40]/10 text-[#174C40] border border-[#174C40]/20">
              Reception Desk Form
            </span>
            <span className="text-xs font-mono text-[#77817C]">• New Patient Intake</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#1F2421] mt-1 tracking-tight">
            New Patient Registration
          </h1>
          <p className="text-xs text-[#77817C] mt-0.5">
            Capture patient demographics, emergency contact, and clinical flags. All required fields are marked with *.
          </p>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E8E6] text-xs font-medium text-[#77817C] hover:text-[#1F2421] hover:bg-[#FAFAF7] transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Queue</span>
          </button>
        )}
      </div>

      {/* Auto-generated Identifiers Banner */}
      <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <span className="text-[#77817C]">Pre-allocated Patient ID:</span>
          <span className="px-3 py-1 rounded-lg bg-white border border-[#E5E8E6] text-[#174C40] font-bold text-sm shadow-2xs">
            {patientIdPreview}
          </span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-sans font-medium">
            Auto-Generated
          </span>
        </div>

        <div className="flex items-center gap-2 text-[#77817C]">
          <Calendar className="h-3.5 w-3.5 text-[#174C40]" />
          <span>Registration Date: <strong className="text-[#1F2421]">{currentRegDate}</strong></span>
        </div>
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-900 flex items-start gap-3 shadow-xs">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-semibold text-rose-950">Registration Failed</h4>
            <p className="mt-0.5 text-rose-800">{serverError}</p>
          </div>
        </div>
      )}

      {/* Live Duplicate Warning Card */}
      {duplicateMatches.length > 0 && !duplicateDismissed && (
        <div className="p-5 rounded-2xl border border-amber-300 bg-amber-50/70 text-amber-950 space-y-4 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-amber-950">
                  Potential Existing Patient Records Detected ({duplicateMatches.length})
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  A patient with a matching name or phone is already on file. Avoid creating duplicate registrations for returning patients.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDuplicateDismissed(true)}
              className="text-xs text-amber-800 hover:text-amber-950 underline cursor-pointer shrink-0 font-medium"
            >
              Dismiss Warning
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {duplicateMatches.slice(0, 4).map((cand) => (
              <div
                key={cand.id || cand.patient_id}
                className="p-3.5 rounded-xl bg-white border border-amber-200/80 shadow-2xs space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-[#1F2421] text-sm block">
                      {cand.full_name}
                    </span>
                    <span className="font-mono text-[11px] text-[#174C40] font-bold">
                      {cand.patient_id}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-100 text-amber-900 border border-amber-200">
                    {cand.duplicate_reason || 'Possible Match'}
                  </span>
                </div>

                <div className="text-[11px] text-[#4A5350] space-y-0.5">
                  <div>Phone: <strong className="font-mono">{cand.mobile}</strong></div>
                  <div>DOB / Age: {cand.dob} ({cand.age?.formatted || 'Age on file'}) • {cand.gender}</div>
                  <div className="truncate">Address: {cand.address}</div>
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectPatientId(cand.patient_id || cand.id)}
                    className="px-2.5 py-1 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-[11px] font-medium text-zinc-700 cursor-pointer"
                  >
                    View Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisitTargetPatient(cand)}
                    className="px-3 py-1 rounded-lg bg-[#174C40] hover:bg-[#123B32] text-white text-[11px] font-semibold cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <PlusCircle className="h-3 w-3" />
                    <span>Check In This Patient</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-amber-800/90 flex flex-wrap items-center justify-between gap-2 pt-1">
            <span>Registering a different person with this name/phone? You can continue filling the form below. Records will never be merged.</span>
            <button
              type="button"
              onClick={() => setDuplicateDismissed(true)}
              className="text-[#174C40] font-semibold underline hover:text-[#123B32] cursor-pointer"
            >
              Continue as New Patient
            </button>
          </div>
        </div>
      )}

      {/* Form Grid */}
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1F2421]">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77817C]" />
              <input
                type="text"
                placeholder="e.g. Eleanor Vance"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (touched.full_name) {
                    setErrors((prev) => ({
                      ...prev,
                      full_name: validateField('full_name', e.target.value),
                    }));
                  }
                }}
                onBlur={() => handleBlur('full_name', fullName)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs text-[#1F2421] bg-white transition-colors focus:outline-none ${
                  touched.full_name && errors.full_name
                    ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                    : 'border-[#E5E8E6] focus:border-[#174C40]'
                }`}
                disabled={isSubmitting}
              />
            </div>
            {touched.full_name && errors.full_name && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.full_name}</p>
            )}
          </div>

          {/* 2. Mobile Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1F2421]">
              Mobile Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77817C]" />
              <input
                type="tel"
                placeholder="e.g. +1 (617) 555-0148 or 9876543210"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  if (touched.mobile) {
                    setErrors((prev) => ({
                      ...prev,
                      mobile: validateField('mobile', e.target.value),
                    }));
                  }
                }}
                onBlur={() => handleBlur('mobile', mobile)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs text-[#1F2421] bg-white transition-colors focus:outline-none ${
                  touched.mobile && errors.mobile
                    ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                    : 'border-[#E5E8E6] focus:border-[#174C40]'
                }`}
                disabled={isSubmitting}
              />
            </div>
            {touched.mobile && errors.mobile && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.mobile}</p>
            )}
          </div>

          {/* 3. Date of Birth & Live Age Calculation */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#1F2421]">
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              {calculatedAge && (
                <span className="text-[11px] font-mono font-bold text-[#174C40] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Calculated Age: {calculatedAge.formatted}
                </span>
              )}
            </div>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77817C]" />
              <input
                type="date"
                max={todayIso}
                value={dob}
                onChange={(e) => {
                  setDob(e.target.value);
                  if (touched.dob) {
                    setErrors((prev) => ({
                      ...prev,
                      dob: validateField('dob', e.target.value),
                    }));
                  }
                }}
                onBlur={() => handleBlur('dob', dob)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs text-[#1F2421] bg-white transition-colors focus:outline-none ${
                  touched.dob && errors.dob
                    ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                    : 'border-[#E5E8E6] focus:border-[#174C40]'
                }`}
                disabled={isSubmitting}
              />
            </div>
            {touched.dob && errors.dob && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.dob}</p>
            )}
          </div>

          {/* 4. Gender Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1F2421]">
              Gender <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Male', 'Female', 'Other'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    gender === g
                      ? 'border-[#174C40] bg-[#174C40] text-white shadow-xs'
                      : 'border-[#E5E8E6] bg-[#FAFAF7] text-[#4A5350] hover:bg-white'
                  }`}
                  disabled={isSubmitting}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Residential Address */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-semibold text-[#1F2421]">
              Residential Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-[#77817C]" />
              <textarea
                rows={2}
                placeholder="Street address, Apartment / Suite, City, State, ZIP Code"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (touched.address) {
                    setErrors((prev) => ({
                      ...prev,
                      address: validateField('address', e.target.value),
                    }));
                  }
                }}
                onBlur={() => handleBlur('address', address)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs text-[#1F2421] bg-white transition-colors focus:outline-none resize-none ${
                  touched.address && errors.address
                    ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                    : 'border-[#E5E8E6] focus:border-[#174C40]'
                }`}
                disabled={isSubmitting}
              />
            </div>
            {touched.address && errors.address && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.address}</p>
            )}
          </div>

          {/* 6. Emergency Contact */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-semibold text-[#1F2421]">
              Emergency Contact (Name &amp; Phone) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <HeartHandshake className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77817C]" />
              <input
                type="text"
                placeholder="e.g. David Vance (Spouse) - +1 (617) 555-0149"
                value={emergencyContact}
                onChange={(e) => {
                  setEmergencyContact(e.target.value);
                  if (touched.emergency_contact) {
                    setErrors((prev) => ({
                      ...prev,
                      emergency_contact: validateField('emergency_contact', e.target.value),
                    }));
                  }
                }}
                onBlur={() => handleBlur('emergency_contact', emergencyContact)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs text-[#1F2421] bg-white transition-colors focus:outline-none ${
                  touched.emergency_contact && errors.emergency_contact
                    ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                    : 'border-[#E5E8E6] focus:border-[#174C40]'
                }`}
                disabled={isSubmitting}
              />
            </div>
            {touched.emergency_contact && errors.emergency_contact && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.emergency_contact}</p>
            )}
          </div>

          {/* 7. Blood Group (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1F2421]">
              Blood Group <span className="text-[11px] font-normal text-[#77817C]">(Optional)</span>
            </label>
            <div className="relative">
              <Droplet className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-500" />
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E8E6] text-xs text-[#1F2421] bg-white focus:outline-none focus:border-[#174C40]"
                disabled={isSubmitting}
              >
                <option value="">Select Blood Group (Optional)</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 8. Patient Photo (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1F2421]">
              Patient Photo <span className="text-[11px] font-normal text-[#77817C]">(Optional)</span>
            </label>
            <div className="flex items-center gap-3">
              {photo ? (
                <div className="relative">
                  <img
                    src={photo}
                    alt="Preview"
                    className="h-11 w-11 rounded-xl object-cover border border-[#E5E8E6]"
                  />
                  <button
                    type="button"
                    onClick={() => setPhoto('')}
                    className="absolute -top-1 -right-1 h-4 w-4 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px]"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ) : (
                <div className="h-11 w-11 rounded-xl bg-[#FAFAF7] border border-dashed border-[#E5E8E6] flex items-center justify-center text-[#77817C]">
                  <Camera className="h-4 w-4" />
                </div>
              )}

              <label className="px-3.5 py-2.5 rounded-xl border border-[#E5E8E6] bg-[#FAFAF7] hover:bg-white text-xs font-medium text-[#4A5350] cursor-pointer flex items-center gap-1.5 transition-colors">
                <Upload className="h-3.5 w-3.5 text-[#174C40]" />
                <span>{photo ? 'Replace Photo' : 'Upload Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={isSubmitting}
                />
              </label>
            </div>
          </div>

          {/* 9. Allergies (Optional) with Quick Tag Helpers */}
          <div className="space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#1F2421]">
                Known Clinical Allergies <span className="text-[11px] font-normal text-[#77817C]">(Optional)</span>
              </label>
              <span className="text-[10px] text-[#77817C]">Click quick tags below to add</span>
            </div>
            <div className="relative">
              <ShieldAlert className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-600" />
              <input
                type="text"
                placeholder="e.g. Penicillin, Peanuts, Latex"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E8E6] text-xs text-[#1F2421] bg-white focus:outline-none focus:border-[#174C40]"
                disabled={isSubmitting}
              />
            </div>
            {/* Quick Allergy Tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-[#77817C] font-mono mr-1">Quick Tags:</span>
              {COMMON_ALLERGIES.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddAllergy(tag)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#FAFAF7] border border-[#E5E8E6] text-[#4A5350] hover:border-[#174C40] hover:text-[#174C40] transition-colors cursor-pointer"
                  disabled={isSubmitting}
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Controls & Duplicate Prevention */}
        <div className="pt-6 border-t border-[#F0F2F0] flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleResetForm}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#E5E8E6] text-xs font-medium text-[#77817C] hover:text-[#1F2421] hover:bg-[#FAFAF7] transition-colors cursor-pointer"
          >
            Clear Form
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#E5E8E6] text-xs font-medium text-[#4A5350] hover:bg-[#FAFAF7] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Registering Record...</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  <span>Register Patient</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Patient Profile Modal */}
      {inspectPatientId && (
        <PatientProfileModal
          patientId={inspectPatientId}
          onClose={() => setInspectPatientId(null)}
          onCreateVisit={(pat) => {
            setInspectPatientId(null);
            setVisitTargetPatient(pat);
          }}
        />
      )}

      {/* Create Visit Modal */}
      {visitTargetPatient && (
        <CreateVisitModal
          patient={visitTargetPatient}
          onClose={() => setVisitTargetPatient(null)}
          onVisitCreated={() => {
            setVisitTargetPatient(null);
            if (onCancel) onCancel();
          }}
        />
      )}
    </div>
  );
}
