import React from 'react';

// Reusable animated skeleton loader components
export function Skeleton({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#E5E8E6] ${className}`}
      {...props}
    />
  );
}

// Doctor Card Skeleton
export function DoctorCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#E5E8E6] bg-white p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 flex-1 rounded-xl" />
        <Skeleton className="h-8 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

// Department / Service Card Skeleton
export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#E5E8E6] bg-white p-6 shadow-xs space-y-3">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="pt-2 flex justify-between items-center">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

// Table / List Row Skeleton
export function ListRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="divide-y divide-[#E5E8E6] rounded-2xl border border-[#E5E8E6] bg-white overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 flex items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-7 w-20 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  );
}
