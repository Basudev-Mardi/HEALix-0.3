import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home, Calendar, PhoneCall } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full rounded-2xl border border-[#E5E8E6] bg-white p-8 shadow-xs space-y-5">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-[#E6EFE9] text-[#174C40] flex items-center justify-center">
          <FileQuestion className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#E6EFE9] text-[#174C40] text-[11px] font-bold uppercase tracking-wider">
            Error 404
          </span>
          <h1 className="font-heading text-xl font-bold text-[#242A28]">
            Page or Clinical Record Not Found
          </h1>
          <p className="text-xs text-[#77817C] leading-relaxed">
            The hospital resource, doctor directory page, or clinical document link you requested does not exist or has been relocated.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#174C40] text-white text-xs font-semibold hover:bg-[#123B32] transition-colors"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
          <Link
            href="/book-appointment"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E8E6] bg-white text-[#242A28] text-xs font-semibold hover:bg-[#FAFAF7] transition-colors"
          >
            <Calendar className="h-4 w-4" />
            Book Visit
          </Link>
        </div>
        <div className="border-t border-[#E5E8E6] pt-4 text-xs text-[#77817C]">
          Immediate emergency assistance?{' '}
          <a href="tel:+18009114325" className="font-semibold text-[#174C40] underline inline-flex items-center gap-1">
            <PhoneCall className="h-3 w-3" /> 24/7 Trauma: +1 (800) 911-4325
          </a>
        </div>
      </div>
    </div>
  );
}
