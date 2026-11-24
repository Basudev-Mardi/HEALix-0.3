import { cacheLife } from 'next/cache';
import supportContentRaw from './content/support-content.json';
import type {
  GeneralFaq,
  HealthArticle,
  HealthPackage,
  InsurancePartner,
  JobOpening,
} from './types';

interface SupportDataJson {
  articles: HealthArticle[];
  packages: HealthPackage[];
  insurancePartners: InsurancePartner[];
  faqs: GeneralFaq[];
  jobs: JobOpening[];
}

const localData = supportContentRaw as unknown as SupportDataJson;

const API_BASE =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchSupport<T>(endpoint: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE}${endpoint}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T };
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function getHealthArticles(category?: string): Promise<HealthArticle[]> {
  'use cache';
  cacheLife('minutes');
  const url = category && category !== 'All' ? `/support/articles?category=${encodeURIComponent(category)}` : '/support/articles';
  const live = await fetchSupport<HealthArticle[]>(url);
  if (live) return live;
  if (!category || category === 'All') return localData.articles;
  return localData.articles.filter((a) => a.category.toLowerCase() === category.toLowerCase());
}

export async function getHealthArticleBySlug(slug: string): Promise<HealthArticle | null> {
  'use cache';
  cacheLife('minutes');
  const live = await fetchSupport<HealthArticle>(`/support/articles/${encodeURIComponent(slug)}`);
  if (live) return live;
  const article = localData.articles.find((a) => a.slug === slug);
  if (!article) return null;
  const related = localData.articles
    .filter((a) => a.slug !== slug && (a.category === article.category || a.is_featured))
    .slice(0, 3);
  return { ...article, related };
}

export async function getHealthPackages(tier?: string): Promise<HealthPackage[]> {
  'use cache';
  cacheLife('minutes');
  const url = tier && tier !== 'All' ? `/support/packages?tier=${encodeURIComponent(tier)}` : '/support/packages';
  const live = await fetchSupport<HealthPackage[]>(url);
  if (live) return live;
  if (!tier || tier === 'All') return localData.packages;
  return localData.packages.filter((p) => p.tier.toLowerCase() === tier.toLowerCase());
}

export async function getHealthPackageBySlug(slug: string): Promise<HealthPackage | null> {
  'use cache';
  cacheLife('minutes');
  const live = await fetchSupport<HealthPackage>(`/support/packages/${encodeURIComponent(slug)}`);
  if (live) return live;
  const pkg = localData.packages.find((p) => p.slug === slug);
  if (!pkg) return null;
  const otherPackages = localData.packages.filter((p) => p.slug !== slug).slice(0, 3);
  return { ...pkg, otherPackages };
}

export async function getInsurancePartners(): Promise<InsurancePartner[]> {
  'use cache';
  cacheLife('minutes');
  const live = await fetchSupport<InsurancePartner[]>('/support/insurance');
  return live ?? localData.insurancePartners;
}

export async function getGeneralFaqs(category?: string): Promise<GeneralFaq[]> {
  'use cache';
  cacheLife('minutes');
  const url = category && category !== 'All' ? `/support/faqs?category=${encodeURIComponent(category)}` : '/support/faqs';
  const live = await fetchSupport<GeneralFaq[]>(url);
  if (live) return live;
  if (!category || category === 'All') return localData.faqs;
  return localData.faqs.filter((f) => f.category.toLowerCase() === category.toLowerCase());
}

export async function getJobOpenings(): Promise<JobOpening[]> {
  'use cache';
  cacheLife('minutes');
  const live = await fetchSupport<JobOpening[]>('/support/jobs');
  return live ?? localData.jobs;
}
