'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStaffSession, type StaffUser } from '@/lib/staff-auth';
import ReceptionistDashboard from '@/components/receptionist/ReceptionistDashboard';
import StaffLoginForm from '@/components/StaffLoginForm';
import SignOutConfirmModal from '@/components/SignOutConfirmModal';
import { useStaffSignOutGuard } from '@/hooks/useStaffSignOutGuard';

export default function ReceptionistPage() {
  const router = useRouter();
  const [authorizedStaff, setAuthorizedStaff] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Hook to handle Browser Back button confirmation
  const { showConfirmDialog, handleCancel, handleConfirmSignOut } = useStaffSignOutGuard({
    enabled: true,
    onConfirmSignOut: () => {
      setAuthorizedStaff(null);
      router.push('/staff');
    },
  });

  useEffect(() => {
    const session = getStaffSession();
    if (session && (session.role === 'receptionist' || session.role === 'administrator')) {
      setAuthorizedStaff(session);
    } else {
      setAuthorizedStaff(null);
    }
    setLoading(false);

    const handleAuthChange = (e: Event) => {
      const custom = e as CustomEvent<StaffUser | null>;
      if (custom.detail && (custom.detail.role === 'receptionist' || custom.detail.role === 'administrator')) {
        setAuthorizedStaff(custom.detail);
      } else {
        setAuthorizedStaff(null);
      }
    };

    window.addEventListener('healix_staff_auth_changed', handleAuthChange);
    return () => {
      window.removeEventListener('healix_staff_auth_changed', handleAuthChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-xs font-mono text-[#77817C] animate-pulse">
          Verifying Receptionist Authorization...
        </div>
      </div>
    );
  }

  // If authenticated as Receptionist: Show Receptionist Operations & Queue Dashboard
  if (authorizedStaff) {
    return (
      <>
        <ReceptionistDashboard />
        <SignOutConfirmModal
          isOpen={showConfirmDialog}
          onCancel={handleCancel}
          onConfirm={handleConfirmSignOut}
        />
      </>
    );
  }

  // If not authenticated: Show Receptionist-specific authentication flow
  return (
    <div className="container-editorial py-8 sm:py-12">
      <StaffLoginForm
        initialRole="receptionist"
        onRoleChange={(newRole) => {
          router.push(`/staff/${newRole}`);
        }}
        onLoginSuccess={(staff) => {
          setAuthorizedStaff(staff);
          if (staff.role !== 'receptionist') {
            router.push(`/staff/${staff.role}`);
          }
        }}
      />
      <SignOutConfirmModal
        isOpen={showConfirmDialog}
        onCancel={handleCancel}
        onConfirm={handleConfirmSignOut}
      />
    </div>
  );
}
