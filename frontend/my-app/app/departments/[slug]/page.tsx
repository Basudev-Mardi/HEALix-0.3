import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Cpu,
  HeartPulse,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Video,
} from 'lucide-react';
import DepartmentIcon from '@/components/DepartmentIcon';
import DoctorAvatar from '@/components/DoctorAvatar';
import { getDepartmentBySlug, getDepartments } from '@/lib/api';

export async function generateStaticParams() {
  const departments = await getDepartments();
  return departments.map((dept) => ({ slug: dept.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dept = await getDepartmentBySlug(slug);
  if (!dept) return { title: 'Department Not Found | Healix Hospital' };
  return {
    title: `${dept.name} | Healix Hospital`,
    description: dept.short_description,
  };
}

export default async function DepartmentDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [dept, allDepartments] = await Promise.all([
    getDepartmentBySlug(slug),
    getDepartments(),
  ]);

  if (!dept) {
    notFound();
  }

  // Related departments for collaborative care
  const relatedDepartments = allDepartments
    .filter((d) => d.slug !== slug)
    .slice(0, 3);

  return (
    <div className="bg-[#FAFAF7] text-[#242A28] min-h-screen">
      {/* 01. Top Breadcrumb & Department Visual Banner */}
      <section className="border-b border-[#E5E8E6] bg-white">
        <div className="container-editorial py-12 lg:py-16">
          <Link
            href="/departments"
            className="inline-flex items-center gap-1.5 text-xs text-[#77817C] hover:text-[#242A28] mb-8 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to All Departments
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Visual Hero & Overview */}
            <div className="lg:col-span-8 space-y-6">
              {/* Department Image & Visual Identity Banner (rendered programmatically, no external downloads) */}
              <div className="rounded-3xl border border-[#E5E8E6] bg-gradient-to-br from-[#E6EFE9] via-white to-[#f5f8f8] p-8 sm:p-10 relative overflow-hidden shadow-xs">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#174C40] text-white flex items-center justify-center shadow-sm">
                    <DepartmentIcon name={dept.icon} className="h-8 w-8" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 backdrop-blur-xs border border-[#E5E8E6] text-xs font-mono text-[#174C40] font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Center of Excellence
                  </span>
                </div>

                <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40] block mb-2">
                  Clinical Institute
                </span>
                <h1 className="font-editorial text-4xl sm:text-5xl text-[#242A28] leading-tight mb-4">
                  {dept.name}
                </h1>
                <p className="text-base sm:text-lg leading-relaxed text-[#4A5350] font-light max-w-2xl">
                  {dept.overview}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-[#E5E8E6]/70 mt-6">
                  {dept.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full text-xs bg-white border border-[#E5E8E6] text-[#242A28] font-medium"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Department Quick Info, Consultation, Operating Hours & Appointment CTA Card */}
            <div className="lg:col-span-4 rounded-3xl border border-[#E5E8E6] bg-[#FAFAF7] p-7 space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#E5E8E6] pb-3">
                <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#174C40] font-semibold">
                  Department Information
                </p>
                <span className="text-[11px] font-mono text-neutral-500">Suite Ready</span>
              </div>

              <div className="space-y-3.5 text-xs text-[#4A5350]">
                <div className="flex items-start gap-2.5">
                  <Stethoscope className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-[#242A28] block font-medium">Department Chair</strong>
                    <span>{dept.head_doctor_name}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-[#242A28] block font-medium">Campus Location</strong>
                    <span>{dept.floor_location}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <BedDouble className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-[#242A28] block font-medium">Dedicated Capacity</strong>
                    <span>{dept.beds_allocated} Specialized Inpatient &amp; ICU Beds</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-[#242A28] block font-medium">Operating Hours</strong>
                    <span>OPD Consults: Mon &ndash; Sat, 08:00 AM &ndash; 08:00 PM</span>
                    <span className="block text-emerald-800 font-medium mt-0.5">
                      Emergency &amp; Acute Care: 24/7/365
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Video className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-[#242A28] block font-medium">Consultation Options</strong>
                    <span>In-Person Outpatient Clinic &amp; Telehealth Tele-consultation</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-[#242A28] block font-medium">Direct Extension</strong>
                    <span className="font-mono text-[#242A28]">+1 (800) 432-5490 &bull; {dept.phone_ext}</span>
                  </div>
                </div>
              </div>

              {/* Appointment CTA */}
              <div className="pt-4 border-t border-[#E5E8E6]">
                <Link
                  href={`/appointments/book?department=${dept.slug}`}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#174C40] text-white text-xs font-semibold hover:bg-[#0c4a4a] transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <Calendar className="h-4 w-4" />
                  Book Department Consultation
                </Link>
                <p className="text-[11px] text-center text-[#77817C] mt-2">
                  Standard consultation fee: $180 &ndash; $240 (Cashless TPA covered)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 02. Conditions Treated & Available Facilities / Equipment */}
      <section className="container-editorial py-16 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Conditions Treated */}
          <div className="rounded-3xl border border-[#E5E8E6] bg-white p-8 space-y-5 shadow-xs">
            <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#174C40] block">
              Clinical Scope
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl text-[#242A28]">
              Conditions Treated
            </h2>
            <p className="text-xs text-[#77817C] leading-relaxed font-light">
              Our multidisciplinary clinical board provides comprehensive diagnosis and personalized treatment pathways for:
            </p>
            <ul className="space-y-3 pt-1">
              {dept.conditions_treated.map((cond) => (
                <li key={cond} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#242A28]">
                  <Check className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
                  <span>{cond}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Available Facilities & Equipment */}
          <div className="rounded-3xl border border-[#E5E8E6] bg-white p-8 space-y-5 shadow-xs">
            <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#174C40] block">
              Dedicated Units &amp; Technology
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl text-[#242A28] flex items-center gap-2.5">
              <Cpu className="h-5 w-5 text-[#174C40]" />
              Available Facilities &amp; Equipment
            </h2>
            <p className="text-xs text-[#77817C] leading-relaxed font-light">
              Fully integrated sterile facilities operating in accordance with ISO Class 5 air handling and continuous hemodynamic telemetry:
            </p>
            <ul className="space-y-3 pt-1">
              {dept.equipment.map((eq) => (
                <li
                  key={eq}
                  className="rounded-xl border border-[#E5E8E6] bg-[#FAFAF7] p-3.5 text-xs sm:text-sm text-[#242A28] flex items-center justify-between"
                >
                  <span className="font-medium">{eq}</span>
                  <span className="text-[10px] font-mono text-[#174C40] bg-teal-50 px-2 py-0.5 rounded-md">
                    Active &amp; Calibrated
                  </span>
                </li>
              ))}
              <li className="rounded-xl border border-[#E5E8E6] bg-[#FAFAF7] p-3.5 text-xs sm:text-sm text-[#242A28] flex items-center justify-between">
                <span className="font-medium">{dept.beds_allocated} Single-Occupancy Telemetry Beds</span>
                <span className="text-[10px] font-mono text-[#174C40] bg-teal-50 px-2 py-0.5 rounded-md">
                  Acoustic Insulated
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* 03. Associated Faculty Doctors */}
        {dept.doctors && dept.doctors.length > 0 && (
          <div className="space-y-6 pt-4 border-t border-[#E5E8E6]">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#174C40] block mb-1">
                  Department Faculty
                </span>
                <h2 className="font-editorial text-3xl text-[#242A28]">
                  Associated Specialists &amp; Surgeons
                </h2>
              </div>
              <Link
                href="/doctors"
                className="text-xs font-medium text-[#174C40] hover:underline inline-flex items-center gap-1"
              >
                Full doctors directory &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {dept.doctors.map((doc) => (
                <div
                  key={doc.slug}
                  className="card-minimal rounded-2xl p-6 flex flex-col justify-between group shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <DoctorAvatar initials={doc.avatar_initials} tone={doc.accent_tone} size="md" />
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#FAFAF7] border border-[#E5E8E6] text-[#77817C]">
                        {doc.experience_years} yrs exp
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-[#242A28] group-hover:text-[#174C40] transition-colors font-editorial">
                      {doc.name}
                    </h3>
                    <p className="text-xs text-[#174C40] font-medium mt-0.5">{doc.specialty}</p>
                    <p className="text-xs text-[#77817C] mt-1">{doc.qualification}</p>
                    <p className="text-xs text-[#4A5350] mt-3 line-clamp-2 font-light">
                      {doc.bio}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#E5E8E6] flex items-center justify-between text-xs">
                    <Link
                      href={`/doctors/${doc.slug}`}
                      className="text-[#242A28] font-medium hover:text-[#174C40] inline-flex items-center gap-1"
                    >
                      View Profile <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href={`/appointments/book?doctor=${doc.slug}`}
                      className="px-3.5 py-1.5 rounded-lg bg-[#174C40] text-white font-medium hover:bg-[#0c4a4a] transition-colors"
                    >
                      Book Visit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 04. Medical Services Provided */}
        {dept.services && dept.services.length > 0 && (
          <div className="space-y-6 pt-4 border-t border-[#E5E8E6]">
            <div>
              <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#174C40] block mb-1">
                Clinical Programs
              </span>
              <h2 className="font-editorial text-3xl text-[#242A28]">
                Medical Services Provided
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {dept.services.map((srv) => (
                <Link
                  key={srv.slug}
                  href={`/services/${srv.slug}`}
                  className="card-minimal rounded-2xl p-6 space-y-3 group shadow-xs hover:border-[#174C40] transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#174C40] bg-[#E6EFE9] px-2.5 py-1 rounded-full">
                      {srv.category}
                    </span>
                    <span className="text-xs font-mono text-[#77817C]">{srv.duration_estimate}</span>
                  </div>
                  <h3 className="text-lg font-medium text-[#242A28] group-hover:text-[#174C40] transition-colors font-editorial">
                    {srv.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4A5350] leading-relaxed font-light">
                    {srv.short_description}
                  </p>
                  <div className="pt-2 flex items-center justify-between text-xs text-[#174C40] font-medium">
                    <span>Program Details</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 05. Related Departments for Collaborative Care */}
        {relatedDepartments.length > 0 && (
          <div className="space-y-6 pt-4 border-t border-[#E5E8E6]">
            <div>
              <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#174C40] block mb-1">
                Multidisciplinary Network
              </span>
              <h2 className="font-editorial text-3xl text-[#242A28]">
                Related Clinical Departments
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {relatedDepartments.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/departments/${rel.slug}`}
                  className="rounded-2xl border border-[#E5E8E6] bg-white p-6 hover:border-[#174C40] transition-all group shadow-xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#174C40] mb-3">
                    <DepartmentIcon name={rel.icon} className="h-5 w-5" />
                  </div>
                  <h3 className="font-editorial text-lg text-[#242A28] font-medium group-hover:text-[#174C40] transition-colors">
                    {rel.name}
                  </h3>
                  <p className="text-xs text-[#77817C] mt-1 line-clamp-2">
                    {rel.short_description}
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#E5E8E6] text-[11px] font-mono text-[#4A5350] flex items-center justify-between">
                    <span>{rel.floor_location}</span>
                    <span className="text-[#174C40]">Explore &rarr;</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
