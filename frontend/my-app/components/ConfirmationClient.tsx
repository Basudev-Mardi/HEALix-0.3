'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Printer,
  UserRound,
} from 'lucide-react';
import { getPublicApiBase, loadConfirmedBooking } from '@/lib/booking-storage';
import type { AppointmentRecord } from '@/lib/types';

export default function ConfirmationClient() {
  const searchParams = useSearchParams();
  const refParam = searchParams.get('ref');

  const [booking, setBooking] = useState<AppointmentRecord | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 text-sm text-[#768086]">
        Loading your booking confirmation...
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto rounded-2xl border border-[#e6e4dd] bg-white p-10 text-center space-y-5">
        <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#768086]">
          No Active Confirmation
        </p>
        <h2 className="font-editorial text-3xl text-[#14181a]">
          Looking for an existing appointment?
        </h2>
        <p className="text-sm text-[#4b555b]">
          Track your appointment anytime with your booking reference or email address, or start a
          new booking.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/appointments/track"
            className="px-5 py-2.5 rounded-full bg-[#14181a] text-white text-xs font-medium hover:bg-[#0f5c5c] transition-colors"
          >
            Track Appointment
          </Link>
          <Link
            href="/appointments/doctors"
            className="px-5 py-2.5 rounded-full border border-[#d5d2c9] text-xs font-medium text-[#14181a] hover:border-[#14181a] transition-colors"
          >
            Book New Appointment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Main Confirmation Pass */}
      <div className="rounded-2xl border border-[#e6e4dd] bg-white overflow-hidden">
        <div className="bg-[#edf5f4] border-b border-[#d4e7e4] p-7 sm:p-9 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="h-11 w-11 rounded-full bg-[#0f5c5c] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c]">
                {booking.status}
              </p>
              <h2 className="font-editorial text-2xl sm:text-3xl text-[#14181a] mt-0.5">
                Your appointment is reserved
              </h2>
            </div>
          </div>

          <div className="sm:text-right">
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#4b555b]">
              Booking Reference
            </p>
            <p className="font-mono text-xl font-semibold text-[#14181a]">
              {booking.booking_reference}
            </p>
          </div>
        </div>

        <div className="p-7 sm:p-9 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#768086]">
                Specialist
              </p>
              <p className="text-base font-semibold text-[#14181a]">
                {booking.doctor_name || booking.doctor_slug}
              </p>
              <p className="text-xs text-[#0f5c5c]">{booking.doctor_specialty}</p>
              <p className="text-xs text-[#768086]">{booking.department_name}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#768086]">
                Patient
              </p>
              <p className="text-base font-semibold text-[#14181a] inline-flex items-center gap-1.5">
                <UserRound className="h-4 w-4 text-[#0f5c5c]" />
                {booking.patient_name}
              </p>
              <p className="text-xs text-[#4b555b]">{booking.patient_email}</p>
              <p className="text-xs font-mono text-[#768086]">{booking.patient_phone}</p>
            </div>

            <div className="rounded-xl border border-[#e6e4dd] bg-[#faf9f6] p-4 flex items-center gap-3">
              <Calendar className="h-4 w-4 text-[#0f5c5c] shrink-0" />
              <div>
                <p className="text-[11px] font-mono uppercase text-[#768086]">Date</p>
                <p className="font-mono text-sm font-medium text-[#14181a]">
                  {booking.appointment_date}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#e6e4dd] bg-[#faf9f6] p-4 flex items-center gap-3">
              <Clock className="h-4 w-4 text-[#0f5c5c] shrink-0" />
              <div>
                <p className="text-[11px] font-mono uppercase text-[#768086]">Time &amp; Format</p>
                <p className="text-sm font-medium text-[#14181a]">
                  <span className="font-mono">{booking.time_slot}</span> · {booking.visit_type}
                </p>
              </div>
            </div>
          </div>

          {booking.floor_location && (
            <div className="flex items-start gap-2.5 text-sm text-[#4b555b] pt-4 border-t border-[#e6e4dd]">
              <MapPin className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
              <span>
                Check in at <strong className="text-[#14181a]">{booking.floor_location}</strong>,
                Healix Medical Center — 480 Meridian Avenue, Boston.
              </span>
            </div>
          )}

          <div className="rounded-xl bg-[#f2f1ec]/70 border border-[#e6e4dd] p-5 space-y-2 text-xs text-[#4b555b]">
            <p className="font-semibold text-[#14181a]">Before you arrive</p>
            <p>
              • Arrive 15 minutes early with photo ID, insurance card, and any relevant medical
              records.
            </p>
            <p>
              • Save your reference <span className="font-mono text-[#14181a]">{booking.booking_reference}</span>{' '}
              to track or cancel online at any time.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#d5d2c9] text-xs font-medium text-[#14181a] hover:border-[#14181a] transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Confirmation
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/appointments/track?ref=${encodeURIComponent(booking.booking_reference)}`}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#14181a] text-white text-xs font-medium hover:bg-[#0f5c5c] transition-colors"
              >
                Track Appointment
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/"
                className="text-xs font-medium text-[#4b555b] hover:text-[#14181a] px-2"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
