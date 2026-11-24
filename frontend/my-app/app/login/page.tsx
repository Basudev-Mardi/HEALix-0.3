'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { patientApiFetch, saveAuthSession, type PatientUser } from '@/lib/patient-auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/patient/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await patientApiFetch<{ token: string; patient: PatientUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.error || !res.data) {
      setError(res.error || 'Invalid credentials.');
      setSubmitting(false);
      return;
    }

    saveAuthSession(res.data.token, res.data.patient);
    router.push(nextPath.startsWith('/patient') ? nextPath : '/patient/dashboard');
  }

  function fillDemo() {
    setEmail('clara.vance@example.com');
    setPassword('Healix2026!');
    setError('');
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center space-y-3 mb-10">
        <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#0f5c5c]">
          Patient Portal
        </p>
        <h1 className="font-editorial text-4xl sm:text-5xl text-[#14181a]">Sign in to Healix</h1>
        <p className="text-sm text-[#4b555b]">
          View your appointments, prescriptions, laboratory &amp; radiology reports, and billing.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-[#e6e4dd] bg-white p-7 sm:p-9 space-y-5"
      >
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-[#f0d5d5] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]"
          >
            {error}
          </div>
        )}

        <div>
          <label htmlFor="login-email" className="block text-xs font-medium text-[#14181a] mb-1.5">
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="clara.vance@example.com"
            className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="block text-xs font-medium text-[#14181a]">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-[#0f5c5c] hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="login-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
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
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        {/* Demo Account Helper */}
        <div className="rounded-xl border border-[#e6e4dd] bg-[#faf9f6] p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#0f5c5c]">
              <Sparkles className="h-3.5 w-3.5" />
              Seeded Demo Account
            </span>
            <button
              type="button"
              onClick={fillDemo}
              className="text-xs font-medium text-[#14181a] underline hover:text-[#0f5c5c]"
            >
              Auto-fill
            </button>
          </div>
          <p className="text-xs font-mono text-[#4b555b]">
            clara.vance@example.com · Healix2026!
          </p>
        </div>

        <p className="pt-2 border-t border-[#e6e4dd] text-center text-xs text-[#768086]">
          New to Healix Medical Center?{' '}
          <Link href="/register" className="text-[#0f5c5c] font-medium hover:underline">
            Create a patient account
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <section className="container-editorial py-16 lg:py-20">
      <Suspense
        fallback={
          <div className="max-w-md mx-auto rounded-2xl border border-[#e6e4dd] bg-white p-10 text-sm text-[#768086]">
            Loading sign-in form...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </section>
  );
}
