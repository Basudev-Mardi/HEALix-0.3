'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import type { GalleryItem } from '@/lib/types';

const GALLERY_IMAGE_MAP: Record<string, string> = {
  '1': '/images/hospital-exterior.png',
  '2': '/images/robotic-operating-suite.png',
  '3': '/images/inpatient-recovery-suite.png',
  '4': '/images/mri-imaging-suite.png',
  '5': '/images/emergency-trauma-bay.png',
  '6': '/images/doctor-consultation.png',
};

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
    accent: 'text-[#174C40]',
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
                ? 'bg-[#242A28] text-white'
                : 'bg-white border border-[#E5E8E6] text-[#4A5350] hover:border-[#242A28] hover:text-[#242A28]'
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
          const realImage = GALLERY_IMAGE_MAP[String(item.id)] || GALLERY_IMAGE_MAP[String((idx % 6) + 1)];

          return (
            <article
              key={item.id}
              className={`card-minimal rounded-2xl overflow-hidden flex flex-col group ${spanClass}`}
            >
              {/* Real Medical Image Header */}
              <div className="relative h-64 sm:h-72 overflow-hidden bg-zinc-900">
                <Image
                  src={realImage}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[11px] font-mono uppercase tracking-wider text-[#242A28]">
                      {item.category}
                    </span>
                    <span className="font-mono text-xs text-white/90 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-xs">
                      0{idx + 1}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-editorial text-2xl sm:text-3xl leading-tight text-white drop-shadow-xs">
                      {item.title}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between bg-white">
                <p className="text-sm leading-relaxed text-[#4A5350]">{item.description}</p>
                <p className="mt-5 pt-4 border-t border-[#E5E8E6] flex items-center gap-1.5 text-xs text-[#77817C]">
                  <MapPin className="h-3.5 w-3.5 text-[#174C40]" />
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
