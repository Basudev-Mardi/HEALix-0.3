'use client';

import React, { useState } from 'react';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  PhoneCall,
  Mail,
  MapPin,
  Building,
  Navigation,
} from 'lucide-react';

interface ContactFormProps {
  departments: string[];
}

export default function ContactFormClient({ departments }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'General Inquiries',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
    inquiryId?: string;
  }>({ type: 'idle', message: '' });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const res = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit inquiry. Please try again.');
      }

      setStatus({
        type: 'success',
        message:
          data.data?.message ||
          'Thank you. Your inquiry has been logged with our Patient Relations team.',
        inquiryId: data.data?.inquiry_id,
      });

      setFormData({
        name: '',
        email: '',
        phone: '',
        department: 'General Inquiries',
        subject: '',
        message: '',
      });
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.message || 'An unexpected error occurred. Please call our reception directly.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E6E4DD] p-8 shadow-xs">
      <h3 className="font-serif text-2xl font-normal text-[#141716] mb-2">
        Send an Electronic Inquiry
      </h3>
      <p className="text-xs text-neutral-600 mb-6">
        All non-emergency communications are reviewed by our patient liaison coordinators within 24 hours.
      </p>

      {status.type === 'success' && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-emerald-900">{status.message}</p>
              {status.inquiryId && (
                <p className="mt-1 font-mono text-[11px] text-emerald-700">
                  Reference ID: {status.inquiryId}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {status.type === 'error' && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <p>{status.message}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Full Legal Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Eleanor Vance"
              className="w-full text-xs rounded-lg border border-[#E6E4DD] px-3.5 py-2.5 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5C5C]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="eleanor@example.com"
              className="w-full text-xs rounded-lg border border-[#E6E4DD] px-3.5 py-2.5 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5C5C]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Contact Phone (Optional)
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              className="w-full text-xs rounded-lg border border-[#E6E4DD] px-3.5 py-2.5 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5C5C]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Department of Concern
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full text-xs rounded-lg border border-[#E6E4DD] px-3.5 py-2.5 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5C5C]"
            >
              <option value="General Inquiries">General Hospital Inquiries</option>
              <option value="Appointments Desk">Outpatient Appointments</option>
              <option value="Cashless Insurance">TPA & Cashless Claims</option>
              <option value="Billing & Accounts">Billing & Invoicing</option>
              <option value="International Patients">International Medical Travel</option>
              <option value="Medical Records">Medical Records & Tele-Consults</option>
              {departments.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Subject <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="subject"
            required
            value={formData.subject}
            onChange={handleChange}
            placeholder="e.g. Inquiry regarding international cardiology consultation"
            className="w-full text-xs rounded-lg border border-[#E6E4DD] px-3.5 py-2.5 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5C5C]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Message <span className="text-rose-500">*</span>
          </label>
          <textarea
            name="message"
            required
            rows={4}
            value={formData.message}
            onChange={handleChange}
            placeholder="Please detail your question or consultation requirement. For immediate emergency triage, please call our 24/7 hotline."
            className="w-full text-xs rounded-lg border border-[#E6E4DD] px-3.5 py-2.5 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5C5C]"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-6 rounded-lg bg-[#0F5C5C] text-white text-xs font-medium hover:bg-[#0c4a4a] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <span>Sending Inquiry...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Message to Patient Desk</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
