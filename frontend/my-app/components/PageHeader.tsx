import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  breadcrumbs?: BreadcrumbItem[];
  accent?: 'default' | 'emergency';
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  accent = 'default',
}: PageHeaderProps) {
  return (
    <section className="border-b border-[#E5E8E6] bg-[#FAFAF7]">
      <div className="container-editorial py-14 lg:py-20">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center flex-wrap gap-1.5 text-xs text-[#77817C]">
            <Link href="/" className="hover:text-[#242A28] transition-colors">
              Home
            </Link>
            {breadcrumbs.map((crumb) => (
              <span key={crumb.label} className="inline-flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3" />
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-[#242A28] transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-[#242A28]">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        <p
          className={`text-xs font-mono uppercase tracking-[0.16em] mb-4 ${
            accent === 'emergency' ? 'text-[#b91c1c]' : 'text-[#174C40]'
          }`}
        >
          {eyebrow}
        </p>

        <h1 className="font-heading text-page-title text-[#242A28] max-w-3xl">
          {title}
        </h1>

        <p className="mt-5 text-body-standard text-[#4A5350] max-w-2xl">
          {description}
        </p>
      </div>
    </section>
  );
}
