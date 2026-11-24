'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Calendar,
  CheckCheck,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquare,
  Shield,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { patientApiFetch, type NotificationItem } from '@/lib/patient-auth';

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simulationNotice, setSimulationNotice] = useState<string | null>(null);

  const fetchNotifications = () => {
    patientApiFetch<NotificationItem[]>('/patient/notifications').then((res) => {
      if (res.data) setItems(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function markOneRead(id: number) {
    await patientApiFetch(`/patient/notifications/${id}/read`, { method: 'PATCH' });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function markAllRead() {
    await patientApiFetch('/patient/notifications/read-all', { method: 'PATCH' });
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function handleSimulateReminder() {
    setSimulating(true);
    setSimulationNotice(null);
    const res = await patientApiFetch<{
      data: any;
      message: string;
    }>('/patient/notifications/simulate-reminder', {
      method: 'POST',
    });

    if (res.data) {
      setSimulationNotice(
        'Approaching appointment reminder (24h prior) dispatched across Email, SMS, WhatsApp, and In-Portal.'
      );
      fetchNotifications();
    }
    setSimulating(false);
  }

  const unreadCount = items.filter((n) => !n.is_read).length;

  const filteredItems = useMemo(() => {
    return items.filter((n) => {
      if (selectedFilter === 'All') return true;
      if (selectedFilter === 'Unread') return !n.is_read;
      if (selectedFilter === 'Appointments')
        return n.category.toLowerCase().includes('appointment');
      if (selectedFilter === 'Clinical Reports')
        return (
          n.category.toLowerCase().includes('report') ||
          n.category.toLowerCase().includes('lab') ||
          n.category.toLowerCase().includes('radiology')
        );
      if (selectedFilter === 'Security')
        return (
          n.category.toLowerCase().includes('security') ||
          n.category.toLowerCase().includes('account')
        );
      return true;
    });
  }, [items, selectedFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c]">
            Multi-Channel Alerts
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#14181a] mt-1">
            Notifications &amp; Alerts
          </h1>
          <p className="text-xs text-[#768086] mt-1">
            Real-time delivery status across In-Portal, Email, SMS, and WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={simulating}
            onClick={handleSimulateReminder}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-teal-300 bg-teal-50 text-xs font-semibold text-teal-900 hover:bg-teal-100 disabled:opacity-60 transition-colors shadow-xs"
          >
            {simulating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-[#0f5c5c]" />
            )}
            Simulate 24h Reminder
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#d5d2c9] bg-white text-xs font-medium text-[#14181a] hover:border-[#14181a] transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5 text-[#0f5c5c]" />
              Mark all read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Simulation Feedback Alert */}
      {simulationNotice && (
        <div className="rounded-2xl border border-teal-200 bg-teal-50/80 p-4 text-xs text-teal-900 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
            <span>{simulationNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSimulationNotice(null)}
            className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Notification Events Matrix Banner */}
      <div className="rounded-2xl border border-[#e6e4dd] bg-[#faf9f6] p-4.5 text-xs text-[#4b555b] space-y-2 shadow-xs">
        <p className="font-semibold text-[#14181a] flex items-center gap-1.5 text-[11px] uppercase font-mono tracking-wider">
          <Shield className="h-3.5 w-3.5 text-[#0f5c5c]" />
          Supported Notification Events &amp; Delivery Matrix
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div className="rounded-lg bg-white p-2 border border-[#e6e4dd]">
            <span className="font-semibold text-[#14181a] block">Registration</span>
            <span className="text-[#768086]">Account verification</span>
          </div>
          <div className="rounded-lg bg-white p-2 border border-[#e6e4dd]">
            <span className="font-semibold text-[#14181a] block">Appointment Booked</span>
            <span className="text-[#768086]">Booking confirmation</span>
          </div>
          <div className="rounded-lg bg-white p-2 border border-[#e6e4dd]">
            <span className="font-semibold text-[#14181a] block">Confirmed / Rescheduled</span>
            <span className="text-[#768086]">Schedule &amp; room updates</span>
          </div>
          <div className="rounded-lg bg-white p-2 border border-[#e6e4dd]">
            <span className="font-semibold text-[#14181a] block">Cancelled / Reminder</span>
            <span className="text-[#768086]">Cancellation &amp; 24h alerts</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(['All', 'Unread', 'Appointments', 'Clinical Reports', 'Security'] as const).map(
          (tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedFilter(tab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedFilter === tab
                  ? 'bg-[#14181a] text-white'
                  : 'bg-white border border-[#e6e4dd] text-[#4b555b] hover:border-[#14181a]'
              }`}
            >
              {tab} {tab === 'Unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
            </button>
          )
        )}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 text-sm text-[#768086]">
          Loading notifications and channel logs...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 text-center space-y-2">
          <p className="text-base font-medium text-[#14181a]">No notifications in this filter.</p>
          <p className="text-xs text-[#768086]">New appointment updates and report releases will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((n) => {
            const channels = n.channels || ['in_app', 'email', 'sms'];
            const hasEmail = channels.includes('email');
            const hasSms = channels.includes('sms');
            const hasWhatsapp = channels.includes('whatsapp');
            const hasInApp = channels.includes('in_app');

            return (
              <article
                key={n.id}
                className={`rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all ${
                  n.is_read
                    ? 'border-[#e6e4dd] bg-white'
                    : 'border-[#cde4de] bg-[#edf5f4]/40 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                      n.is_read
                        ? 'bg-[#f2f1ec] text-[#768086]'
                        : 'bg-[#0f5c5c] text-white shadow-xs'
                    }`}
                  >
                    <Bell className="h-4 w-4" />
                  </span>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#0f5c5c] font-semibold">
                        {n.category}
                      </span>

                      {/* Multi-Channel Delivery Badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {hasInApp && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-50 text-teal-800 border border-teal-200">
                            In-Portal
                          </span>
                        )}
                        {hasEmail && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                            <Mail className="h-2.5 w-2.5" />
                            Email
                          </span>
                        )}
                        {hasSms && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200">
                            <Smartphone className="h-2.5 w-2.5" />
                            SMS
                          </span>
                        )}
                        {hasWhatsapp && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <MessageCircle className="h-2.5 w-2.5" />
                            WhatsApp
                          </span>
                        )}
                      </div>
                    </div>

                    <h2 className="text-base font-semibold text-[#14181a]">{n.title}</h2>
                    <p className="text-xs sm:text-sm text-[#4b555b] leading-relaxed">{n.message}</p>
                    <span className="text-[11px] font-mono text-[#768086] block pt-0.5">
                      {n.created_at ? new Date(n.created_at).toLocaleString() : 'Just now'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                  {n.action_href && (
                    <Link
                      href={n.action_href}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#14181a] text-white text-xs font-semibold hover:bg-[#0f5c5c] transition-colors"
                    >
                      View
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  )}
                  {!n.is_read && (
                    <button
                      type="button"
                      onClick={() => markOneRead(n.id)}
                      className="text-xs text-[#768086] hover:text-[#14181a] px-2 py-1 rounded-md hover:bg-[#faf9f6]"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
