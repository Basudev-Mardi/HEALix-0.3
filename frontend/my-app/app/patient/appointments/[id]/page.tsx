'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, Phone, XCircle } from 'lucide-react';
import DoctorAvatar from '@/components/DoctorAvatar';
import { patientApiFetch } from '@/lib/patient-auth';
import type { AppointmentRecord } from '@/lib/types';

export default function PatientAppointmentDetailPage() {
  const params = useParams<{ id: string }>();
  const appointmentId = params?.id;

  const [appt, setAppt] = useState<AppointmentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!appointmentId) return;
    patientApiFetch<AppointmentRecord>(`/patient/appointments/${encodeURIComponent(appointmentId)}`).then(
      (res) => {
        if (res.data) setAppt(res.data);
        setLoading(false);
      }
    );
  }, [appointmentId]);

  async function handleCancel() {
    if (!appt) return;
    setCancelling(true);
    const res = await patientApiFetch<{ status: string }>(
      `/patient/appointments/${encodeURIComponent(String(appt.id ?? appt.booking_reference))}/cancel`,
      { method: 'PATCH' }
    );
    if (res.data) {
      setAppt({ ...appt, status: res.data.status });
    }
    setCancelling(false);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 text-sm text-[#768086]">
        Loading appointment details...
      </div>
    );
  }

  if (!appt) {
    return (
      <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 space-y-4">
        <p className="text-base font-medium text-[#14181a]">Appointment not found.</p>
        <Link
          href="/patient/appointments"
          className="inline-flex items-center gap-1.5 text-xs text-[#0f5c5c] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to My Appointments
        </Link>
      </div>
    );
  }

  const isCancelled = appt.status === 'Cancelled';

  return (
    <div className="space-y-6">
      <Link
        href="/patient/appointments"
        className="inline-flex items-center gap-1.5 text-xs text-[#768086] hover:text-[#14181a]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to My Appointments
      </Link>

      <div className="rounded-2xl border border-[#e6e4dd] bg-white p-7 sm:p-9 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[#e6e4dd]">
          <div className="flex items-center gap-4">
            <DoctorAvatar
              initials={appt.avatar_initials || 'HX'}
              tone={appt.accent_tone || 'slate'}
              size="lg"
            />
            <div>
              <p className="font-mono text-xs text-[#768086]">{appt.booking_reference}</p>
              <h1 className="font-editorial text-3xl text-[#14181a] mt-0.5">{appt.doctor_name}</h1>
              <p className="text-sm text-[#0f5c5c]">{appt.doctor_specialty}</p>
              <p className="text-xs text-[#768086] mt-0.5">{appt.department_name}</p>
            </div>
          </div>

          <span
            className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium ${isCancelled ? 'bg-[#fef2f2] text-[#b91c1c]' : 'bg-[#edf5f4] text-[#0f5c5c]'
              }`}
          >
            {appt.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-sm">
          <div className="rounded-xl border border-[#e6e4dd] bg-[#faf9f6] p-4 space-y-1">
            <p className="text-[11px] font-mono uppercase text-[#768086]">Date</p>
            <p className="font-mono font-medium text-[#14181a] inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-[#0f5c5c]" />
              {appt.appointment_date}
            </p>
          </div>
          <div className="rounded-xl border border-[#e6e4dd] bg-[#faf9f6] p-4 space-y-1">
            <p className="text-[11px] font-mono uppercase text-[#768086]">Time</p>
            <p className="font-mono font-medium text-[#14181a] inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#0f5c5c]" />
              {appt.time_slot}
            </p>
          </div>
          <div className="rounded-xl border border-[#e6e4dd] bg-[#faf9f6] p-4 space-y-1">
            <p className="text-[11px] font-mono uppercase text-[#768086]">Visit Format</p>
            <p className="font-medium text-[#14181a]">{appt.visit_type}</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-[#4b555b]">
          {appt.floor_location && (
            <p className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
              <span>
                <strong className="text-[#14181a]">Location:</strong> {appt.floor_location}, Healix
                Medical Center
              </span>
            </p>
          )}
          <p className="flex items-start gap-2">
            <Phone className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
            <span>
              <strong className="text-[#14181a]">Department Desk:</strong> +1 (800) 432-5490{' '}
              {appt.phone_ext ? `(${appt.phone_ext})` : ''}
            </span>
          </p>
          {appt.reason_for_visit && (
            <div className="rounded-xl border border-[#e6e4dd] bg-[#f2f1ec]/60 p-4">
              <p className="text-xs font-mono uppercase tracking-wider text-[#768086] mb-1">
                Clinical Notes / Reason for Visit
              </p>
              <p className="text-[#14181a]">{appt.reason_for_visit}</p>
            </div>
          )}
        </div>

        <div className="pt-5 border-t border-[#e6e4dd] flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-[#768086]">
            Standard Consultation Fee:{' '}
            <span className="font-mono font-semibold text-[#14181a]">{appt.consultation_fee}</span>
          </p>
          <div className="flex items-center gap-3">
            <Link
              href={`/doctors/${appt.doctor_slug}`}
              className="px-4 py-2 rounded-full border border-[#d5d2c9] text-xs font-medium text-[#14181a] hover:border-[#14181a]"
            >
              Doctor Profile
            </Link>
            {!isCancelled && (
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#f0d5d5] text-xs font-medium text-[#b91c1c] hover:bg-[#fef2f2]"
              >
                <XCircle className="h-3.5 w-3.5" />
                {cancelling ? 'Cancelling...' : 'Cancel Appointment'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

