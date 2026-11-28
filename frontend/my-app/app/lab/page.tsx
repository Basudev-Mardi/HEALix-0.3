'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStaffSession, type StaffUser } from '@/lib/staff-auth';
import LabStaffDashboard from '@/components/lab/LabStaffDashboard';

export default function LabTopLevelPage() {
  const router = useRouter();
  const [authorizedStaff, setAuthorizedStaff] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const session = getStaffSession();
    if (!session) {
      router.push('/staff/lab-staff');
      return;
    }

    if (session.role !== 'lab-staff' && session.role !== 'administrator') {
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
          <span>Verifying Laboratory Clinical Authorization...</span>
        </div>
      </div>
    );
  }

  return (
    <LabStaffDashboard
      labStaff={authorizedStaff}
      onLogout={() => {
        router.push('/staff');
      }}
    />
  );
}
