'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { GeneralFaq } from '@/lib/types';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ArrowRight,
  PhoneCall,
  Calendar,
  CreditCard,
  FileText,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  initialFaqs: GeneralFaq[];
}

export default function FaqsClient({ initialFaqs }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    '0': true,
  });

  const categories = ['All', 'General', 'Appointments', 'Billing', 'Medical Records'];

  const toggleAccordion = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = initialFaqs.filter((f) => {
    const matchesSearch =
      f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || f.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-[#FAF9F6] text-[#141716] min-h-screen">
      {/* Editorial Header */}
      <section className="border-b border-[#E6E4DD] bg-white/70 backdrop-blur-sm pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-mono uppercase tracking-wider text-[#0F5C5C]">
              Patient Help & Knowledge Base
            </span>
            <h1 className="text-4xl sm:text-5xl font-serif font-light text-[#141716] tracking-tight leading-[1.15] mt-2 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-neutral-600 font-light leading-relaxed">
              Find immediate answers regarding outpatient consultations, cashless hospitalizations, visitor policies, diagnostic reports, and patient portal access.
            </p>
          </div>
        </div>
      </section>

      {/* Search & Filter Bar */}
      <section className="py-8 border-b border-[#E6E4DD] bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative mb-6">
            <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by keywords (e.g. cashless, appointments, reports, parking)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-sm rounded-xl border border-[#E6E4DD] bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5C5C]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#0F5C5C] text-white shadow-xs'
                    : 'bg-[#FAF9F6] text-neutral-600 border border-[#E6E4DD] hover:bg-neutral-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Accordion Content */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#E6E4DD] p-8">
            <HelpCircle className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
            <h3 className="font-serif text-lg text-neutral-800">No matching answers found</h3>
            <p className="text-xs text-neutral-500 mt-1 mb-6">
              Try searching with different terms or contact our central helpdesk directly.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F5C5C] text-white text-xs font-medium hover:bg-[#0c4a4a]"
            >
              Contact Patient Services
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((faq, index) => {
              const faqKey = `${faq.category}-${index}`;
              const isOpen = !!openIds[faqKey] || (index === 0 && openIds['0']);
              return (
                <div
                  key={faqKey}
                  className="bg-white rounded-xl border border-[#E6E4DD] overflow-hidden transition-all shadow-xs"
                >
                  <button
                    onClick={() => toggleAccordion(faqKey)}
                    className="w-full text-left px-6 py-5 flex items-start justify-between gap-4 focus:outline-none"
                  >
                    <div className="flex items-start gap-4">
                      <span className="font-mono text-xs text-[#0F5C5C] mt-0.5">
                        {String(index + 1).padStart(2, '0')}.
                      </span>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block mb-1">
                          {faq.category}
                        </span>
                        <h3 className="font-serif text-base sm:text-lg font-medium text-[#141716] leading-snug">
                          {faq.question}
                        </h3>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-500 transition-transform duration-200 mt-1 ${
                        isOpen ? 'rotate-180 bg-teal-50 text-[#0F5C5C]' : ''
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 border-t border-neutral-100 text-sm text-neutral-600 leading-relaxed font-light pl-14">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Still Need Help Banner */}
        <div className="mt-16 bg-white rounded-2xl border border-[#E6E4DD] p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-serif text-xl font-medium text-[#141716] mb-1">
              Have a specific clinical or billing question?
            </h3>
            <p className="text-xs text-neutral-600">
              Our 24-hour centralized patient helpdesk is ready to assist you right away.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/appointments/help"
              className="px-4 py-2.5 rounded-lg border border-[#E6E4DD] text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Appointment Help
            </Link>
            <Link
              href="/contact"
              className="px-4 py-2.5 rounded-lg bg-[#0F5C5C] text-white text-xs font-medium hover:bg-[#0c4a4a] transition-colors inline-flex items-center gap-1.5"
            >
              Contact Desk <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
