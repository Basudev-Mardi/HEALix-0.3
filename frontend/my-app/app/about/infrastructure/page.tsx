import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { getInfrastructure } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Infrastructure',
  description:
    'Explore Healix Medical Center clinical infrastructure: modular operating suites, smart ICUs, 3T imaging, and LEED Gold campus.',
};

export default async function InfrastructurePage() {
  const items = await getInfrastructure();

  return (
    <div>
      <PageHeader
        eyebrow="Clinical Infrastructure"
        title="Engineered for surgical precision and acoustic calm."
        description="Our campus pairs redundant hospital-grade life-support engineering with daylight-driven architecture to accelerate healing and eliminate infection risks."
        breadcrumbs={[
          { label: 'About', href: '/about' },
          { label: 'Infrastructure' },
        ]}
      />

      <section className="container-editorial py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-[#e6e4dd] bg-white p-8 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 pb-6 border-b border-[#e6e4dd]">
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#0f5c5c]">
                      {item.category}
                    </p>
                    <h2 className="text-xl font-medium text-[#14181a] mt-1.5">{item.title}</h2>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-editorial text-3xl text-[#14181a] leading-none">
                      {item.metric_value}
                    </p>
                    <p className="text-[11px] font-mono text-[#768086] mt-1">{item.metric_label}</p>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-[#4b555b]">{item.description}</p>

                <ul className="mt-6 space-y-2.5">
                  {item.specs.map((spec) => (
                    <li key={spec} className="flex items-start gap-2.5 text-sm text-[#14181a]">
                      <Check className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-[#e6e4dd] bg-[#f2f1ec]/70 p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-[#14181a]">Tour our campus spaces visually</h3>
            <p className="text-sm text-[#4b555b] mt-1">
              Explore our sunlit atrium, hybrid cath labs, private suites, and healing gardens.
            </p>
          </div>
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#14181a] text-white text-xs font-medium hover:bg-[#0f5c5c] transition-colors shrink-0"
          >
            Open Hospital Gallery
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
