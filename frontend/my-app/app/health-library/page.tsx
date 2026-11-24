import type { Metadata } from 'next';
import HealthLibraryClient from '@/components/HealthLibraryClient';
import PageHeader from '@/components/PageHeader';
import { getHealthArticles } from '@/lib/support-api';

export const metadata: Metadata = {
  title: 'Health Library & Clinical Insights',
  description:
    'Evidence-based clinical guides, preventive insights, and recovery articles written by Healix Medical Center specialists.',
};

export default async function HealthLibraryPage() {
  const articles = await getHealthArticles();

  return (
    <div>
      <PageHeader
        eyebrow="Clinical Knowledge"
        title="Health Library & Insights"
        description="Physician-authored articles, preventive medicine guides, and recovery checklists designed to give you clarity on your health."
        breadcrumbs={[{ label: 'Health Library' }]}
      />

      <section className="container-editorial py-14 lg:py-20">
        <HealthLibraryClient articles={articles} />
      </section>
    </div>
  );
}
