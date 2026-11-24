'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  FileHeart,
  FileText,
  FlaskConical,
  History,
  MapPin,
  Pill,
  Plus,
  ScanLine,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import DoctorAvatar from '@/components/DoctorAvatar';
import {
  patientApiFetch,
  type BillingItem,
  type LabReportItem,
  type NotificationItem,
  type PatientUser,
  type PrescriptionItem,
  type RadiologyReportItem,
} from '@/lib/patient-auth';
import type { AppointmentRecord } from '@/lib/types';

interface DashboardPayload {
  patient: PatientUser;
  stats: {
    upcoming_appointments: number;
    active_prescriptions: number;
    lab_reports_count: number;
    radiology_reports_count?: number;
    balance_due: number;
    unread_notifications: number;
  };
  upcomingAppointments: AppointmentRecord[];
  recentAppointmentHistory?: AppointmentRecord[];
  recentPrescriptions?: PrescriptionItem[];
  recentLabReports: LabReportItem[];
  recentRadiologyReports?: RadiologyReportItem[];
  pendingBills?: BillingItem[];
  recentNotifications: NotificationItem[];
}

function calculateAge(dob: string | null | undefined): string {
  if (!dob) return 'N/A';
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return 'N/A';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} yrs`;
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
      <div className="rounded-2xl border border-[#E5E8E6] bg-white p-12 text-center text-sm text-[#77817C]">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#174C40] border-t-transparent mb-3" />
        <p>Loading your health overview...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-10 text-sm text-red-700">
        <p className="font-semibold">Unable to load patient dashboard</p>
        <p className="mt-1 text-xs text-red-600">
          Could not retrieve verified patient records. Please refresh the page or try logging in again.
        </p>
      </div>
    );
  }

  const { patient, stats } = data;
  const firstName = patient.full_name ? patient.full_name.split(' ')[0] : 'Patient';
  const nextAppt = data.upcomingAppointments?.[0];
  const historyList = data.recentAppointmentHistory || [];
  const prescriptionsList = data.recentPrescriptions || [];
  const labsList = data.recentLabReports || [];
  const radiologyList = data.recentRadiologyReports || [];
  const billsList = data.pendingBills || [];
  const notifsList = data.recentNotifications || [];

  return (
    <div className="space-y-8">
      {/* 1. Welcome Message & Identification Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E8E6] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6EFE9] text-[#174C40] font-mono text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              MRN: {patient.mrn}
            </span>
            <span className="text-xs text-[#77817C] hidden sm:inline">
              Verified Healthcare Profile
            </span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#242A28] mt-2">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-[#77817C] mt-1">
            Access your authorized medical records, upcoming consultations, test results, and prescriptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/appointments/doctors"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#242A28] text-white text-xs font-medium hover:bg-[#174C40] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Book Consultation
          </Link>
          <Link
            href="/patient/profile"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#d2d0c8] bg-white text-[#242A28] text-xs font-medium hover:border-[#174C40] transition-colors"
          >
            <UserRound className="h-3.5 w-3.5 text-[#174C40]" />
            My Profile
          </Link>
        </div>
      </div>

      {/* 2. Patient Profile Summary Card */}
      <div className="rounded-2xl border border-[#E5E8E6] bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E5E8E6] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-[#174C40]" />
            <h2 className="font-editorial text-lg text-[#242A28]">Patient Profile Summary</h2>
          </div>
          <Link
            href="/patient/profile"
            className="text-xs font-medium text-[#174C40] hover:underline inline-flex items-center gap-1"
          >
            Edit Demographics
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-[#77817C] uppercase tracking-wider text-[10px] font-mono">Patient Name</span>
            <p className="font-semibold text-[#242A28] truncate">{patient.full_name}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[#77817C] uppercase tracking-wider text-[10px] font-mono">MRN (ID Number)</span>
            <p className="font-mono font-bold text-[#174C40]">{patient.mrn}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[#77817C] uppercase tracking-wider text-[10px] font-mono">Blood Group</span>
            <p className="font-semibold text-[#242A28]">{patient.blood_group || 'Not recorded'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[#77817C] uppercase tracking-wider text-[10px] font-mono">Age / DOB</span>
            <p className="font-semibold text-[#242A28]">
              {calculateAge(patient.date_of_birth)}
              {patient.date_of_birth && <span className="text-[#77817C] font-normal text-[11px] block">{patient.date_of_birth}</span>}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[#77817C] uppercase tracking-wider text-[10px] font-mono">Emergency Contact</span>
            <p className="font-semibold text-[#242A28] truncate">{patient.emergency_contact_name || 'None listed'}</p>
            {patient.emergency_contact_phone && (
              <p className="text-[11px] text-[#77817C] font-mono">{patient.emergency_contact_phone}</p>
            )}
          </div>
          <div className="space-y-1">
            <span className="text-[#77817C] uppercase tracking-wider text-[10px] font-mono">Primary Insurance</span>
            <p className="font-semibold text-[#242A28] truncate">{patient.insurance_provider || 'Self-Pay'}</p>
            {patient.insurance_policy_no && (
              <p className="text-[11px] text-[#77817C] font-mono truncate">#{patient.insurance_policy_no}</p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Quick Actions Matrix */}
      <div className="space-y-2">
        <h3 className="text-xs font-mono uppercase tracking-[0.14em] text-[#77817C]">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/appointments/doctors"
            className="group flex flex-col items-center justify-center p-3.5 rounded-xl border border-[#E5E8E6] bg-white hover:border-[#174C40] hover:bg-[#E6EFE9]/40 transition-all text-center"
          >
            <div className="h-9 w-9 rounded-full bg-[#E6EFE9] text-[#174C40] flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
              <Plus className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium text-[#242A28]">Book Consultation</span>
          </Link>

          <Link
            href="/patient/prescriptions"
            className="group flex flex-col items-center justify-center p-3.5 rounded-xl border border-[#E5E8E6] bg-white hover:border-[#174C40] hover:bg-[#E6EFE9]/40 transition-all text-center"
          >
            <div className="h-9 w-9 rounded-full bg-[#E6EFE9] text-[#174C40] flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
              <Pill className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium text-[#242A28]">Prescriptions</span>
          </Link>

          <Link
            href="/patient/lab-reports"
            className="group flex flex-col items-center justify-center p-3.5 rounded-xl border border-[#E5E8E6] bg-white hover:border-[#174C40] hover:bg-[#E6EFE9]/40 transition-all text-center"
          >
            <div className="h-9 w-9 rounded-full bg-[#E6EFE9] text-[#174C40] flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
              <FlaskConical className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium text-[#242A28]">Lab Results</span>
          </Link>

          <Link
            href="/patient/radiology-reports"
            className="group flex flex-col items-center justify-center p-3.5 rounded-xl border border-[#E5E8E6] bg-white hover:border-[#174C40] hover:bg-[#E6EFE9]/40 transition-all text-center"
          >
            <div className="h-9 w-9 rounded-full bg-[#E6EFE9] text-[#174C40] flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
              <ScanLine className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium text-[#242A28]">Radiology Imaging</span>
          </Link>

          <Link
            href="/patient/billing"
            className="group flex flex-col items-center justify-center p-3.5 rounded-xl border border-[#E5E8E6] bg-white hover:border-[#174C40] hover:bg-[#E6EFE9]/40 transition-all text-center"
          >
            <div className="h-9 w-9 rounded-full bg-[#E6EFE9] text-[#174C40] flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
              <CreditCard className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium text-[#242A28]">Pay Invoices</span>
          </Link>

          <Link
            href="/patient/medical-history"
            className="group flex flex-col items-center justify-center p-3.5 rounded-xl border border-[#E5E8E6] bg-white hover:border-[#174C40] hover:bg-[#E6EFE9]/40 transition-all text-center"
          >
            <div className="h-9 w-9 rounded-full bg-[#E6EFE9] text-[#174C40] flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
              <FileHeart className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium text-[#242A28]">Medical History</span>
          </Link>
        </div>
      </div>

      {/* 4. Key Health Statistics Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Link href="/patient/appointments" className="card-minimal rounded-2xl p-5 space-y-2 hover:border-[#174C40] transition-colors">
          <div className="flex items-center justify-between">
            <CalendarDays className="h-4 w-4 text-[#174C40]" />
            <span className="text-[10px] font-mono text-[#77817C]">Active</span>
          </div>
          <p className="font-editorial text-3xl text-[#242A28]">
            {stats.upcoming_appointments}
          </p>
          <p className="text-xs text-[#77817C]">Upcoming Visits</p>
        </Link>

        <Link href="/patient/prescriptions" className="card-minimal rounded-2xl p-5 space-y-2 hover:border-[#174C40] transition-colors">
          <div className="flex items-center justify-between">
            <Pill className="h-4 w-4 text-[#174C40]" />
            <span className="text-[10px] font-mono text-[#77817C]">Active</span>
          </div>
          <p className="font-editorial text-3xl text-[#242A28]">
            {stats.active_prescriptions}
          </p>
          <p className="text-xs text-[#77817C]">Active Prescriptions</p>
        </Link>

        <Link href="/patient/lab-reports" className="card-minimal rounded-2xl p-5 space-y-2 hover:border-[#174C40] transition-colors">
          <div className="flex items-center justify-between">
            <FlaskConical className="h-4 w-4 text-[#174C40]" />
            <span className="text-[10px] font-mono text-[#174C40]">Released</span>
          </div>
          <p className="font-editorial text-3xl text-[#242A28]">{stats.lab_reports_count}</p>
          <p className="text-xs text-[#77817C]">Released Lab Reports</p>
        </Link>

        <Link href="/patient/radiology-reports" className="card-minimal rounded-2xl p-5 space-y-2 hover:border-[#174C40] transition-colors">
          <div className="flex items-center justify-between">
            <ScanLine className="h-4 w-4 text-[#174C40]" />
            <span className="text-[10px] font-mono text-[#174C40]">Released</span>
          </div>
          <p className="font-editorial text-3xl text-[#242A28]">{stats.radiology_reports_count ?? 0}</p>
          <p className="text-xs text-[#77817C]">Radiology Studies</p>
        </Link>

        <Link href="/patient/billing" className="card-minimal rounded-2xl p-5 space-y-2 hover:border-[#174C40] transition-colors col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <CreditCard className="h-4 w-4 text-[#174C40]" />
            <span className="text-[10px] font-mono text-amber-700">Due</span>
          </div>
          <p className="font-editorial text-3xl text-[#242A28]">
            ${Number(stats.balance_due || 0).toFixed(2)}
          </p>
          <p className="text-xs text-[#77817C]">Pending Balance</p>
        </Link>
      </div>

      {/* 5. Upcoming Appointment Highlight Card */}
      <div className="rounded-2xl border border-[#E5E8E6] bg-white p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[#174C40]" />
            <h2 className="font-editorial text-2xl text-[#242A28]">Upcoming Consultation</h2>
          </div>
          <Link
            href="/patient/appointments"
            className="text-xs font-medium text-[#174C40] hover:underline inline-flex items-center gap-1"
          >
            Manage appointments
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {!nextAppt ? (
          <div className="rounded-xl border border-dashed border-[#d2d0c8] bg-[#FAFAF7] p-8 text-center space-y-3">
            <CalendarDays className="h-8 w-8 text-[#77817C] mx-auto opacity-60" />
            <p className="text-sm font-medium text-[#242A28]">No upcoming consultations scheduled</p>
            <p className="text-xs text-[#77817C] max-w-md mx-auto">
              Schedule an in-person OPD consultation or follow-up with our verified specialists.
            </p>
            <Link
              href="/appointments/doctors"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#174C40] text-white text-xs font-medium hover:bg-[#0a4242] transition-colors mt-2"
            >
              <Plus className="h-3 w-3" />
              Book New Appointment
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-[#174C40]/30 bg-[#E6EFE9]/30 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <DoctorAvatar
                  initials={nextAppt.avatar_initials || 'HX'}
                  tone={nextAppt.accent_tone || 'teal'}
                  size="md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-[#242A28]">{nextAppt.doctor_name}</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800">
                      Confirmed
                    </span>
                  </div>
                  <p className="text-xs text-[#4A5350] mt-0.5">
                    {nextAppt.doctor_specialty || nextAppt.department_name} · {nextAppt.visit_type}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E5E8E6]">
                <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#242A28]">
                  <Clock className="h-3.5 w-3.5 text-[#174C40]" />
                  <span>{nextAppt.appointment_date} · {nextAppt.time_slot}</span>
                </div>
                <p className="font-mono text-[11px] text-[#174C40] mt-0.5">
                  Ref: {nextAppt.booking_reference}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#d2d0c8]/60 text-xs text-[#4A5350]">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[#77817C]" />
                <span>{nextAppt.floor_location || 'Main Hospital Campus'}</span>
                {nextAppt.reason_for_visit && (
                  <span className="text-[#77817C] truncate max-w-xs">
                    · Reason: {nextAppt.reason_for_visit}
                  </span>
                )}
              </div>
              <Link
                href={`/patient/appointments/${nextAppt.id ?? nextAppt.booking_reference}`}
                className="text-xs font-medium text-[#174C40] hover:underline inline-flex items-center gap-1"
              >
                View appointment details
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 6. Recent Appointment History */}
      <div className="rounded-2xl border border-[#E5E8E6] bg-white p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#174C40]" />
            <h2 className="font-editorial text-xl text-[#242A28]">Recent Appointment History</h2>
          </div>
          <Link
            href="/patient/appointments"
            className="text-xs font-medium text-[#174C40] hover:underline inline-flex items-center gap-1"
          >
            Full history
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {historyList.length === 0 ? (
          <p className="text-xs text-[#77817C] py-2">No prior consultations recorded on your file.</p>
        ) : (
          <div className="space-y-2.5">
            {historyList.map((appt) => (
              <div
                key={appt.booking_reference}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl border border-[#E5E8E6] hover:bg-[#FAFAF7] transition-colors text-xs"
              >
                <div className="flex items-center gap-3">
                  <DoctorAvatar
                    initials={appt.avatar_initials || 'HX'}
                    tone={appt.accent_tone || 'slate'}
                    size="sm"
                  />
                  <div>
                    <p className="font-semibold text-[#242A28]">{appt.doctor_name}</p>
                    <p className="text-[#77817C] text-[11px]">
                      {appt.department_name} · {appt.visit_type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
                  <div>
                    <p className="font-mono text-[#242A28]">{appt.appointment_date}</p>
                    <span className="font-mono text-[10px] text-[#77817C]">{appt.booking_reference}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                      appt.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : appt.status === 'Cancelled'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    {appt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7 & 8: Active Prescriptions & Released Lab Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Prescriptions */}
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-[#174C40]" />
              <h2 className="font-editorial text-xl text-[#242A28]">Recent Prescriptions</h2>
            </div>
            <Link href="/patient/prescriptions" className="text-xs text-[#174C40] hover:underline">
              View all
            </Link>
          </div>

          {prescriptionsList.length === 0 ? (
            <p className="text-xs text-[#77817C] py-3">No active prescriptions currently on file.</p>
          ) : (
            <div className="space-y-3">
              {prescriptionsList.map((rx) => (
                <div
                  key={rx.id}
                  className="rounded-xl border border-[#E5E8E6] p-3.5 space-y-1.5 hover:border-[#174C40] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#242A28]">{rx.medication_name}</p>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                      {rx.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#4A5350]">
                    {rx.dosage} · {rx.frequency} {rx.duration && `(${rx.duration})`}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-[#77817C] pt-1 border-t border-[#E5E8E6]">
                    <span>Dr. {rx.prescribed_by}</span>
                    <span className="font-mono">Refills: {rx.refills_remaining}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Released Laboratory Reports */}
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-[#174C40]" />
              <h2 className="font-editorial text-xl text-[#242A28]">Latest Laboratory Reports</h2>
            </div>
            <Link href="/patient/lab-reports" className="text-xs text-[#174C40] hover:underline">
              View all
            </Link>
          </div>

          {labsList.length === 0 ? (
            <p className="text-xs text-[#77817C] py-3">No laboratory reports released yet.</p>
          ) : (
            <div className="space-y-3">
              {labsList.map((lab) => (
                <Link
                  key={lab.id}
                  href="/patient/lab-reports"
                  className="block rounded-xl border border-[#E5E8E6] p-3.5 hover:border-[#174C40] transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#77817C]">
                    <span>{lab.report_code}</span>
                    <div className="flex items-center gap-1.5">
                      <span>{lab.collected_date}</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[10px]">
                        {lab.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-[#242A28]">{lab.test_name}</p>
                  {lab.summary && (
                    <p className="text-xs text-[#4A5350] line-clamp-1">{lab.summary}</p>
                  )}
                  {lab.ordered_by && (
                    <p className="text-[11px] text-[#77817C]">Ordered by Dr. {lab.ordered_by}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 8 & 9: Released Radiology & Pending Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Radiology Reports */}
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-[#174C40]" />
              <h2 className="font-editorial text-xl text-[#242A28]">Recent Radiology Reports</h2>
            </div>
            <Link href="/patient/radiology-reports" className="text-xs text-[#174C40] hover:underline">
              View all
            </Link>
          </div>

          {radiologyList.length === 0 ? (
            <p className="text-xs text-[#77817C] py-3">No imaging studies released yet.</p>
          ) : (
            <div className="space-y-3">
              {radiologyList.map((rad) => (
                <Link
                  key={rad.id}
                  href="/patient/radiology-reports"
                  className="block rounded-xl border border-[#E5E8E6] p-3.5 hover:border-[#174C40] transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono px-2 py-0.5 rounded bg-[#E6EFE9] text-[#174C40] font-semibold text-[10px]">
                      {rad.modality}
                    </span>
                    <span className="font-mono text-[#77817C]">{rad.study_date}</span>
                  </div>
                  <p className="text-sm font-semibold text-[#242A28]">{rad.study_name}</p>
                  {rad.impression && (
                    <p className="text-xs text-[#4A5350] line-clamp-1 italic">
                      &quot;{rad.impression}&quot;
                    </p>
                  )}
                  <p className="text-[11px] text-[#77817C]">
                    Radiologist: Dr. {rad.radiologist_name} · Ref: {rad.study_code}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pending Bills */}
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#174C40]" />
              <h2 className="font-editorial text-xl text-[#242A28]">Pending Invoices & Bills</h2>
            </div>
            <Link href="/patient/billing" className="text-xs text-[#174C40] hover:underline">
              Billing statement
            </Link>
          </div>

          {billsList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#d2d0c8] p-6 text-center text-xs text-[#77817C] space-y-1">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" />
              <p className="font-medium text-[#242A28]">All accounts are settled</p>
              <p>You have no pending invoices or outstanding hospital charges.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {billsList.map((bill) => (
                <div
                  key={bill.id}
                  className="rounded-xl border border-[#E5E8E6] p-3.5 space-y-2 hover:border-[#174C40] transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-[#242A28]">{bill.service_description}</p>
                      <p className="text-[11px] text-[#77817C]">
                        {bill.department_name} · Invoice #{bill.invoice_number}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-bold text-[#242A28]">
                        ${Number(bill.patient_responsibility).toFixed(2)}
                      </p>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800">
                        Due {bill.due_date}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#E5E8E6] flex items-center justify-end">
                    <Link
                      href="/patient/billing"
                      className="px-3 py-1 rounded-full bg-[#174C40] text-white text-[11px] font-medium hover:bg-[#0a4242] transition-colors"
                    >
                      Pay Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 10. Notifications & Account Alerts */}
      <div className="rounded-2xl border border-[#E5E8E6] bg-white p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#174C40]" />
            <h2 className="font-editorial text-xl text-[#242A28]">Notifications & Alerts</h2>
          </div>
          <Link href="/patient/notifications" className="text-xs text-[#174C40] hover:underline">
            View all alerts
          </Link>
        </div>

        {notifsList.length === 0 ? (
          <p className="text-xs text-[#77817C] py-2">No unread notifications at this time.</p>
        ) : (
          <div className="space-y-2.5">
            {notifsList.map((n) => (
              <div
                key={n.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 transition-colors ${
                  n.is_read
                    ? 'border-[#E5E8E6] bg-white'
                    : 'border-[#cde4de] bg-[#E6EFE9]/50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#174C40]">
                      {n.category}
                    </span>
                    {!n.is_read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#174C40]" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[#242A28] mt-0.5">{n.title}</p>
                  <p className="text-xs text-[#4A5350] mt-0.5">{n.message}</p>
                </div>
                {n.action_href && (
                  <Link
                    href={n.action_href}
                    className="text-xs font-medium text-[#174C40] hover:underline self-end sm:self-auto shrink-0 inline-flex items-center gap-1"
                  >
                    Open
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 11. Clinical Release Disclaimer */}
      <div className="rounded-2xl border border-[#d2d0c8] bg-[#FAFAF7] p-5 sm:p-6 text-xs text-[#77817C] flex flex-col sm:flex-row sm:items-center gap-4">
        <ShieldCheck className="h-6 w-6 text-[#174C40] shrink-0" />
        <div>
          <p className="font-semibold text-[#242A28]">Authorized Clinical Data Release Notice</p>
          <p className="mt-0.5 leading-relaxed">
            All medical records, diagnostic laboratory results, prescriptions, and radiology imaging reports displayed on this portal have been validated, authorized, and formally released for patient access by licensed Healix healthcare practitioners. If you require records that have not yet been released, please contact Health Information Management.
          </p>
        </div>
      </div>
    </div>
  );
}
