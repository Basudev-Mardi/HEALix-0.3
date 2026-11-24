import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Compass, Eye } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { getHospitalInfo } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Mission & Vision',
  description: 'The clinical mission, future vision, and core ethical values of Healix Medical Center.',
};

export default async function MissionVisionPage() {
  const hospital = await getHospitalInfo();

  return (
    <div>
      <PageHeader
        eyebrow="Purpose & Ethos"
        title="Mission, vision, and the standards we hold."
        description="Every clinical decision, architectural detail, and patient conversation at Healix is anchored to four enduring commitments."
        breadcrumbs={[
          { label: 'About', href: '/about' },
          { label: 'Mission & Vision' },
        ]}
      />

      {/* Mission & Vision Split */}
      <section className="container-editorial py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-[#e6e4dd] bg-white p-9 lg:p-11 space-y-5">
            <span className="h-11 w-11 rounded-xl bg-[#edf5f4] text-[#0f5c5c] flex items-center justify-center">
              <Compass className="h-5 w-5" />
            </span>
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#0f5c5c]">
              Our Mission
            </p>
            <h2 className="font-editorial text-2xl sm:text-3xl leading-snug text-[#14181a]">
              {hospital.mission}
            </h2>
          </div>

          <div className="rounded-2xl border border-[#e6e4dd] bg-[#14181a] text-white p-9 lg:p-11 space-y-5">
            <span className="h-11 w-11 rounded-xl bg-white/10 text-[#9fd8d2] flex items-center justify-center">
              <Eye className="h-5 w-5" />
            </span>
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#9fd8d2]">
              Our Vision
            </p>
            <h2 className="font-editorial text-2xl sm:text-3xl leading-snug text-white">
              {hospital.vision}
            </h2>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="border-t border-[#e6e4dd] bg-white">
        <div className="container-editorial py-16 lg:py-20">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#0f5c5c] mb-3">
              Core Values
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#14181a]">
              Principles practiced at every bedside
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hospital.values_json.map((val, idx) => (
              <div
                key={val.title}
                className="rounded-2xl border border-[#e6e4dd] bg-[#faf9f6] p-8 space-y-3"
              >
                <span className="font-mono text-xs text-[#0f5c5c]">0{idx + 1}</span>
                <h3 className="text-xl font-medium text-[#14181a]">{val.title}</h3>
                <p className="text-sm leading-relaxed text-[#4b555b]">{val.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-[#e6e4dd] flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-[#4b555b]">
              See how our philosophy shapes our clinical spaces and technology.
            </p>
            <Link
              href="/about/infrastructure"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#0f5c5c] hover:underline"
            >
              Explore Hospital Infrastructure
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
