'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Clock, Search, Tag } from 'lucide-react';
import type { HealthArticle } from '@/lib/types';

export default function HealthLibraryClient({ articles }: { articles: HealthArticle[] }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(articles.map((a) => a.category)))];
  }, [articles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      const matchCat =
        selectedCategory === 'All' || a.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchQuery =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [articles, selectedCategory, search]);

  return (
    <div className="space-y-10">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#e6e4dd]">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#14181a] text-white'
                  : 'bg-white border border-[#e6e4dd] text-[#4b555b] hover:border-[#14181a]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search className="h-4 w-4 text-[#768086] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clinical topics..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-white border border-[#e6e4dd] text-xs text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-12 text-center space-y-2">
          <p className="text-base font-medium text-[#14181a]">No articles found.</p>
          <p className="text-xs text-[#768086]">Try another search term or clear the filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((article) => (
            <article
              key={article.slug}
              className="card-minimal rounded-2xl p-7 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#edf5f4] text-[#0f5c5c]">
                    {article.category}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[#768086]">
                    <Clock className="h-3 w-3" />
                    {article.read_minutes} min read
                  </span>
                </div>

                <h2 className="font-editorial text-2xl text-[#14181a] group-hover:text-[#0f5c5c] transition-colors leading-snug">
                  <Link href={`/health-library/${article.slug}`}>{article.title}</Link>
                </h2>

                <p className="text-sm leading-relaxed text-[#4b555b] line-clamp-3">
                  {article.excerpt}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {article.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-[#faf9f6] border border-[#e6e4dd] text-[#768086]"
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#e6e4dd] flex items-center justify-between text-xs">
                <div>
                  <p className="font-medium text-[#14181a]">{article.author_name}</p>
                  <p className="text-[11px] text-[#768086]">{article.published_date}</p>
                </div>
                <Link
                  href={`/health-library/${article.slug}`}
                  className="inline-flex items-center gap-1 text-[#0f5c5c] font-medium group-hover:translate-x-0.5 transition-transform"
                >
                  Read
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
