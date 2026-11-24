import type { Metadata } from 'next';
import HealthPackagesClient from '@/components/HealthPackagesClient';
import PageHeader from '@/components/PageHeader';
import { getHealthPackages } from '@/lib/support-api';

export const metadata: Metadata = {
  title: 'Preventive Health Packages',
  description:
    'Comprehensive executive, cardiac, and senior health screening packages at Healix Medical Center.',
};

export default async function HealthPackagesPage() {
  const packages = await getHealthPackages();

  return (
    <div>
      <PageHeader
        eyebrow="Preventive Care"
        title="Preventive Health Packages"
        description="Transparently priced comprehensive health evaluations with same-day physician reviews, digital reports, and personalized lifestyle roadmaps."
        breadcrumbs={[{ label: 'Health Packages' }]}
      />

      <section className="container-editorial py-14 lg:py-20">
        <HealthPackagesClient packages={packages} />
      </section>
    </div>
  );
}
