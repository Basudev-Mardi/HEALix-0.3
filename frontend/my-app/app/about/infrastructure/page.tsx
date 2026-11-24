import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
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
        {/* Real Infrastructure Highlight Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="relative h-72 sm:h-80 rounded-2xl overflow-hidden border border-[#E5E8E6] group">
            <Image
              src="/images/robotic-operating-suite.png"
              alt="Healix Hybrid Robotic Operating Suite"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="text-[11px] font-mono uppercase tracking-wider bg-[#174C40]/90 px-2.5 py-1 rounded-full border border-emerald-400/30">
                Surgical Precision
              </span>
              <h3 className="font-heading text-xl font-semibold mt-2 text-white">
                Hybrid Robotic Operating Suites
              </h3>
              <p className="text-xs text-zinc-200 mt-1">
                Equipped with sub-millimeter surgical robotics and intraoperative 3D imaging navigation.
              </p>
            </div>
          </div>

          <div className="relative h-72 sm:h-80 rounded-2xl overflow-hidden border border-[#E5E8E6] group">
            <Image
              src="/images/inpatient-recovery-suite.png"
              alt="Healix Private Inpatient Recovery Suite"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="text-[11px] font-mono uppercase tracking-wider bg-[#287A64]/90 px-2.5 py-1 rounded-full border border-teal-300/30">
                Acoustic Rest &amp; Healing
              </span>
              <h3 className="font-heading text-xl font-semibold mt-2 text-white">
                Private Inpatient Recovery Suites
              </h3>
              <p className="text-xs text-zinc-200 mt-1">
                Acoustically insulated private suites flooded with natural light overlooking courtyard healing gardens.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-[#E5E8E6] bg-white p-8 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 pb-6 border-b border-[#E5E8E6]">
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#174C40]">
                      {item.category}
                    </p>
                    <h2 className="text-xl font-medium text-[#242A28] mt-1.5">{item.title}</h2>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-editorial text-3xl text-[#242A28] leading-none">
                      {item.metric_value}
                    </p>
                    <p className="text-[11px] font-mono text-[#77817C] mt-1">{item.metric_label}</p>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-[#4A5350]">{item.description}</p>

                <ul className="mt-6 space-y-2.5">
                  {item.specs.map((spec) => (
                    <li key={spec} className="flex items-start gap-2.5 text-sm text-[#242A28]">
                      <Check className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-[#E5E8E6] bg-[#E6EFE9]/70 p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-[#242A28]">Tour our campus spaces visually</h3>
            <p className="text-sm text-[#4A5350] mt-1">
              Explore our sunlit atrium, hybrid cath labs, private suites, and healing gardens.
            </p>
          </div>
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#242A28] text-white text-xs font-medium hover:bg-[#174C40] transition-colors shrink-0"
          >
            Open Hospital Gallery
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
