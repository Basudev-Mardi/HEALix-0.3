'use client';

import React, { useState, useEffect } from 'react';
import {
  ConciergeBell,
  Stethoscope,
  HeartPulse,
  FlaskConical,
  Receipt,
  Pill,
  Users,
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { STAFF_ROLES } from '@/lib/staff-roles';
import {
  DEMO_STAFF_CREDENTIALS,
  staffLogin,
  type StaffUser,
} from '@/lib/staff-auth';

const ROLE_ICONS = {
  ConciergeBell,
  Stethoscope,
  HeartPulse,
  FlaskConical,
  Receipt,
  Pill,
  Users,
  ShieldCheck,
};

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: string;
  onSuccess?: (staff: StaffUser) => void;
}

export default function StaffLoginModal({
  isOpen,
  onClose,
  initialRole = 'receptionist',
  onSuccess,
}: StaffLoginModalProps) {
  const [selectedRole, setSelectedRole] = useState<string>(initialRole);
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('staff123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (initialRole) {
      setSelectedRole(initialRole);
      const demo = DEMO_STAFF_CREDENTIALS[initialRole];
      if (demo) {
        setIdentifier(demo.email);
        setPassword(demo.password);
      }
    }
  }, [initialRole, isOpen]);

  if (!isOpen) return null;

  const currentRoleConfig =
    STAFF_ROLES.find((r) => r.id === selectedRole) || STAFF_ROLES[0];
  const demoData = DEMO_STAFF_CREDENTIALS[selectedRole];
  const IconComponent = ROLE_ICONS[currentRoleConfig.iconName];

  const handleRoleChange = (roleId: string) => {
    setSelectedRole(roleId);
    setError('');
    const demo = DEMO_STAFF_CREDENTIALS[roleId];
    if (demo) {
      setIdentifier(demo.email);
      setPassword(demo.password);
    }
  };

  const handleFillDemo = () => {
    if (demoData) {
      setIdentifier(demoData.email);
      setPassword(demoData.password);
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

    setLoading(true);
    try {
      const res = await staffLogin({
        role: selectedRole,
        email: identifier.trim(),
        password,
      });

      if (res.ok && res.staff) {
        setSuccessMsg(`Welcome, ${res.staff.name} (${res.staff.roleName})!`);
        setTimeout(() => {
          onSuccess?.(res.staff!);
          onClose();
        }, 600);
      } else {
        setError(res.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch {
      setError('Connection to authentication service failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#242A28]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#E5E8E6] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-login-title"
      >
        {/* Header Strip */}
        <div className="bg-[#174C40] text-white p-6 sm:p-7 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[11px] font-mono text-emerald-200">
              <KeyRound className="h-3 w-3" />
              Role-Based Authentication
            </span>
          </div>

          <h2 id="staff-login-title" className="font-editorial text-2xl sm:text-3xl font-medium text-white">
            Staff Portal Sign In
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 font-light mt-1">
            Select your clinical or administrative role to access your dedicated workspace.
          </p>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* 1. Role Selector Tabs */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-[0.14em] text-[#77817C] mb-2.5">
              Select Your Staff Role:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {STAFF_ROLES.map((role) => {
                const ItemIcon = ROLE_ICONS[role.iconName];
                const isActive = role.id === selectedRole;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleChange(role.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all text-xs ${
                      isActive
                        ? 'bg-[#174C40] text-white border-[#174C40] shadow-xs'
                        : 'bg-[#FAFAF7] border-[#E5E8E6] text-[#242A28] hover:border-[#174C40] hover:text-[#174C40]'
                    }`}
                  >
                    <span
                      className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#E6EFE9] text-[#174C40]'
                      }`}
                    >
                      <ItemIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="font-medium truncate">{role.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role Preview Card */}
          <div className="rounded-2xl bg-[#FAFAF7] border border-[#E5E8E6] p-4 flex items-start gap-3.5">
            <span className="h-10 w-10 rounded-xl bg-[#E6EFE9] text-[#174C40] flex items-center justify-center shrink-0 mt-0.5">
              <IconComponent className="h-5 w-5" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-editorial text-base font-medium text-[#242A28]">
                  {currentRoleConfig.name} Workspace
                </h4>
                <span className="text-[11px] font-mono text-[#174C40] font-semibold bg-[#E6EFE9] px-2 py-0.5 rounded-full border border-[#cbe0d3]">
                  {demoData?.staffId}
                </span>
              </div>
              <p className="text-xs text-[#77817C] mt-0.5">
                {demoData?.department} &bull; {demoData?.shift}
              </p>
            </div>
          </div>

          {/* Quick Demo Autofill Notice */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs">
            <div className="flex items-center gap-2 text-[#174C40]">
              <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Testing this role? Pre-fill credentials automatically.</span>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="px-3 py-1 bg-white border border-[#cbe0d3] text-[#174C40] rounded-lg text-xs font-semibold hover:bg-[#E6EFE9] transition-colors shrink-0 shadow-2xs"
            >
              Fill Credentials
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="staff-identifier"
                className="block text-xs font-mono uppercase tracking-[0.14em] text-[#77817C] mb-1.5"
              >
                Staff Email or Employee ID:
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-[#77817C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="staff-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={`e.g. ${demoData?.email || 'staff@healix.org'}`}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E8E6] bg-white text-xs sm:text-sm text-[#242A28] focus:outline-none focus:border-[#174C40] focus:ring-1 focus:ring-[#174C40]"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="staff-password"
                  className="block text-xs font-mono uppercase tracking-[0.14em] text-[#77817C]"
                >
                  Password:
                </label>
                <span className="text-[11px] font-mono text-[#77817C]">
                  Demo: <code className="bg-[#FAFAF7] px-1 py-0.5 rounded border border-[#E5E8E6]">staff123</code>
                </span>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 text-[#77817C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="staff-password"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77817C] hover:text-[#242A28] p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#E5E8E6] bg-white text-xs font-medium text-[#4A5350] hover:bg-[#FAFAF7] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#174C40] text-white text-xs font-semibold hover:bg-[#123830] transition-colors shadow-xs disabled:opacity-60"
              >
                {loading ? (
                  <span>Verifying Credentials...</span>
                ) : (
                  <>
                    <span>Sign In as {currentRoleConfig.name}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
