'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { patientApiFetch, saveAuthSession, type PatientUser } from '@/lib/patient-auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const nextPath =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
      ? nextParam
      : '/patient/dashboard';

  // Login Mode: 'password' vs 'otp'
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');

  // Password Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // OTP Login State
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpNotice, setOtpNotice] = useState<{ message: string; demo_otp?: string } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Handle Standard Password Login
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await patientApiFetch<{ token: string; patient: PatientUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier,
        password,
      }),
    });

    if (res.error || !res.data) {
      setError(res.error || 'Invalid credentials.');
      setSubmitting(false);
      return;
    }

    saveAuthSession(res.data.token, res.data.patient);
    router.push(nextPath);
  }

  // Handle Send OTP
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await patientApiFetch<{ message: string; demo_otp?: string; destination?: string }>(
      '/auth/otp/send',
      {
        method: 'POST',
        body: JSON.stringify({ identifier: otpIdentifier }),
      }
    );

    if (res.error || !res.data) {
      setError(res.error || 'Could not send verification code.');
    } else {
      setOtpSent(true);
      setOtpNotice(res.data);
      if (res.data.demo_otp) {
        setOtpCode(res.data.demo_otp);
      }
    }
    setSubmitting(false);
  }

  // Handle Verify OTP & Login
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await patientApiFetch<{ token: string; patient: PatientUser }>(
      '/auth/otp/verify',
      {
        method: 'POST',
        body: JSON.stringify({
          identifier: otpIdentifier,
          otp_code: otpCode,
        }),
      }
    );

    if (res.error || !res.data) {
      setError(res.error || 'Invalid or expired OTP code.');
      setSubmitting(false);
      return;
    }

    saveAuthSession(res.data.token, res.data.patient);
    router.push(nextPath);
  }

  function fillDemo() {
    setIdentifier('clara.vance@example.com');
    setPassword('Healix2026!');
    setError('');
  }

  function fillDemoOtp() {
    setOtpIdentifier('clara.vance@example.com');
    setError('');
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center space-y-3 mb-8">
        <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#174C40]">
          Patient Portal
        </p>
        <h1 className="font-editorial text-4xl sm:text-5xl text-[#242A28]">Sign in to Healix</h1>
        <p className="text-xs sm:text-sm text-[#4A5350]">
          Manage appointments, view laboratory &amp; radiology reports, and consult prescriptions.
        </p>
      </div>

      <div className="rounded-2xl border border-[#E5E8E6] bg-white p-7 sm:p-9 space-y-6 shadow-sm">
        {/* Login Method Toggle */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#FAFAF7] border border-[#E5E8E6] text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setLoginMode('password');
              setError('');
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              loginMode === 'password'
                ? 'bg-white text-[#242A28] shadow-sm font-semibold'
                : 'text-[#77817C] hover:text-[#242A28]'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            Password
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode('otp');
              setError('');
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              loginMode === 'otp'
                ? 'bg-white text-[#242A28] shadow-sm font-semibold'
                : 'text-[#77817C] hover:text-[#242A28]'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            One-Time Passcode
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-[#f0d5d5] bg-[#fef2f2] px-4 py-3 text-xs sm:text-sm text-[#b91c1c] leading-relaxed"
          >
            {error}
          </div>
        )}

        {/* Password Login Form */}
        {loginMode === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-identifier" className="block text-xs font-semibold text-[#242A28] mb-1.5">
                Email Address or Mobile Number
              </label>
              <input
                id="login-identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="email@example.com or mobile number"
                className="w-full px-4 py-3 rounded-xl bg-[#FAFAF7] border border-[#E5E8E6] text-sm text-[#242A28] focus:outline-none focus:border-[#174C40]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-semibold text-[#242A28]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#174C40] hover:underline font-medium"
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
                className="w-full px-4 py-3 rounded-xl bg-[#FAFAF7] border border-[#E5E8E6] text-sm text-[#242A28] focus:outline-none focus:border-[#174C40]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#242A28] text-white text-xs font-semibold hover:bg-[#174C40] disabled:opacity-60 transition-colors shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                <>
                  Sign In with Password
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Demo Account Helper */}
            <div className="rounded-xl border border-[#E5E8E6] bg-[#FAFAF7] p-3.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#174C40] font-medium">
                  <Sparkles className="h-3.5 w-3.5" />
                  Demo Patient Account
                </span>
                <button
                  type="button"
                  onClick={fillDemo}
                  className="text-xs font-semibold text-[#242A28] underline hover:text-[#174C40]"
                >
                  Auto-fill
                </button>
              </div>
              <p className="text-xs font-mono text-[#4A5350]">
                clara.vance@example.com · Healix2026!
              </p>
            </div>
          </form>
        )}

        {/* OTP Login Form */}
        {loginMode === 'otp' && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="otp-ident" className="block text-xs font-semibold text-[#242A28] mb-1.5">
                    Registered Email or Mobile Number
                  </label>
                  <input
                    id="otp-ident"
                    type="text"
                    required
                    value={otpIdentifier}
                    onChange={(e) => setOtpIdentifier(e.target.value)}
                    placeholder="clara.vance@example.com or +1 (617) 555-0199"
                    className="w-full px-4 py-3 rounded-xl bg-[#FAFAF7] border border-[#E5E8E6] text-sm text-[#242A28] focus:outline-none focus:border-[#174C40]"
                  />
                  <p className="text-[11px] text-[#77817C] mt-1.5">
                    We will send a 6-digit one-time security code to your registered contact.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#242A28] text-white text-xs font-semibold hover:bg-[#174C40] disabled:opacity-60 transition-colors shadow-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Dispatching Code...
                    </>
                  ) : (
                    <>
                      Send One-Time Passcode
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="rounded-xl border border-[#E5E8E6] bg-[#FAFAF7] p-3.5 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#174C40] uppercase">Demo Account</span>
                  <button
                    type="button"
                    onClick={fillDemoOtp}
                    className="text-xs font-semibold text-[#242A28] underline hover:text-[#174C40]"
                  >
                    Auto-fill clara.vance@example.com
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#E6EFE9] border border-[#cde4de] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#174C40]">
                    <CheckCircle2 className="h-4 w-4" />
                    Code Dispatched
                  </div>
                  <p className="text-xs text-[#242A28]">{otpNotice?.message}</p>
                  {otpNotice?.demo_otp && (
                    <p className="text-xs font-mono text-[#174C40] pt-1">
                      <strong>Demo Code:</strong> {otpNotice.demo_otp}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="otp-input" className="block text-xs font-semibold text-[#242A28] mb-1.5">
                    Enter 6-Digit Passcode
                  </label>
                  <input
                    id="otp-input"
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-4 py-3 rounded-xl bg-[#FAFAF7] border border-[#E5E8E6] text-center font-mono text-lg tracking-widest text-[#242A28] focus:outline-none focus:border-[#174C40]"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                    }}
                    className="text-xs text-[#77817C] hover:text-[#242A28] underline"
                  >
                    Resend to different contact
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || otpCode.length < 6}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#174C40] text-white text-xs font-semibold hover:bg-[#0c4a4a] disabled:opacity-60 transition-colors shadow-sm"
                  >
                    {submitting ? 'Verifying...' : 'Verify & Sign In'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <p className="pt-2 border-t border-[#E5E8E6] text-center text-xs text-[#77817C]">
          New patient to Healix Medical Center?{' '}
          <Link href="/register" className="text-[#174C40] font-semibold hover:underline">
            Register new patient account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <section className="container-editorial py-16 lg:py-20">
      <Suspense
        fallback={
          <div className="max-w-md mx-auto rounded-2xl border border-[#E5E8E6] bg-white p-10 text-sm text-[#77817C]">
            Loading sign-in form...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </section>
  );
}
