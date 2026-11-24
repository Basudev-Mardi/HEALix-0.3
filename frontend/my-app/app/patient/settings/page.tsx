'use client';

import { useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  MessageSquare,
  Save,
  Shield,
  Smartphone,
} from 'lucide-react';
import { patientApiFetch } from '@/lib/patient-auth';

interface SettingsState {
  notify_email: boolean;
  notify_sms: boolean;
  notify_whatsapp?: boolean;
  notify_lab_results: boolean;
  notify_reminders: boolean;
  two_factor_enabled: boolean;
}

export default function AccountSettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({
    notify_email: true,
    notify_sms: true,
    notify_whatsapp: false,
    notify_lab_results: true,
    notify_reminders: true,
    two_factor_enabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      setPrefsSaved('Notification channels and communication preferences saved successfully.');
    }
    setSavingPrefs(false);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPass(true);
    setPassMsg('');
    setPassError('');

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      setSavingPass(false);
      return;
    }

    const res = await patientApiFetch<{ message: string }>('/patient/settings/password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    if (res.error || !res.data) {
      setPassError(res.error || 'Could not update password. Please verify current credentials.');
    } else {
      setPassMsg(
        'Password updated successfully. A security notification has been dispatched to your email and phone.'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
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
        <p className="text-xs text-[#768086] mt-1">
          Configure appointment notifications, multi-channel alerts, and security credentials.
        </p>
      </div>

      {/* Recommended Notification Channels Disclosure */}
      <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-5 text-xs text-teal-950 space-y-2 shadow-sm">
        <p className="font-semibold text-teal-900 flex items-center gap-2">
          <Bell className="h-4 w-4 text-[#0f5c5c]" />
          Workflow F: Multi-Channel Appointment Notification Infrastructure
        </p>
        <p className="text-[11px] text-teal-900/90 leading-relaxed">
          Healix dispatches real-time notifications across <strong>Email</strong> and <strong>SMS</strong> by default, with <strong>WhatsApp</strong> available as an optional integration. Events covered include account registration, booking confirmations, confirmation updates, rescheduled visits, cancellation notices, 24-hour approaching reminders, diagnostic report releases, and password security alerts.
        </p>
      </div>

      {/* Notification & Security Toggles */}
      <form
        onSubmit={savePreferences}
        className="rounded-2xl border border-[#e6e4dd] bg-white p-7 space-y-6 shadow-sm"
      >
        <div className="flex items-center gap-2.5">
          <Shield className="h-4 w-4 text-[#0f5c5c]" />
          <h2 className="text-lg font-medium text-[#14181a]">Notification Channels &amp; Alerts</h2>
        </div>

        {prefsSaved && (
          <div className="rounded-xl border border-[#cde4de] bg-[#edf5f4] px-4 py-3 text-xs text-[#0f5c5c] flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {prefsSaved}
          </div>
        )}

        <div className="divide-y divide-[#e6e4dd]">
          <label className="py-4 flex items-center justify-between gap-4 cursor-pointer">
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#14181a]">Email Notifications (Recommended)</p>
                <p className="text-xs text-[#768086] mt-0.5">
                  Receive detailed booking confirmations, calendar invites, preparation guides, and clinical report alerts.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.notify_email}
              onChange={(e) => setSettings({ ...settings, notify_email: e.target.checked })}
              className="h-4 w-4 accent-[#0f5c5c] shrink-0"
            />
          </label>

          <label className="py-4 flex items-center justify-between gap-4 cursor-pointer">
            <div className="flex items-start gap-3">
              <Smartphone className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#14181a]">SMS Text Alerts (Recommended)</p>
                <p className="text-xs text-[#768086] mt-0.5">
                  Get high-priority SMS reminders, 6-digit OTP verification codes, and instant cancellation updates.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.notify_sms}
              onChange={(e) => setSettings({ ...settings, notify_sms: e.target.checked })}
              className="h-4 w-4 accent-[#0f5c5c] shrink-0"
            />
          </label>

          <label className="py-4 flex items-center justify-between gap-4 cursor-pointer">
            <div className="flex items-start gap-3">
              <MessageCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[#14181a]">WhatsApp Notifications</p>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 font-semibold">
                    Optional Integration
                  </span>
                </div>
                <p className="text-xs text-[#768086] mt-0.5">
                  Receive encrypted WhatsApp consultation summaries, clinic floor maps, and doctor reschedule updates.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(settings.notify_whatsapp)}
              onChange={(e) => setSettings({ ...settings, notify_whatsapp: e.target.checked })}
              className="h-4 w-4 accent-[#0f5c5c] shrink-0"
            />
          </label>

          <label className="py-4 flex items-center justify-between gap-4 cursor-pointer">
            <div className="flex items-start gap-3">
              <Bell className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#14181a]">Upcoming Appointment Reminders</p>
                <p className="text-xs text-[#768086] mt-0.5">
                  Automated 24-hour and 2-hour reminders before scheduled consultations with clinic check-in instructions.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.notify_reminders}
              onChange={(e) => setSettings({ ...settings, notify_reminders: e.target.checked })}
              className="h-4 w-4 accent-[#0f5c5c] shrink-0"
            />
          </label>

          <label className="py-4 flex items-center justify-between gap-4 cursor-pointer">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#14181a]">Laboratory &amp; Radiology Releases</p>
                <p className="text-xs text-[#768086] mt-0.5">
                  Immediate alerts when an authorized physician finalizes and releases your diagnostic report.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.notify_lab_results}
              onChange={(e) => setSettings({ ...settings, notify_lab_results: e.target.checked })}
              className="h-4 w-4 accent-[#0f5c5c] shrink-0"
            />
          </label>

          <label className="py-4 flex items-center justify-between gap-4 cursor-pointer">
            <div className="flex items-start gap-3">
              <Lock className="h-4 w-4 text-[#0f5c5c] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#14181a]">Two-Factor Authentication (2FA)</p>
                <p className="text-xs text-[#768086] mt-0.5">
                  Require a 6-digit OTP verification code when signing in from an unrecognized device or IP address.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.two_factor_enabled}
              onChange={(e) => setSettings({ ...settings, two_factor_enabled: e.target.checked })}
              className="h-4 w-4 accent-[#0f5c5c] shrink-0"
            />
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={savingPrefs}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#14181a] text-white text-xs font-semibold hover:bg-[#0f5c5c] disabled:opacity-60 transition-colors shadow-sm"
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

      {/* Change Password (Security Notification Trigger) */}
      <form
        onSubmit={changePassword}
        className="rounded-2xl border border-[#e6e4dd] bg-white p-7 space-y-5 shadow-sm"
      >
        <div className="flex items-center gap-2.5">
          <KeyRound className="h-4 w-4 text-[#0f5c5c]" />
          <div>
            <h2 className="text-lg font-medium text-[#14181a]">Security Credentials</h2>
            <p className="text-xs text-[#768086]">Changing your password will dispatch a security alert to your registered contact channels.</p>
          </div>
        </div>

        {passError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
            {passError}
          </div>
        )}
        {passMsg && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {passMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#14181a] mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-xs text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14181a] mb-1.5">
              New Password (min 8 chars)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-xs text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14181a] mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf9f6] border border-[#e6e4dd] text-xs text-[#14181a] focus:outline-none focus:border-[#0f5c5c]"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={savingPass}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#14181a] text-white text-xs font-semibold hover:bg-[#0f5c5c] disabled:opacity-60 transition-colors shadow-sm"
          >
            {savingPass ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Lock className="h-3.5 w-3.5" />
            )}
            Update Password &amp; Dispatch Security Alert
          </button>
        </div>
      </form>
    </div>
  );
}
