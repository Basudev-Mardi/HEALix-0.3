'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getStaffSession, type StaffUser } from '@/lib/staff-auth';
import StaffLoginForm from '@/components/StaffLoginForm';
import StaffAuthorizedDashboard from '@/components/StaffAuthorizedDashboard';
import ReceptionistDashboard from '@/components/receptionist/ReceptionistDashboard';
import DoctorDashboard from '@/components/doctor/DoctorDashboard';
import SignOutConfirmModal from '@/components/SignOutConfirmModal';
import { useStaffSignOutGuard } from '@/hooks/useStaffSignOutGuard';

const VALID_ROLES = [
  'receptionist',
  'doctor',
  'nurse',
  'lab-staff',
  'pharmacist',
  'hr-staff',
  'administrator',
  'billing-staff',
];

interface RolePageProps {
  params: Promise<{ role: string }>;
}

export default function DynamicStaffRolePage({ params }: RolePageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const rawRole = (resolvedParams?.role || '').toLowerCase();
  const role = VALID_ROLES.includes(rawRole) ? rawRole : 'receptionist';

  const [currentStaff, setCurrentStaff] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Hook to handle Browser Back button confirmation
  const { showConfirmDialog, handleCancel, handleConfirmSignOut } = useStaffSignOutGuard({
    enabled: true,
    onConfirmSignOut: () => {
      setCurrentStaff(null);
      router.push('/staff');
    },
  });

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
          <span>Verifying {role} session &amp; permissions...</span>
        </div>
      </div>
    );
  }

  // If user is authenticated AND their session matches (or is administrator)
  if (currentStaff) {
    const isMatchingRole =
      currentStaff.role === role ||
      currentStaff.role === 'administrator';

    if (isMatchingRole) {
      if (role === 'receptionist') {
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

      if (role === 'doctor') {
        return (
          <>
            <DoctorDashboard
              doctor={currentStaff}
              onLogout={() => {
                setCurrentStaff(null);
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

      // Other staff roles (Nurse, Lab Staff, Pharmacist, HR, Administrator, Billing)
      return (
        <div className="container-editorial py-8 sm:py-12">
          <StaffAuthorizedDashboard
            staff={currentStaff}
            onLogout={() => {
              setCurrentStaff(null);
              router.push('/staff');
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
  }

  // If NOT authenticated (or authenticated with a different role):
  // Display the Role-specific authentication/login flow for this exact role!
  return (
    <div className="container-editorial py-8 sm:py-12">
      <StaffLoginForm
        initialRole={role}
        onRoleChange={(newRole) => {
          router.push(`/staff/${newRole}`);
        }}
        onLoginSuccess={(staff) => {
          setCurrentStaff(staff);
          // If logged into this role, remain on /staff/[role]
          if (staff.role !== role) {
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
