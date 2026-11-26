'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import StaffLoginForm from '@/components/StaffLoginForm';

export default function StaffLoginPage() {
  const router = useRouter();

  return (
    <StaffLoginForm
      onLoginSuccess={() => {
        router.push('/staff');
      }}
    />
  );
}
