'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStaffSession, type StaffUser } from '@/lib/staff-auth';
import NurseDashboard from '@/components/nurse/NurseDashboard';

export default function NurseTopLevelPage() {
  const router = useRouter();
  const [authorizedStaff, setAuthorizedStaff] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const session = getStaffSession();
    if (!session) {
      router.push('/staff/nurse');
      return;
    }

    if (session.role !== 'nurse' && session.role !== 'administrator') {
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
          <span>Verifying Nursing Clinical Authorization...</span>
        </div>
      </div>
    );
  }

  return (
    <NurseDashboard
      nurse={authorizedStaff}
      onLogout={() => {
        router.push('/staff');
      }}
    />
  );
}
