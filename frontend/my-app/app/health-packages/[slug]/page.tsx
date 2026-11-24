import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  HelpCircle,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';
import HealthPackageDetailActions from '@/components/HealthPackageDetailActions';
import PageHeader from '@/components/PageHeader';
import { getHealthPackageBySlug, getHealthPackages } from '@/lib/support-api';

export async function generateStaticParams() {
  const packages = await getHealthPackages();
  return packages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getHealthPackageBySlug(slug);
  if (!pkg) return { title: 'Package Not Found' };
  return {
    title: `${pkg.name} — Preventive Health Screening | Healix`,
    description: pkg.short_description,
  };
}

export default async function HealthPackageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pkg = await getHealthPackageBySlug(slug);

  if (!pkg) {
    notFound();
  }

  const totalTests = pkg.tests.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <div>
      <PageHeader
        eyebrow={`Preventive Screening · ${pkg.tier} Tier · ${pkg.category}`}
        title={pkg.name}
        description={pkg.overview}
        breadcrumbs={[
          { label: 'Health Packages', href: '/health-packages' },
          { label: pkg.name },
        ]}
      />

      <section className="container-editorial py-14 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Package Scope */}
          <div className="lg:col-span-8 space-y-12">
            {/* Quick Specs Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl border border-[#e6e4dd] bg-white p-4">
                <p className="text-[11px] font-mono uppercase text-[#768086]">Duration</p>
                <p className="font-semibold text-sm text-[#14181a] mt-0.5">{pkg.duration}</p>
              </div>
              <div className="rounded-xl border border-[#e6e4dd] bg-white p-4">
                <p className="text-[11px] font-mono uppercase text-[#768086]">Report Turnaround</p>
                <p className="font-semibold text-sm text-[#14181a] mt-0.5">{pkg.turnaround}</p>
              </div>
              <div className="rounded-xl border border-[#e6e4dd] bg-white p-4">
                <p className="text-[11px] font-mono uppercase text-[#768086]">Recommended Frequency</p>
                <p className="font-semibold text-sm text-[#14181a] mt-0.5">{pkg.recommended_frequency}</p>
              </div>
              <div className="rounded-xl border border-[#e6e4dd] bg-white p-4">
                <p className="text-[11px] font-mono uppercase text-[#768086]">Investigations</p>
                <p className="font-semibold text-sm text-[#0f5c5c] mt-0.5">{totalTests} Parameters</p>
              </div>
            </div>

            {/* Overview & Clinical Purpose */}
            <div className="space-y-4 rounded-2xl border border-[#e6e4dd] bg-white p-7">
              <h2 className="font-editorial text-2xl text-[#14181a]">
                Clinical Overview &amp; Health Objective
              </h2>
              <p className="text-sm text-[#4b555b] leading-relaxed">
                {pkg.overview}
              </p>
              <div className="rounded-xl bg-[#faf9f6] p-4 border border-[#f0eee6] flex items-start gap-3 text-xs text-[#4b555b]">
                <ShieldCheck className="h-4 w-4 text-[#0f5c5c] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#14181a]">Healix Diagnostic Assurance: </span>
                  All biological samples and imaging scans are processed on certified, automated medical systems supervised by board-certified clinical pathologists and radiologists.
                </div>
              </div>
            </div>

            {/* Diagnostic Scope & Included Tests */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-editorial text-2xl sm:text-3xl text-[#14181a]">
                    Included Diagnostic Tests &amp; Panels
                  </h2>
                  <p className="text-xs text-[#768086] mt-1">
                    Complete breakdown of {totalTests} clinical parameters across {pkg.tests.length} diagnostic categories.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {pkg.tests.map((group) => (
                  <div
                    key={group.group}
                    className="rounded-2xl border border-[#e6e4dd] bg-white p-6 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-[#e6e4dd] pb-2">
                      <h3 className="text-sm font-semibold text-[#14181a]">
                        {group.group}
                      </h3>
                      <span className="text-[11px] font-mono text-[#0f5c5c] bg-[#edf5f4] px-2 py-0.5 rounded-full">
                        {group.items.length} items
                      </span>
                    </div>
                    <ul className="space-y-2 text-xs text-[#4b555b]">
                      {group.items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-[#0f5c5c] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Eligibility & Candidacy Information */}
            <div className="rounded-2xl border border-[#e6e4dd] bg-white p-7 space-y-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-[#e6e4dd]">
                <Users className="h-5 w-5 text-[#0f5c5c]" />
                <h2 className="font-editorial text-xl sm:text-2xl text-[#14181a]">
                  Eligibility &amp; Target Cohort Information
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl bg-[#faf9f6] p-4 border border-[#e6e4dd] space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#768086]">
                    Recommended Age Bracket
                  </span>
                  <p className="font-semibold text-sm text-[#14181a]">
                    {pkg.eligibility?.age_range || '18+ years'}
                  </p>
                </div>
                <div className="rounded-xl bg-[#faf9f6] p-4 border border-[#e6e4dd] space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#768086]">
                    Target Demographics
                  </span>
                  <p className="font-semibold text-sm text-[#14181a]">
                    {pkg.eligibility?.gender_target || 'All genders'}
                  </p>
                </div>
              </div>

              {/* Who benefits most */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-[#14181a] uppercase tracking-wider font-mono">
                  Recommended For:
                </h3>
                <ul className="space-y-1.5 text-xs text-[#4b555b]">
                  {(pkg.eligibility?.recommended_for || [pkg.ideal_for]).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#0f5c5c] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contraindications or Precautions */}
              {pkg.eligibility?.contraindications && pkg.eligibility.contraindications.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-semibold">
                    <ShieldAlert className="h-4 w-4 text-amber-700" />
                    <span>Clinical Precautions &amp; Contraindications</span>
                  </div>
                  <ul className="space-y-1 text-amber-800">
                    {pkg.eligibility.contraindications.map((contra, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{contra}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Preparation Guidelines */}
            <div className="rounded-2xl border border-[#e6e4dd] bg-[#faf9f6] p-7 space-y-4">
              <h2 className="text-base font-semibold text-[#14181a] flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0f5c5c]" />
                Patient Preparation Instructions
              </h2>
              <p className="text-xs text-[#768086]">
                Strict adherence to preparation instructions ensures laboratory accuracy and prevents invalid specimen re-collections.
              </p>
              <ol className="space-y-2.5 text-xs text-[#4b555b]">
                {pkg.preparation.map((prep, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 bg-white p-3 rounded-lg border border-[#e6e4dd]">
                    <span className="font-mono text-xs font-bold text-[#0f5c5c]">{idx + 1}.</span>
                    <span className="leading-relaxed">{prep}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Terms and Conditions */}
            <div className="rounded-2xl border border-[#e6e4dd] bg-white p-7 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-[#e6e4dd]">
                <FileCheck2 className="h-4 w-4 text-[#0f5c5c]" />
                <h2 className="font-editorial text-xl text-[#14181a]">
                  Hospital Terms &amp; Package Conditions
                </h2>
              </div>
              <ul className="space-y-2 text-xs text-[#4b555b]">
                {(pkg.terms_and_conditions || [
                  'Appointments must be confirmed at least 24 hours in advance.',
                  'Package price is inclusive of all diagnostic tests and physician consultation.',
                  'Individual unavailed tests cannot be refunded or exchanged.',
                  'Free rescheduling is available up to 4 hours prior to the slot.',
                ]).map((term, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0f5c5c] shrink-0 mt-1.5" />
                    <span className="leading-relaxed">{term}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Back link */}
            <div className="pt-2">
              <Link
                href="/health-packages"
                className="inline-flex items-center gap-2 text-xs font-medium text-[#0f5c5c] hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to All Preventive Health Packages
              </Link>
            </div>
          </div>

          {/* Sticky Booking & Enquiry Sidebar */}
          <aside className="lg:col-span-4 lg:sticky lg:top-32 space-y-6">
            <HealthPackageDetailActions pkg={pkg} />
          </aside>
        </div>

        {/* Other Recommended Packages Carousel / Grid */}
        {pkg.otherPackages && pkg.otherPackages.length > 0 && (
          <div className="mt-20 pt-12 border-t border-[#e6e4dd] space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-editorial text-2xl text-[#14181a]">
                  Other Preventive Health Programs
                </h3>
                <p className="text-xs text-[#768086] mt-0.5">
                  Explore complementary health assessments designed for different life stages.
                </p>
              </div>
              <Link
                href="/health-packages"
                className="text-xs font-medium text-[#0f5c5c] hover:underline inline-flex items-center gap-1"
              >
                View all packages
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pkg.otherPackages.map((other) => (
                <div
                  key={other.slug}
                  className="rounded-2xl border border-[#e6e4dd] bg-white p-5 space-y-3 hover:border-[#0f5c5c] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-[#0f5c5c] bg-[#edf5f4] px-2 py-0.5 rounded-full">
                      {other.tier} Tier
                    </span>
                    <span className="text-xs font-semibold text-[#14181a] font-mono">
                      ${other.price}
                    </span>
                  </div>
                  <h4 className="font-editorial text-lg text-[#14181a]">
                    <Link href={`/health-packages/${other.slug}`} className="hover:text-[#0f5c5c]">
                      {other.name}
                    </Link>
                  </h4>
                  <p className="text-xs text-[#4b555b] line-clamp-2">
                    {other.short_description}
                  </p>
                  <div className="pt-2 border-t border-[#e6e4dd] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#768086]">{other.duration}</span>
                    <Link
                      href={`/health-packages/${other.slug}`}
                      className="text-xs font-medium text-[#0f5c5c] hover:underline inline-flex items-center gap-1"
                    >
                      Details
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
