'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Calendar, Clock, Globe, Search } from 'lucide-react';
import DoctorAvatar from './DoctorAvatar';
import type { Department, Doctor } from '@/lib/types';

export default function AppointmentDoctorFinder({
  doctors,
  departments,
}: {
  doctors: Doctor[];
  departments: Department[];
}) {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');

  const bookableDoctors = useMemo(() => {
    const q = search.trim().toLowerCase();
    return doctors.filter((doc) => {
      const matchesDept = department === 'all' || doc.department_slug === department;
      const matchesQuery =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.specialty.toLowerCase().includes(q) ||
        (doc.department_name || '').toLowerCase().includes(q) ||
        doc.languages.some((l) => l.toLowerCase().includes(q));
      return matchesDept && matchesQuery;
    });
  }, [doctors, search, department]);

  return (
    <div className="space-y-8">
      {/* Filter Bar */}
      <div className="rounded-2xl border border-[#e6e4dd] bg-white p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-7 relative">
            <Search className="h-4 w-4 text-[#768086] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search specialist, symptom area, or language..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] placeholder:text-[#768086] focus:outline-none focus:border-[#0f5c5c]"
            />
          </div>

          <div className="md:col-span-5">
            <select
              aria-label="Filter by department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
            >
              <option value="all">All Clinical Departments</option>
              {departments.map((dept) => (
                <option key={dept.slug} value={dept.slug}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#e6e4dd] text-xs text-[#768086]">
          <span className="font-mono uppercase tracking-wider">
            {bookableDoctors.length} specialists available for online scheduling
          </span>
          <div className="flex items-center gap-4">
            <Link href="/appointments/track" className="text-[#0f5c5c] font-medium hover:underline">
              Track existing booking
            </Link>
            <Link href="/appointments/help" className="hover:text-[#14181a] transition-colors">
              Need help choosing?
            </Link>
          </div>
        </div>
      </div>

      {/* Specialists List */}
      {bookableDoctors.length === 0 ? (
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-12 text-center space-y-2">
          <p className="text-base font-medium text-[#14181a]">No matching doctors found.</p>
          <p className="text-sm text-[#768086]">Try another specialty or clear your search term.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookableDoctors.map((doc) => (
            <article
              key={doc.slug}
              className="card-minimal rounded-2xl p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-5">
                <DoctorAvatar initials={doc.avatar_initials} tone={doc.accent_tone} />
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#0f5c5c]">
                      {doc.department_name}
                    </span>
                    <span className="text-[#d5d2c9]">·</span>
                    <span className="text-xs text-[#768086]">{doc.experience_years} yrs exp</span>
                  </div>
                  <h2 className="text-xl font-medium text-[#14181a]">
                    <Link href={`/doctors/${doc.slug}`} className="hover:text-[#0f5c5c] transition-colors">
                      {doc.name}
                    </Link>
                  </h2>
                  <p className="text-sm text-[#4b555b]">
                    {doc.specialty} · <span className="font-mono text-xs">{doc.qualification}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-4 pt-1.5 text-xs text-[#768086]">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#0f5c5c]" />
                      {doc.consultation_days}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#0f5c5c]" />
                      {doc.consultation_hours}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-[#0f5c5c]" />
                      {doc.languages.join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-row lg:flex-col items-center lg:items-end justify-between gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#e6e4dd] shrink-0">
                <div className="lg:text-right">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-[#768086]">
                    Consultation
                  </p>
                  <p className="font-mono text-lg font-semibold text-[#14181a]">
                    {doc.consultation_fee}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <Link
                    href={`/doctors/${doc.slug}`}
                    className="px-4 py-2.5 rounded-full border border-[#d5d2c9] text-xs font-medium text-[#14181a] hover:border-[#14181a] transition-colors"
                  >
                    Profile
                  </Link>
                  <Link
                    href={`/appointments/book?doctor=${doc.slug}`}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#14181a] text-white text-xs font-medium hover:bg-[#0f5c5c] transition-colors"
                  >
                    Book Slot
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
