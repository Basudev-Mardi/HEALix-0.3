import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Clock,
  Phone,
  ShieldCheck,
  Siren,
  Stethoscope,
} from 'lucide-react';
import DepartmentIcon from '@/components/DepartmentIcon';
import DoctorAvatar from '@/components/DoctorAvatar';
import { getHomeData } from '@/lib/api';

export default async function HomePage() {
  const { hospital, departments, featuredDoctors, featuredServices, infrastructureHighlights } =
    await getHomeData();

  return (
    <div>
      {/* Editorial Hero */}
      <section className="border-b border-[#e6e4dd]">
        <div className="container-editorial py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-8 space-y-7">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[#e6e4dd] bg-white text-xs text-[#4b555b]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0f5c5c]" />
                <span className="font-mono uppercase tracking-[0.12em] text-[11px] text-[#0f5c5c]">
                  {hospital.accreditation}
                </span>
                <span className="text-[#d5d2c9]">·</span>
                <span>Est. {hospital.founded_year}</span>
              </div>

              <h1 className="font-editorial text-5xl sm:text-6xl lg:text-[68px] leading-[1.03] tracking-[-0.025em] text-[#14181a]">
                Precision clinical care,
                <span className="block italic text-[#0f5c5c]">designed around calm.</span>
              </h1>

              <p className="text-lg sm:text-xl leading-relaxed text-[#4b555b] max-w-2xl">
                {hospital.about_summary}
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/doctors"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#14181a] text-white text-sm font-medium hover:bg-[#0f5c5c] transition-colors"
                >
                  Explore Doctors
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/departments"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-[#d5d2c9] bg-white text-[#14181a] text-sm font-medium hover:border-[#14181a] transition-colors"
                >
                  Clinical Departments
                </Link>
                <Link
                  href="/emergency"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full text-sm font-medium text-[#b91c1c] hover:bg-[#fef2f2] transition-colors"
                >
                  <Siren className="h-4 w-4" />
                  24/7 Emergency
                </Link>
              </div>
            </div>

            {/* Right Minimalist Info Card */}
            <div className="lg:col-span-4">
              <div className="rounded-2xl border border-[#e6e4dd] bg-white p-7 space-y-6">
                <div className="flex items-center justify-between border-b border-[#e6e4dd] pb-4">
                  <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#768086]">
                    Patient Access
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#0f5c5c] font-medium">
                    <span className="h-2 w-2 rounded-full bg-[#0f5c5c]" />
                    Open 24/7
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Siren className="h-4 w-4 text-[#b91c1c] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-[#768086]">Emergency &amp; Trauma</p>
                      <p className="font-mono text-sm font-medium text-[#14181a]">
                        {hospital.emergency_phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-[#768086]">General Reception</p>
                      <p className="font-mono text-sm font-medium text-[#14181a]">
                        {hospital.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-[#768086]">Outpatient Clinics</p>
                      <p className="text-sm text-[#14181a]">Mon – Sat, 08:00 AM – 06:00 PM</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#e6e4dd] flex items-center justify-between text-xs">
                  <Link
                    href="/visiting-hours"
                    className="font-medium text-[#0f5c5c] hover:underline inline-flex items-center gap-1"
                  >
                    Visiting Hours
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/facilities"
                    className="text-[#4b555b] hover:text-[#14181a] transition-colors"
                  >
                    Campus Facilities
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Bar */}
          <div className="mt-16 pt-10 border-t border-[#e6e4dd] grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <p className="font-editorial text-4xl text-[#14181a]">{hospital.beds_count}</p>
              <p className="text-xs font-mono uppercase tracking-[0.12em] text-[#768086] mt-1">
                Private &amp; ICU Beds
              </p>
            </div>
            <div>
              <p className="font-editorial text-4xl text-[#14181a]">{hospital.doctors_count}+</p>
              <p className="text-xs font-mono uppercase tracking-[0.12em] text-[#768086] mt-1">
                Board-Certified Specialists
              </p>
            </div>
            <div>
              <p className="font-editorial text-4xl text-[#14181a]">{hospital.specialties_count}</p>
              <p className="text-xs font-mono uppercase tracking-[0.12em] text-[#768086] mt-1">
                Clinical Specialties
              </p>
            </div>
            <div>
              <p className="font-editorial text-4xl text-[#14181a]">{hospital.patients_served}</p>
              <p className="text-xs font-mono uppercase tracking-[0.12em] text-[#768086] mt-1">
                Patients Cared For
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Centers of Excellence (Departments) */}
      <section className="container-editorial py-20 lg:py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#0f5c5c] mb-3">
              Centers of Excellence
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#14181a]">
              Specialized clinical departments
            </h2>
          </div>
          <Link
            href="/departments"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#14181a] hover:text-[#0f5c5c] transition-colors"
          >
            View all departments
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <Link
              key={dept.slug}
              href={`/departments/${dept.slug}`}
              className="card-minimal rounded-2xl p-7 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="h-11 w-11 rounded-xl bg-[#edf5f4] text-[#0f5c5c] flex items-center justify-center">
                    <DepartmentIcon name={dept.icon} className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] font-mono text-[#768086]">{dept.floor_location}</span>
                </div>
                <h3 className="text-lg font-medium text-[#14181a] group-hover:text-[#0f5c5c] transition-colors">
                  {dept.name}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#4b555b]">
                  {dept.short_description}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#e6e4dd] flex items-center justify-between text-xs text-[#768086]">
                <span className="font-mono">{dept.beds_allocated} Dedicated Beds</span>
                <span className="inline-flex items-center gap-1 text-[#14181a] font-medium group-hover:translate-x-0.5 transition-transform">
                  Details
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Medical Services */}
      <section className="border-y border-[#e6e4dd] bg-white">
        <div className="container-editorial py-20 lg:py-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#0f5c5c] mb-3">
                Clinical Programs
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl text-[#14181a]">
                Signature medical services
              </h2>
            </div>
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#14181a] hover:text-[#0f5c5c] transition-colors"
            >
              Browse all services
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {featuredServices.map((service) => (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="rounded-2xl border border-[#e6e4dd] bg-[#faf9f6] hover:bg-white hover:border-[#d5d2c9] p-7 transition-all group"
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#0f5c5c] bg-[#edf5f4] px-2.5 py-1 rounded-full">
                    {service.category}
                  </span>
                  <span className="text-xs font-mono text-[#768086]">
                    {service.duration_estimate}
                  </span>
                </div>
                <h3 className="text-xl font-medium text-[#14181a] group-hover:text-[#0f5c5c] transition-colors">
                  {service.name}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#4b555b]">
                  {service.short_description}
                </p>
                <div className="mt-5 flex items-center justify-between text-xs text-[#768086]">
                  <span>{service.department_name}</span>
                  <span className="inline-flex items-center gap-1 text-[#14181a] font-medium">
                    Learn more
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Physicians */}
      <section className="container-editorial py-20 lg:py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#0f5c5c] mb-3">
              Medical Leadership
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#14181a]">
              Specialists who listen first
            </h2>
          </div>
          <Link
            href="/doctors"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#14181a] hover:text-[#0f5c5c] transition-colors"
          >
            Full doctors directory
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredDoctors.map((doctor) => (
            <Link
              key={doctor.slug}
              href={`/doctors/${doctor.slug}`}
              className="card-minimal rounded-2xl p-6 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <DoctorAvatar initials={doctor.avatar_initials} tone={doctor.accent_tone} />
                  <span className="text-[11px] font-mono text-[#768086]">
                    {doctor.experience_years} yrs exp
                  </span>
                </div>
                <h3 className="text-base font-semibold text-[#14181a] group-hover:text-[#0f5c5c] transition-colors">
                  {doctor.name}
                </h3>
                <p className="text-xs text-[#0f5c5c] font-medium mt-0.5">{doctor.specialty}</p>
                <p className="text-xs text-[#768086] mt-1">{doctor.qualification}</p>
              </div>
              <div className="mt-5 pt-4 border-t border-[#e6e4dd] flex items-center justify-between text-xs text-[#4b555b]">
                <span>{doctor.consultation_days}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-[#768086] group-hover:text-[#14181a]" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Architecture & Infrastructure Strip */}
      <section className="border-t border-[#e6e4dd] bg-[#14181a] text-white">
        <div className="container-editorial py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5 space-y-5">
              <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#7cc4bd]">
                Hospital Infrastructure
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl leading-tight">
                Healing architecture built for zero-compromise clinical safety.
              </h2>
              <p className="text-sm leading-relaxed text-[#b5bdbd]">
                From ISO Class 5 modular operating suites to acoustic-insulated daylight recovery
                rooms, every square meter of Healix is engineered to improve outcomes.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/about/infrastructure"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#14181a] text-xs font-medium hover:bg-[#edf5f4] transition-colors"
                >
                  Explore Infrastructure
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/gallery"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 text-white text-xs font-medium hover:border-white/50 transition-colors"
                >
                  View Campus Gallery
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {infrastructureHighlights.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-2"
                >
                  <p className="font-editorial text-3xl text-[#9fd8d2]">{item.metric_value}</p>
                  <p className="text-xs font-mono uppercase tracking-wider text-white/60">
                    {item.metric_label}
                  </p>
                  <p className="text-sm font-medium text-white pt-1">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Navigation Pillars */}
      <section className="container-editorial pt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link href="/about/mission-vision" className="card-minimal rounded-2xl p-7 group">
            <ShieldCheck className="h-5 w-5 text-[#0f5c5c] mb-4" />
            <h3 className="text-base font-semibold text-[#14181a] group-hover:text-[#0f5c5c]">
              Mission, Vision &amp; Values
            </h3>
            <p className="mt-2 text-sm text-[#4b555b]">
              Discover the clinical principles and patient-first transparency guiding Healix.
            </p>
          </Link>
          <Link href="/facilities" className="card-minimal rounded-2xl p-7 group">
            <Building2 className="h-5 w-5 text-[#0f5c5c] mb-4" />
            <h3 className="text-base font-semibold text-[#14181a] group-hover:text-[#0f5c5c]">
              Campus Facilities
            </h3>
            <p className="mt-2 text-sm text-[#4b555b]">
              24/7 pharmacy, automated pathology lab, private recovery suites, and healing gardens.
            </p>
          </Link>
          <Link href="/visiting-hours" className="card-minimal rounded-2xl p-7 group">
            <Stethoscope className="h-5 w-5 text-[#0f5c5c] mb-4" />
            <h3 className="text-base font-semibold text-[#14181a] group-hover:text-[#0f5c5c]">
              Hospital Timings
            </h3>
            <p className="mt-2 text-sm text-[#4b555b]">
              Clear visiting hours for inpatient wards, ICUs, NICU, OPD clinics, and diagnostics.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
