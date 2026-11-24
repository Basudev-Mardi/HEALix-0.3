'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowUpRight, Clock } from 'lucide-react';
import type { MedicalService } from '@/lib/types';

export default function ServicesDirectoryClient({ services }: { services: MedicalService[] }) {
  const categories = useMemo(
    () => ['All', ...Array.from(new Set(services.map((s) => s.category)))],
    [services]
  );
  const [selected, setSelected] = useState('All');

  const filtered =
    selected === 'All' ? services : services.filter((s) => s.category === selected);

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
        {filtered.map((service) => (
          <Link
            key={service.slug}
            href={`/services/${service.slug}`}
            className="card-minimal rounded-2xl p-8 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-[11px] font-mono uppercase tracking-wider px-3 py-1 rounded-full bg-[#edf5f4] text-[#0f5c5c]">
                  {service.category}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#768086]">
                  <Clock className="h-3.5 w-3.5" />
                  {service.duration_estimate}
                </span>
              </div>

              <h2 className="font-editorial text-2xl sm:text-3xl text-[#14181a] group-hover:text-[#0f5c5c] transition-colors">
                {service.name}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#4b555b]">
                {service.short_description}
              </p>

              <ul className="mt-5 flex flex-wrap gap-2">
                {service.key_features.map((feat) => (
                  <li
                    key={feat}
                    className="text-xs px-3 py-1 rounded-full bg-[#faf9f6] border border-[#e6e4dd] text-[#4b555b]"
                  >
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-7 pt-4 border-t border-[#e6e4dd] flex items-center justify-between text-xs">
              <span className="text-[#768086]">{service.department_name}</span>
              <span className="inline-flex items-center gap-1 font-medium text-[#14181a] group-hover:text-[#0f5c5c]">
                Service details
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
