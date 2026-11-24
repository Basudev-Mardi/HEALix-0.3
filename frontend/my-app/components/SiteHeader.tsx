'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, Clock, Menu, Phone, Siren, UserRound, X } from 'lucide-react';

const ABOUT_LINKS = [
  { href: '/about', label: 'About Hospital', desc: 'Our story, leadership & accreditation' },
  { href: '/about/mission-vision', label: 'Mission & Vision', desc: 'Purpose, values & clinical ethos' },
  { href: '/about/infrastructure', label: 'Infrastructure', desc: 'Operating suites, ICUs & campus design' },
];

const APPOINTMENT_LINKS = [
  { href: '/appointments/doctors', label: 'Find a Doctor', desc: 'Search specialists & book online' },
  { href: '/appointments/book', label: 'Book Appointment', desc: 'Pick date, format & live time slot' },
  { href: '/appointments/track', label: 'Track Appointment', desc: 'Check status or cancel a booking' },
  { href: '/appointments/help', label: 'Appointment Help', desc: 'Booking FAQs, insurance & arrival guide' },
];

const SUPPORT_LINKS = [
  { href: '/health-library', label: 'Health Library', desc: 'Clinical articles & preventive wellness' },
  { href: '/health-packages', label: 'Health Packages', desc: 'Preventive checkups & executive screenings' },
  { href: '/insurance', label: 'Insurance & TPA', desc: 'Empaneled cashless insurers & pre-auth' },
  { href: '/faqs', label: 'FAQs', desc: 'Visiting hours, billing & portal help' },
  { href: '/contact', label: 'Contact & Directions', desc: 'Campus map, parking & department phone lines' },
  { href: '/careers', label: 'Careers', desc: 'Clinical fellowships & nursing opportunities' },
  { href: '/feedback', label: 'Patient Feedback', desc: 'Share observations & quality survey' },
];

const NAV_LINKS = [
  { href: '/departments', label: 'Departments' },
  { href: '/doctors', label: 'Doctors' },
  { href: '/services', label: 'Services' },
  { href: '/facilities', label: 'Facilities' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/visiting-hours', label: 'Timings' },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [apptOpen, setApptOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const isAboutActive = pathname.startsWith('/about');
  const isApptActive = pathname.startsWith('/appointments');
  const isSupportActive =
    pathname.startsWith('/health-') ||
    pathname === '/insurance' ||
    pathname === '/contact' ||
    pathname === '/faqs' ||
    pathname === '/careers' ||
    pathname === '/feedback' ||
    pathname === '/privacy-policy' ||
    pathname === '/terms' ||
    pathname === '/patient-rights';

  return (
    <header className="sticky top-0 z-50 bg-[#faf9f6]/90 backdrop-blur-md border-b border-[#e6e4dd]">
      {/* Subtle Utility Strip */}
      <div className="border-b border-[#e6e4dd] bg-[#f2f1ec]/70 text-xs text-[#4b555b]">
        <div className="container-editorial h-9 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <a
              href="tel:8009114325"
              className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full hover:bg-rose-100 transition-colors"
              title="Call 24/7 Level 1 Trauma Emergency Line"
            >
              <Siren className="h-3 w-3 text-rose-600 animate-pulse" />
              <span>24/7 Emergency: +1 (800) 911-4325</span>
            </a>
            <span className="hidden md:inline text-[#768086]">|</span>
            <span className="hidden md:inline-flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-[#768086]" />
              General Desk: +1 (800) 432-5490
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/patient/dashboard"
              className="inline-flex items-center gap-1.5 hover:text-[#14181a] transition-colors font-medium text-[#0f5c5c]"
            >
              <UserRound className="h-3 w-3" />
              Patient Portal
            </Link>
            <Link
              href="/insurance"
              className="hidden sm:inline-flex items-center gap-1.5 hover:text-[#14181a] transition-colors"
            >
              Cashless TPA
            </Link>
            <Link
              href="/emergency"
              className="inline-flex items-center gap-1 text-[#b91c1c] font-medium hover:underline"
            >
              Emergency Info
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <div className="container-editorial h-18 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 group" onClick={() => setMobileOpen(false)}>
          <span className="h-8 w-8 rounded-full border border-[#14181a] flex items-center justify-center text-xs font-mono font-semibold tracking-tighter group-hover:bg-[#14181a] group-hover:text-white transition-colors">
            Hx
          </span>
          <div className="leading-none">
            <span className="block text-[15px] font-semibold tracking-[0.14em] uppercase text-[#14181a]">
              Healix
            </span>
            <span className="block text-[10px] tracking-[0.16em] uppercase text-[#768086] mt-0.5">
              Medical Center
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6 text-sm">
          {/* About Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setAboutOpen(true)}
            onMouseLeave={() => setAboutOpen(false)}
          >
            <button
              type="button"
              onClick={() => setAboutOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1 py-2 transition-colors ${
                isAboutActive
                  ? 'text-[#0f5c5c] font-medium'
                  : 'text-[#4b555b] hover:text-[#14181a]'
              }`}
            >
              About
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${aboutOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {aboutOpen && (
              <div className="absolute left-0 top-full pt-2 w-72">
                <div className="bg-white border border-[#e6e4dd] rounded-xl shadow-lg p-2">
                  {ABOUT_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setAboutOpen(false)}
                      className={`block px-3.5 py-2.5 rounded-lg transition-colors ${
                        pathname === item.href
                          ? 'bg-[#edf5f4] text-[#0f5c5c]'
                          : 'hover:bg-[#faf9f6] text-[#14181a]'
                      }`}
                    >
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span className="block text-xs text-[#768086] mt-0.5">{item.desc}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {NAV_LINKS.map((link) => {
            const active =
              pathname === link.href || (link.href !== '/' && pathname.startsWith(`${link.href}/`));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`py-2 transition-colors ${
                  active ? 'text-[#0f5c5c] font-medium' : 'text-[#4b555b] hover:text-[#14181a]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Support & Resources Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setSupportOpen(true)}
            onMouseLeave={() => setSupportOpen(false)}
          >
            <button
              type="button"
              onClick={() => setSupportOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1 py-2 transition-colors ${
                isSupportActive
                  ? 'text-[#0f5c5c] font-medium'
                  : 'text-[#4b555b] hover:text-[#14181a]'
              }`}
            >
              Support &amp; Info
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${supportOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {supportOpen && (
              <div className="absolute left-0 top-full pt-2 w-80">
                <div className="bg-white border border-[#e6e4dd] rounded-xl shadow-lg p-2">
                  {SUPPORT_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSupportOpen(false)}
                      className={`block px-3.5 py-2.5 rounded-lg transition-colors ${
                        pathname === item.href
                          ? 'bg-[#edf5f4] text-[#0f5c5c]'
                          : 'hover:bg-[#faf9f6] text-[#14181a]'
                      }`}
                    >
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span className="block text-xs text-[#768086] mt-0.5">{item.desc}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Appointments Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setApptOpen(true)}
            onMouseLeave={() => setApptOpen(false)}
          >
            <button
              type="button"
              onClick={() => setApptOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1 py-2 transition-colors ${
                isApptActive
                  ? 'text-[#0f5c5c] font-medium'
                  : 'text-[#4b555b] hover:text-[#14181a]'
              }`}
            >
              Appointments
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${apptOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {apptOpen && (
              <div className="absolute right-0 top-full pt-2 w-72">
                <div className="bg-white border border-[#e6e4dd] rounded-xl shadow-lg p-2">
                  {APPOINTMENT_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setApptOpen(false)}
                      className={`block px-3.5 py-2.5 rounded-lg transition-colors ${
                        pathname === item.href
                          ? 'bg-[#edf5f4] text-[#0f5c5c]'
                          : 'hover:bg-[#faf9f6] text-[#14181a]'
                      }`}
                    >
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span className="block text-xs text-[#768086] mt-0.5">{item.desc}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right Actions */}
        <div className="hidden lg:flex items-center gap-3">
          <a
            href="tel:8009114325"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-2 rounded-full border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
            title="Call 24/7 Trauma Emergency Line"
          >
            <Siren className="h-3.5 w-3.5 text-rose-600 animate-pulse" />
            <span>(800) 911-4325</span>
          </a>
          <Link
            href="/appointments/book"
            className="text-xs font-medium px-4 py-2.5 rounded-full border border-[#d5d2c9] text-[#14181a] hover:border-[#14181a] transition-colors"
          >
            Book Appointment
          </Link>
          <Link
            href="/emergency"
            className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2.5 rounded-full bg-rose-700 text-white hover:bg-rose-800 transition-colors shadow-xs"
          >
            <Siren className="h-3.5 w-3.5" />
            Emergency Center
          </Link>
        </div>

        {/* Mobile Actions: Emergency Call + Menu */}
        <div className="flex items-center gap-2 lg:hidden">
          <a
            href="tel:8009114325"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold font-mono tracking-tight shadow-xs hover:bg-rose-700 transition-colors"
            title="Call 24/7 Emergency Line"
          >
            <Siren className="h-3.5 w-3.5 animate-pulse" />
            <span>Emergency</span>
          </a>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg border border-[#e6e4dd] text-[#14181a]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#e6e4dd] bg-[#faf9f6] px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-widest text-[#768086] pb-1">
              About Healix
            </p>
            {ABOUT_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block py-2 text-sm ${
                  pathname === item.href ? 'text-[#0f5c5c] font-medium' : 'text-[#14181a]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-[#e6e4dd] pt-4 space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-widest text-[#768086] pb-1">
              Hospital Directory
            </p>
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block py-2 text-sm ${
                  pathname === item.href ? 'text-[#0f5c5c] font-medium' : 'text-[#14181a]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-[#e6e4dd] pt-4 space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-widest text-[#768086] pb-1">
              Information &amp; Support
            </p>
            {SUPPORT_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block py-2 text-sm ${
                  pathname === item.href ? 'text-[#0f5c5c] font-medium' : 'text-[#14181a]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-[#e6e4dd] pt-4 space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-widest text-[#768086] pb-1">
              Appointments
            </p>
            {APPOINTMENT_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block py-2 text-sm ${
                  pathname === item.href ? 'text-[#0f5c5c] font-medium' : 'text-[#14181a]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-[#e6e4dd] pt-4 space-y-2.5">
            <Link
              href="/patient/dashboard"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center py-2.5 rounded-lg border border-[#0f5c5c] text-[#0f5c5c] text-xs font-medium"
            >
              Patient Portal Access
            </Link>
            <Link
              href="/appointments/book"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center py-2.5 rounded-lg bg-[#0f5c5c] text-white text-xs font-medium"
            >
              Book Appointment
            </Link>
            <Link
              href="/emergency"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center py-2.5 rounded-lg bg-[#b91c1c] text-white text-xs font-medium"
            >
              24/7 Emergency Information
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
