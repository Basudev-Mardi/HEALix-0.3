import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  BedDouble,
  Check,
  Cpu,
  MapPin,
  Phone,
  Stethoscope,
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
  if (!dept) return { title: 'Department Not Found' };
  return {
    title: dept.name,
    description: dept.short_description,
  };
}

export default async function DepartmentDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dept = await getDepartmentBySlug(slug);

  if (!dept) {
    notFound();
  }

  return (
    <div>
      {/* Header */}
      <section className="border-b border-[#e6e4dd] bg-[#faf9f6]">
        <div className="container-editorial py-12 lg:py-16">
          <Link
            href="/departments"
            className="inline-flex items-center gap-1.5 text-xs text-[#768086] hover:text-[#14181a] mb-8 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Departments
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-8 space-y-5">
              <div className="inline-flex items-center gap-3">
                <span className="h-12 w-12 rounded-xl bg-[#edf5f4] text-[#0f5c5c] flex items-center justify-center">
                  <DepartmentIcon name={dept.icon} className="h-6 w-6" />
                </span>
                <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#0f5c5c]">
                  Clinical Department
                </span>
              </div>

              <h1 className="font-editorial text-4xl sm:text-5xl text-[#14181a] leading-tight">
                {dept.name}
              </h1>
              <p className="text-base sm:text-lg leading-relaxed text-[#4b555b] max-w-2xl">
                {dept.overview}
              </p>
            </div>

            <div className="lg:col-span-4 rounded-2xl border border-[#e6e4dd] bg-white p-6 space-y-4">
              <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#768086]">
                Department Information
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2.5">
                  <Stethoscope className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#768086]">Department Chair</p>
                    <p className="text-[#14181a] font-medium">{dept.head_doctor_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#768086]">Campus Wing</p>
                    <p className="text-[#14181a]">{dept.floor_location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <BedDouble className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#768086]">Dedicated Capacity</p>
                    <p className="text-[#14181a]">{dept.beds_allocated} Specialized Beds</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#768086]">Direct Extension</p>
                    <p className="font-mono text-[#14181a]">+1 (800) 432-5490 · {dept.phone_ext}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conditions & Equipment */}
      <section className="container-editorial py-16 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-[#e6e4dd] bg-white p-8 space-y-5">
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c]">
              Clinical Focus
            </p>
            <h2 className="font-editorial text-2xl sm:text-3xl text-[#14181a]">
              Conditions Treated
            </h2>
            <ul className="space-y-3">
              {dept.conditions_treated.map((cond) => (
                <li key={cond} className="flex items-start gap-2.5 text-sm text-[#14181a]">
                  <Check className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
                  <span>{cond}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[#e6e4dd] bg-white p-8 space-y-5">
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c]">
              Technology &amp; Instrumentation
            </p>
            <h2 className="font-editorial text-2xl sm:text-3xl text-[#14181a] flex items-center gap-2.5">
              <Cpu className="h-5 w-5 text-[#0f5c5c]" />
              Dedicated Equipment
            </h2>
            <ul className="space-y-3">
              {dept.equipment.map((eq) => (
                <li
                  key={eq}
                  className="rounded-xl border border-[#e6e4dd] bg-[#faf9f6] px-4 py-3 text-sm text-[#14181a]"
                >
                  {eq}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Specialists in this Department */}
        {dept.doctors && dept.doctors.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c]">
                  Faculty
                </p>
                <h2 className="font-editorial text-3xl text-[#14181a] mt-1">
                  Department Specialists
                </h2>
              </div>
              <Link href="/doctors" className="text-xs font-medium text-[#0f5c5c] hover:underline">
                View all doctors
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {dept.doctors.map((doc) => (
                <Link
                  key={doc.slug}
                  href={`/doctors/${doc.slug}`}
                  className="card-minimal rounded-2xl p-6 flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <DoctorAvatar initials={doc.avatar_initials} tone={doc.accent_tone} />
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-[#14181a] group-hover:text-[#0f5c5c] truncate">
                        {doc.name}
                      </h3>
                      <p className="text-xs text-[#0f5c5c] truncate">{doc.specialty}</p>
                      <p className="text-xs text-[#768086] mt-0.5">{doc.qualification}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-[#768086] group-hover:text-[#14181a] shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Services in this Department */}
        {dept.services && dept.services.length > 0 && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c]">
                Clinical Programs
              </p>
              <h2 className="font-editorial text-3xl text-[#14181a] mt-1">
                Available Medical Services
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {dept.services.map((srv) => (
                <Link
                  key={srv.slug}
                  href={`/services/${srv.slug}`}
                  className="card-minimal rounded-2xl p-6 space-y-3 group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#0f5c5c]">
                      {srv.category}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-[#768086] group-hover:text-[#14181a]" />
                  </div>
                  <h3 className="text-lg font-medium text-[#14181a] group-hover:text-[#0f5c5c]">
                    {srv.name}
                  </h3>
                  <p className="text-sm text-[#4b555b]">{srv.short_description}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
