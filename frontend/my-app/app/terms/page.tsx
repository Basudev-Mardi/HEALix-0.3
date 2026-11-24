import { Metadata } from 'next';
import Link from 'next/link';
import {
  FileText,
  AlertCircle,
  CreditCard,
  HeartPulse,
  Scale,
  CalendarCheck2,
  CheckCircle2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms & Conditions of Service | Healix Hospital',
  description:
    'General outpatient terms, inpatient admission conditions, clinical consent, telehealth consultation terms, and financial billing regulations of Healix Hospital.',
};

export default function TermsPage() {
  const lastUpdated = 'November 15, 2026';

  return (
    <div className="bg-[#FAF9F6] text-[#141716] min-h-screen">
      {/* Editorial Header */}
      <section className="border-b border-[#E6E4DD] bg-white/70 backdrop-blur-sm pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F5C5C]/10 text-[#0F5C5C] text-xs font-semibold tracking-wide uppercase mb-4">
            <Scale className="w-3.5 h-3.5" /> Clinical & Administrative Agreement
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-light text-[#141716] tracking-tight leading-[1.15] mb-3">
            Terms & Conditions of Hospital Service
          </h1>
          <p className="text-sm font-mono text-neutral-500">
            Governing All Inpatient, Outpatient, Telehealth, and Portal Services &bull; Revised {lastUpdated}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-[#E6E4DD] p-8 sm:p-12 shadow-xs space-y-12">
          {/* Section 1: Agreement */}
          <div>
            <h2 className="text-2xl font-serif font-normal text-[#141716] mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#0F5C5C]" />
              1. General Acceptance & Scope of Care
            </h2>
            <div className="text-xs sm:text-sm text-neutral-600 leading-relaxed space-y-3 font-light">
              <p>
                By registering as a patient, booking an appointment, admitting into an inpatient room, or utilizing the Healix Patient Portal, you acknowledge that you have read, understood, and agreed to be bound by these Terms & Conditions.
              </p>
              <p>
                Medical and surgical treatments at Healix are administered by licensed healthcare professionals exercising their independent clinical judgment. While our clinicians follow international evidence-based guidelines, medicine is an observational science and outcomes cannot be guaranteed.
              </p>
            </div>
          </div>

          {/* Section 2: Outpatient & Telehealth */}
          <div className="border-t border-[#E6E4DD] pt-8">
            <h2 className="text-2xl font-serif font-normal text-[#141716] mb-4 flex items-center gap-2">
              <CalendarCheck2 className="w-6 h-6 text-[#0F5C5C]" />
              2. Appointment Protocols & Telehealth Consultations
            </h2>
            <div className="text-xs sm:text-sm text-neutral-600 leading-relaxed space-y-3 font-light">
              <p>
                <strong>Arrival Window:</strong> Outpatient consultations require patients to check in at least 15 minutes prior to scheduled slot times to complete vital checks and nursing triage.
              </p>
              <p>
                <strong>Cancellation Policy:</strong> Non-emergency cancellations or rescheduling must be requested at least 24 hours in advance through the online portal or appointments line to release the slot for waitlisted individuals.
              </p>
              <p>
                <strong>Telehealth Limitations:</strong> Telehealth video appointments are intended for routine follow-ups, medication reviews, and non-emergent triage. In acute life-threatening situations, patients must immediately proceed to the nearest emergency room or dial emergency services.
              </p>
            </div>
          </div>

          {/* Section 3: Inpatient Admission & Consent */}
          <div className="border-t border-[#E6E4DD] pt-8">
            <h2 className="text-2xl font-serif font-normal text-[#141716] mb-4 flex items-center gap-2">
              <HeartPulse className="w-6 h-6 text-[#0F5C5C]" />
              3. Informed Consent & Surgical Care
            </h2>
            <div className="text-xs sm:text-sm text-neutral-600 leading-relaxed space-y-3 font-light">
              <p>
                Any invasive diagnostic procedure, surgical intervention, administration of blood products, or anesthesia requires prior informed consent. Our attending clinicians will explain the expected benefits, foreseeable risks, alternatives, and convalescence path prior to obtaining signed documentation.
              </p>
              <p>
                Emergency procedures necessary to preserve life, limb, or neurological viability may proceed in accordance with applicable medical emergency doctrine when a patient or designated healthcare surrogate is incapacitated.
              </p>
            </div>
          </div>

          {/* Section 4: Billing & Financial Policies */}
          <div className="border-t border-[#E6E4DD] pt-8">
            <h2 className="text-2xl font-serif font-normal text-[#141716] mb-4 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-[#0F5C5C]" />
              4. Financial Responsibility & Billing Policies
            </h2>
            <div className="text-xs sm:text-sm text-neutral-600 leading-relaxed space-y-3 font-light">
              <p>
                <strong>Patient Responsibility:</strong> The patient or legal guarantor remains ultimately responsible for all hospital fees incurred, regardless of insurance status. While Healix assists in filing cashless claims with empaneled TPAs, any deductible, co-insurance, or non-covered items must be settled upon discharge.
              </p>
              <p>
                <strong>Dispute Resolution:</strong> If you identify discrepancies in your itemized billing statement, our Patient Financial Counseling team provides itemized reviews within 3 business days of notification.
              </p>
            </div>
          </div>

          {/* Section 5: Conduct on Premises */}
          <div className="border-t border-[#E6E4DD] pt-8">
            <h2 className="text-2xl font-serif font-normal text-[#141716] mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-[#0F5C5C]" />
              5. Zero-Tolerance Safety & Campus Conduct
            </h2>
            <div className="text-xs sm:text-sm text-neutral-600 leading-relaxed space-y-3 font-light">
              <p>
                Healix maintains a strict zero-tolerance policy towards verbal abuse, physical violence, harassment, or discrimination directed toward medical staff, nursing personnel, or other hospital guests. Violations may result in immediate security removal and law enforcement notification.
              </p>
              <p>
                Smoking, vaping, illicit substances, and unauthorized weapons are strictly prohibited across all interior and exterior hospital campus facilities.
              </p>
            </div>
          </div>

          {/* Contact footer */}
          <div className="border-t border-[#E6E4DD] pt-8 text-xs text-neutral-500">
            For questions regarding hospital terms or billing counseling, please contact{' '}
            <Link href="/contact" className="text-[#0F5C5C] underline">
              Hospital Administration
            </Link>{' '}
            or visit the Billing Desk in the Main Atrium.
          </div>
        </div>
      </section>
    </div>
  );
}
