'use client';

import { useMemo, useState } from 'react';
import { Check, Clock, MapPin } from 'lucide-react';
import type { Facility } from '@/lib/types';

export default function FacilitiesClient({ facilities }: { facilities: Facility[] }) {
  const categories = useMemo(
    () => ['All', ...Array.from(new Set(facilities.map((f) => f.category)))],
    [facilities]
  );
  const [selected, setSelected] = useState('All');

  const filtered =
    selected === 'All' ? facilities : facilities.filter((f) => f.category === selected);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-2 pb-6 border-b border-[#e6e4dd]">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelected(cat)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              selected === cat
                ? 'bg-[#14181a] text-white'
                : 'bg-white border border-[#e6e4dd] text-[#4b555b] hover:border-[#14181a]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((facility) => (
          <article
            key={facility.id}
            className="card-minimal rounded-2xl p-8 flex flex-col justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <span className="text-[11px] font-mono uppercase tracking-wider px-3 py-1 rounded-full bg-[#edf5f4] text-[#0f5c5c]">
                  {facility.category}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#768086]">
                  <Clock className="h-3.5 w-3.5 text-[#0f5c5c]" />
                  {facility.availability}
                </span>
              </div>

              <h2 className="font-editorial text-2xl text-[#14181a]">{facility.name}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#4b555b]">{facility.description}</p>

              <ul className="mt-5 space-y-2">
                {facility.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#14181a]">
                    <Check className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-[#e6e4dd] flex items-center gap-1.5 text-xs text-[#768086]">
              <MapPin className="h-3.5 w-3.5 text-[#0f5c5c]" />
              {facility.floor_location}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
