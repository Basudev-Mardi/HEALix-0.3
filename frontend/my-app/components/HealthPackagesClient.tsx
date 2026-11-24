'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  HelpCircle,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import PackageEnquiryModal from '@/components/PackageEnquiryModal';
import type { HealthPackage } from '@/lib/types';

export default function HealthPackagesClient({
  packages,
}: {
  packages: HealthPackage[];
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTier, setSelectedTier] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [expandedTests, setExpandedTests] = useState<Record<string, boolean>>({});
  const [enquiryPackage, setEnquiryPackage] = useState<HealthPackage | null>(null);

  // Extract distinct categories and tiers
  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(packages.map((p) => p.category)))];
  }, [packages]);

  const tiers = useMemo(() => {
    return ['All', ...Array.from(new Set(packages.map((p) => p.tier)))];
  }, [packages]);

  // Filter & Sort
  const filteredPackages = useMemo(() => {
    return packages
      .filter((pkg) => {
        const matchesCategory =
          selectedCategory === 'All' ||
          pkg.category.toLowerCase() === selectedCategory.toLowerCase();
        const matchesTier =
          selectedTier === 'All' ||
          pkg.tier.toLowerCase() === selectedTier.toLowerCase();

        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          pkg.name.toLowerCase().includes(q) ||
          pkg.short_description.toLowerCase().includes(q) ||
          pkg.category.toLowerCase().includes(q) ||
          pkg.ideal_for.toLowerCase().includes(q) ||
          pkg.tests.some((g) =>
            g.items.some((item) => item.toLowerCase().includes(q))
          );

        return matchesCategory && matchesTier && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        // Featured default
        if (a.is_popular && !b.is_popular) return -1;
        if (!a.is_popular && b.is_popular) return 1;
        return 0;
      });
  }, [packages, selectedCategory, selectedTier, searchQuery, sortBy]);

  function toggleExpandTests(slug: string) {
    setExpandedTests((prev) => ({ ...prev, [slug]: !prev[slug] }));
  }

  return (
    <div className="space-y-10">
      {/* Search and Filters Bar */}
      <div className="rounded-2xl border border-[#e6e4dd] bg-white p-5 sm:p-6 shadow-xs space-y-5">
        {/* Search input & Sort */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#768086]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by package name, diagnostic test (e.g. HbA1c, ECG, Vitamin D), or health concern..."
              className="w-full rounded-full border border-[#e6e4dd] bg-[#faf9f6] pl-10 pr-4 py-2.5 text-xs text-[#14181a] placeholder:text-[#768086] focus:border-[#0f5c5c] focus:bg-white focus:outline-hidden transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#768086] hover:text-[#14181a]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#768086] font-mono">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-full border border-[#e6e4dd] bg-white px-3 py-2 text-xs text-[#14181a] focus:border-[#0f5c5c] focus:outline-hidden"
            >
              <option value="featured">Featured / Most Popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Package Name (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Categories Tabs */}
        <div className="space-y-2 border-t border-[#e6e4dd] pt-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#768086] flex items-center gap-1.5">
              <Filter className="h-3 w-3 text-[#0f5c5c]" />
              Filter by Clinical Category:
            </span>
            <span className="text-xs font-mono text-[#0f5c5c]">
              {filteredPackages.length} package{filteredPackages.length === 1 ? '' : 's'} found
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#14181a] text-white'
                    : 'bg-[#faf9f6] border border-[#e6e4dd] text-[#4b555b] hover:border-[#14181a]'
                }`}
              >
                {cat === 'All' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tiers Secondary Filter */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#f0eee6]">
          <span className="text-[11px] font-mono text-[#768086] mr-1">Tiers:</span>
          {tiers.map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1 rounded-full text-[11px] font-mono transition-colors ${
                selectedTier === tier
                  ? 'bg-[#0f5c5c] text-white'
                  : 'bg-white border border-[#e6e4dd] text-[#768086] hover:border-[#0f5c5c]'
              }`}
            >
              {tier === 'All' ? 'All Tiers' : `${tier} Tier`}
            </button>
          ))}
        </div>
      </div>

      {/* Packages Grid */}
      {filteredPackages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d2d0c8] bg-white p-12 text-center space-y-3">
          <HelpCircle className="h-8 w-8 text-[#768086] mx-auto opacity-50" />
          <h3 className="font-editorial text-xl text-[#14181a]">No matching packages found</h3>
          <p className="text-xs text-[#768086] max-w-md mx-auto">
            Try adjusting your category filter, tier selection, or searching for broader terms like &quot;Blood&quot; or &quot;Cardio&quot;.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setSelectedTier('All');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-full bg-[#14181a] text-white text-xs font-medium hover:bg-[#0f5c5c] transition-colors mt-2"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredPackages.map((pkg) => {
            const originalPrice = pkg.original_price || pkg.price;
            const discount =
              originalPrice > pkg.price
                ? Math.round(((originalPrice - pkg.price) / originalPrice) * 100)
                : 0;
            const totalTests = pkg.tests.reduce(
              (acc, g) => acc + g.items.length,
              0
            );
            const isExpanded = Boolean(expandedTests[pkg.slug]);

            return (
              <article
                key={pkg.slug}
                className={`rounded-2xl border p-6 sm:p-7 flex flex-col justify-between transition-all bg-white relative ${
                  pkg.is_popular
                    ? 'border-[#0f5c5c] shadow-md ring-1 ring-[#0f5c5c]/20'
                    : 'border-[#e6e4dd] hover:border-[#d5d2c9]'
                }`}
              >
                {/* Popular Badge */}
                {pkg.is_popular && (
                  <span className="absolute -top-3 right-6 inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#0f5c5c] text-white font-mono text-[10px] uppercase tracking-wider shadow-xs">
                    <Sparkles className="h-3 w-3" />
                    Recommended Program
                  </span>
                )}

                <div className="space-y-5">
                  {/* Category & Tier Tag */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#edf5f4] text-[#0f5c5c] font-semibold">
                        {pkg.tier} Tier
                      </span>
                      <span className="text-xs text-[#768086] font-medium">
                        {pkg.category}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-[#768086]">
                      {pkg.duration}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h2 className="font-editorial text-2xl text-[#14181a] leading-tight">
                      <Link
                        href={`/health-packages/${pkg.slug}`}
                        className="hover:text-[#0f5c5c] transition-colors"
                      >
                        {pkg.name}
                      </Link>
                    </h2>
                    <p className="text-xs text-[#4b555b] mt-1.5 leading-relaxed">
                      {pkg.short_description}
                    </p>
                  </div>

                  {/* Price Banner */}
                  <div className="flex items-baseline gap-3 rounded-xl bg-[#faf9f6] p-3.5 border border-[#e6e4dd]">
                    <div className="flex items-baseline gap-2">
                      <span className="font-editorial text-3xl text-[#14181a]">
                        ${pkg.price}
                      </span>
                      {discount > 0 && (
                        <span className="text-sm line-through text-[#768086] font-mono">
                          ${originalPrice}
                        </span>
                      )}
                    </div>
                    {discount > 0 && (
                      <span className="text-[11px] font-mono text-[#0f5c5c] bg-[#edf5f4] px-2 py-0.5 rounded-full font-semibold">
                        Save {discount}%
                      </span>
                    )}
                    <span className="text-[11px] text-[#768086] ml-auto">
                      All-Inclusive Pricing
                    </span>
                  </div>

                  {/* Eligibility Information */}
                  {pkg.eligibility && (
                    <div className="rounded-xl border border-[#e6e4dd] p-3.5 text-xs space-y-1.5 bg-white">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#0f5c5c] font-semibold flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Target Cohort &amp; Eligibility
                        </span>
                        <span className="text-[11px] font-mono text-[#14181a] font-medium">
                          {pkg.eligibility.age_range} · {pkg.eligibility.gender_target}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#4b555b] line-clamp-2">
                        {pkg.ideal_for}
                      </p>
                    </div>
                  )}

                  {/* Included Tests Summary */}
                  <div className="space-y-2 pt-2 border-t border-[#e6e4dd]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-[#768086]">
                        Includes {totalTests} Diagnostic Investigations:
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleExpandTests(pkg.slug)}
                        className="text-[11px] font-medium text-[#0f5c5c] hover:underline inline-flex items-center gap-0.5"
                      >
                        {isExpanded ? (
                          <>
                            Show Less <ChevronUp className="h-3 w-3" />
                          </>
                        ) : (
                          <>
                            View All Tests <ChevronDown className="h-3 w-3" />
                          </>
                        )}
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(isExpanded ? pkg.tests : pkg.tests.slice(0, 2)).map(
                        (group) => (
                          <div
                            key={group.group}
                            className="text-xs rounded-lg bg-[#faf9f6] p-2.5 space-y-1 border border-[#f0eee6]"
                          >
                            <p className="font-semibold text-[#14181a] text-[11px]">
                              {group.group} ({group.items.length})
                            </p>
                            <ul className="space-y-1 text-[#4b555b] text-[11px]">
                              {(isExpanded
                                ? group.items
                                : group.items.slice(0, 3)
                              ).map((item) => (
                                <li key={item} className="flex items-start gap-1.5">
                                  <Check className="h-3 w-3 text-[#0f5c5c] shrink-0 mt-0.5" />
                                  <span>{item}</span>
                                </li>
                              ))}
                              {!isExpanded && group.items.length > 3 && (
                                <li className="text-[10px] font-mono text-[#768086] pl-4">
                                  + {group.items.length - 3} more parameters
                                </li>
                              )}
                            </ul>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Preparation Preview */}
                  {pkg.preparation && pkg.preparation.length > 0 && (
                    <div className="rounded-xl bg-[#faf9f6] p-3 text-[11px] text-[#4b555b] border border-[#e6e4dd] space-y-1">
                      <span className="font-semibold text-[#14181a] flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-[#0f5c5c]" />
                        Preparation Instruction:
                      </span>
                      <p className="text-[11px] leading-relaxed line-clamp-2">
                        {pkg.preparation[0]}
                      </p>
                    </div>
                  )}

                  {/* Terms Preview */}
                  {pkg.terms_and_conditions && pkg.terms_and_conditions.length > 0 && (
                    <div className="text-[10px] text-[#768086] flex items-center gap-1.5">
                      <ShieldCheck className="h-3 w-3 text-[#0f5c5c] shrink-0" />
                      <span className="truncate">
                        Terms: {pkg.terms_and_conditions[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions Matrix */}
                <div className="mt-8 pt-4 border-t border-[#e6e4dd] space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#768086] font-mono">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Results: {pkg.turnaround}
                    </span>
                    <span>Frequency: {pkg.recommended_frequency}</span>
                  </div>

                  {/* 3 Action Buttons: Details, Enquire, Book Package */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <Link
                      href={`/health-packages/${pkg.slug}`}
                      className="text-center py-2.5 rounded-full border border-[#d5d2c9] text-xs font-medium text-[#14181a] hover:border-[#14181a] transition-colors"
                    >
                      Details
                    </Link>

                    <button
                      type="button"
                      onClick={() => setEnquiryPackage(pkg)}
                      className="text-center py-2.5 rounded-full border border-[#0f5c5c] text-xs font-medium text-[#0f5c5c] hover:bg-[#edf5f4] transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Enquiry
                    </button>

                    <Link
                      href={`/appointments/book?package=${pkg.slug}`}
                      className="text-center py-2.5 rounded-full bg-[#14181a] text-white text-xs font-medium hover:bg-[#0f5c5c] transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      Book Now
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Package Enquiry Modal */}
      <PackageEnquiryModal
        pkg={enquiryPackage}
        isOpen={Boolean(enquiryPackage)}
        onClose={() => setEnquiryPackage(null)}
      />
    </div>
  );
}
