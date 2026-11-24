import type { Metadata } from 'next';
import DoctorsDirectoryClient from '@/components/DoctorsDirectoryClient';
import PageHeader from '@/components/PageHeader';
import { getDepartments, getDoctors } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Doctors Directory',
  description:
    'Browse board-certified physicians, surgeons, and department chairs across Healix Medical Center.',
};

export default async function DoctorsPage() {
  const [doctors, departments] = await Promise.all([getDoctors(), getDepartments()]);

  return (
    <div>
      <PageHeader
        eyebrow="Medical Staff"
        title="Doctors Directory"
        description="Meet our board-certified physicians and surgeons—filter by clinical department or search directly by name and subspecialty."
        breadcrumbs={[{ label: 'Doctors' }]}
      />

      <section className="container-editorial py-14 lg:py-20">
        <DoctorsDirectoryClient doctors={doctors} departments={departments} />
      </section>
    </div>
  );
}
