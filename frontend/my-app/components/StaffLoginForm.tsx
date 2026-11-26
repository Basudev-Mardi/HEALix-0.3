'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Building2,
  PhoneCall,
  X,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import {
  DEMO_STAFF_CREDENTIALS,
  staffLogin,
  type StaffUser,
} from '@/lib/staff-auth';

// 8 Specific Roles Requested by User
const STAFF_ROLE_OPTIONS = [
  { value: 'receptionist', label: 'Receptionist', staffId: 'REC-4011', email: 'reception@healix.org' },
  { value: 'doctor', label: 'Doctor', staffId: 'DOC-1024', email: 'doctor@healix.org' },
  { value: 'nurse', label: 'Nurse', staffId: 'NUR-3088', email: 'nurse@healix.org' },
  { value: 'lab-staff', label: 'Lab Staff', staffId: 'LAB-5021', email: 'lab@healix.org' },
  { value: 'pharmacist', label: 'Pharmacist', staffId: 'PHM-7014', email: 'pharmacy@healix.org' },
  { value: 'hr-staff', label: 'Admin', staffId: 'HR-8002', email: 'hr@healix.org' },
  { value: 'administrator', label: 'Hospital Administrator', staffId: 'ADM-9001', email: 'admin@healix.org' },
  { value: 'billing-staff', label: 'Billing Staff', staffId: 'BIL-6019', email: 'billing@healix.org' },
];

export default function StaffLoginForm({
  onLoginSuccess,
}: {
  onLoginSuccess?: (staff: StaffUser) => void;
}) {
  const [selectedRole, setSelectedRole] = useState<string>('receptionist');
  const [identifier, setIdentifier] = useState<string>('reception@healix.org');
  const [password, setPassword] = useState<string>('staff123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [forgotModalOpen, setForgotModalOpen] = useState<boolean>(false);

  const currentRoleMeta =
    STAFF_ROLE_OPTIONS.find((r) => r.value === selectedRole) || STAFF_ROLE_OPTIONS[0];

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    setSelectedRole(newRole);
    setError('');

    // Pre-populate with corresponding demo credentials for convenience
    const demo = DEMO_STAFF_CREDENTIALS[newRole];
    if (demo) {
      setIdentifier(demo.email);
      setPassword(demo.password);
    }
  };

  const handleQuickFill = () => {
    const demo = DEMO_STAFF_CREDENTIALS[selectedRole];
    if (demo) {
      setIdentifier(demo.email);
      setPassword(demo.password);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!identifier.trim()) {
      setError('Please provide your staff email or employee ID.');
      return;
    }

    if (!password) {
      setError('Staff password is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await staffLogin({
        role: currentRoleMeta.label,
        email: identifier.trim(),
        password,
      });

      if (res.ok && res.staff) {
        setSuccessMsg(`Welcome, ${res.staff.name}! Authorized for ${res.staff.roleName} dashboard.`);
        setTimeout(() => {
          onLoginSuccess?.(res.staff!);
        }, 500);
      } else {
        setError(res.error || 'Authentication denied. Please verify your credentials and selected role.');
      }
    } catch {
      setError('Connection to authentication service failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      {/* Centered Login Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl border border-[#E5E8E6] shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* HEALIX Card Header */}
        <div className="bg-[#174C40] text-white p-8 sm:p-10 relative text-center">
          {/* HEALIX Logo */}
          <div className="mx-auto mb-4 flex items-center justify-center">
            <span className="h-12 w-12 rounded-2xl border-2 border-emerald-400/40 bg-white/10 backdrop-blur-xs flex items-center justify-center text-white font-mono text-base font-bold tracking-tight shadow-xs">
              Hx
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[11px] font-mono text-emerald-200 mb-2.5">
            <KeyRound className="h-3 w-3" />
            <span>Authorized Clinical &amp; Administrative Personnel</span>
          </div>

          <h1 className="font-editorial text-2xl sm:text-3xl font-medium text-white tracking-tight">
            Hospital Staff Portal
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/80 font-light mt-1.5 max-w-sm mx-auto">
            One login system &bull; Secure role-based dashboards with audited data governance.
          </p>
        </div>

        {/* Login Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Quick Demo Autofill Notice */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#E6EFE9]/70 border border-[#cbe0d3] text-xs">
            <div className="flex items-center gap-2 text-[#174C40]">
              <Sparkles className="h-4 w-4 shrink-0 text-[#174C40]" />
              <span className="font-light">
                Testing <strong className="font-semibold">{currentRoleMeta.label}</strong>? Fill verified credentials.
              </span>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              className="px-3 py-1 bg-white border border-[#cbe0d3] text-[#174C40] rounded-xl text-xs font-semibold hover:bg-[#E6EFE9] transition-colors shrink-0 shadow-2xs cursor-pointer"
            >
              Fill Credentials
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Role Dropdown */}
            <div>
              <label
                htmlFor="staff-role-select"
                className="block text-xs font-mono uppercase tracking-[0.14em] text-[#77817C] mb-1.5"
              >
                Assigned Staff Role
              </label>
              <div className="relative">
                <select
                  id="staff-role-select"
                  value={selectedRole}
                  onChange={handleRoleChange}
                  className="w-full appearance-none px-4 py-2.5 rounded-xl border border-[#E5E8E6] bg-white text-xs sm:text-sm text-[#242A28] focus:outline-none focus:border-[#174C40] focus:ring-1 focus:ring-[#174C40] pr-10 cursor-pointer font-medium"
                >
                  {STAFF_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-[#77817C] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 2. Staff ID or Email Field */}
            <div>
              <label
                htmlFor="staff-identifier-input"
                className="block text-xs font-mono uppercase tracking-[0.14em] text-[#77817C] mb-1.5"
              >
                Staff ID or Email
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-[#77817C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="staff-identifier-input"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={`e.g. ${currentRoleMeta.staffId} or ${currentRoleMeta.email}`}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E8E6] bg-white text-xs sm:text-sm text-[#242A28] focus:outline-none focus:border-[#174C40] focus:ring-1 focus:ring-[#174C40]"
                  required
                />
              </div>
            </div>

            {/* 3. Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="staff-password-input"
                  className="block text-xs font-mono uppercase tracking-[0.14em] text-[#77817C]"
                >
                  Password
                </label>
                <span className="text-[11px] font-mono text-[#77817C]">
                  Demo: <code className="bg-[#FAFAF7] px-1 py-0.5 rounded border border-[#E5E8E6]">staff123</code>
                </span>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 text-[#77817C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="staff-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter staff password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E5E8E6] bg-white text-xs sm:text-sm text-[#242A28] focus:outline-none focus:border-[#174C40] focus:ring-1 focus:ring-[#174C40]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77817C] hover:text-[#242A28] p-1 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[#E5E8E6] text-[#174C40] focus:ring-[#174C40]"
                />
                <span className="text-xs text-[#4A5350]">Remember Me</span>
              </label>

              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-xs text-[#174C40] hover:underline font-medium cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#174C40] text-white text-xs sm:text-sm font-semibold hover:bg-[#123830] transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <span>Verifying Credentials &amp; Role...</span>
                ) : (
                  <>
                    <span>Login to {currentRoleMeta.label} Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Back to Public Portal Link */}
          <div className="pt-4 border-t border-[#E5E8E6] text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#77817C] hover:text-[#174C40] font-medium transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Public Portal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Helpdesk Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#242A28]/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5E8E6] p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-5 right-5 text-[#77817C] hover:text-[#242A28] p-1 rounded-full hover:bg-[#FAFAF7]"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="h-12 w-12 rounded-2xl bg-[#E6EFE9] text-[#174C40] flex items-center justify-center">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <h3 className="font-editorial text-2xl font-medium text-[#242A28]">
                Staff Credential Recovery
              </h3>
              <p className="text-xs text-[#77817C] mt-1.5 leading-relaxed font-light">
                For patient privacy and HIPAA/DPDP institutional compliance, staff password resets must be authorized by hospital IT security.
              </p>
            </div>

            <div className="rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] p-4 space-y-2.5 text-xs text-[#4A5350]">
              <div className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-[#174C40] shrink-0" />
                <span>Internal IT Helpdesk: <strong>Extension 4000</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#174C40] shrink-0" />
                <span>IT Security Office: <strong>Central Administration, 2nd Floor</strong></span>
              </div>
            </div>

            <p className="text-[11px] font-mono text-[#77817C]">
              Demo System Hint: Use password <code className="bg-[#FAFAF7] px-1 py-0.5 rounded border border-[#E5E8E6] text-[#174C40] font-bold">staff123</code> to access any staff account.
            </p>

            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#174C40] text-white text-xs font-semibold hover:bg-[#123830] transition-colors cursor-pointer"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
