import { Metadata } from 'next';
import Link from 'next/link';
import ContactFormClient from '@/components/ContactFormClient';
import {
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  ShieldAlert,
  Car,
  Train,
  Building,
  HeartPulse,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us & Campus Directions | Healix Hospital',
  description:
    'Direct contact numbers, 24/7 trauma emergency lines, department telephone directory, parking navigation, and interactive inquiries for Healix Hospital.',
};

export default function ContactPage() {
  const departments = [
    'Cardiology & Vascular Institute',
    'Neurology & Neurosurgery',
    'Orthopedics & Joint Reconstruction',
    'Oncology & Hematology',
    'Pediatrics & Neonatal ICU',
    'Obstetrics & Gynecology',
  ];

  return (
    <div className="bg-[#FAF9F6] text-[#141716] min-h-screen">
      {/* Editorial Hero Header */}
      <section className="border-b border-[#E6E4DD] bg-white/70 backdrop-blur-sm pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-mono uppercase tracking-wider text-[#0F5C5C]">
              Direct Clinical Channels
            </span>
            <h1 className="text-4xl sm:text-5xl font-serif font-light text-[#141716] tracking-tight leading-[1.15] mt-2 mb-4">
              Contact & Campus Wayfinding
            </h1>
            <p className="text-lg text-neutral-600 font-light leading-relaxed">
              Whether arranging specialized consultations, accessing emergency trauma services, or visiting an inpatient, our medical coordinators are available around the clock.
            </p>
          </div>
        </div>
      </section>

      {/* Emergency Immediate Action Banner */}
      <section className="bg-rose-50 border-b border-rose-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-rose-900 uppercase tracking-wide">
                Life-Threatening Emergency?
              </p>
              <p className="text-xs text-rose-700">
                Direct Ambulance & Level 1 Trauma Resuscitation hotline:
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="tel:8004325491"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" /> Call +1 (800) 432-5491
            </a>
            <Link
              href="/emergency"
              className="text-xs font-medium text-rose-800 hover:text-rose-950 underline underline-offset-4"
            >
              View Emergency Triage Guide
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content: Form + Key Contact Channels */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form Column */}
          <div className="lg:col-span-7">
            <ContactFormClient departments={departments} />
          </div>

          {/* Quick Access Column */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white rounded-2xl border border-[#E6E4DD] p-6 shadow-xs">
              <h3 className="font-serif text-xl font-medium text-[#141716] mb-4">
                Main Campus Location
              </h3>
              <div className="space-y-4 text-xs text-neutral-600">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#0F5C5C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-neutral-900 block font-medium">Healix Hospital Campus</strong>
                    <span>100 Healix Boulevard, Metro Medical District</span>
                    <span className="block">North Wing Plaza, Suite 400</span>
                    <span className="font-mono text-neutral-500 mt-1 block">Postal Code: 10001</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[#0F5C5C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-neutral-900 block font-medium">Operating Hours</strong>
                    <span>Emergency & Trauma Center: 24/7/365</span>
                    <span className="block">Outpatient Consultations: 08:00 – 20:00 (Mon–Sat)</span>
                    <span className="block">Diagnostic Laboratories: 07:00 – 21:00</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#0F5C5C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-neutral-900 block font-medium">Email Desks</strong>
                    <span>General: inquiries@healixhealth.org</span>
                    <span className="block">Appointments: appointments@healixhealth.org</span>
                    <span className="block">Insurance: tpa.claims@healixhealth.org</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E6E4DD] flex items-center justify-between text-xs">
                <Link
                  href="/visiting-hours"
                  className="text-[#0F5C5C] font-medium hover:underline inline-flex items-center gap-1"
                >
                  Visitor Guidelines & Hours <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/facilities"
                  className="text-neutral-600 hover:text-neutral-900"
                >
                  Campus Amenities
                </Link>
              </div>
            </div>

            {/* Wayfinding & Transport card */}
            <div className="bg-white rounded-2xl border border-[#E6E4DD] p-6 shadow-xs">
              <h3 className="font-serif text-xl font-medium text-[#141716] mb-4">
                Transit & Parking
              </h3>

              <div className="space-y-4 text-xs text-neutral-600">
                <div className="flex items-start gap-3">
                  <Car className="w-4 h-4 text-[#0F5C5C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-neutral-900 block font-medium">Sub-Level Parking</strong>
                    <span>Over 600 sheltered bays with automated ticketless barrier entry and level 2 EV fast chargers. Dedicated valet service at Main Entrance.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Train className="w-4 h-4 text-[#0F5C5C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-neutral-900 block font-medium">Public Transport</strong>
                    <span>Direct underground pedestrian corridor connects from Metro Medical Center Station (Line 3, Exit B) straight to our North Atrium.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hospital Phone Extension Directory */}
      <section className="py-16 bg-white border-t border-[#E6E4DD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-mono uppercase tracking-wider text-[#0F5C5C]">
              Comprehensive Directory
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#141716] font-normal mt-1">
              Direct Department Extensions
            </h2>
            <p className="text-xs text-neutral-600 mt-2">
              For direct communication with specific clinical divisions, laboratories, and administrative desks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Trauma & Resuscitation Center',
                phone: '+1 (800) 432-5491',
                hours: '24/7 Continuous',
                ext: 'Ext. 100',
                note: 'For critical ambulance dispatch & acute trauma triage',
              },
              {
                title: 'Central Outpatient Appointments',
                phone: '+1 (800) 432-5490',
                hours: '08:00 – 20:00 (Mon–Sat)',
                ext: 'Ext. 2100',
                note: 'Specialist scheduling & tele-health bookings',
              },
              {
                title: 'Insurance & Cashless TPA Desk',
                phone: '+1 (800) 432-5492',
                hours: '24/7 for Inpatients',
                ext: 'Ext. 4400',
                note: 'Pre-authorizations, coverage queries & claims',
              },
              {
                title: 'Pathology & Diagnostic Lab',
                phone: '+1 (800) 432-5493',
                hours: '07:00 – 21:00 Daily',
                ext: 'Ext. 3200',
                note: 'Blood investigations, sample collections & reports',
              },
              {
                title: 'International Patient Care',
                phone: '+1 (800) 432-5494',
                hours: '08:00 – 18:00 (Mon–Fri)',
                ext: 'Ext. 5100',
                note: 'Medical visa assistance, language interpretation',
              },
              {
                title: 'Health Information Management (HIM)',
                phone: '+1 (800) 432-5495',
                hours: '09:00 – 17:00 (Mon–Fri)',
                ext: 'Ext. 6150',
                note: 'Certified medical records & radiological imaging copies',
              },
            ].map((desk, idx) => (
              <div key={idx} className="p-5 rounded-xl border border-[#E6E4DD] bg-[#FAF9F6]">
                <h4 className="font-serif text-base font-medium text-[#141716] mb-1">{desk.title}</h4>
                <div className="flex items-center justify-between text-xs font-mono text-[#0F5C5C] mb-2">
                  <a href={`tel:${desk.phone.replace(/[^0-9+]/g, '')}`} className="hover:underline font-bold">
                    {desk.phone}
                  </a>
                  <span className="text-neutral-500 font-normal">{desk.ext}</span>
                </div>
                <div className="text-[11px] text-neutral-500 space-y-1">
                  <p>Operating: {desk.hours}</p>
                  <p className="text-neutral-700">{desk.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
