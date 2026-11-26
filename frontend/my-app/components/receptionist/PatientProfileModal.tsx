'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Calendar,
  Phone,
  MapPin,
  Droplet,
  ShieldAlert,
  HeartHandshake,
  Clock,
  Stethoscope,
  Building2,
  CheckCircle2,
  PlusCircle,
  FileText,
  AlertCircle,
  Activity,
  Edit2,
  Save,
  CreditCard,
  CalendarCheck,
  ShieldCheck,
  Receipt,
  Check,
  AlertTriangle,
  QrCode,
  MessageSquare,
  Send,
} from 'lucide-react';
import { getStaffSession } from '@/lib/staff-auth';
import PatientQRCodeModal from './PatientQRCodeModal';

interface PatientVisit {
  visit_id: string;
  visit_date: string;
  formatted_visit_date?: string;
  visit_type: string;
  status: string;
  created_at: string;
  department_id?: number;
  department_name?: string;
  department_prefix?: string;
  doctor_id?: number;
  doctor_name?: string;
  doctor_specialty?: string;
  room_or_cabin?: string;
  token_id?: string;
  token_number?: number;
  token_display?: string;
  token_status?: string;
  fee_amount?: string | number;
  payment_status?: string;
  payment_method?: string;
}

interface UpcomingAppointment {
  id: number;
  booking_reference: string;
  appointment_date: string;
  formatted_date?: string;
  time_slot: string;
  visit_type: string;
  status: string;
  reason_for_visit?: string;
  doctor_name?: string;
  doctor_specialty?: string;
  room_or_cabin?: string;
  department_name?: string;
}

interface BillItem {
  payment_id: string;
  visit_id: string;
  fee_type: string;
  amount: number | string;
  payment_method: string;
  payment_status: string;
  transaction_reference?: string;
  created_at: string;
  visit_date?: string;
  visit_type?: string;
}

interface BillingSummary {
  totalBilled: number;
  totalPaid: number;
  outstandingBalance: number;
  hasOutstanding: boolean;
}

export interface PatientProfileData {
  id: string;
  patient_id: string;
  patient_number: string;
  full_name: string;
  dob?: string;
  formatted_dob?: string;
  age?: {
    years: number;
    months: number;
    formatted: string;
  } | null;
  gender: string;
  mobile: string;
  address: string;
  blood_group?: string;
  allergies?: string;
  emergency_contact?: string;
  photo?: string;
  registration_date: string;
  totalVisits?: number;
  visits?: PatientVisit[];
  upcomingAppointments?: UpcomingAppointment[];
  totalUpcomingAppointments?: number;
  bills?: BillItem[];
  billingSummary?: BillingSummary;
}

interface PatientProfileModalProps {
  patientId: string;
  onClose: () => void;
  onCreateVisit?: (patient: PatientProfileData) => void;
}

export default function PatientProfileModal({
  patientId,
  onClose,
  onCreateVisit,
}: PatientProfileModalProps) {
  const [patient, setPatient] = useState<PatientProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active sub-tab in profile modal
  const [activeTab, setActiveTab] = useState<'visits' | 'appointments' | 'billing'>('visits');

  // Edit Demographic State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editFullName, setEditFullName] = useState<string>('');
  const [editMobile, setEditMobile] = useState<string>('');
  const [editGender, setEditGender] = useState<string>('Male');
  const [editDob, setEditDob] = useState<string>('');
  const [editAddress, setEditAddress] = useState<string>('');
  const [editBloodGroup, setEditBloodGroup] = useState<string>('');
  const [editAllergies, setEditAllergies] = useState<string>('');
  const [editEmergency, setEditEmergency] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [updateFeedback, setUpdateFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [notificationFeedback, setNotificationFeedback] = useState<{ status: 'sent' | 'unconfigured' | 'error'; message: string } | null>(null);
  const [sendingNotification, setSendingNotification] = useState<boolean>(false);

  const dispatchNotification = async (channel: 'sms' | 'whatsapp') => {
    if (!patient) return;
    setSendingNotification(true);
    setNotificationFeedback(null);
    try {
      const payload = {
        channel,
        patient_id: patient.patient_id,
        mobile: patient.mobile,
        message: `Hello ${patient.full_name}, your Healix medical record (${patient.patient_id}) has been updated. Please check in at OPD reception.`,
      };
      let res: Response;
      try {
        res = await fetch('/api/v1/reception/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        res = await fetch('http://localhost:5000/api/v1/reception/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      const json = await res.json();
      if (res.status === 503 || !json.configured) {
        setNotificationFeedback({
          status: 'unconfigured',
          message: `${channel.toUpperCase()} Gateway Unconfigured: Delivery blocked per policy (no fake simulations).`,
        });
      } else if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      } else {
        setNotificationFeedback({
          status: 'sent',
          message: `${channel.toUpperCase()} successfully dispatched to gateway.`,
        });
      }
    } catch (err: unknown) {
      setNotificationFeedback({
        status: 'error',
        message: err instanceof Error ? err.message : 'Notification dispatch failed',
      });
    } finally {
      setSendingNotification(false);
    }
  };

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      let res = await fetch(`/api/v1/reception/patients/${patientId}`);
      if (!res.ok) {
        res = await fetch(`http://localhost:5000/api/v1/reception/patients/${patientId}`);
      }
      if (!res.ok) {
        throw new Error(`Failed to load patient record (HTTP ${res.status})`);
      }
      const json = await res.json();
      if (json.success && json.patient) {
        setPatient(json.patient);
        // Pre-fill edit fields
        setEditFullName(json.patient.full_name || '');
        setEditMobile(json.patient.mobile || '');
        setEditGender(json.patient.gender || 'Other');
        setEditDob(json.patient.dob ? json.patient.dob.slice(0, 10) : '');
        setEditAddress(json.patient.address || '');
        setEditBloodGroup(json.patient.blood_group || '');
        setEditAllergies(json.patient.allergies || '');
        setEditEmergency(json.patient.emergency_contact || '');
      } else {
        throw new Error(json.error || 'Failed to retrieve patient profile');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [patientId]);

  // Handle Save Demographic Edits
  const handleSaveDemographics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim() || !editMobile.trim()) {
      setUpdateFeedback({ type: 'error', message: 'Full name and mobile number cannot be empty.' });
      return;
    }

    setSavingEdit(true);
    setUpdateFeedback(null);

    try {
      const staff = getStaffSession();
      const payload = {
        full_name: editFullName.trim(),
        mobile: editMobile.trim(),
        gender: editGender,
        dob: editDob || null,
        address: editAddress.trim(),
        blood_group: editBloodGroup.trim() || null,
        allergies: editAllergies.trim() || null,
        emergency_contact: editEmergency.trim() || null,
        staff_name: staff?.name || 'Reception Staff',
        staff_role: staff?.role || 'receptionist',
      };

      const res = await fetch(`/api/v1/reception/patients/${patientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update demographics.');
      }

      setUpdateFeedback({ type: 'success', message: 'Demographic details updated successfully.' });
      setIsEditing(false);
      // Reload profile to reflect changes
      loadProfile();
    } catch (err: any) {
      setUpdateFeedback({ type: 'error', message: err.message || 'Update failed.' });
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl border border-[#E5E8E6] bg-white p-6 sm:p-8 shadow-xl space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#77817C] hover:text-[#1F2421] hover:bg-[#FAFAF7] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="h-8 w-8 border-2 border-[#174C40] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#77817C] font-mono">Loading patient medical profile &amp; records...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-600" />
              <h3 className="font-semibold text-sm">Failed to Load Profile</h3>
            </div>
            <p className="text-xs text-rose-800">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 transition-colors"
            >
              Close
            </button>
          </div>
        ) : patient ? (
          <>
            {/* Header & Identification */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F0F2F0]">
              <div className="flex items-center gap-4">
                {patient.photo ? (
                  <img
                    src={patient.photo}
                    alt={patient.full_name}
                    className="h-16 w-16 rounded-2xl object-cover border border-[#E5E8E6]"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-2xl bg-[#174C40]/10 text-[#174C40] flex items-center justify-center font-serif text-2xl font-bold">
                    {patient.full_name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                      Hospital Patient Record
                    </span>
                    <span className="text-xs font-mono text-[#77817C]">
                      Patient ID: <strong className="text-[#174C40]">{patient.patient_id}</strong>
                    </span>
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-[#1F2421] mt-0.5">
                    {patient.full_name}
                  </h2>
                  <div className="text-xs text-[#77817C] font-mono mt-0.5">
                    MRN: {patient.patient_number} • Registered on{' '}
                    {new Date(patient.registration_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons: QR, Notifications, Edit Demographics & Create Visit */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowQRModal(true)}
                  className="px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-[#174C40] text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Generate & print digital QR identification card"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>QR ID Card</span>
                </button>

                <button
                  type="button"
                  disabled={sendingNotification}
                  onClick={() => dispatchNotification('sms')}
                  className="px-3 py-2 rounded-xl border border-[#E5E8E6] bg-white hover:bg-[#FAFAF7] text-[#1F2421] text-xs font-medium shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Send SMS notification (checked against configured gateway)"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                  <span>SMS</span>
                </button>

                <button
                  type="button"
                  disabled={sendingNotification}
                  onClick={() => dispatchNotification('whatsapp')}
                  className="px-3 py-2 rounded-xl border border-[#E5E8E6] bg-white hover:bg-[#FAFAF7] text-[#1F2421] text-xs font-medium shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Send WhatsApp appointment reminder (checked against configured gateway)"
                >
                  <Send className="h-3.5 w-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setUpdateFeedback(null);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-[#E5E8E6] bg-white hover:bg-[#FAFAF7] text-[#1F2421] text-xs font-medium shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5 text-[#174C40]" />
                  <span>{isEditing ? 'Cancel Edit' : 'Edit Demographics'}</span>
                </button>

                {onCreateVisit && (
                  <button
                    type="button"
                    onClick={() => onCreateVisit(patient)}
                    className="px-4 py-2 rounded-xl bg-[#174C40] hover:bg-[#123B32] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Create Visit</span>
                  </button>
                )}
              </div>
            </div>

            {/* Notification Dispatch Feedback */}
            {notificationFeedback && (
              <div
                className={`p-3 rounded-2xl flex items-center gap-2 text-xs font-medium ${
                  notificationFeedback.status === 'sent'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : notificationFeedback.status === 'unconfigured'
                    ? 'bg-amber-50 text-amber-900 border border-amber-300'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {notificationFeedback.status === 'sent' ? (
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                )}
                <span>{notificationFeedback.message}</span>
              </div>
            )}

            {/* Feedback alert */}
            {updateFeedback && (
              <div
                className={`p-3 rounded-2xl flex items-center gap-2 text-xs font-medium ${
                  updateFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {updateFeedback.type === 'success' ? (
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                )}
                <span>{updateFeedback.message}</span>
              </div>
            )}

            {/* Clinical Privacy Notice */}
            <div className="p-3 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] flex items-center gap-3 text-xs text-[#77817C]">
              <ShieldCheck className="h-4 w-4 text-[#174C40] shrink-0" />
              <span>
                <strong>Privacy Protected:</strong> Receptionists can view and update administrative demographics,
                encounter history, and billing. Clinical diagnoses, physician notes, and prescriptions remain restricted
                to licensed clinical staff.
              </span>
            </div>

            {/* ========================================================
                1. DEMOGRAPHIC DETAILS SECTION (VIEW OR EDIT MODE)
            ======================================================== */}
            {isEditing ? (
              <form onSubmit={handleSaveDemographics} className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] space-y-4 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E8E6]">
                  <h4 className="font-bold text-[#1F2421]">Update Permitted Demographics</h4>
                  <span className="text-[11px] text-[#77817C]">Updates are logged in system audit trail</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#1F2421] block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#E5E8E6] bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#1F2421] block mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={editMobile}
                      onChange={(e) => setEditMobile(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#E5E8E6] bg-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#1F2421] block mb-1">Gender</label>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#E5E8E6] bg-white text-xs"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#1F2421] block mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={editDob}
                      onChange={(e) => setEditDob(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#E5E8E6] bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#1F2421] block mb-1">Blood Group</label>
                    <select
                      value={editBloodGroup}
                      onChange={(e) => setEditBloodGroup(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#E5E8E6] bg-white text-xs font-mono"
                    >
                      <option value="">Unknown</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#1F2421] block mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      value={editEmergency}
                      onChange={(e) => setEditEmergency(e.target.value)}
                      placeholder="Name & Contact Phone"
                      className="w-full px-3 py-1.5 rounded-lg border border-[#E5E8E6] bg-white text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-[#1F2421] block mb-1">Residential Address</label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#E5E8E6] bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#1F2421] block mb-1">Known Allergies</label>
                    <input
                      type="text"
                      value={editAllergies}
                      onChange={(e) => setEditAllergies(e.target.value)}
                      placeholder="e.g. Penicillin, Peanuts"
                      className="w-full px-3 py-1.5 rounded-lg border border-[#E5E8E6] bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E8E6]">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-[#E5E8E6] text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-4 py-1.5 rounded-lg bg-[#174C40] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{savingEdit ? 'Saving...' : 'Save Demographics'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] space-y-1">
                  <span className="text-[10px] font-mono text-[#77817C] uppercase block flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-[#174C40]" /> Age &amp; Gender
                  </span>
                  <span className="font-semibold text-[#1F2421] text-sm block">
                    {patient.age?.formatted || 'Age verified'} • {patient.gender}
                  </span>
                  <span className="text-[11px] text-[#77817C] font-mono block">
                    DOB: {patient.formatted_dob || patient.dob?.slice(0, 10) || 'N/A'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] space-y-1">
                  <span className="text-[10px] font-mono text-[#77817C] uppercase block flex items-center gap-1">
                    <Phone className="h-3 w-3 text-[#174C40]" /> Contact Mobile
                  </span>
                  <span className="font-mono font-semibold text-[#1F2421] text-sm block">
                    {patient.mobile}
                  </span>
                  <span className="text-[11px] text-emerald-700 block">Verified for OPD check-in</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] space-y-1">
                  <span className="text-[10px] font-mono text-[#77817C] uppercase block flex items-center gap-1">
                    <Droplet className="h-3 w-3 text-rose-600" /> Blood Group
                  </span>
                  <span className="font-bold text-rose-700 text-sm block font-mono">
                    {patient.blood_group || 'Unknown'}
                  </span>
                  <span className="text-[11px] text-[#77817C] block">Clinical reference</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] space-y-1 sm:col-span-2">
                  <span className="text-[10px] font-mono text-[#77817C] uppercase block flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[#174C40]" /> Residential Address
                  </span>
                  <span className="font-medium text-[#1F2421] block">
                    {patient.address || 'Address provided at registration desk'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] space-y-1">
                  <span className="text-[10px] font-mono text-[#77817C] uppercase block flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3 text-amber-600" /> Allergies
                  </span>
                  <span className="font-medium text-amber-800 block">
                    {patient.allergies || 'None Reported'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] space-y-1 sm:col-span-3">
                  <span className="text-[10px] font-mono text-[#77817C] uppercase block flex items-center gap-1">
                    <HeartHandshake className="h-3 w-3 text-[#174C40]" /> Emergency Contact
                  </span>
                  <span className="font-semibold text-[#1F2421] block">
                    {patient.emergency_contact || 'No emergency contact on file'}
                  </span>
                </div>
              </div>
            )}

            {/* ========================================================
                2. RECORD TABS: VISITS, UPCOMING, BILLING
            ======================================================== */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E8E6] pb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('visits')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'visits'
                        ? 'bg-[#174C40] text-white shadow-2xs'
                        : 'text-[#77817C] hover:text-[#1F2421] hover:bg-[#FAFAF7]'
                    }`}
                  >
                    <Activity className="h-3.5 w-3.5" />
                    <span>Previous Visits ({patient.visits?.length || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('appointments')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'appointments'
                        ? 'bg-[#174C40] text-white shadow-2xs'
                        : 'text-[#77817C] hover:text-[#1F2421] hover:bg-[#FAFAF7]'
                    }`}
                  >
                    <CalendarCheck className="h-3.5 w-3.5" />
                    <span>Upcoming Appointments ({patient.upcomingAppointments?.length || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('billing')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'billing'
                        ? 'bg-[#174C40] text-white shadow-2xs'
                        : 'text-[#77817C] hover:text-[#1F2421] hover:bg-[#FAFAF7]'
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>
                      Billing &amp; Outstanding (
                      {patient.billingSummary?.outstandingBalance
                        ? `$${patient.billingSummary.outstandingBalance.toFixed(2)}`
                        : 'Cleared'}
                      )
                    </span>
                  </button>
                </div>
              </div>

              {/* TAB 1: PREVIOUS VISITS IN CHRONOLOGICAL ORDER */}
              {activeTab === 'visits' && (
                <div className="space-y-3">
                  {patient.visits && patient.visits.length > 0 ? (
                    <div className="divide-y divide-[#F0F2F0] border border-[#E5E8E6] rounded-2xl overflow-hidden text-xs">
                      {patient.visits.map((v) => (
                        <div
                          key={v.visit_id}
                          className="p-3.5 bg-white hover:bg-[#FAFAF7] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#174C40]">{v.visit_id}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-700">
                                {v.visit_type}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                  v.status === 'Completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : v.status === 'In-Queue'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-sky-100 text-sky-800'
                                }`}
                              >
                                {v.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#4A5350] flex flex-wrap items-center gap-2">
                              <span>
                                Department: <strong>{v.department_name || 'Central OPD'}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                Consulting Doctor: <strong>Dr. {v.doctor_name || 'Staff Clinician'}</strong>
                              </span>
                              {v.room_or_cabin && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-emerald-800">{v.room_or_cabin}</span>
                                </>
                              )}
                              {v.token_display && (
                                <>
                                  <span>•</span>
                                  <span className="text-[#174C40] font-mono font-bold bg-[#E6EFE9] px-1.5 py-0.5 rounded">
                                    Token {v.token_display}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-left sm:text-right text-[11px] text-[#77817C] font-mono">
                            <div className="font-medium text-[#1F2421]">
                              {v.formatted_visit_date ||
                                new Date(v.visit_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                            </div>
                            {v.fee_amount && (
                              <div className="mt-0.5">
                                Fee: ${Number(v.fee_amount).toFixed(2)}{' '}
                                <span
                                  className={
                                    v.payment_status === 'Pending'
                                      ? 'text-rose-600 font-bold'
                                      : 'text-emerald-700'
                                  }
                                >
                                  ({v.payment_status || 'Paid'})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] text-center space-y-2">
                      <Activity className="h-8 w-8 text-[#77817C] mx-auto opacity-40" />
                      <h4 className="font-semibold text-xs text-[#1F2421]">No Previous Visits Recorded</h4>
                      <p className="text-xs text-[#77817C] max-w-sm mx-auto">
                        This patient has not had any prior consultation encounters at Healix Medical Center.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: UPCOMING APPOINTMENTS */}
              {activeTab === 'appointments' && (
                <div className="space-y-3">
                  {patient.upcomingAppointments && patient.upcomingAppointments.length > 0 ? (
                    <div className="divide-y divide-[#F0F2F0] border border-[#E5E8E6] rounded-2xl overflow-hidden text-xs">
                      {patient.upcomingAppointments.map((appt) => (
                        <div
                          key={appt.id}
                          className="p-3.5 bg-white hover:bg-[#FAFAF7] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#174C40]">
                                {appt.booking_reference}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {appt.status}
                              </span>
                              <span className="text-[10px] text-[#77817C]">{appt.visit_type}</span>
                            </div>
                            <div className="text-[11px] text-[#4A5350]">
                              Dr. <strong>{appt.doctor_name}</strong> ({appt.doctor_specialty || appt.department_name})
                              {appt.room_or_cabin && (
                                <span className="ml-2 font-mono text-emerald-800">• {appt.room_or_cabin}</span>
                              )}
                            </div>
                            {appt.reason_for_visit && (
                              <div className="text-[11px] text-[#77817C] italic">
                                Reason: &quot;{appt.reason_for_visit}&quot;
                              </div>
                            )}
                          </div>

                          <div className="text-left sm:text-right font-mono text-[11px]">
                            <div className="font-semibold text-[#1F2421]">
                              {appt.formatted_date || appt.appointment_date.slice(0, 10)}
                            </div>
                            <div className="text-[#174C40] font-bold">{appt.time_slot}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] text-center space-y-2">
                      <CalendarCheck className="h-8 w-8 text-[#77817C] mx-auto opacity-40" />
                      <h4 className="font-semibold text-xs text-[#1F2421]">No Upcoming Appointments</h4>
                      <p className="text-xs text-[#77817C] max-w-sm mx-auto">
                        There are no scheduled future consultations on file for this patient.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: BILLING & OUTSTANDING BALANCES */}
              {activeTab === 'billing' && (
                <div className="space-y-4">
                  {/* Summary Banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6]">
                      <span className="text-[10px] font-mono text-[#77817C] uppercase block">Total Invoiced</span>
                      <span className="text-lg font-bold text-[#1F2421] mt-0.5 block font-mono">
                        ${patient.billingSummary?.totalBilled.toFixed(2) || '0.00'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                      <span className="text-[10px] font-mono text-emerald-800 uppercase block">Settled / Paid</span>
                      <span className="text-lg font-bold text-emerald-900 mt-0.5 block font-mono">
                        ${patient.billingSummary?.totalPaid.toFixed(2) || '0.00'}
                      </span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl border ${
                        patient.billingSummary?.hasOutstanding
                          ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                          : 'bg-[#FAFAF7] border-[#E5E8E6] text-[#77817C]'
                      }`}
                    >
                      <span className="text-[10px] font-mono uppercase block">Outstanding Balance</span>
                      <span
                        className={`text-lg font-bold mt-0.5 block font-mono ${
                          patient.billingSummary?.hasOutstanding ? 'text-rose-700' : 'text-[#1F2421]'
                        }`}
                      >
                        ${patient.billingSummary?.outstandingBalance.toFixed(2) || '0.00'}
                      </span>
                      {patient.billingSummary?.hasOutstanding && (
                        <span className="text-[10px] font-semibold text-rose-700 block mt-0.5">
                          Requires cashier settlement
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Line Items */}
                  {patient.bills && patient.bills.length > 0 ? (
                    <div className="divide-y divide-[#F0F2F0] border border-[#E5E8E6] rounded-2xl overflow-hidden text-xs">
                      {patient.bills.map((bill) => (
                        <div
                          key={bill.payment_id}
                          className="p-3.5 bg-white hover:bg-[#FAFAF7] transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#1F2421]">{bill.fee_type}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                  bill.payment_status === 'Completed' || bill.payment_status === 'Paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {bill.payment_status}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#77817C] font-mono">
                              Visit: {bill.visit_id} • Method: {bill.payment_method}
                              {bill.transaction_reference && ` • Ref: ${bill.transaction_reference}`}
                            </div>
                          </div>

                          <div className="text-right font-mono text-sm font-bold text-[#1F2421]">
                            ${Number(bill.amount).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] text-center space-y-2">
                      <Receipt className="h-8 w-8 text-[#77817C] mx-auto opacity-40" />
                      <h4 className="font-semibold text-xs text-[#1F2421]">No Invoices or Bills Recorded</h4>
                      <p className="text-xs text-[#77817C] max-w-sm mx-auto">
                        There are no billing records or pending fee entries for this patient profile.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : null}

        {/* Universal Patient QR Identifier Modal */}
        {showQRModal && patient && (
          <PatientQRCodeModal
            patient={patient}
            onClose={() => setShowQRModal(false)}
          />
        )}
      </div>
    </div>
  );
}
