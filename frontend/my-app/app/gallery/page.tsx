import type { Metadata } from 'next';
import GalleryGrid from '@/components/GalleryGrid';
import PageHeader from '@/components/PageHeader';
import { getGallery } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Hospital Gallery',
  description:
    'Explore Healix Medical Center architecture, clinical suites, diagnostic pavilions, and patient recovery spaces.',
};

export default async function GalleryPage() {
  const items = await getGallery();

  return (
    <div>
      <PageHeader
        eyebrow="Campus Visual Tour"
        title="Spaces shaped for calm recovery."
        description="A curated look inside Healix Medical Center—from our travertine daylight atrium and botanical courtyard to our hybrid surgical suites."
        breadcrumbs={[{ label: 'Hospital Gallery' }]}
      />

      <section className="container-editorial py-16 lg:py-20">
        <GalleryGrid items={items} />
      </section>
    </div>
  );
}
