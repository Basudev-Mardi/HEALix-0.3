import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Manrope, Inter } from 'next/font/google';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
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
  title: {
    default: 'Healix Medical Center — Precision Clinical Care',
    template: '%s | Healix Medical Center',
  },
  description:
    'Healix Medical Center is a 420-bed quaternary care hospital uniting evidence-based medicine, minimally invasive surgical technology, and calm patient environments.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAFAF7] text-[#242A28]">
        <Suspense fallback={<div className="h-[80px] border-b border-[#E5E8E6] bg-[#FAFAF7]" />}>
          <SiteHeader />
        </Suspense>
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
