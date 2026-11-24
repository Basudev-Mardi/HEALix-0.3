import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
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
    title: `${pkg.name} — Preventive Screening`,
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

  const discount = Math.round(((pkg.original_price - pkg.price) / pkg.original_price) * 100);

  return (
    <div>
      <PageHeader
        eyebrow={`Preventive Screening · ${pkg.tier} Tier`}
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
          <div className="lg:col-span-8 space-y-10">
            {/* Quick Specs Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl border border-[#e6e4dd] bg-white p-4">
                <p className="text-[11px] font-mono uppercase text-[#768086]">Duration</p>
                <p className="font-medium text-sm text-[#14181a] mt-0.5">{pkg.duration}</p>
              </div>
              <div className="rounded-xl border border-[#e6e4dd] bg-white p-4">
                <p className="text-[11px] font-mono uppercase text-[#768086]">Turnaround</p>
                <p className="font-medium text-sm text-[#14181a] mt-0.5">{pkg.turnaround}</p>
              </div>
              <div className="rounded-xl border border-[#e6e4dd] bg-white p-4">
                <p className="text-[11px] font-mono uppercase text-[#768086]">Frequency</p>
                <p className="font-medium text-sm text-[#14181a] mt-0.5">{pkg.recommended_frequency}</p>
              </div>
              <div className="rounded-xl border border-[#e6e4dd] bg-white p-4">
                <p className="text-[11px] font-mono uppercase text-[#768086]">Ideal For</p>
                <p className="font-medium text-xs text-[#14181a] mt-0.5 truncate">{pkg.ideal_for}</p>
              </div>
            </div>

            {/* Test Investigations Breakdown */}
            <div className="space-y-6">
              <h2 className="font-editorial text-2xl sm:text-3xl text-[#14181a]">
                Diagnostic Scope &amp; Investigations
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {pkg.tests.map((group) => (
                  <div
                    key={group.group}
                    className="rounded-2xl border border-[#e6e4dd] bg-white p-6 space-y-3"
                  >
                    <h3 className="text-sm font-semibold text-[#14181a] pb-2 border-b border-[#e6e4dd]">
                      {group.group}
                    </h3>
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

            {/* Preparation Guidelines */}
            <div className="rounded-2xl border border-[#e6e4dd] bg-[#faf9f6] p-7 space-y-3">
              <h2 className="text-sm font-semibold text-[#14181a] flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0f5c5c]" />
                Patient Preparation Instructions
              </h2>
              <ul className="space-y-2 text-sm text-[#4b555b]">
                {pkg.preparation.map((prep, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="font-mono text-xs text-[#0f5c5c]">{idx + 1}.</span>
                    <span>{prep}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/health-packages"
              className="inline-flex items-center gap-1.5 text-xs text-[#768086] hover:text-[#14181a]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Compare All Health Packages
            </Link>
          </div>

          {/* Sticky Booking Sidebar */}
          <aside className="lg:col-span-4 lg:sticky lg:top-32 space-y-6">
            <div className="rounded-2xl border border-[#e6e4dd] bg-white p-7 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#0f5c5c] bg-[#edf5f4] px-2.5 py-0.5 rounded-full">
                  {pkg.tier} Tier
                </span>
                {pkg.is_popular && (
                  <span className="text-[11px] font-mono text-[#0f5c5c] inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Top Pick
                  </span>
                )}
              </div>

              <div>
                <p className="font-editorial text-4xl text-[#14181a]">${pkg.price}</p>
                <div className="flex items-center gap-2 text-xs font-mono text-[#768086] mt-1">
                  <span className="line-through">${pkg.original_price}</span>
                  <span>· Save {discount}%</span>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-[#e6e4dd] text-xs text-[#4b555b]">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#0f5c5c]" />
                  Same-day doctor consultation included
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#0f5c5c]" />
                  Digital portal report access
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#0f5c5c]" />
                  100% cashless insurance accepted
                </p>
              </div>

              <Link
                href={`/appointments/book?package=${pkg.slug}`}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#14181a] text-white text-xs font-medium hover:bg-[#0f5c5c] transition-colors"
              >
                <Calendar className="h-4 w-4" />
                Schedule This Package
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
