'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Phone,
  Stethoscope,
  Building2,
  Filter,
  ArrowRight,
  Printer,
  CalendarCheck,
  CalendarX,
  UserPlus,
  Copy,
  ChevronRight,
  Shield,
  Activity,
  Layers,
  MapPin,
} from 'lucide-react';
import { getStaffSession, type StaffUser } from '@/lib/staff-auth';
import TokenSlipPrintModal, { type GeneratedTokenData } from './TokenSlipPrintModal';

interface AppointmentRecord {
  id: number;
  booking_reference: string;
  appointment_id: string;
  appointment_date: string;
  formatted_date: string;
  time_slot: string;
  visit_type: string;
  status: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  patient_dob?: string | null;
  patient_gender?: string | null;
  reason_for_visit?: string | null;
  insurance_provider?: string | null;
  created_at: string;
  updated_at: string;
  check_in_time?: string | null;
  cancellation_reason?: string | null;
  reschedule_reason?: string | null;
  notes?: string | null;
  visit_id?: string | null;
  // Patient details
  patient_id?: string | null;
  patient_record_id?: string | null;
  patient_mobile?: string | null;
  patient_blood_group?: string | null;
  patient_emergency_contact?: string | null;
  // Doctor details
  doctor_id?: number | null;
  doctor_name?: string | null;
  doctor_specialty?: string | null;
  doctor_slug?: string | null;
  doctor_availability?: string | null;
  room_or_cabin?: string | null;
  // Department details
  department_id?: number | null;
  department_name?: string | null;
  department_slug?: string | null;
  token_prefix?: string | null;
  // Checked-in token & visit details
  visit_status?: string | null;
  token_id?: string | null;
  token_number?: number | null;
  token_display?: string | null;
  token_status?: string | null;
}

interface AppointmentSummary {
  total_today: number;
  confirmed_today: number;
  checked_in_today: number;
  cancelled_today: number;
  upcoming_total: number;
}

interface SlotInfo {
  time_slot: string;
  available: boolean;
  capacity: number;
  booked: number;
}

interface DoctorItem {
  id: number;
  name: string;
  specialty: string;
  department_id: number;
  department_name: string;
  availability_status: string;
}

interface DepartmentItem {
  id: number;
  name: string;
  slug: string;
}

export default function AppointmentManager() {
  const [session, setSession] = useState<StaffUser | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [summary, setSummary] = useState<AppointmentSummary>({
    total_today: 0,
    confirmed_today: 0,
    checked_in_today: 0,
    cancelled_today: 0,
    upcoming_total: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'all' | 'checked_in' | 'cancelled'>('today');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [selectedDocId, setSelectedDocId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Roster lists for dropdowns
  const [doctorsList, setDoctorsList] = useState<DoctorItem[]>([]);
  const [departmentsList, setDepartmentsList] = useState<DepartmentItem[]>([]);

  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState<boolean>(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentRecord | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AppointmentRecord | null>(null);
  const [tokenSlipData, setTokenSlipData] = useState<GeneratedTokenData | null>(null);

  // Book Modal Form state
  const [bookDate, setBookDate] = useState<string>(() => {
    // default to tomorrow
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [bookDeptId, setBookDeptId] = useState<string>('');
  const [bookDocId, setBookDocId] = useState<string>('');
  const [bookTimeSlot, setBookTimeSlot] = useState<string>('');
  const [bookVisitType, setBookVisitType] = useState<string>('OPD Consultation');
  const [bookReason, setBookReason] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // Patient Mode inside Book Modal ('existing' vs 'new')
  const [patientMode, setPatientMode] = useState<'existing' | 'new'>('existing');
  const [patientSearchTerm, setPatientSearchTerm] = useState<string>('');
  const [patientSearchResults, setPatientSearchResults] = useState<any[]>([]);
  const [selectedExistingPatient, setSelectedExistingPatient] = useState<any | null>(null);
  const [searchingPatients, setSearchingPatients] = useState<boolean>(false);

  // New Patient Form fields
  const [newPatientName, setNewPatientName] = useState<string>('');
  const [newPatientMobile, setNewPatientMobile] = useState<string>('');
  const [newPatientGender, setNewPatientGender] = useState<string>('Male');
  const [newPatientDob, setNewPatientDob] = useState<string>('');
  const [newPatientAddress, setNewPatientAddress] = useState<string>('');
  const [newPatientBloodGroup, setNewPatientBloodGroup] = useState<string>('');
  const [newPatientEmergency, setNewPatientEmergency] = useState<string>('');
  const [bookingSubmitting, setBookingSubmitting] = useState<boolean>(false);

  // Reschedule Form state
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleSlot, setRescheduleSlot] = useState<string>('');
  const [rescheduleReasonText, setRescheduleReasonText] = useState<string>('Patient requested schedule change');
  const [rescheduleSlots, setRescheduleSlots] = useState<SlotInfo[]>([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState<boolean>(false);
  const [reschedulingSubmitting, setReschedulingSubmitting] = useState<boolean>(false);

  // Cancel Form state
  const [cancelReasonText, setCancelReasonText] = useState<string>('Patient unable to attend');
  const [cancelSubmitting, setCancelSubmitting] = useState<boolean>(false);

  // Action Loading state (e.g. check-in in progress)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Load Session
  useEffect(() => {
    setSession(getStaffSession());
  }, []);

  // Fetch Doctors and Departments for dropdowns
  const fetchMetadata = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/reception/doctors/availability');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const docs: DoctorItem[] = json.data.map((d: any) => ({
            id: d.id,
            name: d.name,
            specialty: d.specialty,
            department_id: d.department_id,
            department_name: d.department_name,
            availability_status: d.availability_status,
          }));
          setDoctorsList(docs);

          // Unique departments
          const deptMap = new Map<number, DepartmentItem>();
          json.data.forEach((d: any) => {
            if (d.department_id && !deptMap.has(d.department_id)) {
              deptMap.set(d.department_id, {
                id: d.department_id,
                name: d.department_name,
                slug: d.department_slug || '',
              });
            }
          });
          setDepartmentsList(Array.from(deptMap.values()));
        }
      }
    } catch (e) {
      console.error('Failed to load roster metadata:', e);
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // Fetch Appointments List
  const fetchAppointments = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setRefreshing(true);

    try {
      const params = new URLSearchParams();
      if (activeTab === 'today') {
        params.append('filter', 'today');
      } else if (activeTab === 'upcoming') {
        params.append('filter', 'upcoming');
      } else if (activeTab === 'checked_in') {
        params.append('status', 'Checked-In');
      } else if (activeTab === 'cancelled') {
        params.append('status', 'Cancelled');
      } else {
        params.append('date', 'all');
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (selectedDeptId !== 'all') {
        params.append('department_id', selectedDeptId);
      }
      if (selectedDocId !== 'all') {
        params.append('doctor_id', selectedDocId);
      }
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }

      const res = await fetch(`/api/v1/reception/appointments?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load appointments: ${res.statusText}`);
      }

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAppointments(json.data);
        if (json.summary) {
          setSummary(json.summary);
        }
      }
    } catch (err: any) {
      console.error('Fetch appointments error:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to fetch appointments.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, searchQuery, selectedDeptId, selectedDocId, selectedStatus]);

  useEffect(() => {
    fetchAppointments(false);
  }, [fetchAppointments]);

  // Auto-dismiss feedback after 4s
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(t);
  }, [feedback]);

  // Dynamic Slot Loader for Book Modal
  useEffect(() => {
    if (!bookDocId || !bookDate) {
      setAvailableSlots([]);
      return;
    }

    let active = true;
    setLoadingSlots(true);

    fetch(`/api/v1/reception/appointments/slots?doctor_id=${bookDocId}&date=${bookDate}`)
      .then((res) => res.json())
      .then((json) => {
        if (active && json.success && json.data?.slots) {
          setAvailableSlots(json.data.slots);
          // If current selection is booked, reset it
          const currentSlot = json.data.slots.find((s: SlotInfo) => s.time_slot === bookTimeSlot);
          if (currentSlot && !currentSlot.available) {
            setBookTimeSlot('');
          }
        }
      })
      .catch((err) => console.error('Error fetching slots:', err))
      .finally(() => {
        if (active) setLoadingSlots(false);
      });

    return () => {
      active = false;
    };
  }, [bookDocId, bookDate, bookTimeSlot]);

  // Dynamic Slot Loader for Reschedule Modal
  useEffect(() => {
    if (!rescheduleTarget || !rescheduleDate) {
      setRescheduleSlots([]);
      return;
    }

    const docId = rescheduleTarget.doctor_id;
    if (!docId) return;

    let active = true;
    setLoadingRescheduleSlots(true);

    fetch(`/api/v1/reception/appointments/slots?doctor_id=${docId}&date=${rescheduleDate}`)
      .then((res) => res.json())
      .then((json) => {
        if (active && json.success && json.data?.slots) {
          setRescheduleSlots(json.data.slots);
        }
      })
      .catch((err) => console.error('Error fetching reschedule slots:', err))
      .finally(() => {
        if (active) setLoadingRescheduleSlots(false);
      });

    return () => {
      active = false;
    };
  }, [rescheduleTarget, rescheduleDate]);

  // Patient Search Debounce in Book Modal
  useEffect(() => {
    if (patientMode !== 'existing' || !patientSearchTerm.trim()) {
      setPatientSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingPatients(true);
      try {
        const res = await fetch(`/api/v1/reception/patients/search?q=${encodeURIComponent(patientSearchTerm.trim())}`);
        if (res.ok) {
          const json = await res.json();
          if (json.patients) {
            setPatientSearchResults(json.patients);
          }
        }
      } catch (err) {
        console.error('Patient search error:', err);
      } finally {
        setSearchingPatients(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [patientSearchTerm, patientMode]);

  // ACTION: Check In Patient (Converts appointment to Visit & Token, idempotent duplicate prevention)
  const handleCheckIn = async (appt: AppointmentRecord) => {
    setActionLoadingId(appt.booking_reference);
    setFeedback(null);

    try {
      const payload = {
        staff_name: session?.name || 'Reception Staff',
        staff_role: session?.role || 'receptionist',
      };

      const res = await fetch(`/api/v1/reception/appointments/${appt.booking_reference}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Check-in failed');
      }

      if (json.already_checked_in) {
        setFeedback({
          type: 'success',
          message: json.message || 'Patient is already checked in.',
        });
      } else {
        setFeedback({
          type: 'success',
          message: json.message || `Check-in successful! Token: ${json.token?.token_display}`,
        });
      }

      // Build Token Slip Data for immediate printing
      const slipData: GeneratedTokenData = {
        visit: {
          visit_id: json.visit?.visit_id || appt.visit_id || 'VST-ACTIVE',
          visit_date: json.visit?.visit_date || new Date().toISOString().slice(0, 10),
          visit_type: json.visit?.visit_type || appt.visit_type || 'OPD Consultation',
          status: json.visit?.status || 'In-Queue',
        },
        token: {
          token_id: json.token?.token_id || 'TKN-001',
          token_number: json.token?.token_number || 1,
          token_display: json.token?.token_display || 'OPD-001',
          queue_date: json.token?.queue_date || new Date().toISOString().slice(0, 10),
          status: json.token?.status || 'Waiting',
          priority: json.token?.priority || 'Standard',
        },
        patient: {
          patient_id: appt.patient_id || 'PAT-001',
          full_name: appt.patient_name,
          mobile: appt.patient_phone,
          gender: appt.patient_gender || 'Other',
          blood_group: appt.patient_blood_group || undefined,
        },
        department: {
          id: appt.department_id || 1,
          name: appt.department_name || 'General OPD',
          prefix: appt.token_prefix || 'G',
        },
        doctor: {
          id: appt.doctor_id || 1,
          name: appt.doctor_name || 'Staff Doctor',
          cabin: appt.room_or_cabin || `Cabin ${appt.doctor_id || 1}`,
        },
      };

      setTokenSlipData(slipData);
      fetchAppointments(true);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to complete check-in.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // ACTION: Submit Book New Appointment
  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookDate || !bookTimeSlot) {
      setFeedback({ type: 'error', message: 'Please select an appointment date and an available time slot.' });
      return;
    }
    if (!bookDocId) {
      setFeedback({ type: 'error', message: 'Please select a consulting doctor.' });
      return;
    }

    if (patientMode === 'existing' && !selectedExistingPatient) {
      setFeedback({ type: 'error', message: 'Please search and select an existing patient, or switch to New Patient.' });
      return;
    }

    if (patientMode === 'new') {
      if (!newPatientName.trim() || !newPatientMobile.trim()) {
        setFeedback({ type: 'error', message: 'Patient full name and mobile number are required.' });
        return;
      }
    }

    setBookingSubmitting(true);
    setFeedback(null);

    try {
      const payload: any = {
        appointment_date: bookDate,
        time_slot: bookTimeSlot,
        department_id: bookDeptId ? Number(bookDeptId) : undefined,
        doctor_id: Number(bookDocId),
        visit_type: bookVisitType,
        reason_for_visit: bookReason,
        staff_name: session?.name || 'Reception Staff',
        staff_role: session?.role || 'receptionist',
      };

      if (patientMode === 'existing' && selectedExistingPatient) {
        payload.patient_id = selectedExistingPatient.patient_id || selectedExistingPatient.id;
        payload.patient_name = selectedExistingPatient.full_name;
        payload.patient_phone = selectedExistingPatient.mobile || selectedExistingPatient.phone;
        payload.patient_email = selectedExistingPatient.email || '';
        payload.patient_dob = selectedExistingPatient.dob || selectedExistingPatient.date_of_birth || null;
        payload.patient_gender = selectedExistingPatient.gender || 'Other';
      } else {
        payload.new_patient = {
          full_name: newPatientName.trim(),
          mobile: newPatientMobile.trim(),
          gender: newPatientGender,
          dob: newPatientDob || null,
          address: newPatientAddress.trim(),
          blood_group: newPatientBloodGroup || null,
          emergency_contact: newPatientEmergency.trim() || null,
        };
      }

      const res = await fetch('/api/v1/reception/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to book appointment.');
      }

      setFeedback({
        type: 'success',
        message: `Appointment ${json.data?.booking_reference} booked successfully for ${json.data?.patient_name}!`,
      });

      // Reset Form & Close Modal
      setIsBookModalOpen(false);
      setSelectedExistingPatient(null);
      setPatientSearchTerm('');
      setNewPatientName('');
      setNewPatientMobile('');
      setNewPatientAddress('');
      setBookReason('');
      setBookTimeSlot('');

      fetchAppointments(true);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to book appointment.' });
    } finally {
      setBookingSubmitting(false);
    }
  };

  // ACTION: Submit Reschedule Appointment
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget || !rescheduleDate || !rescheduleSlot) {
      setFeedback({ type: 'error', message: 'Please select a new date and time slot.' });
      return;
    }

    setReschedulingSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        new_date: rescheduleDate,
        new_time_slot: rescheduleSlot,
        reason: rescheduleReasonText.trim(),
        staff_name: session?.name || 'Reception Staff',
        staff_role: session?.role || 'receptionist',
      };

      const res = await fetch(`/api/v1/reception/appointments/${rescheduleTarget.booking_reference}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to reschedule appointment.');
      }

      setFeedback({
        type: 'success',
        message: `Appointment ${rescheduleTarget.booking_reference} rescheduled to ${rescheduleDate} at ${rescheduleSlot}.`,
      });

      setRescheduleTarget(null);
      fetchAppointments(true);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to reschedule appointment.' });
    } finally {
      setReschedulingSubmitting(false);
    }
  };

  // ACTION: Submit Cancel Appointment
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget) return;

    setCancelSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        reason: cancelReasonText.trim(),
        staff_name: session?.name || 'Reception Staff',
        staff_role: session?.role || 'receptionist',
      };

      const res = await fetch(`/api/v1/reception/appointments/${cancelTarget.booking_reference}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to cancel appointment.');
      }

      setFeedback({
        type: 'success',
        message: `Appointment ${cancelTarget.booking_reference} has been cancelled.`,
      });

      setCancelTarget(null);
      fetchAppointments(true);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to cancel appointment.' });
    } finally {
      setCancelSubmitting(false);
    }
  };

  // Open Reschedule Modal helper
  const openRescheduleModal = (appt: AppointmentRecord) => {
    setRescheduleTarget(appt);
    setRescheduleDate(appt.formatted_date || appt.appointment_date.slice(0, 10));
    setRescheduleSlot(appt.time_slot);
    setRescheduleReasonText('Patient requested reschedule');
  };

  // Filtered Doctors for Book Modal based on selected Department
  const filteredDoctorsForBook = useMemo(() => {
    if (!bookDeptId) return doctorsList;
    return doctorsList.filter((d) => d.department_id === Number(bookDeptId));
  }, [doctorsList, bookDeptId]);

  return (
    <div className="w-full space-y-6">
      {/* ========================================================
          1. HEADER & KPI METRICS SUMMARY
      ======================================================== */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#F0F2F0]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#174C40]/10 text-[#174C40]">
                <CalendarCheck className="h-4 w-4" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2421]">
                OPD Appointment Management &amp; Check-In Desk
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-[#77817C]">
              Manage future bookings, reschedule consultation slots, process patient arrivals, and issue OPD tokens.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fetchAppointments(false)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E5E8E6] bg-white hover:bg-[#FAFAF7] text-[#1F2421] text-xs font-medium shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[#174C40] ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBookModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            className={`mt-4 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-medium transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6">
          <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6]">
            <span className="text-[11px] font-medium text-[#77817C] uppercase tracking-wider block">Today Total</span>
            <span className="text-xl font-bold text-[#1F2421] mt-1 block">{summary.total_today}</span>
            <span className="text-[10px] text-[#77817C] mt-0.5 block">Scheduled for today</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <span className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider block">Confirmed Today</span>
            <span className="text-xl font-bold text-emerald-900 mt-1 block">{summary.confirmed_today}</span>
            <span className="text-[10px] text-emerald-700 mt-0.5 block">Awaiting arrival</span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
            <span className="text-[11px] font-medium text-blue-800 uppercase tracking-wider block">Checked In</span>
            <span className="text-xl font-bold text-blue-900 mt-1 block">{summary.checked_in_today}</span>
            <span className="text-[10px] text-blue-700 mt-0.5 block">Active in OPD queue</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6]">
            <span className="text-[11px] font-medium text-[#77817C] uppercase tracking-wider block">Upcoming Total</span>
            <span className="text-xl font-bold text-[#1F2421] mt-1 block">{summary.upcoming_total}</span>
            <span className="text-[10px] text-[#77817C] mt-0.5 block">Future dates</span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
            <span className="text-[11px] font-medium text-rose-800 uppercase tracking-wider block">Cancelled Today</span>
            <span className="text-xl font-bold text-rose-900 mt-1 block">{summary.cancelled_today}</span>
            <span className="text-[10px] text-rose-700 mt-0.5 block">Released slots</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. FILTER & SEARCH CONTROL BAR
      ======================================================== */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white p-5 sm:p-6 shadow-xs space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#F0F2F0]">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] text-xs font-semibold">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'today'
                  ? 'bg-white text-[#174C40] shadow-xs border border-[#E5E8E6]'
                  : 'text-[#77817C] hover:text-[#1F2421]'
              }`}
            >
              Today&apos;s Appointments ({summary.total_today})
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'bg-white text-[#174C40] shadow-xs border border-[#E5E8E6]'
                  : 'text-[#77817C] hover:text-[#1F2421]'
              }`}
            >
              Upcoming Future ({summary.upcoming_total})
            </button>

            <button
              onClick={() => setActiveTab('checked_in')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'checked_in'
                  ? 'bg-white text-blue-700 shadow-xs border border-[#E5E8E6]'
                  : 'text-[#77817C] hover:text-[#1F2421]'
              }`}
            >
              Checked In ({summary.checked_in_today})
            </button>

            <button
              onClick={() => setActiveTab('cancelled')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'cancelled'
                  ? 'bg-white text-rose-700 shadow-xs border border-[#E5E8E6]'
                  : 'text-[#77817C] hover:text-[#1F2421]'
              }`}
            >
              Cancelled
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-[#174C40] shadow-xs border border-[#E5E8E6]'
                  : 'text-[#77817C] hover:text-[#1F2421]'
              }`}
            >
              All Records
            </button>
          </div>

          <div className="text-xs text-[#77817C]">
            Showing <span className="font-semibold text-[#1F2421]">{appointments.length}</span> appointments
          </div>
        </div>

        {/* Inputs row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77817C]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Reference (HX-...), Patient Name, Mobile, or Doctor..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E5E8E6] bg-[#FAFAF7] text-xs text-[#1F2421] focus:outline-none focus:border-[#174C40] focus:bg-white transition-colors"
            />
          </div>

          <div>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E5E8E6] bg-[#FAFAF7] text-xs text-[#1F2421] focus:outline-none focus:border-[#174C40] focus:bg-white cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departmentsList.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E5E8E6] bg-[#FAFAF7] text-xs text-[#1F2421] focus:outline-none focus:border-[#174C40] focus:bg-white cursor-pointer"
            >
              <option value="all">All Doctors</option>
              {doctorsList.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.name} ({doc.specialty})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. APPOINTMENTS TABLE LIST
      ======================================================== */}
      <div className="rounded-3xl border border-[#E5E8E6] bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-[#77817C] animate-pulse">
            Loading appointments records...
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <CalendarX className="h-10 w-10 text-[#77817C] mx-auto opacity-40" />
            <h3 className="text-sm font-semibold text-[#1F2421]">No Appointments Found</h3>
            <p className="text-xs text-[#77817C] max-w-sm mx-auto">
              There are no appointments matching the selected filters. Click &quot;Book Appointment&quot; to schedule a new consultation.
            </p>
            <button
              onClick={() => setIsBookModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#174C40] text-white text-xs font-medium cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Book Appointment</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1F2421]">
              <thead className="bg-[#FAFAF7] border-b border-[#E5E8E6] text-[11px] font-semibold text-[#77817C] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Booking Ref</th>
                  <th className="py-3.5 px-4">Date &amp; Slot</th>
                  <th className="py-3.5 px-4">Patient Details</th>
                  <th className="py-3.5 px-4">Assigned Doctor</th>
                  <th className="py-3.5 px-4">Status &amp; Queue</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F0]">
                {appointments.map((appt) => {
                  const isCheckedIn = appt.status === 'Checked-In' || !!appt.visit_id;
                  const isCancelled = appt.status === 'Cancelled';
                  const isCompleted = appt.status === 'Completed';

                  return (
                    <tr key={appt.id} className="hover:bg-[#FAFAF7]/70 transition-colors">
                      {/* 1. Reference */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-[#174C40]">
                            {appt.booking_reference}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#77817C] block mt-0.5">
                          {appt.visit_type || 'OPD Consultation'}
                        </span>
                      </td>

                      {/* 2. Date & Slot */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-[#1F2421]">
                          <Calendar className="h-3.5 w-3.5 text-[#174C40] shrink-0" />
                          <span>{appt.formatted_date || appt.appointment_date.slice(0, 10)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-[#77817C] mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>{appt.time_slot}</span>
                        </div>
                      </td>

                      {/* 3. Patient */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#1F2421]">
                          {appt.patient_name}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#77817C] mt-0.5">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {appt.patient_phone}
                          </span>
                          {appt.patient_id && (
                            <span className="font-mono bg-[#FAFAF7] px-1.5 py-0.5 rounded border border-[#E5E8E6] text-[10px]">
                              {appt.patient_id}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Doctor */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#1F2421]">
                          Dr. {appt.doctor_name || 'Staff Doctor'}
                        </div>
                        <div className="text-[11px] text-[#77817C] flex items-center gap-1.5 mt-0.5">
                          <span>{appt.doctor_specialty || appt.department_name}</span>
                          <span>•</span>
                          <span className="font-mono text-emerald-800">{appt.room_or_cabin}</span>
                        </div>
                      </td>

                      {/* 5. Status & Token */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start gap-1">
                          {appt.status === 'Confirmed' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Confirmed
                            </span>
                          ) : appt.status === 'Checked-In' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
                              <CheckCircle2 className="h-3 w-3 text-blue-600" />
                              Checked In
                            </span>
                          ) : appt.status === 'Rescheduled' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
                              <Clock className="h-3 w-3 text-amber-600" />
                              Rescheduled
                            </span>
                          ) : appt.status === 'Cancelled' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold">
                              <XCircle className="h-3 w-3 text-rose-600" />
                              Cancelled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                              {appt.status}
                            </span>
                          )}

                          {appt.token_display && (
                            <span className="font-mono text-[11px] font-bold text-[#174C40] bg-[#E6EFE9] px-2 py-0.5 rounded-md">
                              Token: {appt.token_display}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Check In Button */}
                          {!isCheckedIn && !isCancelled && !isCompleted && (
                            <button
                              type="button"
                              onClick={() => handleCheckIn(appt)}
                              disabled={actionLoadingId === appt.booking_reference}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                              title="Process Patient Arrival & Generate Token"
                            >
                              {actionLoadingId === appt.booking_reference ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                              <span>Check In</span>
                            </button>
                          )}

                          {/* Print Token Slip (if already checked in) */}
                          {isCheckedIn && (
                            <button
                              type="button"
                              onClick={() => handleCheckIn(appt)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-medium transition-colors cursor-pointer"
                              title="Reprint Token Slip"
                            >
                              <Printer className="h-3 w-3" />
                              <span>Slip</span>
                            </button>
                          )}

                          {/* Reschedule Button */}
                          {!isCancelled && !isCompleted && !isCheckedIn && (
                            <button
                              type="button"
                              onClick={() => openRescheduleModal(appt)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#E5E8E6] bg-white hover:bg-[#FAFAF7] text-[#1F2421] text-xs font-medium transition-colors cursor-pointer"
                              title="Change date or time slot"
                            >
                              <Calendar className="h-3 w-3 text-[#77817C]" />
                              <span>Reschedule</span>
                            </button>
                          )}

                          {/* Cancel Button */}
                          {!isCancelled && !isCompleted && (
                            <button
                              type="button"
                              onClick={() => {
                                setCancelTarget(appt);
                                setCancelReasonText('Patient unable to attend');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs font-medium transition-colors cursor-pointer"
                              title="Cancel this appointment"
                            >
                              <XCircle className="h-3 w-3" />
                              <span>Cancel</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          4. MODAL: BOOK NEW APPOINTMENT
      ======================================================== */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-[#E5E8E6] shadow-xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0F2F0]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#174C40]/10 text-[#174C40]">
                  <CalendarCheck className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-[#1F2421]">Book New Appointment</h2>
                  <p className="text-xs text-[#77817C]">Schedule patient consultation for future dates or today.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBookModalOpen(false)}
                className="p-1.5 rounded-lg text-[#77817C] hover:text-[#1F2421] hover:bg-[#FAFAF7] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="space-y-5">
              {/* Patient Selection Tabs */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-[#1F2421] block">
                  Patient Identification <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setPatientMode('existing')}
                    className={`py-2 rounded-xl transition-all cursor-pointer ${
                      patientMode === 'existing'
                        ? 'bg-white text-[#174C40] shadow-xs border border-[#E5E8E6]'
                        : 'text-[#77817C]'
                    }`}
                  >
                    Existing Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setPatientMode('new')}
                    className={`py-2 rounded-xl transition-all cursor-pointer ${
                      patientMode === 'new'
                        ? 'bg-[#174C40] text-white shadow-xs'
                        : 'text-[#77817C]'
                    }`}
                  >
                    + Register New Patient
                  </button>
                </div>

                {patientMode === 'existing' ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#77817C]" />
                      <input
                        type="text"
                        value={patientSearchTerm}
                        onChange={(e) => setPatientSearchTerm(e.target.value)}
                        placeholder="Search existing patient by ID, Full Name, or Mobile..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E5E8E6] text-xs focus:outline-none focus:border-[#174C40]"
                      />
                    </div>

                    {selectedExistingPatient && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-emerald-900 block">
                            {selectedExistingPatient.full_name}
                          </span>
                          <span className="text-[11px] text-emerald-700">
                            ID: {selectedExistingPatient.patient_id} • Mobile: {selectedExistingPatient.mobile || selectedExistingPatient.phone}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedExistingPatient(null)}
                          className="text-xs text-rose-600 hover:underline cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    )}

                    {patientSearchResults.length > 0 && !selectedExistingPatient && (
                      <div className="max-h-40 overflow-y-auto rounded-xl border border-[#E5E8E6] divide-y divide-[#F0F2F0] bg-white shadow-xs">
                        {patientSearchResults.map((p) => (
                          <div
                            key={p.patient_id || p.id}
                            onClick={() => {
                              setSelectedExistingPatient(p);
                              setPatientSearchResults([]);
                            }}
                            className="p-2.5 hover:bg-[#FAFAF7] cursor-pointer text-xs flex items-center justify-between"
                          >
                            <div>
                              <span className="font-semibold text-[#1F2421]">{p.full_name}</span>
                              <span className="text-[11px] text-[#77817C] block">
                                ID: {p.patient_id || p.id} • Mobile: {p.mobile || p.phone}
                              </span>
                            </div>
                            <span className="text-emerald-700 text-[11px] font-medium">Select</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6]">
                    <div>
                      <label className="text-[11px] font-medium text-[#77817C] block mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newPatientName}
                        onChange={(e) => setNewPatientName(e.target.value)}
                        placeholder="Patient Full Name"
                        className="w-full px-3 py-1.5 rounded-lg border border-[#E5E8E6] bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[#77817C] block mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        value={newPatientMobile}
                        onChange={(e) => setNewPatientMobile(e.target.value)}
                        placeholder="10-digit Mobile"
                        className="w-full px-3 py-1.5 rounded-lg border border-[#E5E8E6] bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[#77817C] block mb-1">Gender</label>
                      <select
                        value={newPatientGender}
                        onChange={(e) => setNewPatientGender(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-[#E5E8E6] bg-white text-xs"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[#77817C] block mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={newPatientDob}
                        onChange={(e) => setNewPatientDob(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-[#E5E8E6] bg-white text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-medium text-[#77817C] block mb-1">Address</label>
                      <input
                        type="text"
                        value={newPatientAddress}
                        onChange={(e) => setNewPatientAddress(e.target.value)}
                        placeholder="Residential Address"
                        className="w-full px-3 py-1.5 rounded-lg border border-[#E5E8E6] bg-white text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Department & Doctor Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#1F2421] block mb-1">Department</label>
                  <select
                    value={bookDeptId}
                    onChange={(e) => {
                      setBookDeptId(e.target.value);
                      setBookDocId('');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E8E6] bg-white text-xs cursor-pointer"
                  >
                    <option value="">All Departments</option>
                    {departmentsList.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#1F2421] block mb-1">
                    Doctor <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={bookDocId}
                    onChange={(e) => setBookDocId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E8E6] bg-white text-xs cursor-pointer"
                  >
                    <option value="">Select Doctor</option>
                    {filteredDoctorsForBook.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        Dr. {doc.name} — {doc.specialty} ({doc.availability_status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Slot Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#1F2421] block mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().slice(0, 10)}
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E8E6] bg-white text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-[#1F2421] block mb-1">
                    Available Time Slot <span className="text-rose-500">*</span>
                  </label>

                  {loadingSlots ? (
                    <div className="text-xs text-[#77817C] font-mono py-2 animate-pulse">
                      Checking doctor slots...
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-xs text-[#77817C] py-2">
                      Please select a doctor and date to view consultation slots.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 rounded-xl border border-[#E5E8E6] bg-[#FAFAF7]">
                      {availableSlots.map((slot) => {
                        const isSelected = bookTimeSlot === slot.time_slot;
                        return (
                          <button
                            key={slot.time_slot}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setBookTimeSlot(slot.time_slot)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-medium transition-all ${
                              !slot.available
                                ? 'bg-slate-100 text-slate-400 line-through cursor-not-allowed'
                                : isSelected
                                ? 'bg-[#174C40] text-white shadow-xs'
                                : 'bg-white border border-[#E5E8E6] text-[#1F2421] hover:border-[#174C40] cursor-pointer'
                            }`}
                          >
                            {slot.time_slot}
                            {!slot.available && ' (Booked)'}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Reason for Visit */}
              <div>
                <label className="text-xs font-semibold text-[#1F2421] block mb-1">Reason for Consultation</label>
                <input
                  type="text"
                  value={bookReason}
                  onChange={(e) => setBookReason(e.target.value)}
                  placeholder="e.g. Chest pain follow-up, routine checkup, diabetes review"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E8E6] bg-white text-xs"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F0F2F0]">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E8E6] text-xs font-medium text-[#1F2421] hover:bg-[#FAFAF7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingSubmitting || !bookTimeSlot}
                  className="px-5 py-2 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {bookingSubmitting ? 'Confirming Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          5. MODAL: RESCHEDULE APPOINTMENT
      ======================================================== */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-[#E5E8E6] shadow-xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F0]">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#174C40]" />
                <h3 className="font-bold text-base text-[#1F2421]">Reschedule Appointment</h3>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                className="text-[#77817C] hover:text-[#1F2421] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] text-xs space-y-1">
              <div>
                <span className="text-[#77817C]">Reference:</span>{' '}
                <span className="font-mono font-bold text-[#174C40]">{rescheduleTarget.booking_reference}</span>
              </div>
              <div>
                <span className="text-[#77817C]">Patient:</span>{' '}
                <span className="font-semibold text-[#1F2421]">{rescheduleTarget.patient_name}</span>
              </div>
              <div>
                <span className="text-[#77817C]">Current Slot:</span>{' '}
                <span className="font-medium text-[#1F2421]">
                  {rescheduleTarget.formatted_date || rescheduleTarget.appointment_date.slice(0, 10)} at {rescheduleTarget.time_slot}
                </span>{' '}
                with Dr. {rescheduleTarget.doctor_name}
              </div>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#1F2421] block mb-1">New Date *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().slice(0, 10)}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E8E6] text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1F2421] block mb-1">Select Available Time Slot *</label>
                {loadingRescheduleSlots ? (
                  <div className="text-xs text-[#77817C] py-2 animate-pulse">Checking doctor availability...</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl border border-[#E5E8E6] bg-[#FAFAF7]">
                    {rescheduleSlots.map((slot) => {
                      const isSelected = rescheduleSlot === slot.time_slot;
                      return (
                        <button
                          key={slot.time_slot}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setRescheduleSlot(slot.time_slot)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-medium transition-all ${
                            !slot.available
                              ? 'bg-slate-100 text-slate-400 line-through cursor-not-allowed'
                              : isSelected
                              ? 'bg-[#174C40] text-white shadow-xs'
                              : 'bg-white border border-[#E5E8E6] text-[#1F2421] hover:border-[#174C40] cursor-pointer'
                          }`}
                        >
                          {slot.time_slot}
                          {!slot.available && ' (Booked)'}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1F2421] block mb-1">Reschedule Reason</label>
                <input
                  type="text"
                  required
                  value={rescheduleReasonText}
                  onChange={(e) => setRescheduleReasonText(e.target.value)}
                  placeholder="e.g. Patient requested morning slot instead"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E8E6] text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0F2F0]">
                <button
                  type="button"
                  onClick={() => setRescheduleTarget(null)}
                  className="px-4 py-2 rounded-xl border border-[#E5E8E6] text-xs font-medium text-[#1F2421] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reschedulingSubmitting || !rescheduleSlot}
                  className="px-5 py-2 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {reschedulingSubmitting ? 'Rescheduling...' : 'Save New Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          6. MODAL: CANCEL APPOINTMENT CONFIRMATION
      ======================================================== */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl border border-[#E5E8E6] shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <XCircle className="h-5 w-5" />
              <h3 className="font-bold text-base text-[#1F2421]">Cancel Appointment</h3>
            </div>

            <p className="text-xs text-[#77817C] leading-relaxed">
              Are you sure you want to cancel appointment{' '}
              <span className="font-mono font-bold text-[#1F2421]">{cancelTarget.booking_reference}</span> for{' '}
              <span className="font-semibold text-[#1F2421]">{cancelTarget.patient_name}</span>?
              This will release the consultation slot and log the cancellation audit event.
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#1F2421] block mb-1">Cancellation Reason *</label>
                <input
                  type="text"
                  required
                  value={cancelReasonText}
                  onChange={(e) => setCancelReasonText(e.target.value)}
                  placeholder="e.g. Patient emergency, duplicate booking, non-attendance"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E8E6] text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0F2F0]">
                <button
                  type="button"
                  onClick={() => setCancelTarget(null)}
                  className="px-4 py-2 rounded-xl border border-[#E5E8E6] text-xs font-medium text-[#1F2421] cursor-pointer"
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  disabled={cancelSubmitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {cancelSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          7. TOKEN SLIP PRINT MODAL (UPON CHECK-IN)
      ======================================================== */}
      {tokenSlipData && (
        <TokenSlipPrintModal
          data={tokenSlipData}
          onClose={() => setTokenSlipData(null)}
        />
      )}
    </div>
  );
}
