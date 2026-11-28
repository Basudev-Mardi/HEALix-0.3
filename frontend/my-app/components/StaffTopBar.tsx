'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, KeyRound, LogOut, UserCheck } from 'lucide-react';
import { clearStaffSession, getStaffSession, type StaffUser } from '@/lib/staff-auth';

export default function StaffTopBar() {
  const pathname = usePathname();
  const [currentStaff, setCurrentStaff] = useState<StaffUser | null>(null);

  useEffect(() => {
    setCurrentStaff(getStaffSession());
    const handleAuthChange = (e: Event) => {
      const custom = e as CustomEvent<StaffUser | null>;
      setCurrentStaff(custom.detail);
    };

    window.addEventListener('healix_staff_auth_changed', handleAuthChange);
    return () => {
      window.removeEventListener('healix_staff_auth_changed', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    clearStaffSession();
    setCurrentStaff(null);
  };

  // Remove top bar for dedicated full-workspace dashboards (Receptionist, Doctor & Nurse)
  if (
    pathname.startsWith('/staff/receptionist') ||
    pathname.startsWith('/staff/doctor') ||
    pathname.startsWith('/staff/nurse') ||
    pathname.startsWith('/staff/lab-staff') ||
    pathname.startsWith('/staff/pharmacist') ||
    pathname.startsWith('/staff/billing-staff') ||
    pathname === '/doctor' ||
    pathname.startsWith('/doctor/') ||
    pathname === '/reception' ||
    pathname.startsWith('/reception/') ||
    pathname === '/nurse' ||
    pathname.startsWith('/nurse/') ||
    pathname === '/lab' ||
    pathname.startsWith('/lab/') ||
    pathname === '/pharmacy' ||
    pathname.startsWith('/pharmacy/') ||
    pathname === '/billing' ||
    pathname.startsWith('/billing/')
  ) {
    return null;
  }

  return (
    <div className="bg-[#174C40] text-white border-b border-[#0f352c] text-xs">
      <div className="container-editorial h-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/staff"
            className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-emerald-200 hover:text-white transition-colors"
          >
            <KeyRound className="h-3.5 w-3.5" />
            HEALIX STAFF NETWORK
          </Link>
          <span className="hidden sm:inline text-emerald-600/70">|</span>
          <span className="hidden sm:inline text-white/80 font-light text-xs">
            Secure Clinical &amp; Operational Gateway
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 text-[11px]">
          {currentStaff ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-emerald-200 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden md:inline">{currentStaff.name} ({currentStaff.roleName})</span>
                <span className="md:hidden">{currentStaff.roleName}</span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-white/70 hover:text-rose-300 ml-1 inline-flex items-center gap-1"
                title="Sign Out"
              >
                <LogOut className="h-3 w-3" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/staff/login"
              className="inline-flex items-center gap-1 text-emerald-300 hover:text-white font-medium"
            >
              <KeyRound className="h-3 w-3" />
              <span>Staff Login</span>
            </Link>
          )}

          <span className="text-emerald-700">|</span>

          <Link
            href="/"
            className="inline-flex items-center gap-1 text-white/80 hover:text-white transition-colors font-medium"
          >
            <ArrowLeft className="h-3 w-3" />
            <span className="hidden sm:inline">Public Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
