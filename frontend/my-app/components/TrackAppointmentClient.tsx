'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  Loader2,
  MapPin,
  Search,
  XCircle,
} from 'lucide-react';
import DoctorAvatar from './DoctorAvatar';
import { getPublicApiBase } from '@/lib/booking-storage';
import type { AppointmentRecord } from '@/lib/types';

export default function TrackAppointmentClient() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get('ref') || '';

  const [queryText, setQueryText] = useState(initialRef);
  const [results, setResults] = useState<AppointmentRecord[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancellingRef, setCancellingRef] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function runLookup(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setSearched(true);

    const isEmail = trimmed.includes('@');
    const param = isEmail
      ? `email=${encodeURIComponent(trimmed)}`
      : `reference=${encodeURIComponent(trimmed)}`;

    try {
      const apiBase = getPublicApiBase();
      const res = await fetch(`${apiBase}/appointments/track?${param}`);
      const json = (await res.json()) as { data?: AppointmentRecord[]; error?: string };
      if (!res.ok) {
        setError(json.error || 'Unable to look up appointment.');
        setResults([]);
      } else {
        setResults(json.data || []);
      }
    } catch {
      setError('Could not connect to the Healix API server. Please ensure the backend is running.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialRef) {
      runLookup(initialRef);
    }
  }, [initialRef]);

  async function handleCancel(item: AppointmentRecord) {
    const reference = item.booking_reference;
    setCancellingRef(reference);
    setError('');
    try {
      const apiBase = getPublicApiBase();
      const res = await fetch(
        `${apiBase}/appointments/${encodeURIComponent(reference)}/cancel`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: item.patient_email,
            phone: item.patient_phone,
            reason: 'Cancelled via online tracking portal',
          }),
        }
      );
      if (res.ok) {
        setResults((prev) =>
          prev.map((r) =>
            r.booking_reference === reference ? { ...r, status: 'Cancelled' } : r
          )
        );
      } else {
        const json = await res.json().catch(() => null);
        setError(json?.error || 'Unable to cancel this appointment right now.');
      }
    } catch {
      setError('Network error while cancelling appointment.');
    } finally {
      setCancellingRef(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Lookup Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runLookup(queryText);
        }}
        className="rounded-2xl border border-[#E5E8E6] bg-white p-6 sm:p-8 space-y-4"
      >
        <label htmlFor="track-input" className="block text-xs font-mono uppercase tracking-[0.14em] text-[#174C40]">
          Booking Reference or Registered Email
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-[#77817C] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              id="track-input"
              type="text"
              required
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="e.g., HX-2026-1042 or clara.vance@example.com"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#FAFAF7] border border-[#E5E8E6] text-sm text-[#242A28] focus:outline-none focus:border-[#174C40]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#242A28] text-white text-sm font-medium hover:bg-[#174C40] disabled:opacity-60 transition-colors shrink-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Track Status'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#77817C]">
          <span>Sample seeded references:</span>
          <button
            type="button"
            onClick={() => {
              setQueryText('HX-2026-1042');
              runLookup('HX-2026-1042');
            }}
            className="font-mono text-[#174C40] hover:underline"
          >
            HX-2026-1042
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => {
              setQueryText('HX-2026-1088');
              runLookup('HX-2026-1088');
            }}
            className="font-mono text-[#174C40] hover:underline"
          >
            HX-2026-1088
          </button>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-[#f0d5d5] bg-[#fef2f2] px-5 py-4 text-sm text-[#b91c1c]"
        >
          {error}
        </div>
      )}

      {/* Results */}
      {searched && !loading && results.length === 0 && !error && (
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-10 text-center space-y-3">
          <p className="text-base font-medium text-[#242A28]">No appointment found</p>
          <p className="text-sm text-[#77817C]">
            Check your booking reference or email address, or schedule a new appointment.
          </p>
          <Link
            href="/appointments/doctors"
            className="inline-block mt-2 px-5 py-2.5 rounded-full bg-[#242A28] text-white text-xs font-medium hover:bg-[#174C40]"
          >
            Book New Appointment
          </Link>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-5">
          {results.map((appt) => {
            const isCancelled = appt.status === 'Cancelled';
            return (
              <article
                key={appt.booking_reference}
                className="rounded-2xl border border-[#E5E8E6] bg-white p-7 space-y-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#E5E8E6]">
                  <div className="flex items-center gap-4">
                    <DoctorAvatar
                      initials={appt.avatar_initials || 'HX'}
                      tone={appt.accent_tone || 'slate'}
                    />
                    <div>
                      <p className="font-mono text-xs text-[#77817C]">{appt.booking_reference}</p>
                      <h2 className="text-lg font-semibold text-[#242A28]">{appt.doctor_name}</h2>
                      <p className="text-xs text-[#174C40]">{appt.doctor_specialty}</p>
                    </div>
                  </div>

                  <span
                    className={`px-3.5 py-1 rounded-full text-xs font-mono font-medium ${
                      isCancelled
                        ? 'bg-[#fef2f2] text-[#b91c1c]'
                        : 'bg-[#E6EFE9] text-[#174C40]'
                    }`}
                  >
                    {appt.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs text-[#77817C]">Date</p>
                    <p className="font-mono text-[#242A28] inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#174C40]" />
                      {appt.appointment_date}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-[#77817C]">Time</p>
                    <p className="font-mono text-[#242A28] inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#174C40]" />
                      {appt.time_slot}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-[#77817C]">Format</p>
                    <p className="text-[#242A28]">{appt.visit_type}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E5E8E6] text-xs text-[#4A5350]">
                  <div className="space-y-1">
                    <p>
                      Patient: <strong className="text-[#242A28]">{appt.patient_name}</strong> (
                      {appt.patient_email})
                    </p>
                    {appt.floor_location && (
                      <p className="inline-flex items-center gap-1 text-[#77817C]">
                        <MapPin className="h-3.5 w-3.5 text-[#174C40]" />
                        {appt.department_name} · {appt.floor_location}
                      </p>
                    )}
                  </div>

                  {!isCancelled && (
                    <button
                      type="button"
                      disabled={cancellingRef === appt.booking_reference}
                      onClick={() => handleCancel(appt)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#f0d5d5] text-[#b91c1c] hover:bg-[#fef2f2] font-medium transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      {cancellingRef === appt.booking_reference
                        ? 'Cancelling...'
                        : 'Cancel Appointment'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
