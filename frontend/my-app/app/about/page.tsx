import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Award, Building2, CheckCircle2, HeartHandshake } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { getHospitalInfo } from '@/lib/api';

export const metadata: Metadata = {
  title: 'About Hospital',
  description: 'Learn about Healix Medical Center, our clinical heritage, leadership, and accreditation.',
};

export default async function AboutPage() {
  const hospital = await getHospitalInfo();

  return (
    <div>
      <PageHeader
        eyebrow="About Healix"
        title="Two decades of quiet clinical rigor."
        description={hospital.about_summary}
        breadcrumbs={[{ label: 'About Hospital' }]}
      />

      {/* Story & Key Facts */}
      <section className="container-editorial py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-6">
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#0f5c5c]">
              Our Heritage
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#14181a]">
              Built where academic precision meets human serenity.
            </h2>
            <p className="text-base leading-relaxed text-[#4b555b]">{hospital.about_story}</p>
            <p className="text-base leading-relaxed text-[#4b555b]">
              Every care pathway at Healix is designed around multidisciplinary collaboration—meaning
              cardiologists, radiologists, surgeons, and rehabilitation therapists review complex
              cases together rather than in disconnected silos.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {[
                '100% single-occupancy private recovery suites',
                'Weekly multidisciplinary tumor & cardiac boards',
                'Transparent clinical outcome reporting',
                'Direct 24/7 Level I trauma & stroke readiness',
              ].map((point) => (
                <div key={point} className="flex items-start gap-2.5 text-sm text-[#14181a]">
                  <CheckCircle2 className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="rounded-2xl border border-[#e6e4dd] bg-white p-8 space-y-6">
              <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#768086]">
                At a Glance
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="font-editorial text-3xl text-[#14181a]">{hospital.founded_year}</p>
                  <p className="text-xs text-[#768086] mt-1">Year Founded</p>
                </div>
                <div>
                  <p className="font-editorial text-3xl text-[#14181a]">{hospital.beds_count}</p>
                  <p className="text-xs text-[#768086] mt-1">Licensed Beds</p>
                </div>
                <div>
                  <p className="font-editorial text-3xl text-[#14181a]">{hospital.doctors_count}+</p>
                  <p className="text-xs text-[#768086] mt-1">Attending Physicians</p>
                </div>
                <div>
                  <p className="font-editorial text-3xl text-[#14181a]">
                    {hospital.patients_served}
                  </p>
                  <p className="text-xs text-[#768086] mt-1">Patients Served</p>
                </div>
              </div>
              <div className="pt-5 border-t border-[#e6e4dd] flex items-center gap-3">
                <Award className="h-5 w-5 text-[#0f5c5c] shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[#14181a]">{hospital.accreditation}</p>
                  <p className="text-xs text-[#768086]">Audited annually for patient safety</p>
                </div>
              </div>
            </div>

            {/* Leadership Quote */}
            <blockquote className="rounded-2xl border border-[#e6e4dd] bg-[#f2f1ec]/70 p-8 space-y-4">
              <p className="font-editorial italic text-xl leading-relaxed text-[#14181a]">
                &ldquo;{hospital.leadership_quote}&rdquo;
              </p>
              <footer className="text-xs">
                <p className="font-semibold text-[#14181a]">{hospital.leadership_name}</p>
                <p className="text-[#768086]">{hospital.leadership_title}</p>
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Sub-pages Navigation */}
      <section className="border-t border-[#e6e4dd] bg-white">
        <div className="container-editorial py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/about/mission-vision"
              className="card-minimal rounded-2xl p-8 flex items-start justify-between gap-4 group"
            >
              <div className="space-y-2">
                <HeartHandshake className="h-5 w-5 text-[#0f5c5c]" />
                <h3 className="text-xl font-medium text-[#14181a] group-hover:text-[#0f5c5c]">
                  Mission &amp; Vision
                </h3>
                <p className="text-sm text-[#4b555b]">
                  Explore our founding purpose, long-term healthcare vision, and four core values.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-[#768086] group-hover:text-[#14181a] shrink-0 mt-1" />
            </Link>

            <Link
              href="/about/infrastructure"
              className="card-minimal rounded-2xl p-8 flex items-start justify-between gap-4 group"
            >
              <div className="space-y-2">
                <Building2 className="h-5 w-5 text-[#0f5c5c]" />
                <h3 className="text-xl font-medium text-[#14181a] group-hover:text-[#0f5c5c]">
                  Hospital Infrastructure
                </h3>
                <p className="text-sm text-[#4b555b]">
                  Inside our 14 modular operating suites, 78 ICU beds, 3T imaging core, and LEED
                  Gold campus.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-[#768086] group-hover:text-[#14181a] shrink-0 mt-1" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
