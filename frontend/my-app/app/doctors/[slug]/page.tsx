import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Globe,
  GraduationCap,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Video,
} from 'lucide-react';
import DoctorAvatar from '@/components/DoctorAvatar';
import { getDoctorBySlug, getDoctors } from '@/lib/api';

export async function generateStaticParams() {
  const doctors = await getDoctors();
  return doctors.map((doctor) => ({ slug: doctor.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doctor = await getDoctorBySlug(slug);
  if (!doctor) return { title: 'Doctor Not Found | Healix Hospital' };
  return {
    title: `${doctor.name} — ${doctor.specialty} | Healix Hospital`,
    description: doctor.bio,
  };
}

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doctor = await getDoctorBySlug(slug);

  if (!doctor) {
    notFound();
  }

  return (
    <div className="bg-[#FAFAF7] text-[#242A28] min-h-screen">
      {/* 01. Top Breadcrumb & Profile Header */}
      <section className="border-b border-[#E5E8E6] bg-white">
        <div className="container-editorial py-12 lg:py-16">
          <Link
            href="/doctors"
            className="inline-flex items-center gap-1.5 text-xs text-[#77817C] hover:text-[#242A28] mb-8 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Doctors Directory
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Basic Profile Left Column */}
            <div className="lg:col-span-8 flex flex-col sm:flex-row items-start gap-6">
              <DoctorAvatar initials={doctor.avatar_initials} tone={doctor.accent_tone} size="lg" />
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/departments/${doctor.department_slug}`}
                    className="inline-block text-xs font-mono uppercase tracking-[0.14em] text-[#174C40] hover:underline"
                  >
                    {doctor.department_name}
                  </Link>
                  <span className="text-[#77817C]">&bull;</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    Authorized Personnel Verified
                  </span>
                </div>

                <h1 className="font-editorial text-4xl sm:text-5xl text-[#242A28] leading-tight">
                  {doctor.name}
                </h1>
                <p className="text-base text-[#4A5350] font-medium">{doctor.title}</p>
                <p className="text-sm text-[#174C40] font-medium">{doctor.specialty}</p>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#77817C]">
                  <span className="px-3 py-1 rounded-full bg-[#FAFAF7] border border-[#E5E8E6] text-[#242A28] font-mono">
                    {doctor.qualification}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#FAFAF7] border border-[#E5E8E6]">
                    {doctor.experience_years} Years Clinical Experience
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-[#174C40]" />
                    Languages: {doctor.languages.join(', ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Consultation, Schedule & CTA Card */}
            <div className="lg:col-span-4 rounded-2xl border border-[#E5E8E6] bg-[#FAFAF7] p-6 space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#E5E8E6] pb-3">
                <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#174C40] font-semibold">
                  Consultation Details
                </p>
                <span className="text-[11px] font-mono text-neutral-500">Live Slots</span>
              </div>

              <div className="space-y-3.5 text-xs text-[#4A5350]">
                <div className="flex items-start gap-2.5">
                  <Calendar className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-[#242A28] block font-medium">Clinic Days</strong>
                    <span>{doctor.consultation_days}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-[#242A28] block font-medium">Daily Schedule</strong>
                    <span>{doctor.consultation_hours}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-[#242A28] block font-medium">Hospital Location &amp; Room</strong>
                    <span>
                      {doctor.department_floor || 'Main Clinical Tower, Floor 4'}, Consultation Suite 402
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Video className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-[#242A28] block font-medium">Appointment Types</strong>
                    <span>In-Person Outpatient &amp; Telehealth Video Follow-up</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E8E6] flex items-center justify-between text-xs">
                <span className="text-[#77817C]">Consultation Fee</span>
                <span className="font-mono text-base font-bold text-[#242A28]">
                  {doctor.consultation_fee}
                </span>
              </div>

              <Link
                href={`/appointments/book?doctor=${doctor.slug}`}
                className="block text-center w-full py-3.5 px-4 rounded-xl bg-[#174C40] text-white text-xs font-semibold hover:bg-[#0c4a4a] transition-all shadow-xs"
              >
                Book Appointment with {doctor.name.split(' ').slice(0, 2).join(' ')}
              </Link>

              <div className="pt-1 text-[11px] text-[#77817C] flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-[#174C40]" />
                  Direct Desk: {doctor.department_phone || 'Ext. 4100'}
                </span>
                <span>Room 402</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 02. Detailed Biography, Specialization, Qualifications */}
      <section className="container-editorial py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            {/* Professional Biography */}
            <div className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40] block">
                Professional Introduction
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl text-[#242A28]">
                Clinical Biography
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-[#4A5350] font-light">
                {doctor.bio}
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-[#4A5350] font-light">
                As an active participant in Healix&apos;s weekly multidisciplinary medical board, {doctor.name} collaborates with diagnostic radiologists, surgical directors, and nursing managers to ensure comprehensive, personalized care pathways for every referred case.
              </p>
            </div>

            {/* Specialization & Clinical Focus */}
            <div className="space-y-4 pt-4 border-t border-[#E5E8E6]">
              <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40] block">
                Clinical Focus
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl text-[#242A28]">
                Areas of Expertise &amp; Specialization
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  `Complex diagnostic evaluation in ${doctor.specialty}`,
                  'Minimally invasive and outpatient interventions',
                  'Multidisciplinary pre-operative and second opinion reviews',
                  'Post-acute rehabilitation and longitudinal health monitoring',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white border border-[#E5E8E6]">
                    <CheckCircle2 className="w-4 h-4 text-[#174C40] shrink-0 mt-0.5" />
                    <span className="text-xs text-[#242A28] leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Qualifications & Degrees */}
            <div className="space-y-4 pt-4 border-t border-[#E5E8E6]">
              <h2 className="font-editorial text-2xl sm:text-3xl text-[#242A28] flex items-center gap-2.5">
                <GraduationCap className="h-5 w-5 text-[#174C40]" />
                Qualifications &amp; Academic Credentials
              </h2>
              <ul className="space-y-3">
                {doctor.education.map((item, idx) => (
                  <li
                    key={idx}
                    className="rounded-xl border border-[#E5E8E6] bg-white px-5 py-4 text-xs sm:text-sm text-[#242A28] flex items-center justify-between"
                  >
                    <span>{item}</span>
                    <span className="text-xs font-mono text-[#174C40]">Verified Board Credential</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Honors & Distinctions */}
            {doctor.awards && doctor.awards.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-[#E5E8E6]">
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#242A28] flex items-center gap-2.5">
                  <Award className="h-5 w-5 text-[#174C40]" />
                  Honors, Distinctions &amp; Fellowships
                </h2>
                <ul className="space-y-3">
                  {doctor.awards.map((award, idx) => (
                    <li
                      key={idx}
                      className="rounded-xl border border-[#E5E8E6] bg-[#E6EFE9]/60 px-5 py-4 text-xs sm:text-sm text-[#242A28]"
                    >
                      {award}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar: Department Services & Colleagues */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Department Context */}
            <div className="rounded-2xl border border-[#E5E8E6] bg-white p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-mono uppercase tracking-[0.14em] text-[#77817C]">
                Associated Department
              </h3>
              <div>
                <h4 className="font-editorial text-xl text-[#242A28] font-medium">
                  {doctor.department_name}
                </h4>
                <p className="text-xs text-[#77817C] mt-1">
                  Location: {doctor.department_floor || 'Main Clinical Tower'}
                </p>
              </div>
              <Link
                href={`/departments/${doctor.department_slug}`}
                className="inline-flex items-center gap-1.5 text-xs text-[#174C40] font-medium hover:underline"
              >
                View Department Overview
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Department Services */}
            {doctor.departmentServices && doctor.departmentServices.length > 0 && (
              <div className="rounded-2xl border border-[#E5E8E6] bg-white p-6 space-y-4 shadow-xs">
                <h3 className="text-xs font-mono uppercase tracking-[0.14em] text-[#77817C]">
                  Department Medical Services
                </h3>
                <div className="space-y-3">
                  {doctor.departmentServices.map((srv) => (
                    <Link
                      key={srv.slug}
                      href={`/services/${srv.slug}`}
                      className="block rounded-xl border border-[#E5E8E6] p-4 hover:border-[#174C40] transition-colors group"
                    >
                      <p className="text-sm font-medium text-[#242A28] group-hover:text-[#174C40] flex items-center justify-between">
                        {srv.name}
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                      </p>
                      <p className="text-xs text-[#77817C] mt-1">{srv.duration_estimate}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Department Colleagues */}
            {doctor.relatedDoctors && doctor.relatedDoctors.length > 0 && (
              <div className="rounded-2xl border border-[#E5E8E6] bg-white p-6 space-y-4 shadow-xs">
                <h3 className="text-xs font-mono uppercase tracking-[0.14em] text-[#77817C]">
                  Colleagues in {doctor.department_name}
                </h3>
                <div className="space-y-3">
                  {doctor.relatedDoctors.map((colleague) => (
                    <Link
                      key={colleague.slug}
                      href={`/doctors/${colleague.slug}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FAFAF7] transition-colors group"
                    >
                      <DoctorAvatar
                        initials={colleague.avatar_initials}
                        tone={colleague.accent_tone}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#242A28] group-hover:text-[#174C40] truncate">
                          {colleague.name}
                        </p>
                        <p className="text-xs text-[#77817C] truncate">{colleague.specialty}</p>
                      </div>
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
