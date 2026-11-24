'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Bell,
  CalendarDays,
  CreditCard,
  FileHeart,
  FlaskConical,
  LayoutDashboard,
  Lock,
  LogOut,
  Pill,
  ScanLine,
  Settings,
  UserRound,
} from 'lucide-react';
import {
  clearAuthSession,
  getAuthToken,
  getStoredPatient,
  patientApiFetch,
  saveAuthSession,
  type PatientUser,
} from '@/lib/patient-auth';

const PORTAL_NAV = [
  { href: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/patient/profile', label: 'My Profile', icon: UserRound },
  { href: '/patient/appointments', label: 'My Appointments', icon: CalendarDays },
  { href: '/patient/medical-history', label: 'Medical History', icon: FileHeart },
  { href: '/patient/prescriptions', label: 'Prescriptions', icon: Pill },
  { href: '/patient/lab-reports', label: 'Laboratory Reports', icon: FlaskConical },
  { href: '/patient/radiology-reports', label: 'Radiology Reports', icon: ScanLine },
  { href: '/patient/billing', label: 'Billing History', icon: CreditCard },
  { href: '/patient/notifications', label: 'Notifications', icon: Bell },
  { href: '/patient/settings', label: 'Account Settings', icon: Settings },
];

export default function PatientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [patient, setPatient] = useState<PatientUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    const token = getAuthToken();
    const cached = getStoredPatient();

    if (!token) {
      setPatient(null);
      setChecking(false);
      return;
    }

    if (cached) setPatient(cached);

    patientApiFetch<{ patient: PatientUser }>('/auth/me').then((res) => {
      if (!active) return;
      if (res.data?.patient) {
        setPatient(res.data.patient);
        saveAuthSession(token, res.data.patient);
      } else if (res.status === 401) {
        setPatient(null);
      }
      setChecking(false);
    });

    return () => {
      active = false;
    };
  }, [pathname]);

  async function handleLogout() {
    await patientApiFetch('/auth/logout', { method: 'POST' });
    clearAuthSession();
    setPatient(null);
    router.push('/login');
  }

  if (checking) {
    return (
      <div className="container-editorial py-20">
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 text-sm text-[#768086]">
          Verifying your patient session...
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container-editorial py-20">
        <div className="max-w-lg mx-auto rounded-2xl border border-[#e6e4dd] bg-white p-10 text-center space-y-5">
          <span className="h-12 w-12 rounded-full bg-[#edf5f4] text-[#0f5c5c] mx-auto flex items-center justify-center">
            <Lock className="h-5 w-5" />
          </span>
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c]">
              Patient Portal
            </p>
            <h1 className="font-editorial text-3xl text-[#14181a]">Sign in to access your records</h1>
            <p className="text-sm text-[#4b555b]">
              View appointments, lab &amp; radiology reports, prescriptions, and billing statements
              in your private Healix account.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href={`/login?next=${encodeURIComponent(pathname)}`}
              className="px-6 py-3 rounded-full bg-[#14181a] text-white text-xs font-medium hover:bg-[#0f5c5c] transition-colors"
            >
              Patient Sign In
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 rounded-full border border-[#d5d2c9] text-xs font-medium text-[#14181a] hover:border-[#14181a] transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-editorial py-10 lg:py-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar */}
        <aside className="lg:col-span-3 lg:sticky lg:top-32 space-y-4">
          <div className="rounded-2xl border border-[#e6e4dd] bg-white p-5 space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#0f5c5c]">
              {patient.mrn}
            </p>
            <p className="text-base font-semibold text-[#14181a] truncate">{patient.full_name}</p>
            <p className="text-xs text-[#768086] truncate">{patient.email}</p>
          </div>

          <nav
            aria-label="Patient portal navigation"
            className="rounded-2xl border border-[#e6e4dd] bg-white p-2 space-y-0.5"
          >
            {PORTAL_NAV.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== '/patient/dashboard' && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                    active
                      ? 'bg-[#edf5f4] text-[#0f5c5c] font-medium'
                      : 'text-[#4b555b] hover:bg-[#faf9f6] hover:text-[#14181a]'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-2 mt-2 border-t border-[#e6e4dd]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-[#b91c1c] hover:bg-[#fef2f2] transition-colors"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-9 min-w-0">{children}</div>
      </div>
    </div>
  );
}

