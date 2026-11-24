import { Metadata } from 'next';
import Link from 'next/link';
import FeedbackFormClient from '@/components/FeedbackFormClient';
import {
  HeartHandshake,
  ShieldCheck,
  Award,
  PhoneCall,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Patient Feedback & Quality Survey | Healix Hospital',
  description:
    'Share your experience, rate clinical attentiveness, and help us maintain gold-standard healthcare delivery at Healix Hospital.',
};

export default function FeedbackPage() {
  return (
    <div className="bg-[#FAF9F6] text-[#141716] min-h-screen">
      {/* Editorial Header */}
      <section className="border-b border-[#E6E4DD] bg-white/70 backdrop-blur-sm pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-mono uppercase tracking-wider text-[#0F5C5C]">
              Continuous Quality Improvement
            </span>
            <h1 className="text-4xl sm:text-5xl font-serif font-light text-[#141716] tracking-tight leading-[1.15] mt-2 mb-4">
              Patient Feedback & Experience
            </h1>
            <p className="text-lg text-neutral-600 font-light leading-relaxed">
              Every patient perspective drives our clinical protocols and compassionate nursing standards. We listen attentively to both commendations and constructive critiques.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content: Survey + Advocacy Info */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form */}
          <div className="lg:col-span-8">
            <FeedbackFormClient />
          </div>

          {/* Patient Advocacy & Rights Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-[#E6E4DD] p-6 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F5C5C] mb-4">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-medium text-[#141716] mb-2">
                Office of the Patient Ombudsman
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                If you have an urgent grievance during active hospitalization or outpatient visit that requires immediate executive intervention, contact our Ombudsman directly.
              </p>

              <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E6E4DD] text-xs space-y-1 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Helpline:</span>
                  <a href="tel:8004325499" className="font-mono font-bold text-[#0F5C5C]">
                    +1 (800) 432-5499
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Email:</span>
                  <span className="font-mono text-neutral-700">ombudsman@healixhealth.org</span>
                </div>
              </div>

              <Link
                href="/patient-rights"
                className="text-xs text-[#0F5C5C] hover:underline font-medium inline-block"
              >
                Read Patient Rights & Responsibilities &rarr;
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-[#E6E4DD] p-6 shadow-xs">
              <h3 className="font-serif text-lg font-medium text-[#141716] mb-3">
                How Your Feedback Is Used
              </h3>
              <ul className="space-y-2.5 text-xs text-neutral-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0F5C5C] shrink-0 mt-0.5" />
                  <span>Clinical nursing shift handovers and patient comfort reviews</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0F5C5C] shrink-0 mt-0.5" />
                  <span>Physician bedside manner and diagnostic explanation training</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0F5C5C] shrink-0 mt-0.5" />
                  <span>Facility sanitation, ward acoustics, and dietary menu enhancements</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
