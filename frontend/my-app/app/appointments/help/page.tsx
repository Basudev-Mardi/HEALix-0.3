import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarCheck, HelpCircle, Phone, Siren } from 'lucide-react';
import AppointmentHelpClient from '@/components/AppointmentHelpClient';
import PageHeader from '@/components/PageHeader';
import { getAppointmentFaqs } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Appointment Help & FAQs',
  description:
    'Answers to common questions about booking consultations, insurance, video tele-consults, cancellations, and preparation at Healix Medical Center.',
};

export default async function AppointmentHelpPage() {
  const faqs = await getAppointmentFaqs();

  return (
    <div>
      <PageHeader
        eyebrow="Patient Support"
        title="Appointment Help"
        description="Everything you need to know about scheduling, preparing for your consultation, managing changes, and billing."
        breadcrumbs={[
          { label: 'Appointments', href: '/appointments/doctors' },
          { label: 'Appointment Help' },
        ]}
      />

      <section className="container-editorial py-14 lg:py-18">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* FAQ Accordion */}
          <div className="lg:col-span-8">
            <AppointmentHelpClient faqs={faqs} />
          </div>

          {/* Support Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-[#E5E8E6] bg-white p-7 space-y-4">
              <HelpCircle className="h-5 w-5 text-[#174C40]" />
              <h2 className="text-lg font-medium text-[#242A28]">Need assistance scheduling?</h2>
              <p className="text-sm text-[#4A5350] leading-relaxed">
                Our patient access coordinators can help match you with the right sub-specialist or
                arrange multi-department visits on the same day.
              </p>
              <div className="pt-2 space-y-2 text-sm">
                <p className="flex items-center gap-2 font-mono text-[#242A28]">
                  <Phone className="h-4 w-4 text-[#174C40]" />
                  +1 (800) 432-5490
                </p>
                <p className="text-xs text-[#77817C]">Mon – Sat, 07:30 AM – 07:00 PM</p>
              </div>
              <div className="pt-3 flex flex-col gap-2.5">
                <Link
                  href="/appointments/doctors"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#242A28] text-white text-xs font-medium hover:bg-[#174C40] transition-colors"
                >
                  <CalendarCheck className="h-3.5 w-3.5" />
                  Book Appointment Online
                </Link>
                <Link
                  href="/appointments/track"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full border border-[#77817C] text-xs font-medium text-[#242A28] hover:border-[#242A28] transition-colors"
                >
                  Track Existing Booking
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-[#f0d5d5] bg-[#fef2f2] p-7 space-y-3">
              <p className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#b91c1c]">
                <Siren className="h-3.5 w-3.5" />
                Urgent Symptoms?
              </p>
              <p className="text-sm text-[#4A5350]">
                Do not use online scheduling for chest pain, acute stroke symptoms, or severe
                trauma.
              </p>
              <Link
                href="/emergency"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#b91c1c] hover:underline"
              >
                Go to 24/7 Emergency Info
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
