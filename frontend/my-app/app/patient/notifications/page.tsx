'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Bell, CheckCheck } from 'lucide-react';
import { patientApiFetch, type NotificationItem } from '@/lib/patient-auth';

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientApiFetch<NotificationItem[]>('/patient/notifications').then((res) => {
      if (res.data) setItems(res.data);
      setLoading(false);
    });
  }, []);

  async function markOneRead(id: number) {
    await patientApiFetch(`/patient/notifications/${id}/read`, { method: 'PATCH' });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function markAllRead() {
    await patientApiFetch('/patient/notifications/read-all', { method: 'PATCH' });
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#0f5c5c]">
            Alerts &amp; Updates
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#14181a] mt-1">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#d5d2c9] bg-white text-xs font-medium text-[#14181a] hover:border-[#14181a]"
          >
            <CheckCheck className="h-3.5 w-3.5 text-[#0f5c5c]" />
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 text-sm text-[#768086]">
          Loading notifications...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[#e6e4dd] bg-white p-10 text-sm text-[#768086]">
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <article
              key={n.id}
              className={`rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${n.is_read
                ? 'border-[#e6e4dd] bg-white'
                : 'border-[#cde4de] bg-[#edf5f4]/40'
                }`}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${n.is_read ? 'bg-[#f2f1ec] text-[#768086]' : 'bg-[#0f5c5c] text-white'
                    }`}
                >
                  <Bell className="h-4 w-4" />
                </span>
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#0f5c5c]">
                    {n.category}
                  </span>
                  <h2 className="text-base font-semibold text-[#14181a]">{n.title}</h2>
                  <p className="text-sm text-[#4b555b]">{n.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {n.action_href && (
                  <Link
                    href={n.action_href}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#0f5c5c] hover:underline"
                  >
                    Open
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                )}
                {!n.is_read && (
                  <button
                    type="button"
                    onClick={() => markOneRead(n.id)}
                    className="text-xs text-[#768086] hover:text-[#14181a]"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

