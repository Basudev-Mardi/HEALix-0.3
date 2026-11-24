'use client';

import React, { useState } from 'react';
import {
  Star,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  Send,
  MessageSquare,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export default function FeedbackFormClient() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    department_visited: '',
    overall_rating: 5,
    doctor_care_rating: 5,
    cleanliness_rating: 5,
    staff_courtesy_rating: 5,
    comments: '',
    would_recommend: true,
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
    feedbackId?: string;
  }>({ type: 'idle', message: '' });

  const handleRatingChange = (field: string, val: number) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const res = await fetch('/api/support/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit feedback.');
      }

      setStatus({
        type: 'success',
        message: data.data?.message || 'Thank you for your valuable feedback!',
        feedbackId: data.data?.feedback_id,
      });

      setFormData({
        full_name: '',
        email: '',
        phone: '',
        department_visited: '',
        overall_rating: 5,
        doctor_care_rating: 5,
        cleanliness_rating: 5,
        staff_courtesy_rating: 5,
        comments: '',
        would_recommend: true,
      });
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.message || 'Error submitting feedback. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  const StarSelector = ({
    value,
    onChange,
    label,
  }: {
    value: number;
    onChange: (val: number) => void;
    label: string;
  }) => (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-neutral-700">{label}</label>
        <span className="font-mono text-xs text-neutral-500">{value} / 5</span>
      </div>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 text-neutral-300 hover:text-amber-400 focus:outline-none transition-colors"
          >
            <Star
              className={`w-6 h-6 ${
                star <= value ? 'text-amber-400 fill-amber-400' : 'text-neutral-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-[#E6E4DD] p-8 shadow-xs">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F5C5C]">
          <HeartHandshake className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-serif text-2xl font-light text-[#141716]">
            Patient Experience Survey
          </h3>
          <p className="text-xs text-neutral-500">
            Confidential review reviewed directly by our Quality & Clinical Safety Council.
          </p>
        </div>
      </div>

      {status.type === 'success' && (
        <div className="mb-6 p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-emerald-950 text-sm mb-1">{status.message}</p>
              <p className="text-emerald-700 leading-relaxed">
                Your input enables us to continuously elevate clinical standards, staff attentiveness, and patient safety.
              </p>
              {status.feedbackId && (
                <p className="mt-2 font-mono text-[11px] text-emerald-800">
                  Acknowledgement ID: {status.feedbackId}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {status.type === 'error' && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <p>{status.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating Metrics Grid */}
        <div className="p-5 rounded-xl bg-[#FAF9F6] border border-[#E6E4DD] grid grid-cols-1 sm:grid-cols-2 gap-6">
          <StarSelector
            label="Overall Hospital Experience"
            value={formData.overall_rating}
            onChange={(val) => handleRatingChange('overall_rating', val)}
          />
          <StarSelector
            label="Doctor & Clinical Care"
            value={formData.doctor_care_rating}
            onChange={(val) => handleRatingChange('doctor_care_rating', val)}
          />
          <StarSelector
            label="Nursing & Staff Courtesy"
            value={formData.staff_courtesy_rating}
            onChange={(val) => handleRatingChange('staff_courtesy_rating', val)}
          />
          <StarSelector
            label="Cleanliness & Facility Hygiene"
            value={formData.cleanliness_rating}
            onChange={(val) => handleRatingChange('cleanliness_rating', val)}
          />
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Your Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="e.g. Samuel Chen"
              className="w-full text-xs rounded-lg border border-[#E6E4DD] px-3.5 py-2.5 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5C5C]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="samuel@example.com"
              className="w-full text-xs rounded-lg border border-[#E6E4DD] px-3.5 py-2.5 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5C5C]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Department / Ward Visited
            </label>
            <input
              type="text"
              value={formData.department_visited}
              onChange={(e) => setFormData({ ...formData, department_visited: e.target.value })}
              placeholder="e.g. Cardiology OPD, 4th Floor"
              className="w-full text-xs rounded-lg border border-[#E6E4DD] px-3.5 py-2.5 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5C5C]"
            />
          </div>
        </div>

        {/* Written Review */}
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Detailed Observations or Suggestions <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={formData.comments}
            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            placeholder="Share what went well or where our team can improve care delivery, wait times, or communication."
            className="w-full text-xs rounded-lg border border-[#E6E4DD] px-3.5 py-2.5 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5C5C]"
          ></textarea>
        </div>

        {/* Would recommend toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="recommend"
            checked={formData.would_recommend}
            onChange={(e) => setFormData({ ...formData, would_recommend: e.target.checked })}
            className="w-4 h-4 rounded text-[#0F5C5C] focus:ring-[#0F5C5C] border-[#E6E4DD]"
          />
          <label htmlFor="recommend" className="text-xs text-neutral-700">
            I would recommend Healix Hospital to friends and family in need of medical care.
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-6 rounded-lg bg-[#0F5C5C] text-white text-xs font-medium hover:bg-[#0c4a4a] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <span>Recording Feedback...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Confidential Feedback</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
