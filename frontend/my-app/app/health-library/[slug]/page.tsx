import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Share2,
  Stethoscope,
  Tag,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { getHealthArticleBySlug, getHealthArticles } from '@/lib/support-api';

export async function generateStaticParams() {
  const articles = await getHealthArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getHealthArticleBySlug(slug);
  if (!article) return { title: 'Article Not Found' };
  return {
    title: `${article.title} — Healix Health Library`,
    description: article.excerpt,
  };
}

export default async function HealthArticleDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getHealthArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        eyebrow={`Health Library · ${article.category}`}
        title={article.title}
        description={article.excerpt}
        breadcrumbs={[
          { label: 'Health Library', href: '/health-library' },
          { label: article.category },
        ]}
      />

      <article className="container-editorial py-14 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Article Body */}
          <div className="lg:col-span-8 space-y-10">
            {/* Meta Strip */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#e6e4dd] text-xs text-[#768086]">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 font-mono">
                  <Calendar className="h-3.5 w-3.5 text-[#0f5c5c]" />
                  {article.published_date}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 font-mono">
                  <Clock className="h-3.5 w-3.5 text-[#0f5c5c]" />
                  {article.read_minutes} min read
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {article.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#faf9f6] border border-[#e6e4dd] text-[11px]"
                  >
                    <Tag className="h-2.5 w-2.5 text-[#768086]" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Key Takeaways Box */}
            {article.key_takeaways && article.key_takeaways.length > 0 && (
              <div className="rounded-2xl border border-[#cde4de] bg-[#edf5f4] p-7 space-y-3">
                <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c] font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Key Takeaways
                </p>
                <ul className="space-y-2 text-sm text-[#14181a]">
                  {article.key_takeaways.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Structured Sections */}
            <div className="space-y-8 text-base text-[#14181a] leading-relaxed">
              {article.body.map((section, idx) => (
                <section key={idx} className="space-y-4">
                  <h2 className="font-editorial text-2xl sm:text-3xl text-[#14181a]">
                    {section.heading}
                  </h2>
                  {section.paragraphs.map((p, pIdx) => (
                    <p key={pIdx} className="text-[#4b555b] leading-relaxed">
                      {p}
                    </p>
                  ))}
                </section>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="pt-8 border-t border-[#e6e4dd] flex flex-wrap items-center justify-between gap-4 text-xs">
              <Link
                href="/health-library"
                className="inline-flex items-center gap-1.5 text-[#768086] hover:text-[#14181a]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Health Library
              </Link>
              <p className="text-[#768086] italic">
                Reviewed by Healix Clinical Editorial Committee · Educational purposes only
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-32">
            {/* Author Physician Card */}
            <div className="rounded-2xl border border-[#e6e4dd] bg-white p-6 space-y-4">
              <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#768086]">
                Article Author
              </p>
              <div className="flex items-start gap-3">
                <span className="h-10 w-10 rounded-full bg-[#edf5f4] text-[#0f5c5c] font-mono text-xs font-semibold flex items-center justify-center shrink-0">
                  Hx
                </span>
                <div>
                  <h3 className="text-base font-semibold text-[#14181a]">{article.author_name}</h3>
                  <p className="text-xs text-[#0f5c5c]">{article.author_title}</p>
                </div>
              </div>
              {article.author_doctor_slug && (
                <div className="pt-2 border-t border-[#e6e4dd] flex flex-col gap-2">
                  <Link
                    href={`/doctors/${article.author_doctor_slug}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#14181a] hover:text-[#0f5c5c]"
                  >
                    View Doctor Profile
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                  <Link
                    href={`/appointments/book?doctor=${article.author_doctor_slug}`}
                    className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-full bg-[#14181a] text-white text-xs font-medium hover:bg-[#0f5c5c] transition-colors"
                  >
                    <Stethoscope className="h-3.5 w-3.5" />
                    Book Consultation
                  </Link>
                </div>
              )}
            </div>

            {/* Related Articles */}
            {article.related && article.related.length > 0 && (
              <div className="rounded-2xl border border-[#e6e4dd] bg-white p-6 space-y-4">
                <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#768086]">
                  Related Reading
                </p>
                <div className="space-y-3">
                  {article.related.map((rel) => (
                    <Link
                      key={rel.slug}
                      href={`/health-library/${rel.slug}`}
                      className="block p-3 rounded-xl border border-[#e6e4dd] hover:border-[#0f5c5c] transition-colors group"
                    >
                      <span className="text-[10px] font-mono uppercase text-[#0f5c5c]">
                        {rel.category}
                      </span>
                      <p className="text-sm font-medium text-[#14181a] group-hover:text-[#0f5c5c] mt-0.5 line-clamp-2">
                        {rel.title}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </article>
    </div>
  );
}
