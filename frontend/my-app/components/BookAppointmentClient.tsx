'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  CalendarDays,
  Clock,
  FileText,
  HeartPulse,
  Info,
  MapPin,
  Sparkles,
  Stethoscope,
  UserCheck,
  Video,
} from 'lucide-react';
import DoctorAvatar from './DoctorAvatar';
import { getPublicApiBase, loadBookingDraft, saveBookingDraft } from '@/lib/booking-storage';
import type { Department, Doctor, TimeSlot } from '@/lib/types';

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
  '04:00 PM',
].map((time) => ({ time, available: true }));

const APPOINTMENT_TYPES = [
  {
    type: 'OPD In-Person Consultation',
    icon: Building2,
    badge: 'Standard Clinic',
    desc: 'Face-to-face consultation at Healix Medical Center with full physical examination and diagnostic access.',
  },
  {
    type: 'Follow-up Consultation',
    icon: CalendarCheck,
    badge: 'Post-Care Review',
    desc: 'Review recovery progress, pathology lab reports, or medication adjustments from a prior consultation.',
  },
  {
    type: 'Specialist Second Opinion',
    icon: Stethoscope,
    badge: 'Comprehensive',
    desc: 'Detailed case review by our senior sub-specialist and multidisciplinary tumor or clinical board.',
  },
  {
    type: 'Video Tele-Consult',
    icon: Video,
    badge: 'Remote Telehealth',
    desc: 'HIPAA-compliant encrypted HD video consultation from the comfort and privacy of your home.',
  },
];

function getUpcomingDates(days = 14): { iso: string; dayName: string; label: string; fullDay: string }[] {
  const result: { iso: string; dayName: string; label: string; fullDay: string }[] = [];
  const today = new Date();
  for (let i = 1; i <= days; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const fullDay = d.toLocaleDateString('en-US', { weekday: 'long' });
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    result.push({ iso, dayName, label, fullDay });
  }
  return result;
}

export default function BookAppointmentClient({
  doctors,
  departments = [],
}: {
  doctors: Doctor[];
  departments?: Department[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const upcomingDates = useMemo(() => getUpcomingDates(14), []);

  // Initial department & doctor selection from query params or stored draft
  const initialDoctorSlug = useMemo(() => {
    const fromQuery = searchParams.get('doctor');
    if (fromQuery && doctors.some((d) => d.slug === fromQuery)) return fromQuery;
    const draft = loadBookingDraft();
    if (draft?.doctor_slug && doctors.some((d) => d.slug === draft.doctor_slug)) {
      return draft.doctor_slug;
    }
    return doctors[0]?.slug || '';
  }, [searchParams, doctors]);

  const initialDepartmentSlug = useMemo(() => {
    const fromQuery = searchParams.get('department');
    if (fromQuery && departments.some((d) => d.slug === fromQuery)) return fromQuery;
    const initialDoc = doctors.find((d) => d.slug === initialDoctorSlug);
    if (initialDoc?.department_slug) return initialDoc.department_slug;
    return departments[0]?.slug || 'all';
  }, [searchParams, departments, doctors, initialDoctorSlug]);

  const [selectedDeptSlug, setSelectedDeptSlug] = useState(initialDepartmentSlug);
  const [doctorSlug, setDoctorSlug] = useState(initialDoctorSlug);
  const [appointmentType, setAppointmentType] = useState('OPD In-Person Consultation');
  const [selectedDate, setSelectedDate] = useState(upcomingDates[0]?.iso || '');
  const [slots, setSlots] = useState<TimeSlot[]>(FALLBACK_SLOTS);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');

  // Filter doctors based on selected department
  const filteredDoctors = useMemo(() => {
    if (selectedDeptSlug === 'all') return doctors;
    return doctors.filter((d) => d.department_slug === selectedDeptSlug);
  }, [doctors, selectedDeptSlug]);

  // Ensure doctorSlug is valid whenever filteredDoctors changes
  useEffect(() => {
    if (!filteredDoctors.some((d) => d.slug === doctorSlug)) {
      if (filteredDoctors.length > 0) {
        setDoctorSlug(filteredDoctors[0].slug);
      }
    }
  }, [filteredDoctors, doctorSlug]);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.slug === doctorSlug) || doctors[0],
    [doctors, doctorSlug]
  );

  // Check if a date matches the doctor's scheduled consultation days
  const isDoctorScheduledOnDate = (d: { dayName: string; fullDay: string }) => {
    if (!selectedDoctor?.consultation_days) return true;
    const daysStr = selectedDoctor.consultation_days.toLowerCase();
    if (daysStr.includes('rotating') || daysStr.includes('always') || daysStr.includes('daily')) {
      return true;
    }
    if (daysStr.includes('mon – sat') || daysStr.includes('mon-sat')) {
      return d.dayName.toLowerCase() !== 'sun';
    }
    return (
      daysStr.includes(d.dayName.toLowerCase()) ||
      daysStr.includes(d.fullDay.toLowerCase())
    );
  };

  // Fetch slots whenever doctor or date changes
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
      department_slug: selectedDoctor.department_slug,
      department_name: selectedDoctor.department_name,
      doctor_slug: selectedDoctor.slug,
      appointment_date: selectedDate,
      time_slot: selectedSlot,
      visit_type: appointmentType,
      appointment_type: appointmentType,
      consultation_fee: selectedDoctor.consultation_fee,
    });
    const params = new URLSearchParams({
      doctor: selectedDoctor.slug,
      department: selectedDoctor.department_slug,
      date: selectedDate,
      slot: selectedSlot,
      type: appointmentType,
    });
    router.push(`/appointments/patient-details?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      {/* Main Workflow (Steps 1 to 5) */}
      <div className="lg:col-span-8 space-y-8">
        {/* Step 1: Select Medical Department */}
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-7 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-[#e6e4dd] pb-3">
            <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c] font-semibold">
              Step 1 · Select Medical Department
            </span>
            <Building2 className="h-4 w-4 text-[#0f5c5c]" />
          </div>
          <p className="text-xs text-[#768086]">
            Filter specialist physicians by clinical specialty and hospital wing:
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedDeptSlug('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedDeptSlug === 'all'
                  ? 'bg-[#14181a] text-white'
                  : 'bg-[#faf9f6] border border-[#e6e4dd] text-[#4b555b] hover:border-[#14181a]'
              }`}
            >
              All Departments ({doctors.length})
            </button>
            {departments.map((dept) => {
              const count = doctors.filter((d) => d.department_slug === dept.slug).length;
              return (
                <button
                  key={dept.slug}
                  type="button"
                  onClick={() => setSelectedDeptSlug(dept.slug)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedDeptSlug === dept.slug
                      ? 'bg-[#14181a] text-white'
                      : 'bg-[#faf9f6] border border-[#e6e4dd] text-[#4b555b] hover:border-[#14181a]'
                  }`}
                >
                  {dept.name} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select Doctor */}
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-7 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-[#e6e4dd] pb-3">
            <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c] font-semibold">
              Step 2 · Select Doctor
            </span>
            <Stethoscope className="h-4 w-4 text-[#0f5c5c]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {filteredDoctors.map((doc) => {
              const active = doctorSlug === doc.slug;
              return (
                <div
                  key={doc.slug}
                  onClick={() => setDoctorSlug(doc.slug)}
                  className={`cursor-pointer rounded-xl border p-4.5 flex items-start gap-3.5 transition-all ${
                    active
                      ? 'border-[#0f5c5c] bg-[#edf5f4]/70 shadow-sm ring-1 ring-[#0f5c5c]'
                      : 'border-[#e6e4dd] bg-[#faf9f6] hover:border-[#0f5c5c]/60'
                  }`}
                >
                  <DoctorAvatar initials={doc.avatar_initials} tone={doc.accent_tone} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#14181a] truncate">{doc.name}</p>
                      <span className="text-xs font-mono font-semibold text-[#0f5c5c] shrink-0">
                        {doc.consultation_fee}
                      </span>
                    </div>
                    <p className="text-xs text-[#0f5c5c] font-medium truncate mt-0.5">
                      {doc.specialty}
                    </p>
                    <p className="text-[11px] text-[#768086] truncate mt-1">
                      {doc.qualification} · {doc.experience_years} yrs exp
                    </p>
                    <p className="text-[11px] text-[#768086] truncate mt-0.5">
                      {doc.department_floor || doc.department_name}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedDoctor && (
            <div className="mt-2 p-3.5 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-xs text-[#4b555b] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-[#0f5c5c]" />
                <strong>Clinic Schedule:</strong> {selectedDoctor.consultation_days} ({selectedDoctor.consultation_hours})
              </span>
              <span className="font-mono text-[#0f5c5c] font-semibold">{selectedDoctor.consultation_fee}</span>
            </div>
          )}
        </div>

        {/* Step 3: Select Appointment Type */}
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-7 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-[#e6e4dd] pb-3">
            <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c] font-semibold">
              Step 3 · Select Appointment Type
            </span>
            <FileText className="h-4 w-4 text-[#0f5c5c]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {APPOINTMENT_TYPES.map((item) => {
              const active = appointmentType === item.type;
              const IconComp = item.icon;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setAppointmentType(item.type)}
                  className={`rounded-xl border p-5 text-left transition-all ${
                    active
                      ? 'border-[#0f5c5c] bg-[#edf5f4]/60 shadow-sm ring-1 ring-[#0f5c5c]'
                      : 'border-[#e6e4dd] bg-[#faf9f6] hover:border-[#d5d2c9]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <IconComp className="h-5 w-5 text-[#0f5c5c]" />
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white border border-[#e6e4dd] text-[#768086]">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#14181a]">{item.type}</p>
                  <p className="text-xs text-[#4b555b] mt-1.5 leading-relaxed">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 4: Select Date */}
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-7 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-[#e6e4dd] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c] font-semibold">
                Step 4 · Select Date
              </span>
              <span className="text-[11px] font-mono text-[#768086]">
                (Next 14 Days)
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#768086]">
              <CalendarDays className="h-3.5 w-3.5 text-[#0f5c5c]" />
              Doctor Scheduled Days Highlighted
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
            {upcomingDates.map((d) => {
              const active = selectedDate === d.iso;
              const isScheduled = isDoctorScheduledOnDate(d);
              return (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => setSelectedDate(d.iso)}
                  className={`rounded-xl border p-2.5 text-center transition-all relative ${
                    active
                      ? 'bg-[#14181a] text-white border-[#14181a] shadow-sm'
                      : isScheduled
                      ? 'bg-white text-[#14181a] border-[#0f5c5c]/40 hover:border-[#14181a]'
                      : 'bg-[#faf9f6] text-[#768086] border-[#e6e4dd] hover:border-[#14181a]'
                  }`}
                >
                  <span
                    className={`block text-[10px] font-mono uppercase ${
                      active ? 'text-white/80' : isScheduled ? 'text-[#0f5c5c] font-semibold' : 'text-[#768086]'
                    }`}
                  >
                    {d.dayName}
                  </span>
                  <span className="block text-xs sm:text-sm font-semibold mt-0.5">
                    {d.label}
                  </span>
                  {isScheduled && !active && (
                    <span className="block text-[9px] text-[#0f5c5c] mt-0.5 font-medium">
                      Clinic Day
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 5: Select Time Slot */}
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-7 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-[#e6e4dd] pb-3">
            <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c] font-semibold">
              Step 5 · Select Available Time Slot
            </span>
            <div className="flex items-center gap-2">
              {loadingSlots ? (
                <span className="text-xs font-mono text-[#0f5c5c]">Verifying slot availability...</span>
              ) : (
                <span className="text-xs font-mono text-[#768086]">
                  {slots.filter((s) => s.available).length} slots open
                </span>
              )}
            </div>
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
                  className={`rounded-xl border px-3 py-3 text-xs font-mono transition-all flex items-center justify-between ${
                    !slot.available
                      ? 'bg-[#f4f3ef] text-[#a0a7ac] border-[#e6e4dd] cursor-not-allowed line-through'
                      : active
                      ? 'bg-[#0f5c5c] text-white border-[#0f5c5c] shadow-sm font-semibold'
                      : 'bg-white text-[#14181a] border-[#e6e4dd] hover:border-[#0f5c5c]'
                  }`}
                >
                  <span>{slot.time}</span>
                  {slot.available ? (
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${
                        active ? 'bg-white/20 text-white' : 'bg-[#edf5f4] text-[#0f5c5c]'
                      }`}
                    >
                      Open
                    </span>
                  ) : (
                    <span className="text-[9px] text-[#a0a7ac]">Booked</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky Summary Sidebar */}
      <aside className="lg:col-span-4 lg:sticky lg:top-28">
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-7 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e6e4dd] pb-3">
            <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#768086]">
              Booking Overview
            </p>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#edf5f4] text-[#0f5c5c]">
              Step 1–5 Done
            </span>
          </div>

          {selectedDoctor && (
            <div className="flex items-center gap-4 pb-5 border-b border-[#e6e4dd]">
              <DoctorAvatar
                initials={selectedDoctor.avatar_initials}
                tone={selectedDoctor.accent_tone}
                size="md"
              />
              <div className="min-w-0">
                <p className="text-base font-semibold text-[#14181a] truncate">{selectedDoctor.name}</p>
                <p className="text-xs text-[#0f5c5c] font-medium truncate">{selectedDoctor.specialty}</p>
                <p className="text-xs text-[#768086] mt-0.5 truncate">{selectedDoctor.department_name}</p>
              </div>
            </div>
          )}

          <dl className="space-y-3.5 text-sm">
            <div className="flex items-start justify-between">
              <dt className="text-xs text-[#768086]">Department</dt>
              <dd className="text-xs font-medium text-[#14181a] text-right">
                {selectedDoctor?.department_name || 'Selected'}
              </dd>
            </div>
            <div className="flex items-start justify-between">
              <dt className="text-xs text-[#768086]">Appointment Type</dt>
              <dd className="text-xs font-medium text-[#14181a] text-right max-w-[180px]">
                {appointmentType}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-xs text-[#768086]">Appointment Date</dt>
              <dd className="font-mono text-xs text-[#14181a] font-medium">
                {selectedDate || '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-xs text-[#768086]">Time Slot</dt>
              <dd className="font-mono text-xs text-[#14181a] inline-flex items-center gap-1 font-semibold">
                <Clock className="h-3.5 w-3.5 text-[#0f5c5c]" />
                {selectedSlot || 'Select a slot'}
              </dd>
            </div>
            {selectedDoctor?.department_floor && (
              <div className="flex items-center justify-between">
                <dt className="text-xs text-[#768086]">Consultation Room</dt>
                <dd className="text-xs text-[#14181a] flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-[#0f5c5c]" />
                  {selectedDoctor.department_floor}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-[#e6e4dd]">
              <dt className="text-xs text-[#768086] font-medium">Consultation Fee</dt>
              <dd className="font-mono font-bold text-base text-[#0f5c5c]">
                {selectedDoctor?.consultation_fee || '$180'}
              </dd>
            </div>
          </dl>

          <button
            type="button"
            disabled={!selectedSlot}
            onClick={handleContinue}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-[#14181a] text-white text-xs font-semibold hover:bg-[#0f5c5c] disabled:bg-[#d5d2c9] disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Continue to Patient Details &amp; Review
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="rounded-xl bg-[#faf9f6] p-3 text-[11px] text-[#768086] space-y-1">
            <p className="flex items-center gap-1 font-medium text-[#14181a]">
              <Info className="h-3.5 w-3.5 text-[#0f5c5c]" />
              Booking &amp; Payment Policy:
            </p>
            <p>• Zero upfront booking fee. Payment settled at reception desk.</p>
            <p>• Free cancellation and rescheduling up to 4 hours prior.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
