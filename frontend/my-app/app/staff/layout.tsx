import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, KeyRound } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Hospital Staff Portal — One Login System • Role-Based Dashboards',
  description:
    'Dedicated staff portal for Receptionists, Doctors, Nurses, Lab Staff, Billing Staff, Pharmacists, HR, and Administrators.',
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Staff Portal Operational Header Strip */}
      <div className="bg-[#174C40] text-white border-b border-[#0f352c] text-xs">
        <div className="container-editorial h-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-emerald-200">
              <KeyRound className="h-3.5 w-3.5" />
              HEALIX STAFF NETWORK
            </span>
            <span className="hidden sm:inline text-emerald-600/70">|</span>
            <span className="hidden sm:inline text-white/80 font-light text-xs">
              Secure Clinical &amp; Operational Gateway
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-emerald-200 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              HMIS Online
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-white/80 hover:text-white transition-colors font-medium"
            >
              <ArrowLeft className="h-3 w-3" />
              Public Portal
            </Link>
          </div>
        </div>
      </div>

      <div className="container-editorial py-8 sm:py-12">
        {children}
      </div>
    </div>
  );
}
