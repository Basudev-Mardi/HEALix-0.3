import type { AppointmentRecord } from './types';

const DRAFT_KEY = 'healix_booking_draft';
const CONFIRMED_KEY = 'healix_confirmed_booking';

export interface BookingDraft {
  doctor_slug: string;
  appointment_date: string;
  time_slot: string;
  visit_type: string;
}

export function saveBookingDraft(draft: BookingDraft): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore storage errors
  }
}

export function loadBookingDraft(): BookingDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as BookingDraft) : null;
  } catch {
    return null;
  }
}

export function clearBookingDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

export function saveConfirmedBooking(record: AppointmentRecord): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(CONFIRMED_KEY, JSON.stringify(record));
  } catch {
    // ignore
  }
}

export function loadConfirmedBooking(): AppointmentRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(CONFIRMED_KEY);
    return raw ? (JSON.parse(raw) as AppointmentRecord) : null;
  } catch {
    return null;
  }
}

export function getPublicApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
}
