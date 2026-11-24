'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Download,
  FileCheck2,
  FileText,
  HelpCircle,
  PhoneCall,
  Search,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react';
import InsuranceEnquiryForm from '@/components/InsuranceEnquiryForm';
import type { InsurancePartner } from '@/lib/types';

interface Props {
  initialPartners: InsurancePartner[];
}

const INSURANCE_FAQS = [
  {
    q: 'Is every medical treatment or policy covered automatically under cashless hospitalization?',
    a: 'No. Empanelment of an insurance provider or TPA does not guarantee automatic coverage for all medical treatments. Cashless approval is strictly contingent on your policy terms, specific waiting periods (e.g. for pre-existing diseases, maternity, or specific elective surgeries), disease sub-limits, room category restrictions, co-payments, and formal pre-authorization approval from your insurer. The hospital does not decide or guarantee claim approval; all final coverage adjudications rest solely with your insurer or TPA.',
  },
  {
    q: 'What are non-medical / non-payable expenses that insurance does not cover?',
    a: 'Non-medical consumables (e.g. patient hygiene kits, disposable gloves, gowns, administrative registration charges, thermometry covers, companion meals, and extra telephone/convenience charges) are standard statutory exclusions across most policies. These must be settled out-of-pocket by the patient at the time of discharge.',
  },
  {
    q: 'What is the difference between Cashless Hospitalization and Reimbursement claims?',
    a: 'Under cashless hospitalization with empaneled network insurers, the hospital bills medical expenses directly to the insurer up to sanctioned authorization limits. For non-empaneled insurers or when pre-authorization is withheld, patients settle bills directly with the hospital upon discharge and subsequently submit certified hospital bills, discharge summaries, and diagnostic reports to their insurer for reimbursement within 30 days.',
  },
  {
    q: 'What happens if my pre-authorization request is denied or delayed by the TPA?',
    a: 'A denial of cashless pre-authorization by your insurer does not mean denial of medical care. It simply indicates that the insurer requires additional documentation or that the condition falls under a policy exclusion for cashless settlement. In such cases, patients can proceed by paying hospital charges directly and filing a reimbursement claim with full medical dossiers provided by our Insurance Liaison Desk.',
  },
  {
    q: 'How does room rent capping impact my overall claim approval?',
    a: 'Many policies limit room eligibility (e.g. 1% of sum insured per day or a specific room tier like Twin Sharing). Opting for a higher category room (like Single Deluxe or Suite) can trigger proportionate deductions across doctor consultations, surgical charges, and nursing fees. Our insurance counselors will explain your room entitlement during pre-admission to avoid unexpected co-payments.',
  },
  {
    q: 'Can I claim expenses for medicines and diagnostic tests done before and after hospital admission?',
    a: 'Most comprehensive policies cover Pre-Hospitalization expenses (usually 30 days prior) and Post-Hospitalization expenses (usually 60–90 days following discharge). Keep all original bills, prescriptions, and payment receipts to file as a supplementary reimbursement claim with your insurer or TPA.',
  },
];

export default function InsuranceClient({ initialPartners }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [prefilledPartner, setPrefilledPartner] = useState('');
  const enquiryRef = useRef<HTMLDivElement>(null);

  const types = useMemo(() => {
    return ['All', 'Insurance', 'TPA', 'Government', 'International'];
  }, []);

  const filtered = useMemo(() => {
    return initialPartners.filter((p) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.partner_type.toLowerCase().includes(q) ||
        p.coverage_types.some((c) => c.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q));

      const matchesType =
        selectedType === 'All' ||
        p.partner_type.toLowerCase() === selectedType.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [initialPartners, searchTerm, selectedType]);

  function handleEnquireForPartner(partnerName: string) {
    setPrefilledPartner(partnerName);
    enquiryRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="bg-[#FAF9F6] text-[#141716] min-h-screen">
      {/* Editorial Hero Header */}
      <section className="border-b border-[#E6E4DD] bg-white/70 backdrop-blur-xs pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0F5C5C]/10 text-[#0F5C5C] text-xs font-semibold tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              Direct Settlement &amp; Empaneled TPA Network
            </div>
            <h1 className="text-4xl sm:text-5xl font-editorial font-light text-[#141716] tracking-tight leading-[1.15]">
              Insurance &amp; TPA Cashless Services
            </h1>
            <p className="text-base sm:text-lg text-neutral-600 font-light leading-relaxed">
              Healix Medical Center coordinates with leading health insurance providers and Third Party Administrators (TPAs) to facilitate cashless hospitalization, pre-authorizations, and transparent claim documentation.
            </p>
          </div>
        </div>
      </section>

      {/* Mandatory Statutory Coverage Disclaimer Banner */}
      <section className="bg-amber-50/90 border-b border-amber-200 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-3.5 text-amber-900 text-xs sm:text-sm">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">
                Important Insurance Coverage Policy &amp; Non-Automatic Coverage Notice
              </p>
              <p className="mt-1 text-amber-800 leading-relaxed text-xs">
                Empanelment of an insurance company or Third Party Administrator (TPA) does not imply that every medical condition, surgical intervention, diagnostic test, or admission is covered automatically. Cashless treatment is strictly contingent upon pre-authorization approval, individual policy waiting periods, disease sub-limits, room category caps, deductibles, and co-payment terms set forth by your insurer. The hospital does not decide or guarantee claim approvals; final adjudication rests solely with your insurance provider.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6-Step Insurance Process */}
      <section className="py-16 border-b border-[#E6E4DD] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#0F5C5C]">
              Step-by-Step Procedure
            </span>
            <h2 className="text-2xl sm:text-3xl font-editorial text-[#141716] font-normal">
              How the Cashless Hospitalization Process Works
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Our 24/7 On-Campus Insurance Liaison Desk manages end-to-end electronic communication with your insurer or TPA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-[#E6E4DD] space-y-3 relative">
              <span className="text-3xl font-editorial text-teal-800/20 font-bold absolute top-4 right-5">01</span>
              <div className="w-10 h-10 rounded-xl bg-[#0F5C5C]/10 flex items-center justify-center text-[#0F5C5C]">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="font-editorial text-lg font-medium text-[#141716]">1. Pre-Authorization Initiation</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                For planned admissions, submit your health card, government ID, and physician recommendation letter at least 48 hours prior. Emergency admissions are initiated within 30–45 minutes of ER arrival.
              </p>
            </div>

            <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-[#E6E4DD] space-y-3 relative">
              <span className="text-3xl font-editorial text-teal-800/20 font-bold absolute top-4 right-5">02</span>
              <div className="w-10 h-10 rounded-xl bg-[#0F5C5C]/10 flex items-center justify-center text-[#0F5C5C]">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-editorial text-lg font-medium text-[#141716]">2. TPA &amp; Insurer Scrutiny</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                The Insurance Desk submits clinical estimation sheets, treatment plans, and diagnostic reports to the TPA portal. The insurer verifies policy active status, waiting periods, and room rent entitlements.
              </p>
            </div>

            <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-[#E6E4DD] space-y-3 relative">
              <span className="text-3xl font-editorial text-teal-800/20 font-bold absolute top-4 right-5">03</span>
              <div className="w-10 h-10 rounded-xl bg-[#0F5C5C]/10 flex items-center justify-center text-[#0F5C5C]">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-editorial text-lg font-medium text-[#141716]">3. Initial Sanction Approval</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                The insurer issues an initial pre-authorization sanction letter specifying an approved provisional credit limit. Cashless admission is processed with zero deposit for approved lines.
              </p>
            </div>

            <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-[#E6E4DD] space-y-3 relative">
              <span className="text-3xl font-editorial text-teal-800/20 font-bold absolute top-4 right-5">04</span>
              <div className="w-10 h-10 rounded-xl bg-[#0F5C5C]/10 flex items-center justify-center text-[#0F5C5C]">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="font-editorial text-lg font-medium text-[#141716]">4. Mid-Stay Enhancement</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                If the surgical scope widens, ICU stay is required, or medication requirements exceed the initial sanction, the hospital submits daily clinical updates for enhanced credit authorization.
              </p>
            </div>

            <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-[#E6E4DD] space-y-3 relative">
              <span className="text-3xl font-editorial text-teal-800/20 font-bold absolute top-4 right-5">05</span>
              <div className="w-10 h-10 rounded-xl bg-[#0F5C5C]/10 flex items-center justify-center text-[#0F5C5C]">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-editorial text-lg font-medium text-[#141716]">5. Final Bill &amp; Discharge Approval</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Upon clinical release, the final itemized bill, indoor case sheet, and discharge summary are transmitted to the TPA. The insurer typically issues final settlement authorization within 2–3 hours.
              </p>
            </div>

            <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-[#E6E4DD] space-y-3 relative">
              <span className="text-3xl font-editorial text-teal-800/20 font-bold absolute top-4 right-5">06</span>
              <div className="w-10 h-10 rounded-xl bg-[#0F5C5C]/10 flex items-center justify-center text-[#0F5C5C]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-editorial text-lg font-medium text-[#141716]">6. Non-Medical Settlement</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                The patient settles statutory non-medical exclusions (consumables, registration charges, telephone expenses) and any policy co-pays/deductibles, concluding the discharge.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cashless Treatment Details Strip */}
      <section className="py-14 border-b border-[#E6E4DD] bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-[#E6E4DD] bg-white p-6 space-y-3">
              <h3 className="font-editorial text-xl text-[#14181a] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0F5C5C]" />
                Planned Admissions
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Notify the Insurance Desk 48 hours prior to elective surgeries. Pre-booking ensures credit limits and room tier entitlements are locked before you arrive at admissions.
              </p>
              <ul className="text-xs text-neutral-600 space-y-1.5 pt-2 border-t border-[#E6E4DD]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0F5C5C]" />
                  <span>Doctor’s admission slip required</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0F5C5C]" />
                  <span>Cost estimate issued in advance</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-[#E6E4DD] bg-white p-6 space-y-3">
              <h3 className="font-editorial text-xl text-[#14181a] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#0F5C5C]" />
                Emergency Admissions
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Emergency care is initiated immediately without awaiting insurance approval. Family members can submit health card credentials within 6 hours of ER triage.
              </p>
              <ul className="text-xs text-neutral-600 space-y-1.5 pt-2 border-t border-[#E6E4DD]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0F5C5C]" />
                  <span>24/7 dedicated ER insurance coordinator</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0F5C5C]" />
                  <span>Provisional approval in 30–45 mins</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-[#E6E4DD] bg-white p-6 space-y-3">
              <h3 className="font-editorial text-xl text-[#14181a] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0F5C5C]" />
                Non-Medical Consumables
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Insurers mandate that non-medical consumables, administrative fees, hygiene kits, and telephone charges are not covered under cashless settlement.
              </p>
              <ul className="text-xs text-neutral-600 space-y-1.5 pt-2 border-t border-[#E6E4DD]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0F5C5C]" />
                  <span>Itemized consumable receipts provided</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0F5C5C]" />
                  <span>Room rent capping guidance before admission</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Empaneled Network Directory: Accepted Providers & TPAs */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#0F5C5C]">
              Network Directory
            </span>
            <h2 className="text-2xl sm:text-3xl font-editorial text-[#141716] font-normal">
              Empaneled Insurance Carriers &amp; TPA List
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl">
              Browse our approved private insurance carriers, Third Party Administrators (TPAs), government programs, and international medical assistance networks.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search insurer, TPA, or specialty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 text-xs rounded-full border border-[#E6E4DD] bg-white focus:outline-hidden focus:border-[#0F5C5C] w-full sm:w-64"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Partner Type Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-full border border-[#E6E4DD] text-xs">
              {types.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
                    selectedType === type
                      ? 'bg-[#14181a] text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {type === 'All' ? 'All Partners' : type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Directory Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-2xl border border-[#E6E4DD] p-8 space-y-3">
            <Building2 className="w-10 h-10 text-neutral-300 mx-auto" />
            <h3 className="font-editorial text-lg text-[#141716]">No matching providers or TPAs found</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              If your insurer is not currently empaneled for cashless settlement, our Reimbursement Support Desk will prepare certified itemized claims packets for 100% direct submission.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedType('All');
              }}
              className="px-4 py-2 rounded-full bg-[#14181a] text-white text-xs font-medium hover:bg-[#0f5c5c] transition-colors mt-2"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((partner, index) => (
              <div
                key={partner.name || index}
                className="bg-white rounded-2xl border border-[#E6E4DD] p-6 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F5C5C] font-editorial font-bold text-lg">
                      {partner.name.slice(0, 3).toUpperCase()}
                    </div>
                    {partner.cashless ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Cashless Empaneled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        Reimbursement Support
                      </span>
                    )}
                  </div>

                  <h3 className="font-editorial text-xl font-medium text-[#141716]">{partner.name}</h3>
                  <div className="text-[11px] font-mono text-[#0F5C5C] mb-2 font-medium">
                    Category: {partner.partner_type === 'TPA' ? 'Third Party Administrator (TPA)' : partner.partner_type}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {partner.coverage_types.map((cov, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF9F6] border border-[#E6E4DD] text-neutral-600"
                      >
                        {cov}
                      </span>
                    ))}
                  </div>

                  {partner.notes && (
                    <p className="text-[11px] text-neutral-500 italic leading-relaxed line-clamp-2">
                      &quot;{partner.notes}&quot;
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-[#E6E4DD] space-y-2 text-xs">
                  {partner.turnaround_time && (
                    <div className="flex items-center justify-between text-neutral-600">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" /> Pre-auth turnaround:
                      </span>
                      <span className="font-mono font-medium text-neutral-900 text-[11px]">
                        {partner.turnaround_time}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-neutral-600">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <PhoneCall className="w-3.5 h-3.5 text-neutral-400" /> Helpline:
                    </span>
                    <a
                      href={`tel:${partner.helpline}`}
                      className="font-mono text-[#0F5C5C] hover:underline text-[11px]"
                    >
                      {partner.helpline}
                    </a>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleEnquireForPartner(partner.name)}
                      className="w-full text-center py-2 rounded-full border border-[#0F5C5C] text-[#0F5C5C] hover:bg-[#edf5f4] text-xs font-medium transition-colors"
                    >
                      Verify My Policy with {partner.name.split(' ')[0]}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Required Documents Protocol & Claims Guidance */}
      <section className="py-16 bg-white border-t border-[#E6E4DD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Required Documents Checklist */}
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#0F5C5C]">
                  Checklist for Admission
                </span>
                <h2 className="text-2xl sm:text-3xl font-editorial text-[#141716] font-normal mt-1">
                  Required Insurance &amp; Claim Documents
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 mt-2 leading-relaxed">
                  To prevent queries or sanction delays from your TPA, please present original copies of the following documents to the Insurance Desk:
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: 'Health Insurance Card & Active Policy Schedule',
                    desc: 'Physical card or valid digital e-card displaying policy number, member ID, and corporate group name.',
                  },
                  {
                    title: 'Government-Issued Photo Identification',
                    desc: 'Passport, Driver’s License, or National Identity Document for patient and primary policyholder.',
                  },
                  {
                    title: 'Doctor’s First Consultation Note & Admission Order',
                    desc: 'Original signed note from the attending physician specifying medical diagnosis and justification for inpatient care.',
                  },
                  {
                    title: 'Diagnostic Test Reports & Imaging Films',
                    desc: 'Complete pathological reports, ECG tracings, X-rays, or CT/MRI films confirming the clinical condition.',
                  },
                  {
                    title: 'Past Medical History & Previous Discharge Records',
                    desc: 'Documentation for pre-existing illnesses (diabetes, hypertension, prior surgeries) to satisfy insurer waiting period audits.',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E6E4DD]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#0F5C5C] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-[#14181a]">{item.title}</p>
                      <p className="text-[11px] text-neutral-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Claims Guidance: Cashless vs Reimbursement */}
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#0F5C5C]">
                  Reimbursement &amp; Claims Guidance
                </span>
                <h2 className="text-2xl sm:text-3xl font-editorial text-[#141716] font-normal mt-1">
                  Reimbursement Claims Filing Protocol
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 mt-2 leading-relaxed">
                  If your insurer is not in our direct cashless network or you opted for self-pay during an emergency admission, follow our certified reimbursement workflow:
                </p>
              </div>

              <div className="rounded-2xl border border-[#E6E4DD] bg-[#FAF9F6] p-6 space-y-4">
                <h3 className="font-editorial text-lg text-[#14181a]">
                  Hospital Document Dossier for Reimbursement
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Before discharge, visit the Insurance Support Window to collect your attested claim folder, including:
                </p>
                <ul className="text-xs text-neutral-700 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0F5C5C]" />
                    <span>Certified Final Detailed Itemized Bill with Receipt of Payment</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0F5C5C]" />
                    <span>Signed Discharge Summary &amp; Doctor&apos;s Operation Notes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0F5C5C]" />
                    <span>Implant Barcode Stickers, Lens Cards, and Stent Certificates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0F5C5C]" />
                    <span>Indoor Case Papers, Temperature Charts, and Nursing Notes</span>
                  </li>
                </ul>

                <div className="pt-3 border-t border-[#E6E4DD] text-xs text-neutral-600 space-y-1">
                  <p className="font-semibold text-neutral-900">Submission Timeline Warning:</p>
                  <p className="text-[11px] leading-relaxed">
                    Most insurance providers mandate that reimbursement claims be lodged within <strong>30 days of discharge</strong>. Post-hospitalization bills can be submitted within <strong>90 days</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Insurance Pre-Authorization & Coverage Verification Enquiry Form */}
      <section ref={enquiryRef} className="py-16 border-t border-[#E6E4DD] bg-[#FAF9F6]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <InsuranceEnquiryForm
            partners={initialPartners}
            prefilledPartner={prefilledPartner}
          />
        </div>
      </section>

      {/* Insurance-Related FAQs */}
      <section className="py-16 bg-white border-t border-[#E6E4DD]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#0F5C5C]">
              Frequently Asked Questions
            </span>
            <h2 className="text-2xl sm:text-3xl font-editorial text-[#141716] font-normal">
              Insurance, TPA &amp; Cashless Claims FAQs
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600">
              Clear answers to help you navigate authorizations, room category caps, and claim settlements.
            </p>
          </div>

          <div className="space-y-4">
            {INSURANCE_FAQS.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#E6E4DD] bg-white overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 hover:bg-[#FAF9F6] transition-colors"
                  >
                    <span className="font-editorial text-base sm:text-lg text-[#14181a] font-medium flex items-center gap-2.5">
                      <HelpCircle className="w-4 h-4 text-[#0F5C5C] shrink-0" />
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#0F5C5C] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="p-5 sm:p-6 pt-0 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-[#f0eee6] bg-[#faf9f6]/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* On-Campus Liaison Desk Info Strip */}
      <section className="py-12 bg-[#FAF9F6] border-t border-[#E6E4DD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-[#E6E4DD] bg-white p-7 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
            <div className="space-y-2 max-w-2xl">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#0F5C5C] font-semibold">
                On-Campus Assistance
              </span>
              <h3 className="font-editorial text-2xl text-[#14181a]">
                Visit the 24/7 Insurance &amp; TPA Liaison Desk
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Located on the Ground Floor of the Main Hospital Tower (Wing B). Our team assists with pre-authorizations, query reconciliations, and certified claim packets.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <a
                href="tel:18004325490"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-[#d2d0c8] bg-white text-xs font-medium text-[#14181a] hover:border-[#14181a] transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#0F5C5C]" />
                Call +1 (800) 432-5490 ext 4400
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#14181a] text-white text-xs font-medium hover:bg-[#0F5C5C] transition-colors"
              >
                Contact Hospital
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
