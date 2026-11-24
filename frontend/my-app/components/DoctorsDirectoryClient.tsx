'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  RotateCcw,
  Search,
  ShieldCheck,
  Stethoscope,
  User,
} from 'lucide-react';
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
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [selectedFee, setSelectedFee] = useState('all');
  const [sortBy, setSortBy] = useState<'experience' | 'name'>('experience');

  // Derive unique specialties from doctor records
  const allSpecialties = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => {
      if (d.specialty) set.add(d.specialty);
    });
    return Array.from(set).sort();
  }, [doctors]);

  // Parse fee number from string like "$220" or "Emergency Triage"
  const parseFee = (feeStr: string): number => {
    const match = feeStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return doctors
      .filter((doc) => {
        // Search query
        const matchesQuery =
          !q ||
          doc.name.toLowerCase().includes(q) ||
          doc.specialty.toLowerCase().includes(q) ||
          doc.title.toLowerCase().includes(q) ||
          doc.qualification.toLowerCase().includes(q) ||
          (doc.department_name || '').toLowerCase().includes(q);

        // Department filter
        const matchesDept = selectedDept === 'all' || doc.department_slug === selectedDept;

        // Specialization filter
        const matchesSpecialty =
          selectedSpecialty === 'all' || doc.specialty === selectedSpecialty;

        // Availability filter
        let matchesAvailability = true;
        if (selectedAvailability === 'weekdays') {
          matchesAvailability =
            doc.consultation_days.toLowerCase().includes('mon') ||
            doc.consultation_days.toLowerCase().includes('tue') ||
            doc.consultation_days.toLowerCase().includes('wed');
        } else if (selectedAvailability === 'emergency') {
          matchesAvailability = doc.consultation_days.toLowerCase().includes('24/7');
        }

        // Fee filter
        let matchesFee = true;
        const fee = parseFee(doc.consultation_fee);
        if (selectedFee === 'under-200') {
          matchesFee = fee > 0 && fee < 200;
        } else if (selectedFee === '200-250') {
          matchesFee = fee >= 200 && fee <= 250;
        } else if (selectedFee === 'above-250') {
          matchesFee = fee > 250;
        }

        return matchesQuery && matchesDept && matchesSpecialty && matchesAvailability && matchesFee;
      })
      .sort((a, b) => {
        if (sortBy === 'experience') {
          return b.experience_years - a.experience_years;
        }
        return a.name.localeCompare(b.name);
      });
  }, [doctors, search, selectedDept, selectedSpecialty, selectedAvailability, selectedFee, sortBy]);

  const resetFilters = () => {
    setSearch('');
    setSelectedDept('all');
    setSelectedSpecialty('all');
    setSelectedAvailability('all');
    setSelectedFee('all');
    setSortBy('experience');
  };

  const hasActiveFilters =
    search ||
    selectedDept !== 'all' ||
    selectedSpecialty !== 'all' ||
    selectedAvailability !== 'all' ||
    selectedFee !== 'all' ||
    sortBy !== 'experience';

  return (
    <div className="space-y-8">
      {/* Search Bar & Primary Department Pills */}
      <div className="space-y-5 pb-6 border-b border-[#E5E8E6]">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:flex-1">
            <Search className="h-4 w-4 text-[#77817C] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by doctor name, specialty, or qualification..."
              className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-[#E5E8E6] text-sm text-[#242A28] placeholder:text-[#77817C] focus:outline-none focus:border-[#174C40] shadow-xs"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#77817C] uppercase">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'experience' | 'name')}
                className="px-3.5 py-2 rounded-lg bg-white border border-[#E5E8E6] text-xs font-medium text-[#242A28] focus:outline-none focus:border-[#174C40]"
              >
                <option value="experience">Experience (Highest First)</option>
                <option value="name">Doctor Name (A–Z)</option>
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

        {/* Secondary Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Department Filter */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#77817C] mb-1">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E8E6] text-xs text-[#242A28] focus:outline-none focus:border-[#174C40]"
            >
              <option value="all">All Clinical Departments</option>
              {departments.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Specialization Filter */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#77817C] mb-1">
              Specialization
            </label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E8E6] text-xs text-[#242A28] focus:outline-none focus:border-[#174C40]"
            >
              <option value="all">All Specializations</option>
              {allSpecialties.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#77817C] mb-1">
              Availability
            </label>
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E8E6] text-xs text-[#242A28] focus:outline-none focus:border-[#174C40]"
            >
              <option value="all">All Schedules</option>
              <option value="weekdays">Available Weekdays (Mon–Fri)</option>
              <option value="emergency">24/7 Acute &amp; Emergency</option>
            </select>
          </div>

          {/* Fee Filter */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#77817C] mb-1">
              Consultation Fee
            </label>
            <select
              value={selectedFee}
              onChange={(e) => setSelectedFee(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E8E6] text-xs text-[#242A28] focus:outline-none focus:border-[#174C40]"
            >
              <option value="all">All Fee Ranges</option>
              <option value="under-200">Under $200</option>
              <option value="200-250">$200 &ndash; $250</option>
              <option value="above-250">$250 and above</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Meta Banner */}
      <div className="flex items-center justify-between text-xs text-[#77817C]">
        <p className="font-mono uppercase tracking-[0.12em]">
          Showing {filtered.length} of {doctors.length} verified hospital specialists
        </p>
        <span className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
          <ShieldCheck className="h-3 w-3 text-emerald-600" />
          Schedules Verified by Medical Board
        </span>
      </div>

      {/* Doctors Grid with Listing Card */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E8E6] bg-white p-12 text-center space-y-3">
          <User className="h-10 w-10 text-neutral-400 mx-auto mb-1" />
          <h3 className="text-base font-medium text-[#242A28]">No specialists match your criteria</h3>
          <p className="text-xs text-[#77817C] max-w-sm mx-auto">
            Try resetting your filters or contacting our centralized appointments desk directly for subspecialty referrals.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 rounded-full bg-[#242A28] text-white text-xs font-medium hover:bg-[#174C40] transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((doctor) => (
            <div
              key={doctor.slug}
              className="rounded-2xl border border-[#E5E8E6] bg-white p-7 flex flex-col justify-between hover:border-[#174C40] transition-all shadow-xs group"
            >
              <div>
                {/* Header: Photo / Avatar + Availability Badge */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <DoctorAvatar initials={doctor.avatar_initials} tone={doctor.accent_tone} size="md" />
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Accepting Patients
                    </span>
                    <span className="block text-[11px] font-mono text-[#77817C] mt-1">
                      {doctor.experience_years} Years Experience
                    </span>
                  </div>
                </div>

                {/* Name, Designation, Specialty */}
                <h3 className="font-editorial text-xl font-semibold text-[#242A28] group-hover:text-[#174C40] transition-colors">
                  {doctor.name}
                </h3>
                <p className="text-xs font-medium text-[#174C40] mt-0.5">{doctor.title}</p>
                <p className="text-xs text-[#242A28] font-medium mt-1">{doctor.specialty}</p>

                {/* Qualification and Department Badges */}
                <div className="flex flex-wrap items-center gap-1.5 my-3 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-[#FAFAF7] border border-[#E5E8E6] font-mono text-[#4A5350]">
                    {doctor.qualification}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-teal-50/60 text-[#174C40]">
                    {doctor.department_name}
                  </span>
                </div>

                {/* Bio preview */}
                <p className="text-xs leading-relaxed text-[#4A5350] line-clamp-2 font-light">
                  {doctor.bio}
                </p>
              </div>

              {/* Consultation Details & Dual Action Buttons */}
              <div className="mt-6 pt-4 border-t border-[#E5E8E6] space-y-4">
                <div className="flex items-center justify-between text-xs text-[#4A5350]">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#174C40]" />
                    {doctor.consultation_days}
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] text-[#77817C] block">Consultation Fee</span>
                    <span className="font-mono text-xs font-bold text-[#242A28]">
                      {doctor.consultation_fee}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href={`/doctors/${doctor.slug}`}
                    className="py-2.5 px-3 rounded-lg border border-[#E5E8E6] bg-[#FAFAF7] hover:bg-white hover:border-[#242A28] text-xs font-medium text-[#242A28] text-center transition-colors inline-flex items-center justify-center gap-1"
                  >
                    View Profile
                    <ArrowRight className="h-3.5 w-3.5 text-[#77817C]" />
                  </Link>
                  <Link
                    href={`/appointments/book?doctor=${doctor.slug}`}
                    className="py-2.5 px-3 rounded-lg bg-[#174C40] text-white text-xs font-medium text-center hover:bg-[#0c4a4a] transition-colors inline-flex items-center justify-center gap-1"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Book Visit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
