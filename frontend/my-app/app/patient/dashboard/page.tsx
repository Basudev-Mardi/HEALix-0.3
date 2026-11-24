'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  CreditCard,
  FlaskConical,
  Pill,
  Plus,
} from 'lucide-react';
import DoctorAvatar from '@/components/DoctorAvatar';
import {
  patientApiFetch,
  type LabReportItem,
  type NotificationItem,
  type PatientUser,
} from '@/lib/patient-auth';
import type { AppointmentRecord } from '@/lib/types';

interface DashboardPayload {
  patient: PatientUser;
  stats: {
    upcoming_appointments: number;
    active_prescriptions: number;
    lab_reports_count: number;
    balance_due: number;
    unread_notifications: number;
  };
  upcomingAppointments: AppointmentRecord[];
  recentLabReports: LabReportItem[];
  recentNotifications: NotificationItem[];
}

export default function PatientDashboardPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientApiFetch<DashboardPayload>('/patient/dashboard').then((res) => {
      if (res.data) setData(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 text-sm text-[#768086]">
        Loading your health overview...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 text-sm text-[#b91c1c]">
        Could not load dashboard summary.
      </div>
    );
  }

  const firstName = data.patient.full_name.split(' ')[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c]">
            Patient Overview · {data.patient.mrn}
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#14181a] mt-1">
            Welcome back, {firstName}
          </h1>
        </div>
        <Link
          href="/appointments/doctors"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#14181a] text-white text-xs font-medium hover:bg-[#0f5c5c] transition-colors self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          Book Consultation
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/patient/appointments" className="card-minimal rounded-2xl p-5 space-y-2">
          <CalendarDays className="h-4 w-4 text-[#0f5c5c]" />
          <p className="font-editorial text-3xl text-[#14181a]">
            {data.stats.upcoming_appointments}
          </p>
          <p className="text-xs text-[#768086]">Upcoming Visits</p>
        </Link>

        <Link href="/patient/prescriptions" className="card-minimal rounded-2xl p-5 space-y-2">
          <Pill className="h-4 w-4 text-[#0f5c5c]" />
          <p className="font-editorial text-3xl text-[#14181a]">
            {data.stats.active_prescriptions}
          </p>
          <p className="text-xs text-[#768086]">Active Prescriptions</p>
        </Link>

        <Link href="/patient/lab-reports" className="card-minimal rounded-2xl p-5 space-y-2">
          <FlaskConical className="h-4 w-4 text-[#0f5c5c]" />
          <p className="font-editorial text-3xl text-[#14181a]">{data.stats.lab_reports_count}</p>
          <p className="text-xs text-[#768086]">Recent Lab Reports</p>
        </Link>

        <Link href="/patient/billing" className="card-minimal rounded-2xl p-5 space-y-2">
          <CreditCard className="h-4 w-4 text-[#0f5c5c]" />
          <p className="font-editorial text-3xl text-[#14181a]">
            ${data.stats.balance_due.toFixed(2)}
          </p>
          <p className="text-xs text-[#768086]">Current Balance</p>
        </Link>
      </div>

      {/* Upcoming Appointments */}
      <div className="rounded-2xl border border-[#e6e4dd] bg-white p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-2xl text-[#14181a]">Upcoming Appointments</h2>
          <Link
            href="/patient/appointments"
            className="text-xs font-medium text-[#0f5c5c] hover:underline inline-flex items-center gap-1"
          >
            View all
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {data.upcomingAppointments.length === 0 ? (
          <p className="text-sm text-[#768086]">
            No upcoming appointments scheduled.{' '}
            <Link href="/appointments/doctors" className="text-[#0f5c5c] underline">
              Book a specialist visit
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-3">
            {data.upcomingAppointments.map((appt) => (
              <Link
                key={appt.booking_reference}
                href={`/patient/appointments/${appt.id ?? appt.booking_reference}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#e6e4dd] bg-[#faf9f6] hover:border-[#0f5c5c] p-4 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <DoctorAvatar
                    initials={appt.avatar_initials || 'HX'}
                    tone={appt.accent_tone || 'slate'}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#14181a]">{appt.doctor_name}</p>
                    <p className="text-xs text-[#4b555b]">
                      {appt.department_name} · {appt.visit_type}
                    </p>
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="font-mono text-xs font-medium text-[#14181a]">
                    {appt.appointment_date} · {appt.time_slot}
                  </p>
                  <p className="font-mono text-[11px] text-[#0f5c5c] mt-0.5">
                    {appt.booking_reference}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Labs & Notifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-xl text-[#14181a]">Latest Lab Reports</h2>
            <Link href="/patient/lab-reports" className="text-xs text-[#0f5c5c] hover:underline">
              All reports
            </Link>
          </div>
          {data.recentLabReports.length === 0 ? (
            <p className="text-sm text-[#768086]">No laboratory reports recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentLabReports.map((lab) => (
                <Link
                  key={lab.id}
                  href="/patient/lab-reports"
                  className="block rounded-xl border border-[#e6e4dd] p-3.5 hover:border-[#0f5c5c] transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#768086]">
                    <span>{lab.report_code}</span>
                    <span>{lab.collected_date}</span>
                  </div>
                  <p className="text-sm font-medium text-[#14181a] mt-1">{lab.test_name}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-xl text-[#14181a] inline-flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#0f5c5c]" />
              Notifications
            </h2>
            <Link href="/patient/notifications" className="text-xs text-[#0f5c5c] hover:underline">
              View all
            </Link>
          </div>
          {data.recentNotifications.length === 0 ? (
            <p className="text-sm text-[#768086]">You are all caught up.</p>
          ) : (
            <div className="space-y-3">
              {data.recentNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-xl border p-3.5 ${
                    n.is_read
                      ? 'border-[#e6e4dd] bg-white'
                      : 'border-[#cde4de] bg-[#edf5f4]/50'
                  }`}
                >
                  <p className="text-xs font-semibold text-[#14181a]">{n.title}</p>
                  <p className="text-xs text-[#4b555b] mt-1">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
