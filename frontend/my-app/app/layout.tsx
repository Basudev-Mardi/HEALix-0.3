import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Manrope, Inter } from 'next/font/google';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import { OfflineBanner } from '@/components/OfflineBanner';
import './globals.css';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://healixmedical.org'),
  title: {
    default: 'Healix Medical Center — Precision Clinical Care & Hospital Network',
    template: '%s | Healix Medical Center',
  },
  description:
    'Healix Medical Center is an NABH/JCI accredited quaternary hospital uniting evidence-based clinical protocols, robotic surgical technology, and compassionate patient care.',
  keywords: [
    'Hospital',
    'Cardiology',
    'Robotic Surgery',
    'Doctors Directory',
    'Health Checkup Packages',
    'Level 1 Emergency Trauma',
    'Patient Health Records',
  ],
  authors: [{ name: 'Healix Health Sciences' }],
  openGraph: {
    title: 'Healix Medical Center — Precision Clinical Care',
    description: 'Quaternary healthcare institution offering 24/7 emergency trauma, robotic surgery, and verified electronic medical records.',
    url: 'https://healixmedical.org',
    siteName: 'Healix Medical Center',
    locale: 'en_IN',
    type: 'website',
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Hospital JSON-LD Structured Data
  const hospitalJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Hospital',
    name: 'Healix Medical Center',
    url: 'https://healixmedical.org',
    logo: 'https://healixmedical.org/images/logo.png',
    telephone: '+1-800-432-5490',
    emergencyTelephone: '+1-800-911-4325',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '480 Meridian Avenue, Health Sciences District',
      addressLocality: 'Boston',
      addressRegion: 'MA',
      postalCode: '02115',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 42.3385,
      longitude: -71.1065,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '00:00',
        closes: '23:59',
      },
    ],
    medicalSpecialty: [
      'Cardiovascular',
      'Neurology',
      'Orthopedic',
      'Oncology',
      'Pediatric',
      'Emergency',
    ],
  };

  return (
    <html
      lang="en"
      className={`${manrope.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(hospitalJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#FAFAF7] text-[#242A28]">
        {/* Skip to Main Content Link for WCAG 2.2 AA Keyboard Navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#174C40] focus:text-white focus:rounded-lg focus:outline-hidden"
        >
          Skip to main content
        </a>
        <OfflineBanner />
        <Suspense fallback={<div className="h-[80px] border-b border-[#E5E8E6] bg-[#FAFAF7]" />}>
          <SiteHeader />
        </Suspense>
        <main id="main-content" tabIndex={-1} className="flex-1 outline-hidden">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
