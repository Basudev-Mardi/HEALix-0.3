import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  HelpCircle,
  PhoneCall,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import HealthPackagesClient from '@/components/HealthPackagesClient';
import PageHeader from '@/components/PageHeader';
import { getHealthPackages } from '@/lib/support-api';

export const metadata: Metadata = {
  title: 'Preventive Health Packages | Healix Medical Center',
  description:
    'Comprehensive executive, cardiac, diabetic, and senior health screening packages at Healix Medical Center. Transparent pricing, same-day physician reviews, and certified laboratories.',
};

export default async function HealthPackagesPage() {
  const packages = await getHealthPackages();

  return (
    <div>
      <PageHeader
        eyebrow="Preventive Healthcare &amp; Wellness"
        title="Preventive Health Packages"
        description="Transparently priced comprehensive health evaluations with same-day physician reviews, certified laboratory diagnostics, digital portal reports, and personalized lifestyle roadmaps."
        breadcrumbs={[{ label: 'Health Packages' }]}
      />

      {/* Trust Badges Strip */}
      <section className="border-b border-[#e6e4dd] bg-white py-6">
        <div className="container-editorial space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 flex items-start gap-3">
            <ShieldCheck className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Package Availability &amp; Confirmation Policy</p>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                All package bookings and preferred dates selected through the portal are provisional. Package availability, specialist clinic schedules, and diagnostic slots are only guaranteed once formally reviewed and confirmed by authorized hospital personnel.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-[#4b555b] pt-1">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-[#0f5c5c] shrink-0" />
              <span>Certified CAP/NABL Laboratories</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-[#0f5c5c] shrink-0" />
              <span>Same-Day Diagnostic Turnaround</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-[#0f5c5c] shrink-0" />
              <span>1:1 Specialist Doctor Consultations</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-[#0f5c5c] shrink-0" />
              <span>Zero Hidden Fees or Add-Ons</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Packages Catalog */}
      <section className="container-editorial py-14 lg:py-20 space-y-16">
        <HealthPackagesClient packages={packages} />

        {/* Guidance and Assistance Banner */}
        <div className="rounded-2xl border border-[#e6e4dd] bg-[#faf9f6] p-8 lg:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 max-w-2xl">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#0f5c5c] font-semibold">
              Need Personalized Guidance?
            </span>
            <h3 className="font-editorial text-2xl text-[#14181a]">
              Not sure which health package is right for you?
            </h3>
            <p className="text-xs text-[#4b555b] leading-relaxed">
              Our Preventive Care Coordinators will review your age, personal health history, and medical goals to recommend the most appropriate screening package.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <a
              href="tel:18004325491"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-[#d2d0c8] bg-white text-xs font-medium text-[#14181a] hover:border-[#14181a] transition-colors"
            >
              <PhoneCall className="h-3.5 w-3.5 text-[#0f5c5c]" />
              Call +1 (800) 432-5491
            </a>
            <Link
              href="/appointments/book"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#14181a] text-white text-xs font-medium hover:bg-[#0f5c5c] transition-colors"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Schedule Checkup
            </Link>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div className="space-y-6 pt-4 border-t border-[#e6e4dd]">
          <div className="space-y-1">
            <h3 className="font-editorial text-2xl text-[#14181a]">
              Frequently Asked Questions About Health Checkups
            </h3>
            <p className="text-xs text-[#768086]">
              Common questions regarding package preparation, insurance coverage, and turnaround times.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-[#4b555b]">
            <div className="rounded-xl border border-[#e6e4dd] bg-white p-5 space-y-2">
              <h4 className="font-semibold text-sm text-[#14181a] flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#0f5c5c] shrink-0" />
                Why is overnight fasting required for most packages?
              </h4>
              <p className="leading-relaxed">
                Fasting for 10–12 hours ensures that blood glucose, triglycerides, and lipid fractions are at true metabolic baseline levels. Sips of plain water are permitted and recommended to remain hydrated.
              </p>
            </div>

            <div className="rounded-xl border border-[#e6e4dd] bg-white p-5 space-y-2">
              <h4 className="font-semibold text-sm text-[#14181a] flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#0f5c5c] shrink-0" />
                Can I claim health checkup expenses under insurance?
              </h4>
              <p className="leading-relaxed">
                Many corporate and comprehensive health insurance policies include annual wellness or preventive checkup benefits. We provide itemized receipts and diagnostic reports for seamless reimbursement.
              </p>
            </div>

            <div className="rounded-xl border border-[#e6e4dd] bg-white p-5 space-y-2">
              <h4 className="font-semibold text-sm text-[#14181a] flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#0f5c5c] shrink-0" />
                How soon will I receive my diagnostic reports?
              </h4>
              <p className="leading-relaxed">
                Preliminary results are reviewed same-day during your physician consultation. The full digital portfolio with signed radiologist and pathologist impressions is uploaded to your patient portal within 12–48 hours.
              </p>
            </div>

            <div className="rounded-xl border border-[#e6e4dd] bg-white p-5 space-y-2">
              <h4 className="font-semibold text-sm text-[#14181a] flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#0f5c5c] shrink-0" />
                Can I reschedule if I am feeling unwell on the appointment day?
              </h4>
              <p className="leading-relaxed">
                Yes. If you develop acute fever or respiratory infection, we recommend rescheduling for at least 7 days later so that infection does not skew inflammatory markers like ESR, CBC, or CRP.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
