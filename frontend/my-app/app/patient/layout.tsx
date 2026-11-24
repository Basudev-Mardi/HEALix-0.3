import { Suspense } from 'react';
import PatientShell from '@/components/PatientShell';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="container-editorial py-16">
          <div className="rounded-2xl border border-[#E5E8E6] bg-white p-10 text-sm text-[#77817C]">
            Loading patient portal...
          </div>
        </div>
      }
    >
      <PatientShell>{children}</PatientShell>
    </Suspense>
  );
}
