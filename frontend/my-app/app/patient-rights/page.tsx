import { Metadata } from 'next';
import Link from 'next/link';
import {
  Heart,
  ShieldCheck,
  Scale,
  Users,
  Eye,
  FileText,
  UserCheck,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Patient Rights & Responsibilities | Healix Hospital',
  description:
    'Our formal Patient Bill of Rights, non-discrimination declaration, informed decision-making standards, and patient responsibilities for clinical safety at Healix Hospital.',
};

export default function PatientRightsPage() {
  return (
    <div className="bg-[#FAF9F6] text-[#141716] min-h-screen">
      {/* Editorial Header */}
      <section className="border-b border-[#E6E4DD] bg-white/70 backdrop-blur-sm pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F5C5C]/10 text-[#0F5C5C] text-xs font-semibold tracking-wide uppercase mb-4">
            <ShieldCheck className="w-3.5 h-3.5" /> Ethical & Dignified Healthcare
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-light text-[#141716] tracking-tight leading-[1.15] mb-3">
            Patient Bill of Rights & Responsibilities
          </h1>
          <p className="text-base text-neutral-600 font-light leading-relaxed">
            Every individual entering Healix is entitled to compassionate, respectful, and expert medical care delivered free from bias. We believe optimal healing happens when patients and clinicians collaborate as trusted partners.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-[#E6E4DD] p-8 sm:p-12 shadow-xs space-y-12">
          {/* Part A: Rights */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="w-8 h-8 rounded-lg bg-[#0F5C5C] text-white flex items-center justify-center font-mono text-xs font-bold">
                A
              </span>
              <h2 className="text-2xl font-serif font-normal text-[#141716]">
                Your Rights as a Patient
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-[#FAF9F6] border border-[#E6E4DD]">
                <h3 className="font-serif text-base font-medium text-[#141716] mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#0F5C5C]" />
                  1. Dignity & Respect
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  You have the right to considerate, dignified care that respects your cultural background, religious values, personal beliefs, and human dignity without discrimination based on race, gender, nationality, religion, disability, or sexual orientation.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#FAF9F6] border border-[#E6E4DD]">
                <h3 className="font-serif text-base font-medium text-[#141716] mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#0F5C5C]" />
                  2. Complete Clinical Information
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  You have the right to receive complete, current information concerning your diagnosis, treatment plan, expected outcomes, and potential risks in words and terminology you can clearly understand.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#FAF9F6] border border-[#E6E4DD]">
                <h3 className="font-serif text-base font-medium text-[#141716] mb-2 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#0F5C5C]" />
                  3. Informed Consent & Refusal
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  You have the right to actively participate in decisions involving your healthcare. You may give or withhold informed consent for any treatment, procedure, or research study, and you may refuse medical treatment to the extent permitted by law.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#FAF9F6] border border-[#E6E4DD]">
                <h3 className="font-serif text-base font-medium text-[#141716] mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0F5C5C]" />
                  4. Privacy & Confidentiality
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  You are entitled to physical privacy during examinations, consultations, and inpatient ward stay. All communications, clinical notes, and diagnostic records are strictly confidential in accordance with HIPAA standards.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#FAF9F6] border border-[#E6E4DD]">
                <h3 className="font-serif text-base font-medium text-[#141716] mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0F5C5C]" />
                  5. Access to Medical Records
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  You have the right to review, inspect, and receive certified copies of your medical records and radiological imaging within reasonable statutory timeframes.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#FAF9F6] border border-[#E6E4DD]">
                <h3 className="font-serif text-base font-medium text-[#141716] mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#0F5C5C]" />
                  6. Second Opinions & Continuity
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  You have the right to seek a second medical opinion from another specialist, either within Healix or externally, without compromising your ongoing clinical care.
                </p>
              </div>
            </div>
          </div>

          {/* Part B: Responsibilities */}
          <div className="border-t border-[#E6E4DD] pt-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-8 h-8 rounded-lg bg-neutral-800 text-white flex items-center justify-center font-mono text-xs font-bold">
                B
              </span>
              <h2 className="text-2xl font-serif font-normal text-[#141716]">
                Your Responsibilities as a Patient
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: 'Accurate Medical History',
                  desc: 'Provide honest and complete information regarding your past illnesses, allergies, hospitalizations, medications, herbal supplements, and current complaints.',
                },
                {
                  title: 'Following the Agreed Care Plan',
                  desc: 'Comply with clinical instructions given by attending physicians and nursing teams, and promptly notify your doctor if unexpected side effects or symptoms arise.',
                },
                {
                  title: 'Respect for Hospital Community',
                  desc: 'Treat physicians, nurses, support staff, and fellow patients with courtesy and dignity. Keep noise levels minimal and adhere to visitor quotas and sanitary protocols.',
                },
                {
                  title: 'Financial Commitments',
                  desc: 'Provide accurate insurance coverage information promptly and meet agreed financial commitments for services rendered upon hospital discharge.',
                },
              ].map((resp, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-[#FAF9F6] border border-[#E6E4DD]">
                  <CheckCircle2 className="w-4 h-4 text-[#0F5C5C] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-serif text-sm font-medium text-neutral-900">{resp.title}</h4>
                    <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">{resp.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Part C: Inquiries & Grievances */}
          <div className="border-t border-[#E6E4DD] pt-8 bg-teal-50/50 p-6 rounded-xl border border-teal-100">
            <h3 className="font-serif text-lg font-medium text-teal-950 mb-2">
              Patient Relations & Grievance Mechanism
            </h3>
            <p className="text-xs text-teal-900/80 leading-relaxed mb-4">
              If you feel any of your patient rights have been compromised, you may file a formal grievance with our Office of Patient Experience. Grievances are investigated independently with formal written responses delivered within 7 business days.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/feedback"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#0F5C5C] text-white text-xs font-medium hover:bg-[#0c4a4a]"
              >
                Submit Patient Feedback
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#E6E4DD] text-neutral-700 text-xs font-medium hover:bg-neutral-50"
              >
                Contact Patient Ombudsman
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
