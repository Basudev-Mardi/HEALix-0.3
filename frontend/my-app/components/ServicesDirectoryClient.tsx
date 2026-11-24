'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Clock,
  HeartPulse,
  Search,
  Stethoscope,
  X,
} from 'lucide-react';
import type { MedicalService } from '@/lib/types';

export default function ServicesDirectoryClient({ services }: { services: MedicalService[] }) {
  const [selected, setSelected] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(services.map((s) => s.category)))],
    [services]
  );

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const matchesCategory = selected === 'All' || s.category === selected;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.short_description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.department_name && s.department_name.toLowerCase().includes(q)) ||
        s.key_features.some((f) => f.toLowerCase().includes(q)) ||
        s.procedures.some((p) => p.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [services, selected, searchQuery]);

  return (
    <div className="space-y-10">
      {/* Distinction & Separation Callout */}
      <div className="rounded-2xl border border-[#174C40]/20 bg-[#E6EFE9]/60 p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-[#174C40] text-white flex items-center justify-center shrink-0">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#242A28]">
              Medical Programs & Clinical Services
            </h2>
            <p className="text-xs sm:text-sm text-[#4A5350] mt-0.5 leading-relaxed">
              Explore specialized outpatient clinics, inpatient admissions, surgery, emergency trauma care,
              radiology, pharmacy, and diagnostic programs.
            </p>
          </div>
        </div>
        <Link
          href="/facilities"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#174C40]/30 text-[#174C40] text-xs font-semibold hover:bg-[#174C40] hover:text-white transition-colors shrink-0"
        >
          <Building2 className="h-3.5 w-3.5" />
          Explore Physical Facilities
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
            placeholder="Search service name, procedure, department..."
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
        <span>Showing {filtered.length} clinical services</span>
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

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((service) => (
          <Link
            key={service.slug}
            href={`/services/${service.slug}`}
            className="card-minimal rounded-2xl p-8 flex flex-col justify-between group hover:border-[#174C40]/50 transition-all duration-200"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-[11px] font-mono uppercase tracking-wider px-3 py-1 rounded-full bg-[#E6EFE9] text-[#174C40] font-medium">
                  {service.category}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#77817C]">
                  <Clock className="h-3.5 w-3.5 text-[#174C40]" />
                  {service.duration_estimate}
                </span>
              </div>

              <h2 className="font-editorial text-2xl sm:text-3xl text-[#242A28] group-hover:text-[#174C40] transition-colors">
                {service.name}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#4A5350]">
                {service.short_description}
              </p>

              <ul className="mt-5 flex flex-wrap gap-2">
                {service.key_features.map((feat) => (
                  <li
                    key={feat}
                    className="text-xs px-3 py-1 rounded-full bg-[#FAFAF7] border border-[#E5E8E6] text-[#4A5350]"
                  >
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-7 pt-4 border-t border-[#E5E8E6] flex items-center justify-between text-xs">
              <span className="text-[#77817C] flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 text-[#174C40]" />
                {service.department_name}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-[#242A28] group-hover:text-[#174C40] transition-colors">
                Service details
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-12 text-center space-y-3">
          <p className="text-base font-medium text-[#242A28]">No medical services match your search</p>
          <p className="text-xs text-[#77817C]">
            Try searching by another term or selecting a different clinical category.
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
