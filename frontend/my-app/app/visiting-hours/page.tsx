import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Info, MapPin, Phone, Siren, Users } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { getVisitingHours } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Hospital Timings & Visiting Hours',
  description:
    'Inpatient visiting hours, ICU/NICU timings, outpatient clinic schedules, diagnostics, and 24/7 emergency access at Healix Medical Center.',
};

export default async function VisitingHoursPage() {
  const { schedules, contact } = await getVisitingHours();

  return (
    <div>
      <PageHeader
        eyebrow="Schedules & Visitor Policy"
        title="Hospital Timings & Visiting Hours"
        description="Structured around patient rest and clinical rounds. Emergency, pharmacy, and critical care teams remain active 24 hours a day."
        breadcrumbs={[{ label: 'Hospital Timings' }]}
      />

      <section className="container-editorial py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Schedule Table / Cards */}
          <div className="lg:col-span-8 space-y-4">
            {schedules.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-[#e6e4dd] bg-white p-7 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#0f5c5c]">
                      {item.category}
                    </span>
                    <h2 className="text-xl font-medium text-[#14181a] mt-1">{item.unit_name}</h2>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <p className="inline-flex items-center gap-1.5 font-mono text-sm font-medium text-[#14181a]">
                      <Clock className="h-3.5 w-3.5 text-[#0f5c5c]" />
                      {item.hours}
                    </p>
                    <p className="text-xs text-[#768086] mt-0.5">{item.days}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#e6e4dd] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-[#14181a] font-medium">
                    <Users className="h-3.5 w-3.5 text-[#0f5c5c]" />
                    {item.max_visitors}
                  </span>
                  <p className="text-[#4b555b] sm:max-w-md sm:text-right">{item.guidelines}</p>
                </div>
              </article>
            ))}
          </div>

          {/* Sidebar Guidelines & Contact */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-[#e6e4dd] bg-[#f2f1ec]/70 p-7 space-y-4">
              <h3 className="text-sm font-semibold text-[#14181a] flex items-center gap-2">
                <Info className="h-4 w-4 text-[#0f5c5c]" />
                Visitor Etiquette
              </h3>
              <ul className="space-y-3 text-sm text-[#4b555b]">
                <li>• Check in at the Main Atrium Concierge for a printed visitor pass.</li>
                <li>• Please sanitize hands upon entering and leaving every patient room.</li>
                <li>• Keep mobile phones on silent mode inside inpatient and ICU corridors.</li>
                <li>• Visitors experiencing cold or flu symptoms are kindly asked to postpone visits.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-[#e6e4dd] bg-white p-7 space-y-4">
              <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#768086]">
                Campus Contact
              </p>
              <div className="space-y-3 text-sm">
                <p className="flex items-start gap-2.5 text-[#4b555b]">
                  <MapPin className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
                  {contact.address}
                </p>
                <p className="flex items-center gap-2.5 font-mono text-[#14181a]">
                  <Phone className="h-4 w-4 text-[#0f5c5c] shrink-0" />
                  {contact.phone}
                </p>
                <p className="flex items-center gap-2.5 font-mono text-[#b91c1c]">
                  <Siren className="h-4 w-4 shrink-0" />
                  {contact.emergency_phone}
                </p>
              </div>
              <Link
                href="/emergency"
                className="block text-center mt-2 px-4 py-2.5 rounded-full bg-[#fef2f2] text-[#b91c1c] text-xs font-medium hover:bg-[#fee2e2] transition-colors"
              >
                View 24/7 Emergency Information
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
