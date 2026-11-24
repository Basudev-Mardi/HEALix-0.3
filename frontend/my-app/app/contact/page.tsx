import { Metadata } from 'next';
import Link from 'next/link';
import ContactFaqAccordion from '@/components/ContactFaqAccordion';
import ContactFormClient from '@/components/ContactFormClient';
import {
  ArrowRight,
  Building,
  Car,
  Clock,
  HeartHandshake,
  HelpCircle,
  Mail,
  MapPin,
  Navigation,
  Phone,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Train,
  Users,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us & Campus Directions | Healix Hospital',
  description:
    'Hospital address, 24/7 trauma emergency lines, department telephone directory, visiting hours, transit directions, and contact enquiry form for Healix Medical Center.',
};

export default function ContactPage() {
  const departments = [
    'General Inquiries & Reception',
    'Cardiology & Vascular Institute',
    'Neurology & Neurosurgery',
    'Orthopedics & Joint Reconstruction',
    'Oncology & Cancer Care',
    'Pediatrics & Neonatal ICU',
    'Obstetrics & Gynecology',
    'Insurance & Cashless TPA Desk',
    'Health Information Management (Records)',
    'Executive Health Checkups',
  ];

  return (
    <div className="bg-[#FAF9F6] text-[#141716] min-h-screen">
      {/* Editorial Hero Header */}
      <section className="border-b border-[#E6E4DD] bg-white/70 backdrop-blur-xs pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0F5C5C]/10 text-[#0F5C5C] text-xs font-semibold tracking-wide uppercase">
              <PhoneCall className="w-3.5 h-3.5" />
              Direct Clinical &amp; Administrative Channels
            </div>
            <h1 className="text-4xl sm:text-5xl font-editorial font-light text-[#141716] tracking-tight leading-[1.15]">
              Contact &amp; Campus Wayfinding
            </h1>
            <p className="text-base sm:text-lg text-neutral-600 font-light leading-relaxed">
              Whether arranging specialist outpatient care, coordinating a cashless admission, inquiring about visiting hours, or accessing 24/7 trauma emergency care, our medical teams are here to help.
            </p>
          </div>
        </div>
      </section>

      {/* Prominent 24/7 Emergency Immediate Action Banner */}
      <section className="bg-rose-600 text-white py-4 shadow-md sticky top-18 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-9 h-9 rounded-full bg-white text-rose-700 flex items-center justify-center shrink-0 shadow-xs">
              <Siren className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-100 font-mono">
                24/7 Emergency &amp; Level 1 Trauma Resuscitation Hotline
              </p>
              <p className="text-sm font-semibold">
                For life-threatening emergencies &amp; direct ambulance dispatch:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="tel:8009114325"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white text-rose-700 text-xs font-bold hover:bg-rose-50 transition-colors shadow-xs"
            >
              <PhoneCall className="w-4 h-4" /> Call +1 (800) 911-4325
            </a>
            <Link
              href="/emergency"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-700 text-white text-xs font-medium hover:bg-rose-800 transition-colors border border-rose-500"
            >
              Emergency Triage Guide
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Grid: Form + Location & Hours */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Contact Form & General Enquiry */}
          <div className="lg:col-span-7 space-y-6">
            <ContactFormClient departments={departments} />
          </div>

          {/* Right Column: Hospital Address, Operating Hours, Quick Help */}
          <div className="lg:col-span-5 space-y-6">
            {/* Main Campus Location */}
            <div className="bg-white rounded-2xl border border-[#E6E4DD] p-7 shadow-xs space-y-5">
              <h3 className="font-editorial text-xl font-medium text-[#141716] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#0F5C5C]" />
                Hospital Campus Address
              </h3>

              <div className="space-y-4 text-xs text-neutral-600">
                <div className="flex items-start gap-3">
                  <Building className="w-4 h-4 text-[#0F5C5C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-neutral-900 block font-medium">Healix Medical Center</strong>
                    <span>100 Healix Boulevard, Metro Medical District</span>
                    <span className="block">North Wing Plaza, Suite 400</span>
                    <span className="block text-neutral-500 font-mono mt-0.5">Boston, MA 02115 · USA</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#0F5C5C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-neutral-900 block font-medium">Primary Telephone Lines</strong>
                    <span>General Reception: <a href="tel:18004325490" className="text-[#0F5C5C] hover:underline font-mono">+1 (800) 432-5490</a></span>
                    <span className="block">Appointments Desk: <a href="tel:18004325490" className="text-[#0F5C5C] hover:underline font-mono">+1 (800) 432-5490 ext 2100</a></span>
                    <span className="block text-rose-700 font-bold font-mono">Emergency 24/7: +1 (800) 911-4325</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#0F5C5C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-neutral-900 block font-medium">Email Desks</strong>
                    <span>General Inquiries: inquiries@healixhealth.org</span>
                    <span className="block">Appointments: appointments@healixhealth.org</span>
                    <span className="block">Cashless Insurance: tpa.claims@healixhealth.org</span>
                    <span className="block">Medical Records: records@healixhealth.org</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visiting Hours Overview Card */}
            <div className="bg-white rounded-2xl border border-[#E6E4DD] p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-editorial text-xl font-medium text-[#141716] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#0F5C5C]" />
                  Visiting Hours Summary
                </h3>
                <Link
                  href="/visiting-hours"
                  className="text-xs font-medium text-[#0F5C5C] hover:underline inline-flex items-center gap-1"
                >
                  Full Policy
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E6E4DD] space-y-1">
                  <div className="flex items-center justify-between font-semibold text-[#242A28]">
                    <span>General Inpatient Wards</span>
                    <span className="font-mono text-[#0F5C5C]">09:00 AM – 08:30 PM</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">Max 2 visitors per bedside at any time. Quiet hours commence at 9:00 PM.</p>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E6E4DD] space-y-1">
                  <div className="flex items-center justify-between font-semibold text-[#242A28]">
                    <span>Intensive Care (ICU / CCU / NICU)</span>
                    <span className="font-mono text-[#0F5C5C]">11:00 AM &amp; 05:00 PM</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">11:00 AM – 12:00 PM &amp; 05:00 PM – 06:00 PM. Immediate family members only.</p>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E6E4DD] space-y-1">
                  <div className="flex items-center justify-between font-semibold text-[#242A28]">
                    <span>Outpatient Consultations (OPD)</span>
                    <span className="font-mono text-[#0F5C5C]">08:00 AM – 08:00 PM</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">Monday through Saturday. Walk-in and scheduled appointments.</p>
                </div>
              </div>
            </div>

            {/* Patient Feedback & Ombudsman Advocacy Card */}
            <div className="rounded-2xl border border-teal-200 bg-[#E6EFE9]/40 p-6 space-y-3">
              <div className="flex items-center gap-2 text-[#174C40] font-semibold text-xs">
                <HeartHandshake className="h-4 w-4" />
                <span>Patient Experience &amp; Feedback</span>
              </div>
              <h4 className="font-editorial text-lg text-[#242A28]">
                Share Your Experience or Submit a Grievance
              </h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                We value your observations. Whether commending a compassionate caregiver or addressing a service grievance, your feedback directly shapes our hospital quality standards.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <Link
                  href="/feedback"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#242A28] text-white text-xs font-medium hover:bg-[#174C40] transition-colors"
                >
                  Patient Feedback Form
                  <ArrowRight className="h-3 w-3" />
                </Link>
                <Link
                  href="/patient-rights"
                  className="text-xs text-[#174C40] hover:underline font-medium"
                >
                  Patient Rights
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Map, Transit & Directions Section */}
        <div className="space-y-8 pt-6 border-t border-[#E6E4DD]">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#0F5C5C]">
              Campus Wayfinding &amp; Parking
            </span>
            <h2 className="text-2xl sm:text-3xl font-editorial text-[#141716] font-normal">
              Map, Parking &amp; Transit Directions
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl">
              Conveniently accessible by highway, public transit, and sub-level sheltered parking with valet and EV charging.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Driving Directions */}
            <div className="rounded-2xl border border-[#E6E4DD] bg-white p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F5C5C]">
                <Navigation className="w-5 h-5" />
              </div>
              <h3 className="font-editorial text-lg text-[#242A28]">Driving &amp; Highway Access</h3>
              <ul className="text-xs text-neutral-600 space-y-2 leading-relaxed">
                <li>
                  <strong className="text-neutral-900 block">From I-90 (Mass Pike):</strong>
                  Take Exit 133 toward Medical District. Continue straight on Avenue Louis Pasteur for 0.8 miles, turning right onto Healix Boulevard.
                </li>
                <li>
                  <strong className="text-neutral-900 block">From I-93 North / South:</strong>
                  Take Exit 18 toward Massachusetts Ave / Medical Area. Follow Melnea Cass Blvd to Tremont St onto Healix Boulevard.
                </li>
              </ul>
            </div>

            {/* Transit */}
            <div className="rounded-2xl border border-[#E6E4DD] bg-white p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F5C5C]">
                <Train className="w-5 h-5" />
              </div>
              <h3 className="font-editorial text-lg text-[#242A28]">Subway &amp; Bus Transit</h3>
              <ul className="text-xs text-neutral-600 space-y-2 leading-relaxed">
                <li>
                  <strong className="text-neutral-900 block">Metro Subway (Line 3):</strong>
                  Direct climate-controlled underground pedestrian walkway connects Metro Medical Center Station (Exit B) directly into our North Atrium.
                </li>
                <li>
                  <strong className="text-neutral-900 block">Bus Connections:</strong>
                  Routes 44, 47, 8, and CT2 stop directly in front of the Hospital Main Plaza (Stop #3821).
                </li>
              </ul>
            </div>

            {/* Parking */}
            <div className="rounded-2xl border border-[#E6E4DD] bg-white p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F5C5C]">
                <Car className="w-5 h-5" />
              </div>
              <h3 className="font-editorial text-lg text-[#242A28]">Parking &amp; Valet Services</h3>
              <ul className="text-xs text-neutral-600 space-y-2 leading-relaxed">
                <li>
                  <strong className="text-neutral-900 block">Sub-Level Garage (Gate 2):</strong>
                  600 sheltered spaces with ticketless license-plate recognition. $4/hour ($18 daily maximum). Free validation for emergency visits.
                </li>
                <li>
                  <strong className="text-neutral-900 block">Valet Drop-Off:</strong>
                  Main Entrance circle from 07:00 AM to 09:00 PM daily. Dedicated Level 2 EV charging on P1.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Hospital Department Extensions Directory */}
        <div className="space-y-8 pt-6 border-t border-[#E6E4DD]">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#0F5C5C]">
              Telephone Directory
            </span>
            <h2 className="text-2xl sm:text-3xl font-editorial text-[#141716] font-normal">
              Direct Department Contact Numbers
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600">
              Direct communication lines for specific clinical divisions, laboratories, and support services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: 'Trauma & Emergency Center',
                phone: '+1 (800) 911-4325',
                hours: '24/7/365 Continuous',
                ext: 'Ext. 100',
                note: 'Critical trauma resuscitation & ambulance dispatch',
                isEmergency: true,
              },
              {
                title: 'Central Outpatient Appointments',
                phone: '+1 (800) 432-5490',
                hours: '08:00 – 20:00 (Mon–Sat)',
                ext: 'Ext. 2100',
                note: 'Specialist scheduling & consultation bookings',
              },
              {
                title: 'Insurance & Cashless TPA Desk',
                phone: '+1 (800) 432-5492',
                hours: '24/7 for Inpatients',
                ext: 'Ext. 4400',
                note: 'Pre-authorizations, claims & insurance counseling',
              },
              {
                title: 'Pathology & Diagnostic Laboratory',
                phone: '+1 (800) 432-5493',
                hours: '07:00 – 21:00 Daily',
                ext: 'Ext. 3200',
                note: 'Blood investigations, sample collections & results',
              },
              {
                title: 'Cardiology & Cath Lab Desk',
                phone: '+1 (800) 432-5496',
                hours: '08:00 – 19:00 (Mon–Sat)',
                ext: 'Ext. 2200',
                note: 'ECG, 2D Echo, stress testing & cardiac reviews',
              },
              {
                title: 'Radiology & Diagnostic Imaging',
                phone: '+1 (800) 432-5497',
                hours: '24/7 for Inpatients & ER',
                ext: 'Ext. 3100',
                note: 'MRI, CT scan, ultrasound & digital X-ray services',
              },
              {
                title: 'Health Information Management (HIM)',
                phone: '+1 (800) 432-5495',
                hours: '09:00 – 17:00 (Mon–Fri)',
                ext: 'Ext. 6150',
                note: 'Certified medical records, reports & imaging copies',
              },
              {
                title: 'International Patient Care Desk',
                phone: '+1 (800) 432-5494',
                hours: '08:00 – 18:00 (Mon–Fri)',
                ext: 'Ext. 5100',
                note: 'Medical travel, language interpretation & visa letters',
              },
              {
                title: 'Hospital Central Pharmacy',
                phone: '+1 (800) 432-5498',
                hours: '24/7/365 Open',
                ext: 'Ext. 1100',
                note: 'Prescription dispensing, discharge medications & queries',
              },
            ].map((desk, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border transition-all ${
                  desk.isEmergency
                    ? 'border-rose-200 bg-rose-50/50'
                    : 'border-[#E6E4DD] bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h4 className="font-editorial text-base font-medium text-[#141716]">
                    {desk.title}
                  </h4>
                  {desk.isEmergency && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold uppercase">
                      24/7
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <a
                    href={`tel:${desk.phone.replace(/[^0-9+]/g, '')}`}
                    className={`font-bold hover:underline ${
                      desk.isEmergency ? 'text-rose-700 font-bold' : 'text-[#0F5C5C]'
                    }`}
                  >
                    {desk.phone}
                  </a>
                  <span className="text-neutral-500 font-normal">{desk.ext}</span>
                </div>

                <div className="text-[11px] text-neutral-500 space-y-1 pt-1 border-t border-[#f0eee6]">
                  <p>Hours: {desk.hours}</p>
                  <p className="text-neutral-700">{desk.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact & Support FAQs Section */}
        <div className="space-y-8 pt-6 border-t border-[#E6E4DD]">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#0F5C5C]">
              Common Questions
            </span>
            <h2 className="text-2xl sm:text-3xl font-editorial text-[#141716] font-normal">
              Contact &amp; Support FAQs
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600">
              Helpful answers on parking, emergency arrival, visitor badges, and campus amenities.
            </p>
          </div>

          <div className="max-w-4xl">
            <ContactFaqAccordion />
          </div>
        </div>
      </section>
    </div>
  );
}
