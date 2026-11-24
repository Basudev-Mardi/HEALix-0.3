import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  HeartHandshake,
  Info,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { getFacilities, getFacilityBySlug } from '@/lib/api';

export const instant = false;

export async function generateStaticParams() {
  const facilities = await getFacilities();
  return facilities.map((facility) => ({ slug: facility.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const facility = await getFacilityBySlug(slug);
  if (!facility) return { title: 'Facility Not Found' };
  return {
    title: `${facility.name} | Hospital Facilities`,
    description: facility.description,
  };
}

export default async function FacilityDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const facility = await getFacilityBySlug(slug);

  if (!facility) {
    notFound();
  }

  const otherFacilities = facility.otherFacilities ?? [];

  return (
    <div className="bg-[#FAFAF7] min-h-screen">
      {/* Header Banner */}
      <section className="border-b border-[#E5E8E6] bg-white">
        <div className="container-editorial py-12 lg:py-16">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <Link
              href="/facilities"
              className="inline-flex items-center gap-2 text-xs font-medium text-[#77817C] hover:text-[#242A28] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All Hospital Facilities
            </Link>

            <span className="text-[11px] font-mono uppercase tracking-wider px-3 py-1 rounded-full bg-[#E6EFE9] text-[#174C40]">
              Campus Physical Infrastructure
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-8 space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-mono uppercase tracking-wider px-3.5 py-1 rounded-full bg-[#242A28] text-white">
                  {facility.category}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#174C40] bg-[#E6EFE9] px-3 py-1 rounded-full">
                  <Clock className="h-3.5 w-3.5" />
                  {facility.availability}
                </span>
              </div>

              <h1 className="font-editorial text-4xl sm:text-5xl text-[#242A28] leading-[1.15]">
                {facility.name}
              </h1>

              <p className="text-base sm:text-lg leading-relaxed text-[#4A5350] max-w-2xl">
                {facility.description}
              </p>

              {facility.capacity_or_specs && (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#FAFAF7] border border-[#E5E8E6] text-xs font-mono text-[#242A28]">
                  <Sparkles className="h-4 w-4 text-[#174C40] shrink-0" />
                  <span>
                    <strong className="text-[#174C40]">Specifications:</strong>{' '}
                    {facility.capacity_or_specs}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Contact & Location Card */}
            <div className="lg:col-span-4 rounded-2xl border border-[#E5E8E6] bg-[#FAFAF7] p-6 sm:p-7 space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E5E8E6] pb-3">
                <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#77817C]">
                  Facility Location & Help Desk
                </p>
                <Building2 className="h-4 w-4 text-[#174C40]" />
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#77817C] font-mono uppercase tracking-wider">
                      Campus Floor & Wing
                    </p>
                    <p className="text-[#242A28] font-medium mt-0.5">{facility.floor_location}</p>
                    {facility.access_notes && (
                      <p className="text-xs text-[#77817C] mt-1 leading-normal">
                        {facility.access_notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#77817C] font-mono uppercase tracking-wider">
                      Operating Schedule
                    </p>
                    <p className="text-[#242A28] font-medium mt-0.5">{facility.availability}</p>
                  </div>
                </div>

                {facility.contact_phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-[#77817C] font-mono uppercase tracking-wider">
                        Direct Desk / Extension
                      </p>
                      <a
                        href={`tel:${facility.contact_phone.split('·')[0].trim()}`}
                        className="text-[#174C40] font-medium hover:underline mt-0.5 block"
                      >
                        {facility.contact_phone}
                      </a>
                    </div>
                  </div>
                )}

                {facility.contact_email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-[#77817C] font-mono uppercase tracking-wider">
                        Email Inquiry
                      </p>
                      <a
                        href={`mailto:${facility.contact_email}`}
                        className="text-[#4A5350] hover:text-[#174C40] transition-colors mt-0.5 block break-all text-xs"
                      >
                        {facility.contact_email}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#E5E8E6] flex flex-col gap-2.5">
                {facility.contact_phone && (
                  <a
                    href={`tel:${facility.contact_phone.split('·')[0].trim()}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#242A28] text-white text-xs font-medium hover:bg-[#174C40] transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call Facility Desk
                  </a>
                )}
                <Link
                  href="/contact"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#E5E8E6] bg-white text-[#242A28] text-xs font-medium hover:border-[#242A28] transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5 text-[#174C40]" />
                  View Campus Map & Directions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="container-editorial py-14 lg:py-18 space-y-12">
        {/* Architectural and Clinical Highlights */}
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-8 sm:p-10 space-y-6">
          <div className="flex items-center gap-2.5 text-[#174C40]">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="font-editorial text-2xl sm:text-3xl text-[#242A28]">
              Key Infrastructure & Equipment Highlights
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#4A5350] leading-relaxed max-w-3xl">
            Healix campus infrastructure is architected for strict aseptic control, continuous
            positive/negative airflow regulation, acoustic peace, and intuitive patient accessibility.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {facility.highlights.map((highlight, index) => (
              <div
                key={index}
                className="flex items-start gap-3.5 p-4 rounded-xl bg-[#FAFAF7] border border-[#E5E8E6]"
              >
                <div className="h-6 w-6 rounded-full bg-[#E6EFE9] text-[#174C40] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                </div>
                <span className="text-sm font-medium text-[#242A28] leading-snug">{highlight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Visitor Guidelines and Facility Policies */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {facility.visitor_policy && (
            <div className="rounded-2xl border border-[#E5E8E6] bg-white p-8 space-y-4">
              <div className="flex items-center gap-2 text-[#174C40]">
                <HeartHandshake className="h-5 w-5" />
                <h3 className="font-editorial text-2xl text-[#242A28]">
                  Visitor Policy & Family Access
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-[#4A5350]">{facility.visitor_policy}</p>
              <div className="pt-4 border-t border-[#E5E8E6] text-xs text-[#77817C] flex items-center gap-2">
                <Info className="h-4 w-4 text-[#174C40] shrink-0" />
                <span>
                  Visitor badges are issued at the Ground Floor Concierge Desk upon photo ID check.
                </span>
              </div>
            </div>
          )}

          {facility.guidelines && facility.guidelines.length > 0 && (
            <div className="rounded-2xl border border-[#E5E8E6] bg-white p-8 space-y-4">
              <div className="flex items-center gap-2 text-[#174C40]">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="font-editorial text-2xl text-[#242A28]">
                  Operational & Safety Guidelines
                </h3>
              </div>
              <ul className="space-y-3">
                {facility.guidelines.map((guideline, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#4A5350]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#174C40] mt-2 shrink-0" />
                    <span>{guideline}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Clinical Services Separation Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-[#242A28] to-[#1c2e2e] text-white p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
          <div className="space-y-2 max-w-2xl">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#6ec2b3]">
              Need Medical Attention or Doctor Consultation?
            </span>
            <h3 className="font-editorial text-2xl sm:text-3xl text-white">
              Connect Physical Facilities with Clinical Services
            </h3>
            <p className="text-sm text-[#c8d4d4] leading-relaxed">
              Explore our 11 medical services including OPD, IPD admissions, surgery, emergency trauma care,
              radiology, and diagnostic testing.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-[#242A28] text-xs font-semibold hover:bg-[#E6EFE9] transition-colors"
            >
              Browse Medical Services
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/appointments/book"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-white/20 text-white text-xs font-semibold hover:bg-white/10 transition-colors"
            >
              <CalendarCheck className="h-3.5 w-3.5 text-[#6ec2b3]" />
              Book Appointment
            </Link>
          </div>
        </div>

        {/* Other Facilities */}
        {otherFacilities.length > 0 && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-editorial text-2xl text-[#242A28]">Other Hospital Facilities</h3>
                <p className="text-xs text-[#77817C] mt-1 font-mono uppercase tracking-wider">
                  Campus infrastructure & patient spaces
                </p>
              </div>
              <Link
                href="/facilities"
                className="text-xs font-medium text-[#174C40] hover:underline inline-flex items-center gap-1"
              >
                View all facilities
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {otherFacilities.map((item) => (
                <Link
                  key={item.slug}
                  href={`/facilities/${item.slug}`}
                  className="card-minimal rounded-2xl p-6 flex flex-col justify-between group hover:border-[#174C40] transition-colors"
                >
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E6EFE9] text-[#174C40]">
                      {item.category}
                    </span>
                    <h4 className="font-editorial text-xl text-[#242A28] mt-3 group-hover:text-[#174C40] transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-xs text-[#4A5350] mt-2 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-3 border-t border-[#E5E8E6] flex items-center justify-between text-xs text-[#77817C]">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-[#174C40]" />
                      {item.floor_location}
                    </span>
                    <span className="font-medium text-[#242A28] group-hover:text-[#174C40] inline-flex items-center gap-0.5">
                      Details
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
