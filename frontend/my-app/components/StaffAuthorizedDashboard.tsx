'use client';

import React from 'react';
import {
  ConciergeBell,
  Stethoscope,
  HeartPulse,
  FlaskConical,
  Receipt,
  Pill,
  Users,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  ArrowRight,
  Database,
  SlidersHorizontal,
  KeyRound,
  ShieldAlert,
  ChevronRight,
  FileCheck2,
  LogOut,
  UserCheck,
  Building,
  Clock,
} from 'lucide-react';
import { STAFF_ROLES } from '@/lib/staff-roles';
import { clearStaffSession, type StaffUser } from '@/lib/staff-auth';
import ReceptionistDashboard from '@/components/receptionist/ReceptionistDashboard';
import DoctorDashboard from '@/components/doctor/DoctorDashboard';
import NurseDashboard from '@/components/nurse/NurseDashboard';

const ROLE_ICONS = {
  ConciergeBell,
  Stethoscope,
  HeartPulse,
  FlaskConical,
  Receipt,
  Pill,
  Users,
  ShieldCheck,
};

export default function StaffAuthorizedDashboard({
  staff,
  onLogout,
}: {
  staff: StaffUser;
  onLogout?: () => void;
}) {
  const roleConfig =
    STAFF_ROLES.find(
      (r) =>
        r.id === staff.role ||
        r.name.toLowerCase() === staff.roleName.toLowerCase()
    ) || STAFF_ROLES[0];

  const IconComponent = ROLE_ICONS[roleConfig.iconName];

  const handleSignOut = () => {
    clearStaffSession();
    onLogout?.();
  };

  // Reset Receptionist Dashboard UI: display clean, empty dashboard content area
  if (roleConfig.id === 'receptionist') {
    return <ReceptionistDashboard />;
  }

  // Doctor Clinical Consultation Workspace
  if (roleConfig.id === 'doctor') {
    return <DoctorDashboard doctor={staff} onLogout={onLogout} />;
  }

  // Nurse Inpatient & Ward Care Workspace
  if (roleConfig.id === 'nurse') {
    return <NurseDashboard nurse={staff} onLogout={onLogout} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Staff Profile & Session Strip */}
      <section className="rounded-3xl border-2 border-emerald-600/30 bg-white p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <span className="h-14 w-14 rounded-2xl bg-[#174C40] text-white flex items-center justify-center shrink-0 shadow-xs">
            <IconComponent className="h-7 w-7 text-emerald-300" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#242A28]">
                {staff.name}
              </h1>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#E6EFE9] text-[#174C40] border border-[#cbe0d3] font-semibold">
                {staff.roleName}
              </span>
              <span className="text-xs font-mono text-[#77817C]">
                Staff ID: <span className="font-bold text-[#242A28]">{staff.staffId}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#77817C] mt-1.5 font-light">
              <span className="inline-flex items-center gap-1">
                <Building className="h-3.5 w-3.5 text-[#174C40]" />
                {staff.department}
              </span>
              <span>&bull;</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#174C40]" />
                {staff.shift}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono text-[#174C40]">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Authorized Session</span>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-xs font-medium text-rose-700 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </section>

      {/* 2. Authorized Workspace Hero */}
      <section className="rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-10 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6EFE9] border border-[#d2e2d8] text-xs font-mono text-[#174C40]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{roleConfig.dedicated_label}</span>
          </span>
          <span className="text-xs font-mono text-[#77817C]">&bull;</span>
          <span className="text-xs font-mono text-[#77817C]">{roleConfig.category}</span>
        </div>

        <h2 className="font-editorial text-3xl font-medium text-[#242A28]">
          {roleConfig.name} Clinical &amp; Operations Workspace
        </h2>

        <p className="text-sm leading-relaxed text-[#4A5350] font-light max-w-3xl">
          {roleConfig.description} You are authenticated with zero-trust role-specific permissions
          under the HEALIX Clinical Information System.
        </p>
      </section>

      {/* 3. Role-specific Permissions Breakdown */}
      <section className="rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-10 shadow-xs space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40] block">
              Security Governance &bull; Role-Based Access Control (RBAC)
            </span>
          </div>
          <h3 className="font-editorial text-2xl font-medium text-[#242A28]">
            Your Role-specific Permissions &amp; Data Access
          </h3>
          <p className="text-xs text-[#77817C] mt-1 font-light">
            Enforced at API gateway, route middleware, and database transaction level for {staff.roleName}.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Menus */}
          <div className="rounded-2xl border border-[#E5E8E6] bg-white p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#E5E8E6]">
              <span className="h-9 w-9 rounded-lg bg-[#E6EFE9] text-[#174C40] flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </span>
              <div>
                <h4 className="font-editorial text-lg text-[#242A28] font-medium">
                  Authorized Menus
                </h4>
                <p className="text-[11px] font-mono text-[#77817C]">
                  Navigation entries mounted for your session
                </p>
              </div>
            </div>

            <ul className="space-y-2.5">
              {roleConfig.permissions.menus.map((menu, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2.5 text-xs text-[#242A28]"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#174C40] shrink-0" />
                  <span className="font-medium">{menu}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 2. Modules */}
          <div className="rounded-2xl border border-[#E5E8E6] bg-white p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#E5E8E6]">
              <span className="h-9 w-9 rounded-lg bg-[#E6EFE9] text-[#174C40] flex items-center justify-center">
                <SlidersHorizontal className="h-4 w-4" />
              </span>
              <div>
                <h4 className="font-editorial text-lg text-[#242A28] font-medium">
                  Accessible Modules
                </h4>
                <p className="text-[11px] font-mono text-[#77817C]">
                  Hospital subsystems active for this role
                </p>
              </div>
            </div>

            <ul className="space-y-2.5">
              {roleConfig.permissions.modules.map((mod, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2.5 text-xs text-[#242A28]"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#174C40] shrink-0" />
                  <span className="font-medium">{mod}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Actions */}
          <div className="rounded-2xl border border-[#E5E8E6] bg-white p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#E5E8E6]">
              <span className="h-9 w-9 rounded-lg bg-[#E6EFE9] text-[#174C40] flex items-center justify-center">
                <FileCheck2 className="h-4 w-4" />
              </span>
              <div>
                <h4 className="font-editorial text-lg text-[#242A28] font-medium">
                  Permitted Operations
                </h4>
                <p className="text-[11px] font-mono text-[#77817C]">
                  State mutations and clinical write privileges
                </p>
              </div>
            </div>

            <ul className="space-y-2.5">
              {roleConfig.permissions.actions.map((act, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2.5 text-xs text-[#242A28]"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#174C40] shrink-0" />
                  <span className="font-medium">{act}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. Data Access Boundary */}
          <div className="rounded-2xl border border-[#E5E8E6] bg-white p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#E5E8E6]">
              <span className="h-9 w-9 rounded-lg bg-[#E6EFE9] text-[#174C40] flex items-center justify-center">
                <Database className="h-4 w-4" />
              </span>
              <div>
                <h4 className="font-editorial text-lg text-[#242A28] font-medium">
                  Data Access Boundary
                </h4>
                <p className="text-[11px] font-mono text-[#77817C]">
                  Zero-trust confidentiality boundary
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-[#FAFAF7] border border-[#E5E8E6] p-4 text-xs leading-relaxed text-[#4A5350]">
              <p className="font-medium text-[#242A28] mb-1">Confidentiality Scope:</p>
              <p>{roleConfig.permissions.data_access}</p>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-[#77817C] pt-1">
              <Lock className="h-3.5 w-3.5 text-[#174C40] shrink-0" />
              <span>Session audited under Staff ID {staff.staffId}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
