'use client';

import { useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import type { GalleryItem } from '@/lib/types';

const PALETTE_STYLES: Record<string, { bg: string; accent: string; line: string }> = {
  stone: {
    bg: 'from-[#edeae2] via-[#f5f3ee] to-[#e4dfd5]',
    accent: 'text-[#5b5347]',
    line: 'border-[#d6cfc3]',
  },
  slate: {
    bg: 'from-[#e5eaee] via-[#f0f3f5] to-[#d9e1e7]',
    accent: 'text-[#2c3e50]',
    line: 'border-[#c8d3dc]',
  },
  warm: {
    bg: 'from-[#f3ece2] via-[#f8f4ed] to-[#e9dfd0]',
    accent: 'text-[#6c5439]',
    line: 'border-[#ddd0bc]',
  },
  cool: {
    bg: 'from-[#e4eff0] via-[#eff6f6] to-[#d5e7e8]',
    accent: 'text-[#0f5c5c]',
    line: 'border-[#c2dcdc]',
  },
  sage: {
    bg: 'from-[#e6efe9] via-[#f1f6f3] to-[#d8e6dd]',
    accent: 'text-[#235347]',
    line: 'border-[#c5d9cd]',
  },
  amber: {
    bg: 'from-[#f5eee0] via-[#faf6ee] to-[#ebe0ca]',
    accent: 'text-[#74562a]',
    line: 'border-[#dfd0b3]',
  },
};

export default function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const categories = useMemo(
    () => ['All', ...Array.from(new Set(items.map((item) => item.category)))],
    [items]
  );
  const [selected, setSelected] = useState('All');

  const filtered =
    selected === 'All' ? items : items.filter((item) => item.category === selected);

  return (
    <div className="space-y-10">
      {/* Category Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelected(cat)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              selected === cat
                ? 'bg-[#14181a] text-white'
                : 'bg-white border border-[#e6e4dd] text-[#4b555b] hover:border-[#14181a] hover:text-[#14181a]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Architectural Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item, idx) => {
          const palette = PALETTE_STYLES[item.accent_palette] || PALETTE_STYLES.stone;
          const spanClass =
            item.aspect_ratio === 'wide' && selected === 'All' ? 'md:col-span-2' : '';

          return (
            <article
              key={item.id}
              className={`card-minimal rounded-2xl overflow-hidden flex flex-col ${spanClass}`}
            >
              {/* Minimalist Architectural Visual Plate */}
              <div
                className={`relative h-60 sm:h-64 bg-gradient-to-br ${palette.bg} p-6 flex flex-col justify-between overflow-hidden`}
              >
                {/* Subtle architectural grid lines */}
                <div className="absolute inset-0 opacity-35 pointer-events-none">
                  <div className={`absolute top-8 right-8 h-32 w-32 rounded-full border ${palette.line}`} />
                  <div className={`absolute -bottom-10 -left-10 h-44 w-44 rounded-full border ${palette.line}`} />
                  <div className={`absolute inset-x-6 top-1/2 border-t ${palette.line}`} />
                </div>

                <div className="relative flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm text-[11px] font-mono uppercase tracking-wider text-[#14181a]">
                    {item.category}
                  </span>
                  <span className={`font-mono text-xs ${palette.accent}`}>
                    0{idx + 1}
                  </span>
                </div>

                <div className="relative">
                  <p className={`font-editorial text-2xl sm:text-3xl leading-tight ${palette.accent}`}>
                    {item.title}
                  </p>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between bg-white">
                <p className="text-sm leading-relaxed text-[#4b555b]">{item.description}</p>
                <p className="mt-5 pt-4 border-t border-[#e6e4dd] flex items-center gap-1.5 text-xs text-[#768086]">
                  <MapPin className="h-3.5 w-3.5 text-[#0f5c5c]" />
                  {item.location}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
