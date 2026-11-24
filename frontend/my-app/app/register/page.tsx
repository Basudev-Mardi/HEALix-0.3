'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Check, Eye, EyeOff, Loader2, Lock, ShieldCheck, UserCheck } from 'lucide-react';
import { patientApiFetch, saveAuthSession, type PatientUser } from '@/lib/patient-auth';

export default function RegisterPage() {
  const router = useRouter();
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
    router.push('/patient/dashboard');
  }

  return (
    <section className="container-editorial py-16 lg:py-20">
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
            <div
              role="alert"
              className="rounded-xl border border-[#f0d5d5] bg-[#fef2f2] px-4 py-3.5 text-xs sm:text-sm text-[#b91c1c] leading-relaxed"
            >
              {error}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label htmlFor="reg-name" className="block text-xs font-semibold text-[#14181a] mb-1.5">
              Full Legal Name <span className="text-[#b91c1c]">*</span>
            </label>
            <input
              id="reg-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g., Eleanor Sterling"
              className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-[#14181a] mb-1.5">
                Email Address <span className="text-[#b91c1c]">*</span>
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
              />
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-xs font-semibold text-[#14181a] mb-1.5">
                Mobile Number <span className="text-[#b91c1c]">*</span>
              </label>
              <input
                id="reg-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
              />
            </div>
          </div>

          {/* Date of Birth & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-dob" className="block text-xs font-semibold text-[#14181a] mb-1.5">
                Date of Birth <span className="text-[#b91c1c]">*</span>
              </label>
              <input
                id="reg-dob"
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
              />
            </div>

            <div>
              <label htmlFor="reg-gender" className="block text-xs font-semibold text-[#14181a] mb-1.5">
                Gender (for clinical records)
              </label>
              <select
                id="reg-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
              >
                <option value="">Select gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Residential Address */}
          <div>
            <label htmlFor="reg-address" className="block text-xs font-semibold text-[#14181a] mb-1.5">
              Residential Address
            </label>
            <input
              id="reg-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address, Apt, City, State, Postal Code"
              className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
            />
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="reg-password" className="block text-xs font-semibold text-[#14181a]">
                  Password <span className="text-[#b91c1c]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-[#768086] hover:text-[#14181a] flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
              />
            </div>

            <div>
              <label htmlFor="reg-confirm-password" className="block text-xs font-semibold text-[#14181a] mb-1.5">
                Confirm Password <span className="text-[#b91c1c]">*</span>
              </label>
              <input
                id="reg-confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className={`w-full px-4 py-3 rounded-xl bg-[#faf9f6] border text-sm text-[#14181a] focus:outline-none ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-[#b91c1c] focus:border-[#b91c1c]'
                    : 'border-[#e6e4dd] focus:border-[#0f5c5c]'
                }`}
              />
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={consentTerms}
                onChange={(e) => setConsentTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#e6e4dd] text-[#0f5c5c] focus:ring-[#0f5c5c]"
              />
              <span className="text-xs text-[#4b555b] leading-relaxed">
                I agree to the hospital terms and consent to the collection and handling of my healthcare information in accordance with the{' '}
                <Link href="/privacy-policy" className="text-[#0f5c5c] font-medium underline" target="_blank">
                  Privacy Policy
                </Link>
                ,{' '}
                <Link href="/terms" className="text-[#0f5c5c] font-medium underline" target="_blank">
                  Terms &amp; Conditions
                </Link>
                , and{' '}
                <Link href="/patient-rights" className="text-[#0f5c5c] font-medium underline" target="_blank">
                  Patient Rights
                </Link>
                . <span className="text-[#b91c1c]">*</span>
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#14181a] text-white text-xs font-semibold hover:bg-[#0f5c5c] disabled:opacity-60 transition-colors shadow-sm"
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
              <Link href="/login" className="text-[#0f5c5c] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
