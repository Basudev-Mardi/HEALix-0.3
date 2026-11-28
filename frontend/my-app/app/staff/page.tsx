'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStaffSession, type StaffUser } from '@/lib/staff-auth';
import StaffLoginForm from '@/components/StaffLoginForm';
import StaffAuthorizedDashboard from '@/components/StaffAuthorizedDashboard';

export default function StaffPage() {
  const router = useRouter();
  const [currentStaff, setCurrentStaff] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const session = getStaffSession();
    setCurrentStaff(session);
    setLoading(false);

    const handleAuthChange = (e: Event) => {
      const custom = e as CustomEvent<StaffUser | null>;
      setCurrentStaff(custom.detail);
    };

    window.addEventListener('healix_staff_auth_changed', handleAuthChange);
    return () => {
      window.removeEventListener('healix_staff_auth_changed', handleAuthChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs font-mono text-[#77817C] animate-pulse">
          <span className="h-2 w-2 rounded-full bg-[#174C40] animate-ping" />
          <span>Initializing HEALIX Staff Portal...</span>
        </div>
      </div>
    );
  }

  // If NOT authenticated: Show ONLY the centered HEALIX Staff Login Portal interface
  // When a user selects a role, dynamically update URL to /staff/[role]
  if (!currentStaff) {
    return (
      <div className="container-editorial py-8 sm:py-12">
        <StaffLoginForm
          onRoleChange={(role) => {
            router.push(`/staff/${role}`);
          }}
          onLoginSuccess={(staff) => {
            setCurrentStaff(staff);
            router.push(`/staff/${staff.role}`);
          }}
        />
      </div>
    );
  }

  // If authenticated: Show authorized role-specific dashboard
  return (
    <div className="container-editorial py-8 sm:py-12">
      <StaffAuthorizedDashboard
        staff={currentStaff}
        onLogout={() => {
          setCurrentStaff(null);
        }}
      />
    </div>
  );
}
