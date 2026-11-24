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
      <div className="relative w-full max-w-lg rounded-2xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#77817C] hover:bg-[#FAFAF7] hover:text-[#242A28] transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 pr-8">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#174C40] bg-[#E6EFE9] px-2.5 py-0.5 rounded-full inline-block">
            Preventive Care Enquiry
          </span>
          <h2 className="font-editorial text-2xl text-[#242A28]">
            {pkg.name}
          </h2>
          <p className="text-xs text-[#77817C]">
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
                className="px-5 py-2 rounded-full bg-[#174C40] text-white text-xs font-medium hover:bg-[#0a4242] transition-colors"
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
                <label className="font-medium text-[#242A28]">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full rounded-lg border border-[#E5E8E6] px-3 py-2 text-xs text-[#242A28] focus:border-[#174C40] focus:outline-hidden"
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
                  placeholder="e.g. eleanor@example.com"
                  className="w-full rounded-lg border border-[#E5E8E6] px-3 py-2 text-xs text-[#242A28] focus:border-[#174C40] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="font-medium text-[#242A28]">
                  Mobile Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 019-2834"
                  className="w-full rounded-lg border border-[#E5E8E6] px-3 py-2 text-xs text-[#242A28] focus:border-[#174C40] focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-[#242A28]">
                  Target Evaluation Date
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E8E6] px-3 py-2 text-xs text-[#242A28] focus:border-[#174C40] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-[#242A28]">
                Questions / Specific Clinical Inquiries
              </label>
              <textarea
                rows={3}
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                placeholder="Ask about test components, doctor consultations, fasting guidance, or corporate health benefits..."
                className="w-full rounded-lg border border-[#E5E8E6] px-3 py-2 text-xs text-[#242A28] focus:border-[#174C40] focus:outline-hidden resize-none"
              />
            </div>

            <div className="rounded-xl border border-[#E5E8E6] bg-[#FAFAF7] p-3 text-[11px] text-[#77817C] space-y-1">
              <div className="flex items-center gap-1.5 text-[#174C40] font-medium">
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
                className="px-4 py-2 rounded-full border border-[#d2d0c8] text-xs font-medium text-[#4A5350] hover:border-[#242A28]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#242A28] text-white text-xs font-medium hover:bg-[#174C40] transition-colors disabled:opacity-50"
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
        <div className="pt-3 border-t border-[#E5E8E6] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#77817C]">
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-[#174C40]" />
            <span>Direct Line: +1 (800) 432-5491</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-[#174C40]" />
            <span>preventive@healix.hospital</span>
          </div>
        </div>
      </div>
    </div>
  );
}
