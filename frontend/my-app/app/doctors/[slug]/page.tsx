import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  Calendar,
  Clock,
  Globe,
  GraduationCap,
  MapPin,
  Phone,
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
  if (!doctor) return { title: 'Doctor Not Found' };
  return {
    title: `${doctor.name} — ${doctor.specialty}`,
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
    <div>
      {/* Top Profile Header */}
      <section className="border-b border-[#e6e4dd] bg-[#faf9f6]">
        <div className="container-editorial py-12 lg:py-16">
          <Link
            href="/doctors"
            className="inline-flex items-center gap-1.5 text-xs text-[#768086] hover:text-[#14181a] mb-8 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Doctors Directory
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-8 flex flex-col sm:flex-row items-start gap-6">
              <DoctorAvatar initials={doctor.avatar_initials} tone={doctor.accent_tone} size="lg" />
              <div className="space-y-2.5">
                <Link
                  href={`/departments/${doctor.department_slug}`}
                  className="inline-block text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c] hover:underline"
                >
                  {doctor.department_name}
                </Link>
                <h1 className="font-editorial text-4xl sm:text-5xl text-[#14181a] leading-tight">
                  {doctor.name}
                </h1>
                <p className="text-base text-[#4b555b]">{doctor.title}</p>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#768086]">
                  <span className="px-3 py-1 rounded-full bg-white border border-[#e6e4dd] text-[#14181a] font-mono">
                    {doctor.qualification}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white border border-[#e6e4dd]">
                    {doctor.experience_years} Years Experience
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-[#0f5c5c]" />
                    {doctor.languages.join(', ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Consultation Card */}
            <div className="lg:col-span-4 rounded-2xl border border-[#e6e4dd] bg-white p-6 space-y-4">
              <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#0f5c5c]">
                Consultation Schedule
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2.5">
                  <Calendar className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#768086]">Clinic Days</p>
                    <p className="text-[#14181a] font-medium">{doctor.consultation_days}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#768086]">Hours</p>
                    <p className="text-[#14181a]">{doctor.consultation_hours}</p>
                  </div>
                </div>
                {doctor.department_floor && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-[#768086]">Location</p>
                      <p className="text-[#14181a]">{doctor.department_floor}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-[#e6e4dd] flex items-center justify-between text-xs">
                <span className="text-[#768086]">Standard Consultation</span>
                <span className="font-mono text-sm font-semibold text-[#14181a]">
                  {doctor.consultation_fee}
                </span>
              </div>
              <div className="pt-1 text-xs text-[#4b555b] flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-[#0f5c5c]" />
                Call Desk: <span className="font-mono text-[#14181a]">+1 (800) 432-5490</span>
                {doctor.department_phone ? ` (${doctor.department_phone})` : ''}
              </div>
              <Link
                href={`/appointments/book?doctor=${doctor.slug}`}
                className="block text-center w-full mt-2 px-5 py-3 rounded-full bg-[#14181a] text-white text-xs font-medium hover:bg-[#0f5c5c] transition-colors"
              >
                Book Consultation with {doctor.name.split(' ').slice(0, 2).join(' ')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Biography, Education & Awards */}
      <section className="container-editorial py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            <div className="space-y-4">
              <h2 className="font-editorial text-2xl sm:text-3xl text-[#14181a]">
                Clinical Biography
              </h2>
              <p className="text-base leading-relaxed text-[#4b555b]">{doctor.bio}</p>
            </div>

            <div className="space-y-4">
              <h2 className="font-editorial text-2xl sm:text-3xl text-[#14181a] flex items-center gap-2.5">
                <GraduationCap className="h-5 w-5 text-[#0f5c5c]" />
                Education &amp; Training
              </h2>
              <ul className="space-y-3">
                {doctor.education.map((item) => (
                  <li
                    key={item}
                    className="rounded-xl border border-[#e6e4dd] bg-white px-5 py-4 text-sm text-[#14181a]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="font-editorial text-2xl sm:text-3xl text-[#14181a] flex items-center gap-2.5">
                <Award className="h-5 w-5 text-[#0f5c5c]" />
                Honors &amp; Distinctions
              </h2>
              <ul className="space-y-3">
                {doctor.awards.map((award) => (
                  <li
                    key={award}
                    className="rounded-xl border border-[#e6e4dd] bg-[#f2f1ec]/60 px-5 py-4 text-sm text-[#14181a]"
                  >
                    {award}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar: Department Services & Colleagues */}
          <aside className="lg:col-span-4 space-y-8">
            {doctor.departmentServices && doctor.departmentServices.length > 0 && (
              <div className="rounded-2xl border border-[#e6e4dd] bg-white p-6 space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-[0.14em] text-[#768086]">
                  Department Services
                </h3>
                <div className="space-y-3">
                  {doctor.departmentServices.map((srv) => (
                    <Link
                      key={srv.slug}
                      href={`/services/${srv.slug}`}
                      className="block rounded-xl border border-[#e6e4dd] p-4 hover:border-[#0f5c5c] transition-colors group"
                    >
                      <p className="text-sm font-medium text-[#14181a] group-hover:text-[#0f5c5c] flex items-center justify-between">
                        {srv.name}
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                      </p>
                      <p className="text-xs text-[#768086] mt-1">{srv.duration_estimate}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {doctor.relatedDoctors && doctor.relatedDoctors.length > 0 && (
              <div className="rounded-2xl border border-[#e6e4dd] bg-white p-6 space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-[0.14em] text-[#768086]">
                  Colleagues in {doctor.department_name}
                </h3>
                <div className="space-y-3">
                  {doctor.relatedDoctors.map((colleague) => (
                    <Link
                      key={colleague.slug}
                      href={`/doctors/${colleague.slug}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#faf9f6] transition-colors group"
                    >
                      <DoctorAvatar
                        initials={colleague.avatar_initials}
                        tone={colleague.accent_tone}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#14181a] group-hover:text-[#0f5c5c] truncate">
                          {colleague.name}
                        </p>
                        <p className="text-xs text-[#768086] truncate">{colleague.specialty}</p>
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
