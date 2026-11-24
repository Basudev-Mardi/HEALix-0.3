'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { patientApiFetch } from '@/lib/patient-auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ message: string; demo_reset_token?: string | null } | null>(
    null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await patientApiFetch<{ message: string; demo_reset_token?: string | null }>(
      '/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    );

    if (res.error || !res.data) {
      setError(res.error || 'Unable to process request.');
    } else {
      setResult(res.data);
    }
    setSubmitting(false);
  }

  return (
    <section className="container-editorial py-16 lg:py-20">
      <div className="max-w-md mx-auto">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-[#768086] hover:text-[#14181a] mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Sign In
        </Link>

        <div className="space-y-3 mb-8">
          <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#0f5c5c]">
            Account Recovery
          </p>
          <h1 className="font-editorial text-4xl text-[#14181a]">Forgot your password?</h1>
          <p className="text-sm text-[#4b555b]">
            Enter the email address registered with your Healix account and we will issue a secure
            password reset link.
          </p>
        </div>

        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-7 sm:p-9">
          {result ? (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#0f5c5c] shrink-0 mt-0.5" />
                <p className="text-sm text-[#14181a] leading-relaxed">{result.message}</p>
              </div>

              {result.demo_reset_token && (
                <div className="rounded-xl border border-[#cde4de] bg-[#edf5f4] p-4 space-y-3">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-[#0f5c5c]">
                    Direct Reset Link Ready
                  </p>
                  <Link
                    href={`/reset-password?token=${encodeURIComponent(result.demo_reset_token)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#14181a] underline hover:text-[#0f5c5c]"
                  >
                    Proceed to Reset Password
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-[#f0d5d5] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]"
                >
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="forgot-email" className="block text-xs font-medium text-[#14181a] mb-1.5">
                  Registered Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="clara.vance@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#14181a] text-white text-sm font-medium hover:bg-[#0f5c5c] disabled:opacity-60 transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending reset link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

