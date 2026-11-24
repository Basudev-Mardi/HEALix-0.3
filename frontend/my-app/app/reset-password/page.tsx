'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { patientApiFetch } from '@/lib/patient-auth';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const res = await patientApiFetch<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });

    if (res.error || !res.data) {
      setError(res.error || 'Could not reset password.');
    } else {
      setSuccess(res.data.message);
    }
    setSubmitting(false);
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="space-y-3 mb-8">
        <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40]">
          Security Reset
        </p>
        <h1 className="font-editorial text-4xl text-[#242A28]">Set a new password</h1>
        <p className="text-sm text-[#4A5350]">
          Choose a strong password of at least 8 characters for your Healix patient portal.
        </p>
      </div>

      <div className="rounded-2xl border border-[#E5E8E6] bg-white p-7 sm:p-9">
        {success ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#174C40] shrink-0 mt-0.5" />
              <p className="text-sm text-[#242A28]">{success}</p>
            </div>
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#242A28] text-white text-sm font-medium hover:bg-[#174C40] transition-colors"
            >
              Sign In Now
              <ArrowRight className="h-4 w-4" />
            </Link>
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
              <label htmlFor="reset-token" className="block text-xs font-medium text-[#242A28] mb-1.5">
                Reset Token
              </label>
              <input
                id="reset-token"
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your reset token"
                className="w-full px-4 py-3 rounded-xl bg-[#FAFAF7] border border-[#E5E8E6] font-mono text-xs text-[#242A28] focus:outline-none focus:border-[#174C40]"
              />
            </div>

            <div>
              <label htmlFor="reset-pass" className="block text-xs font-medium text-[#242A28] mb-1.5">
                New Password
              </label>
              <input
                id="reset-pass"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-4 py-3 rounded-xl bg-[#FAFAF7] border border-[#E5E8E6] text-sm text-[#242A28] focus:outline-none focus:border-[#174C40]"
              />
            </div>

            <div>
              <label htmlFor="reset-confirm" className="block text-xs font-medium text-[#242A28] mb-1.5">
                Confirm New Password
              </label>
              <input
                id="reset-confirm"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-4 py-3 rounded-xl bg-[#FAFAF7] border border-[#E5E8E6] text-sm text-[#242A28] focus:outline-none focus:border-[#174C40]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#242A28] text-white text-sm font-medium hover:bg-[#174C40] disabled:opacity-60 transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <section className="container-editorial py-16 lg:py-20">
      <Suspense
        fallback={
          <div className="max-w-md mx-auto rounded-2xl border border-[#E5E8E6] bg-white p-10 text-sm text-[#77817C]">
            Loading password reset form...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </section>
  );
}

