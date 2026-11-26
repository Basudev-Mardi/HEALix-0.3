import type { Metadata } from 'next';
import StaffTopBar from '@/components/StaffTopBar';

export const metadata: Metadata = {
  title: 'Hospital Staff Portal — One Login System • Role-Based Dashboards',
  description:
    'Dedicated staff portal for Receptionists, Doctors, Nurses, Lab Staff, Billing Staff, Pharmacists, HR, and Administrators.',
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Staff Portal Operational Header Strip */}
      <StaffTopBar />

      <div className="container-editorial py-8 sm:py-12">
        {children}
      </div>
    </div>
  );
}
