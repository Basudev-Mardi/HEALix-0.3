'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import PackageEnquiryModal from '@/components/PackageEnquiryModal';
import type { HealthPackage } from '@/lib/types';

interface HealthPackageDetailActionsProps {
  pkg: HealthPackage;
}

export default function HealthPackageDetailActions({
  pkg,
}: HealthPackageDetailActionsProps) {
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  const originalPrice = pkg.original_price || pkg.price;
  const discount =
    originalPrice > pkg.price
      ? Math.round(((originalPrice - pkg.price) / originalPrice) * 100)
      : 0;

  return (
    <>
      <div className="rounded-2xl border border-[#e6e4dd] bg-white p-7 space-y-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#0f5c5c] bg-[#edf5f4] px-2.5 py-0.5 rounded-full font-semibold">
            {pkg.tier} Tier
          </span>
          {pkg.is_popular && (
            <span className="text-[11px] font-mono text-[#0f5c5c] inline-flex items-center gap-1 font-semibold">
              <Sparkles className="h-3 w-3" />
              Most Popular
            </span>
          )}
        </div>

        <div>
          <div className="flex items-baseline gap-2.5">
            <p className="font-editorial text-4xl text-[#14181a]">${pkg.price}</p>
            {discount > 0 && (
              <span className="text-sm line-through text-[#768086] font-mono">
                ${originalPrice}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#768086] mt-1">
            {discount > 0 && <span>Save {discount}%</span>}
            <span>· All taxes &amp; fees included</span>
          </div>
        </div>

        <div className="space-y-2.5 pt-3 border-t border-[#e6e4dd] text-xs text-[#4b555b]">
          <p className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#0f5c5c] shrink-0" />
            <span>1:1 Specialist Physician Review Included</span>
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#0f5c5c] shrink-0" />
            <span>Secure Digital Portal Results Access</span>
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#0f5c5c] shrink-0" />
            <span>Provisional Booking · Final Confirmation by Hospital</span>
          </p>
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-[#0f5c5c] shrink-0" />
            <span>Cashless Corporate &amp; Insurance Billing</span>
          </p>
        </div>

        {/* Dual Primary CTAs */}
        <div className="space-y-2.5 pt-3">
          <Link
            href={`/appointments/book?package=${pkg.slug}`}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#14181a] text-white text-xs font-medium hover:bg-[#0f5c5c] transition-colors shadow-xs"
          >
            <Calendar className="h-4 w-4" />
            Request Package Booking
          </Link>
          <p className="text-[10px] text-center text-amber-800 font-medium">
            Slots are provisional until confirmed by the hospital.
          </p>

          <button
            type="button"
            onClick={() => setIsEnquiryOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-[#0f5c5c] text-[#0f5c5c] bg-[#edf5f4]/50 hover:bg-[#edf5f4] text-xs font-medium transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Enquire &amp; Request Callback
          </button>
        </div>

        {/* Coordinator Contact Helper */}
        <div className="pt-3 border-t border-[#e6e4dd] text-[11px] text-[#768086] space-y-1.5">
          <p className="font-semibold text-[#14181a]">Need custom corporate scheduling?</p>
          <p className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 text-[#0f5c5c]" />
            <span>Helpline: +1 (800) 432-5491</span>
          </p>
          <p className="flex items-center gap-1.5">
            <HelpCircle className="h-3 w-3 text-[#0f5c5c]" />
            <span>Free cancellation up to 4 hrs prior</span>
          </p>
        </div>
      </div>

      {/* Package Enquiry Modal */}
      <PackageEnquiryModal
        pkg={pkg}
        isOpen={isEnquiryOpen}
        onClose={() => setIsEnquiryOpen(false)}
      />
    </>
  );
}
