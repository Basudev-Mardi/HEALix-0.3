'use client';

import React from 'react';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Ticket,
  CalendarCheck,
  Stethoscope,
  CreditCard,
  History,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  LogOut,
  Hospital,
  Lock,
  X,
  ExternalLink,
} from 'lucide-react';
import { clearStaffSession, type StaffUser } from '@/lib/staff-auth';
import { useRouter } from 'next/navigation';

export type ReceptionViewKey =
  | 'dashboard'
  | 'registration'
  | 'directory'
  | 'tokens'
  | 'appointments'
  | 'doctors'
  | 'billing'
  | 'history'
  | 'reports'
  | 'settings';

export interface NavItemConfig {
  key: ReceptionViewKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number | null;
  badgeColor?: string;
  requiredRole?: string[]; // If restricted to specific roles
}

interface ReceptionistSidebarProps {
  activeView: ReceptionViewKey;
  onSelectView: (view: ReceptionViewKey) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  staffUser: StaffUser | null;
  stats?: {
    waitingCount?: number;
    upcomingAppointments?: number;
    emergencyWaiting?: number;
  };
}

export default function ReceptionistSidebar({
  activeView,
  onSelectView,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  staffUser,
  stats,
}: ReceptionistSidebarProps) {
  const router = useRouter();

  // Navigation Items matching exact specification:
  // 1. Dashboard, 2. New Patient Registration, 3. Patient Directory,
  // 4. Token Management, 5. Appointments, 6. Doctor Availability,
  // 7. Billing & Payments, 8. Visit History, 9. Reports, 10. Settings
  const navItems: NavItemConfig[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      key: 'registration',
      label: 'New Patient Registration',
      icon: UserPlus,
    },
    {
      key: 'directory',
      label: 'Patient Directory',
      icon: Users,
    },
    {
      key: 'tokens',
      label: 'Token Management',
      icon: Ticket,
      badge: stats?.waitingCount && stats.waitingCount > 0 ? stats.waitingCount : null,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      key: 'appointments',
      label: 'Appointments',
      icon: CalendarCheck,
      badge:
        stats?.upcomingAppointments && stats.upcomingAppointments > 0
          ? stats.upcomingAppointments
          : null,
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      key: 'doctors',
      label: 'Doctor Availability',
      icon: Stethoscope,
    },
    {
      key: 'billing',
      label: 'Billing & Payments',
      icon: CreditCard,
    },
    {
      key: 'history',
      label: 'Visit History',
      icon: History,
    },
    {
      key: 'reports',
      label: 'Reports',
      icon: BarChart3,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  // Permission Verification
  const userRole = staffUser?.role || 'receptionist';
  const isAuthorized = userRole === 'receptionist' || userRole === 'administrator';

  const handleLogout = () => {
    clearStaffSession();
    router.push('/staff');
  };

  const handleItemClick = (key: ReceptionViewKey) => {
    onSelectView(key);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-white border-r border-[#E5E8E6] flex flex-col justify-between transition-all duration-300 select-none shadow-xs ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${
          isMobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* ==========================================================
            1. TOP BRANDING & COLLAPSE CONTROL
        ========================================================== */}
        <div className="p-4 sm:p-5 border-b border-[#F0F2F0]">
          <div className="flex items-center justify-between gap-3">
            {!isCollapsed ? (
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-10 w-10 shrink-0 rounded-2xl bg-[#174C40] text-emerald-300 flex items-center justify-center shadow-xs">
                  <Hospital className="h-5 w-5" />
                </div>
                <div className="overflow-hidden">
                  <h1 className="font-serif font-bold text-sm tracking-tight text-[#1F2421] truncate">
                    Hospital Management System
                  </h1>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#77817C] block truncate">
                    Healix Central Hospital
                  </span>
                </div>
              </div>
            ) : (
              <div className="mx-auto">
                <div className="h-10 w-10 rounded-2xl bg-[#174C40] text-emerald-300 flex items-center justify-center shadow-xs">
                  <Hospital className="h-5 w-5" />
                </div>
              </div>
            )}

            {/* Desktop Collapse / Expand Toggle Button */}
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-xl border border-[#E5E8E6] text-[#77817C] hover:text-[#1F2421] hover:bg-[#FAFAF7] transition-colors cursor-pointer shrink-0"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-xl text-[#77817C] hover:text-[#1F2421] hover:bg-[#FAFAF7] transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Section Indicator */}
          {!isCollapsed && (
            <div className="mt-4 pt-3 border-t border-[#F0F2F0] flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#174C40] bg-[#174C40]/10 px-2.5 py-0.5 rounded-md">
                SECTION: RECEPTION
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          )}
        </div>

        {/* ==========================================================
            2. NAVIGATION LIST (10 ITEMS)
        ========================================================== */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleItemClick(item.key)}
                title={isCollapsed ? item.label : undefined}
                className={`group relative w-full flex items-center rounded-2xl transition-all cursor-pointer ${
                  isCollapsed
                    ? 'justify-center p-3'
                    : 'gap-3 px-3.5 py-2.5 text-left'
                } ${
                  isActive
                    ? 'bg-[#174C40] text-white shadow-xs font-semibold'
                    : 'text-[#4A5350] hover:text-[#1F2421] hover:bg-[#F0F2F0]'
                }`}
              >
                {/* Active Indicator Bar on Left */}
                {isActive && (
                  <span className="absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-emerald-400" />
                )}

                <Icon
                  className={`shrink-0 transition-transform group-hover:scale-105 ${
                    isCollapsed ? 'h-5 w-5' : 'h-4 w-4'
                  } ${isActive ? 'text-emerald-300' : 'text-[#77817C] group-hover:text-[#1F2421]'}`}
                />

                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between overflow-hidden">
                    <span className="text-xs truncate tracking-tight">
                      {item.label}
                    </span>

                    {item.badge !== undefined && item.badge !== null && (
                      <span
                        className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                            : item.badgeColor || 'bg-zinc-100 text-zinc-700 border-zinc-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Tooltip on Collapsed Mode */}
                {isCollapsed && (
                  <div className="hidden group-hover:block absolute left-full ml-3 px-2.5 py-1.5 rounded-xl bg-[#1F2421] text-white text-xs font-medium whitespace-nowrap shadow-xl z-50 pointer-events-none">
                    {item.label}
                    {item.badge !== undefined && item.badge !== null && ` (${item.badge})`}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ==========================================================
            3. USER PERMISSIONS & STATION IDENTITY FOOTER
        ========================================================== */}
        <div className="p-3.5 border-t border-[#F0F2F0] bg-[#FAFAF7]">
          {/* Quick Doctor Consultation Link / Switcher */}
          {!isCollapsed ? (
            <div className="mb-3">
              <a
                href="/doctor"
                className="w-full flex items-center justify-between p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-900 transition-colors text-xs font-medium group"
              >
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-[#174C40]" />
                  <span>Doctor Desk (Cabin 1)</span>
                </div>
                <ExternalLink className="h-3 w-3 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          ) : (
            <div className="mb-2 flex justify-center">
              <a
                href="/doctor"
                title="Go to Doctor Consultation Desk"
                className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#174C40] transition-colors"
              >
                <Stethoscope className="h-4 w-4" />
              </a>
            </div>
          )}

          {/* Permission Badge */}
          {!isCollapsed ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-800">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="font-semibold uppercase tracking-wider">
                    {staffUser?.roleName || 'Receptionist'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#77817C]">
                  {staffUser?.staffId || 'REC-4011'}
                </span>
              </div>

              {/* Staff Details & Quick Sign Out */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E5E8E6]">
                <div className="overflow-hidden">
                  <div className="text-xs font-semibold text-[#1F2421] truncate">
                    {staffUser?.name || 'Reception Staff'}
                  </div>
                  <div className="text-[10px] text-[#77817C] truncate">
                    {staffUser?.department || 'Central OPD'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-xl text-[#77817C] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                  title="Sign Out of Reception Portal"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="h-8 w-8 rounded-full bg-[#174C40]/10 text-[#174C40] flex items-center justify-center font-bold text-xs"
                title={`${staffUser?.name || 'Staff'} (${staffUser?.roleName || 'Receptionist'})`}
              >
                {(staffUser?.name || 'R').charAt(0)}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-xl text-[#77817C] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
