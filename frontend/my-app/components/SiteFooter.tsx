import Link from 'next/link';
import { ArrowUpRight, MapPin, Phone, Siren } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#E5E8E6] bg-[#E6EFE9]/60 mt-24">
      <div className="container-editorial py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-3 space-y-5">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="h-8 w-8 rounded-full border border-[#242A28] flex items-center justify-center text-xs font-mono font-semibold">
                Hx
              </span>
              <div className="leading-none">
                <span className="block text-[15px] font-semibold tracking-[0.14em] uppercase">
                  Healix
                </span>
                <span className="block text-[10px] tracking-[0.16em] uppercase text-[#77817C] mt-0.5">
                  Medical Center
                </span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-[#4A5350]">
              A 420-bed quaternary care hospital uniting clinical precision, minimally invasive
              surgery, and calm, restorative spaces.
            </p>
            <div className="space-y-2 text-xs text-[#4A5350] pt-1">
              <p className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 mt-0.5 text-[#174C40] shrink-0" />
                100 Healix Boulevard, Metro Medical District, Boston, MA 02115
              </p>
              <p className="flex items-center gap-2 font-mono">
                <Phone className="h-3.5 w-3.5 text-[#174C40] shrink-0" />
                +1 (800) 432-5490
              </p>
              <a
                href="tel:8009114325"
                className="flex items-center gap-2 font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors"
                title="Call 24/7 Level 1 Trauma Emergency Line"
              >
                <Siren className="h-4 w-4 shrink-0 text-rose-600 animate-pulse" />
                <span>24/7 Emergency: +1 (800) 911-4325</span>
              </a>
            </div>
          </div>

          {/* Hospital */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#77817C]">
              Hospital
            </h3>
            <ul className="space-y-2.5 text-sm text-[#4A5350]">
              <li>
                <Link href="/about" className="hover:text-[#242A28] transition-colors">
                  About Hospital
                </Link>
              </li>
              <li>
                <Link href="/about/mission-vision" className="hover:text-[#242A28] transition-colors">
                  Mission &amp; Vision
                </Link>
              </li>
              <li>
                <Link href="/about/infrastructure" className="hover:text-[#242A28] transition-colors">
                  Infrastructure
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-[#242A28] transition-colors">
                  Hospital Gallery
                </Link>
              </li>
              <li>
                <Link href="/facilities" className="hover:text-[#242A28] transition-colors">
                  Facilities
                </Link>
              </li>
              <li>
                <Link href="/visiting-hours" className="hover:text-[#242A28] transition-colors">
                  Visiting Timings
                </Link>
              </li>
            </ul>
          </div>

          {/* Clinical Care */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#77817C]">
              Clinical Care
            </h3>
            <ul className="space-y-2.5 text-sm text-[#4A5350]">
              <li>
                <Link href="/departments" className="hover:text-[#242A28] transition-colors">
                  Departments
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-[#242A28] transition-colors">
                  Doctors Directory
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-[#242A28] transition-colors">
                  Medical Services
                </Link>
              </li>
              <li>
                <Link href="/departments/cardiology" className="hover:text-[#242A28] transition-colors">
                  Cardiology
                </Link>
              </li>
              <li>
                <Link href="/departments/neurology" className="hover:text-[#242A28] transition-colors">
                  Neurology
                </Link>
              </li>
              <li>
                <Link href="/emergency" className="text-[#b91c1c] font-medium hover:underline inline-flex items-center gap-1">
                  Trauma 24/7 <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Information & Support */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#77817C]">
              Information &amp; Support
            </h3>
            <ul className="space-y-2.5 text-sm text-[#4A5350]">
              <li>
                <Link href="/health-library" className="hover:text-[#242A28] transition-colors">
                  Health Blog &amp; Library
                </Link>
              </li>
              <li>
                <Link href="/health-packages" className="hover:text-[#242A28] transition-colors">
                  Preventive Health Packages
                </Link>
              </li>
              <li>
                <Link href="/insurance" className="hover:text-[#242A28] transition-colors">
                  Insurance &amp; Cashless TPA
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#242A28] transition-colors">
                  Contact Us &amp; Directions
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="hover:text-[#242A28] transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/feedback" className="hover:text-[#242A28] transition-colors">
                  Patient Experience &amp; Feedback
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-[#242A28] transition-colors">
                  Clinical &amp; Hospital Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Patient Account & Portal */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#77817C]">
              Patient Portal
            </h3>
            <ul className="space-y-2.5 text-sm text-[#4A5350]">
              <li>
                <Link href="/patient/dashboard" className="text-[#174C40] font-medium hover:underline">
                  My Dashboard
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#242A28] transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[#242A28] transition-colors">
                  New Registration
                </Link>
              </li>
              <li>
                <Link href="/appointments/book" className="hover:text-[#242A28] transition-colors">
                  Book Appointment
                </Link>
              </li>
              <li>
                <Link href="/appointments/track" className="hover:text-[#242A28] transition-colors">
                  Track Appointment
                </Link>
              </li>
              <li>
                <Link href="/appointments/help" className="hover:text-[#242A28] transition-colors">
                  Appointment Help
                </Link>
              </li>
            </ul>
            <div className="pt-2">
              <div className="rounded-xl border border-[#E5E8E6] bg-white p-3 space-y-1">
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#174C40]">
                  Accreditation
                </p>
                <p className="text-xs font-medium text-[#242A28]">JCI &amp; NABH Certified</p>
                <p className="text-[11px] text-[#77817C]">Level I Comprehensive Center</p>
              </div>
            </div>
          </div>
        </div>

        {/* Legal and Compliance Footer */}
        <div className="mt-14 pt-6 border-t border-[#E5E8E6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#77817C]">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <p>© 2026 Healix Medical Center. All rights reserved.</p>
            <Link href="/privacy-policy" className="hover:text-[#242A28] transition-colors">
              Privacy Policy &amp; HIPAA
            </Link>
            <Link href="/terms" className="hover:text-[#242A28] transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link href="/patient-rights" className="hover:text-[#242A28] transition-colors">
              Patient Bill of Rights
            </Link>
          </div>
          <p className="font-mono text-[11px]">Public Portal · Section D Complete</p>
        </div>
      </div>
    </footer>
  );
}
