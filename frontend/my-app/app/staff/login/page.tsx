'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import StaffLoginForm from '@/components/StaffLoginForm';

export default function StaffLoginPage() {
  const router = useRouter();

  return (
    <div className="container-editorial py-8 sm:py-12">
      <StaffLoginForm
        onLoginSuccess={() => {
          router.push('/staff');
        }}
      />
    </div>
  );
}
