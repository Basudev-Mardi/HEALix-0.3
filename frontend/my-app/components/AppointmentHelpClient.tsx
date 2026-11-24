'use client';

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { AppointmentFaq } from '@/lib/types';

export default function AppointmentHelpClient({ faqs }: { faqs: AppointmentFaq[] }) {
  const categories = useMemo(
    () => ['All', ...Array.from(new Set(faqs.map((f) => f.category)))],
    [faqs]
  );
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [openId, setOpenId] = useState<number | null>(faqs[0]?.id ?? null);

  const filtered =
    selectedCategory === 'All'
      ? faqs
      : faqs.filter((f) => f.category === selectedCategory);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-[#242A28] text-white'
                : 'bg-white border border-[#E5E8E6] text-[#4A5350] hover:border-[#242A28]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              className="rounded-2xl border border-[#E5E8E6] bg-white overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left"
              >
                <div>
                  <span className="block text-[11px] font-mono uppercase tracking-wider text-[#174C40]">
                    {faq.category}
                  </span>
                  <span className="block text-base font-medium text-[#242A28] mt-1">
                    {faq.question}
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-[#77817C] shrink-0 transition-transform ${
                    isOpen ? 'rotate-180 text-[#174C40]' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-6 pt-1 text-sm leading-relaxed text-[#4A5350] border-t border-[#E5E8E6]/70">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
