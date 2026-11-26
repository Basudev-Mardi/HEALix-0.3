'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Clock,
  Maximize2,
  Minimize2,
  Radio,
  Siren,
  Stethoscope,
  Volume2,
  VolumeX,
  Building2,
  User,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface PublicServingToken {
  token_id: string;
  token_display: string;
  token_number: number;
  status: string;
  called_at: string;
  priority: string;
  department_id: number;
  department_name: string;
  doctor_id: number;
  doctor_name: string;
  room_or_cabin: string;
  masked_patient_name: string;
}

interface PublicUpcomingToken {
  token_id: string;
  token_display: string;
  token_number: number;
  status: string;
  priority: string;
  department_id: number;
  department_name: string;
  doctor_name: string;
  room_or_cabin: string;
  masked_patient_name: string;
  queue_pos: number;
  estimated_wait_mins: number;
}

interface PublicDisplayFeed {
  success: boolean;
  timestamp: string;
  hospital_name: string;
  facility: string;
  now_serving: PublicServingToken[];
  upcoming_queue: PublicUpcomingToken[];
  active_emergency?: {
    alert_type: string;
    location: string;
    severity: string;
    triggered_at: string;
  } | null;
}

const REFRESH_INTERVAL_SECONDS = 5;

export default function OPDQueueDisplayPage() {
  const [data, setData] = useState<PublicDisplayFeed | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // Live Clock updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Public Queue Data
  const fetchQueueFeed = useCallback(async () => {
    try {
      let res: Response;
      try {
        res = await fetch('/api/v1/reception/queue/public-display', {
          cache: 'no-store',
        });
      } catch {
        res = await fetch('http://localhost:5000/api/v1/reception/queue/public-display', {
          cache: 'no-store',
        });
      }

      if (!res.ok) {
        throw new Error(`Feed error HTTP ${res.status}`);
      }

      const json = await res.json();
      setData(json);
      setError(null);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Display feed unreachable');
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling interval
  useEffect(() => {
    fetchQueueFeed();
    const timer = setInterval(fetchQueueFeed, REFRESH_INTERVAL_SECONDS * 1000);
    return () => clearInterval(timer);
  }, [fetchQueueFeed]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-[#0E1513] text-[#F0F5F2] flex flex-col font-sans select-none overflow-x-hidden">
      {/* ============================================================
          TOP BROADCAST BAR & LIVE TELEMETRY
      ============================================================ */}
      <header className="border-b border-[#1E2E2A] bg-[#121E1B]/90 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-[#174C40] border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-serif font-bold text-2xl shadow-lg">
            H
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-white">
                Healix Medical Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse flex items-center gap-1.5">
                <Radio className="h-2.5 w-2.5 text-emerald-400" />
                Live Display
              </span>
            </div>
            <p className="text-xs text-emerald-200/70">
              Central OPD &amp; Specialty Care Consultation Queue
            </p>
          </div>
        </div>

        {/* Live Date, Time & TV Controls */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-wider">
              {currentTime || '--:--:--'}
            </div>
            <div className="text-[11px] font-mono text-emerald-300/60 uppercase">
              {currentDate}
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-[#1E2E2A] pl-4">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Chime sound enabled' : 'Chime muted'}
              className="p-2.5 rounded-xl bg-[#172B26] hover:bg-[#1C362F] border border-[#23423A] text-emerald-300 transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 opacity-60" />}
            </button>
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen TV mode'}
              className="p-2.5 rounded-xl bg-[#172B26] hover:bg-[#1C362F] border border-[#23423A] text-emerald-300 transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================
          ACTIVE EMERGENCY CODE BANNER (IF ACTIVE)
      ============================================================ */}
      {data?.active_emergency && (
        <div className="bg-red-600 text-white px-6 py-3 font-mono font-bold text-sm tracking-wider flex items-center justify-between animate-pulse shadow-xl border-y border-red-400">
          <div className="flex items-center gap-3">
            <Siren className="h-5 w-5 animate-bounce" />
            <span>
              EMERGENCY ALERT: {data.active_emergency.alert_type.toUpperCase()} IN PROGRESS AT{' '}
              {data.active_emergency.location.toUpperCase()}
            </span>
          </div>
          <span className="text-xs font-mono uppercase bg-red-800/80 px-3 py-1 rounded-full border border-red-300">
            Immediate Response Priority
          </span>
        </div>
      )}

      {/* ============================================================
          MAIN QUEUE DISPLAY CONTENT AREA
      ============================================================ */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT / CENTER: NOW SERVING HERO TILES (8 COLS) */}
        <section className="lg:col-span-8 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2E2A] pb-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-lg sm:text-xl font-mono font-bold tracking-wider uppercase text-emerald-400">
                NOW SERVING • PLEASE PROCEED TO CABIN
              </h2>
            </div>
            <span className="text-xs font-mono text-emerald-300/60">
              Active Call List ({data?.now_serving?.length || 0})
            </span>
          </div>

          {loading && !data ? (
            <div className="flex-1 flex items-center justify-center py-24 text-emerald-400 font-mono text-sm">
              <RefreshCw className="h-6 w-6 animate-spin mr-3" />
              Loading live consultation feeds...
            </div>
          ) : !data?.now_serving || data.now_serving.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#1E2E2A] bg-[#121E1B]/50 p-12 text-center">
              <Activity className="h-16 w-16 text-emerald-600/40 mb-4 animate-pulse" />
              <h3 className="text-xl font-serif text-emerald-100">
                All Consultation Cabins Ready
              </h3>
              <p className="text-sm text-emerald-300/60 max-w-md mt-1">
                Next patient tokens will appear here as soon as attending doctors call them from their workstations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.now_serving.map((item) => {
                const isEmergency = item.priority === 'Emergency' || item.token_display.startsWith('EMR');
                return (
                  <div
                    key={item.token_id}
                    className={`rounded-3xl p-6 transition-all border flex flex-col justify-between shadow-2xl relative overflow-hidden ${
                      isEmergency
                        ? 'bg-gradient-to-br from-red-950/80 to-[#1A0A0A] border-red-500/60 shadow-red-950/50'
                        : 'bg-gradient-to-br from-[#142621] to-[#0E1A17] border-emerald-500/40 shadow-emerald-950/50'
                    }`}
                  >
                    {/* Top strip: Department & Room */}
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/10">
                      <div>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase ${
                            isEmergency
                              ? 'bg-red-500/20 text-red-300 border border-red-400/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          }`}
                        >
                          {item.department_name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-emerald-200/60 uppercase block">
                          Assigned Room
                        </span>
                        <span className="text-lg font-mono font-bold text-white tracking-wide">
                          {item.room_or_cabin}
                        </span>
                      </div>
                    </div>

                    {/* Giant Token Number */}
                    <div className="py-5 text-center">
                      <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-300/70 block">
                        CALLING TOKEN
                      </span>
                      <div
                        className={`text-6xl sm:text-7xl font-mono font-extrabold tracking-tight drop-shadow-md my-1 ${
                          isEmergency ? 'text-red-400' : 'text-emerald-300'
                        }`}
                      >
                        {item.token_display}
                      </div>
                      <div className="text-sm font-semibold text-white/90">
                        {item.masked_patient_name}
                      </div>
                    </div>

                    {/* Footer: Doctor and status badge */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-emerald-200/80">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span className="truncate max-w-[160px] font-medium">{item.doctor_name}</span>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase ${
                          item.status === 'Consulting'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 animate-pulse'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* RIGHT: UPCOMING QUEUE & ESTIMATED WAIT TIMES (4 COLS) */}
        <section className="lg:col-span-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2E2A] pb-3">
            <h2 className="text-lg sm:text-xl font-mono font-bold tracking-wider uppercase text-emerald-400">
              NEXT IN LINE • OPD QUEUE
            </h2>
            <span className="text-xs font-mono text-emerald-300/60">
              Waiting ({data?.upcoming_queue?.length || 0})
            </span>
          </div>

          <div className="flex-1 rounded-3xl border border-[#1E2E2A] bg-[#121E1B]/70 p-4 space-y-2.5 overflow-y-auto max-h-[calc(100vh-210px)]">
            {!data?.upcoming_queue || data.upcoming_queue.length === 0 ? (
              <div className="py-12 text-center text-xs text-emerald-300/50 font-mono">
                No patients currently waiting in line.
              </div>
            ) : (
              data.upcoming_queue.map((row) => (
                <div
                  key={row.token_id}
                  className="rounded-2xl p-3.5 bg-[#172B26]/80 hover:bg-[#1A312B] border border-[#213D36] flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-mono font-bold text-emerald-300">
                      {row.token_display}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {row.masked_patient_name}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-300/70">
                        {row.department_name} • {row.room_or_cabin}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 block">
                      ~{row.estimated_wait_mins} min wait
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400/50 mt-1 block">
                      Position #{row.queue_pos}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* ============================================================
          FOOTER TICKER STRIP
      ============================================================ */}
      <footer className="border-t border-[#1E2E2A] bg-[#121E1B] px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-300/60 font-mono gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Patient names are masked per HIPAA &amp; Digital Healthcare Privacy Standards.</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Auto-sync every 5s</span>
          <span>Last sync: {lastRefreshed || 'Just now'}</span>
        </div>
      </footer>
    </div>
  );
}
