import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppointmentStepper from '@/components/AppointmentStepper';
import PageHeader from '@/components/PageHeader';
import PatientDetailsClient from '@/components/PatientDetailsClient';
import { getDoctors } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Patient Details — Book Appointment',
  description:
    'Provide patient contact and clinical details to finalize your consultation at Healix Medical Center.',
};

export default async function PatientDetailsPage() {
  const doctors = await getDoctors();

  return (
    <div>
      <PageHeader
        eyebrow="Appointments · Step 03"
        title="Patient Details"
        description="Complete your contact details and optional clinical notes to reserve your appointment slot."
        breadcrumbs={[
          { label: 'Find a Doctor', href: '/appointments/doctors' },
          { label: 'Book Appointment', href: '/appointments/book' },
          { label: 'Patient Details' },
        ]}
      />
      <AppointmentStepper currentStep={3} />

      <section className="container-editorial py-14 lg:py-18">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-[#E5E8E6] bg-white p-10 text-sm text-[#77817C]">
              Loading patient intake form...
            </div>
          }
        >
          <PatientDetailsClient doctors={doctors} />
        </Suspense>
      </section>
    </div>
  );
}
