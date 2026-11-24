'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { ArrowRight, Check, Eye, EyeOff, Loader2, Lock, ShieldCheck, UserCheck } from 'lucide-react';
import { patientApiFetch, saveAuthSession, type PatientUser } from '@/lib/patient-auth';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/patient/dashboard';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consentTerms, setConsentTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both password entries.');
      return;
    }

    if (!consentTerms) {
      setError('You must consent to the Privacy Policy, Terms & Conditions, and Patient Rights to create an account.');
      return;
    }

    setSubmitting(true);

    const res = await patientApiFetch<{ token: string; patient: PatientUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        full_name: fullName,
        email,
        phone,
        date_of_birth: dob || null,
        gender,
        address,
        password,
        confirm_password: confirmPassword,
        consent_privacy_terms: consentTerms,
      }),
    });

    if (res.error || !res.data) {
      setError(res.error || 'Unable to register account.');
      setSubmitting(false);
      return;
    }

    saveAuthSession(res.data.token, res.data.patient);
    router.push(nextPath);
  }

  const loginLink = `/login${nextPath !== '/patient/dashboard' ? `?next=${encodeURIComponent(nextPath)}` : ''}`;

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center space-y-3 mb-10">
        <p className="text-xs font-mono uppercase tracking-[0.16em] text-[#0f5c5c]">
          Patient Registration
        </p>
        <h1 className="font-editorial text-4xl sm:text-5xl text-[#14181a]">
          Create your patient account
        </h1>
        <p className="text-sm text-[#4b555b] max-w-md mx-auto">
          Securely access your electronic health records, diagnostic reports, physician prescriptions, and appointments.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-[#e6e4dd] bg-white p-7 sm:p-9 space-y-5 shadow-sm"
      >
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-800">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#14181a] mb-1.5">
            Full Legal Name <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g., Jonathan Mercer"
            className="w-full px-4 py-2.5 rounded-xl border border-[#e6e4dd] bg-[#faf9f6] text-xs text-[#14181a] focus:bg-white focus:outline-none focus:border-[#0f5c5c]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#14181a] mb-1.5">
              Email Address <span className="text-rose-600">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jonathan@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-[#e6e4dd] bg-[#faf9f6] text-xs text-[#14181a] focus:bg-white focus:outline-none focus:border-[#0f5c5c]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14181a] mb-1.5">
              Mobile Phone Number <span className="text-rose-600">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 019-2834"
              className="w-full px-4 py-2.5 rounded-xl border border-[#e6e4dd] bg-[#faf9f6] text-xs text-[#14181a] focus:bg-white focus:outline-none focus:border-[#0f5c5c]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#14181a] mb-1.5">
              Date of Birth
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#e6e4dd] bg-[#faf9f6] text-xs text-[#14181a] focus:bg-white focus:outline-none focus:border-[#0f5c5c]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14181a] mb-1.5">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#e6e4dd] bg-[#faf9f6] text-xs text-[#14181a] focus:bg-white focus:outline-none focus:border-[#0f5c5c]"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-Binary">Non-Binary</option>
              <option value="Other">Other / Prefer not to say</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#14181a] mb-1.5">
            Residential Street Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="124 Commonwealth Ave, Apt 4B, Boston, MA"
            className="w-full px-4 py-2.5 rounded-xl border border-[#e6e4dd] bg-[#faf9f6] text-xs text-[#14181a] focus:bg-white focus:outline-none focus:border-[#0f5c5c]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#14181a] mb-1.5">
              Password <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-[#e6e4dd] bg-[#faf9f6] text-xs text-[#14181a] focus:bg-white focus:outline-none focus:border-[#0f5c5c]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#768086] hover:text-[#14181a]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14181a] mb-1.5">
              Confirm Password <span className="text-rose-600">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full px-4 py-2.5 rounded-xl border border-[#e6e4dd] bg-[#faf9f6] text-xs text-[#14181a] focus:bg-white focus:outline-none focus:border-[#0f5c5c]"
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={consentTerms}
              onChange={(e) => setConsentTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[#e6e4dd] text-[#0f5c5c] focus:ring-[#0f5c5c]"
            />
            <span className="text-xs text-[#4b555b] leading-relaxed">
              I consent to the Healix{' '}
              <Link href="/privacy-policy" className="text-[#0f5c5c] underline">
                Privacy Policy
              </Link>
              ,{' '}
              <Link href="/terms" className="text-[#0f5c5c] underline">
                Terms &amp; Conditions
              </Link>
              , and acknowledge{' '}
              <Link href="/patient-rights" className="text-[#0f5c5c] underline">
                Patient Rights &amp; Responsibilities
              </Link>
              . I understand my Medical Record Number (MRN) is assigned by authorized hospital systems.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#14181a] text-white text-xs font-medium hover:bg-[#0f5c5c] transition-colors disabled:opacity-50 mt-4"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Registering Patient Account...
            </>
          ) : (
            <>
              Create Patient Account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="pt-4 border-t border-[#e6e4dd] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#768086]">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#0f5c5c]" />
            Server-assigned MRN &amp; HIPAA security
          </span>
          <p>
            Already registered?{' '}
            <Link href={loginLink} className="text-[#0f5c5c] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <section className="container-editorial py-16 lg:py-20">
      <Suspense
        fallback={
          <div className="max-w-xl mx-auto rounded-2xl border border-[#e6e4dd] bg-white p-10 text-sm text-[#768086]">
            Loading registration form...
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </section>
  );
}
