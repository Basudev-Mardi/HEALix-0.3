import type { Metadata } from 'next';
import DepartmentsDirectoryClient from '@/components/DepartmentsDirectoryClient';
import PageHeader from '@/components/PageHeader';
import { getDepartments } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Clinical Departments & Institutes | Healix Hospital',
  description:
    'Explore specialized clinical departments and centers of excellence across Healix Medical Center.',
};

export default async function DepartmentsPage() {
  const departments = await getDepartments();

  return (
    <div>
      <PageHeader
        eyebrow="Clinical Divisions"
        title="Departments & Centers of Excellence"
        description="Multidisciplinary clinical institutes organized around rapid diagnosis, sub-specialty collaboration, and seamless inpatient-to-recovery continuity."
        breadcrumbs={[{ label: 'Departments' }]}
      />

      <section className="container-editorial py-14 lg:py-20">
        <DepartmentsDirectoryClient departments={departments} />
      </section>
    </div>
  );
}
