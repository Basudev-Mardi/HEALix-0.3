'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

const CONTACT_FAQS: FaqItem[] = [
  {
    q: 'Where do I park when visiting Healix Medical Center, and is valet available?',
    a: 'Visitors can park in our 600-bay sheltered sub-level parking garage accessible via Healix Boulevard (Gate 2). Valet parking is stationed directly at the Main Entrance Circle from 07:00 AM to 09:00 PM daily. Level 2 EV charging stations are located on Level P1.',
  },
  {
    q: 'How do I obtain a visitor pass to see an inpatient?',
    a: 'All visitors must register at the Concierge Desk in the North Atrium (Ground Floor). Present a valid government photo ID to receive a barcode visitor pass. General ward visiting hours are 09:00 AM to 08:30 PM.',
  },
  {
    q: 'What should I do if arriving for an urgent medical emergency?',
    a: 'Proceed directly to the 24/7 Emergency & Level 1 Trauma Center located on the East Plaza with dedicated ambulance bays and drop-off driveway. No appointment or prior notice is required. Call +1 (800) 911-4325 for ambulance dispatch.',
  },
  {
    q: 'Are wheelchairs and mobility assistance available at campus entrances?',
    a: 'Yes. Complimentary wheelchair escorts and mobility assistance are available at both the Main Entrance and the Emergency Department drop-off. Simply ask any concierge ambassador upon arrival.',
  },
  {
    q: 'How do I reach the hospital via public transit?',
    a: 'Healix is directly connected via a climate-controlled underground pedestrian walkway to Metro Medical Center Station (Line 3, Exit B). Bus lines 44, 47, and CT2 stop directly opposite our West Atrium entrance.',
  },
  {
    q: 'How do I submit formal feedback, compliments, or grievances?',
    a: 'You can submit feedback online via our Patient Feedback & Experience survey (/feedback) or speak directly with the Office of the Patient Ombudsman at +1 (800) 432-5499.',
  },
];

export default function ContactFaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {CONTACT_FAQS.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={idx}
            className="rounded-xl border border-[#E6E4DD] bg-white overflow-hidden transition-all shadow-2xs"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#FAF9F6] transition-colors"
            >
              <span className="font-editorial text-sm sm:text-base text-[#14181a] font-medium flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#0F5C5C] shrink-0" />
                {faq.q}
              </span>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-[#0F5C5C] shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-neutral-400 shrink-0" />
              )}
            </button>

            {isOpen && (
              <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-[#f0eee6] bg-[#faf9f6]/40">
                {faq.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
