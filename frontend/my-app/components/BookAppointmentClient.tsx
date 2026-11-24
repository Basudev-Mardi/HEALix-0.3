'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Building2, CalendarDays, Clock, Video } from 'lucide-react';
import DoctorAvatar from './DoctorAvatar';
import { getPublicApiBase, loadBookingDraft, saveBookingDraft } from '@/lib/booking-storage';
import type { Doctor, TimeSlot } from '@/lib/types';

const FALLBACK_SLOTS: TimeSlot[] = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '01:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
].map((time) => ({ time, available: true }));

function getUpcomingDates(days = 10): { iso: string; dayName: string; label: string }[] {
  const result: { iso: string; dayName: string; label: string }[] = [];
  const today = new Date();
  for (let i = 1; i <= days; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    result.push({ iso, dayName, label });
  }
  return result;
}

export default function BookAppointmentClient({ doctors }: { doctors: Doctor[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const upcomingDates = useMemo(() => getUpcomingDates(10), []);

  const initialDoctorSlug = useMemo(() => {
    const fromQuery = searchParams.get('doctor');
    if (fromQuery && doctors.some((d) => d.slug === fromQuery)) return fromQuery;
    const draft = loadBookingDraft();
    if (draft?.doctor_slug && doctors.some((d) => d.slug === draft.doctor_slug)) {
      return draft.doctor_slug;
    }
    return doctors[0]?.slug || '';
  }, [searchParams, doctors]);

  const [doctorSlug, setDoctorSlug] = useState(initialDoctorSlug);
  const [selectedDate, setSelectedDate] = useState(upcomingDates[0]?.iso || '');
  const [visitType, setVisitType] = useState<'In-Person Consultation' | 'Video Tele-Consult'>(
    'In-Person Consultation'
  );
  const [slots, setSlots] = useState<TimeSlot[]>(FALLBACK_SLOTS);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.slug === doctorSlug) || doctors[0],
    [doctors, doctorSlug]
  );

  useEffect(() => {
    if (!doctorSlug || !selectedDate) return;
    let active = true;
    setLoadingSlots(true);
    setSelectedSlot('');

    const apiBase = getPublicApiBase();
    fetch(
      `${apiBase}/appointments/slots?doctor=${encodeURIComponent(doctorSlug)}&date=${encodeURIComponent(selectedDate)}`
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { data?: { slots?: TimeSlot[] } } | null) => {
        if (!active) return;
        setSlots(json?.data?.slots || FALLBACK_SLOTS);
      })
      .catch(() => {
        if (!active) return;
        setSlots(FALLBACK_SLOTS);
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });

    return () => {
      active = false;
    };
  }, [doctorSlug, selectedDate]);

  function handleContinue() {
    if (!selectedDoctor || !selectedDate || !selectedSlot) return;
    saveBookingDraft({
      doctor_slug: selectedDoctor.slug,
      appointment_date: selectedDate,
      time_slot: selectedSlot,
      visit_type: visitType,
    });
    const params = new URLSearchParams({
      doctor: selectedDoctor.slug,
      date: selectedDate,
      slot: selectedSlot,
      type: visitType,
    });
    router.push(`/appointments/patient-details?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      {/* Main Selection Flow */}
      <div className="lg:col-span-8 space-y-8">
        {/* 1. Doctor Selector */}
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-7 space-y-4">
          <label
            htmlFor="doctor-select"
            className="block text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c]"
          >
            1. Specialist
          </label>
          <select
            id="doctor-select"
            value={doctorSlug}
            onChange={(e) => setDoctorSlug(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
          >
            {doctors.map((doc) => (
              <option key={doc.slug} value={doc.slug}>
                {doc.name} — {doc.specialty} ({doc.department_name})
              </option>
            ))}
          </select>
        </div>

        {/* 2. Consultation Mode */}
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-7 space-y-4">
          <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c]">
            2. Visit Format
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setVisitType('In-Person Consultation')}
              className={`rounded-xl border p-5 text-left transition-all ${
                visitType === 'In-Person Consultation'
                  ? 'border-[#0f5c5c] bg-[#edf5f4]/60'
                  : 'border-[#e6e4dd] bg-[#faf9f6] hover:border-[#d5d2c9]'
              }`}
            >
              <Building2 className="h-5 w-5 text-[#0f5c5c] mb-3" />
              <p className="text-sm font-semibold text-[#14181a]">In-Person Consultation</p>
              <p className="text-xs text-[#4b555b] mt-1">
                Visit Healix Medical Center with full diagnostic access.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setVisitType('Video Tele-Consult')}
              className={`rounded-xl border p-5 text-left transition-all ${
                visitType === 'Video Tele-Consult'
                  ? 'border-[#0f5c5c] bg-[#edf5f4]/60'
                  : 'border-[#e6e4dd] bg-[#faf9f6] hover:border-[#d5d2c9]'
              }`}
            >
              <Video className="h-5 w-5 text-[#0f5c5c] mb-3" />
              <p className="text-sm font-semibold text-[#14181a]">Video Tele-Consult</p>
              <p className="text-xs text-[#4b555b] mt-1">
                Encrypted video session ideal for second opinions &amp; follow-ups.
              </p>
            </button>
          </div>
        </div>

        {/* 3. Date Selection */}
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-7 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c]">
              3. Choose Date
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#768086]">
              <CalendarDays className="h-3.5 w-3.5" />
              Next 10 days
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {upcomingDates.map((d) => {
              const active = selectedDate === d.iso;
              return (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => setSelectedDate(d.iso)}
                  className={`rounded-xl border px-3 py-3 text-center transition-colors ${
                    active
                      ? 'bg-[#14181a] text-white border-[#14181a]'
                      : 'bg-[#faf9f6] text-[#14181a] border-[#e6e4dd] hover:border-[#14181a]'
                  }`}
                >
                  <span
                    className={`block text-[11px] font-mono uppercase ${
                      active ? 'text-white/70' : 'text-[#768086]'
                    }`}
                  >
                    {d.dayName}
                  </span>
                  <span className="block text-sm font-medium mt-0.5">{d.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Time Slot Selection */}
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-7 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c]">
              4. Available Time Slots
            </p>
            {loadingSlots && (
              <span className="text-xs font-mono text-[#768086]">Checking availability...</span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {slots.map((slot) => {
              const active = selectedSlot === slot.time;
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => setSelectedSlot(slot.time)}
                  className={`rounded-xl border px-3 py-3 text-xs font-mono transition-colors ${
                    !slot.available
                      ? 'bg-[#f2f1ec] text-[#a0a7ac] border-[#e6e4dd] line-through cursor-not-allowed'
                      : active
                      ? 'bg-[#0f5c5c] text-white border-[#0f5c5c]'
                      : 'bg-white text-[#14181a] border-[#e6e4dd] hover:border-[#0f5c5c]'
                  }`}
                >
                  {slot.time}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky Summary Sidebar */}
      <aside className="lg:col-span-4 lg:sticky lg:top-32">
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-7 space-y-6">
          <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#768086]">
            Booking Summary
          </p>

          {selectedDoctor && (
            <div className="flex items-center gap-4 pb-5 border-b border-[#e6e4dd]">
              <DoctorAvatar
                initials={selectedDoctor.avatar_initials}
                tone={selectedDoctor.accent_tone}
              />
              <div>
                <p className="text-base font-semibold text-[#14181a]">{selectedDoctor.name}</p>
                <p className="text-xs text-[#0f5c5c]">{selectedDoctor.specialty}</p>
                <p className="text-xs text-[#768086] mt-0.5">{selectedDoctor.department_name}</p>
              </div>
            </div>
          )}

          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-[#768086]">Format</dt>
              <dd className="font-medium text-[#14181a]">{visitType}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[#768086]">Date</dt>
              <dd className="font-mono text-[#14181a]">{selectedDate || '—'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[#768086]">Time</dt>
              <dd className="font-mono text-[#14181a] inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#0f5c5c]" />
                {selectedSlot || 'Select a slot'}
              </dd>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#e6e4dd]">
              <dt className="text-[#768086]">Consultation Fee</dt>
              <dd className="font-mono font-semibold text-[#14181a]">
                {selectedDoctor?.consultation_fee || '$200'}
              </dd>
            </div>
          </dl>

          <button
            type="button"
            disabled={!selectedSlot}
            onClick={handleContinue}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-[#14181a] text-white text-sm font-medium hover:bg-[#0f5c5c] disabled:bg-[#d5d2c9] disabled:cursor-not-allowed transition-colors"
          >
            Continue to Patient Details
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="text-[11px] text-[#768086] text-center">
            No upfront payment required. Free cancellation up to 4 hours prior.
          </p>
        </div>
      </aside>
    </div>
  );
}
