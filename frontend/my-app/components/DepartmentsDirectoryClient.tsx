'use client';

import Link from 'next/link';
import Image from 'next/image';
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
import { getDepartmentImage } from '@/components/HospitalCards';
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((dept) => {
            const deptImage = getDepartmentImage(dept.slug || dept.name);
            return (
              <Link
                key={dept.slug}
                href={`/departments/${dept.slug}`}
                className="card-minimal rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-[#174C40] hover:-translate-y-0.5 transition-all duration-200 bg-white shadow-xs"
              >
                <div>
                  {/* 16:9 Image at top with 120-140px height, 100% width, matching rounded top corners */}
                  <div className="relative w-full h-[130px] overflow-hidden bg-[#FAFAF7]">
                    <Image
                      src={deptImage}
                      alt={dept.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Department Details placed below the image */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3.5">
                      {/* Retained smaller green icon */}
                      <span className="h-9 w-9 rounded-xl bg-[#E6EFE9] text-[#174C40] flex items-center justify-center shrink-0">
                        <DepartmentIcon name={dept.icon} className="h-4 w-4" />
                      </span>
                      <span className="text-[11px] font-mono text-[#77817C]">{dept.floor_location}</span>
                    </div>

                    <h2 className="text-xl font-medium text-[#242A28] group-hover:text-[#174C40] transition-colors font-editorial leading-snug">
                      {dept.name}
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#4A5350] font-light line-clamp-2">
                      {dept.short_description || dept.overview}
                    </p>

                    {dept.highlights && dept.highlights.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {dept.highlights.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#FAFAF7] border border-[#E5E8E6] text-[#4A5350]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 pb-5 pt-3 border-t border-[#E5E8E6] flex items-center justify-between text-xs text-[#77817C]">
                  <span className="font-mono">{dept.beds_allocated} Dedicated Beds</span>
                  <span className="inline-flex items-center gap-1 text-[#174C40] font-medium group-hover:translate-x-0.5 transition-transform">
                    Department Details
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
