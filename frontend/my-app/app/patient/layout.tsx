import { Suspense } from 'react';
import PatientShell from '@/components/PatientShell';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="container-editorial py-16">
          <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 text-sm text-[#768086]">
            Loading patient portal...
          </div>
        </div>
      }
    >
      <PatientShell>{children}</PatientShell>
    </Suspense>
  );
}
