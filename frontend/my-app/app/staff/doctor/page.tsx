'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStaffSession, type StaffUser } from '@/lib/staff-auth';
import DoctorDashboard from '@/components/doctor/DoctorDashboard';
import StaffLoginForm from '@/components/StaffLoginForm';
import SignOutConfirmModal from '@/components/SignOutConfirmModal';
import { useStaffSignOutGuard } from '@/hooks/useStaffSignOutGuard';

export default function DoctorPage() {
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
    if (session && (session.role === 'doctor' || session.role === 'administrator')) {
      setAuthorizedStaff(session);
    } else {
      setAuthorizedStaff(null);
    }
    setLoading(false);

    const handleAuthChange = (e: Event) => {
      const custom = e as CustomEvent<StaffUser | null>;
      if (custom.detail && (custom.detail.role === 'doctor' || custom.detail.role === 'administrator')) {
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
        <div className="text-xs font-mono text-[#77817C] animate-pulse flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#174C40] animate-ping" />
          <span>Verifying Physician Clinical Authorization...</span>
        </div>
      </div>
    );
  }

  // If authenticated as Doctor: Show Doctor Consultation & EHR Desk
  if (authorizedStaff) {
    return (
      <>
        <DoctorDashboard
          doctor={authorizedStaff}
          onLogout={() => {
            setAuthorizedStaff(null);
            router.push('/staff');
          }}
        />
        <SignOutConfirmModal
          isOpen={showConfirmDialog}
          onCancel={handleCancel}
          onConfirm={handleConfirmSignOut}
        />
      </>
    );
  }

  // If not authenticated: Show Doctor-specific authentication flow
  return (
    <div className="container-editorial py-8 sm:py-12">
      <StaffLoginForm
        initialRole="doctor"
        onRoleChange={(newRole) => {
          router.push(`/staff/${newRole}`);
        }}
        onLoginSuccess={(staff) => {
          setAuthorizedStaff(staff);
          if (staff.role !== 'doctor') {
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
