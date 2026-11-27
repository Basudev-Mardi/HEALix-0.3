'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStaffSession, type StaffUser } from '@/lib/staff-auth';
import ReceptionistDashboard from '@/components/receptionist/ReceptionistDashboard';

export default function ReceptionTopLevelPage() {
  const router = useRouter();
  const [authorizedStaff, setAuthorizedStaff] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const session = getStaffSession();
    if (!session) {
      router.push('/staff');
      return;
    }

    if (session.role !== 'receptionist' && session.role !== 'administrator' && session.role !== 'doctor') {
      router.push('/staff');
      return;
    }

    setAuthorizedStaff(session);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-xs font-mono text-[#77817C] animate-pulse">
          Verifying Receptionist Authorization...
        </div>
      </div>
    );
  }

  return <ReceptionistDashboard />;
}
