import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppointmentStepper from '@/components/AppointmentStepper';
import BookAppointmentClient from '@/components/BookAppointmentClient';
import PageHeader from '@/components/PageHeader';
import { getDepartments, getDoctors } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Book Appointment',
  description:
    'Select your Healix specialist, consultation format, date, and real-time available time slot.',
};

export default async function BookAppointmentPage() {
  const [doctors, departments] = await Promise.all([getDoctors(), getDepartments()]);

  return (
    <div>
      <PageHeader
        eyebrow="Appointments · Step 02"
        title="Book Appointment"
        description="Choose your preferred visit format, date, and available consultation time."
        breadcrumbs={[
          { label: 'Find a Doctor', href: '/appointments/doctors' },
          { label: 'Book Appointment' },
        ]}
      />
      <AppointmentStepper currentStep={2} />

      <section className="container-editorial py-14 lg:py-18">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 text-sm text-[#768086]">
              Loading live appointment schedule...
            </div>
          }
        >
          <BookAppointmentClient doctors={doctors} departments={departments} />
        </Suspense>
      </section>
    </div>
  );
}
