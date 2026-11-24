'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowUpRight, Clock, Search } from 'lucide-react';
import DoctorAvatar from './DoctorAvatar';
import type { Department, Doctor } from '@/lib/types';

export default function DoctorsDirectoryClient({
  doctors,
  departments,
}: {
  doctors: Doctor[];
  departments: Department[];
}) {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return doctors.filter((doc) => {
      const matchesDept = selectedDept === 'all' || doc.department_slug === selectedDept;
      const matchesQuery =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.specialty.toLowerCase().includes(q) ||
        doc.title.toLowerCase().includes(q) ||
        (doc.department_name || '').toLowerCase().includes(q);
      return matchesDept && matchesQuery;
    });
  }, [doctors, search, selectedDept]);

  return (
    <div className="space-y-10">
      {/* Search & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-8 border-b border-[#e6e4dd]">
        <div className="relative w-full lg:max-w-md">
          <Search className="h-4 w-4 text-[#768086] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor name, specialty, or department..."
            className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-[#e6e4dd] text-sm text-[#14181a] placeholder:text-[#768086] focus:outline-none focus:border-[#0f5c5c]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedDept('all')}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              selectedDept === 'all'
                ? 'bg-[#14181a] text-white'
                : 'bg-white border border-[#e6e4dd] text-[#4b555b] hover:border-[#14181a]'
            }`}
          >
            All Departments
          </button>
          {departments.map((dept) => (
            <button
              key={dept.slug}
              type="button"
              onClick={() => setSelectedDept(dept.slug)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                selectedDept === dept.slug
                  ? 'bg-[#14181a] text-white'
                  : 'bg-white border border-[#e6e4dd] text-[#4b555b] hover:border-[#14181a]'
              }`}
            >
              {dept.name.split('&')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <p className="text-xs font-mono uppercase tracking-[0.12em] text-[#768086]">
        Showing {filtered.length} of {doctors.length} specialists
      </p>

      {/* Doctors Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-12 text-center space-y-2">
          <p className="text-base font-medium text-[#14181a]">No specialists match your search.</p>
          <p className="text-sm text-[#768086]">
            Try clearing your filter or searching another clinical specialty.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((doctor) => (
            <Link
              key={doctor.slug}
              href={`/doctors/${doctor.slug}`}
              className="card-minimal rounded-2xl p-7 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-5">
                  <DoctorAvatar initials={doctor.avatar_initials} tone={doctor.accent_tone} />
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-[#f2f1ec] text-[#4b555b]">
                    {doctor.experience_years} yrs exp
                  </span>
                </div>

                <h2 className="text-lg font-semibold text-[#14181a] group-hover:text-[#0f5c5c] transition-colors">
                  {doctor.name}
                </h2>
                <p className="text-sm text-[#0f5c5c] font-medium mt-0.5">{doctor.specialty}</p>
                <p className="text-xs text-[#768086] mt-1">{doctor.qualification}</p>

                <p className="mt-4 text-sm leading-relaxed text-[#4b555b] line-clamp-2">
                  {doctor.bio}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#e6e4dd] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#4b555b]">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#0f5c5c]" />
                    {doctor.consultation_days}
                  </span>
                  <span className="font-mono text-[#14181a]">{doctor.consultation_fee}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#768086]">{doctor.department_name}</span>
                  <span className="inline-flex items-center gap-1 font-medium text-[#14181a] group-hover:text-[#0f5c5c]">
                    View profile
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
