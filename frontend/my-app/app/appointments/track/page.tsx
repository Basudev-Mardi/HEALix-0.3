import type { Metadata } from 'next';
import { Suspense } from 'react';
import PageHeader from '@/components/PageHeader';
import TrackAppointmentClient from '@/components/TrackAppointmentClient';

export const metadata: Metadata = {
  title: 'Track Appointment',
  description:
    'Look up your Healix Medical Center appointment status, check-in location, or cancel online using your booking reference.',
};

export default function TrackAppointmentPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Appointment Status"
        title="Track Appointment"
        description="Enter your booking reference code or registered email address to view live appointment status, floor directions, or cancel your slot."
        breadcrumbs={[
          { label: 'Appointments', href: '/appointments/doctors' },
          { label: 'Track Appointment' },
        ]}
      />

      <section className="container-editorial py-14 lg:py-18">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 text-sm text-[#768086]">
              Loading appointment tracker...
            </div>
          }
        >
          <TrackAppointmentClient />
        </Suspense>
      </section>
    </div>
  );
}
