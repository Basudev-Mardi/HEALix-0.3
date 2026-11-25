'use client';

import React from 'react';
import { WifiOff, AlertCircle } from 'lucide-react';
import { useNetworkStatus } from '@/lib/formatters';

export function OfflineBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-[#991B1B] text-white px-4 py-2.5 text-xs font-medium shadow-md transition-all"
    >
      <WifiOff className="h-4 w-4 shrink-0 animate-pulse" />
      <span>
        No Internet Connection detected. You are viewing cached medical data; new appointment bookings and payments require an active connection.
      </span>
    </div>
  );
}
