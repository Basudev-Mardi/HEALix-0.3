import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppointmentStepper from '@/components/AppointmentStepper';
import ConfirmationClient from '@/components/ConfirmationClient';
import PageHeader from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Booking Confirmation',
  description: 'Your Healix Medical Center appointment booking confirmation and check-in summary.',
};

export default function BookingConfirmationPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Appointments · Step 04"
        title="Booking Confirmation"
        description="Your consultation has been recorded. Keep your booking reference handy for check-in or status tracking."
        breadcrumbs={[
          { label: 'Appointments', href: '/appointments/doctors' },
          { label: 'Confirmation' },
        ]}
      />
      <AppointmentStepper currentStep={4} />

      <section className="container-editorial py-14 lg:py-18">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 text-sm text-[#768086]">
              Loading confirmation pass...
            </div>
          }
        >
          <ConfirmationClient />
        </Suspense>
      </section>
    </div>
  );
}
