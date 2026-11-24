import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, BedDouble, MapPin, UserRound } from 'lucide-react';
import DepartmentIcon from '@/components/DepartmentIcon';
import PageHeader from '@/components/PageHeader';
import { getDepartments } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Departments',
  description:
    'Explore clinical departments and specialized centers of excellence at Healix Medical Center.',
};

export default async function DepartmentsPage() {
  const departments = await getDepartments();

  return (
    <div>
      <PageHeader
        eyebrow="Clinical Divisions"
        title="Departments & Centers of Excellence"
        description="Six multidisciplinary clinical institutes organized around rapid diagnosis, sub-specialty collaboration, and seamless inpatient-to-recovery continuity."
        breadcrumbs={[{ label: 'Departments' }]}
      />

      <section className="container-editorial py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {departments.map((dept) => (
            <Link
              key={dept.slug}
              href={`/departments/${dept.slug}`}
              className="card-minimal rounded-2xl p-8 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-6">
                  <span className="h-12 w-12 rounded-xl bg-[#edf5f4] text-[#0f5c5c] flex items-center justify-center">
                    <DepartmentIcon name={dept.icon} className="h-6 w-6" />
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#14181a] group-hover:text-[#0f5c5c]">
                    Explore department
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>

                <h2 className="font-editorial text-2xl sm:text-3xl text-[#14181a] group-hover:text-[#0f5c5c] transition-colors">
                  {dept.name}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#4b555b]">{dept.overview}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {dept.highlights.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1 rounded-full bg-[#faf9f6] border border-[#e6e4dd] text-[#4b555b]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-7 pt-5 border-t border-[#e6e4dd] grid grid-cols-3 gap-3 text-xs text-[#768086]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#0f5c5c] shrink-0" />
                  <span className="truncate">{dept.floor_location}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BedDouble className="h-3.5 w-3.5 text-[#0f5c5c] shrink-0" />
                  {dept.beds_allocated} Beds
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="h-3.5 w-3.5 text-[#0f5c5c] shrink-0" />
                  <span className="truncate">{dept.head_doctor_name}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
