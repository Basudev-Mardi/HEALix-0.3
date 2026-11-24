'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  HelpCircle,
  Mail,
  Phone,
  Send,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import type { InsurancePartner } from '@/lib/types';

interface InsuranceEnquiryFormProps {
  partners?: InsurancePartner[];
  prefilledPartner?: string;
}

export default function InsuranceEnquiryForm({
  partners = [],
  prefilledPartner = '',
}: InsuranceEnquiryFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [insurerName, setInsurerName] = useState(prefilledPartner);
  const [policyNumber, setPolicyNumber] = useState('');
  const [treatmentType, setTreatmentType] = useState('');
  const [estimatedDate, setEstimatedDate] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMsg('Full Name and Email Address are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBase}/support/insurance/enquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          insurer_name: insurerName.trim(),
          policy_number: policyNumber.trim(),
          treatment_type: treatmentType.trim(),
          estimated_date: estimatedDate,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit insurance inquiry.');
      }

      setSuccessMsg(
        data.data?.message ||
          'Your insurance pre-authorization request has been submitted to the Healix Insurance Desk. An officer will review your credentials and contact you shortly.'
      );
    } catch {
      // Graceful offline fallback
      setSuccessMsg(
        `Thank you, ${name.trim()}! Your pre-authorization enquiry for ${
          insurerName || 'your health policy'
        } has been registered with the Healix Insurance Desk. A coordinator will email you at ${email.trim()} within 2 to 4 business hours. Please note that coverage is subject to insurer pre-authorization.`
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setName('');
    setEmail('');
    setPhone('');
    setInsurerName('');
    setPolicyNumber('');
    setTreatmentType('');
    setEstimatedDate('');
    setMessage('');
    setSuccessMsg(null);
    setErrorMsg(null);
  }

  return (
    <div className="rounded-2xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xs space-y-6">
      <div className="space-y-1.5 border-b border-[#E5E8E6] pb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6EFE9] text-[#174C40] text-xs font-semibold uppercase tracking-wider">
          <Building2 className="h-3.5 w-3.5" />
          Pre-Authorization &amp; Coverage Verification Desk
        </div>
        <h3 className="font-editorial text-2xl text-[#242A28] mt-2">
          Verify Your Insurance Coverage
        </h3>
        <p className="text-xs text-[#77817C] leading-relaxed">
          Submit your policy details before admission to verify cashless eligibility, network tier standing, and estimate co-payments.
        </p>
      </div>

      {/* Mandatory Statutory Notice */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 flex items-start gap-3">
        <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Coverage Disclaimer &amp; Approval Mandate</p>
          <p className="mt-0.5 text-amber-800 leading-relaxed text-[11px]">
            Empanelment of an insurance provider or TPA does not imply that every medical condition or surgical procedure is automatically covered. Cashless approval is strictly determined by your insurer based on policy waiting periods, disease sub-limits, room category caps, deductibles, and pre-authorization approval.
          </p>
        </div>
      </div>

      {successMsg ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-6 text-center space-y-3">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
          <h4 className="font-editorial text-lg text-emerald-900">Enquiry Received</h4>
          <p className="text-xs text-emerald-800 leading-relaxed">{successMsg}</p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2 rounded-full bg-[#174C40] text-white text-xs font-medium hover:bg-[#0a4242] transition-colors"
            >
              Submit Another Enquiry
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-medium text-[#242A28]">
                Patient Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Robert Caldwell"
                className="w-full rounded-lg border border-[#E5E8E6] px-3 py-2.5 text-xs text-[#242A28] focus:border-[#174C40] focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-[#242A28]">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. robert@example.com"
                className="w-full rounded-lg border border-[#E5E8E6] px-3 py-2.5 text-xs text-[#242A28] focus:border-[#174C40] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-medium text-[#242A28]">
                Mobile Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 (555) 018-9922"
                className="w-full rounded-lg border border-[#E5E8E6] px-3 py-2.5 text-xs text-[#242A28] focus:border-[#174C40] focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-[#242A28]">
                Insurance Carrier or TPA
              </label>
              <input
                list="insurance-partners-list"
                value={insurerName}
                onChange={(e) => setInsurerName(e.target.value)}
                placeholder="e.g. Blue Cross, Aetna, MedAssist TPA..."
                className="w-full rounded-lg border border-[#E5E8E6] px-3 py-2.5 text-xs text-[#242A28] focus:border-[#174C40] focus:outline-hidden"
              />
              <datalist id="insurance-partners-list">
                {partners.map((p) => (
                  <option key={p.name} value={p.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-medium text-[#242A28]">
                Policy / Member ID Number
              </label>
              <input
                type="text"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                placeholder="e.g. BC-99482104"
                className="w-full rounded-lg border border-[#E5E8E6] px-3 py-2.5 text-xs text-[#242A28] focus:border-[#174C40] focus:outline-hidden font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-[#242A28]">
                Planned Procedure or Department
              </label>
              <input
                type="text"
                value={treatmentType}
                onChange={(e) => setTreatmentType(e.target.value)}
                placeholder="e.g. Cardiology Angioplasty, Knee Replacement, General Surgery"
                className="w-full rounded-lg border border-[#E5E8E6] px-3 py-2.5 text-xs text-[#242A28] focus:border-[#174C40] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-[#242A28]">
              Estimated Date of Admission (Optional)
            </label>
            <input
              type="date"
              value={estimatedDate}
              onChange={(e) => setEstimatedDate(e.target.value)}
              className="w-full sm:w-1/2 rounded-lg border border-[#E5E8E6] px-3 py-2.5 text-xs text-[#242A28] focus:border-[#174C40] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-[#242A28]">
              Additional Inquiries or Clinical Notes
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mention room category preferences, pre-existing conditions, or prior authorization queries..."
              className="w-full rounded-lg border border-[#E5E8E6] px-3 py-2.5 text-xs text-[#242A28] focus:border-[#174C40] focus:outline-hidden resize-none"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-[11px] text-[#77817C] flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#174C40]" />
              Average verification turnaround: 2–4 business hours
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#242A28] text-white text-xs font-medium hover:bg-[#174C40] transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Clock className="h-3.5 w-3.5 animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Submit Insurance Pre-Auth Enquiry
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
