'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors
    console.error('Healix Global Route Error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full rounded-2xl border border-rose-200 bg-white p-8 shadow-sm space-y-5">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-xl font-bold text-[#242A28]">
            Service Temporarily Unavailable
          </h1>
          <p className="text-xs text-[#77817C] leading-relaxed">
            Our medical systems encounter a transient communication timeout. Your clinical records and booking requests remain safely secured.
          </p>
          {error?.digest && (
            <p className="text-[11px] font-mono text-[#77817C] bg-[#FAFAF7] p-2 rounded-md">
              Incident ID: {error.digest}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#174C40] text-white text-xs font-semibold hover:bg-[#123B32] transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Request
          </button>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E8E6] bg-white text-[#242A28] text-xs font-semibold hover:bg-[#FAFAF7] transition-colors"
          >
            <Home className="h-4 w-4" />
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
