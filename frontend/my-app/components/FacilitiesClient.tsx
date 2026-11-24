'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  Clock,
  HeartPulse,
  MapPin,
  Phone,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import type { Facility } from '@/lib/types';

export default function FacilitiesClient({ facilities }: { facilities: Facility[] }) {
  const [selected, setSelected] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(facilities.map((f) => f.category)))],
    [facilities]
  );

  const filtered = useMemo(() => {
    return facilities.filter((f) => {
      const matchesCategory = selected === 'All' || f.category === selected;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.floor_location.toLowerCase().includes(q) ||
        f.highlights.some((h) => h.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [facilities, selected, searchQuery]);

  return (
    <div className="space-y-10">
      {/* Distinction & Separation Callout */}
      <div className="rounded-2xl border border-[#174C40]/20 bg-[#E6EFE9]/60 p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-[#174C40] text-white flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#242A28]">
              Physical Hospital Facilities & Campus Infrastructure
            </h2>
            <p className="text-xs sm:text-sm text-[#4A5350] mt-0.5 leading-relaxed">
              Explore operation theatres, intensive care units, private inpatient suites, diagnostic wings,
              lounges, and accessibility services.
            </p>
          </div>
        </div>
        <Link
          href="/services"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#174C40]/30 text-[#174C40] text-xs font-semibold hover:bg-[#174C40] hover:text-white transition-colors shrink-0"
        >
          <HeartPulse className="h-3.5 w-3.5" />
          Switch to Medical Services
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77817C]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search facility name, equipment, floor..."
            className="w-full pl-10 pr-10 py-2.5 rounded-full border border-[#E5E8E6] bg-white text-sm text-[#242A28] placeholder:text-[#77817C] focus:outline-none focus:border-[#174C40] focus:ring-1 focus:ring-[#174C40]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#77817C] hover:text-[#242A28]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pb-6 border-b border-[#E5E8E6]">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelected(cat)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                selected === cat
                  ? 'bg-[#242A28] text-white'
                  : 'bg-white border border-[#E5E8E6] text-[#4A5350] hover:border-[#242A28]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-[#77817C] font-mono">
        <span>Showing {filtered.length} hospital facilities</span>
        {(selected !== 'All' || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              setSelected('All');
              setSearchQuery('');
            }}
            className="text-[#174C40] hover:underline"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((facility) => (
          <article
            key={facility.id}
            className="card-minimal rounded-2xl p-8 flex flex-col justify-between hover:border-[#174C40]/50 transition-all duration-200 group"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <span className="text-[11px] font-mono uppercase tracking-wider px-3 py-1 rounded-full bg-[#E6EFE9] text-[#174C40] font-medium">
                  {facility.category}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#77817C]">
                  <Clock className="h-3.5 w-3.5 text-[#174C40]" />
                  {facility.availability}
                </span>
              </div>

              <h2 className="font-editorial text-2xl sm:text-3xl text-[#242A28] group-hover:text-[#174C40] transition-colors">
                <Link href={`/facilities/${facility.slug}`}>
                  {facility.name}
                </Link>
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-[#4A5350]">
                {facility.description}
              </p>

              {facility.capacity_or_specs && (
                <div className="mt-3 text-xs font-mono text-[#77817C] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#174C40] shrink-0" />
                  <span>{facility.capacity_or_specs}</span>
                </div>
              )}

              <ul className="mt-5 space-y-2">
                {facility.highlights.slice(0, 3).map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs sm:text-sm text-[#242A28]">
                    <Check className="h-4 w-4 text-[#174C40] mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-7 pt-4 border-t border-[#E5E8E6] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#77817C]">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#174C40] shrink-0" />
                  <span>{facility.floor_location}</span>
                </div>
                {facility.contact_phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-[#174C40] shrink-0" />
                    <span className="font-mono">{facility.contact_phone}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end">
                <Link
                  href={`/facilities/${facility.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#242A28] group-hover:text-[#174C40] transition-colors"
                >
                  View Facility Details
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-12 text-center space-y-3">
          <p className="text-base font-medium text-[#242A28]">No facilities match your search</p>
          <p className="text-xs text-[#77817C]">
            Try clearing the search query or selecting another category.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelected('All');
              setSearchQuery('');
            }}
            className="mt-2 px-4 py-2 rounded-full bg-[#242A28] text-white text-xs font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
