'use client';

import React, { useState } from 'react';
import type { JobOpening } from '@/lib/types';
import {
  Briefcase,
  MapPin,
  Clock,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  X,
  Send,
  Building,
  Heart,
  Award,
  ChevronRight,
  Search,
} from 'lucide-react';

interface Props {
  initialJobs: JobOpening[];
}

export default function CareersClient({ initialJobs }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [applyingJob, setApplyingJob] = useState<JobOpening | null>(null);

  // Application Modal state
  const [applicant, setApplicant] = useState({
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    portfolio_or_resume: '',
    cover_note: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const departments = ['All', 'Nursing', 'Medical Staff', 'Laboratory', 'Administration'];
  const employmentTypes = ['All', 'Full-Time', 'Part-Time', 'Per Diem'];

  const filtered = initialJobs.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || j.department.toLowerCase() === selectedDept.toLowerCase();
    const matchesType = selectedType === 'All' || j.employment_type.toLowerCase() === selectedType.toLowerCase();
    return matchesSearch && matchesDept && matchesType;
  });

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  const closeApplyModal = () => {
    setApplyingJob(null);
    setSubmitted(false);
    setApplicant({
      name: '',
      email: '',
      phone: '',
      linkedin: '',
      portfolio_or_resume: '',
      cover_note: '',
    });
  };

  return (
    <div className="bg-[#FAF9F6] text-[#141716] min-h-screen">
      {/* Editorial Hero Header */}
      <section className="border-b border-[#E6E4DD] bg-white/70 backdrop-blur-sm pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F5C5C]/10 text-[#0F5C5C] text-xs font-semibold tracking-wide uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Clinical Excellence & Research Careers
            </div>
            <h1 className="text-4xl sm:text-5xl font-serif font-light text-[#141716] tracking-tight leading-[1.15] mb-4">
              Shape the Future of Healthcare
            </h1>
            <p className="text-lg text-neutral-600 font-light leading-relaxed">
              Join an institution where compassionate bedside bedside care meets surgical innovation. We empower clinicians, researchers, and healthcare professionals to lead with purpose.
            </p>
          </div>
        </div>
      </section>

      {/* Why Join Healix Values Grid */}
      <section className="py-16 border-b border-[#E6E4DD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono uppercase tracking-wider text-[#0F5C5C]">
              Institutional Culture
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#141716] font-normal mt-1">
              Why Clinical Professionals Choose Healix
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl border border-[#E6E4DD] shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F5C5C] mb-4">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-medium text-[#141716] mb-2">
                CME & Academic Fellowships
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Full tuition subsidies for ongoing board certifications, national medical congress attendance, and dedicated protected time for peer-reviewed research.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E6E4DD] shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F5C5C] mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-medium text-[#141716] mb-2">
                Next-Gen Surgical Technology
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Practice in state-of-the-art hybrid catheterization suites, da Vinci robotic surgery operating rooms, and fully automated diagnostic pathology cores.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E6E4DD] shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F5C5C] mb-4">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-medium text-[#141716] mb-2">
                Comprehensive Wellness & Benefits
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Premium medical, dental, and vision coverage for you and your family, generous 403(b) retirement matching, and on-campus physician mental health counseling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions Filter & Directory */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#141716] font-normal">
              Current Career Openings
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              Explore open vacancies across our inpatient hospitals, specialty clinics, and administrative branches.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search job title, skill..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 text-xs rounded-lg border border-[#E6E4DD] bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5C5C] w-full sm:w-64"
              />
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs rounded-lg border border-[#E6E4DD] bg-white px-3 py-2 text-neutral-700 focus:outline-none focus:ring-1 focus:ring-[#0F5C5C]"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'All' ? 'All Departments' : dept}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs rounded-lg border border-[#E6E4DD] bg-white px-3 py-2 text-neutral-700 focus:outline-none focus:ring-1 focus:ring-[#0F5C5C]"
            >
              {employmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'All' ? 'All Types' : type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E6E4DD] p-12 text-center">
            <Briefcase className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <h3 className="font-serif text-lg text-neutral-800">No positions match your criteria</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Try adjusting your filters or send an unsolicited CV to talent@healixhealth.org.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((job) => (
              <div
                key={job.slug}
                className="bg-white rounded-xl border border-[#E6E4DD] p-6 hover:border-teal-300 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#0F5C5C]/10 text-[#0F5C5C]">
                      {job.department}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-neutral-600 bg-neutral-100">
                      {job.employment_type}
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400">
                      Req: {job.slug.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-medium text-[#141716]">{job.title}</h3>

                  <p className="text-xs text-neutral-600 max-w-3xl leading-relaxed">
                    {job.summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 pt-1">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" /> {job.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-neutral-400" /> {job.experience} experience
                    </span>
                  </div>

                  {job.requirements && job.requirements.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[11px] font-medium text-neutral-700 mb-1">Key Requirements:</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-neutral-600">
                        {job.requirements.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-[#0F5C5C] mt-1.5 shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center md:flex-col justify-end gap-3">
                  <button
                    onClick={() => setApplyingJob(job)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#0F5C5C] text-white text-xs font-medium hover:bg-[#0c4a4a] transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <span>Apply Position</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Application Drawer / Modal */}
      {applyingJob && (
        <div className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E6E4DD] max-w-xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={closeApplyModal}
              className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-700 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-2xl font-light text-[#141716] mb-2">
                  Application Submitted
                </h3>
                <p className="text-xs text-neutral-600 max-w-md mx-auto mb-6">
                  Thank you for applying for the position of <strong>{applyingJob.title}</strong>. Our clinical talent recruitment board will evaluate your dossier and reach out within 5 working days.
                </p>
                <button
                  onClick={closeApplyModal}
                  className="px-6 py-2.5 rounded-lg bg-[#0F5C5C] text-white text-xs font-medium hover:bg-[#0c4a4a]"
                >
                  Return to Careers
                </button>
              </div>
            ) : (
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#0F5C5C] block mb-1">
                  Candidate Application
                </span>
                <h3 className="font-serif text-2xl font-light text-[#141716] mb-1">
                  {applyingJob.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-neutral-500 mb-6">
                  <span>{applyingJob.department}</span> &bull;
                  <span>{applyingJob.employment_type}</span> &bull;
                  <span>{applyingJob.location}</span>
                </div>

                <form onSubmit={handleApplySubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Full Legal Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={applicant.name}
                      onChange={(e) => setApplicant({ ...applicant, name: e.target.value })}
                      placeholder="e.g. Dr. Arthur Pendelton"
                      className="w-full text-xs rounded-lg border border-[#E6E4DD] px-3.5 py-2.5 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5C5C]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={applicant.email}
                        onChange={(e) => setApplicant({ ...applicant, email: e.target.value })}
                        placeholder="arthur@example.com"
                        className="w-full text-xs rounded-lg border border-[#E6E4DD] px-3.5 py-2.5 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5C5C]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={applicant.phone}
                        onChange={(e) => setApplicant({ ...applicant, phone: e.target.value })}
                        placeholder="+1 (555) 012-3456"
                        className="w-full text-xs rounded-lg border border-[#E6E4DD] px-3.5 py-2.5 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5C5C]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      LinkedIn Profile or Professional URL
                    </label>
                    <input
                      type="url"
                      value={applicant.linkedin}
                      onChange={(e) => setApplicant({ ...applicant, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/arthurpendelton"
                      className="w-full text-xs rounded-lg border border-[#E6E4DD] px-3.5 py-2.5 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5C5C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Resume Link / Cloud Document <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={applicant.portfolio_or_resume}
                      onChange={(e) => setApplicant({ ...applicant, portfolio_or_resume: e.target.value })}
                      placeholder="https://drive.google.com/your-cv or PDF link"
                      className="w-full text-xs rounded-lg border border-[#E6E4DD] px-3.5 py-2.5 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5C5C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Clinical Statement / Cover Note
                    </label>
                    <textarea
                      rows={3}
                      value={applicant.cover_note}
                      onChange={(e) => setApplicant({ ...applicant, cover_note: e.target.value })}
                      placeholder="Briefly state your licensing board, clinical certifications, and motivation for joining Healix."
                      className="w-full text-xs rounded-lg border border-[#E6E4DD] px-3.5 py-2.5 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5C5C]"
                    ></textarea>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeApplyModal}
                      className="px-4 py-2.5 rounded-lg border border-[#E6E4DD] text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 rounded-lg bg-[#0F5C5C] text-white text-xs font-medium hover:bg-[#0c4a4a] flex items-center gap-2"
                    >
                      {submitting ? 'Submitting...' : 'Submit Dossier'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
