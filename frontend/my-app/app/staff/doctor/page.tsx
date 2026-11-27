'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStaffSession, type StaffUser } from '@/lib/staff-auth';
import DoctorDashboard from '@/components/doctor/DoctorDashboard';

export default function DoctorPage() {
  const router = useRouter();
  const [authorizedStaff, setAuthorizedStaff] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const session = getStaffSession();
    if (!session) {
      router.push('/staff');
      return;
    }

    if (session.role !== 'doctor') {
      router.push('/staff');
      return;
    }

    setAuthorizedStaff(session);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-xs font-mono text-[#77817C] animate-pulse flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#174C40] animate-ping" />
          <span>Verifying Physician Clinical Authorization...</span>
        </div>
      </div>
    );
  }

  return (
    <DoctorDashboard
      doctor={authorizedStaff}
      onLogout={() => {
        router.push('/staff');
      }}
    />
  );
}
