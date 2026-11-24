import type { Metadata } from 'next';
import AppointmentDoctorFinder from '@/components/AppointmentDoctorFinder';
import AppointmentStepper from '@/components/AppointmentStepper';
import PageHeader from '@/components/PageHeader';
import { getDepartments, getDoctors } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Find a Doctor — Appointments',
  description:
    'Search and select a board-certified Healix specialist to schedule an in-person or video consultation.',
};

export default async function FindDoctorForAppointmentPage() {
  const [doctors, departments] = await Promise.all([getDoctors(), getDepartments()]);

  return (
    <div>
      <PageHeader
        eyebrow="Appointments · Step 01"
        title="Find a Doctor"
        description="Choose a specialist by department, subspecialty, or language to view real-time consultation availability."
        breadcrumbs={[
          { label: 'Appointments' },
          { label: 'Find a Doctor' },
        ]}
      />
      <AppointmentStepper currentStep={1} />

      <section className="container-editorial py-14 lg:py-18">
        <AppointmentDoctorFinder doctors={doctors} departments={departments} />
      </section>
    </div>
  );
}
