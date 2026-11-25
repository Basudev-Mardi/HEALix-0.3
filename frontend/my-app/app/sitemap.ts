import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://healixmedical.org';
  const currentDate = new Date().toISOString();

  // Core public discovery & marketing routes
  const routes = [
    '',
    '/about',
    '/doctors',
    '/departments',
    '/services',
    '/book-appointment',
    '/health-packages',
    '/insurance',
    '/health-library',
    '/contact',
    '/faqs',
    '/emergency',
    '/privacy-notice',
    '/login',
    '/register',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: route === '' || route === '/doctors' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route === '/book-appointment' || route === '/doctors' ? 0.9 : 0.7,
  }));
}
