import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <section className="container-editorial py-28 text-center space-y-6">
      <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40]">404</p>
      <h1 className="font-editorial text-4xl sm:text-5xl text-[#242A28]">Page not found</h1>
      <p className="text-sm text-[#4A5350] max-w-md mx-auto">
        The clinical page or profile you requested could not be located.
      </p>
      <div className="pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#242A28] text-white text-xs font-medium hover:bg-[#174C40] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Return to Homepage
        </Link>
      </div>
    </section>
  );
}
