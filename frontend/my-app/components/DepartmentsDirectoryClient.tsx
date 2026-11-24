'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BedDouble,
  Building2,
  Filter,
  MapPin,
  RotateCcw,
  Search,
  UserRound,
} from 'lucide-react';
import DepartmentIcon from '@/components/DepartmentIcon';
import type { Department } from '@/lib/types';

export default function DepartmentsDirectoryClient({
  departments,
}: {
  departments: Department[];
}) {
  const [search, setSearch] = useState('');
  const [selectedWing, setSelectedWing] = useState('all');

  // Derive unique wings/locations
  const wings = useMemo(() => {
    const set = new Set<string>();
    departments.forEach((d) => {
      const part = d.floor_location.split(',')[0].trim();
      if (part) set.add(part);
    });
    return Array.from(set).sort();
  }, [departments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return departments.filter((dept) => {
      const matchesQuery =
        !q ||
        dept.name.toLowerCase().includes(q) ||
        dept.short_description.toLowerCase().includes(q) ||
        dept.overview.toLowerCase().includes(q) ||
        dept.head_doctor_name.toLowerCase().includes(q) ||
        dept.conditions_treated?.some((c) => c.toLowerCase().includes(q)) ||
        dept.highlights?.some((h) => h.toLowerCase().includes(q));

      const matchesWing =
        selectedWing === 'all' || dept.floor_location.toLowerCase().includes(selectedWing.toLowerCase());

      return matchesQuery && matchesWing;
    });
  }, [departments, search, selectedWing]);

  const resetFilters = () => {
    setSearch('');
    setSelectedWing('all');
  };

  const hasActiveFilters = search || selectedWing !== 'all';

  return (
    <div className="space-y-8">
      {/* Search & Location Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-[#E5E8E6]">
        <div className="relative w-full sm:max-w-md">
          <Search className="h-4 w-4 text-[#77817C] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by department, condition (e.g. stroke, arrhythmia), or equipment..."
            className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-[#E5E8E6] text-sm text-[#242A28] placeholder:text-[#77817C] focus:outline-none focus:border-[#174C40] shadow-xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#77817C] uppercase">Campus Wing:</span>
            <select
              value={selectedWing}
              onChange={(e) => setSelectedWing(e.target.value)}
              className="px-3.5 py-2 rounded-lg bg-white border border-[#E5E8E6] text-xs font-medium text-[#242A28] focus:outline-none focus:border-[#174C40]"
            >
              <option value="all">All Wings &amp; Towers</option>
              {wings.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E5E8E6] bg-[#FAFAF7] text-xs text-[#b91c1c] hover:bg-rose-50 hover:border-rose-200 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Meta Count */}
      <p className="text-xs font-mono uppercase tracking-[0.12em] text-[#77817C]">
        Showing {filtered.length} of {departments.length} clinical divisions &amp; centers of excellence
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-12 text-center space-y-3">
          <Building2 className="h-10 w-10 text-neutral-400 mx-auto mb-1" />
          <h3 className="text-base font-medium text-[#242A28]">No departments match your query</h3>
          <p className="text-xs text-[#77817C] max-w-sm mx-auto">
            Try adjusting your search terms or view our complete medical services directory.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 rounded-full bg-[#242A28] text-white text-xs font-medium hover:bg-[#174C40] transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((dept) => (
            <Link
              key={dept.slug}
              href={`/departments/${dept.slug}`}
              className="card-minimal rounded-2xl p-8 flex flex-col justify-between group hover:border-[#174C40] transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-6">
                  <span className="h-12 w-12 rounded-xl bg-[#E6EFE9] text-[#174C40] flex items-center justify-center">
                    <DepartmentIcon name={dept.icon} className="h-6 w-6" />
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#242A28] group-hover:text-[#174C40]">
                    Explore department
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>

                <h2 className="font-editorial text-2xl sm:text-3xl text-[#242A28] group-hover:text-[#174C40] transition-colors">
                  {dept.name}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#4A5350] font-light">
                  {dept.overview}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {dept.highlights.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1 rounded-full bg-[#FAFAF7] border border-[#E5E8E6] text-[#4A5350]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-7 pt-5 border-t border-[#E5E8E6] grid grid-cols-3 gap-3 text-xs text-[#77817C]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#174C40] shrink-0" />
                  <span className="truncate">{dept.floor_location}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BedDouble className="h-3.5 w-3.5 text-[#174C40] shrink-0" />
                  {dept.beds_allocated} Beds
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="h-3.5 w-3.5 text-[#174C40] shrink-0" />
                  <span className="truncate">{dept.head_doctor_name}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
