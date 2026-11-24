import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import ServicesDirectoryClient from '@/components/ServicesDirectoryClient';
import { getServices } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Medical Services',
  description:
    'Explore diagnostic, surgical, preventive, and critical medical services at Healix Medical Center.',
};

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <div>
      <PageHeader
        eyebrow="Clinical Programs"
        title="Medical Services"
        description="Evidence-based diagnostic, surgical, and therapeutic programs designed around clear preparation guidelines and transparent care pathways."
        breadcrumbs={[{ label: 'Services' }]}
      />

      <section className="container-editorial py-16 lg:py-20">
        <ServicesDirectoryClient services={services} />
      </section>
    </div>
  );
}
