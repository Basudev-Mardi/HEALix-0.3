'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStaffSession, type StaffUser } from '@/lib/staff-auth';
import PharmacistDashboard from '@/components/pharmacy/PharmacistDashboard';
import StaffLoginForm from '@/components/StaffLoginForm';
import SignOutConfirmModal from '@/components/SignOutConfirmModal';
import { useStaffSignOutGuard } from '@/hooks/useStaffSignOutGuard';

export default function PharmacistStaffPage() {
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
    if (session && (session.role === 'pharmacist' || session.role === 'administrator')) {
      setAuthorizedStaff(session);
    } else {
      setAuthorizedStaff(null);
    }
    setLoading(false);

    const handleAuthChange = (e: Event) => {
      const custom = e as CustomEvent<StaffUser | null>;
      if (custom.detail && (custom.detail.role === 'pharmacist' || custom.detail.role === 'administrator')) {
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
          <span>Verifying Pharmacy Clinical Authorization...</span>
        </div>
      </div>
    );
  }

  // If authenticated as Pharmacist: Show Pharmacist Dispensary Workspace
  if (authorizedStaff) {
    return (
      <main className="container-editorial py-6">
        <PharmacistDashboard
          pharmacist={authorizedStaff}
          onLogout={() => {
            setAuthorizedStaff(null);
            router.push('/staff');
          }}
        />

        {/* Sign-Out Confirmation Modal for Browser Back button */}
        <SignOutConfirmModal
          isOpen={showConfirmDialog}
          onCancel={handleCancel}
          onConfirm={handleConfirmSignOut}
        />
      </main>
    );
  }

  // Not authenticated: Display Pharmacist specific Login / Sign Up Flow
  return (
    <main className="container-editorial py-8 sm:py-12">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-emerald-100 text-[#174C40] border border-emerald-300">
            Pharmacy Dispensary Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#1F2421]">
            Pharmacist Staff Authentication
          </h1>
          <p className="text-xs text-[#77817C] font-mono">
            Verify electronic prescriptions, fulfill patient drug orders, and manage stock batches.
          </p>
        </div>

        <StaffLoginForm
          initialRole="pharmacist"
          onRoleChange={(newRole) => {
            router.push(`/staff/${newRole}`);
          }}
          onLoginSuccess={(staff) => {
            setAuthorizedStaff(staff);
            if (staff.role !== 'pharmacist') {
              router.push(`/staff/${staff.role}`);
            }
          }}
        />
      </div>

      {/* Sign-Out Confirmation Modal */}
      <SignOutConfirmModal
        isOpen={showConfirmDialog}
        onCancel={handleCancel}
        onConfirm={handleConfirmSignOut}
      />
    </main>
  );
}
