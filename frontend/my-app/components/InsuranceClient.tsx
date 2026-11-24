'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { InsurancePartner } from '@/lib/types';
import {
  ShieldCheck,
  Building2,
  FileCheck2,
  CreditCard,
  PhoneCall,
  Search,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Download,
} from 'lucide-react';

interface Props {
  initialPartners: InsurancePartner[];
}

export default function InsuranceClient({ initialPartners }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  const filtered = initialPartners.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.partner_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.coverage_types.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType =
      selectedType === 'All' || p.partner_type.toLowerCase().includes(selectedType.toLowerCase());
    return matchesSearch && matchesType;
  });

  return (
    <div className="bg-[#FAF9F6] text-[#141716] min-h-screen">
      {/* Editorial Header */}
      <section className="border-b border-[#E6E4DD] bg-white/70 backdrop-blur-sm pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F5C5C]/10 text-[#0F5C5C] text-xs font-semibold tracking-wide uppercase mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              Direct Settlement & TPA Network
            </div>
            <h1 className="text-4xl sm:text-5xl font-serif font-light text-[#141716] tracking-tight leading-[1.15] mb-4">
              Insurance & Cashless Services
            </h1>
            <p className="text-lg text-neutral-600 font-light leading-relaxed">
              Healix partners with leading private health insurance providers and Third Party Administrators (TPAs) to offer seamless, direct cashless hospitalization and pre-authorized surgical care.
            </p>
          </div>
        </div>
      </section>

      {/* 4-Step Cashless Process */}
      <section className="py-16 border-b border-[#E6E4DD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-wider text-[#0F5C5C]">
              Transparent Procedure
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#141716] mt-1 font-normal">
              How Cashless Hospitalization Works
            </h2>
            <p className="text-sm text-neutral-600 mt-2">
              Our 24/7 dedicated Insurance Desk handles end-to-end documentation with your insurer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-[#E6E4DD] shadow-xs relative">
              <span className="text-3xl font-serif text-teal-800/20 font-bold absolute top-4 right-4">01</span>
              <div className="w-10 h-10 rounded-lg bg-[#0F5C5C]/10 flex items-center justify-center text-[#0F5C5C] mb-4">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-medium text-[#141716] mb-2">Pre-Authorization</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Submit your insurance e-card, government ID, and physician recommendation letter at the Insurance Desk 48 hours before planned admission.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E6E4DD] shadow-xs relative">
              <span className="text-3xl font-serif text-teal-800/20 font-bold absolute top-4 right-4">02</span>
              <div className="w-10 h-10 rounded-lg bg-[#0F5C5C]/10 flex items-center justify-center text-[#0F5C5C] mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-medium text-[#141716] mb-2">TPA Scrutiny</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Our team uploads treatment estimations to the insurer's portal. Emergency cases receive provisional approval within 45 minutes.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E6E4DD] shadow-xs relative">
              <span className="text-3xl font-serif text-teal-800/20 font-bold absolute top-4 right-4">03</span>
              <div className="w-10 h-10 rounded-lg bg-[#0F5C5C]/10 flex items-center justify-center text-[#0F5C5C] mb-4">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-medium text-[#141716] mb-2">Direct Settlement</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Medical expenses within sanctioned limits are billed directly to the insurer. No cash deposit required for pre-approved lines.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E6E4DD] shadow-xs relative">
              <span className="text-3xl font-serif text-teal-800/20 font-bold absolute top-4 right-4">04</span>
              <div className="w-10 h-10 rounded-lg bg-[#0F5C5C]/10 flex items-center justify-center text-[#0F5C5C] mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-medium text-[#141716] mb-2">Discharge</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Upon medical release, you settle only non-medical items (e.g. administrative fees, non-covered consumables, policy co-pays).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Network Directory */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#141716] font-normal">
              Empaneled Insurance & TPA Network
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              Select your insurance company or Third Party Administrator to view specific coverage notes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search provider or TPA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 text-xs rounded-lg border border-[#E6E4DD] bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5C5C] w-full sm:w-64"
              />
            </div>

            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#E6E4DD] text-xs">
              {['All', 'Private', 'Government'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    selectedType === type
                      ? 'bg-[#0F5C5C] text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-[#E6E4DD]">
            <Building2 className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-neutral-600 text-sm">No insurance partners matching your query.</p>
            <p className="text-xs text-neutral-400 mt-1">
              If your provider is unlisted, our reimbursement desk can provide complete claim document sets.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((partner, index) => (
              <div
                key={partner.name || index}
                className="bg-white rounded-xl border border-[#E6E4DD] p-6 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F5C5C] font-serif font-bold text-lg">
                      {partner.name.slice(0, 3).toUpperCase()}
                    </div>
                    {partner.cashless && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Cashless Empaneled
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif text-lg font-medium text-[#141716]">{partner.name}</h3>
                  <div className="text-xs font-mono text-neutral-500 mb-2">Type: {partner.partner_type}</div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {partner.coverage_types.map((cov, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF9F6] border border-[#E6E4DD] text-neutral-600">
                        {cov}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E6E4DD]/70 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-neutral-600">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" /> Pre-auth turnaround:
                    </span>
                    <span className="font-mono font-medium text-neutral-900">45-60 min</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-600">
                    <span className="flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-neutral-400" /> TPA Helpline:
                    </span>
                    <a
                      href={`tel:${partner.helpline}`}
                      className="font-mono text-[#0F5C5C] hover:underline"
                    >
                      {partner.helpline}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Claim Checklist & Liaison Desk */}
      <section className="py-16 bg-white border-t border-[#E6E4DD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#0F5C5C]">
                Documentation Protocol
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-[#141716] font-normal mt-1 mb-4">
                Required Claim Documents
              </h2>
              <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
                To guarantee zero delays in claim approval, please carry original copies of the following documents during admission:
              </p>

              <div className="space-y-3">
                {[
                  'Original Health Insurance Card & Policy Schedule',
                  'Government photo ID (Passport / Driver’s License / National Identity Card)',
                  'Attending Doctor’s First Consultation Note & Admission Advice',
                  'All diagnostic test reports (Pathology, ECG, CT/MRI films if applicable)',
                  'Past medical records relating to pre-existing conditions or prior hospitalizations',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-[#FAF9F6] border border-[#E6E4DD]">
                    <CheckCircle2 className="w-4 h-4 text-[#0F5C5C] shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-800 leading-snug">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-4">
                <a
                  href="/forms/healix-cashless-preauth-checklist.pdf"
                  download
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FAF9F6] border border-[#E6E4DD] text-xs font-medium text-neutral-800 hover:bg-neutral-100 transition-colors"
                >
                  <Download className="w-4 h-4 text-[#0F5C5C]" />
                  Download Cashless Checklist (PDF)
                </a>
              </div>
            </div>

            {/* Assistance Card */}
            <div className="bg-[#FAF9F6] rounded-2xl border border-[#E6E4DD] p-8">
              <div className="w-12 h-12 rounded-xl bg-[#0F5C5C] text-white flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-light text-[#141716] mb-3">
                On-Campus Insurance Liaison Desk
              </h3>
              <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
                Located on the Ground Floor of the Main Hospital Tower (Wing B), our dedicated insurance officers assist with pre-authorizations, query resolutions, and reimbursement paperwork.
              </p>

              <div className="space-y-4 text-xs text-neutral-700 border-t border-[#E6E4DD] pt-6 mb-6">
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[#0F5C5C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-neutral-900 block">Working Hours</strong>
                    <span>Planned Admissions: Mon–Sat, 8:00 AM – 8:00 PM</span>
                    <span className="block text-emerald-700 font-medium mt-0.5">Emergency Admissions: 24/7 round the clock</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <PhoneCall className="w-4 h-4 text-[#0F5C5C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-neutral-900 block">Direct Extension</strong>
                    <span>+1 (800) 432-5490 ext 4400 / +1 (800) 432-5492</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-[#0F5C5C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-neutral-900 block">Reimbursement Assistance</strong>
                    <span>Patients with non-network policies receive certified discharge summaries and itemized bills within 2 hours of departure.</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F5C5C] text-white text-xs font-medium hover:bg-[#0c4a4a] transition-colors"
                >
                  Contact Insurance Desk <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/faqs"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[#E6E4DD] bg-white text-neutral-700 text-xs font-medium hover:bg-neutral-50 transition-colors"
                >
                  Insurance FAQs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
