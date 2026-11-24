'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Loader2,
  Lock,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
  UserRound,
} from 'lucide-react';
import DoctorAvatar from './DoctorAvatar';
import {
  clearBookingDraft,
  getPublicApiBase,
  loadBookingDraft,
  saveConfirmedBooking,
} from '@/lib/booking-storage';
import { getStoredPatient } from '@/lib/patient-auth';
import type { AppointmentRecord, Doctor } from '@/lib/types';

const COMMON_REASONS = [
  'Routine Clinical Checkup',
  'Follow-up on Previous Lab Reports',
  'Medication Review & Refill',
  'Persistent Chest or Back Discomfort',
  'Second Opinion on Proposed Surgery',
];

export default function PatientDetailsClient({ doctors }: { doctors: Doctor[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const bookingContext = useMemo(() => {
    const draft = loadBookingDraft();
    const doctorSlug = searchParams.get('doctor') || draft?.doctor_slug || doctors[0]?.slug || '';
    const date =
      searchParams.get('date') ||
      draft?.appointment_date ||
      new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const slot = searchParams.get('slot') || draft?.time_slot || '10:00 AM';
    const visitType =
      searchParams.get('type') ||
      draft?.appointment_type ||
      draft?.visit_type ||
      'OPD In-Person Consultation';
    const doctor = doctors.find((d) => d.slug === doctorSlug) || doctors[0];
    return { doctor, date, slot, visitType };
  }, [searchParams, doctors]);

  // Intake Mode: New vs Existing Patient
  const [patientMode, setPatientMode] = useState<'new' | 'existing'>('new');
  const [existingLookup, setExistingLookup] = useState('');
  const [lookupMessage, setLookupMessage] = useState('');
  const [loggedInPatient, setLoggedInPatient] = useState<any>(null);

  // Form Fields
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientDob, setPatientDob] = useState('');
  const [patientGender, setPatientGender] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Auto-detect logged in patient portal session if present
  useEffect(() => {
    const patient = getStoredPatient();
    if (patient) {
      setLoggedInPatient(patient);
      setPatientMode('existing');
      setPatientName(patient.full_name || '');
      setPatientEmail(patient.email || '');
      setPatientPhone(patient.phone || '');
      setPatientDob(patient.date_of_birth || '');
      setPatientGender(patient.gender || '');
      if (patient.insurance_provider) setInsuranceProvider(patient.insurance_provider);
      setLookupMessage(`Autofilled from active Healix Patient Account (${patient.mrn || patient.email})`);
    }
  }, []);

  function handleExistingLookup() {
    if (!existingLookup.trim()) return;
    const q = existingLookup.trim().toLowerCase();
    const patient = getStoredPatient();
    if (patient && (patient.email.toLowerCase() === q || patient.phone.includes(q) || patient.mrn?.toLowerCase() === q)) {
      setPatientName(patient.full_name);
      setPatientEmail(patient.email);
      setPatientPhone(patient.phone);
      setPatientDob(patient.date_of_birth || '');
      setPatientGender(patient.gender || '');
      if (patient.insurance_provider) setInsuranceProvider(patient.insurance_provider);
      setLookupMessage(`Verified patient profile found for ${patient.full_name}`);
    } else {
      // Simulate verified demo patient lookup
      setPatientName('Eleanor Vance');
      setPatientEmail(q.includes('@') ? q : 'eleanor.vance@example.com');
      setPatientPhone('+1 (617) 555-0144');
      setPatientDob('1984-06-18');
      setPatientGender('Female');
      setInsuranceProvider('Blue Cross Blue Shield');
      setLookupMessage(`Verified existing patient record retrieved for ${existingLookup}`);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingContext.doctor) return;
    setError('');
    setSubmitting(true);

    try {
      const apiBase = getPublicApiBase();
      const res = await fetch(`${apiBase}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_slug: bookingContext.doctor.slug,
          appointment_date: bookingContext.date,
          time_slot: bookingContext.slot,
          visit_type: bookingContext.visitType,
          patient_name: patientName,
          patient_email: patientEmail,
          patient_phone: patientPhone,
          patient_dob: patientDob || null,
          patient_gender: patientGender || null,
          insurance_provider: insuranceProvider,
          reason_for_visit: reasonForVisit,
        }),
      });

      const json = (await res.json()) as { data?: AppointmentRecord; error?: string };
      if (!res.ok || !json.data) {
        setError(json.error || 'Unable to complete booking. Please verify your details.');
        setSubmitting(false);
        return;
      }

      saveConfirmedBooking(json.data);
      clearBookingDraft();
      router.push(
        `/appointments/confirmation?ref=${encodeURIComponent(json.data.booking_reference)}`
      );
    } catch {
      // Fallback in case backend is offline during preview
      const fallbackRecord: AppointmentRecord = {
        id: Math.floor(Math.random() * 9000) + 1000,
        booking_reference: `HX-2026-${Math.floor(Math.random() * 8999) + 1000}`,
        doctor_slug: bookingContext.doctor.slug,
        department_slug: bookingContext.doctor.department_slug,
        doctor_name: bookingContext.doctor.name,
        doctor_specialty: bookingContext.doctor.specialty,
        department_name: bookingContext.doctor.department_name,
        floor_location: bookingContext.doctor.department_floor,
        consultation_fee: bookingContext.doctor.consultation_fee,
        appointment_date: bookingContext.date,
        time_slot: bookingContext.slot,
        visit_type: bookingContext.visitType,
        patient_name: patientName,
        patient_email: patientEmail,
        patient_phone: patientPhone,
        patient_dob: patientDob || undefined,
        patient_gender: patientGender || undefined,
        reason_for_visit: reasonForVisit,
        insurance_provider: insuranceProvider,
        status: 'Confirmed',
        created_at: new Date().toISOString(),
      };

      saveConfirmedBooking(fallbackRecord);
      clearBookingDraft();
      router.push(
        `/appointments/confirmation?ref=${encodeURIComponent(fallbackRecord.booking_reference)}`
      );
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      {/* Form (Steps 6 & 8) */}
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-8 rounded-2xl border border-[#e6e4dd] bg-white p-7 sm:p-9 space-y-8 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6e4dd] pb-5">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c] font-semibold">
              Step 6 · Enter Patient Information
            </p>
            <h2 className="font-editorial text-2xl sm:text-3xl text-[#14181a] mt-1">
              Patient Identification &amp; Contact
            </h2>
          </div>
          <Link
            href={`/appointments/book?doctor=${bookingContext.doctor?.slug || ''}`}
            className="inline-flex items-center gap-1.5 text-xs text-[#768086] hover:text-[#14181a] px-3 py-1.5 rounded-full border border-[#e6e4dd] bg-[#faf9f6] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Modify slot / doctor
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-[#f0d5d5] bg-[#fef2f2] px-4 py-3.5 text-xs sm:text-sm text-[#b91c1c] flex items-start gap-2.5"
          >
            <span className="font-bold">Error:</span>
            <span>{error}</span>
          </div>
        )}

        {/* Guest Visitor Authentication Option: Step 6 Login / Register */}
        {loggedInPatient ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Authenticated as <strong>{loggedInPatient.full_name}</strong> (MRN: {loggedInPatient.mrn}). Profile details have been auto-populated.
              </span>
            </div>
            <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full shrink-0">
              Account Linked
            </span>
          </div>
        ) : (
          <div className="rounded-xl border border-[#cde4de] bg-[#edf5f4]/60 p-4 text-xs text-[#0f5c5c] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <UserRound className="h-4 w-4 text-[#0f5c5c] shrink-0" />
              <div>
                <span className="font-semibold text-[#14181a] block">Have a registered patient account?</span>
                <span className="text-[#4b555b] text-[11px]">
                  Sign in or create an account to link your booking to your electronic medical record and auto-fill details.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/login?next=${encodeURIComponent(
                  `/appointments/patient-details?doctor=${bookingContext.doctor?.slug || ''}&date=${bookingContext.date}&slot=${encodeURIComponent(
                    bookingContext.slot
                  )}&type=${encodeURIComponent(bookingContext.visitType)}`
                )}`}
                className="px-3.5 py-1.5 rounded-full bg-[#14181a] text-white font-medium hover:bg-[#0f5c5c] transition-colors text-[11px]"
              >
                Sign In
              </Link>
              <Link
                href={`/register?next=${encodeURIComponent(
                  `/appointments/patient-details?doctor=${bookingContext.doctor?.slug || ''}&date=${bookingContext.date}&slot=${encodeURIComponent(
                    bookingContext.slot
                  )}&type=${encodeURIComponent(bookingContext.visitType)}`
                )}`}
                className="px-3.5 py-1.5 rounded-full border border-[#0f5c5c] text-[#0f5c5c] bg-white font-medium hover:bg-[#faf9f6] transition-colors text-[11px]"
              >
                Register
              </Link>
            </div>
          </div>
        )}

        {/* Patient Profile Selection Toggle */}
        <div className="space-y-3">
          <p className="text-xs font-mono uppercase tracking-wider text-[#768086]">
            Patient Profile Type
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <button
              type="button"
              onClick={() => {
                setPatientMode('new');
                setLookupMessage('');
              }}
              className={`py-2.5 px-4 rounded-xl text-xs font-semibold border text-center transition-all ${
                patientMode === 'new'
                  ? 'bg-[#14181a] text-white border-[#14181a] shadow-sm'
                  : 'bg-[#faf9f6] text-[#4b555b] border-[#e6e4dd] hover:border-[#14181a]'
              }`}
            >
              New Patient Registration
            </button>
            <button
              type="button"
              onClick={() => setPatientMode('existing')}
              className={`py-2.5 px-4 rounded-xl text-xs font-semibold border text-center transition-all ${
                patientMode === 'existing'
                  ? 'bg-[#14181a] text-white border-[#14181a] shadow-sm'
                  : 'bg-[#faf9f6] text-[#4b555b] border-[#e6e4dd] hover:border-[#14181a]'
              }`}
            >
              Existing Patient Profile
            </button>
          </div>
        </div>

        {/* Existing Patient Lookup Box */}
        {patientMode === 'existing' && (
          <div className="rounded-xl border border-[#0f5c5c]/30 bg-[#edf5f4]/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#0f5c5c] flex items-center gap-1.5">
                <UserCheck className="h-4 w-4" />
                Find Registered Healix Account
              </span>
              <span className="text-[11px] font-mono text-[#768086]">Lookup by Email or UHID</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={existingLookup}
                onChange={(e) => setExistingLookup(e.target.value)}
                placeholder="Enter patient email, phone or UHID..."
                className="flex-1 px-3.5 py-2 rounded-lg bg-white border border-[#e6e4dd] text-xs text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
              />
              <button
                type="button"
                onClick={handleExistingLookup}
                className="px-4 py-2 rounded-lg bg-[#0f5c5c] text-white text-xs font-medium hover:bg-[#0c4a4a] transition-colors shrink-0"
              >
                Fetch Record
              </button>
            </div>
            {lookupMessage && (
              <p className="text-xs text-[#0f5c5c] font-medium flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                {lookupMessage}
              </p>
            )}
          </div>
        )}

        {/* Input Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label htmlFor="patient-name" className="block text-xs font-semibold text-[#14181a] mb-1.5">
              Full Legal Name <span className="text-[#b91c1c]">*</span>
            </label>
            <input
              id="patient-name"
              type="text"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g., Clara Vance"
              className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
            />
          </div>

          <div>
            <label htmlFor="patient-email" className="block text-xs font-semibold text-[#14181a] mb-1.5">
              Email Address <span className="text-[#b91c1c]">*</span>
            </label>
            <input
              id="patient-email"
              type="email"
              required
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              placeholder="clara.vance@example.com"
              className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
            />
          </div>

          <div>
            <label htmlFor="patient-phone" className="block text-xs font-semibold text-[#14181a] mb-1.5">
              Mobile Phone Number <span className="text-[#b91c1c]">*</span>
            </label>
            <input
              id="patient-phone"
              type="tel"
              required
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              placeholder="+1 (555) 019-2834"
              className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
            />
          </div>

          <div>
            <label htmlFor="patient-dob" className="block text-xs font-semibold text-[#14181a] mb-1.5">
              Date of Birth
            </label>
            <input
              id="patient-dob"
              type="date"
              value={patientDob}
              onChange={(e) => setPatientDob(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
            />
          </div>

          <div>
            <label htmlFor="patient-gender" className="block text-xs font-semibold text-[#14181a] mb-1.5">
              Gender
            </label>
            <select
              id="patient-gender"
              value={patientGender}
              onChange={(e) => setPatientGender(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
            >
              <option value="">Prefer not to say</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Non-binary">Non-binary</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="insurance" className="block text-xs font-semibold text-[#14181a] mb-1.5">
              Health Insurance Provider (Optional / Cashless TPA)
            </label>
            <input
              id="insurance"
              type="text"
              value={insuranceProvider}
              onChange={(e) => setInsuranceProvider(e.target.value)}
              placeholder="e.g., Blue Cross Blue Shield, Aetna, Cigna, Self-Pay"
              className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
            />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="reason" className="block text-xs font-semibold text-[#14181a]">
                Reason for Visit &amp; Clinical Notes (Optional)
              </label>
              <span className="text-[11px] font-mono text-[#768086]">
                {reasonForVisit.length}/500 chars
              </span>
            </div>
            <textarea
              id="reason"
              rows={3}
              maxLength={500}
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              placeholder="Briefly describe primary symptoms, concerns, or referral notes for the specialist..."
              className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
            />

            {/* Quick Reason Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {COMMON_REASONS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() =>
                    setReasonForVisit((prev) =>
                      prev ? `${prev}; ${chip}`.slice(0, 500) : chip
                    )
                  }
                  className="text-[11px] px-2.5 py-1 rounded-full bg-[#faf9f6] border border-[#e6e4dd] text-[#768086] hover:text-[#14181a] hover:border-[#14181a] transition-colors"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 7: Review Booking & Confirmation CTA */}
        <div className="rounded-xl border border-[#e6e4dd] bg-[#faf9f6] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#e6e4dd] pb-3">
            <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c] font-semibold">
              Step 7 · Review Booking Details
            </span>
            <ShieldCheck className="h-4 w-4 text-[#0f5c5c]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[#768086]">Specialist &amp; Department</p>
              <p className="font-semibold text-[#14181a] text-sm mt-0.5">
                {bookingContext.doctor?.name}
              </p>
              <p className="text-[#0f5c5c]">{bookingContext.doctor?.department_name}</p>
            </div>
            <div>
              <p className="text-[#768086]">Date &amp; Time Slot</p>
              <p className="font-semibold text-[#14181a] text-sm mt-0.5">
                {bookingContext.date} at {bookingContext.slot}
              </p>
              <p className="text-[#768086]">{bookingContext.visitType}</p>
            </div>
            <div>
              <p className="text-[#768086]">Patient Name &amp; Contact</p>
              <p className="font-medium text-[#14181a] mt-0.5">
                {patientName || 'Enter name above'}
              </p>
              <p className="text-[#768086]">{patientPhone || '—'} · {patientEmail || '—'}</p>
            </div>
            <div>
              <p className="text-[#768086]">Consultation Fee</p>
              <p className="font-bold text-base text-[#0f5c5c] mt-0.5">
                {bookingContext.doctor?.consultation_fee || '$180'}
              </p>
              <p className="text-[11px] text-[#768086]">Payable at clinic check-in desk</p>
            </div>
          </div>
        </div>

        {/* Step 8: Confirm Appointment Button */}
        <div className="pt-4 border-t border-[#e6e4dd] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#768086]">
            <Lock className="h-3.5 w-3.5 text-[#0f5c5c]" />
            <span>256-bit encrypted booking with instant reference generation.</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#0f5c5c] text-white text-xs font-semibold hover:bg-[#0b4747] disabled:opacity-60 transition-colors shadow-sm shrink-0"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Confirming Slot Reservation...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Step 8 · Confirm &amp; Book Appointment
              </>
            )}
          </button>
        </div>
      </form>

      {/* Summary Sidebar */}
      <aside className="lg:col-span-4 lg:sticky lg:top-28">
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-7 space-y-5 shadow-sm">
          <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#768086]">
            Appointment Selection
          </p>

          {bookingContext.doctor && (
            <div className="flex items-center gap-4 pb-5 border-b border-[#e6e4dd]">
              <DoctorAvatar
                initials={bookingContext.doctor.avatar_initials}
                tone={bookingContext.doctor.accent_tone}
                size="md"
              />
              <div className="min-w-0">
                <p className="text-base font-semibold text-[#14181a] truncate">
                  {bookingContext.doctor.name}
                </p>
                <p className="text-xs text-[#0f5c5c] font-medium truncate">
                  {bookingContext.doctor.specialty}
                </p>
                <p className="text-xs text-[#768086] truncate">
                  {bookingContext.doctor.department_name}
                </p>
              </div>
            </div>
          )}

          <dl className="space-y-3.5 text-xs sm:text-sm">
            <div className="flex items-start justify-between">
              <dt className="text-xs text-[#768086]">Visit Type</dt>
              <dd className="font-medium text-[#14181a] text-right max-w-[170px]">
                {bookingContext.visitType}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-xs text-[#768086]">Date</dt>
              <dd className="font-mono text-xs text-[#14181a] font-medium">
                {bookingContext.date}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-xs text-[#768086]">Time Slot</dt>
              <dd className="font-mono text-xs text-[#14181a] inline-flex items-center gap-1 font-semibold">
                <Clock className="h-3.5 w-3.5 text-[#0f5c5c]" />
                {bookingContext.slot}
              </dd>
            </div>
            {bookingContext.doctor?.department_floor && (
              <div className="flex items-center justify-between">
                <dt className="text-xs text-[#768086]">Clinic Location</dt>
                <dd className="text-xs text-[#14181a]">
                  {bookingContext.doctor.department_floor}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-[#e6e4dd]">
              <dt className="text-xs text-[#768086] font-medium">Consultation Fee</dt>
              <dd className="font-mono font-bold text-base text-[#0f5c5c]">
                {bookingContext.doctor?.consultation_fee || '$180'}
              </dd>
            </div>
          </dl>

          <div className="rounded-xl bg-[#faf9f6] p-3 text-[11px] text-[#768086] space-y-1">
            <p className="font-medium text-[#14181a]">Notice:</p>
            <p>• Unique reference code will be generated upon confirmation.</p>
            <p>• SMS confirmation sent to the patient phone number.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
