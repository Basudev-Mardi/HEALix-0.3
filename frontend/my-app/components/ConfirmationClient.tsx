'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BellCheck,
  Building2,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileCheck2,
  Mail,
  MapPin,
  Phone,
  LayoutDashboard,
  Printer,
  QrCode,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import { getPublicApiBase, loadConfirmedBooking } from '@/lib/booking-storage';
import { getStoredPatient } from '@/lib/patient-auth';
import type { AppointmentRecord } from '@/lib/types';

export default function ConfirmationClient() {
  const searchParams = useSearchParams();
  const refParam = searchParams.get('ref');

  const [booking, setBooking] = useState<AppointmentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [storedPatient, setStoredPatient] = useState<any>(null);

  useEffect(() => {
    const p = getStoredPatient();
    if (p) setStoredPatient(p);
  }, []);

  useEffect(() => {
    let active = true;
    const cached = loadConfirmedBooking();

    if (refParam) {
      const apiBase = getPublicApiBase();
      fetch(`${apiBase}/appointments/track?reference=${encodeURIComponent(refParam)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json: { data?: AppointmentRecord[] } | null) => {
          if (!active) return;
          if (json?.data && json.data.length > 0) {
            setBooking(json.data[0]);
          } else if (cached && cached.booking_reference === refParam) {
            setBooking(cached);
          }
        })
        .catch(() => {
          if (active && cached && cached.booking_reference === refParam) {
            setBooking(cached);
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      setBooking(cached);
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [refParam]);

  function handleDownloadIcs() {
    if (!booking) return;
    const title = `Healix Medical Appointment: ${booking.doctor_name || 'Specialist'}`;
    const description = `Consultation with ${booking.doctor_name} (${booking.doctor_specialty}). Ref: ${booking.booking_reference}. Location: ${booking.floor_location || 'Healix Medical Center'}`;
    const dateStr = booking.appointment_date.replace(/-/g, '');
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Healix Medical Center//Appointment Scheduler//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${booking.floor_location || 'Healix Medical Center, 480 Meridian Ave, Boston'}`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `DTEND;VALUE=DATE:${dateStr}`,
      `STATUS:CONFIRMED`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Healix-Appointment-${booking.booking_reference}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#E5E8E6] bg-white p-10 text-sm text-[#77817C]">
        Loading your booking confirmation...
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto rounded-2xl border border-[#E5E8E6] bg-white p-10 text-center space-y-5">
        <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#77817C]">
          No Active Confirmation
        </p>
        <h2 className="font-editorial text-3xl text-[#242A28]">
          Looking for an existing appointment?
        </h2>
        <p className="text-sm text-[#4A5350]">
          Track your appointment anytime with your booking reference or email address, or start a
          new booking.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/appointments/track"
            className="px-5 py-2.5 rounded-full bg-[#242A28] text-white text-xs font-medium hover:bg-[#174C40] transition-colors"
          >
            Track Appointment
          </Link>
          <Link
            href="/appointments/book"
            className="px-5 py-2.5 rounded-full border border-[#77817C] text-xs font-medium text-[#242A28] hover:border-[#242A28] transition-colors"
          >
            Book New Appointment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Notifications Sent Banner */}
      <div className="rounded-2xl border border-[#174C40]/25 bg-[#E6EFE9] p-5 sm:p-6 flex items-start gap-3.5 shadow-sm">
        <div className="h-9 w-9 rounded-full bg-[#174C40] text-white flex items-center justify-center shrink-0 mt-0.5">
          <BellCheck className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#174C40] font-mono uppercase tracking-wider">
            Booking Confirmed &amp; Notifications Dispatched
          </p>
          <p className="text-xs sm:text-sm text-[#242A28] leading-relaxed">
            Confirmation SMS dispatched to <strong className="font-mono">{booking.patient_phone}</strong> and
            digital summary with preparation instructions emailed to{' '}
            <strong className="font-mono">{booking.patient_email}</strong>.
          </p>
        </div>
      </div>

      {/* Main Confirmation Pass Card */}
      <div className="rounded-2xl border border-[#E5E8E6] bg-white overflow-hidden shadow-sm">
        {/* Pass Header */}
        <div className="bg-[#242A28] text-white p-7 sm:p-9 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <span className="h-12 w-12 rounded-xl bg-[#174C40] text-white flex items-center justify-center shrink-0 shadow-inner">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#E6EFE9] text-[#174C40] font-bold">
                  {booking.status}
                </span>
                <span className="text-[11px] font-mono text-[#a0a7ac]">System Verified</span>
              </div>
              <h2 className="font-editorial text-2xl sm:text-3xl text-white mt-1">
                Consultation Reserved
              </h2>
            </div>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0 border-white/10">
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#a0a7ac]">
              Booking Reference
            </p>
            <p className="font-mono text-2xl font-bold text-white tracking-wider">
              {booking.booking_reference}
            </p>
          </div>
        </div>

        {/* Pass Details */}
        <div className="p-7 sm:p-9 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-[#E5E8E6]">
            <div className="space-y-1.5">
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#77817C]">
                Assigned Specialist
              </p>
              <p className="text-base font-bold text-[#242A28]">
                {booking.doctor_name || booking.doctor_slug}
              </p>
              <p className="text-xs text-[#174C40] font-medium">{booking.doctor_specialty}</p>
              <p className="text-xs text-[#77817C]">{booking.department_name}</p>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#77817C]">
                Patient Information
              </p>
              <p className="text-base font-bold text-[#242A28] inline-flex items-center gap-1.5">
                <UserRound className="h-4 w-4 text-[#174C40]" />
                {booking.patient_name}
              </p>
              <p className="text-xs text-[#4A5350]">{booking.patient_email}</p>
              <p className="text-xs font-mono text-[#77817C]">{booking.patient_phone}</p>
            </div>

            <div className="rounded-xl border border-[#E5E8E6] bg-[#FAFAF7] p-4 flex items-center gap-3.5">
              <Calendar className="h-5 w-5 text-[#174C40] shrink-0" />
              <div>
                <p className="text-[10px] font-mono uppercase text-[#77817C]">Appointment Date</p>
                <p className="font-mono text-sm font-semibold text-[#242A28] mt-0.5">
                  {booking.appointment_date}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#E5E8E6] bg-[#FAFAF7] p-4 flex items-center gap-3.5">
              <Clock className="h-5 w-5 text-[#174C40] shrink-0" />
              <div>
                <p className="text-[10px] font-mono uppercase text-[#77817C]">Time &amp; Format</p>
                <p className="text-sm font-semibold text-[#242A28] mt-0.5">
                  <span className="font-mono text-[#174C40]">{booking.time_slot}</span> · {booking.visit_type}
                </p>
              </div>
            </div>
          </div>

          {/* Location & Fee Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-[#E5E8E6]">
            <div className="flex items-start gap-3 text-xs sm:text-sm text-[#4A5350]">
              <MapPin className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-[#242A28]">Clinic Location</p>
                <p className="mt-0.5">
                  {booking.floor_location || 'Level 1 West Wing, Clinic Core'}, Healix Medical Center
                </p>
                <p className="text-xs text-[#77817C] mt-0.5">480 Meridian Avenue, Boston</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs sm:text-sm text-[#4A5350]">
              <CreditCard className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-[#242A28]">Consultation Fee &amp; Payment</p>
                <p className="mt-0.5 font-mono font-bold text-base text-[#174C40]">
                  {booking.consultation_fee || '$180'}
                </p>
                <p className="text-xs text-[#77817C] mt-0.5">
                  Pay at reception check-in desk or cashless insurance pre-authorization.
                </p>
              </div>
            </div>
          </div>

          {/* Reason for Visit if present */}
          {booking.reason_for_visit && (
            <div className="rounded-xl bg-[#FAFAF7] border border-[#E5E8E6] p-4 space-y-1 text-xs">
              <p className="font-semibold text-[#242A28] uppercase font-mono tracking-wider text-[10px]">
                Reason for Visit / Clinical Notes:
              </p>
              <p className="text-[#4A5350] leading-relaxed italic">&quot;{booking.reason_for_visit}&quot;</p>
            </div>
          )}

          {/* Check-in Guidance */}
          <div className="rounded-xl bg-[#E6EFE9]/70 border border-[#E5E8E6] p-5 space-y-2 text-xs text-[#4A5350]">
            <p className="font-semibold text-[#242A28] flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#174C40]" />
              Check-In &amp; Arrival Instructions
            </p>
            <p>
              • Please arrive 15 minutes prior to your time slot for biometric vitals verification at the floor nursing desk.
            </p>
            <p>
              • Bring a government photo ID, health insurance card, and any recent lab or radiology records.
            </p>
            <p>
              • Free cancellation or rescheduling is available online up to 4 hours prior using reference <span className="font-mono text-[#242A28] font-semibold">{booking.booking_reference}</span>.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-[#77817C] text-xs font-semibold text-[#242A28] hover:border-[#242A28] transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Confirmation Slip
              </button>
              <button
                type="button"
                onClick={handleDownloadIcs}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-[#77817C] text-xs font-semibold text-[#242A28] hover:border-[#242A28] transition-colors"
              >
                <CalendarPlus className="h-3.5 w-3.5 text-[#174C40]" />
                Add to Calendar (.ics)
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/appointments/track?ref=${encodeURIComponent(booking.booking_reference)}`}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#242A28] text-white text-xs font-semibold hover:bg-[#174C40] transition-colors shadow-sm"
              >
                Track / Reschedule
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/patient/appointments"
                className="text-xs font-semibold text-[#174C40] hover:underline px-2"
              >
                Go to Patient Portal &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow C Step 8: Dashboard Updates Banner for Logged-in Existing Patients */}
      {storedPatient ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-sm">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-700 text-white">
                MRN: {storedPatient.mrn || 'HX-MRN-402819'}
              </span>
              <p className="font-semibold text-xs text-emerald-950 font-mono uppercase tracking-wider">
                Step 8 · Patient Dashboard &amp; Records Synchronized
              </p>
            </div>
            <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
              This consultation has been recorded under your Medical Record Number and synchronized with your Healix Patient Portal. Your upcoming appointments schedule and clinical alerts have been updated.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/patient/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#242A28] text-white text-xs font-semibold hover:bg-[#174C40] transition-colors shadow-sm"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Patient Dashboard
            </Link>
            <Link
              href="/patient/appointments"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-emerald-300 bg-white text-emerald-900 text-xs font-semibold hover:bg-emerald-50 transition-colors"
            >
              My Appointments
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      ) : (
        /* Guest Visitor Account Registration Prompt */
        <div className="rounded-2xl border border-[#E5E8E6] bg-[#FAFAF7] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-semibold text-xs text-[#242A28]">Access Your Electronic Health Records</p>
            <p className="text-[11px] text-[#77817C] leading-relaxed">
              Create a secure Healix Patient Portal account using <strong>{booking.patient_email}</strong> to view doctor clinical notes, download lab reports, and manage all your healthcare visits.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/register"
              className="px-4 py-2 rounded-full bg-[#174C40] text-white text-xs font-medium hover:bg-[#123C32] transition-colors"
            >
              Create Account
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-full border border-[#d2d0c8] bg-white text-xs font-medium text-[#242A28] hover:border-[#242A28] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
