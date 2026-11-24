'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  History,
  Info,
  Loader2,
  Lock,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import DoctorAvatar from '@/components/DoctorAvatar';
import { patientApiFetch } from '@/lib/patient-auth';
import type { AppointmentRecord } from '@/lib/types';

interface AuditLogEntry {
  previous_status: string | null;
  new_status: string;
  changed_by: string;
  reason: string;
  timestamp: string;
}

type AppointmentDetail = AppointmentRecord & {
  audit_logs?: AuditLogEntry[];
};

const COMMON_CANCEL_REASONS = [
  'Schedule conflict / Work commitment',
  'Feeling better / Symptoms resolved',
  'Rescheduling for a different date or specialist',
  'Transportation or travel issue',
  'Family emergency',
];

export default function PatientAppointmentDetailPage() {
  const params = useParams<{ id: string }>();
  const appointmentId = params?.id;

  const [appt, setAppt] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState(COMMON_CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [cancellationNotice, setCancellationNotice] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchAppointment = () => {
    if (!appointmentId) return;
    patientApiFetch<AppointmentDetail>(
      `/patient/appointments/${encodeURIComponent(appointmentId)}`
    ).then((res) => {
      if (res.data) setAppt(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchAppointment();
  }, [appointmentId]);

  async function handleConfirmCancel() {
    if (!appt) return;
    setCancelling(true);
    setError('');

    const reasonToSubmit =
      cancelReason === 'Other'
        ? customReason.trim() || 'Cancelled by patient'
        : customReason.trim()
        ? `${cancelReason}: ${customReason.trim()}`
        : cancelReason;

    const res = await patientApiFetch<{
      status: string;
      appointment_date: string;
      slot_released: boolean;
      audit_recorded: boolean;
    }>(
      `/patient/appointments/${encodeURIComponent(
        String(appt.id ?? appt.booking_reference)
      )}/cancel`,
      {
        method: 'PATCH',
        body: JSON.stringify({ reason: reasonToSubmit }),
      }
    );

    if (res.error || !res.data) {
      setError(res.error || 'Failed to cancel appointment. Please try again or contact clinic desk.');
      setCancelling(false);
      return;
    }

    setCancellationNotice(
      `Appointment ${appt.booking_reference} has been cancelled successfully. Your time slot (${appt.time_slot} on ${appt.appointment_date}) has been released back into hospital availability.`
    );
    setShowCancelModal(false);
    setCancelling(false);
    fetchAppointment();
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
  const isCompleted = appt.status === 'Completed';
  const isEligibleForCancel = !isCancelled && !isCompleted;

  return (
    <div className="space-y-6">
      <Link
        href="/patient/appointments"
        className="inline-flex items-center gap-1.5 text-xs text-[#768086] hover:text-[#14181a]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to My Appointments
      </Link>

      {/* Cancellation Success Confirmation Banner (Workflow D - Step 9) */}
      {cancellationNotice && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 flex items-start gap-3.5 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-rose-950 font-mono uppercase tracking-wider">
              Step 9 · Cancellation Confirmed &amp; Slot Released
            </p>
            <p className="text-xs sm:text-sm text-rose-900 leading-relaxed">
              {cancellationNotice}
            </p>
            <p className="text-[11px] text-rose-700">
              A cancellation confirmation has been recorded in your portal notifications and hospital audit history.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs sm:text-sm text-rose-800 flex items-start gap-2.5"
        >
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Appointment Detail Card */}
      <div className="rounded-2xl border border-[#e6e4dd] bg-white p-7 sm:p-9 space-y-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[#e6e4dd]">
          <div className="flex items-center gap-4">
            <DoctorAvatar
              initials={appt.avatar_initials || 'HX'}
              tone={appt.accent_tone || 'slate'}
              size="lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#768086]">{appt.booking_reference}</span>
                {isEligibleForCancel && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#edf5f4] text-[#0f5c5c]">
                    Eligible for Online Cancellation
                  </span>
                )}
              </div>
              <h1 className="font-editorial text-3xl text-[#14181a] mt-0.5">{appt.doctor_name}</h1>
              <p className="text-sm text-[#0f5c5c] font-medium">{appt.doctor_specialty}</p>
              <p className="text-xs text-[#768086] mt-0.5">{appt.department_name}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span
              className={`px-4 py-1.5 rounded-full text-xs font-mono font-semibold ${
                isCancelled
                  ? 'bg-[#fef2f2] text-[#b91c1c] border border-rose-200'
                  : isCompleted
                  ? 'bg-[#f2f1ec] text-[#4b555b]'
                  : 'bg-[#edf5f4] text-[#0f5c5c] border border-teal-200'
              }`}
            >
              {appt.status}
            </span>
            {isCancelled && (
              <span className="text-[11px] font-mono text-[#b91c1c]">
                Slot Released for Booking
              </span>
            )}
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-sm">
          <div className="rounded-xl border border-[#e6e4dd] bg-[#faf9f6] p-4 space-y-1">
            <p className="text-[11px] font-mono uppercase text-[#768086]">Appointment Date</p>
            <p className="font-mono font-semibold text-[#14181a] inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-[#0f5c5c]" />
              {appt.appointment_date}
            </p>
          </div>
          <div className="rounded-xl border border-[#e6e4dd] bg-[#faf9f6] p-4 space-y-1">
            <p className="text-[11px] font-mono uppercase text-[#768086]">Time Slot</p>
            <p className="font-mono font-semibold text-[#14181a] inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#0f5c5c]" />
              {appt.time_slot}
            </p>
          </div>
          <div className="rounded-xl border border-[#e6e4dd] bg-[#faf9f6] p-4 space-y-1">
            <p className="text-[11px] font-mono uppercase text-[#768086]">Visit Format</p>
            <p className="font-medium text-[#14181a]">{appt.visit_type}</p>
          </div>
        </div>

        {/* Location & Contact */}
        <div className="space-y-4 text-sm text-[#4b555b]">
          {appt.floor_location && (
            <p className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
              <span>
                <strong className="text-[#14181a]">Clinic Location:</strong> {appt.floor_location}, Healix
                Medical Center
              </span>
            </p>
          )}
          <p className="flex items-start gap-2">
            <Phone className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
            <span>
              <strong className="text-[#14181a]">Department Hotline:</strong> +1 (800) 432-5490{' '}
              {appt.phone_ext ? `(Ext: ${appt.phone_ext})` : ''}
            </span>
          </p>
          {appt.reason_for_visit && (
            <div className="rounded-xl border border-[#e6e4dd] bg-[#f2f1ec]/60 p-4">
              <p className="text-xs font-mono uppercase tracking-wider text-[#768086] mb-1">
                Clinical Notes / Reason for Visit
              </p>
              <p className="text-[#14181a] italic">&quot;{appt.reason_for_visit}&quot;</p>
            </div>
          )}
        </div>

        {/* Cancellation Eligibility & Action Toolbar */}
        <div className="pt-5 border-t border-[#e6e4dd] flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-[#768086]">
            Standard Consultation Fee:{' '}
            <span className="font-mono font-semibold text-[#14181a]">{appt.consultation_fee || '$180'}</span>
          </p>

          <div className="flex items-center gap-3">
            <Link
              href={`/doctors/${appt.doctor_slug}`}
              className="px-4 py-2 rounded-full border border-[#d5d2c9] text-xs font-medium text-[#14181a] hover:border-[#14181a]"
            >
              Doctor Profile
            </Link>

            {isEligibleForCancel && (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-rose-300 bg-rose-50/60 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors shadow-sm"
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancel Appointment
              </button>
            )}

            {isCancelled && (
              <Link
                href={`/appointments/book?doctor=${appt.doctor_slug}`}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#14181a] text-white text-xs font-semibold hover:bg-[#0f5c5c] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Rebook Consultation
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Audit History & Activity Log (Workflow D - Step 10) */}
      <div className="rounded-2xl border border-[#e6e4dd] bg-white p-7 space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e6e4dd] pb-4">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#0f5c5c]" />
            <h2 className="text-sm font-semibold text-[#14181a]">
              Step 10 · Appointment Audit History
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#768086]">
            Permanent Healthcare Audit Trail
          </span>
        </div>

        {appt.audit_logs && appt.audit_logs.length > 0 ? (
          <div className="space-y-3">
            {appt.audit_logs.map((log, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#e6e4dd] bg-[#faf9f6] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] ${
                        log.new_status === 'Cancelled'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {log.previous_status ? `${log.previous_status} → ` : ''}
                      {log.new_status}
                    </span>
                    <span className="text-[#14181a] font-medium">by {log.changed_by}</span>
                  </div>
                  {log.reason && (
                    <p className="text-[#4b555b] text-[11px] italic">Reason: &quot;{log.reason}&quot;</p>
                  )}
                </div>
                <span className="font-mono text-[11px] text-[#768086] shrink-0">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-[#faf9f6] p-4 text-xs text-[#768086]">
            Initial appointment creation confirmed. No subsequent status modifications recorded.
          </div>
        )}
      </div>

      {/* Cancellation Policy Modal (Workflow D - Steps 4 & 5) */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#e6e4dd] shadow-2xl p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between border-b border-[#e6e4dd] pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-[#14181a]">
                    Cancel Appointment
                  </h3>
                  <p className="text-[11px] text-[#768086] font-mono">
                    Ref: {appt.booking_reference}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="text-[#768086] hover:text-[#14181a] p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Step 4: System displays cancellation policy */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2.5 text-xs text-amber-950">
              <p className="font-semibold flex items-center gap-1.5 text-amber-900">
                <ShieldCheck className="h-4 w-4 text-amber-700" />
                Step 4 · Hospital Cancellation Policy
              </p>
              <ul className="space-y-1.5 text-[11px] leading-relaxed text-amber-900/90 list-disc list-inside">
                <li>
                  <strong>4-Hour Notice Window:</strong> Online cancellation is free up to 4 hours before the scheduled time slot ({appt.time_slot}).
                </li>
                <li>
                  <strong>Immediate Slot Release:</strong> Your reserved slot will be released immediately so another patient in need can book care.
                </li>
                <li>
                  <strong>Financial Protection:</strong> Zero cancellation penalty. Any pre-authorization or deposit hold will be released automatically.
                </li>
                <li>
                  <strong>Audit Record:</strong> This cancellation action will be permanently recorded in your medical audit trail.
                </li>
              </ul>
            </div>

            {/* Reason Selection */}
            <div className="space-y-3 text-xs">
              <label className="block font-semibold text-[#14181a]">
                Reason for Cancellation (Required for Audit Trail)
              </label>
              <div className="space-y-2">
                {COMMON_CANCEL_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[#e6e4dd] hover:bg-[#faf9f6] cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="cancelReason"
                      checked={cancelReason === reason}
                      onChange={() => setCancelReason(reason)}
                      className="mt-0.5 text-[#0f5c5c] focus:ring-[#0f5c5c]"
                    />
                    <span className="text-xs text-[#14181a]">{reason}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-[11px] text-[#768086] mb-1">
                  Additional Notes (Optional):
                </label>
                <textarea
                  rows={2}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Provide any additional clinical notes or reason for cancellation..."
                  className="w-full px-3 py-2 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-xs text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
                />
              </div>
            </div>

            {/* Modal Actions (Step 5: Patient confirms cancellation) */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3 pt-3 border-t border-[#e6e4dd]">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="px-5 py-2.5 rounded-full border border-[#d5d2c9] text-xs font-semibold text-[#14181a] hover:border-[#14181a] transition-colors"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-60 transition-colors shadow-sm"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Processing Cancellation...
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5" />
                    Step 5 · Confirm Cancellation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
