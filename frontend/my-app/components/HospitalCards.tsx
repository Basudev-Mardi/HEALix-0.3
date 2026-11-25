'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Clock,
} from 'lucide-react';
import Image from 'next/image';
import DoctorAvatar from '@/components/DoctorAvatar';
import DepartmentIcon from '@/components/DepartmentIcon';
import { getDepartmentImage } from '@/lib/department-utils';
import type { Department, Doctor } from '@/lib/types';

export { getDepartmentImage };

// 1. Doctor Card
export interface DoctorCardProps {
  doctor: Doctor;
  onBookClick?: (doctor: Doctor) => void;
  isLoading?: boolean;
}

export function DoctorCard({ doctor, onBookClick, isLoading }: DoctorCardProps) {
  if (isLoading) {
    return (
      <div className="card-minimal p-6 rounded-2xl animate-pulse space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-zinc-200" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-zinc-200 rounded-md w-3/4" />
            <div className="h-3 bg-zinc-200 rounded-md w-1/2" />
          </div>
        </div>
        <div className="h-10 bg-zinc-100 rounded-xl" />
      </div>
    );
  }

  return (
    <article className="card-minimal rounded-2xl p-6 flex flex-col justify-between space-y-5 group">
      <div>
        <div className="flex items-start gap-4">
          <DoctorAvatar
            initials={doctor.avatar_initials || doctor.name.substring(0, 2).toUpperCase()}
            tone={doctor.accent_tone || 'slate'}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <Link
              href={`/doctors/${doctor.slug}`}
              className="font-heading text-base font-semibold text-[#242A28] hover:text-[#174C40] transition-colors block truncate"
            >
              {doctor.name}
            </Link>
            <p className="text-xs text-[#174C40] font-medium mt-0.5">{doctor.title}</p>
            <p className="text-xs text-[#77817C] truncate">{doctor.qualification}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#E5E8E6] space-y-2 text-xs text-[#4A5350]">
          <div className="flex items-center justify-between">
            <span className="text-[#77817C]">Experience:</span>
            <span className="font-semibold text-[#242A28]">{doctor.experience_years} years</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#77817C]">Consultation Fee:</span>
            <span className="font-mono font-semibold text-[#174C40]">{doctor.consultation_fee}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#77817C] pt-1">
            <Clock className="h-3.5 w-3.5 text-[#174C40] shrink-0" />
            <span className="truncate">{doctor.consultation_days}</span>
          </div>
        </div>
      </div>

      <div className="pt-2 flex items-center gap-2.5">
        <Link
          href={`/doctors/${doctor.slug}`}
          className="flex-1 btn-secondary text-xs h-10 text-center"
        >
          View Profile
        </Link>
        {onBookClick ? (
          <button
            type="button"
            onClick={() => onBookClick(doctor)}
            className="flex-1 btn-primary text-xs h-10"
          >
            Book Visit
          </button>
        ) : (
          <Link
            href={`/appointments/book?doctor=${doctor.slug}`}
            className="flex-1 btn-primary text-xs h-10 text-center"
          >
            Book Visit
          </Link>
        )}
      </div>
    </article>
  );
}

// 2. Department Card
export interface DepartmentCardProps {
  department: Department;
  isLoading?: boolean;
}

export function DepartmentCard({ department, isLoading }: DepartmentCardProps) {
  if (isLoading) {
    return (
      <div className="card-minimal rounded-2xl overflow-hidden animate-pulse">
        <div className="w-full h-[130px] bg-zinc-200" />
        <div className="p-6 space-y-3">
          <div className="h-9 w-9 bg-zinc-200 rounded-xl" />
          <div className="h-4 bg-zinc-200 rounded-md w-2/3" />
          <div className="h-3 bg-zinc-100 rounded-md w-full" />
        </div>
      </div>
    );
  }

  const imageUrl = getDepartmentImage(department.slug || department.name);

  return (
    <Link
      href={`/departments/${department.slug}`}
      className="card-minimal rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-[#174C40] hover:-translate-y-0.5 transition-all duration-200 bg-white shadow-xs"
    >
      <div>
        {/* 16:9 Image at top with 120-140px fixed height and matching rounded corners */}
        <div className="relative w-full h-[130px] overflow-hidden bg-[#FAFAF7]">
          <Image
            src={imageUrl}
            alt={department.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Card Content placed below the image */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            {/* Retained smaller green icon */}
            <div className="h-9 w-9 rounded-xl bg-[#E6EFE9] text-[#174C40] flex items-center justify-center shrink-0">
              <DepartmentIcon name={department.icon} className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-mono text-[#77817C]">
              {department.floor_location || `${department.doctor_count || 0} Specialists`}
            </span>
          </div>
          <h3 className="font-heading text-lg font-semibold text-[#242A28] group-hover:text-[#174C40] transition-colors leading-snug">
            {department.name}
          </h3>
          <p className="text-xs text-[#4A5350] mt-2 line-clamp-2 leading-relaxed">
            {department.short_description || department.overview}
          </p>
        </div>
      </div>

      <div className="px-6 pb-5 pt-3 border-t border-[#E5E8E6] flex items-center justify-between text-xs text-[#174C40] font-medium">
        <span>Department Details</span>
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

// 3. Hospital Statistics Component
export interface HospitalStatItem {
  label: string;
  value: string;
  sublabel?: string;
}

export function HospitalStatistics({ stats }: { stats: HospitalStatItem[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-[#E5E8E6] bg-white p-5 sm:p-6 text-center"
        >
          <p className="font-heading text-3xl sm:text-4xl font-bold text-[#174C40] tracking-tight">
            {stat.value}
          </p>
          <p className="text-xs sm:text-sm font-semibold text-[#242A28] mt-1">{stat.label}</p>
          {stat.sublabel && (
            <p className="text-[11px] text-[#77817C] mt-0.5">{stat.sublabel}</p>
          )}
        </div>
      ))}
    </div>
  );
}
