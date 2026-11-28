'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStaffSession, type StaffUser } from '@/lib/staff-auth';
import BillingStaffDashboard from '@/components/billing/BillingStaffDashboard';

export default function BillingTopLevelPage() {
  const router = useRouter();
  const [authorizedStaff, setAuthorizedStaff] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const session = getStaffSession();
    if (!session) {
      router.push('/staff/billing-staff');
      return;
    }

    if (session.role !== 'billing-staff' && session.role !== 'administrator') {
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
          <span>Verifying Billing & Revenue Authorization...</span>
        </div>
      </div>
    );
  }

  return (
    <BillingStaffDashboard
      billingStaff={authorizedStaff}
      onLogout={() => {
        router.push('/staff');
      }}
    />
  );
}
