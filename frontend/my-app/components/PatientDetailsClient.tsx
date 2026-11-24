'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import DoctorAvatar from './DoctorAvatar';
import {
  clearBookingDraft,
  getPublicApiBase,
  loadBookingDraft,
  saveConfirmedBooking,
} from '@/lib/booking-storage';
import type { AppointmentRecord, Doctor } from '@/lib/types';

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
    const visitType = searchParams.get('type') || draft?.visit_type || 'In-Person Consultation';
    const doctor = doctors.find((d) => d.slug === doctorSlug) || doctors[0];
    return { doctor, date, slot, visitType };
  }, [searchParams, doctors]);

  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientDob, setPatientDob] = useState('');
  const [patientGender, setPatientGender] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      setError(
        'Could not reach the Healix booking server. Please ensure the Express API is running on port 5000.'
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-8 rounded-2xl border border-[#e6e4dd] bg-white p-7 sm:p-9 space-y-7"
      >
        <div className="flex items-center justify-between border-b border-[#e6e4dd] pb-5">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c]">
              Patient Intake
            </p>
            <h2 className="font-editorial text-2xl sm:text-3xl text-[#14181a] mt-1">
              Enter patient information
            </h2>
          </div>
          <Link
            href={`/appointments/book?doctor=${bookingContext.doctor?.slug || ''}`}
            className="inline-flex items-center gap-1 text-xs text-[#768086] hover:text-[#14181a]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Change slot
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-[#f0d5d5] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]"
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label htmlFor="patient-name" className="block text-xs font-medium text-[#14181a] mb-2">
              Full Name <span className="text-[#b91c1c]">*</span>
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
            <label htmlFor="patient-email" className="block text-xs font-medium text-[#14181a] mb-2">
              Email Address <span className="text-[#b91c1c]">*</span>
            </label>
            <input
              id="patient-email"
              type="email"
              required
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
            />
          </div>

          <div>
            <label htmlFor="patient-phone" className="block text-xs font-medium text-[#14181a] mb-2">
              Phone Number <span className="text-[#b91c1c]">*</span>
            </label>
            <input
              id="patient-phone"
              type="tel"
              required
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              placeholder="+1 (617) 555-0199"
              className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
            />
          </div>

          <div>
            <label htmlFor="patient-dob" className="block text-xs font-medium text-[#14181a] mb-2">
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
            <label htmlFor="patient-gender" className="block text-xs font-medium text-[#14181a] mb-2">
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
            <label htmlFor="insurance" className="block text-xs font-medium text-[#14181a] mb-2">
              Insurance Provider (Optional)
            </label>
            <input
              id="insurance"
              type="text"
              value={insuranceProvider}
              onChange={(e) => setInsuranceProvider(e.target.value)}
              placeholder="e.g., Blue Cross Blue Shield, Aetna, Self-Pay"
              className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="reason" className="block text-xs font-medium text-[#14181a] mb-2">
              Reason for Visit / Clinical Notes (Optional)
            </label>
            <textarea
              id="reason"
              rows={3}
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              placeholder="Briefly describe symptoms, follow-up questions, or referral details..."
              className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#e6e4dd] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-[#768086]">
            Your details are encrypted and stored securely in Healix Medical Center records.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#0f5c5c] text-white text-sm font-medium hover:bg-[#0b4747] disabled:opacity-60 transition-colors shrink-0"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirm Appointment
              </>
            )}
          </button>
        </div>
      </form>

      {/* Summary Sidebar */}
      <aside className="lg:col-span-4 lg:sticky lg:top-32">
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-7 space-y-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#768086]">
            Selected Consultation
          </p>

          {bookingContext.doctor && (
            <div className="flex items-center gap-4 pb-5 border-b border-[#e6e4dd]">
              <DoctorAvatar
                initials={bookingContext.doctor.avatar_initials}
                tone={bookingContext.doctor.accent_tone}
              />
              <div>
                <p className="text-base font-semibold text-[#14181a]">
                  {bookingContext.doctor.name}
                </p>
                <p className="text-xs text-[#0f5c5c]">{bookingContext.doctor.specialty}</p>
                <p className="text-xs text-[#768086]">{bookingContext.doctor.department_name}</p>
              </div>
            </div>
          )}

          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-[#768086]">Visit Format</dt>
              <dd className="font-medium text-[#14181a]">{bookingContext.visitType}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[#768086]">Date</dt>
              <dd className="font-mono text-[#14181a]">{bookingContext.date}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[#768086]">Time</dt>
              <dd className="font-mono text-[#14181a] inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#0f5c5c]" />
                {bookingContext.slot}
              </dd>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#e6e4dd]">
              <dt className="text-[#768086]">Consultation Fee</dt>
              <dd className="font-mono font-semibold text-[#14181a]">
                {bookingContext.doctor?.consultation_fee}
              </dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  );
}
