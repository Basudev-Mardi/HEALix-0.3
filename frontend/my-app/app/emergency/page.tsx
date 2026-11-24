import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertTriangle,
  Ambulance,
  ArrowUpRight,
  Clock,
  MapPin,
  PhoneCall,
  ShieldAlert,
  Siren,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { getEmergencyInfo } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Emergency Information',
  description:
    '24/7 Level I Trauma Center, ambulance dispatch, stroke & cardiac emergency protocols, and immediate triage directions at Healix Medical Center.',
};

export default async function EmergencyPage() {
  const { contact, department, protocols } = await getEmergencyInfo();

  return (
    <div>
      <PageHeader
        eyebrow="24/7 Level I Trauma & Acute Care"
        title="Emergency Information"
        description="Immediate, round-the-clock emergency medicine, cardiac intervention, stroke response, and trauma resuscitation. If experiencing a life-threatening emergency, call immediately."
        breadcrumbs={[{ label: 'Emergency Information' }]}
        accent="emergency"
      />

      {/* Immediate Hotlines Band with Real Emergency Bay Photograph */}
      <section className="border-b border-[#f0d5d5] bg-[#fef2f2]">
        <div className="container-editorial py-10 space-y-8">
          <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden border border-[#f0d5d5] shadow-xs">
            <Image
              src="/images/emergency-trauma-bay.png"
              alt="Healix Level 1 Emergency & Trauma Resuscitation Bay"
              fill
              priority
              sizes="(max-width: 1240px) 100vw, 1240px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-xs font-mono font-semibold uppercase tracking-wider mb-2">
                  <Siren className="h-3.5 w-3.5 animate-pulse" />
                  Level I Adult &amp; Pediatric Trauma Center
                </span>
                <h2 className="font-heading text-xl sm:text-2xl font-bold">
                  Immediate 24/7 Resuscitation &amp; Acute Stroke / Cardiac Intervention
                </h2>
                <p className="text-xs sm:text-sm text-zinc-200 mt-1 max-w-2xl">
                  Equipped with dedicated trauma surgical suites, point-of-care CT diagnostics, and direct rooftop helipad transfer.
                </p>
              </div>
              <div className="shrink-0 font-mono text-xs bg-black/60 backdrop-blur-xs px-3 py-2 rounded-xl border border-white/20">
                Direct Triage Ramp: North Gate 01
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl bg-white border border-[#f0d5d5] p-6 space-y-2">
              <p className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#b91c1c]">
                <Siren className="h-3.5 w-3.5" />
                Emergency Triage Desk
              </p>
              <p className="font-mono text-2xl font-semibold text-[#242A28]">
                {contact.emergency_phone}
              </p>
              <p className="text-xs text-[#4A5350]">Direct 24/7 Emergency Physician Dispatch</p>
            </div>

            <div className="rounded-2xl bg-white border border-[#f0d5d5] p-6 space-y-2">
              <p className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#b91c1c]">
                <Ambulance className="h-3.5 w-3.5" />
                ALS Ambulance Dispatch
              </p>
              <p className="font-mono text-2xl font-semibold text-[#242A28]">
                {contact.ambulance_phone}
              </p>
              <p className="text-xs text-[#4A5350]">GPS-tracked ICU &amp; Neonatal Ambulances</p>
            </div>

            <div className="rounded-2xl bg-white border border-[#f0d5d5] p-6 space-y-2">
              <p className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#174C40]">
                <MapPin className="h-3.5 w-3.5" />
                Emergency Entrance
              </p>
              <p className="text-sm font-semibold text-[#242A28]">
                Ground Floor, North Trauma Ramp
              </p>
              <p className="text-xs text-[#4A5350]">{contact.address}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Triage Protocols */}
      <section className="container-editorial py-16 lg:py-20 space-y-16">
        <div className="space-y-8">
          <div className="max-w-2xl">
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#b91c1c] mb-3">
              Rapid Action Guides
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#242A28]">
              When to seek immediate emergency care
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {protocols.map((protocol) => (
              <article
                key={protocol.id}
                className="rounded-2xl border border-[#E5E8E6] bg-white p-8 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider px-3 py-1 rounded-full bg-[#fef2f2] text-[#b91c1c]">
                      <AlertTriangle className="h-3 w-3" />
                      {protocol.triage_level}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#174C40]">
                      <Clock className="h-3.5 w-3.5" />
                      {protocol.response_time}
                    </span>
                  </div>

                  <h3 className="font-editorial text-2xl text-[#242A28]">{protocol.title}</h3>
                  <p className="text-sm leading-relaxed text-[#4A5350]">{protocol.description}</p>

                  <ol className="space-y-2.5 pt-2">
                    {protocol.steps.map((step, i) => (
                      <li key={step} className="flex items-start gap-3 text-sm text-[#242A28]">
                        <span className="h-5 w-5 rounded-full bg-[#E6EFE9] text-[#242A28] font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="pt-4 border-t border-[#E5E8E6] flex items-center justify-between text-xs">
                  <span className="text-[#77817C]">Direct Line</span>
                  <span className="inline-flex items-center gap-1.5 font-mono font-medium text-[#b91c1c]">
                    <PhoneCall className="h-3.5 w-3.5" />
                    {protocol.phone}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Emergency Department Capabilities */}
        {department && (
          <div className="rounded-2xl border border-[#E5E8E6] bg-[#242A28] text-white p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-4">
                <p className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.16em] text-[#9fd8d2]">
                  <ShieldAlert className="h-4 w-4" />
                  {department.name}
                </p>
                <h2 className="font-editorial text-3xl sm:text-4xl leading-tight">
                  {department.beds_allocated} dedicated resuscitation &amp; acute care bays,
                  connected directly to rooftop helipad and CT imaging.
                </h2>
                <p className="text-sm leading-relaxed text-[#b5bdbd]">{department.overview}</p>
              </div>
              <div className="lg:col-span-5 space-y-3">
                {department.highlights.map((hl) => (
                  <div
                    key={hl}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-sm text-white"
                  >
                    {hl}
                  </div>
                ))}
                <Link
                  href="/departments/emergency-critical-care"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9fd8d2] hover:underline pt-2"
                >
                  View Emergency Department Faculty &amp; Equipment
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
