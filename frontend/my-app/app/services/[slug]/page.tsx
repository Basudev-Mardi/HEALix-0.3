import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  MapPin,
  Phone,
} from 'lucide-react';
import DoctorAvatar from '@/components/DoctorAvatar';
import { getServiceBySlug, getServices } from '@/lib/api';

export async function generateStaticParams() {
  const services = await getServices();
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return { title: 'Service Not Found' };
  return {
    title: service.name,
    description: service.short_description,
  };
}

export default async function ServiceDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  return (
    <div>
      {/* Header */}
      <section className="border-b border-[#E5E8E6] bg-[#FAFAF7]">
        <div className="container-editorial py-12 lg:py-16">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-xs text-[#77817C] hover:text-[#242A28] mb-8 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Medical Services
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[11px] font-mono uppercase tracking-wider px-3 py-1 rounded-full bg-[#E6EFE9] text-[#174C40]">
                  {service.category}
                </span>
                <Link
                  href={`/departments/${service.department_slug}`}
                  className="text-xs text-[#4A5350] hover:text-[#174C40] transition-colors"
                >
                  {service.department_name}
                </Link>
              </div>
              <h1 className="font-editorial text-4xl sm:text-5xl text-[#242A28] leading-tight">
                {service.name}
              </h1>
              <p className="text-base sm:text-lg leading-relaxed text-[#4A5350] max-w-2xl">
                {service.overview}
              </p>
            </div>

            <div className="lg:col-span-4 rounded-2xl border border-[#E5E8E6] bg-white p-6 space-y-4">
              <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#77817C]">
                Program Logistics
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#77817C]">Estimated Duration</p>
                    <p className="text-[#242A28] font-medium">{service.duration_estimate}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CalendarClock className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#77817C]">Availability</p>
                    <p className="text-[#242A28]">{service.availability}</p>
                  </div>
                </div>
                {service.department_floor && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-[#77817C]">Location</p>
                      <p className="text-[#242A28]">{service.department_floor}</p>
                    </div>
                  </div>
                )}
                {service.department_phone && (
                  <div className="flex items-start gap-2.5">
                    <Phone className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-[#77817C]">Department Desk</p>
                      <p className="text-[#242A28] font-mono">{service.department_phone}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-[#E5E8E6] flex flex-col gap-2 text-xs text-[#4A5350]">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-[#174C40]" />
                  Central Scheduling: <span className="font-mono text-[#242A28]">+1 (800) 432-5490</span>
                </div>
                <Link
                  href={`/appointments/book?service=${service.slug}`}
                  className="mt-1 w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#174C40] text-white font-medium hover:bg-[#0c4a4a] transition-colors"
                >
                  <CalendarClock className="h-3.5 w-3.5" />
                  Book Appointment for this Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="container-editorial py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            {/* Key Highlights */}
            <div className="space-y-4">
              <h2 className="font-editorial text-2xl sm:text-3xl text-[#242A28]">
                Program Highlights
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {service.key_features.map((feat) => (
                  <div
                    key={feat}
                    className="rounded-xl border border-[#E5E8E6] bg-white p-5 flex items-start gap-2.5 text-sm text-[#242A28]"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Procedures Included */}
            <div className="space-y-4">
              <h2 className="font-editorial text-2xl sm:text-3xl text-[#242A28]">
                Procedures &amp; Clinical Scope
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {service.procedures.map((proc) => (
                  <li
                    key={proc}
                    className="rounded-xl border border-[#E5E8E6] bg-white px-5 py-4 text-sm text-[#242A28]"
                  >
                    {proc}
                  </li>
                ))}
              </ul>
            </div>

            {/* Preparation Notes */}
            <div className="rounded-2xl border border-[#E5E8E6] bg-[#E6EFE9]/70 p-8 space-y-3">
              <h2 className="text-base font-semibold text-[#242A28] flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-[#174C40]" />
                Patient Preparation Guidelines
              </h2>
              <p className="text-sm leading-relaxed text-[#4A5350]">{service.preparation_notes}</p>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            {service.specialists && service.specialists.length > 0 && (
              <div className="rounded-2xl border border-[#E5E8E6] bg-white p-6 space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-[0.14em] text-[#77817C]">
                  Lead Specialists
                </h3>
                <div className="space-y-3">
                  {service.specialists.map((doc) => (
                    <Link
                      key={doc.slug}
                      href={`/doctors/${doc.slug}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FAFAF7] transition-colors group"
                    >
                      <DoctorAvatar
                        initials={doc.avatar_initials}
                        tone={doc.accent_tone}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#242A28] group-hover:text-[#174C40] truncate">
                          {doc.name}
                        </p>
                        <p className="text-xs text-[#77817C] truncate">{doc.specialty}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {service.relatedServices && service.relatedServices.length > 0 && (
              <div className="rounded-2xl border border-[#E5E8E6] bg-white p-6 space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-[0.14em] text-[#77817C]">
                  Other Medical Services
                </h3>
                <div className="space-y-3">
                  {service.relatedServices.map((rel) => (
                    <Link
                      key={rel.slug}
                      href={`/services/${rel.slug}`}
                      className="block rounded-xl border border-[#E5E8E6] p-4 hover:border-[#174C40] transition-colors group"
                    >
                      <p className="text-sm font-medium text-[#242A28] group-hover:text-[#174C40] flex items-center justify-between gap-2">
                        {rel.name}
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                      </p>
                      <p className="text-xs text-[#77817C] mt-1">{rel.category}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
