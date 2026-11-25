'use client';

import React from 'react';
import {
  Calendar,
  Clock,
  Download,
  FileCheck2,
  Lock,
} from 'lucide-react';
import type { LabReportItem } from '@/lib/patient-auth';
import type { AppointmentRecord } from '@/lib/types';

// 1. Patient Profile Summary Card
export interface PatientProfileSummaryProps {
  name: string;
  mrn: string;
  email: string;
  phone: string;
  bloodGroup?: string;
  emergencyContact?: string;
}

export function PatientProfileSummary({
  name,
  mrn,
  email,
  phone,
  bloodGroup = 'O Positive',
  emergencyContact = '+1 (555) 234-5678',
}: PatientProfileSummaryProps) {
  return (
    <div className="card-minimal rounded-2xl p-6 bg-white space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-[#174C40] text-white flex items-center justify-center font-heading text-lg font-bold">
          {name.charAt(0)}
        </div>
        <div>
          <h2 className="font-heading text-lg font-bold text-[#242A28]">{name}</h2>
          <p className="font-mono text-xs text-[#174C40] font-semibold">MRN: {mrn}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#E5E8E6] text-xs">
        <div>
          <span className="text-[#77817C] block">Email</span>
          <span className="font-medium text-[#242A28] truncate block">{email}</span>
        </div>
        <div>
          <span className="text-[#77817C] block">Phone</span>
          <span className="font-medium text-[#242A28] truncate block">{phone}</span>
        </div>
        <div>
          <span className="text-[#77817C] block">Blood Group</span>
          <span className="font-medium text-[#242A28]">{bloodGroup}</span>
        </div>
        <div>
          <span className="text-[#77817C] block">Emergency Line</span>
          <span className="font-medium text-[#b91c1c] truncate block">{emergencyContact}</span>
        </div>
      </div>
    </div>
  );
}

// 2. Appointment Card
export interface AppointmentCardProps {
  appointment: AppointmentRecord;
  onCancelClick?: (appointment: AppointmentRecord) => void;
}

export function AppointmentCard({ appointment, onCancelClick }: AppointmentCardProps) {
  const isCancelled = appointment.status === 'Cancelled';
  const isCompleted = appointment.status === 'Completed';

  return (
    <div className="card-minimal rounded-2xl p-5 bg-white space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-mono text-xs font-semibold text-[#174C40]">
            REF #{appointment.booking_reference || appointment.id}
          </span>
          <h3 className="font-heading text-base font-semibold text-[#242A28] mt-0.5">
            {appointment.doctor_name || appointment.doctor_slug}
          </h3>
          <p className="text-xs text-[#77817C]">{appointment.department_name || appointment.department_slug}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-mono font-medium ${
            isCancelled
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : isCompleted
              ? 'bg-zinc-100 text-zinc-700'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {appointment.status}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-[#4A5350] pt-2 border-t border-[#E5E8E6]">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-[#174C40]" />
          {appointment.appointment_date}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-[#174C40]" />
          {appointment.time_slot}
        </span>
      </div>

      {!isCancelled && !isCompleted && onCancelClick && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => onCancelClick(appointment)}
            className="text-xs text-[#b91c1c] hover:underline font-medium"
          >
            Cancel Appointment
          </button>
        </div>
      )}
    </div>
  );
}

// 3. Medical Report Card
export interface MedicalReportCardProps {
  report: LabReportItem;
  onDownloadClick?: (report: LabReportItem) => void;
}

export function MedicalReportCard({ report, onDownloadClick }: MedicalReportCardProps) {
  const isReleased = report.status === 'Released' || report.status === 'Finalized';

  return (
    <div className="card-minimal rounded-2xl p-5 bg-white space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#E6EFE9] text-[#174C40] flex items-center justify-center shrink-0">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-semibold text-[#242A28]">{report.test_name}</h3>
            <p className="text-xs text-[#77817C]">{report.category} &bull; Specimen #{report.id}</p>
          </div>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono ${
            isReleased
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
        >
          {report.status}
        </span>
      </div>

      <div className="pt-2 border-t border-[#E5E8E6] flex items-center justify-between text-xs text-[#4A5350]">
        <span>Collected: {report.collected_date}</span>
        {isReleased ? (
          <button
            type="button"
            onClick={() => onDownloadClick?.(report)}
            className="inline-flex items-center gap-1 font-medium text-[#174C40] hover:underline"
          >
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-[#77817C]">
            <Lock className="h-3.5 w-3.5" />
            Under Attestation
          </span>
        )}
      </div>
    </div>
  );
}

// 4. Dashboard Statistics Component
export interface DashboardStatItem {
  label: string;
  value: string | number;
  sublabel: string;
  icon?: React.ReactNode;
}

export function DashboardStatistics({ stats }: { stats: DashboardStatItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="card-minimal rounded-2xl p-5 bg-white space-y-1">
          <div className="flex items-center justify-between text-[#77817C]">
            <span className="text-xs font-medium uppercase tracking-wider">{s.label}</span>
            {s.icon}
          </div>
          <p className="font-heading text-2xl font-bold text-[#242A28]">{s.value}</p>
          <p className="text-[11px] text-[#77817C]">{s.sublabel}</p>
        </div>
      ))}
    </div>
  );
}
