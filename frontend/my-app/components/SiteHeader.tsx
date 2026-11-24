'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, Clock, Menu, Phone, Siren, X } from 'lucide-react';

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

  const isAboutActive = pathname.startsWith('/about');
  const isApptActive = pathname.startsWith('/appointments');

  return (
    <header className="sticky top-0 z-50 bg-[#faf9f6]/90 backdrop-blur-md border-b border-[#e6e4dd]">
      {/* Subtle Utility Strip */}
      <div className="border-b border-[#e6e4dd] bg-[#f2f1ec]/70 text-xs text-[#4b555b]">
        <div className="container-editorial h-9 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-tight text-[#14181a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0f5c5c]" />
              24/7 Emergency: +1 (800) 911-4325
            </span>
            <span className="hidden md:inline text-[#768086]">|</span>
            <span className="hidden md:inline-flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-[#768086]" />
              General Desk: +1 (800) 432-5490
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/visiting-hours"
              className="hidden sm:inline-flex items-center gap-1.5 hover:text-[#14181a] transition-colors"
            >
              <Clock className="h-3 w-3" />
              Visiting Hours
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
        <nav className="hidden lg:flex items-center gap-7 text-sm">
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
          <Link
            href="/appointments/book"
            className="text-xs font-medium px-4 py-2.5 rounded-full border border-[#d5d2c9] text-[#14181a] hover:border-[#14181a] transition-colors"
          >
            Book Appointment
          </Link>
          <Link
            href="/emergency"
            className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2.5 rounded-full bg-[#14181a] text-white hover:bg-[#0f5c5c] transition-colors"
          >
            <Siren className="h-3.5 w-3.5" />
            Emergency
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          className="lg:hidden p-2 rounded-lg border border-[#e6e4dd] text-[#14181a]"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#e6e4dd] bg-[#faf9f6] px-6 py-5 space-y-5">
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

          <div className="border-t border-[#e6e4dd] pt-4 flex flex-col gap-2.5">
            <Link
              href="/appointments/book"
              onClick={() => setMobileOpen(false)}
              className="text-center text-sm font-medium px-4 py-2.5 rounded-full border border-[#d5d2c9] text-[#14181a]"
            >
              Book Appointment
            </Link>
            <Link
              href="/emergency"
              onClick={() => setMobileOpen(false)}
              className="text-center text-sm font-medium px-4 py-2.5 rounded-full bg-[#b91c1c] text-white"
            >
              24/7 Emergency Information
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
