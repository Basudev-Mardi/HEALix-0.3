'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Save } from 'lucide-react';
import {
  getAuthToken,
  patientApiFetch,
  saveAuthSession,
  type PatientUser,
} from '@/lib/patient-auth';

export default function PatientProfilePage() {
  const [profile, setProfile] = useState<PatientUser | null>(null);
  const [allergiesText, setAllergiesText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    patientApiFetch<PatientUser>('/patient/profile').then((res) => {
      if (res.data) {
        setProfile(res.data);
        setAllergiesText((res.data.allergies || []).join(', '));
      }
      setLoading(false);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSavedMsg('');
    setError('');

    const allergies = allergiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await patientApiFetch<PatientUser>('/patient/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        full_name: profile.full_name,
        phone: profile.phone,
        date_of_birth: profile.date_of_birth || null,
        gender: profile.gender,
        blood_group: profile.blood_group,
        address: profile.address,
        emergency_contact_name: profile.emergency_contact_name,
        emergency_contact_phone: profile.emergency_contact_phone,
        insurance_provider: profile.insurance_provider,
        insurance_policy_no: profile.insurance_policy_no,
        allergies,
      }),
    });

    if (res.error || !res.data) {
      setError(res.error || 'Could not update profile.');
    } else {
      setProfile(res.data);
      const token = getAuthToken();
      if (token) saveAuthSession(token, res.data);
      setSavedMsg('Profile changes saved to your Healix medical record.');
    }
    setSaving(false);
  }

  if (loading || !profile) {
    return (
      <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 text-sm text-[#768086]">
        Loading patient profile...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c]">
          Demographics &amp; Coverage · {profile.mrn}
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl text-[#14181a] mt-1">My Profile</h1>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-[#e6e4dd] bg-white p-7 sm:p-9 space-y-6"
      >
        {error && (
          <div className="rounded-xl border border-[#f0d5d5] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
            {error}
          </div>
        )}
        {savedMsg && (
          <div className="rounded-xl border border-[#cde4de] bg-[#edf5f4] px-4 py-3 text-sm text-[#0f5c5c] flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {savedMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-[#14181a] mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#14181a] mb-1.5">Email Address</label>
            <input
              type="email"
              disabled
              value={profile.email}
              className="w-full px-4 py-2.5 rounded-xl bg-[#f2f1ec] border border-[#e6e4dd] text-sm text-[#768086]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#14181a] mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#14181a] mb-1.5">Date of Birth</label>
            <input
              type="date"
              value={profile.date_of_birth || ''}
              onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#14181a] mb-1.5">Gender</label>
            <select
              value={profile.gender}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm"
            >
              <option value="">Not specified</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Non-binary">Non-binary</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#14181a] mb-1.5">Blood Group</label>
            <input
              type="text"
              value={profile.blood_group}
              onChange={(e) => setProfile({ ...profile, blood_group: e.target.value })}
              placeholder="e.g., O+, A-, B+"
              className="w-full px-4 py-2.5 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm font-mono"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-[#14181a] mb-1.5">Home Address</label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#14181a] mb-1.5">
              Emergency Contact Name
            </label>
            <input
              type="text"
              value={profile.emergency_contact_name}
              onChange={(e) => setProfile({ ...profile, emergency_contact_name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#14181a] mb-1.5">
              Emergency Contact Phone
            </label>
            <input
              type="tel"
              value={profile.emergency_contact_phone}
              onChange={(e) => setProfile({ ...profile, emergency_contact_phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#14181a] mb-1.5">
              Insurance Provider
            </label>
            <input
              type="text"
              value={profile.insurance_provider}
              onChange={(e) => setProfile({ ...profile, insurance_provider: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#14181a] mb-1.5">
              Policy / Member ID
            </label>
            <input
              type="text"
              value={profile.insurance_policy_no}
              onChange={(e) => setProfile({ ...profile, insurance_policy_no: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm font-mono"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-[#14181a] mb-1.5">
              Documented Allergies (comma-separated)
            </label>
            <input
              type="text"
              value={allergiesText}
              onChange={(e) => setAllergiesText(e.target.value)}
              placeholder="e.g., Penicillin, Latex, Peanuts"
              className="w-full px-4 py-2.5 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#e6e4dd] flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#14181a] text-white text-xs font-medium hover:bg-[#0f5c5c] disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}

