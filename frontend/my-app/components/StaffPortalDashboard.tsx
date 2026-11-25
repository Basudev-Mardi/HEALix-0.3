'use client';

import React, { useState } from 'react';
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
  Eye,
  FileCheck2,
  Table,
} from 'lucide-react';
import { STAFF_ROLES, type StaffRole } from '@/lib/staff-roles';

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

export default function StaffPortalDashboard() {
  const [selectedRoleId, setSelectedRoleId] = useState<string>('doctor');
  const [viewMode, setViewMode] = useState<'detailed' | 'matrix'>('detailed');

  const selectedRole =
    STAFF_ROLES.find((r) => r.id === selectedRoleId) || STAFF_ROLES[0];

  return (
    <div className="space-y-12">
      {/* 1. Portal Hero Header */}
      <section className="relative overflow-hidden rounded-3xl border border-[#E5E8E6] bg-white p-8 sm:p-12 shadow-xs">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6EFE9] border border-[#d2e2d8] text-xs font-mono text-[#174C40]">
            <KeyRound className="h-3.5 w-3.5" />
            <span>Authorized Clinical &amp; Administrative Personnel</span>
          </div>

          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#242A28] tracking-tight">
            Hospital Staff Portal
          </h1>

          <p className="font-heading text-base sm:text-lg text-[#174C40] font-medium flex flex-wrap items-center gap-2">
            <span>One login system</span>
            <span className="text-[#77817C]">&bull;</span>
            <span>Role-based dashboards</span>
          </p>

          <p className="text-sm leading-relaxed text-[#77817C] font-light max-w-2xl">
            Secure, centralized gateway providing role-tailored clinical, nursing, diagnostic,
            pharmacy, and administrative workspaces with granular access boundaries and audited data governance.
          </p>
        </div>

        {/* Ambient decorative motif */}
        <div className="absolute right-0 top-0 -bottom-8 w-1/3 bg-radial from-[#E6EFE9]/60 via-transparent to-transparent pointer-events-none hidden md:block" />
      </section>

      {/* 2. Staff Roles Grid (All 8 Roles) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40] block mb-1">
              Workspaces &bull; 8 Core Roles
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl text-[#242A28]">
              Select a Staff Role
            </h2>
          </div>
          <p className="text-xs font-mono text-[#77817C]">
            Click any role to inspect its granular permissions &amp; access boundaries
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STAFF_ROLES.map((role) => {
            const IconComponent = ROLE_ICONS[role.iconName];
            const isSelected = role.id === selectedRoleId;

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  setSelectedRoleId(role.id);
                  setViewMode('detailed');
                }}
                className={`text-left rounded-2xl p-6 transition-all duration-200 border flex flex-col justify-between group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#174C40] ${
                  isSelected
                    ? 'bg-white border-[#174C40] shadow-md ring-1 ring-[#174C40] -translate-y-0.5'
                    : 'bg-white border-[#E5E8E6] hover:border-[#174C40] hover:-translate-y-0.5 shadow-xs'
                }`}
              >
                {/* Active indicator bar */}
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#174C40]" />
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#174C40] text-white shadow-xs'
                          : 'bg-[#E6EFE9] text-[#174C40] group-hover:bg-[#174C40] group-hover:text-white'
                      }`}
                    >
                      <IconComponent className="h-6 w-6" />
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#FAFAF7] border border-[#E5E8E6] text-[#77817C]">
                      {role.category}
                    </span>
                  </div>

                  <h3 className="font-editorial text-xl font-medium text-[#242A28] group-hover:text-[#174C40] transition-colors">
                    {role.name}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-[#77817C] line-clamp-2 font-light">
                    {role.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E5E8E6] flex items-center justify-between">
                  {/* Dedicated Dashboard Label */}
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                      isSelected
                        ? 'bg-[#E6EFE9] border-[#c0d6c9] text-[#174C40]'
                        : 'bg-[#FAFAF7] border-[#E5E8E6] text-[#4A5350] group-hover:bg-[#E6EFE9] group-hover:text-[#174C40]'
                    }`}
                  >
                    <Sparkles className="h-3 w-3 text-[#174C40]" />
                    {role.dedicated_label}
                  </span>

                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      isSelected
                        ? 'text-[#174C40] translate-x-1'
                        : 'text-[#77817C] group-hover:text-[#174C40] group-hover:translate-x-0.5'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Role-specific Permissions Section */}
      <section className="rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-10 shadow-xs space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E5E8E6]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40] block">
                Security &bull; Role-Based Access Control (RBAC)
              </span>
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl text-[#242A28]">
              Role-specific Permissions
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-mono text-[#77817C]">
              <span className="px-2.5 py-0.5 rounded-full bg-[#E6EFE9] text-[#174C40] font-medium border border-[#cbe0d3]">
                Menus
              </span>
              <span>&bull;</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#E6EFE9] text-[#174C40] font-medium border border-[#cbe0d3]">
                Modules
              </span>
              <span>&bull;</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#E6EFE9] text-[#174C40] font-medium border border-[#cbe0d3]">
                Actions
              </span>
              <span>&bull;</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#E6EFE9] text-[#174C40] font-medium border border-[#cbe0d3]">
                Data Access
              </span>
            </div>
          </div>

          {/* Toggle Detailed vs Matrix View */}
          <div className="inline-flex rounded-xl bg-[#FAFAF7] border border-[#E5E8E6] p-1 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('detailed')}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                viewMode === 'detailed'
                  ? 'bg-white text-[#174C40] shadow-xs border border-[#E5E8E6]'
                  : 'text-[#77817C] hover:text-[#242A28]'
              }`}
            >
              Role Deep Dive
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                viewMode === 'matrix'
                  ? 'bg-white text-[#174C40] shadow-xs border border-[#E5E8E6]'
                  : 'text-[#77817C] hover:text-[#242A28]'
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              Full 8-Role Matrix
            </button>
          </div>
        </div>

        {viewMode === 'detailed' ? (
          <div className="space-y-8">
            {/* Active Role Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {STAFF_ROLES.map((role) => {
                const isSelected = role.id === selectedRoleId;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#174C40] text-white shadow-xs'
                        : 'bg-[#FAFAF7] border border-[#E5E8E6] text-[#4A5350] hover:border-[#174C40] hover:text-[#174C40]'
                    }`}
                  >
                    {role.name}
                  </button>
                );
              })}
            </div>

            {/* Role Header Banner */}
            <div className="rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="h-12 w-12 rounded-xl bg-[#174C40] text-white flex items-center justify-center shrink-0">
                  {React.createElement(ROLE_ICONS[selectedRole.iconName], {
                    className: 'h-6 w-6',
                  })}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-editorial text-2xl font-medium text-[#242A28]">
                      {selectedRole.name}
                    </h3>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#E6EFE9] text-[#174C40] border border-[#cbe0d3]">
                      {selectedRole.dedicated_label}
                    </span>
                  </div>
                  <p className="text-xs text-[#77817C] mt-1 font-light">
                    {selectedRole.description}
                  </p>
                </div>
              </div>

              <div className="text-left md:text-right shrink-0">
                <span className="text-[11px] font-mono text-[#77817C] uppercase block">
                  Institutional Scope
                </span>
                <span className="text-xs font-semibold text-[#174C40]">
                  {selectedRole.category}
                </span>
              </div>
            </div>

            {/* 4 Permission Pillars: Menus • Modules • Actions • Data Access */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Menus */}
              <div className="rounded-2xl border border-[#E5E8E6] bg-white p-6 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-[#E5E8E6]">
                  <span className="h-9 w-9 rounded-lg bg-[#E6EFE9] text-[#174C40] flex items-center justify-center">
                    <Layers className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="font-editorial text-lg text-[#242A28] font-medium">
                      Navigation Menus
                    </h4>
                    <p className="text-[11px] font-mono text-[#77817C]">
                      Top &amp; sidebar navigation options visible in session
                    </p>
                  </div>
                </div>

                <ul className="space-y-2.5">
                  {selectedRole.permissions.menus.map((menu, idx) => (
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
                      Core hospital subsystems mounted for this role
                    </p>
                  </div>
                </div>

                <ul className="space-y-2.5">
                  {selectedRole.permissions.modules.map((mod, idx) => (
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
                      Permitted Actions
                    </h4>
                    <p className="text-[11px] font-mono text-[#77817C]">
                      Operational capabilities and state mutations allowed
                    </p>
                  </div>
                </div>

                <ul className="space-y-2.5">
                  {selectedRole.permissions.actions.map((act, idx) => (
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

              {/* 4. Data Access */}
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
                      Confidentiality boundary &amp; zero-trust scope
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-[#FAFAF7] border border-[#E5E8E6] p-4 text-xs leading-relaxed text-[#4A5350]">
                  <p className="font-medium text-[#242A28] mb-1">Scope Policy:</p>
                  <p>{selectedRole.permissions.data_access}</p>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-[#77817C] pt-1">
                  <Lock className="h-3.5 w-3.5 text-[#174C40] shrink-0" />
                  <span>Enforced at database query and Express API middleware level</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Full 8-Role Matrix Table */
          <div className="overflow-x-auto rounded-2xl border border-[#E5E8E6]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAFAF7] border-b border-[#E5E8E6] text-[#77817C] font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 font-semibold text-[#242A28]">Role</th>
                  <th className="py-3.5 px-4 font-semibold text-[#242A28]">Menus</th>
                  <th className="py-3.5 px-4 font-semibold text-[#242A28]">Modules</th>
                  <th className="py-3.5 px-4 font-semibold text-[#242A28]">Actions</th>
                  <th className="py-3.5 px-4 font-semibold text-[#242A28]">Data Access Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E8E6] bg-white">
                {STAFF_ROLES.map((role) => (
                  <tr
                    key={role.id}
                    className="hover:bg-[#FAFAF7]/80 transition-colors"
                  >
                    <td className="py-4 px-4 font-medium text-[#242A28] align-top whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="h-7 w-7 rounded-lg bg-[#E6EFE9] text-[#174C40] flex items-center justify-center shrink-0">
                          {React.createElement(ROLE_ICONS[role.iconName], {
                            className: 'h-3.5 w-3.5',
                          })}
                        </span>
                        <div>
                          <p className="font-semibold">{role.name}</p>
                          <p className="text-[10px] text-[#77817C] font-mono">
                            {role.dedicated_label}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[#4A5350] align-top">
                      <ul className="space-y-1">
                        {role.permissions.menus.slice(0, 3).map((m, i) => (
                          <li key={i} className="truncate max-w-[180px]">&bull; {m}</li>
                        ))}
                        {role.permissions.menus.length > 3 && (
                          <li className="text-[10px] text-[#77817C] font-mono">
                            +{role.permissions.menus.length - 3} more
                          </li>
                        )}
                      </ul>
                    </td>
                    <td className="py-4 px-4 text-[#4A5350] align-top">
                      <ul className="space-y-1">
                        {role.permissions.modules.slice(0, 3).map((m, i) => (
                          <li key={i} className="truncate max-w-[180px]">&bull; {m}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="py-4 px-4 text-[#4A5350] align-top">
                      <ul className="space-y-1">
                        {role.permissions.actions.slice(0, 3).map((a, i) => (
                          <li key={i} className="truncate max-w-[200px]">&bull; {a}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="py-4 px-4 text-[#4A5350] align-top max-w-xs text-[11px] leading-relaxed">
                      {role.permissions.data_access}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 4. Architecture & Security Standards Note */}
      <section className="rounded-2xl border border-[#E5E8E6] bg-[#FAFAF7] p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-[0.14em] text-[#174C40]">
          <ShieldAlert className="h-4 w-4" />
          <span>Role-Based Access Control Architecture</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[#4A5350] leading-relaxed">
          <div className="space-y-1.5">
            <h4 className="font-semibold text-[#242A28]">Unified Authentication Gateway</h4>
            <p className="font-light">
              Single sign-on entry point with Argon2id cryptographic password hashing, role token exchange, and automatic session revocation upon role de-provisioning.
            </p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-semibold text-[#242A28]">Granular Zero-Trust Scopes</h4>
            <p className="font-light">
              Every staff request requires route authorization, departmental tenant verification, and data-level ownership checks enforced at the Express API layer.
            </p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-semibold text-[#242A28]">Regulatory Audit Compliance</h4>
            <p className="font-light">
              All staff actions, clinical note entries, drug dispensations, and billing adjustments generate immutable audit logs with timestamp, user ID, and IP address.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
