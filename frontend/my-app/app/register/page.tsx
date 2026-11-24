'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { patientApiFetch, saveAuthSession, type PatientUser } from '@/lib/patient-auth';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await patientApiFetch<{ token: string; patient: PatientUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        full_name: fullName,
        email,
        phone,
        date_of_birth: dob || null,
        gender,
        password,
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
            Patient Account
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#14181a]">
            Create your Healix account
          </h1>
          <p className="text-sm text-[#4b555b]">
            Access lab results, prescriptions, imaging reports, and manage all appointments in one
            private portal.
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
            <label htmlFor="reg-name" className="block text-xs font-medium text-[#14181a] mb-1.5">
              Full Name <span className="text-[#b91c1c]">*</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-email" className="block text-xs font-medium text-[#14181a] mb-1.5">
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
              <label htmlFor="reg-phone" className="block text-xs font-medium text-[#14181a] mb-1.5">
                Phone Number
              </label>
              <input
                id="reg-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (617) 555-0199"
                className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-dob" className="block text-xs font-medium text-[#14181a] mb-1.5">
                Date of Birth
              </label>
              <input
                id="reg-dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
              />
            </div>

            <div>
              <label htmlFor="reg-gender" className="block text-xs font-medium text-[#14181a] mb-1.5">
                Gender
              </label>
              <select
                id="reg-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
              >
                <option value="">Prefer not to say</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-xs font-medium text-[#14181a] mb-1.5">
              Password (minimum 8 characters) <span className="text-[#b91c1c]">*</span>
            </label>
            <input
              id="reg-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
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
                Creating account...
              </>
            ) : (
              <>
                Create Patient Account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <div className="pt-4 border-t border-[#e6e4dd] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#768086]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#0f5c5c]" />
              HIPAA-aligned encrypted portal
            </span>
            <p>
              Already registered?{' '}
              <Link href="/login" className="text-[#0f5c5c] font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}

