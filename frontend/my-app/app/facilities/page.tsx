import type { Metadata } from 'next';
import FacilitiesClient from '@/components/FacilitiesClient';
import PageHeader from '@/components/PageHeader';
import { getFacilities } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Facilities',
  description:
    '24/7 clinical pharmacy, automated pathology lab, private recovery suites, blood bank, rehabilitation studio, and visitor amenities.',
};

export default async function FacilitiesPage() {
  const facilities = await getFacilities();

  return (
    <div>
      <PageHeader
        eyebrow="Campus Amenities & Support"
        title="Hospital Facilities"
        description="Essential clinical support services and thoughtfully designed visitor amenities—all under one connected roof."
        breadcrumbs={[{ label: 'Facilities' }]}
      />

      <section className="container-editorial py-16 lg:py-20">
        <FacilitiesClient facilities={facilities} />
      </section>
    </div>
  );
}
