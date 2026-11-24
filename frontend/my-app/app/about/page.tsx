import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Building2,
  CheckCircle2,
  Compass,
  Eye,
  HeartHandshake,
  Lightbulb,
  Microscope,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  Users,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { getGallery, getHospitalInfo, getInfrastructure } from '@/lib/api';

export const metadata: Metadata = {
  title: 'About Healix Hospital | History, Leadership & Accreditation',
  description:
    'Learn about Healix Medical Center, our clinical heritage since 2004, hospital leadership, JCI accreditation, infrastructure, and patient-first care philosophy.',
};

export default async function AboutPage() {
  const [hospital, infrastructure, gallery] = await Promise.all([
    getHospitalInfo(),
    getInfrastructure(),
    getGallery(),
  ]);

  const previewGallery = gallery.slice(0, 4);
  const keyInfrastructure = infrastructure.slice(0, 4);

  const clinicalLeaders = [
    {
      name: hospital.leadership_name || 'Dr. Eleanor Vance, MD, FACS',
      title: hospital.leadership_title || 'Chief Medical Officer & President',
      specialty: 'Thoracic & Critical Surgery',
      institution: 'Harvard Medical School & Johns Hopkins',
      initials: 'EV',
      tone: 'teal',
    },
    {
      name: 'Dr. Aris Thorne, MD, FACC',
      title: 'Director, Cardiology & Heart Institute',
      specialty: 'Interventional Cardiology',
      institution: 'Stanford University Medical Center',
      initials: 'AT',
      tone: 'emerald',
    },
    {
      name: 'Dr. Mei-Ling Chen, MD, PhD',
      title: 'Director, Neurology & Stroke Center',
      specialty: 'Cerebrovascular Neurosurgery',
      institution: 'UCSF School of Medicine',
      initials: 'MC',
      tone: 'sky',
    },
    {
      name: 'Dr. David Okafor, MD, FACEP',
      title: 'Chief of Emergency & Trauma Systems',
      specialty: 'Emergency Medicine & Resuscitation',
      institution: 'Perelman School of Medicine (Penn)',
      initials: 'DO',
      tone: 'rose',
    },
  ];

  const certifications = [
    {
      title: 'JCI Gold Seal of Approval',
      body: 'Joint Commission International accredited for rigorous standards in patient safety, surgical site hygiene, and clinical care quality.',
      badge: 'International Gold Standard',
    },
    {
      title: 'NABH Tertiary Healthcare',
      body: 'Certified for excellence in inpatient clinical governance, nursing administration, and continuous quality improvement.',
      badge: 'National Accreditation',
    },
    {
      title: 'Level I Comprehensive Trauma Center',
      body: 'Continuous 24/7 in-house trauma surgical teams, neurotrauma, pediatric surgery, and rapid-response resuscitation facilities.',
      badge: 'Verified Level 1',
    },
    {
      title: 'Comprehensive Stroke Center',
      body: 'Rapid thrombectomy protocol with door-to-needle thrombolysis times consistently maintained under 24 minutes.',
      badge: 'National Quality Award',
    },
  ];

  return (
    <div className="bg-[#FAFAF7] text-[#242A28]">
      {/* 01. Page Header & Introduction */}
      <PageHeader
        eyebrow="About Healix Hospital"
        title="Two decades of quiet clinical rigor."
        description={hospital.about_summary}
        breadcrumbs={[{ label: 'About Hospital' }]}
      />

      {/* 02. History, Establishment & Verified Metrics */}
      <section className="container-editorial py-16 lg:py-20 border-b border-[#E5E8E6]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40] block">
              History &amp; Establishment
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#242A28] leading-tight">
              Built where academic precision meets human serenity.
            </h2>
            <p className="text-base leading-relaxed text-[#4A5350] font-light">
              {hospital.about_story}
            </p>
            <p className="text-base leading-relaxed text-[#4A5350] font-light">
              Over more than twenty years, Healix has steadily expanded into a 420-bed quaternary referral hospital. Every single ward, catheterization laboratory, and consultation room is planned around multidisciplinary collaboration—ensuring cardiologists, neurologists, oncologists, and nursing specialists deliberate together rather than in fragmented clinical silos.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {[
                '100% single-occupancy acoustic private recovery rooms',
                'Weekly multidisciplinary tumor, cardiac & neuro boards',
                'Transparent clinical outcome reporting audited quarterly',
                'Direct 24/7 Level I trauma, stroke & STEMI readiness',
              ].map((point, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#242A28]">
                  <CheckCircle2 className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="rounded-2xl border border-[#E5E8E6] bg-white p-8 space-y-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#E5E8E6] pb-3">
                <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#77817C]">
                  Verified Hospital Data
                </p>
                <span className="text-[11px] font-mono text-[#174C40] font-semibold">
                  Audited 2026
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="font-editorial text-3xl text-[#242A28]">{hospital.founded_year}</p>
                  <p className="text-xs text-[#77817C] mt-1">Year Founded</p>
                </div>
                <div>
                  <p className="font-editorial text-3xl text-[#242A28]">{hospital.beds_count}</p>
                  <p className="text-xs text-[#77817C] mt-1">Licensed Beds</p>
                </div>
                <div>
                  <p className="font-editorial text-3xl text-[#242A28]">{hospital.doctors_count}+</p>
                  <p className="text-xs text-[#77817C] mt-1">Attending Specialists</p>
                </div>
                <div>
                  <p className="font-editorial text-3xl text-[#242A28]">{hospital.patients_served}</p>
                  <p className="text-xs text-[#77817C] mt-1">Patients Served</p>
                </div>
              </div>

              <div className="pt-5 border-t border-[#E5E8E6] flex items-center gap-3">
                <Award className="h-5 w-5 text-[#174C40] shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[#242A28]">{hospital.accreditation}</p>
                  <p className="text-xs text-[#77817C]">Level I Trauma &amp; Comprehensive Stroke Center</p>
                </div>
              </div>
            </div>

            {/* Leadership Quote Banner */}
            <blockquote className="rounded-2xl border border-[#E5E8E6] bg-[#E6EFE9]/70 p-7 space-y-3">
              <p className="font-editorial italic text-lg leading-relaxed text-[#242A28]">
                &ldquo;{hospital.leadership_quote}&rdquo;
              </p>
              <footer className="text-xs pt-1">
                <p className="font-semibold text-[#242A28]">{hospital.leadership_name}</p>
                <p className="text-[#77817C]">{hospital.leadership_title}</p>
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* 03. Mission & Vision */}
      <section className="container-editorial py-16 lg:py-20 border-b border-[#E5E8E6]">
        <div className="max-w-2xl mb-10">
          <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40] block mb-2">
            Institutional Purpose
          </span>
          <h2 className="font-editorial text-3xl sm:text-4xl text-[#242A28]">
            Mission &amp; Long-Term Vision
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-[#E5E8E6] bg-white p-8 space-y-4 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#174C40]">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="font-editorial text-2xl text-[#242A28]">Our Mission</h3>
            <p className="text-sm leading-relaxed text-[#4A5350] font-light">
              {hospital.mission}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E5E8E6] bg-white p-8 space-y-4 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#174C40]">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-editorial text-2xl text-[#242A28]">Our Vision</h3>
            <p className="text-sm leading-relaxed text-[#4A5350] font-light">
              {hospital.vision}
            </p>
          </div>
        </div>

        <div className="mt-8 text-right">
          <Link
            href="/about/mission-vision"
            className="text-xs text-[#174C40] hover:underline font-medium inline-flex items-center gap-1"
          >
            Explore our comprehensive ethics &amp; values statement &rarr;
          </Link>
        </div>
      </section>

      {/* 04. Core Values */}
      <section className="bg-white py-16 lg:py-20 border-b border-[#E5E8E6]">
        <div className="container-editorial">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40] block mb-2">
              Guiding Principles
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#242A28]">
              The four pillars of Healix clinical care
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(hospital.values_json || []).map((val, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[#E5E8E6] bg-[#FAFAF7] p-7 space-y-3"
              >
                <span className="font-mono text-xs text-[#174C40] font-semibold">0{idx + 1}.</span>
                <h3 className="font-editorial text-xl text-[#242A28]">{val.title}</h3>
                <p className="text-xs text-[#4A5350] leading-relaxed font-light">
                  {val.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 05. Hospital Leadership Council */}
      <section className="container-editorial py-16 lg:py-20 border-b border-[#E5E8E6]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40] block mb-2">
              Clinical Governance
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#242A28]">
              Hospital Leadership &amp; Medical Board
            </h2>
          </div>
          <Link
            href="/doctors"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#242A28] hover:text-[#174C40] transition-colors"
          >
            Browse all 185+ attending physicians &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {clinicalLeaders.map((leader, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[#E5E8E6] bg-white p-6 space-y-4 shadow-xs"
            >
              <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center font-mono font-semibold text-sm text-[#174C40]">
                {leader.initials}
              </div>
              <div>
                <h3 className="font-editorial text-lg text-[#242A28] font-medium leading-snug">
                  {leader.name}
                </h3>
                <p className="text-xs text-[#174C40] font-medium mt-0.5">{leader.title}</p>
                <p className="text-[11px] text-[#77817C] mt-1">{leader.specialty}</p>
              </div>
              <div className="pt-3 border-t border-[#E5E8E6] text-[11px] text-[#4A5350]">
                Alma Mater: {leader.institution}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 06. Infrastructure Overview */}
      <section className="border-b border-[#E5E8E6] bg-[#242A28] text-white py-16 lg:py-20">
        <div className="container-editorial">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-12">
            <div className="lg:col-span-8 space-y-4">
              <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#7cc4bd] block">
                Infrastructure Architecture
              </span>
              <h2 className="font-editorial text-3xl sm:text-4xl text-white">
                Engineered for zero-compromise sterility &amp; daylight recovery.
              </h2>
              <p className="text-sm text-[#b5bdbd] leading-relaxed font-light max-w-2xl">
                From positive-pressure ISO Class 5 operating suites to our botanical atrium and continuous air filtration, our 580,000 sq ft facility unites clinical efficiency with circadian calming design.
              </p>
            </div>
            <div className="lg:col-span-4 flex justify-start lg:justify-end">
              <Link
                href="/about/infrastructure"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#242A28] text-xs font-medium hover:bg-[#E6EFE9] transition-colors"
              >
                Detailed Infrastructure Specs
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {keyInfrastructure.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-2"
              >
                <p className="font-editorial text-3xl text-[#9fd8d2]">{item.metric_value}</p>
                <p className="text-xs font-mono uppercase tracking-wider text-white/60">
                  {item.metric_label}
                </p>
                <p className="text-sm font-medium text-white pt-1">{item.title}</p>
                <p className="text-xs text-[#b5bdbd] leading-relaxed pt-1">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 07. Accreditations & Certifications */}
      <section className="container-editorial py-16 lg:py-20 border-b border-[#E5E8E6]">
        <div className="max-w-2xl mb-12">
          <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40] block mb-2">
            Verified Standards
          </span>
          <h2 className="font-editorial text-3xl sm:text-4xl text-[#242A28]">
            Accreditations &amp; Clinical Certifications
          </h2>
          <p className="text-xs text-[#77817C] mt-2">
            Every clinical division operates under independently audited protocols with zero tolerance for infection risks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certifications.map((cert, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[#E5E8E6] bg-white p-7 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-teal-50 text-[#174C40] font-semibold border border-teal-100">
                  {cert.badge}
                </span>
                <ShieldCheck className="w-5 h-5 text-[#174C40]" />
              </div>
              <h3 className="font-editorial text-xl text-[#242A28] font-medium">{cert.title}</h3>
              <p className="text-xs text-[#4A5350] leading-relaxed font-light">{cert.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 08. Patient Care Philosophy */}
      <section className="bg-white py-16 lg:py-20 border-b border-[#E5E8E6]">
        <div className="container-editorial">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40] block">
                Our Ethos
              </span>
              <h2 className="font-editorial text-3xl sm:text-4xl text-[#242A28] leading-tight">
                A care philosophy built on listening, collaboration, and dignity.
              </h2>
              <p className="text-sm leading-relaxed text-[#4A5350] font-light">
                At Healix, patients are never reduced to isolated diagnostic numbers or hurried assembly-line handovers. We structure outpatient visits to afford unhurried dialogue, ensuring our physicians listen attentively to subtle patient-reported symptoms.
              </p>
              <div className="space-y-3 pt-2 text-xs text-[#242A28]">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#174C40] shrink-0 mt-0.5" />
                  <span>
                    <strong>Collaborative Rounds:</strong> Daily bedside multidisciplinary rounds include nurses, physical therapists, clinical pharmacologists, and family caregivers.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#174C40] shrink-0 mt-0.5" />
                  <span>
                    <strong>Informed Partnership:</strong> Full diagnostic disclosures, second opinion support, and clear risk-benefit explanations prior to every elective procedure.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#174C40] shrink-0 mt-0.5" />
                  <span>
                    <strong>Transparent Financial Counseling:</strong> Upfront cashless pre-authorization with empaneled TPAs, eliminating unexpected discharge day bills.
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  href="/patient-rights"
                  className="text-xs text-[#174C40] hover:underline font-medium inline-flex items-center gap-1"
                >
                  Read Patient Bill of Rights &amp; Responsibilities &rarr;
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[#E5E8E6] bg-[#FAFAF7] p-6 space-y-2">
                <Users className="w-5 h-5 text-[#174C40]" />
                <h4 className="font-editorial text-lg text-[#242A28]">Multidisciplinary Boards</h4>
                <p className="text-xs text-[#77817C] leading-relaxed">
                  Complex cases are reviewed collectively by clinical committees for optimal survival outcomes.
                </p>
              </div>

              <div className="rounded-2xl border border-[#E5E8E6] bg-[#FAFAF7] p-6 space-y-2">
                <HeartHandshake className="w-5 h-5 text-[#174C40]" />
                <h4 className="font-editorial text-lg text-[#242A28]">Unhurried Care</h4>
                <p className="text-xs text-[#77817C] leading-relaxed">
                  20-to-40 minute specialist consultation slots giving you time to ask every question.
                </p>
              </div>

              <div className="rounded-2xl border border-[#E5E8E6] bg-[#FAFAF7] p-6 space-y-2">
                <Eye className="w-5 h-5 text-[#174C40]" />
                <h4 className="font-editorial text-lg text-[#242A28]">Radical Transparency</h4>
                <p className="text-xs text-[#77817C] leading-relaxed">
                  Immediate digital portal access to your lab reports, doctor notes, and imaging files.
                </p>
              </div>

              <div className="rounded-2xl border border-[#E5E8E6] bg-[#FAFAF7] p-6 space-y-2">
                <ShieldCheck className="w-5 h-5 text-[#174C40]" />
                <h4 className="font-editorial text-lg text-[#242A28]">Infection Control</h4>
                <p className="text-xs text-[#77817C] leading-relaxed">
                  0.02% hospital-acquired infection rate, benchmarked among the safest surgical centers globally.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 09. Hospital Gallery Preview */}
      <section className="container-editorial py-16 lg:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40] block mb-2">
              Visual Campus Tour
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#242A28]">
              Healing Architecture &amp; Clinical Spaces
            </h2>
          </div>
          <Link
            href="/gallery"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#242A28] hover:text-[#174C40] transition-colors"
          >
            View complete hospital gallery
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {previewGallery.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-[#E5E8E6] bg-white p-6 flex flex-col justify-between shadow-xs hover:border-[#174C40] transition-all"
            >
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#174C40] block mb-1.5 font-semibold">
                  {item.category}
                </span>
                <h3 className="font-editorial text-lg text-[#242A28] font-medium leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-[#77817C] mt-2 leading-relaxed">{item.description}</p>
              </div>

              <div className="mt-6 pt-3 border-t border-[#E5E8E6] text-[11px] font-mono text-[#4A5350] flex items-center justify-between">
                <span>{item.location}</span>
                <span className="text-[#174C40]">Verified Space</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
