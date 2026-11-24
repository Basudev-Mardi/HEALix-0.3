import Link from 'next/link';
import { ArrowUpRight, MapPin, Phone, Siren } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#e6e4dd] bg-[#f2f1ec]/60 mt-24">
      <div className="container-editorial py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-5">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="h-8 w-8 rounded-full border border-[#14181a] flex items-center justify-center text-xs font-mono font-semibold">
                Hx
              </span>
              <div className="leading-none">
                <span className="block text-[15px] font-semibold tracking-[0.14em] uppercase">
                  Healix
                </span>
                <span className="block text-[10px] tracking-[0.16em] uppercase text-[#768086] mt-0.5">
                  Medical Center
                </span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-[#4b555b] max-w-sm">
              A 420-bed quaternary care hospital uniting clinical precision, minimally invasive
              surgery, and calm, restorative spaces.
            </p>
            <div className="space-y-2 text-xs text-[#4b555b] pt-1">
              <p className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 mt-0.5 text-[#0f5c5c] shrink-0" />
                480 Meridian Avenue, Health Sciences District, Boston, MA 02115
              </p>
              <p className="flex items-center gap-2 font-mono">
                <Phone className="h-3.5 w-3.5 text-[#0f5c5c] shrink-0" />
                +1 (800) 432-5490
              </p>
              <p className="flex items-center gap-2 font-mono text-[#b91c1c]">
                <Siren className="h-3.5 w-3.5 shrink-0" />
                Emergency 24/7: +1 (800) 911-4325
              </p>
            </div>
          </div>

          {/* Hospital */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#768086]">
              Hospital
            </h3>
            <ul className="space-y-2.5 text-sm text-[#4b555b]">
              <li>
                <Link href="/about" className="hover:text-[#14181a] transition-colors">
                  About Hospital
                </Link>
              </li>
              <li>
                <Link href="/about/mission-vision" className="hover:text-[#14181a] transition-colors">
                  Mission &amp; Vision
                </Link>
              </li>
              <li>
                <Link href="/about/infrastructure" className="hover:text-[#14181a] transition-colors">
                  Infrastructure
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-[#14181a] transition-colors">
                  Hospital Gallery
                </Link>
              </li>
              <li>
                <Link href="/facilities" className="hover:text-[#14181a] transition-colors">
                  Facilities
                </Link>
              </li>
            </ul>
          </div>

          {/* Clinical Care */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#768086]">
              Clinical Care
            </h3>
            <ul className="space-y-2.5 text-sm text-[#4b555b]">
              <li>
                <Link href="/departments" className="hover:text-[#14181a] transition-colors">
                  Departments
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-[#14181a] transition-colors">
                  Doctors Directory
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-[#14181a] transition-colors">
                  Medical Services
                </Link>
              </li>
              <li>
                <Link href="/departments/cardiology" className="hover:text-[#14181a] transition-colors">
                  Cardiology &amp; Heart Institute
                </Link>
              </li>
              <li>
                <Link href="/departments/neurology" className="hover:text-[#14181a] transition-colors">
                  Neurology &amp; Neurosciences
                </Link>
              </li>
            </ul>
          </div>

          {/* Patient Information */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#768086]">
              Visitor &amp; Emergency
            </h3>
            <ul className="space-y-2.5 text-sm text-[#4b555b]">
              <li>
                <Link href="/visiting-hours" className="hover:text-[#14181a] transition-colors">
                  Hospital Timings &amp; Visiting Hours
                </Link>
              </li>
              <li>
                <Link
                  href="/emergency"
                  className="inline-flex items-center gap-1 text-[#b91c1c] font-medium hover:underline"
                >
                  Emergency &amp; Trauma Information
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            </ul>
            <div className="pt-4">
              <div className="rounded-xl border border-[#e6e4dd] bg-white p-4 space-y-1">
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#0f5c5c]">
                  Accreditation
                </p>
                <p className="text-sm font-medium text-[#14181a]">JCI &amp; NABH Certified</p>
                <p className="text-xs text-[#768086]">Level I Trauma &amp; Comprehensive Stroke Center</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-[#e6e4dd] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#768086]">
          <p>© 2026 Healix Medical Center. All rights reserved.</p>
          <p className="font-mono text-[11px]">Public Portal · Precision Clinical Care</p>
        </div>
      </div>
    </footer>
  );
}
