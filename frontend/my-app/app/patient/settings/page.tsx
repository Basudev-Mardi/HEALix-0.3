'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, Loader2, Save, Shield } from 'lucide-react';
import { patientApiFetch } from '@/lib/patient-auth';

interface SettingsState {
  notify_email: boolean;
  notify_sms: boolean;
  notify_lab_results: boolean;
  notify_reminders: boolean;
  two_factor_enabled: boolean;
}

export default function AccountSettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({
    notify_email: true,
    notify_sms: true,
    notify_lab_results: true,
    notify_reminders: true,
    two_factor_enabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPass, setSavingPass] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');

  useEffect(() => {
    patientApiFetch<SettingsState>('/patient/settings').then((res) => {
      if (res.data) setSettings(res.data);
      setLoading(false);
    });
  }, []);

  async function savePreferences(e: React.FormEvent) {
    e.preventDefault();
    setSavingPrefs(true);
    setPrefsSaved('');
    const res = await patientApiFetch<SettingsState>('/patient/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
    if (res.data) {
      setSettings(res.data);
      setPrefsSaved('Preferences updated.');
    }
    setSavingPrefs(false);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPass(true);
    setPassMsg('');
    setPassError('');

    const res = await patientApiFetch<{ message: string }>('/patient/settings/password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    if (res.error || !res.data) {
      setPassError(res.error || 'Could not update password.');
    } else {
      setPassMsg(res.data.message);
      setCurrentPassword('');
      setNewPassword('');
    }
    setSavingPass(false);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 text-sm text-[#768086]">
        Loading account settings...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c]">
          Preferences &amp; Security
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl text-[#14181a] mt-1">
          Account Settings
        </h1>
      </div>

      {/* Notification & Security Toggles */}
      <form
        onSubmit={savePreferences}
        className="rounded-2xl border border-[#e6e4dd] bg-white p-7 space-y-6"
      >
        <div className="flex items-center gap-2.5">
          <Shield className="h-4 w-4 text-[#0f5c5c]" />
          <h2 className="text-lg font-medium text-[#14181a]">Communications &amp; Privacy</h2>
        </div>

        {prefsSaved && (
          <div className="rounded-xl border border-[#cde4de] bg-[#edf5f4] px-4 py-3 text-xs text-[#0f5c5c] flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {prefsSaved}
          </div>
        )}

        <div className="divide-y divide-[#e6e4dd]">
          {(
            [
              {
                key: 'notify_email',
                title: 'Email Notifications',
                desc: 'Receive booking confirmations, statements, and portal notices by email.',
              },
              {
                key: 'notify_sms',
                title: 'SMS Text Alerts',
                desc: 'Get timely SMS reminders 24 hours before scheduled consultations.',
              },
              {
                key: 'notify_lab_results',
                title: 'Instant Lab & Imaging Releases',
                desc: 'Alert me as soon as a physician signs off on laboratory or radiology reports.',
              },
              {
                key: 'notify_reminders',
                title: 'Preventive Care Reminders',
                desc: 'Annual screening and prescription refill reminders.',
              },
              {
                key: 'two_factor_enabled',
                title: 'Two-Factor Verification',
                desc: 'Require a verification step when signing in from a new browser.',
              },
            ] as const
          ).map((item) => (
            <label
              key={item.key}
              className="py-4 flex items-center justify-between gap-4 cursor-pointer"
            >
              <div>
                <p className="text-sm font-medium text-[#14181a]">{item.title}</p>
                <p className="text-xs text-[#768086] mt-0.5">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={settings[item.key]}
                onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                className="h-4 w-4 accent-[#0f5c5c] shrink-0"
              />
            </label>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={savingPrefs}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#14181a] text-white text-xs font-medium hover:bg-[#0f5c5c] disabled:opacity-60 transition-colors"
          >
            {savingPrefs ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save Preferences
          </button>
        </div>
      </form>

      {/* Change Password */}
      <form
        onSubmit={changePassword}
        className="rounded-2xl border border-[#e6e4dd] bg-white p-7 space-y-5"
      >
        <div className="flex items-center gap-2.5">
          <KeyRound className="h-4 w-4 text-[#0f5c5c]" />
          <h2 className="text-lg font-medium text-[#14181a]">Change Password</h2>
        </div>

        {passError && (
          <div className="rounded-xl border border-[#f0d5d5] bg-[#fef2f2] px-4 py-3 text-xs text-[#b91c1c]">
            {passError}
          </div>
        )}
        {passMsg && (
          <div className="rounded-xl border border-[#cde4de] bg-[#edf5f4] px-4 py-3 text-xs text-[#0f5c5c] flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {passMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cur-pass" className="block text-xs font-medium text-[#14181a] mb-1.5">
              Current Password
            </label>
            <input
              id="cur-pass"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm"
            />
          </div>

          <div>
            <label htmlFor="new-pass" className="block text-xs font-medium text-[#14181a] mb-1.5">
              New Password (min 8 characters)
            </label>
            <input
              id="new-pass"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingPass}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#14181a] text-[#14181a] text-xs font-medium hover:bg-[#14181a] hover:text-white disabled:opacity-60 transition-colors"
          >
            {savingPass ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Update Password
          </button>
        </div>
      </form>
    </div>
  );
}
