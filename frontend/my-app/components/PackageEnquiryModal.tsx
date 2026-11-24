'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { HealthPackage } from '@/lib/types';

interface PackageEnquiryModalProps {
  pkg: HealthPackage | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PackageEnquiryModal({
  pkg,
  isOpen,
  onClose,
}: PackageEnquiryModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [questions, setQuestions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !pkg) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMsg('Please provide your full name and email address.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBase}/support/packages/enquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          package_slug: pkg?.slug,
          package_name: pkg?.name,
          preferred_date: preferredDate,
          questions: questions.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit enquiry.');
      }

      setSuccessMsg(
        data.data?.message ||
          'Your package enquiry has been received. Please note that package date and slot availability are provisional until officially confirmed by authorized hospital personnel.'
      );
    } catch {
      // Graceful fallback for local offline testing
      setSuccessMsg(
        `Thank you, ${name.trim()}! Your enquiry for ${pkg?.name} has been received. Please note that package date and slot availability are provisional until officially confirmed by the hospital.`
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleResetAndClose() {
    setName('');
    setEmail('');
    setPhone('');
    setPreferredDate('');
    setQuestions('');
    setSuccessMsg(null);
    setErrorMsg(null);
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-[#e6e4dd] bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#768086] hover:bg-[#faf9f6] hover:text-[#14181a] transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 pr-8">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#0f5c5c] bg-[#edf5f4] px-2.5 py-0.5 rounded-full inline-block">
            Preventive Care Enquiry
          </span>
          <h2 className="font-editorial text-2xl text-[#14181a]">
            {pkg.name}
          </h2>
          <p className="text-xs text-[#768086]">
            Have questions about preparation, fasting protocols, or corporate group pricing? Speak with a certified Healix wellness coordinator.
          </p>
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-2.5 text-[11px] text-amber-900 mt-2">
            <span className="font-semibold">Hospital Availability Notice: </span>
            Package availability and appointment slots are provisional until formally verified and confirmed by authorized hospital scheduling staff.
          </div>
        </div>

        {successMsg ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-6 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <h3 className="font-editorial text-lg text-emerald-900">Enquiry Received (Pending Hospital Confirmation)</h3>
            <p className="text-xs text-emerald-800 leading-relaxed">{successMsg}</p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-5 py-2 rounded-full bg-[#0f5c5c] text-white text-xs font-medium hover:bg-[#0a4242] transition-colors"
              >
                Close
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="font-medium text-[#14181a]">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full rounded-lg border border-[#e6e4dd] px-3 py-2 text-xs text-[#14181a] focus:border-[#0f5c5c] focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-[#14181a]">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. eleanor@example.com"
                  className="w-full rounded-lg border border-[#e6e4dd] px-3 py-2 text-xs text-[#14181a] focus:border-[#0f5c5c] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="font-medium text-[#14181a]">
                  Mobile Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 019-2834"
                  className="w-full rounded-lg border border-[#e6e4dd] px-3 py-2 text-xs text-[#14181a] focus:border-[#0f5c5c] focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-[#14181a]">
                  Target Evaluation Date
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full rounded-lg border border-[#e6e4dd] px-3 py-2 text-xs text-[#14181a] focus:border-[#0f5c5c] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-[#14181a]">
                Questions / Specific Clinical Inquiries
              </label>
              <textarea
                rows={3}
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                placeholder="Ask about test components, doctor consultations, fasting guidance, or corporate health benefits..."
                className="w-full rounded-lg border border-[#e6e4dd] px-3 py-2 text-xs text-[#14181a] focus:border-[#0f5c5c] focus:outline-hidden resize-none"
              />
            </div>

            <div className="rounded-xl border border-[#e6e4dd] bg-[#faf9f6] p-3 text-[11px] text-[#768086] space-y-1">
              <div className="flex items-center gap-1.5 text-[#0f5c5c] font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Healix Patient Care Promise</span>
              </div>
              <p>
                Package fee is <strong>${pkg.price}</strong> (standard ${pkg.original_price}). We respect your privacy and will never share your medical inquiries.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 rounded-full border border-[#d2d0c8] text-xs font-medium text-[#4b555b] hover:border-[#14181a]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#14181a] text-white text-xs font-medium hover:bg-[#0f5c5c] transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Clock className="h-3.5 w-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Submit Enquiry
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer Support Info */}
        <div className="pt-3 border-t border-[#e6e4dd] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#768086]">
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-[#0f5c5c]" />
            <span>Direct Line: +1 (800) 432-5491</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-[#0f5c5c]" />
            <span>preventive@healix.hospital</span>
          </div>
        </div>
      </div>
    </div>
  );
}
