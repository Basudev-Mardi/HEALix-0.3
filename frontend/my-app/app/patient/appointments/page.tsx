'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Calendar, Clock, Plus } from 'lucide-react';
import DoctorAvatar from '@/components/DoctorAvatar';
import { patientApiFetch } from '@/lib/patient-auth';
import type { AppointmentRecord } from '@/lib/types';

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [filter, setFilter] = useState<'All' | 'Confirmed' | 'Cancelled'>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientApiFetch<AppointmentRecord[]>('/patient/appointments').then((res) => {
      if (res.data) setAppointments(res.data);
      setLoading(false);
    });
  }, []);

  const filtered =
    filter === 'All'
      ? appointments
      : appointments.filter((a) => a.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#174C40]">
            Consultations
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#242A28] mt-1">
            My Appointments
          </h1>
        </div>
        <Link
          href="/appointments/doctors"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#242A28] text-white text-xs font-medium hover:bg-[#174C40] transition-colors self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          New Appointment
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['All', 'Confirmed', 'Cancelled'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${filter === tab
              ? 'bg-[#242A28] text-white'
              : 'bg-white border border-[#E5E8E6] text-[#4A5350] hover:border-[#242A28]'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-10 text-sm text-[#77817C]">
          Loading your appointments...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-10 text-center space-y-3">
          <p className="text-base font-medium text-[#242A28]">No appointments in this view</p>
          <Link
            href="/appointments/doctors"
            className="inline-block px-5 py-2.5 rounded-full bg-[#242A28] text-white text-xs font-medium hover:bg-[#174C40]"
          >
            Schedule a Visit
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((appt) => {
            const isCancelled = appt.status === 'Cancelled';
            return (
              <Link
                key={appt.booking_reference}
                href={`/patient/appointments/${appt.id ?? appt.booking_reference}`}
                className="card-minimal rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 group block"
              >
                <div className="flex items-start gap-4">
                  <DoctorAvatar
                    initials={appt.avatar_initials || 'HX'}
                    tone={appt.accent_tone || 'slate'}
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-[#77817C]">
                        {appt.booking_reference}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono ${isCancelled
                          ? 'bg-[#fef2f2] text-[#b91c1c]'
                          : 'bg-[#E6EFE9] text-[#174C40]'
                          }`}
                      >
                        {appt.status}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-[#242A28] group-hover:text-[#174C40] mt-1">
                      {appt.doctor_name}
                    </h2>
                    <p className="text-xs text-[#4A5350]">
                      {appt.department_name} · {appt.visit_type}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#E5E8E6]">
                  <div className="sm:text-right space-y-0.5">
                    <p className="font-mono text-xs text-[#242A28] inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#174C40]" />
                      {appt.appointment_date}
                    </p>
                    <p className="font-mono text-xs text-[#4A5350] flex sm:justify-end items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#174C40]" />
                      {appt.time_slot}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#242A28] group-hover:text-[#174C40]">
                    {isCancelled ? 'View Summary' : 'Manage / Cancel'}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

