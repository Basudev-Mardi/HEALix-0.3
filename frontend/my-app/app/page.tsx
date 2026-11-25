import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  HeartPulse,
  MapPin,
  Microscope,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  Star,
  Stethoscope,
  UserCheck,
} from 'lucide-react';
import DepartmentIcon from '@/components/DepartmentIcon';
import DoctorAvatar from '@/components/DoctorAvatar';
import { getHomeData } from '@/lib/api';
import { getHealthArticles, getHealthPackages } from '@/lib/support-api';

export default async function HomePage() {
  const { hospital, departments, featuredDoctors, featuredServices, infrastructureHighlights } =
    await getHomeData();
  const [healthPackages, healthArticles] = await Promise.all([
    getHealthPackages(),
    getHealthArticles(),
  ]);

  const featuredPackages = healthPackages.slice(0, 3);
  const recentArticles = healthArticles.slice(0, 3);

  const testimonials = [
    {
      id: 't-1',
      patient_name: 'Arthur P. Jenkins',
      treatment: 'Robotic Cardiac Bypass & Rehabilitation',
      rating: 5,
      quote:
        'The calmness of the Healix surgical team and the serene recovery suite made an otherwise terrifying procedure feel reassuring. My cardiologist explained every step with absolute clarity.',
      consent: 'Consent verified for public educational sharing',
      date: 'October 2026',
    },
    {
      id: 't-2',
      patient_name: 'Elena Rostova',
      treatment: 'Minimally Invasive Joint Replacement',
      rating: 5,
      quote:
        'From day-one physical therapy to the cashless insurance desk settling everything in 40 minutes, Healix operates with remarkable clinical efficiency and genuine warmth.',
      consent: 'Consent verified for public educational sharing',
      date: 'September 2026',
    },
    {
      id: 't-3',
      patient_name: 'Marcus & Sarah Sterling',
      treatment: 'High-Risk Obstetrics & Neonatal Care',
      rating: 5,
      quote:
        'When our daughter required neonatal monitoring, the Level III NICU team was extraordinary. We were kept informed hour by hour in private, acoustic-insulated rooms.',
      consent: 'Consent verified for public educational sharing',
      date: 'November 2026',
    },
  ];

  return (
    <div className="bg-[#FAFAF7] text-[#242A28]">
      {/* 01. Editorial Hero Section - 600-700px height */}
      <section className="border-b border-[#E5E8E6] bg-white/70 backdrop-blur-xs hero-container flex items-center">
        <div className="container-editorial py-16 lg:py-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[#E5E8E6] bg-white text-xs text-[#4A5350] shadow-xs">
                <span className="h-2 w-2 rounded-full bg-[#174C40] animate-pulse" />
                <span className="font-mono uppercase tracking-[0.12em] text-[11px] text-[#174C40] font-semibold">
                  {hospital.accreditation}
                </span>
                <span className="text-[#77817C]">·</span>
                <span>Established {hospital.founded_year}</span>
              </div>

              <h1 className="font-heading text-hero text-[#242A28]">
                Precision clinical care,
                <span className="block text-[#174C40]">designed around calm.</span>
              </h1>

              <p className="text-body-standard text-[#4A5350] max-w-2xl">
                {hospital.about_summary} A 420-bed quaternary academic hospital uniting multidisciplinary expertise, robotic surgical precision, and restorative healing environments.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/appointments/book"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#174C40] text-white text-sm font-medium hover:bg-[#0c4a4a] transition-all shadow-xs"
                >
                  <Calendar className="h-4 w-4" />
                  Book Appointment
                </Link>
                <Link
                  href="/appointments/doctors"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-[#77817C] bg-white text-[#242A28] text-sm font-medium hover:border-[#242A28] transition-colors"
                >
                  <Search className="h-4 w-4 text-[#174C40]" />
                  Find a Doctor
                </Link>
                <Link
                  href="/emergency"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full text-sm font-medium text-[#b91c1c] hover:bg-[#fef2f2] transition-colors"
                >
                  <Siren className="h-4 w-4" />
                  24/7 Emergency Triage
                </Link>
              </div>
            </div>

            {/* Hero Visual Hospital Card & Live Access */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-[#E5E8E6] bg-white p-7 shadow-sm space-y-6 relative overflow-hidden">
                {/* Real Hospital Exterior Photograph */}
                <div className="relative h-48 sm:h-52 -mx-7 -mt-7 mb-4 overflow-hidden rounded-t-3xl border-b border-[#E5E8E6]">
                  <Image
                    src="/images/hospital-exterior.png"
                    alt="Healix Medical Center Quaternary Hospital Exterior & Campus"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                    <span className="text-[11px] font-mono uppercase tracking-wider bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/20">
                      Metro Medical District, Boston
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600/90 text-white text-[11px] font-medium backdrop-blur-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      Open 24/7
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-[#E5E8E6] pb-4">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#77817C] block">
                      Quaternary Medical Campus
                    </span>
                    <h3 className="font-editorial text-xl text-[#242A28]">Healix Medical Center</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#FAFAF7] border border-[#E5E8E6]">
                    <Siren className="h-5 w-5 text-[#b91c1c] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#b91c1c] uppercase tracking-wider">
                        Level I Trauma &amp; Ambulance Hotline
                      </p>
                      <a
                        href={`tel:${hospital.emergency_phone.replace(/[^0-9+]/g, '')}`}
                        className="font-mono text-base font-bold text-[#242A28] hover:underline"
                      >
                        {hospital.emergency_phone}
                      </a>
                      <p className="text-[11px] text-[#77817C] mt-0.5">
                        Direct dispatch &bull; North Gate Triage Ramp
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#FAFAF7] border border-[#E5E8E6]">
                    <Phone className="h-5 w-5 text-[#174C40] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-[#77817C]">Central Appointment &amp; Reception Desk</p>
                      <a
                        href={`tel:${hospital.phone.replace(/[^0-9+]/g, '')}`}
                        className="font-mono text-sm font-semibold text-[#242A28] hover:underline"
                      >
                        {hospital.phone}
                      </a>
                      <p className="text-[11px] text-[#77817C] mt-0.5">
                        OPD Hours: Mon &ndash; Sat, 08:00 AM &ndash; 08:00 PM
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E5E8E6] flex items-center justify-between text-xs">
                  <Link
                    href="/visiting-hours"
                    className="font-medium text-[#174C40] hover:underline inline-flex items-center gap-1"
                  >
                    Hospital Timings &amp; Visiting Hours
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/insurance"
                    className="text-[#4A5350] hover:text-[#242A28] transition-colors"
                  >
                    Cashless TPA Desk &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 02. Quick Services Strip (Interactive Priority Actions) */}
      <section className="border-b border-[#E5E8E6] bg-white">
        <div className="container-editorial py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/appointments/book"
              className="group p-5 rounded-2xl border border-[#E5E8E6] bg-[#FAFAF7] hover:bg-white hover:border-[#174C40] transition-all flex items-start gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#174C40] shrink-0 group-hover:bg-[#174C40] group-hover:text-white transition-colors">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-editorial text-base text-[#242A28] font-medium group-hover:text-[#174C40] transition-colors">
                  Book Appointment
                </h3>
                <p className="text-xs text-[#77817C] mt-1">
                  Schedule in-person or telehealth slots in 3 steps
                </p>
              </div>
            </Link>

            <Link
              href="/appointments/doctors"
              className="group p-5 rounded-2xl border border-[#E5E8E6] bg-[#FAFAF7] hover:bg-white hover:border-[#174C40] transition-all flex items-start gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#174C40] shrink-0 group-hover:bg-[#174C40] group-hover:text-white transition-colors">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-editorial text-base text-[#242A28] font-medium group-hover:text-[#174C40] transition-colors">
                  Find a Doctor
                </h3>
                <p className="text-xs text-[#77817C] mt-1">
                  Search 185+ board-certified medical specialists
                </p>
              </div>
            </Link>

            <Link
              href="/emergency"
              className="group p-5 rounded-2xl border border-[#E5E8E6] bg-[#FAFAF7] hover:bg-white hover:border-[#b91c1c] transition-all flex items-start gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#b91c1c] shrink-0 group-hover:bg-[#b91c1c] group-hover:text-white transition-colors">
                <Siren className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-editorial text-base text-[#242A28] font-medium group-hover:text-[#b91c1c] transition-colors">
                  24/7 Emergency
                </h3>
                <p className="text-xs text-[#77817C] mt-1">
                  Level 1 Trauma protocols &amp; instant ambulance dispatch
                </p>
              </div>
            </Link>

            <Link
              href="/departments"
              className="group p-5 rounded-2xl border border-[#E5E8E6] bg-[#FAFAF7] hover:bg-white hover:border-[#174C40] transition-all flex items-start gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#174C40] shrink-0 group-hover:bg-[#174C40] group-hover:text-white transition-colors">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-editorial text-base text-[#242A28] font-medium group-hover:text-[#174C40] transition-colors">
                  Clinical Departments
                </h3>
                <p className="text-xs text-[#77817C] mt-1">
                  Explore 24 specialized medical divisions &amp; centers
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 03. About Preview & Key Strengths */}
      <section className="container-editorial py-20 lg:py-24 border-b border-[#E5E8E6]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40] block">
              About Healix Hospital
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#242A28] leading-tight">
              Where evidence-based medicine meets peaceful, restorative healing.
            </h2>
            <p className="text-sm leading-relaxed text-[#4A5350] font-light">
              Founded in 2004 by academic clinicians and biomedical researchers, Healix has evolved into a premier regional referral hospital. We treat the whole person, not just the chart—combining unhurried specialist consultations with robotic surgery and rapid diagnostics.
            </p>
            <div className="space-y-3 pt-2">
              {[
                'Gold-standard JCI & NABH clinical quality and infection control accreditation',
                'Multidisciplinary tumor boards and collaborative specialist case scrutiny',
                'Acoustic-insulated private recovery suites with natural daylighting design',
              ].map((strength, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#174C40] shrink-0 mt-0.5" />
                  <span className="text-xs text-[#242A28] font-medium leading-normal">{strength}</span>
                </div>
              ))}
            </div>
            <div className="pt-4 flex items-center gap-4">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#242A28] text-white text-xs font-medium hover:bg-[#174C40] transition-colors"
              >
                Read Hospital Story
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/about/mission-vision"
                className="text-xs text-[#174C40] hover:underline font-medium"
              >
                Mission &amp; Clinical Ethos &rarr;
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-white border border-[#E5E8E6] space-y-2">
              <ShieldCheck className="w-6 h-6 text-[#174C40]" />
              <h3 className="font-editorial text-lg text-[#242A28]">Certified Excellence</h3>
              <p className="text-xs text-[#77817C] leading-relaxed">
                Ranked in the top 1% for post-operative recovery safety and patient survival outcomes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E5E8E6] space-y-2">
              <Microscope className="w-6 h-6 text-[#174C40]" />
              <h3 className="font-editorial text-lg text-[#242A28]">Diagnostic Speed</h3>
              <p className="text-xs text-[#77817C] leading-relaxed">
                Fully automated on-campus pathology and 3T MRI providing reports within hours.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E5E8E6] space-y-2">
              <Sparkles className="w-6 h-6 text-[#174C40]" />
              <h3 className="font-editorial text-lg text-[#242A28]">Robotic Precision</h3>
              <p className="text-xs text-[#77817C] leading-relaxed">
                da Vinci XI robotic surgery systems delivering sub-millimeter surgical accuracy.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E5E8E6] space-y-2">
              <HeartPulse className="w-6 h-6 text-[#174C40]" />
              <h3 className="font-editorial text-lg text-[#242A28]">Compassionate Care</h3>
              <p className="text-xs text-[#77817C] leading-relaxed">
                Dedicated nursing liaisons ensuring patient and family comfort at every turn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 04. Statistics Bar */}
      <section className="border-b border-[#E5E8E6] bg-white py-12">
        <div className="container-editorial">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="border-l-2 border-[#174C40] pl-4">
              <p className="font-editorial text-4xl text-[#242A28]">{hospital.doctors_count}+</p>
              <p className="text-xs font-mono uppercase tracking-[0.12em] text-[#77817C] mt-1">
                Specialist Physicians
              </p>
            </div>
            <div className="border-l-2 border-[#174C40] pl-4">
              <p className="font-editorial text-4xl text-[#242A28]">{hospital.specialties_count}</p>
              <p className="text-xs font-mono uppercase tracking-[0.12em] text-[#77817C] mt-1">
                Clinical Departments
              </p>
            </div>
            <div className="border-l-2 border-[#174C40] pl-4">
              <p className="font-editorial text-4xl text-[#242A28]">{hospital.patients_served}</p>
              <p className="text-xs font-mono uppercase tracking-[0.12em] text-[#77817C] mt-1">
                Patients Cared For
              </p>
            </div>
            <div className="border-l-2 border-[#174C40] pl-4">
              <p className="font-editorial text-4xl text-[#242A28]">22+</p>
              <p className="text-xs font-mono uppercase tracking-[0.12em] text-[#77817C] mt-1">
                Years of Clinical Service
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 05. Clinical Departments */}
      <section className="container-editorial py-20 lg:py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40] mb-2">
              Centers of Excellence
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#242A28]">
              Specialized clinical departments
            </h2>
          </div>
          <Link
            href="/departments"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#242A28] hover:text-[#174C40] transition-colors"
          >
            View all 24 departments
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
                  <span className="h-11 w-11 rounded-xl bg-[#E6EFE9] text-[#174C40] flex items-center justify-center">
                    <DepartmentIcon name={dept.icon} className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] font-mono text-[#77817C]">{dept.floor_location}</span>
                </div>
                <h3 className="text-lg font-medium text-[#242A28] group-hover:text-[#174C40] transition-colors font-editorial">
                  {dept.name}
                </h3>
                <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-[#4A5350] font-light">
                  {dept.short_description}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E5E8E6] flex items-center justify-between text-xs text-[#77817C]">
                <span className="font-mono">{dept.beds_allocated} Dedicated Beds</span>
                <span className="inline-flex items-center gap-1 text-[#242A28] font-medium group-hover:translate-x-0.5 transition-transform">
                  Department Details
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 06. Featured Medical Doctors */}
      <section className="border-t border-[#E5E8E6] bg-white py-20 lg:py-24">
        <div className="container-editorial">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40] mb-2">
                Medical Leadership
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl text-[#242A28]">
                Physicians who listen first
              </h2>
            </div>
            <Link
              href="/doctors"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#242A28] hover:text-[#174C40] transition-colors"
            >
              Search all doctors
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredDoctors.map((doctor) => (
              <Link
                key={doctor.slug}
                href={`/doctors/${doctor.slug}`}
                className="card-minimal rounded-2xl p-6 flex flex-col justify-between group hover:border-[#174C40]"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <DoctorAvatar initials={doctor.avatar_initials} tone={doctor.accent_tone} />
                    <span className="text-[11px] font-mono text-[#77817C]">
                      {doctor.experience_years} yrs exp
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[#242A28] group-hover:text-[#174C40] transition-colors font-editorial">
                    {doctor.name}
                  </h3>
                  <p className="text-xs text-[#174C40] font-medium mt-0.5">{doctor.specialty}</p>
                  <p className="text-[11px] text-[#77817C] mt-1">{doctor.qualification}</p>
                </div>
                <div className="mt-5 pt-4 border-t border-[#E5E8E6] flex items-center justify-between text-xs text-[#4A5350]">
                  <span className="text-[11px]">{doctor.consultation_days}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[#77817C] group-hover:text-[#242A28]" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 07. Main Medical Services */}
      <section className="container-editorial py-20 lg:py-24 border-t border-[#E5E8E6]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40] mb-2">
              Clinical Programs
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#242A28]">
              Signature medical services
            </h2>
          </div>
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#242A28] hover:text-[#174C40] transition-colors"
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
              className="rounded-2xl border border-[#E5E8E6] bg-white hover:border-[#174C40] p-7 transition-all group shadow-xs"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#174C40] bg-[#E6EFE9] px-2.5 py-1 rounded-full">
                  {service.category}
                </span>
                <span className="text-xs font-mono text-[#77817C]">{service.duration_estimate}</span>
              </div>
              <h3 className="text-xl font-medium text-[#242A28] group-hover:text-[#174C40] transition-colors font-editorial">
                {service.name}
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-[#4A5350] font-light">
                {service.short_description}
              </p>
              <div className="mt-5 flex items-center justify-between text-xs text-[#77817C]">
                <span>{service.department_name}</span>
                <span className="inline-flex items-center gap-1 text-[#242A28] font-medium">
                  Service Details
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 08. Why Choose Us (Experience, Technology, Patient Care) */}
      <section className="border-t border-[#E5E8E6] bg-[#242A28] text-white py-20 lg:py-24">
        <div className="container-editorial">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#7cc4bd] mb-2">
              Why Choose Healix
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl text-white">
              An institution engineered around patient trust and recovery.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-[#7cc4bd] flex items-center justify-center">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-xl text-white">Multidisciplinary Experience</h3>
              <p className="text-xs sm:text-sm text-[#b5bdbd] leading-relaxed font-light">
                Over 185 fellowship-trained clinicians collaborating across tumor boards and acute clinical case committees to craft personalized recovery pathways.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-[#7cc4bd] flex items-center justify-center">
                <Microscope className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-xl text-white">Advanced Medical Technology</h3>
              <p className="text-xs sm:text-sm text-[#b5bdbd] leading-relaxed font-light">
                Equipped with biplane cath labs, da Vinci robotic consoles, 3T silent MRI, and AI-assisted tomosynthesis mammography for zero-compromise precision.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-[#7cc4bd] flex items-center justify-center">
                <HeartPulse className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-xl text-white">Compassionate Patient Care</h3>
              <p className="text-xs sm:text-sm text-[#b5bdbd] leading-relaxed font-light">
                Acoustic room dampening, transparent fee counseling, dedicated 24/7 cashless insurance liaison, and continuous family support throughout your stay.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Featured Health Packages */}
      {featuredPackages.length > 0 && (
        <section className="border-b border-[#E5E8E6] bg-white py-20 lg:py-24">
          <div className="container-editorial">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40] mb-2">
                  Preventive Health
                </p>
                <h2 className="font-editorial text-3xl sm:text-4xl text-[#242A28]">
                  Comprehensive health checkup packages
                </h2>
              </div>
              <Link
                href="/health-packages"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#242A28] hover:text-[#174C40] transition-colors"
              >
                View all health packages
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredPackages.map((pkg) => (
                <div
                  key={pkg.slug}
                  className="rounded-2xl border border-[#E5E8E6] bg-[#FAFAF7] p-7 flex flex-col justify-between hover:border-[#174C40] transition-all shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-teal-50 text-[#174C40] border border-teal-100 font-semibold">
                        {pkg.tier} Tier
                      </span>
                      <span className="text-xs font-mono text-[#77817C]">{pkg.duration}</span>
                    </div>

                    <h3 className="font-editorial text-xl font-medium text-[#242A28]">{pkg.name}</h3>
                    <p className="text-xs text-[#4A5350] mt-2 leading-relaxed">
                      {pkg.short_description}
                    </p>

                    <div className="my-6 p-4 rounded-xl bg-white border border-[#E5E8E6] flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-[#77817C] block">Package Fee</span>
                        <span className="font-editorial text-2xl font-bold text-[#174C40]">
                          ${pkg.price}
                        </span>
                      </div>
                      {pkg.original_price > pkg.price && (
                        <span className="text-xs line-through text-neutral-400 font-mono">
                          ${pkg.original_price}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-neutral-600 mb-2 font-medium">Includes testing for:</p>
                    <ul className="text-xs text-[#77817C] space-y-1 mb-6">
                      {pkg.tests?.slice(0, 3).map((testGroup, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#174C40] shrink-0" />
                          <span>
                            {testGroup.group} ({testGroup.items.length} investigations)
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href={`/health-packages/${pkg.slug}`}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#174C40] text-white text-xs font-medium text-center hover:bg-[#0c4a4a] transition-colors"
                  >
                    View Package Details &amp; Tests
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 11. Patient Testimonials with Consent */}
      <section className="container-editorial py-20 lg:py-24 border-b border-[#E5E8E6]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40] mb-2">
              Patient Voices
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#242A28]">
              Stories of healing &amp; recovery
            </h2>
          </div>
          <Link
            href="/feedback"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#242A28] hover:text-[#174C40] transition-colors"
          >
            Share your feedback
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-[#E5E8E6] bg-white p-7 flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-[#242A28] italic leading-relaxed font-light mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-[#E5E8E6]">
                <p className="font-editorial text-base font-medium text-[#242A28]">{t.patient_name}</p>
                <p className="text-xs text-[#174C40] font-medium">{t.treatment}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-[#77817C]">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-600" />
                    {t.consent}
                  </span>
                  <span>{t.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 12. Recent Health Articles & Blog */}
      {recentArticles.length > 0 && (
        <section className="container-editorial py-20 lg:py-24 border-b border-[#E5E8E6]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40] mb-2">
                Clinical Library
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl text-[#242A28]">
                Recent health information &amp; wellness guides
              </h2>
            </div>
            <Link
              href="/health-library"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#242A28] hover:text-[#174C40] transition-colors"
            >
              Explore all articles
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/health-library/${article.slug}`}
                className="rounded-2xl border border-[#E5E8E6] bg-white p-6 hover:border-[#174C40] transition-all group shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-teal-50 text-[#174C40] font-semibold">
                      {article.category}
                    </span>
                    <span className="text-xs font-mono text-[#77817C]">{article.read_minutes} min read</span>
                  </div>

                  <h3 className="font-editorial text-lg font-medium text-[#242A28] group-hover:text-[#174C40] transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-xs text-[#4A5350] mt-2 line-clamp-3 leading-relaxed font-light">
                    {article.excerpt}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E5E8E6] flex items-center justify-between text-xs text-[#77817C]">
                  <span>Reviewed by {article.author_name}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:text-[#242A28]" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 13. Campus Contact & Location Strip */}
      <section className="bg-white py-16 lg:py-20">
        <div className="container-editorial">
          <div className="rounded-3xl border border-[#E5E8E6] bg-[#FAFAF7] p-8 lg:p-12 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40] block">
                  Campus Location &amp; Inquiries
                </span>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#242A28]">
                  Visiting Healix Medical Center
                </h2>
                <div className="space-y-2 text-xs text-[#4A5350] pt-1">
                  <p className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#174C40] shrink-0 mt-0.5" />
                    <span>{hospital.address} (North Wing Plaza, Suite 400)</span>
                  </p>
                  <p className="flex items-center gap-2.5 font-mono">
                    <Phone className="w-4 h-4 text-[#174C40] shrink-0" />
                    <span>General Desk: {hospital.phone} &bull; Emergency 24/7: {hospital.emergency_phone}</span>
                  </p>
                  <p className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-[#174C40] shrink-0" />
                    <span>Outpatient Clinics: Mon &ndash; Sat, 08:00 AM &ndash; 08:00 PM</span>
                  </p>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col sm:flex-row gap-3 justify-end">
                <Link
                  href="/contact"
                  className="px-6 py-3 rounded-full bg-[#174C40] text-white text-xs font-medium hover:bg-[#0c4a4a] text-center transition-colors"
                >
                  Contact &amp; Wayfinding
                </Link>
                <Link
                  href="/visiting-hours"
                  className="px-6 py-3 rounded-full border border-[#77817C] bg-white text-[#242A28] text-xs font-medium hover:border-[#242A28] text-center transition-colors"
                >
                  Visiting Guidelines
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
