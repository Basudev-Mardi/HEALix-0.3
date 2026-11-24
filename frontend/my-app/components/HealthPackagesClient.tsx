'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Check, Clock, Sparkles } from 'lucide-react';
import type { HealthPackage } from '@/lib/types';

export default function HealthPackagesClient({ packages }: { packages: HealthPackage[] }) {
  const [selectedTier, setSelectedTier] = useState('All');

  const tiers = useMemo(() => {
    return ['All', ...Array.from(new Set(packages.map((p) => p.tier)))];
  }, [packages]);

  const filtered = useMemo(() => {
    if (selectedTier === 'All') return packages;
    return packages.filter((p) => p.tier.toLowerCase() === selectedTier.toLowerCase());
  }, [packages, selectedTier]);

  return (
    <div className="space-y-10">
      {/* Tier Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#e6e4dd]">
        <div className="flex flex-wrap items-center gap-2">
          {tiers.map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setSelectedTier(tier)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                selectedTier === tier
                  ? 'bg-[#14181a] text-white'
                  : 'bg-white border border-[#e6e4dd] text-[#4b555b] hover:border-[#14181a]'
              }`}
            >
              {tier === 'All' ? 'All Packages' : `${tier} Tier`}
            </button>
          ))}
        </div>

        <p className="text-xs font-mono text-[#768086]">
          {filtered.length} preventive health packages available
        </p>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((pkg) => {
          const discount = Math.round(((pkg.original_price - pkg.price) / pkg.original_price) * 100);
          const totalTests = pkg.tests.reduce((acc, g) => acc + g.items.length, 0);

          return (
            <article
              key={pkg.slug}
              className={`rounded-2xl border p-7 flex flex-col justify-between transition-all relative ${
                pkg.is_popular
                  ? 'border-[#0f5c5c] bg-white shadow-md'
                  : 'border-[#e6e4dd] bg-white hover:border-[#d5d2c9]'
              }`}
            >
              {pkg.is_popular && (
                <span className="absolute -top-3 right-6 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0f5c5c] text-white font-mono text-[10px] uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" />
                  Most Popular
                </span>
              )}

              <div className="space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#edf5f4] text-[#0f5c5c]">
                    {pkg.tier}
                  </span>
                  <span className="text-xs text-[#768086]">{pkg.category}</span>
                </div>

                <div>
                  <h2 className="font-editorial text-2xl text-[#14181a] leading-tight">
                    <Link href={`/health-packages/${pkg.slug}`} className="hover:text-[#0f5c5c]">
                      {pkg.name}
                    </Link>
                  </h2>
                  <p className="text-xs text-[#768086] mt-1">Ideal for: {pkg.ideal_for}</p>
                </div>

                {/* Price block */}
                <div className="flex items-baseline gap-2.5 pt-1">
                  <span className="font-editorial text-4xl text-[#14181a]">${pkg.price}</span>
                  <span className="text-sm line-through text-[#768086] font-mono">
                    ${pkg.original_price}
                  </span>
                  {discount > 0 && (
                    <span className="text-[11px] font-mono text-[#0f5c5c] bg-[#edf5f4] px-2 py-0.5 rounded-full">
                      Save {discount}%
                    </span>
                  )}
                </div>

                <p className="text-sm text-[#4b555b] leading-relaxed">{pkg.short_description}</p>

                {/* Test groups summary */}
                <div className="space-y-2 pt-2 border-t border-[#e6e4dd]">
                  <p className="text-xs font-mono uppercase tracking-wider text-[#768086]">
                    Includes {totalTests} Investigations:
                  </p>
                  <ul className="space-y-1.5 text-xs text-[#14181a]">
                    {pkg.tests.slice(0, 2).map((group) => (
                      <li key={group.group} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-[#0f5c5c] shrink-0" />
                        <span>
                          <strong>{group.group}:</strong> {group.items.slice(0, 3).join(', ')}
                          {group.items.length > 3 ? ` +${group.items.length - 3} more` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom footer */}
              <div className="mt-8 pt-4 border-t border-[#e6e4dd] space-y-3">
                <div className="flex items-center justify-between text-xs text-[#768086] font-mono">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {pkg.duration}
                  </span>
                  <span>Results: {pkg.turnaround}</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href={`/health-packages/${pkg.slug}`}
                    className="w-1/2 text-center py-2.5 rounded-full border border-[#d5d2c9] text-xs font-medium text-[#14181a] hover:border-[#14181a]"
                  >
                    View Details
                  </Link>
                  <Link
                    href={`/appointments/book?package=${pkg.slug}`}
                    className="w-1/2 text-center py-2.5 rounded-full bg-[#14181a] text-white text-xs font-medium hover:bg-[#0f5c5c] transition-colors"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
